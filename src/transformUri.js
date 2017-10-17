import {Tokenizer} from 'cs-tokenizer'

export function rulePattern(c, state, i, chars) {
	let param;
	const result = [];
	switch (c) {
		case '*':
			return {type: 'glob'};
		case '[':
			if (chars[i - 1] !== '?') {
				throw new TypeError(`'[' must follow '?' like ?[param1,param2,...]`);
			}
			state.inParamList = true;
			state.paramLiteral = [];
			break;
		case ',':
			if (state.inParamList) {
				if (state.paramLiteral.length) {
					param = state.paramLiteral.join('');
					state.paramLiteral.length = 0;
					return {type: 'param', value: param};
				}
			} else {
				throw new TypeError(`',' can only appear in a param list like ?[param,param,...]`);
			}
			break;
		case ']':
			if (state.inParamList) {
				if (state.paramLiteral.length) {
					param = state.paramLiteral.join('');
					state.paramLiteral.length = 0;
					return {type: 'param', value: param};
				}
			} else {
				throw new TypeError(`']' must follow '[' like ?[param1,param2,...]`);
			}
			state.inParamList = false;
			return {type: 'close-param-list'};
			break;
		case '^':
			if (chars[i - 1] !== '[') {
				throw new TypeError(`'^' must follow '[' like ?[^param1,param2,...]`);
			}
			return {type: 'exclude'};
		case '?':
			if (!(state.hasQuery || state.hasHash)) {
				if (state.pathParts) {
					result.push({type: 'path', value: state.pathParts.join('')});
					state.pathParts.length = 0;
				}
			}
			state.hasQuery = true;
			result.push({type: 'query'});
			return result;
		case '-':
			if (!(typeof chars[i - 1] === 'undefined' || chars[i - 1] === '/' || chars[i - 1] === '?' || chars[i - 1] === '#')) {
				throw new TypeError(`'-' can only appear at beginning or after a '/' or '?' or '#'`)
			}
			return {type: 'minus'};
		case '/':
			if (!(state.hasQuery || state.hasHash)) {
				if (state.pathParts) {
					result.push({type: 'path', value: state.pathParts.join('')});
					state.pathParts.length = 0;
				}
				if (!(typeof chars[i + 1] === 'undefined' || chars[i + 1] === '?' || chars[i + 1] === '#')) {
					result.push({type: 'slash'});
				}
			} else {
				result.push({type: 'slash'});
			}
			return result;
		case '#':
			if (!(state.hasQuery || state.hasHash)) {
				if (state.pathParts) {
					result.push({type: 'path', value: state.pathParts.join('')});
					state.pathParts.length = 0;
				}
			}
			state.hasHash = true;
			result.push({type: 'hash'});
			return result;
		case 'end':
			if (!(state.hasQuery || state.hasHash)) {
				if (state.pathParts) {
					result.push({type: 'path', value: state.pathParts.join('')});
					state.pathParts.length = 0;
				}
			}
			result.push({type: 'end'});
			return result;
		default:
			if (state.inParamList) {
				state.paramLiteral.push(c);
			} else {
				if (!(state.hasQuery || state.hasHash)) {
					if (!state.pathParts) {
						state.pathParts = [];
					}
					state.pathParts.push(c);
				}
			}
	}
	return false;
}

