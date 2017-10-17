/*global describe, it, beforeEach*/

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import {applyHashRules, uriTokenizer, ruleTokenizer} from '../src/transformUri'

chai.should();
chai.use(sinonChai);

const expect = chai.expect;

const tokenizeUri = (uri) => uriTokenizer.tokenize(uri);
const tokenizeRule = (rule) => ruleTokenizer.tokenize(rule);

describe('applyHashRules', () => {

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
		expect(applyHashRules).to.be.a('function');
	});

	it('throws TypeError when no URI tokens given', () => {
		expect(() => applyHashRules()).to.throw(TypeError);
	});

	it('throws TypeError when no URI rule tokens given', () => {
		expect(() => applyHashRules(uriTokens)).to.throw(TypeError);
	});

	describe('ignores path and query parts', () => {
		it('when no rule given', () => {
			ruleTokens = tokenizeRule('');
			expected = tokenizeUri('#test');
			result = applyHashRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
		it('when hash rule given', () => {
			ruleTokens = tokenizeRule('#*');
			expected = tokenizeUri('#test');
			result = applyHashRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
	});

	describe('#-', () => {
		it('removes the fragment part from URI', () => {
			ruleTokens = tokenizeRule('#-');
			expected = tokenizeUri('');
			result = applyHashRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
	});

});
