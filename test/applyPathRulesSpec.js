/*global describe, it, beforeEach*/

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import {applyPathRules, uriTokenizer, ruleTokenizer} from '../src/transformUri'

chai.should();
chai.use(sinonChai);

const expect = chai.expect;

describe('applyPathRules', () => {

	let uri, rule, result, uriTokens, ruleTokens;

	beforeEach(() => {
		uri = '/foo/bar/is/a/thing';
		rule = '';
		result = '';
		uriTokens = uriTokenizer.tokenize(uri);
		ruleTokens = ruleTokenizer.tokenize(rule);
	});

	it('exits', () => {
		expect(applyPathRules).to.be.a('function');
	});

	it('throws TypeError when no URI is given', () => {
		expect(() => applyPathRules()).to.throw(TypeError);
	});

	it('throws TypeError when no rule is given', () => {
		expect(() => applyPathRules(uriTokens)).to.throw(TypeError);
	});

	describe('glob (*)', () => {
		beforeEach(() => {
			rule = '*';
			ruleTokens = ruleTokenizer.tokenize(rule);
		});
		it('returns uri', () => {
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(uriTokens);
		});
	});

	describe('/*/*/', () => {
		beforeEach(() => {
			rule = '/*/*/';
			ruleTokens = ruleTokenizer.tokenize(rule);
		});
		it('returns two path parts', () => {
			const expected = uriTokenizer.tokenize('/foo/bar');
			result = applyPathRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
		it('removes query part', () => {
			uriTokens = uriTokenizer.tokenize('/foo/bar/is/a/thing?a=1&b=2&c=&d&&');
			const expected = uriTokenizer.tokenize('/foo/bar');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
		it('removes #fragment part', () => {
			uriTokens = uriTokenizer.tokenize('/foo/bar/is/a/thing#hash');
			const expected = uriTokenizer.tokenize('/foo/bar');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
		it('removes query and #fragment parts', () => {
			uriTokens = uriTokenizer.tokenize('/foo/bar/is/a/thing?a=1&b=2#hash');
			const expected = uriTokenizer.tokenize('/foo/bar');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
		it('normalizes multiple slashes in path', () => {
			uriTokens = uriTokenizer.tokenize('//foo//bar///is/a/thing///');
			const expected = uriTokenizer.tokenize('/foo/bar');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
	});

	describe('/*/*/*', () => {
		beforeEach(() => {
			rule = '/*/*/*';
			ruleTokens = ruleTokenizer.tokenize(rule);
		});
		it('returns full path', () => {
			const expected = uriTokenizer.tokenize('/foo/bar/is/a/thing');
			const result = applyPathRules(uriTokens, ruleTokens);
			expect(result).to.eql(expected);
		});
		it('throws URIError when path is missing last part (trailing slash)', () => {
			uriTokens = uriTokenizer.tokenize('/foo/bar/');
			expect(() => applyPathRules(uriTokens, ruleTokens)).to.throw(URIError);
		});
		it('throws URIError when path is missing last part (w/o trailing slash)', () => {
			uriTokens = uriTokenizer.tokenize('/foo/bar');
			expect(() => applyPathRules(uriTokens, ruleTokens)).to.throw(URIError);
		});
		it('throws URIError when path is missing last part (multiple slashes)', () => {
			uriTokens = uriTokenizer.tokenize('///foo/bar///');
			expect(() => applyPathRules(uriTokens, ruleTokens)).to.throw(URIError);
		});
	});

	describe('/*/-/*', () => {
		beforeEach(() => {
			rule = '/*/-/*';
			ruleTokens = ruleTokenizer.tokenize(rule);
		});
		it('removes second path part from URI', () => {
			const expected = uriTokenizer.tokenize('/foo/is/a/thing');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
		it('throws URIError when path is missing last part (/foo/bar/ has trailing slash)', () => {
			uriTokens = uriTokenizer.tokenize('/foo/bar/');
			expect(() => applyPathRules(uriTokens, ruleTokens)).to.throw(URIError);
		});
		it('throws URIError when path is missing last part (/foo/bar w/o trailing slash)', () => {
			uriTokens = uriTokenizer.tokenize('/foo/bar');
			expect(() => applyPathRules(uriTokens, ruleTokens)).to.throw(URIError);
		});
		it('throws URIError when path is missing last part (///foo/bar/// multiple slashes)', () => {
			uriTokens = uriTokenizer.tokenize('///foo/bar///');
			expect(() => applyPathRules(uriTokens, ruleTokens)).to.throw(URIError);
		});
	});

	describe('/*/-/*/', () => {
		beforeEach(() => {
			rule = '/*/-/*/';
			ruleTokens = ruleTokenizer.tokenize(rule);
		});
		it('remove second path part and everything after the fourth part', () => {
			uriTokens = uriTokenizer.tokenize('/foo/skip/bar/skip/too');
			const expected = uriTokenizer.tokenize('/foo/bar');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
		it('throws URIError when path is missing last part (/foo/bar/ has trailing slash)', () => {
			uriTokens = uriTokenizer.tokenize('/foo/bar/');
			expect(() => applyPathRules(uriTokens, ruleTokens)).to.throw(URIError);
		});
		it('throws URIError when path is missing last part (/foo/bar w/o trailing slash)', () => {
			uriTokens = uriTokenizer.tokenize('/foo/bar');
			expect(() => applyPathRules(uriTokens, ruleTokens)).to.throw(URIError);
		});
		it('throws URIError when path is missing last part (///foo/bar/// multiple slashes)', () => {
			uriTokens = uriTokenizer.tokenize('///foo/bar///');
			expect(() => applyPathRules(uriTokens, ruleTokens)).to.throw(URIError);
		});
	});

	describe('-', () => {
		it('removes entire URI', () => {
			rule = '-';
			uri = '/foo/bar?abc=123#test';
			uriTokens = uriTokenizer.tokenize(uri);
			ruleTokens = ruleTokenizer.tokenize(rule);
			const expected = uriTokenizer.tokenize('');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
	});

	describe('/-', () => {
		it('removes entire path after leading slash', () => {
			uriTokens = uriTokenizer.tokenize('/foo/bar');
			ruleTokens = ruleTokenizer.tokenize('/-');
			const expected = uriTokenizer.tokenize('/');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
	});

	it('? returns path part of URI', () => {
		rule = '?';
		uri = '/foo/bar?abc=123&def=456';
		uriTokens = uriTokenizer.tokenize(uri);
		ruleTokens = ruleTokenizer.tokenize(rule);
		const expected = uriTokenizer.tokenize('/foo/bar');
		const result = applyPathRules(uriTokens, ruleTokens);
		expect(result).to.eql(expected);
	});

	it('?* ignores query pattern rules', () => {
		rule = '?*';
		uri = '/foo/bar?abc=123&def=456';
		uriTokens = uriTokenizer.tokenize(uri);
		ruleTokens = ruleTokenizer.tokenize(rule);
		const expected = uriTokenizer.tokenize('/foo/bar');
		expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
	});

	it('?- ignores query pattern rules', () => {
		rule = '?-';
		uri = '/foo/bar?abc=123&def=456';
		uriTokens = uriTokenizer.tokenize(uri);
		ruleTokens = ruleTokenizer.tokenize(rule);
		const expected = uriTokenizer.tokenize('/foo/bar');
		expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
	});

	it('# returns path part of URI', () => {
		rule = '#';
		uri = '/foo/bar?abc=123&def=456';
		uriTokens = uriTokenizer.tokenize(uri);
		ruleTokens = ruleTokenizer.tokenize(rule);
		const expected = uriTokenizer.tokenize('/foo/bar');
		expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
	});

	it('#* ignores query pattern rules', () => {
		rule = '#*';
		uri = '/foo/bar?abc=123&def=456';
		uriTokens = uriTokenizer.tokenize(uri);
		ruleTokens = ruleTokenizer.tokenize(rule);
		const expected = uriTokenizer.tokenize('/foo/bar');
		expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
	});

	it('#- ignores query pattern rules', () => {
		rule = '#-';
		uri = '/foo/bar?abc=123&def=456';
		uriTokens = uriTokenizer.tokenize(uri);
		ruleTokens = ruleTokenizer.tokenize(rule);
		const expected = uriTokenizer.tokenize('/foo/bar');
		expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
	});

	describe('scheme and authority', () => {
		beforeEach(() => {
			rule = '';
			uri = 'https://user:pwd@dev.test.io:4444/foo/bar?abc=123&def=456#fragment';
			uriTokens = uriTokenizer.tokenize(uri);
			ruleTokens = ruleTokenizer.tokenize(rule);
		});
		it ('ignores scheme', () => {
			const expected = uriTokenizer.tokenize('/foo/bar');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
		it ('ignores user part', () => {
			const expected = uriTokenizer.tokenize('/foo/bar');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
		it ('ignores host part', () => {
			const expected = uriTokenizer.tokenize('/foo/bar');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
		it ('ignores port part', () => {
			const expected = uriTokenizer.tokenize('/foo/bar');
			expect(applyPathRules(uriTokens, ruleTokens)).to.eql(expected);
		});
	});

});