export function uriPattern(char, state, i, chars) {
	const result = [];
	switch (char) {
		case ':':
			if (!(state.hasScheme)) {
				if (chars[i + 1] === '/' && chars[i + 2] === '/') {
					state.hasScheme = true;
					state.inAuthority = true;
					state.slashCount = 0;
					state.literal.push(':');
					result.push({type: 'scheme', value: state.literal.join('')});
					state.literal.length = 0;
				}
			}
			break;
		case '/':
			if (!(state.inQuery || state.inHash)) {
				if (state.inAuthority) {
					if (state.slashCount === 2) {
						state.inAuthority = false;
						result.push({type: 'authority', value: state.literal.join('')});
						result.push({type: 'sep', value: '/'});
						state.literal.length = 0;
					}
					state.slashCount++;
				} else {
					if (state.literal.length) {
						result.push({type: 'part', value: state.literal.join('')});
						state.literal.length = 0;
					}
					result.push({type: 'sep', value: '/'});
				}
			}
			break;
		case '?':
			if (!(state.inQuery || state.inHash)) {
				if (state.literal.length) {
					result.push({type: 'part', value: state.literal.join('')});
					state.literal.length = 0;
				}
				if (!state.inAuthority) {
					state.inQuery = true;
					result.push({type: 'query', value: '?'});
				}
			}
			break;
		case '=':
			if (state.inQuery) {
				state.inQueryValue = true;
				result.push({type: 'name', value: state.literal.join('')});
				state.literal.length = 0;
				result.push({type: 'equal', value: '='});
			}
			break;
		case '&':
			if (state.inQuery) {
				if (state.inQueryValue) {
					result.push({type: 'value', value: state.literal.join('')});
				} else {
					result.push({type: 'name', value: state.literal.join('')});
				}
				state.inQueryValue = false;
				state.literal.length = 0;
				result.push({type: 'ampersand', value: '&'});
			}
			break;
		case '#':
			if (!(state.inQuery || state.inHash)) {
				if (state.literal.length) {
					result.push({type: 'part', value: state.literal.join('')});
					state.literal.length = 0;
				}
			}
			if (state.inHash) {

			} else if (state.inQuery) {
				if (state.inQueryValue) {
					result.push({type: 'value', value: state.literal.join('')});
				} else {
					result.push({type: 'name', value: state.literal.join('')});
				}
				state.inQueryValue = false;
				state.literal.length = 0;
				state.inQueryValue = false;
				state.inQuery = false;
			}
			if (!state.inAuthority) {
				state.inHash = true;
				result.push({type: 'hash', value: '#'});
			}
			break;
		case 'end':
			if (state.inHash) {
				result.push({type: 'hashValue', value: state.literal.join('')});
			} else if (state.inQuery) {
				if (state.inQueryValue) {
					result.push({type: 'value', value: state.literal.join('')});
				} else {
					result.push({type: 'name', value: state.literal.join('')});
				}
			} else if (state.inAuthority) {
				result.push({type: 'authority', value: state.literal.join('')});
				result.push({type: 'sep', value: '/'});
			} else if (state.literal.length) {
				// not in query or hash part of url so must be in path part
				result.push({type: 'part', value: state.literal.join('')});
			}
			state.literal.length = 0;
			result.push({type: 'end', value: ''});
			break;
	}
	return result.length ? result : null;
}

export const ruleTokenizer = new Tokenizer(rulePattern);

export const uriTokenizer = new Tokenizer(uriPattern);

export function stopAtQueryOrHash(t) {
	return (t && (t.type === 'query' || t.type === 'hash') || t.type === 'end');
}

export function stopAfterMultiplePathSeparators(t, i, list) {
	if (t) {
		if (t.type === 'sep') {
			const next = list[i + 1];
			if (next && next.type !== 'sep') {
				return true;
			}
		}
	}
}

export function seek(list, stopAtTest, startPosition = 0) {
	let i = startPosition;
	for (; i < list.length; i++) {
		if (stopAtTest(list[i], i, list)) {
			return i;
		}
	}
	return i;
}

export const filterOutHashPart = (accumulator, t) => {
	if (t.type === 'hash') {
		accumulator.collect = true;
		accumulator.tokens.push(t);
	} else if (t.type === 'end') {
		accumulator.collect = false;
		accumulator.tokens.push(t);
	} else if (accumulator.collect) {
		accumulator.tokens.push(t);
	}
	return accumulator;
};

const END = {type: 'end', value: ''};

export function applyHashRules(uriTokens, ruleTokens) {

	if (!(uriTokens && uriTokens instanceof Array)) {
		throw new TypeError('no URI tokens provided');
	}

	if (!(ruleTokens && ruleTokens instanceof Array)) {
		throw new TypeError('no path rule tokens provided');
	}

	uriTokens = uriTokens.reduce(filterOutHashPart, {tokens: []}).tokens;
	ruleTokens = ruleTokens.reduce(filterOutHashPart, {tokens: []}).tokens;

	const hideFragment = ruleTokens.reduce((result, rule) => {
		if (result) {
			return result;
		}
		return rule.type === 'minus';
	}, false);

	if (hideFragment) {
		return [END];
	}

	return uriTokens;

}

export const filterOutQueryPart = (accumulator, t) => {
	if (t.type === 'query') {
		accumulator.collect = true;
		accumulator.tokens.push(t);
	} else if (t.type === 'hash') {
		accumulator.collect = false;
	} else if (t.type === 'end') {
		accumulator.collect = false;
		accumulator.tokens.push(t);
	} else if (accumulator.collect) {
		accumulator.tokens.push(t);
	}
	return accumulator;
};

