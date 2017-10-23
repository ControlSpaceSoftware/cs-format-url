/*global describe, it, beforeEach*/

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import {urlTokenizer} from '../src/urlTokenizer'

chai.should();
chai.use(sinonChai);

const expect = chai.expect;

const END = urlTokenizer.End;
const SCHEME = urlTokenizer.Scheme('scheme');
const SCHEME_SEP = urlTokenizer.SchemeSep;
const AUTHORITY = urlTokenizer.Authority('user:pwd@www.code-work.com');
const PATH_SEP = urlTokenizer.PathSep;
const FOO = urlTokenizer.PathSegment('foo');
const BAR = urlTokenizer.PathSegment('bar');
const FRAGMENT1 = urlTokenizer.Fragment('test-fragment');
const FRAGMENT_SEP = urlTokenizer.FragmentSep;
const QUERY_SEP = urlTokenizer.QueryStringSep;
const PARAM1 = urlTokenizer.Param('param');
const PARAM2 = urlTokenizer.Param('param=');
const PARAM3 = urlTokenizer.Param('param=value');
const PARAM_SEP = urlTokenizer.ParamSep;

const GOOD_PATTERN_TESTS = [
	{
		urlString: "",
		expected: [END]
	},
	{
		urlString: "scheme://",
		expected: [SCHEME, SCHEME_SEP, urlTokenizer.Authority(''), PATH_SEP, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar#",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar#test-fragment",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar?",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar?param",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM1, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar?param=",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM2, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar?param=value",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM3, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar?param=value&",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM3, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar?param=value&param",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM1, PARAM_SEP, PARAM3, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar?param=value&param=",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM2, PARAM_SEP, PARAM3, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar?param=value&param=value",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM3, PARAM_SEP, PARAM3, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar?param=value&param=value#",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM3, PARAM_SEP, PARAM3, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com/foo/bar?param=value&param=value#test-fragment",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM3, PARAM_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "://user:pwd@www.code-work.com/foo/bar?param=value&param=value#test-fragment",
		expected: [urlTokenizer.Scheme(''), SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM3, PARAM_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "//user:pwd@www.code-work.com/foo/bar?param=value&param=value#test-fragment",
		expected: [PATH_SEP, urlTokenizer.PathSegment('user:pwd@www.code-work.com'), PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM3, PARAM_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "/foo/bar?param=value&param=value#test-fragment",
		expected: [PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM3, PARAM_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "?param=value&param=value#test-fragment",
		expected: [QUERY_SEP, PARAM3, PARAM_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "?param=&param=value#test-fragment",
		expected: [QUERY_SEP, PARAM2, PARAM_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "?param&param=value#test-fragment",
		expected: [QUERY_SEP, PARAM1, PARAM_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "?&param=value#test-fragment",
		expected: [QUERY_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "?param=value#test-fragment",
		expected: [QUERY_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "?=value#test-fragment",
		expected: [QUERY_SEP, urlTokenizer.Param('=value'), FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "?#test-fragment",
		expected: [FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "#test-fragment",
		expected: [FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com////foo///bar/?param=value&param=value#test-fragment",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM3, PARAM_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "scheme://user:pwd@www.code-work.com////foo///bar///?param=value&param=value#test-fragment",
		expected: [SCHEME, SCHEME_SEP, AUTHORITY, PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM3, PARAM_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "some random string",
		expected: [{type: 'literal', value: 'some random string'}, END]
	},
	{
		urlString: "scheme:/user:pwd@www.code-work.com////foo///bar///?param=value&param=value#test-fragment",
		expected: [urlTokenizer.PathSegment('scheme:'), PATH_SEP, urlTokenizer.PathSegment('user:pwd@www.code-work.com'), PATH_SEP, FOO, PATH_SEP, BAR, QUERY_SEP, PARAM3, PARAM_SEP, PARAM3, FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "?param=foo/bar#test-fragment",
		expected: [QUERY_SEP, urlTokenizer.Param('param=foo/bar'), FRAGMENT_SEP, FRAGMENT1, END]
	},
	{
		urlString: "#test#fragment",
		expected: [FRAGMENT_SEP, urlTokenizer.Fragment('test#fragment'), END]
	},
];

const SYNTAX_CHECKING_TESTS = [
	{
		urlString: null,
		expected: "expect a string value"
	},
];

const ESCAPING_TESTS = [
	{
		urlString: "scheme://www.who\\?.com",
		expected: [SCHEME, SCHEME_SEP, urlTokenizer.Authority('www.who?.com'), PATH_SEP, END]
	},
];

const testExpectedTokens = (test, i) => {
	describe(`${i} "${test.urlString}"`, () => {
		const label = (p) => {
			// if (p.value) {
			// 	return `'${p.value}'`;
			// }
			return p.type;
		};
		it(`${test.expected.map(label)}`, () => {
			const result = urlTokenizer(test.urlString);
			expect(result).to.eql(test.expected);
		});
	});
};

const testThrowsMessage = (test, i) => {
	describe(`${i} "${test.urlString}"`, () => {
		it(`${test.expected}`, () => {
			const result = () => urlTokenizer(test.urlString);
			expect(result).to.throw(test.expected);
		});
	});
};

describe('urlTokenizer(urlString)', () => {

	describe('urlString', () => {
		GOOD_PATTERN_TESTS.forEach(testExpectedTokens);
	});

	describe('syntax checking', () => {
		SYNTAX_CHECKING_TESTS.forEach(testThrowsMessage);
	});

	describe('escaping', () => {
		ESCAPING_TESTS.forEach(testExpectedTokens);
	});

	it('token values reconstruct URL', () => {
		const urlString = `scheme://user:pwd@www.code-work.com////foo////bar///?param1=value1&param2=value2#test-fragment`;
		const expected = `scheme://user:pwd@www.code-work.com/foo/bar?param1=value1&param2=value2#test-fragment`;
		const tokens = urlTokenizer(urlString);
		expect(tokens.map((t) => t.value).join('')).to.eql(expected);
	});

});
