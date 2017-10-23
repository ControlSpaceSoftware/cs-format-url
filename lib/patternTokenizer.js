'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.patternTokenizer = exports.tokens = undefined;
exports.reducer = reducer;

var _csTokenizer = require('cs-tokenizer');

var tokens = exports.tokens = {
	get End() {
		return { type: 'end', value: '' };
	},
	get OmitPath() {
		return { type: 'omit-path' };
	},
	PathSegment: function PathSegment(segment) {
		return { type: 'match-path-segment', value: segment };
	},

	get OmitPathSegment() {
		return { type: 'omit-path-segment' };
	},
	get PathSep() {
		return { type: 'path-sep' };
	},
	Param: function Param(param) {
		return { type: 'param', value: param };
	},
	MatchFragment: function MatchFragment(fragment) {
		return { type: 'match-fragment', value: fragment };
	},

	get Glob() {
		return { type: 'glob', value: '*' };
	},
	get ExcludeAllParamsExcept() {
		return { type: 'exclude-all-params-except-following', value: '' };
	},
	get IncludeAllParamsExcept() {
		return { type: 'include-all-params-except-following' };
	},
	get OmitQueryString() {
		return { type: 'omit-query-string' };
	},
	get OmitFragment() {
		return { type: 'omit-fragment' };
	}
};

function reducer(char, state, i, chars) {

	var result = [];

	if (state.skip) {
		state.skip--;
		return false;
	}
	if (state.escapeNext === true) {
		state.escapeNext = false;
		return; // collect in the literal array
	}
	if (!state.isPathDone) {
		switch (char) {
			case '*':
			case '?':
			case '#':
			case '/':
			case 'end':
				if (state.literal.length) {
					result.push(tokens.PathSegment(state.literal.join('')));
					state.literal.length = 0;
				}
		}
	} else if (state.inParamList) {
		switch (char) {
			case ',':
			case ']':
			case 'end':
				if (state.literal.length) {
					result.push(tokens.Param(state.literal.join('')));
					state.literal.length = 0;
				}
		}
	} else if (state.inFragment) {
		if (char === '*' && chars[i - 1] === '#') {
			// #* means ignore the glob
			return false;
		}
		switch (char) {
			case '?':
			case ',':
			case '[':
			case ']':
			case '*':
			case '#':
			case '/':
				return; // collect as a literal char of the fragment part
			case 'end':
				if (state.literal.length) {
					result.push(tokens.MatchFragment(state.literal.join('')));
					state.literal.length = 0;
				}
		}
	}

	switch (char) {
		case '\\':
			state.escapeNext = true;
			return false;
		case '*':
			if (!(chars[i - 1] === '#' || chars[i - 1] === '?')) {
				result.push(tokens.Glob);
				return result;
			}
			return false;
		case '[':
			if (chars[i - 1] !== '?') {
				throw new TypeError('\'[\' must follow \'?\' like ?[param1,param2,...]');
			}
			state.inParamList = true;
			return false;
		case ',':
			if (!state.inParamList) {
				throw new TypeError('\',\' can only appear in a param list like ?[param,param,...]');
			}
			if (result.length) {
				return result;
			}
			return false;
		case ']':
			if (!state.inParamList) {
				throw new TypeError('\']\' must follow \'[\' like ?[param1,param2,...]');
			}
			state.inParamList = false;
			if (result.length) {
				return result;
			}
			return false;
		case '^':
			if (state.inParamList) {
				if (chars[i - 1] !== '[') {
					throw new TypeError('\'^\' must follow \'[\' like ?[^param1,param2,...]');
				}
				return result;
			}
			break;
		case '?':
			state.isPathDone = true;
			if (chars[i + 1] === 'end' || chars[i + 1] === '*') {
				// ignore the ? but check result length below
			} else if (chars[i + 1] === '-') {
				result.push(tokens.OmitQueryString);
			} else if (chars[i + 1] === '[') {
				if (chars[i + 2] === '^') {
					result.push(tokens.IncludeAllParamsExcept);
				} else {
					result.push(tokens.ExcludeAllParamsExcept);
				}
			} else {
				throw new TypeError('expect \'[\' + comma separated list of param names + \']\' like ?[param1,param2] or ?[^param3]');
			}
			return result;
		case '-':
			if (state.inFragment) {
				return;
			}
			if (chars[i - 1] === '#' || chars[i - 1] === '?') {
				// omit-fragment or omit-query-string tokens already output
				return false;
			}
			if (!(typeof chars[i - 1] === 'undefined' || chars[i - 1] === '/' || chars[i - 1] === '?' || chars[i - 1] === '#')) {
				throw new TypeError('\'-\' can only appear at beginning or after a \'/\' or \'?\' or \'#\'. try escaping the like \\\\-');
			}
			if (i === 0 && chars[i + 1] === 'end') {
				return tokens.OmitPath;
			}
			result.push(tokens.OmitPathSegment);
			return result;
		case '/':
			result.push(tokens.PathSep);
			return result;
		case '#':
			state.isPathDone = true;
			if (chars[i + 1] === '-') {
				result.push(tokens.OmitFragment);
				if (chars[i + 2] === 'end') {
					// do not set inFragment state
					return result;
				}
				state.skip = 1;
			}
			state.inFragment = true;
			return result;
		case 'end':
			if (state.inParamList) {
				throw new TypeError('expect \']\' to end a comma separated list of param names like ?[param1]');
			}
			result.push(tokens.End);
			return result;
	}
}

var tokenizer = new _csTokenizer.Tokenizer(reducer);

function tokenizerFunction(text) {

	var tokens = tokenizer.tokenize(text);

	var sortedParams = tokens.filter(function (t) {
		return t.type === 'param';
	}).sort(function (a, b) {
		if (a.value > b.value) {
			return 1;
		}
		if (a.value < b.value) {
			return -1;
		}
		return 0;
	});

	var tokenPos = 0;

	return tokens.map(function (t) {
		if (t.type === 'param') {
			return sortedParams[tokenPos++];
		}
		return t;
	});
}

Object.keys(tokens).forEach(function (key) {
	tokenizerFunction[key] = tokens[key];
});

var patternTokenizer = exports.patternTokenizer = tokenizerFunction;