import { beforeEach, describe, expect, it } from 'vitest';
import { Conf } from '../globals/globals';
import QRState from '../globals/QRState';
import Captcha from './Captcha';

describe('Captcha cache auto-load', () => {
  beforeEach(() => {
    Conf['Auto-load captcha'] = false;
    QRState.posts = [{ thread: 123, isOnlyQuotes: () => false, file: null }];
    QRState.req = null;
    Captcha.cache.captchas = [];
    delete Captcha.cache.submitCB;
    localStorage.clear();
    document.cookie = '_ct=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  // Reported as issue #26: typing should not turn a disabled auto-load back on.
  it('does not request for a non-empty post when auto-load is off', () => {
    expect(Captcha.cache.neededRaw()).toBe(false);
  });
});
