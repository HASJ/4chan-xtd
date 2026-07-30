import { describe, expect, it } from 'vitest';
import { isTrustedSiteOrigin } from './helpers';

// jsdom runs these at https://boards.4chan.org/g/thread/1 (see vitest.config.ts),
// which is the real arrangement: the board page and the captcha frame are on
// different subdomains of the same site.
describe('isTrustedSiteOrigin', () => {
  it('accepts the board page itself', () => {
    expect(isTrustedSiteOrigin('https://boards.4chan.org')).toBe(true);
  });

  // The regression: the captcha frame posts {twister:{...}} from sys, so a
  // same-origin-only check silently dropped every captcha error.
  it('accepts the captcha frame on sys', () => {
    expect(isTrustedSiteOrigin('https://sys.4chan.org')).toBe(true);
  });

  it.each([
    ['a look-alike suffix', 'https://sys.4chan.org.evil.com'],
    ['a look-alike prefix', 'https://evilsys.4chan.org'],
    ['an unrelated origin', 'https://evil.com'],
    ['plain http', 'http://sys.4chan.org'],
    ['a bare hostname', 'sys.4chan.org'],
    ['the null origin of a sandboxed frame', 'null'],
    ['the empty string', ''],
  ])('rejects %s', (_label, origin) => {
    expect(isTrustedSiteOrigin(origin)).toBe(false);
  });
});
