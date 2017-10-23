/*global describe, it, beforeEach*/

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import * as Url from 'url'

import {formatUrl} from '../src/formatUrl'

import {COMMON_URLS} from './test-urls'

chai.should();
chai.use(sinonChai);

const expect = chai.expect;

// *			= whole path
// */			= first part, chop the rest
// */*/			= first two parts, chop the rest
// -			= omit whole path
// /-/			= omit whole path
// /-/*			= omit first segment, keep the rest
// /-/-/*		= omit first two segments, keep the rest
// */*/-/*/*/ 	= match 5 parts, omit third one, chop the rest
// */*/-/*    	= match 2 parts, omit third one, keep the rest

describe('formatUrl', () => {

	let url, pattern, expected;

	beforeEach(() => {
		url = 'http://www.work.com/foo/bar/is/a/thing?param=value#test-fragment';
		pattern = '';
		expected = '';
	});

	describe('path-sep', () => {
		it('/', () => {
			url = '/';
			pattern = '/';
			expected = '';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('must match up with the url', () => {
			url = 'foo/bar';
			pattern = '/';
			expected = 'foo/bar'; // rule does not match so return url as is
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('matches domain root', () => {
			url = 's://auth';
			pattern = '/';
			expected = 's://auth';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('glob', () => {
		it('"*" matches whole url', () => {
			pattern = '*';
			expected = url;
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		describe('"*/" matches first path segment and omits rest of path', () => {
			it('/foo/bar?p=1#f', () => {
				url = '/foo/bar?p=1#f';
				pattern = '*/';
				expected = `/foo?p=1#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar?p=1#f', () => {
				url = 's://a/foo/bar?p=1#f';
				pattern = '*/';
				expected = `s://a/foo?p=1#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar#f', () => {
				url = 's://a/foo/bar#f';
				pattern = '*/';
				expected = `s://a/foo#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar', () => {
				url = 's://a/foo/bar';
				pattern = '*/';
				expected = `s://a/foo`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
		});

		describe('"*/*/" matches first two path segments and omits rest of path', () => {
			it('/foo/bar?p=1#f', () => {
				url = '/foo/bar?p=1#f';
				pattern = '*/*/';
				expected = `/foo/bar?p=1#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar?p=1#f', () => {
				url = 's://a/foo/bar?p=1#f';
				pattern = '*/*/';
				expected = `s://a/foo/bar?p=1#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar#f', () => {
				url = 's://a/foo/bar#f';
				pattern = '*/*/';
				expected = `s://a/foo/bar#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar', () => {
				url = 's://a/foo/bar';
				pattern = '*/*/';
				expected = `s://a/foo/bar`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('/foo/bar/is/a/thing?p=1#f', () => {
				url = '/foo/bar/is/a/thing?p=1#f';
				pattern = '*/*/';
				expected = `/foo/bar?p=1#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing?p=1#f', () => {
				url = 's://a/foo/bar/is/a/thing?p=1#f';
				pattern = '*/*/';
				expected = `s://a/foo/bar?p=1#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing#f', () => {
				url = 's://a/foo/bar/is/a/thing#f';
				pattern = '*/*/';
				expected = `s://a/foo/bar#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing', () => {
				url = 's://a/foo/bar/is/a/thing';
				pattern = '*/*/';
				expected = `s://a/foo/bar`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
		});

	});

	describe('exclude-all-params-except-following', () => {
		it('"?[a,c]" s://a/foo/bar?a=1&b=2&c=3', () => {
			url = 's://a/foo/bar?a=1&b=2&c=3';
			pattern = '?[a,c]';
			expected = `s://a/foo/bar?a=1&c=3`;
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('"?[b]" s://a/foo/bar?a=1&b=2&c=3', () => {
			url = 's://a/foo/bar?a=1&b=2&c=3';
			pattern = '?[b]';
			expected = `s://a/foo/bar?b=2`;
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('include-all-params-except-following', () => {
		it('"?[^b]" s://a/foo/bar?a=1&b=2&c=3', () => {
			url = 's://a/foo/bar?a=1&b=2&c=3';
			pattern = '?[^b]';
			expected = `s://a/foo/bar?a=1&c=3`;
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('"?[^a,c]" s://a/foo/bar?a=1&b=2&c=3', () => {
			url = 's://a/foo/bar?a=1&b=2&c=3';
			pattern = '?[^a,c]';
			expected = `s://a/foo/bar?b=2`;
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('omit-query-string', () => {
		beforeEach(() => {
			url = 's://a/foo/bar/is/a/thing?z=1&a=2#fragment';
			pattern = '?-';
			expected = 's://a/foo/bar/is/a/thing#fragment';
		});
		describe('"?-" removes entire query string', () => {
			it('s://a/foo/bar/is/a/thing?z=1&a=2#fragment', () => {
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing?z=1&&#fragment', () => {
				url = 's://a/foo/bar/is/a/thing?z=1&&#fragment';
				expected = 's://a/foo/bar/is/a/thing#fragment';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a?z=1#fragment', () => {
				url = 's://a?z=1#fragment';
				expected = 's://a#fragment';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a?z=1', () => {
				url = 's://a?z=1';
				expected = 's://a';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foobar', () => {
				url = 's://a/foobar';
				expected = 's://a/foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
		});
	});

	describe('omit-path', () => {
		describe('"-" removes the entire path', () => {
			it('s://a/foo/bar/is/a/thing', () => {
				url = 's://a/foo/bar/is/a/thing';
				pattern = '-';
				expected = `s://a`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing?a=1#frag', () => {
				url = 's://a/foo/bar/is/a/thing?a=1#frag';
				pattern = '-';
				expected = `s://a?a=1#frag`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing#frag', () => {
				url = 's://a/foo/bar/is/a/thing#frag';
				pattern = '-';
				expected = `s://a#frag`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing?a=1', () => {
				url = 's://a/foo/bar/is/a/thing?a=1';
				pattern = '-';
				expected = `s://a?a=1`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
		});
	});

	describe('omit-path-segment', () => {
		describe('"/foo/-" matches foo and removes remaining path', () => {
			beforeEach(() => {
				pattern = '/foo/-';
			});
			it('s://a/foo/bar/is/a/thing', () => {
				url = 's://a/foo/bar/is/a/thing';
				expected = `s://a/foo`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foobar/is/a/thing', () => {
				url = 's://a/foobar/is/a/thing';
				expected = `s://a/foobar/is/a/thing`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
		});
		describe('"/-" removes the entire path', () => {
			beforeEach(() => {
				pattern = '/-';
			});
			it('s://a/foo/bar/is/a/thing', () => {
				url = 's://a/foo/bar/is/a/thing';
				expected = `s://a`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing?a=1#f', () => {
				url = 's://a/foo/bar/is/a/thing?a=1#f';
				expected = `s://a?a=1#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing?a=1', () => {
				url = 's://a/foo/bar/is/a/thing?a=1';
				expected = `s://a?a=1`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing#f', () => {
				url = 's://a/foo/bar/is/a/thing#f';
				expected = `s://a#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
		});
		describe('"/-/" removes the entire path but keeps the root slash', () => {
			beforeEach(() => {
				pattern = '/-/';
			});
			it('s://a/foo/bar/is/a/thing', () => {
				url = 's://a/foo/bar/is/a/thing';
				expected = `s://a`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing?a=1#f', () => {
				url = 's://a/foo/bar/is/a/thing?a=1#f';
				expected = `s://a?a=1#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing?a=1', () => {
				url = 's://a/foo/bar/is/a/thing?a=1';
				expected = `s://a?a=1`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/is/a/thing#f', () => {
				url = 's://a/foo/bar/is/a/thing#f';
				expected = `s://a#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
		});
		describe('"/-/*" omits first path segment, keep the rest of the path', () => {
			beforeEach(() => {
				pattern = '/-/*';
			});
			it('s://a/foo/bar', () => {
				url = 's://a/foo/bar';
				expected = `s://a/bar`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar?a=1#f', () => {
				url = 's://a/foo/bar?a=1#f';
				expected = `s://a/bar?a=1#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar?a=1', () => {
				url = 's://a/foo/bar?a=1';
				expected = `s://a/bar?a=1`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar#f', () => {
				url = 's://a/foo/bar#f';
				expected = `s://a/bar#f`;
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
		});
	});

	describe('match-fragment', () => {
		describe('cooperates with the other rules', () => {
			beforeEach(() => {
				url = 's://a/foo/bar?z=1&a=2&c=3#match';
				pattern = '#match';
				expected = 's://a/foo/bar?a=2&c=3&z=1#match';
			});
			it('"#match" matches', () => {
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('"/foo/-#match" removes path if fragment matches', () => {
				pattern = '/foo/-#match';
				expected = 's://a/foo?a=2&c=3&z=1#match';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('"?-#match" removes path if fragment matches', () => {
				pattern = '?-#match';
				expected = 's://a/foo/bar#match';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
		});
		describe('"#nomatch" forces original url to be returned', () => {
			it('s://a/#fragment', () => {
				url = 's://a/#fragment';
				expected = url;
				pattern = '#nomatch';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar?a=1&b=2#fragment', () => {
				url = 's://a/foo/bar?a=1&b=2#fragment';
				expected = url;
				pattern = '#nomatch';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('"?[a]#nomatch" s://a/foo/bar?a=1&b=2#fragment', () => {
				url = 's://a/foo/bar?a=1&b=2#fragment';
				expected = url;
				pattern = '?[a]#nomatch';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('"/-/*?[a]#nomatch" s://a/foo/bar?a=1&b=2#fragment', () => {
				url = 's://a/foo/bar?a=1&b=2#fragment';
				expected = url;
				pattern = '/-/*?[a]#nomatch';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('"/-/*#nomatch" s://a/foo/bar?a=1&b=2#fragment', () => {
				url = 's://a/foo/bar?a=1&b=2#fragment';
				expected = url;
				pattern = '/-/*#nomatch';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
		});
		describe('"#foobar" matches fragment part of url', () => {
			beforeEach(() => {
				pattern = '#foobar';
			});
			it('s://a#foobar', () => {
				url = 's://a#foobar';
				expected = url;
				pattern = '#foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/#foobar', () => {
				url = 's://a/#foobar';
				expected = url;
				pattern = '#foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo#foobar', () => {
				url = 's://a/foo#foobar';
				expected = url;
				pattern = '#foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar#foobar', () => {
				url = 's://a/foo/bar#foobar';
				expected = url;
				pattern = '#foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar/#foobar', () => {
				url = 's://a/foo/bar/#foobar';
				expected = 's://a/foo/bar#foobar';
				pattern = '#foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a?a=1&b=2#foobar', () => {
				url = 's://a?a=1&b=2#foobar';
				expected = url;
				pattern = '#foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/?a=1&b=2#foobar', () => {
				url = 's://a/?a=1&b=2#foobar';
				expected = url;
				pattern = '#foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('s://a/foo/bar?a=1&b=2#foobar', () => {
				url = 's://a/foo/bar?a=1&b=2#foobar';
				expected = url;
				pattern = '#foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('/foo/bar?a=1&b=2#foobar', () => {
				url = '/foo/bar?a=1&b=2#foobar';
				expected = url;
				pattern = '#foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('?a=1&b=2#foobar', () => {
				url = '?a=1&b=2#foobar';
				expected = url;
				pattern = '#foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
			it('#foobar', () => {
				url = '#foobar';
				expected = url;
				pattern = '#foobar';
				expect(formatUrl(url, pattern)).to.eql(expected);
			});
		});
	});

	it('exits', () => {
		expect(formatUrl).to.be.a('function');
	});

	it('returns url', () => {
		expect(formatUrl(url)).to.eql(url);
	});

	it('returns url if pattern is not a String', () => {
		expect(formatUrl(url, null)).to.eql(url);
	});

	it('returns url if an error is thrown', () => {
		pattern = ']'; // force a tokenizer error
		expected = url;
		expect(formatUrl(url, pattern)).to.eql(expected);
	});

	it('removes extra path slashes', () => {
		url = '///foo///bar';
		expected = '/foo/bar';
		expect(formatUrl(url, pattern)).to.eql(expected);
	});

	it('removes unnecessary query separator', () => {
		url = 's://a/foo/bar?#f';
		pattern = '';
		expected = 's://a/foo/bar#f';
		expect(formatUrl(url, pattern)).to.eql(expected);
	});

	describe('removes multiple trailing path slashes', () => {
		beforeEach(() => {
			pattern = '/foo/bar/';
			url = '///foo///bar///';
			expected = '/foo/bar';
		});
		it(`handles multiple slashes in URI correctly`, () => {
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it(`handles no trailing slash in URI correctly`, () => {
			url = '/foo/bar';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('glob (*)', () => {
		beforeEach(() => {
			pattern = '*';
			expected = url;
		});
		it('returns url', () => {
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('no pattern', () => {
		beforeEach(() => {
			pattern = '';
		});
		it('removes multiple slashes from URI path', () => {
			url = '///foo///bar///';
			expected = '/foo/bar';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('removes trailing slash from URI path', () => {
			url = '/foo/bar/';
			expected = '/foo/bar';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('sorts query params by name', () => {
			url = '/foo/bar?z=z&a=a&m=m';
			expected = '/foo/bar?a=a&m=m&z=z';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('sorts query params by name and value if duplicate param names found', () => {
			url = '/foo/bar?z=z&a=b&m=m&a=a';
			expected = '/foo/bar?a=a&a=b&m=m&z=z';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('sorts query params', () => {
		it('when no pattern given', () => {
			url = '/foo/bar?b=2&c=3&a=1#test';
			pattern = '';
			expected = '/foo/bar?a=1&b=2&c=3#test';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('when path pattern given', () => {
			url = '/foo/bar?b=2&c=3&a=1#test';
			pattern = '/foo/*';
			expected = '/foo/bar?a=1&b=2&c=3#test';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('when omit-query given', () => {
			url = '/foo/bar?b=2&c=3&a=1#test';
			pattern = '?-';
			expected = '/foo/bar#test';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('when include query pattern given', () => {
			url = '/foo/bar?b=2&c=3&a=1#test';
			pattern = '?*';
			expected = '/foo/bar?a=1&b=2&c=3#test';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('when select query pattern given', () => {
			url = '/foo/bar?b=2&c=3&a=1#test';
			pattern = '?[c,a]';
			expected = '/foo/bar?a=1&c=3#test';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('when hash pattern given', () => {
			url = '/foo/bar?b=2&c=3&a=1#test';
			pattern = '#-';
			expected = '/foo/bar?a=1&b=2&c=3';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});


	describe('/*/*/', () => {
		beforeEach(() => {
			pattern = '/*/*/';
		});
		it('returns two path parts', () => {
			expected = 'http://www.work.com/foo/bar?param=value#test-fragment';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('does not affect query params', () => {
			url = '/foo/bar/is/a/thing?a=1&b=2';
			expected = '/foo/bar?a=1&b=2';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('does not affect hash value', () => {
			url = '/foo/bar/is/a/thing#hash';
			expected = '/foo/bar#hash';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('does not affect query params or hash value', () => {
			url = '/foo/bar/is/a/thing?a=1&b=2#hash';
			expected = '/foo/bar?a=1&b=2#hash';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('ignores multiple slashes in path', () => {
			url = '/foo//bar/is/a/thing/?a=1&b=2#hash';
			expected = '/foo/bar?a=1&b=2#hash';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('/*/*/*', () => {
		beforeEach(() => {
			pattern = '/*/*/*';
		});
		it('returns full path', () => {
			expected = url;
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('returns url when less than two path items', () => {
			url = '/foobar';
			expect(formatUrl(url, pattern)).to.eql(url);
		});
	});

	describe('/*/-/*', () => {
		beforeEach(() => {
			pattern = '/*/-/*';
		});
		it('remove second path part from path', () => {
			expected = 'http://www.work.com/foo/is/a/thing?param=value#test-fragment';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('returns url when less than two path items', () => {
			url = '/foobar';
			expect(formatUrl(url, pattern)).to.eql(url);
		});
	});

	describe('/*/-/*/', () => {
		beforeEach(() => {
			pattern = '/*/-/*/';
		});
		it('remove second path part and after fourth', () => {
			url = '/foo/skip/bar/skip/too';
			expected = '/foo/bar';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('returns url when less than two path items', () => {
			url = '/foobar';
			expect(formatUrl(url, pattern)).to.eql(url);
		});
	});

	describe('-', () => {
		it('removes entire path from url', () => {
			pattern = '-';
			url = '/foo/bar?abc=123#test';
			expected = '?abc=123#test';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('has no affect on query or hash parts', () => {
			pattern = '-';
			url = '/foo/bar?abc=123#test';
			expected = '?abc=123#test';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('/-', () => {
		it('removes entire path from url', () => {
			pattern = '/-';
			url = '/foo/bar?abc=123#test';
			expected = '?abc=123#test';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('has no affect on query or hash parts', () => {
			pattern = '/-';
			url = '/foo/bar?abc=123#test';
			expected = '?abc=123#test';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('?', () => {
		it('returns full URI', () => {
			pattern = '?';
			url = '/foo/bar?abc=123&def=456';
			expected = '/foo/bar?abc=123&def=456';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('? returns path and all query params', () => {
			pattern = '?';
			url = '/foo/bar?abc=123&def=456';
			expected = '/foo/bar?abc=123&def=456';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('?*', () => {
		it('?* returns path and all query params', () => {
			pattern = '?*';
			url = '/foo/bar?abc=123&def=456';
			expected = '/foo/bar?abc=123&def=456';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('/search?[q]', () => {
		beforeEach(() => {
			pattern = '/search?[q]';
			url = '/search?abc=123&q=test+search&def=456';
		});
		it('returns URI', () => {
			expected = '/search?q=test+search';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('returns original URI if path does not match', () => {
			url = '/foo/bar?a=1#test';
			expected = url;
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('/*/*/', () => {
		beforeEach(() => {
			pattern = '/*/*/';
			url = '/c/xyz/some+text';
		});
		it('returns URI', () => {
			expected = '/c/xyz';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
		it('returns normalized URI if path does not have two parts', () => {
			url = '/foo/?a=1#test';
			expected = '/foo?a=1#test';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});
	});

	describe('special cases', () => {

		beforeEach(() => {
			pattern = '';
		});

		it('s://a/foo/bar#?', () => {
			url = 's://a/foo/bar#?';
			expected = url;
			expect(formatUrl(url, pattern)).to.eql(expected);
		});

		it('s://a/foo/bar?#', () => {
			url = 's://a/foo/bar?#';
			expected = 's://a/foo/bar';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});

		it('s:///a/foo', () => {
			url = 's:///a/foo';
			expected = 's:///a/foo';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});

		it('s:///a/foo?z=1&b=2&a=3#frag', () => {
			pattern = '?[z,a]';
			url = 's:///a/foo?z=1&b=2&a=3#frag';
			expected = 's:///a/foo?a=3&z=1#frag';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});

		it('handles slashes after path part', () => {
			// /en-US/login/?continue=https%3A//www.spotify.com/us/download/
			url = '/foo/bar?path=/is/a/thing';
			expected = '/foo/bar?path=/is/a/thing';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});

		it('query param ends URI with a slash char', () => {
			// /en-US/login?continue=https%3A//www.spotify.com/us/download/
			url = '/en-US/login/?continue=https%3A//www.spotify.com/us/download/';
			expected = '/en-US/login?continue=https%3A//www.spotify.com/us/download/';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});

		it('hash contains a query string', () => {
			// /elasticbeanstalk/home?region=us-east-1#/launchEnvironment?applicationName=CSpaceWebApp&environmentId=e-q2p86y82zb
			url = '/foo/bar?a=1#/is/a/thing?b=2';
			expected = '/foo/bar?a=1#/is/a/thing?b=2';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});

		it('hash contains a path and query string', () => {
			url = '/elasticbeanstalk/home?region=us-east-1#/launchEnvironment?applicationName=CSpaceWebApp&environmentId=e-q2p86y82zb';
			expected = '/elasticbeanstalk/home?region=us-east-1#/launchEnvironment?applicationName=CSpaceWebApp&environmentId=e-q2p86y82zb';
			expect(formatUrl(url, pattern)).to.eql(expected);
		});

		it('handles weirdness', () => {
			url = 'https://myaccount.bar.com/interstitials/recoveryoptions?hl=en&service=talk&continue=https://foo.bar.com/Servicetest?continue%3Dhttps%253A%252F%252FFooBar.com%252F%26service%3Dtalk%26hl%3Den%26authuser%3D0%26passive%3Dtrue%26sarp%3D1%26aodrpl%3D1%26checkedDomains%3Dyoutube%26checkConnection%3Dyoutube%253A210%253A1%26pstMsg%3D1&rapt=AEjHL4MHLRN3ssOjJ7_2TYtAHcs7PslTHHqqFJvOrhfzH_fz6fSd0cltffjRgnSUcFGsRD4aki5EQaSKF9csw6tr8nYK7WBQCA&pli=1';
			expected = 'https://myaccount.bar.com/interstitials/recoveryoptions?continue=https://foo.bar.com/Servicetest?continue%3Dhttps%253A%252F%252FFooBar.com%252F%26service%3Dtalk%26hl%3Den%26authuser%3D0%26passive%3Dtrue%26sarp%3D1%26aodrpl%3D1%26checkedDomains%3Dyoutube%26checkConnection%3Dyoutube%253A210%253A1%26pstMsg%3D1&hl=en&pli=1&rapt=AEjHL4MHLRN3ssOjJ7_2TYtAHcs7PslTHHqqFJvOrhfzH_fz6fSd0cltffjRgnSUcFGsRD4aki5EQaSKF9csw6tr8nYK7WBQCA&service=talk';
			expect(formatUrl(url)).to.eql(expected);
		});

		it('handles lone hash', () => {
			url = 'https://console.aws.amazon.com/console/home?#';
			expected = 'https://console.aws.amazon.com/console/home';
			expect(formatUrl(url)).to.eql(expected);
		});

	});

	describe('sanity check special URLs in test-urls.js file:', () => {

		const parseQuery = true;

		function test(originalUri) {

			const resultUri = formatUrl(originalUri, '');
			const result = Url.parse(resultUri, parseQuery);
			const expected = Url.parse(originalUri, parseQuery);

			return () => {

				it(`host: "${expected.host}"`, () => {
					expect(result.host).to.eql(expected.host);
				});

				const expectedPathname = expected.pathname
					.replace(/\/+/, '/')
					.replace(/\/\?/, '?')
					.replace(/\/#/, '#')
					.replace(/\/$/, '')
					.replace(/^$/, '/');

				it(`path: "${expectedPathname}"`, () => {
					expect(result.pathname).to.eql(expectedPathname);
				});

				const keys = Object.keys(expected.query || {});

				it(`query params: ${keys}`, () => {
					expect(result.query).to.eql(expected.query);
				});

				const resultHash = result.hash || '';
				const expectedHash = (expected.hash || '').replace(/#$/, '');
				it(`fragment: "${expectedHash}"`, () => {
					expect(resultHash).to.eql(expectedHash);
				});
			};

		}

		COMMON_URLS.forEach((originalUri) => {

			let url = originalUri.slice(0, 50);
			if (originalUri.length !== url.length) {
				url = url + '...';
			}
			describe(`${url}`, test(originalUri));

		});

	});

});
