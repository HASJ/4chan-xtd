import { beforeEach, describe, expect, it, vi } from 'vitest';
import GithubUpdater from './GithubUpdater';
import CrossOrigin from '../platform/CrossOrigin';
import Notice from '../classes/Notice';
import $ from '../platform/$';
import { Conf, g } from '../globals/globals';

vi.mock('../classes/Notice', () => {
  return {
    default: vi.fn().mockImplementation(function(this: any, type: string, el: HTMLElement, timeout: number) {
      this.type = type;
      this.el = el;
      this.timeout = timeout;
      this.close = vi.fn();
    })
  };
});

describe('GithubUpdater', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Conf['Check for Updates'] = true;
    g.VERSION = '2.31.12';
  });

  describe('isNewer', () => {
    it('returns true when latest has a higher patch version', () => {
      expect(GithubUpdater.isNewer('2.31.12', 'v2.31.13')).toBe(true);
      expect(GithubUpdater.isNewer('v2.31.12', '2.31.13')).toBe(true);
    });

    it('returns true when latest has a higher minor or major version', () => {
      expect(GithubUpdater.isNewer('2.31.12', 'v2.32.0')).toBe(true);
      expect(GithubUpdater.isNewer('2.31.12', 'v3.0.0')).toBe(true);
    });

    it('returns false when latest is identical or older', () => {
      expect(GithubUpdater.isNewer('2.31.12', 'v2.31.12')).toBe(false);
      expect(GithubUpdater.isNewer('2.31.13', 'v2.31.12')).toBe(false);
      expect(GithubUpdater.isNewer('3.0.0', 'v2.31.12')).toBe(false);
    });

    it('handles versions with different segment lengths', () => {
      expect(GithubUpdater.isNewer('2.31', 'v2.31.1')).toBe(true);
      expect(GithubUpdater.isNewer('2.31.13', 'v2.31.13.1')).toBe(true);
      expect(GithubUpdater.isNewer('2.31.13.1', 'v2.31.13')).toBe(false);
    });
  });

  describe('init', () => {
    it('does nothing when Check for Updates is disabled', () => {
      Conf['Check for Updates'] = false;
      const checkSpy = vi.spyOn(GithubUpdater, 'check');

      GithubUpdater.init();

      expect(checkSpy).not.toHaveBeenCalled();
    });

    it('does not check if lastUpdateCheck is less than 24 hours ago', () => {
      const now = Date.now();
      vi.spyOn($, 'get').mockImplementation((defaults: any, cb: any) => {
        cb({ lastUpdateCheck: now - (1000 * 60 * 60 * 12) }); // 12 hours ago
      });
      const checkSpy = vi.spyOn(GithubUpdater, 'check');

      GithubUpdater.init();

      expect(checkSpy).not.toHaveBeenCalled();
    });

    it('checks when lastUpdateCheck is older than 24 hours or missing', () => {
      const now = Date.now();
      vi.spyOn($, 'get').mockImplementation((defaults: any, cb: any) => {
        cb({ lastUpdateCheck: 0 });
      });
      const checkSpy = vi.spyOn(GithubUpdater, 'check').mockImplementation(() => {});

      GithubUpdater.init();

      expect(checkSpy).toHaveBeenCalled();
    });
  });

  describe('check', () => {
    it('queries GitHub API and triggers notify when a newer version is found', () => {
      const notifySpy = vi.spyOn(GithubUpdater, 'notify');
      const setSpy = vi.spyOn($, 'set').mockImplementation(() => {});

      vi.spyOn(CrossOrigin, 'ajax').mockImplementation((url: string, options: any) => {
        expect(url).toContain('https://api.github.com/repos/HASJ/4chan-xtd/releases/latest');
        const fakeReq = {
          status: 200,
          response: {
            tag_name: 'v2.31.13',
            html_url: 'https://github.com/HASJ/4chan-xtd/releases/tag/v2.31.13'
          }
        };
        options.onloadend.call(fakeReq);
        return {} as any;
      });

      GithubUpdater.check(123456789);

      expect(setSpy).toHaveBeenCalledWith('lastUpdateCheck', 123456789);
      expect(notifySpy).toHaveBeenCalledWith('2.31.13', 'https://github.com/HASJ/4chan-xtd/releases/tag/v2.31.13');
      expect(Notice).toHaveBeenCalledWith('info', expect.any(Object), 30);
    });

    it('does not notify when current version is equal or newer', () => {
      g.VERSION = '2.31.13';
      const notifySpy = vi.spyOn(GithubUpdater, 'notify');

      vi.spyOn(CrossOrigin, 'ajax').mockImplementation((url: string, options: any) => {
        const fakeReq = {
          status: 200,
          response: {
            tag_name: 'v2.31.13',
            html_url: 'https://github.com/HASJ/4chan-xtd/releases/tag/v2.31.13'
          }
        };
        options.onloadend.call(fakeReq);
        return {} as any;
      });

      GithubUpdater.check(123456789);

      expect(notifySpy).not.toHaveBeenCalled();
    });

    it('does not notify on non-200 responses or errors', () => {
      const notifySpy = vi.spyOn(GithubUpdater, 'notify');

      vi.spyOn(CrossOrigin, 'ajax').mockImplementation((url: string, options: any) => {
        const fakeReq = {
          status: 403,
          response: null
        };
        options.onloadend.call(fakeReq);
        return {} as any;
      });

      GithubUpdater.check(123456789);

      expect(notifySpy).not.toHaveBeenCalled();
    });

    it('handles response provided as string instead of object', () => {
      const notifySpy = vi.spyOn(GithubUpdater, 'notify');

      vi.spyOn(CrossOrigin, 'ajax').mockImplementation((url: string, options: any) => {
        const fakeReq = {
          status: 200,
          response: JSON.stringify({
            tag_name: 'v2.31.13',
            html_url: 'https://github.com/HASJ/4chan-xtd/releases/tag/v2.31.13'
          })
        };
        options.onloadend.call(fakeReq);
        return {} as any;
      });

      GithubUpdater.check(123456789);

      expect(notifySpy).toHaveBeenCalledWith('2.31.13', 'https://github.com/HASJ/4chan-xtd/releases/tag/v2.31.13');
    });
  });
});