export function applyQueryRules(uriTokens, ruleTokens) {

	if (!(uriTokens && uriTokens instanceof Array)) {
		throw new TypeError('no URI tokens provided');
	}

	if (!(ruleTokens && ruleTokens instanceof Array)) {
		throw new TypeError('no path rule tokens provided');
	}

	// filter out the non-query tokens to simplify
	// the query handling switch statement below
	uriTokens = uriTokens.reduce(filterOutQueryPart, {inQuery: false, tokens: []}).tokens;
	ruleTokens = ruleTokens.reduce(filterOutQueryPart, {inQuery: false, tokens: []}).tokens;

	const SHOW_ALL = 0;
	const SHOW_NONE = 1;
	const SHOW_LIST = 3;
	const SKIP_LIST = 4;

	const paramRules = ruleTokens.reduce((accumulator, rule, index) => {
		switch (rule.type) {
			case 'query':
				if (ruleTokens[index + 1].type === 'end') {
					accumulator.action = SHOW_ALL;
				}
				break;
			case 'exclude':
				accumulator.action = SKIP_LIST;
				break;
			case 'param':
				accumulator.params.push(rule.value);
				break;
			case 'glob':
				accumulator.action = SHOW_ALL;
				break;
			case 'minus':
				accumulator.action = SHOW_NONE;
				break;
			case 'end':
				if (index === 0) {
					accumulator.action = SHOW_ALL;
				}
				break;
		}
		return accumulator;
	}, {params: [], action: SHOW_LIST});

	if (paramRules.action === SHOW_NONE) {
		return [END];
	}

	const uriParams = uriTokens.reduce((accumulator, part) => {
		const param = {};
		switch (part.type) {
			case 'name':
				accumulator.name = part.value;
				accumulator.tokens.push(part);
				break;
			case 'equal':
				accumulator.tokens.push(part);
				break;
			case 'value':
				accumulator.value = part.value;
				accumulator.tokens.push(part);
				break;
			case 'ampersand':
				param.name = accumulator.name;
				param.value = accumulator.value;
				param.tokens = accumulator.tokens;
				accumulator.tokens = [];
				accumulator.params.push(param);
				accumulator.name = '';
				accumulator.value = '';
				break;
			case 'end':
				param.name = accumulator.name;
				param.value = accumulator.value;
				param.tokens = accumulator.tokens;
				accumulator.tokens = [];
				accumulator.params.push(param);
				accumulator.name = '';
				accumulator.value = '';

				return accumulator.params;

		}
		return accumulator;
	}, {params: [], tokens: [], name: '', value: ''});

	const showList = paramRules.action === SHOW_LIST;
	const showAll = paramRules.action === SHOW_ALL;

	const checkShowParam = (param) => {
		if (showAll) {
			return true;
		}
		const find = !!paramRules.params.find((p) => p === param.name);
		return (find === showList);
	};

	let result = [];

	uriParams.sort((a, b) => {
		if (a.name > b.name) {
			return 1;
		}
		if (a.name < b.name) {
			return -1;
		}
		if (a.value > b.value) {
			return 1;
		}
		if (a.value < b.value) {
			return -1;
		}
		return 0;
	}).forEach((param) => {
		if (checkShowParam(param)) {
			if (result.length) {
				result.push({type: 'ampersand', value: '&'});
			}
			result = result.concat(param.tokens);
		}
	});

	if (result.length) {
		return [{type: 'query', value: '?'}].concat(result, END);
	}

	return [END];

}

export function removeMultiplePathSeparators(uriTokens) {
	const result = [];
	let foundQuery = false, foundHash = false;
	for (let i = 0; i < uriTokens.length; i++) {
		const t = uriTokens[i];
		if (t.type === 'query') {
			foundQuery = true;
		}
		if (t.type === 'hash') {
			foundHash = true;
		}
		if (foundQuery || foundHash) {
			result.push(t);
			continue;
		}
		const tt = uriTokens[i + 1];
		if (!(t.type === 'sep' && (tt.type === 'sep' || tt.type === 'query' || tt.type === 'hash' || tt.type === 'end'))) {
			result.push(t);
		}
	}
	return result;
}

export const filterOutPathPart = (accumulator, t) => {
	if (t.type === 'scheme' || t.type === 'authority') {
		return accumulator;
	} else if (t.type === 'query') {
		accumulator.collect = false;
	} else if (t.type === 'hash') {
		accumulator.collect = false;
	} else if (t.type === 'end') {
		accumulator.tokens.push(t);
	} else if (accumulator.collect) {
		accumulator.tokens.push(t);
	}
	return accumulator;
};

