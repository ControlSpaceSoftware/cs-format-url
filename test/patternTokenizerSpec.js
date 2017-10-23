/*global describe, it, beforeEach*/

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import {patternTokenizer} from '../src/index'

chai.should();
chai.use(sinonChai);

const expect = chai.expect;

const END = patternTokenizer.End;
const SLASH = patternTokenizer.PathSep;
const FOO_SEGMENT = patternTokenizer.PathSegment('foo');
const BAR_SEGMENT = patternTokenizer.PathSegment('bar');
const FOO_DASH_BAR_SEGMENT = patternTokenizer.PathSegment('foo-bar');
const SEGMENT1 = patternTokenizer.PathSegment('\\');
const SEGMENT2 = patternTokenizer.PathSegment('[path]');
const PARAM1 = patternTokenizer.Param('param1');
const PARAM_LIST1 = patternTokenizer.Param('list[1]');
const PARAM2 = patternTokenizer.Param('param2');
const PARAM3 = patternTokenizer.Param('param3');
const FRAGMENT1 = patternTokenizer.MatchFragment('test-fragment');
const FRAGMENT2 = patternTokenizer.MatchFragment('frag-*?&#/');
const GLOB = patternTokenizer.Glob;
const MINUS = patternTokenizer.OmitPathSegment;
const QUERY = patternTokenizer.ExcludeAllParamsExcept;
const EXCLUDE = patternTokenizer.IncludeAllParamsExcept;
const OMIT_FRAGMENT = patternTokenizer.OmitFragment;
const OMIT_QUERY_STRING = patternTokenizer.OmitQueryString;
const OMIT_PATH = patternTokenizer.OmitPath;

const GOOD_PATTERN_TESTS = [
	{
		pattern: "",
		expected: [END]
	},
	{
		pattern: "*",
		expected: [GLOB, END]
	},
	{
		pattern: "-",
		expected: [OMIT_PATH, END]
	},
	{
		pattern: "/",
		expected: [SLASH, END]
	},
	{
		pattern: "/*",
		expected: [SLASH, GLOB, END]
	},
	{
		pattern: "/*/",
		expected: [SLASH, GLOB, SLASH, END]
	},
	{
		pattern: "/*/-",
		expected: [SLASH, GLOB, SLASH, MINUS, END]
	},
	{
		pattern: "/-/-",
		expected: [SLASH, MINUS, SLASH, MINUS, END]
	},
	{
		pattern: "/-/*",
		expected: [SLASH, MINUS, SLASH, GLOB, END]
	},
	{
		pattern: "/-/*/",
		expected: [SLASH, MINUS, SLASH, GLOB, SLASH, END]
	},
	{
		pattern: "/foo/*",
		expected: [SLASH, FOO_SEGMENT, SLASH, GLOB, END]
	},
	{
		pattern: "/-/bar",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, END]
	},
	{
		pattern: "/foo/*/",
		expected: [SLASH, FOO_SEGMENT, SLASH, GLOB, SLASH, END]
	},
	{
		pattern: "/-/bar/",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, SLASH, END]
	},
	{
		pattern: "/-/bar?",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, END]
	},
	{
		pattern: "/-/bar?-",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, OMIT_QUERY_STRING, END]
	},
	{
		pattern: "/-/bar?*",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, END]
	},
	{
		pattern: "/-/bar?[param1]",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, QUERY, PARAM1, END]
	},
	{
		pattern: "/-/bar?[param1,]",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, QUERY, PARAM1, END]
	},
	{
		pattern: "/-/bar?[param1,param2]",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, QUERY, PARAM1, PARAM2, END]
	},
	{
		pattern: "/-/bar?[param1,,param2]",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, QUERY, PARAM1, PARAM2, END]
	},
	{
		pattern: "/-/bar?[param1,param2,param3]",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, QUERY, PARAM1, PARAM2, PARAM3, END]
	},
	{
		pattern: "/-/bar?[^param1]",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, EXCLUDE, PARAM1, END]
	},
	{
		pattern: "/-/bar?[^param1,param2]",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, EXCLUDE, PARAM1, PARAM2, END]
	},
	{
		pattern: "/-/bar?[^param1,param2,param3]",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, EXCLUDE, PARAM1, PARAM2, PARAM3, END]
	},
	{
		pattern: "/-/bar?[param1,param2,param3]#",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, QUERY, PARAM1, PARAM2, PARAM3, END]
	},
	{
		pattern: "/-/bar?[param1,param2,param3]#-",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, QUERY, PARAM1, PARAM2, PARAM3, OMIT_FRAGMENT, END]
	},
	{
		pattern: "/-/bar?[param1,param2,param3]#*",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, QUERY, PARAM1, PARAM2, PARAM3, END]
	},
	{
		pattern: "/-/bar?[param1,param2,param3]#test-fragment",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, QUERY, PARAM1, PARAM2, PARAM3, FRAGMENT1, END]
	},
	{
		pattern: "/-/bar?[param1,param2,param3]#frag-*?&#/",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, QUERY, PARAM1, PARAM2, PARAM3, FRAGMENT2, END]
	},
	{
		pattern: "/^",
		expected: [SLASH, patternTokenizer.PathSegment('^'), END]
	},
	{
		pattern: "/\\\\",
		expected: [SLASH, SEGMENT1, END]
	},
	{
		pattern: "/\\[path\\]",
		expected: [SLASH, SEGMENT2, END]
	},
	{
		pattern: "/-/bar?[list\\[1\\],param2,param3]#frag-*?&#/",
		expected: [SLASH, MINUS, SLASH, BAR_SEGMENT, QUERY, PARAM_LIST1, PARAM2, PARAM3, FRAGMENT2, END]
	},
	{
		pattern: "/foo\\-bar?[list\\[1\\],param2,param3]#frag-*?&#/",
		expected: [SLASH, FOO_DASH_BAR_SEGMENT, QUERY, PARAM_LIST1, PARAM2, PARAM3, FRAGMENT2, END]
	},
	{
		pattern: "/#foo?bar",
		expected: [SLASH, patternTokenizer.MatchFragment('foo?bar'), END]
	},
	{
		pattern: "/#foo//bar",
		expected: [SLASH, patternTokenizer.MatchFragment('foo//bar'), END]
	},
	{
		pattern: "/#foo#-bar",
		expected: [SLASH, patternTokenizer.MatchFragment('foo#-bar'), END]
	},
	{
		pattern: "?[c,z,a,z]",
		expected: [QUERY, patternTokenizer.Param('a'), patternTokenizer.Param('c'), patternTokenizer.Param('z'), patternTokenizer.Param('z'), END]
	},
	{
		pattern: "#-foo",
		expected: [OMIT_FRAGMENT, patternTokenizer.MatchFragment('foo'), END]
	},
];

