'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.urlTokenizer = exports.tokens = undefined;
exports.reducer = reducer;

var _csTokenizer = require('cs-tokenizer');

var tokens = exports.tokens = {
	get End() {
		return { type: 'end', value: '' };
	},
	Scheme: function Scheme(scheme) {
		return { type: 'scheme', value: scheme };
	},

	get SchemeSep() {
		return { type: 'scheme-sep', value: '://' };
	},
	Authority: function Authority(auth) {
		return { type: 'authority', value: auth };
	},

	get PathSep() {
		return { type: 'path-sep', value: '/' };
	},
	PathSegment: function PathSegment(segment) {
		return { type: 'path-segment', value: segment };
	},
	Fragment: function Fragment(fragment) {
		return { type: 'fragment', value: fragment };
	},

	get FragmentSep() {
		return { type: 'fragment-sep', value: '#' };
	},
	get QueryStringSep() {
		return { type: 'query-string-sep', value: '?' };
	},
	Param: function Param(param) {
		var temp = param.split('=');
		var paramName = temp[0] || '';
		temp.shift();
		var paramValue = temp.join('');
		return { type: 'query-param', value: param, paramName: paramName, paramValue: paramValue };
	},

	get ParamSep() {
		return { type: 'query-param-sep', value: '&' };
	}
};

function reducer(char, state, i, chars) {

	var result = [];

	if (state.skip) {
		state.skip--;
		return false;
	} else if (state.escapeNext === true) {
		state.escapeNext = false;
		return; // collect in the literal array
	} else if (!(state.hasScheme || state.hasPath || state.inQueryString || state.inFragment)) {
		if (char === ':' && chars[i + 1] === '/' && chars[i + 2] === '/') {
			result.push(tokens.Scheme(state.literal.join('')));
			result.push(tokens.SchemeSep);
			state.literal.length = 0;
			state.hasScheme = true;
			state.inAuthority = true;
			state.skip = 2;
		}
	} else if (state.inAuthority) {
		switch (char) {
			case '/':
			case '?':
			case '#':
			case 'end':
				result.push(tokens.Authority(state.literal.join('')));
				state.literal.length = 0;
				state.inAuthority = false;
				state.hasAuthority = true;
		}
	} else if (state.inFragment) {
		switch (char) {
			case 'end':
				result.push(tokens.Fragment(state.literal.join('')));
				state.literal.length = 0;
		}
	} else if (state.inQueryString) {
		switch (char) {
			case '&':
			case '#':
			case 'end':
				if (state.literal.length) {
					state.hasParam = true;
					result.push(tokens.Param(state.literal.join('')));
					state.literal.length = 0;
				}
		}
	} else {
		switch (char) {
			case '/':
			case '?':
			case '#':
			case 'end':
				if (state.literal.length) {
					result.push(tokens.PathSegment(state.literal.join('')));
					state.literal.length = 0;
				}
		}
	}

	switch (char) {
		case '\\':
			state.escapeNext = true;
			return false;
		case '/':
			if (!(state.inQueryString || state.inFragment)) {
				if (state.hasPath && (chars[i + 1] === '?' || chars[i + 1] === '#' || chars[i + 1] === 'end')) {
					return result.length ? result : false;
				}
				if (chars[i + 1] === '/') {
					return result.length ? result : false;
				}
				state.hasPath = true;
				if (state.literal.length) {
					result.push(tokens.PathSegment(state.literal.join('')));
					state.literal.length = 0;
				}
				result.push(tokens.PathSep);
			}
			break;
		case '?':
			if (!(state.inQueryString || state.inFragment)) {
				if (chars[i + 1] === '#' || chars[i + 1] === 'end') {
					return result;
				}
				state.inQueryString = true;
				result.push(tokens.QueryStringSep);
			}
			break;
		case '&':
			if (state.inQueryString && chars[i + 1] !== 'end') {
				if (!state.hasParam) {
					return result;
				}
				state.hasParam = false;
				result.push(tokens.ParamSep);
			}
			break;
		case '#':
			if (!state.inFragment) {
				if (chars[i + 1] === 'end') {
					return result;
				}
				state.inFragment = true;
				result.push(tokens.FragmentSep);
			}
			break;
		case 'end':
			if (state.hasAuthority && !(state.hasPath || state.inFragment || state.inQueryString)) {
				result.push(tokens.PathSep);
			}
			result.push(tokens.End);
			break;
	}
	return result.length ? result : null;
}

var tokenizer = new _csTokenizer.Tokenizer(reducer);

function tokenizerFunction(text) {

	var tokens = tokenizer.tokenize(text);

	var sortedParams = tokens.filter(function (t) {
		return t.type === 'query-param';
	}).sort(function (a, b) {
		if (a.paramName > b.paramName) {
			return 1;
		}
		if (a.paramName < b.paramName) {
			return -1;
		}
		if (a.paramValue > b.paramValue) {
			return 1;
		}
		if (a.paramValue < b.paramValue) {
			return -1;
		}
		return 0;
	});

	var tokenPos = 0;

	return tokens.map(function (t) {
		if (t.type === 'query-param') {
			return sortedParams[tokenPos++];
		}
		return t;
	});
}

Object.keys(tokens).forEach(function (key) {
	tokenizerFunction[key] = tokens[key];
});

var urlTokenizer = exports.urlTokenizer = tokenizerFunction;