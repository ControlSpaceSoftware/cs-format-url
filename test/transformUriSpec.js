/*global describe, it, beforeEach*/

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import * as Url from 'url'

import {transformUri} from '../src/transformUri'

import {URLS} from './test-urls'

chai.should();
chai.use(sinonChai);

const expect = chai.expect;

describe('transformUri', () => {

	let uri, rule, result;

	beforeEach(() => {
		uri = '/foo/bar/is/a/thing';
		rule = '';
		result = '';
	});

	it('exits', () => {
		expect(transformUri).to.be.a('function');
	});

	it('returns uri when no pattern given', () => {
		expect(transformUri(uri)).to.eql(uri);
	});

	it('returns uri as is if an error is thrown', () => {
		rule = ']'; // force a tokenizer error
		result = uri;
		expect(transformUri(uri, rule)).to.eql(result);
	});

	it('removes extra path slashes', () => {
		uri = '///foo///bar';
		result = '/foo/bar';
		expect(transformUri(uri, rule)).to.eql(result);
	});

	describe('normalizes URI when no rule is give', () => {
		it('removes multiple slashes from URI path', () => {
			rule = '';
			uri = '///foo///bar///';
			result = '/foo/bar';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('removes trailing slash from URI path', () => {
			rule = '';
			uri = '/foo/bar/';
			result = '/foo/bar';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('sorts query params by name', () => {
			rule = '';
			uri = '/foo/bar?z=z&a=a&m=m';
			result = '/foo/bar?a=a&m=m&z=z';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('sorts query params by name and value if duplicate param names found', () => {
			rule = '';
			uri = '/foo/bar?z=z&a=b&m=m&a=a';
			result = '/foo/bar?a=a&a=b&m=m&z=z';
			expect(transformUri(uri, rule)).to.eql(result);
		});
	});

	describe('removes multiple trailing path slashes', () => {
		beforeEach(() => {
			rule = '/foo/bar/';
			uri = '///foo///bar///';
			result = '/foo/bar';
		});
		it(`handles multiple slashes in URI correctly`, () => {
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it(`handles no trailing slash in URI correctly`, () => {
			uri = '/foo/bar';
			expect(transformUri(uri, rule)).to.eql(result);
		});
	});

	describe('sorts query params', () => {
		beforeEach(() => {
			rule = '';
			uri = '/foo/bar?b=2&c=3&a=1#test';
			result = '/foo/bar?a=1&b=2&c=3#test';
		});
		it('when no rule given', () => {
			rule = '';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('when path rule given', () => {
			rule = '/foo/*';
			result = '/foo/bar?a=1&b=2&c=3#test';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('when query rule given', () => {
			rule = '?*';
			result = '/foo/bar?a=1&b=2&c=3#test';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('when hash rule given', () => {
			rule = '#-';
			result = '/foo/bar?a=1&b=2&c=3';
			expect(transformUri(uri, rule)).to.eql(result);
		});
	});

	describe('glob (*)', () => {
		beforeEach(() => {
			rule = '*';
		});
		it('returns uri', () => {
			expect(transformUri(uri, rule)).to.eql(uri);
		});
	});

	describe('/*/*/', () => {
		beforeEach(() => {
			rule = '/*/*/';
		});
		it('returns two path parts', () => {
			result = '/foo/bar';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('does not affect query params', () => {
			uri = '/foo/bar/is/a/thing?a=1&b=2';
			result = '/foo/bar?a=1&b=2';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('does not affect hash value', () => {
			uri = '/foo/bar/is/a/thing#hash';
			result = '/foo/bar#hash';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('does not affect query params or hash value', () => {
			uri = '/foo/bar/is/a/thing?a=1&b=2#hash';
			result = '/foo/bar?a=1&b=2#hash';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('ignores multiple slashes in path', () => {
			uri = '/foo//bar/is/a/thing/?a=1&b=2#hash';
			result = '/foo/bar?a=1&b=2#hash';
			expect(transformUri(uri, rule)).to.eql(result);
		});
	});

	describe('/*/*/*', () => {
		beforeEach(() => {
			rule = '/*/*/*';
		});
		it('returns full path', () => {
			result = '/foo/bar/is/a/thing';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('returns uri when less than two path items', () => {
			uri = '/foobar';
			expect(transformUri(uri, rule)).to.eql(uri);
		});
	});

	describe('/*/-/*', () => {
		beforeEach(() => {
			rule = '/*/-/*';
		});
		it('remove second path part from path', () => {
			result = '/foo/is/a/thing';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('returns uri when less than two path items', () => {
			uri = '/foobar';
			expect(transformUri(uri, rule)).to.eql(uri);
		});
	});

	describe('/*/-/*/', () => {
		beforeEach(() => {
			rule = '/*/-/*/';
		});
		it('remove second path part and after fourth', () => {
			uri = '/foo/skip/bar/skip/too';
			result = '/foo/bar';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('returns uri when less than two path items', () => {
			uri = '/foobar';
			expect(transformUri(uri, rule)).to.eql(uri);
		});
	});

	describe('-', () => {
		it('removes entire path from uri', () => {
			rule = '-';
			uri = '/foo/bar?abc=123#test';
			result = '?abc=123#test';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('has no affect on query or hash parts', () => {
			rule = '-';
			uri = '/foo/bar?abc=123#test';
			result = '?abc=123#test';
			expect(transformUri(uri, rule)).to.eql(result);
		});
	});

	describe('/-', () => {
		it('removes entire path from uri', () => {
			rule = '/-';
			uri = '/foo/bar?abc=123#test';
			result = '/?abc=123#test';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('has no affect on query or hash parts', () => {
			rule = '/-';
			uri = '/foo/bar?abc=123#test';
			result = '/?abc=123#test';
			expect(transformUri(uri, rule)).to.eql(result);
		});
	});

	describe('?', () => {
		it('returns full URI', () => {
			rule = '?';
			uri = '/foo/bar?abc=123&def=456';
			result = '/foo/bar?abc=123&def=456';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('? returns path and all query params', () => {
			rule = '?';
			uri = '/foo/bar?abc=123&def=456';
			result = '/foo/bar?abc=123&def=456';
			expect(transformUri(uri, rule)).to.eql(result);
		});
	});

	describe('?*', () => {
		it('?* returns path and all query params', () => {
			rule = '?*';
			uri = '/foo/bar?abc=123&def=456';
			result = '/foo/bar?abc=123&def=456';
			expect(transformUri(uri, rule)).to.eql(result);
		});
	});

	describe('/search?[q]', () => {
		beforeEach(() => {
			rule = '/search?[q]';
			uri = '/search?abc=123&q=test+search&def=456';
		});
		it('returns URI', () => {
			result = '/search?q=test+search';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('returns original URI if path does not match', () => {
			uri = '/foo/bar?a=1#test';
			result = uri;
			expect(transformUri(uri, rule)).to.eql(result);
		});
	});

	describe('/*/*/', () => {
		beforeEach(() => {
			rule = '/*/*/';
			uri = '/c/xyz/some+text';
		});
		it('returns URI', () => {
			result = '/c/xyz';
			expect(transformUri(uri, rule)).to.eql(result);
		});
		it('returns normalized URI if path does not have two parts', () => {
			uri = '/foo/?a=1#test';
			result = '/foo?a=1#test';
			expect(transformUri(uri, rule)).to.eql(result);
		});
	});

	describe('special cases', () => {

		it('handles slashes after path part', () => {
			// /en-US/login/?continue=https%3A//www.spotify.com/us/download/
			rule = '';
			uri = '/foo/bar?path=/is/a/thing';
			result = '/foo/bar?path=/is/a/thing';
			expect(transformUri(uri, rule)).to.eql(result);
		});

		it('query param ends URI with a slash char', () => {
			// /en-US/login?continue=https%3A//www.spotify.com/us/download/
			rule = '';
			uri = '/en-US/login/?continue=https%3A//www.spotify.com/us/download/';
			result = '/en-US/login?continue=https%3A//www.spotify.com/us/download/';
			expect(transformUri(uri, rule)).to.eql(result);
		});

		it('hash contains a query string', () => {
			// /elasticbeanstalk/home?region=us-east-1#/launchEnvironment?applicationName=CSpaceWebApp&environmentId=e-q2p86y82zb			rule = '';
			uri = '/foo/bar?a=1#/is/a/thing?b=2';
			result = '/foo/bar?a=1#/is/a/thing?b=2';
			expect(transformUri(uri, rule)).to.eql(result);
		});

		it('hash contains a query string', () => {
			// /elasticbeanstalk/home?region=us-east-1#/launchEnvironment?applicationName=CSpaceWebApp&environmentId=e-q2p86y82zb			rule = '';
			uri = '/foo/bar?a=1#/is/a/thing?b=2';
			result = '/foo/bar?a=1#/is/a/thing?b=2';
			expect(transformUri(uri, rule)).to.eql(result);
		});

	});

	describe('review any URLs that do not pass sanity check:', () => {
		const parseQuery = true;
		it('normalizes as expected', () => {
			for (let i = 0; i < URLS.length; i++) {

				const originalUri = URLS[i];

				const resultUri = transformUri(originalUri, '');

				const result = Url.parse(resultUri, parseQuery);
				const expected = Url.parse(originalUri, parseQuery);

				const expectedPathname = expected.pathname.replace(/\/+/, '/').replace(/\/\?/, '?').replace(/\/#/, '#').replace(/\/$/, '').replace(/^$/, '/');

				// sanity check host names
				if (result.host !== expected.host) {
					console.log('---', 'host does not match');
					console.log(i, originalUri);
					console.log(i, result.host);
					console.log(i, expected.host);
					console.log('---');
				}

				// sanity check path names
				if ((result.pathname || expectedPathname) && result.pathname !== expectedPathname) {
					console.log('---', 'pathname does not match');
					console.log(i, originalUri);
					console.log(i, result.pathname);
					console.log(i, expectedPathname);
					console.log('---');
				}

				// sanity check query params
				try {
					expect(result.query).to.eql(expected.query);
				} catch (err) {
					console.log('---', err.message);
					console.log(i, resultUri);
					console.log(i, originalUri);
					console.log(i, result.query);
					console.log(i, expected.query);
					console.log('---');
				}

				// sanity check hash fragment parts
				if (result.hash !== expected.hash) {
					console.log('---', 'fragment does not match');
					console.log(i, originalUri);
					console.log(i, result.hash);
					console.log(i, expected.hash);
					console.log('---');
				}

			}
		});
	});

});