const SYNTAX_CHECKING_TESTS = [
	{
		pattern: null,
		expected: "expect a string value"
	},
	{
		pattern: "[",
		expected: "'[' must follow '?'"
	},
	{
		pattern: ",",
		expected: "',' can only appear in a param list"
	},
	{
		pattern: "]",
		expected: "']' must follow '['"
	},
	{
		pattern: "?[foo^",
		expected: "'^' must follow '['"
	},
	{
		pattern: "/foo-bar",
		expected: "'-' can only appear at beginning or after a '/' or '?' or '#'"
	},
	{
		pattern: "/foo?bar",
		expected: "expect '[' + comma separated list of param names + ']'"
	},
	{
		pattern: "?[foo",
		expected: "expect ']' to end a comma separated list of param names"
	},
	{
		pattern: "?[foo][bar]",
		expected: "'[' must follow '?'"
	},
];

const ESCAPING_TESTS = [
	{
		pattern: "/foo\\-bar",
		expected: [SLASH, FOO_DASH_BAR_SEGMENT, END]
	},
	{
		pattern: "/foo\\-bar?[\\-foo\\[0\\]]",
		expected: [SLASH, FOO_DASH_BAR_SEGMENT, QUERY, patternTokenizer.Param('-foo[0]'), END]
	},
	{
		pattern: "/foo\\-bar?[\\-foo]#\\-bar",
		expected: [SLASH, FOO_DASH_BAR_SEGMENT, QUERY, patternTokenizer.Param('-foo'), patternTokenizer.MatchFragment('-bar'), END]
	},
	{
		pattern: "/foo\\-\\?\\#\\*\\,bar",
		expected: [SLASH, patternTokenizer.PathSegment('foo-?#*,bar'), END]
	},
	{
		pattern: "/foo\\-bar?[\\-\\?\\#\\*\\,foo]",
		expected: [SLASH, FOO_DASH_BAR_SEGMENT, QUERY, patternTokenizer.Param('-?#*,foo'), END]
	},
	{
		pattern: "/foo\\-bar?[\\-foo]#\\-\\?\\#\\*\\,bar",
		expected: [SLASH, FOO_DASH_BAR_SEGMENT, QUERY, patternTokenizer.Param('-foo'), patternTokenizer.MatchFragment('-?#*,bar'), END]
	},
];

const testExpectedTokens = (test) => {
	describe(`"${test.pattern}"`, () => {
		const label = (p) => {
			if (p.value) {
				return `'${p.value}'`;
			}
			return p.type;
		};
		it(`${test.expected.map(label)}`, () => {
			const result = patternTokenizer(test.pattern);
			expect(result).to.eql(test.expected);
		});
	});
};

const testThrowsMessage = (test) => {
	describe(`"${test.pattern}"`, () => {
		it(`${test.expected}`, () => {
			const result = () => patternTokenizer(test.pattern);
			expect(result).to.throw(test.expected);
		});
	});
};

describe('patternTokenizer(pattern)', () => {

	describe('pattern', () => {
		GOOD_PATTERN_TESTS.forEach(testExpectedTokens);
	});

	describe('syntax checking', () => {
		SYNTAX_CHECKING_TESTS.forEach(testThrowsMessage);
	});

	describe('escaping', () => {
		ESCAPING_TESTS.forEach(testExpectedTokens);
	});

});
