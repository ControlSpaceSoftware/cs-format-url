/*global describe, it, beforeEach*/

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import {rulePattern, uriTokenizer, ruleTokenizer} from '../src/transformUri'

chai.should();
chai.use(sinonChai);

const expect = chai.expect;

const tokenizeUri = (uri) => uriTokenizer.tokenize(uri);
const tokenizeRule = (rule) => ruleTokenizer.tokenize(rule);

describe('rulePattern(char, state, index, chars)', () => {

	let c, state, i, chars;

	beforeEach(() => {
		i = 0;
		c = '/';
		state = {literal: [], tokens: []};
		chars = '/foo?[bar]#-'.split('');
	});

	it('exits', () => {
		expect(rulePattern).to.be.a('function');
	});

	describe('syntax checking errors', () => {
		describe(`'[' must follow '?'`, () => {
			it(`throws TypeError`, () => {
				i = 0;
				c = '[';
				expect(() => rulePattern(c, state, i, chars)).to.throw(TypeError);
			});
			it(`OK`, () => {
				i = 5;
				expect(() => rulePattern(c, state, i, chars)).not.to.throw(TypeError);
			});
		});
		describe(`',' can only appear in a param list`, () => {
			it(`throws TypeError`, () => {
				i = 0;
				c = ',';
				expect(() => rulePattern(c, state, i, chars)).to.throw(TypeError);
			});
			it(`OK`, () => {
				state.inParamList = true;
				state.paramLiteral = [];
				expect(() => rulePattern(c, state, i, chars)).not.to.throw(TypeError);
			});
		});
		describe(`']' must follow '['`, () => {
			it(`throws TypeError`, () => {
				i = 0;
				c = ',';
				expect(() => rulePattern(c, state, i, chars)).to.throw(TypeError);
			});
			it(`OK`, () => {
				state.inParamList = true;
				state.paramLiteral = [];
				expect(() => rulePattern(c, state, i, chars)).not.to.throw(TypeError);
			});
		});
		describe(`'^' must follow '['`, () => {
			it(`throws TypeError`, () => {
				i = 0;
				c = '^';
				expect(() => rulePattern(c, state, i, chars)).to.throw(TypeError);
			});
			it(`OK`, () => {
				i = 6;
				state.inParamList = true;
				state.paramLiteral = [];
				expect(() => rulePattern(c, state, i, chars)).not.to.throw(TypeError);
			});
		});
		describe(`'-' can only appear at beginning or after a '/' or '?' or '#'`, () => {
			it(`'-' at first is ok`, () => {
				i = 0;
				c = '-';
				expect(() => rulePattern(c, state, i, chars)).not.to.throw(TypeError);
			});
			it(`'-' not first throws error`, () => {
				i = 2;
				c = '-';
				expect(() => rulePattern(c, state, i, chars)).to.throw(TypeError);
			});
			it(`'-' after a '/' ok`, () => {
				i = 1;
				c = '-';
				expect(() => rulePattern(c, state, i, chars)).not.to.throw(TypeError);
			});
			it(`'-' not after a '/' throws error`, () => {
				i = 2;
				c = '-';
				expect(() => rulePattern(c, state, i, chars)).to.throw(TypeError);
			});
			it(`'-' after a '?' ok`, () => {
				i = 5;
				c = '-';
				expect(() => rulePattern(c, state, i, chars)).not.to.throw(TypeError);
			});
			it(`'-' not after a '?' throws error`, () => {
				i = 6;
				c = '-';
				expect(() => rulePattern(c, state, i, chars)).to.throw(TypeError);
			});
			it(`'-' after a '#' ok`, () => {
				i = 11;
				c = '-';
				expect(() => rulePattern(c, state, i, chars)).not.to.throw(TypeError);
			});
			it(`'-' not after a '#' throws error`, () => {
				i = 12;
				c = '-';
				expect(() => rulePattern(c, state, i, chars)).to.throw(TypeError);
			});
		});
	});

	it('throws TypeError when no parameters are given', () => {
		expect(() => rulePattern()).to.throw(TypeError);
	});

});
