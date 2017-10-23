import {patternTokenizer} from "./patternTokenizer";
import {urlTokenizer} from "./urlTokenizer";
import contains from 'lodash.contains';

function getPatternTokens(pattern) {
	try {
		return patternTokenizer(pattern);
	} catch (error) {
		return patternTokenizer('');
	}
}

function isEnd(t) {
	return t.type === 'end';
}

function isPathToken(token) {
	switch (token.type) {
		case 'path-segment':
		case 'path-sep':
			return true;
	}
	return false;
}

function isPathRule(rule) {
	// path rules
	switch (rule.type) {
		case 'glob':
		case 'omit-path':
		case 'omit-path-segment':
		case 'match-path-segment':
		case 'path-sep':
			return true;
	}
	return false;
}

function isQueryStringRule(rule) {
	// query rules
	switch (rule.type) {
		case 'query-string-sep':
		case 'include-query-param':
		case 'omit-query-string':
		case 'exclude-all-params-except-following':
		case 'include-all-params-except-following':
		case 'param':
			return true;
	}
	return false;
}

function isFragmentRule(rule) {
	// fragment rules
	switch (rule.type) {
		case 'match-fragment':
		case 'omit-fragment':
			return true;
	}
	return false;
}

function initRules(allRules, url) {

	if (allRules[0].type === 'end') {
		return allRules;
	}

	const queryStringRules = allRules.filter(isQueryStringRule);

	const params = queryStringRules.filter((r) => r.type === 'param').map((r) => r.value);

	const paramInclude = queryStringRules.reduce((result, rule) => {
		if (result) {
			return result;
		}
		if (rule.type === 'exclude-all-params-except-following') {
			return (name) => contains(params, name);
		}
		if (rule.type === 'include-all-params-except-following') {
			return (name) => !contains(params, name);
		}
		if (rule.type === 'omit-query-string') {
			return () => false;
		}
	}, false);

	if (!paramInclude) {
		return allRules;
	}

	const query = url.filter((t) => t.type === 'query-param').filter((t) => paramInclude(t.paramName)).map((t) => t.paramName);

	const includeQuery = (token) => contains(query, token.paramName);

	const queryStringSepRule = {type: 'query-string-sep', include: () => query.length > 0};
	const queryParamRule = {type: 'include-query-param', include: includeQuery};

	let insertQueryStringRules = true;

	return allRules.reduce((rules, r) => {

		if (isFragmentRule(r) || isEnd(r)) {
			// insert query rule before end or fragment part
			if (insertQueryStringRules) {
				insertQueryStringRules = false;
				rules.push(queryStringSepRule);
				rules.push(queryParamRule);
			}
		}

		if (isPathRule(r)) {
			rules.push(r);
			// } else if (isQueryStringRule(r)) {
			// handled by the queryStringRule
			// inserted above
		} else if (isFragmentRule(r)) {
			rules.push(r);
		} else if (isEnd(r)) {
			rules.push(r);
		}
		return rules;

	}, []);

}

export function formatUrl(urlString, patternString = '') {

	let ruleIndex = 0;

	const url = urlTokenizer(urlString);

	if (typeof patternString !== 'string') {
		return url.map((t) => t.value).join('');
	}

	if (patternString.length === 0) {
		return url.map((t) => t.value).join('');
	}

	const rules = initRules(getPatternTokens(patternString), url);

	if (rules[0].type === 'end') {
		return url.map((t) => t.value).join('');
	}

	const result = url.reduce((map, token, index) => {

		if (map.error) {
			return map;
		}

		const rule = rules[ruleIndex];
		const nextRule = rules[ruleIndex + 1];
		const nextToken = url[index + 1];
		const state = map.state;

		// console.log(rule, token)

		if (state.includeRemainingURL) {
			map.tokens.push(token);
			return map;
		}

		// set up state
		switch (token.type) {

			case 'end':
				break;

			case 'scheme':
			case 'scheme-sep':
			case 'authority':
				break;

			// path tokens
			case 'path-sep':
			case 'path-segment':
				state.inPath = true;
				break;

			// query string tokens
			case 'query-string-sep':
			case 'query-param':
			case 'query-param-sep':
				state.inPath = false;
				state.inQueryString = true;
				break;

			// fragment tokens
			case 'fragment-sep':
			case 'fragment':
				state.inPath = false;
				state.inQueryString = false;
				state.inFragment = true;
				break;
		}

		if (state.inPath) {

			if (state.ignoreRemainingPath) {
				return map;
			}

			switch (rule.type) {

				case 'end':
					map.tokens.push(token);
					break;

				case 'omit-path':
					ruleIndex++;
					state.ignoreRemainingPath = true;
					break;

				case 'glob':
					map.tokens.push(token);
					if (isEnd(nextRule)) {
						ruleIndex++;
						state.includeRemainingURL = true;
					} else if (isQueryStringRule(nextRule) || isFragmentRule(nextRule)) {
						ruleIndex++;
					} else if (nextRule.type === 'path-sep' && (nextToken.type === 'path-sep' || nextToken.type === 'end')) {
						ruleIndex++;
					}
					break;

				case 'match-path-segment':
					ruleIndex++;
					if (token.value === rule.value) {
						map.tokens.push(token);
					} else {
						map.error = 'expect path segment match';
					}
					break;

				case 'omit-path-segment':
					ruleIndex++;
					if (nextRule.type !== 'path-sep') {
						state.ignoreRemainingPath = true;
					}
					break;

				case 'path-sep':
					if (token.type === 'path-sep') {
						ruleIndex++;
						if (nextRule.type === 'glob' || nextRule.type === 'match-path-segment') {
							map.tokens.push(token);
						} else if (!isPathRule(nextRule)) {
							state.ignoreRemainingPath = true;
						}
					} else {
						map.error = 'expect path segment';
					}
					break;

				default:
					map.tokens.push(token);

			}

			return map;

		}

		if (state.inQueryString) {

			switch (rule.type) {

				case 'end':
					map.tokens.push(token);
					break;

				case 'glob':
					map.tokens.push(token);
					break;

				case 'query-string-sep':
					ruleIndex++;
					if (rule.include()) {
						map.tokens.push(token);
					}
					break;

				case 'include-query-param':
					if (!nextToken.type.startsWith('query-')) {
						ruleIndex++;
					}
					if (rule.include(token)) {
						if (map.tokens[map.tokens.length - 1].type === 'query-param') {
							map.tokens.push(urlTokenizer.ParamSep);
						}
						map.tokens.push(token);
					}
					break;

				default:
					map.tokens.push(token);

			}

			return map;

		}

		if (state.inFragment) {

			switch (rule.type) {

				case 'end':
					map.tokens.push(token);
					break;

				case 'glob':
					map.tokens.push(token);
					break;

				case 'match-fragment':
					if (token.type === 'fragment-sep') {
						if (nextToken.value === rule.value) {
							map.tokens.push(token);
						} else {
							map.error = 'expect fragment match';
						}
					} else {
						ruleIndex++;
						map.tokens.push(token);
					}
					break;

				case 'omit-fragment':
					break;

			}

			return map;

		}

		map.tokens.push(token);

		return map;

	}, {
		state: {inPath: false, inQueryString: false, inFragment: false},
		tokens: []
	});

	if (result.error) {
		return url.map((t) => t.value).join('');
	}

	return result.tokens.map((t) => t.value).join('');

}