export function applyPathRules(uriTokens, ruleTokens) {

	if (!(uriTokens && uriTokens instanceof Array)) {
		throw new TypeError('no URI tokens provided');
	}

	if (!(ruleTokens && ruleTokens instanceof Array)) {
		throw new TypeError('no path rule tokens provided');
	}

	uriTokens = uriTokens.reduce(filterOutPathPart, {collect: true, tokens: []}).tokens;
	ruleTokens = ruleTokens.reduce(filterOutPathPart, {collect: true, tokens: []}).tokens;

	// normalize the path part of the URI
	uriTokens = removeMultiplePathSeparators(uriTokens);

	if (ruleTokens.length === 0 || ruleTokens[0].type === 'end') {
		return uriTokens;
	}

	let result = [];
	let uriIndex = 0;
	let ruleIndex = 0;

	for (; ruleIndex < ruleTokens.length; ruleIndex++, uriIndex++) {
		const rule = ruleTokens[ruleIndex];
		const part = uriTokens[uriIndex];
		let seekIndex = uriIndex;
		switch (rule.type) {
			case 'slash':
				if (part.type !== 'sep') {
					throw new URIError('path does not match pattern');
				}
				if (!(uriTokens[uriIndex].type === 'end' || ruleTokens[ruleIndex + 1].type === 'end')) {
					result.push(part);
				}
				break;
			case 'path':
				if (rule.value !== part.value) {
					throw new URIError('path does not match pattern');
				}
				result.push(part);
				break;
			case 'glob':
				if (ruleTokens[ruleIndex + 1].type === 'end') {
					if (part.type === 'end') {
						throw new URIError(`missing required path part`);
					}
					seekIndex = seek(uriTokens, (d) => d.type === 'end', uriIndex);
					result = result.concat(uriTokens.slice(uriIndex, seekIndex));
					uriIndex = seekIndex - 1;
				} else if (part.type === 'part') {
					result.push(part);
				} else if (part.type === 'end') {
					throw new URIError(`missing required path part`);
				}
				break;
			case 'minus':
				// do not push this part onto the result uri
				if (uriTokens[uriIndex + 1].type === 'sep' && ruleTokens[ruleIndex + 1].type === 'slash') {
					uriIndex++;
					ruleIndex++;
				}
				break;
			case 'query':
				ruleIndex = ruleTokens.length - 2;
				seekIndex = seek(uriTokens, stopAtQueryOrHash, uriIndex);
				result = result.concat(uriTokens.slice(uriIndex, seekIndex));
				uriIndex = seekIndex;
				break;
			case 'hash':
				ruleIndex = ruleTokens.length - 2;
				seekIndex = seek(uriTokens, stopAtQueryOrHash, uriIndex);
				result = result.concat(uriTokens.slice(uriIndex, seekIndex));
				uriIndex = seekIndex;
				break;
			case 'end':
				result = result.concat(uriTokens.slice(seek(uriTokens, (d) => d.type === 'end', uriIndex)));
				break;
		}
	}

	return result;
}

/**
 * https://en.wikipedia.org/wiki/URL
 * scheme:[//[user[:password]@]host[:port]][/path][?query][#fragment]
 *
 * Use a pattern rule to transform a URL into a URI.
 *
 * Pattern Rule Language
 *
 * / := path separator
 * * := include part or glob
 * - := ignore part or skip
 * ? := start query rule
 * [ ... ] := comma separated list of query names to include
 * [^ ... ] := comma separated list of query names to exclude
 * # := start fragment rule
 *
 *
 * @param uri
 * @param rule
 * @returns {*}
 */
export function transformUri(uri, rule) {

	if (!(rule && typeof rule === 'string')) {
		rule = '';
	}

	try {

		const uriTokens = uriTokenizer.tokenize(uri);
		let ruleTokens = ruleTokenizer.tokenize(rule);

		let path;

		try {
			path = applyPathRules(uriTokens, ruleTokens);
		} catch (error) {
			if (error instanceof URIError) {
				ruleTokens = ruleTokenizer.tokenize('');
				path = applyPathRules(uriTokens, ruleTokens);
			}
		}

		const query = applyQueryRules(uriTokens, ruleTokens);
		const hash = applyHashRules(uriTokens, ruleTokens);

		const authority = uriTokens.reduce((auth, t) => {
			if (t.type === 'scheme') {
				auth.push(t);
			} else if (t.type === 'authority') {
				auth.push(t);
			}
			return auth;
		}, []);

		return authority.concat(path).concat(query).concat(hash).map((d) => d.value).join('');

	} catch (ignore) {
		console.error(ignore);
		return uri;
	}

}
