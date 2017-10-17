/*global describe, it, beforeEach*/

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import {applyQueryRules, uriTokenizer, ruleTokenizer} from '../src/transformUri'

chai.should();
chai.use(sinonChai);

const expect = chai.expect;

const tokenizeUri = (uri) => uriTokenizer.tokenize(uri);
const tokenizeRule = (rule) => ruleTokenizer.tokenize(rule);

describe('applyQueryRules', () => {

	let uri, rule, result, expected, uriTokens, ruleTokens;

	beforeEach(() => {
		uri = '/foo/bar?def=456&abc=123#test';
		rule = '';
		result = '';
		expected = '';
		uriTokens = uriTokenizer.tokenize(uri);
		ruleTokens = ruleTokenizer.tokenize(rule);
	});

	it('exits', () => {
		expect(applyQueryRules).to.be.a('function');
	});

	it('throws TypeError when no URI tokens given', () => {
		expect(() => applyQueryRules()).to.throw(TypeError);
	});

	it('throws TypeError when no URI rule tokens given', () => {
		expect(() => applyQueryRules(uriTokens)).to.throw(TypeError);
	});

	describe('ignores path and hash parts', () => {
		it('when no rule given', () => {
			ruleTokens = tokenizeRule('');
			expected = tokenizeUri('?abc=123&def=456');
			result = applyQueryRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
		it('when a path only rule is given', () => {
			ruleTokens = tokenizeRule('/foo/bar');
			expected = tokenizeUri('?abc=123&def=456');
			result = applyQueryRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
		it('when a fragment only rule is given', () => {
			ruleTokens = tokenizeRule('#test');
			expected = tokenizeUri('?abc=123&def=456');
			result = applyQueryRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
		it('when a path and query rule are given', () => {
			ruleTokens = tokenizeRule('/foo/bar?*');
			expected = tokenizeUri('?abc=123&def=456');
			result = applyQueryRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
		it('when a path, query and fragment rule are given', () => {
			ruleTokens = tokenizeRule('/foo/bar?*#-');
			expected = tokenizeUri('?abc=123&def=456');
			result = applyQueryRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
	});

	it('returns query part of URI when no rule given', () => {
		ruleTokens = tokenizeRule('');
		expected = tokenizeUri('?abc=123&def=456');
		result = applyQueryRules(uriTokens, ruleTokens);
		expect(result).to.eql(expected);
	});

	it('sorts query params by name', () => {
		uriTokens = tokenizeUri('/foo/bar?abc=123&middle=test&def=456#test');
		ruleTokens = tokenizeRule('?[middle,def,abc]');
		expected = tokenizeUri('?abc=123&def=456&middle=test');
		result = applyQueryRules(uriTokens, ruleTokens);
		expect(result).to.eql(expected);
	});

	it('sorts query params by name and then value', () => {
		uriTokens = tokenizeUri('/foo/bar?abc=333&middle=test&def=456&abc=111#test');
		ruleTokens = tokenizeRule('?[middle,def,abc]');
		expected = tokenizeUri('?abc=111&abc=333&def=456&middle=test');
		result = applyQueryRules(uriTokens, ruleTokens);
		expect(result).to.eql(expected);
	});

	it('? returns query part of URI', () => {
		ruleTokens = tokenizeRule('');
		expected = tokenizeUri('?abc=123&def=456');
		result = applyQueryRules(uriTokens, ruleTokens);
		expect(result).to.eql(expected);
	});

	it('?* returns query part of URI', () => {
		ruleTokens = tokenizeRule('');
		expected = tokenizeUri('?abc=123&def=456');
		result = applyQueryRules(uriTokens, ruleTokens);
		expect(result).to.eql(expected);
	});

	it('?- removes all query params from the URI', () => {
		ruleTokens = tokenizeRule('?-');
		expected = tokenizeUri('');
		result = applyQueryRules(uriTokens, ruleTokens);
		expect(result).to.eql(expected);
	});

	describe('?[param1,param...]', () => {
		it('?[def] include the last named param', () => {
			ruleTokens = tokenizeRule('?[def]');
			expected = tokenizeUri('?def=456');
			result = applyQueryRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
		it('?[abc] include the first named param', () => {
			ruleTokens = tokenizeRule('?[abc]');
			expected = tokenizeUri('?abc=123');
			result = applyQueryRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
		it('?[abc,def] include the first and last named params', () => {
			ruleTokens = tokenizeRule('?[abc,def]');
			expected = tokenizeUri('?abc=123&def=456');
			result = applyQueryRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
		it('?[middle] include a middle param name', () => {
			uriTokens = tokenizeUri('/foo/bar?abc=123&middle=test&def=456#test');
			ruleTokens = tokenizeRule('?[middle]');
			expected = tokenizeUri('?middle=test');
			result = applyQueryRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
	});

});
