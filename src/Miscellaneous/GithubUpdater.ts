import $ from "../platform/$";
import CrossOrigin from "../platform/CrossOrigin";
import Notice from "../classes/Notice";
import { g, Conf } from "../globals/globals";
import meta from '../../package.json';

const GithubUpdater = {
  init() {
    if (!Conf['Check for Updates']) return;

    // Check if we should poll yet (e.g., once every 24 hours)
    $.get({ lastUpdateCheck: 0 }, (items: any) => {
      const lastChecked = items.lastUpdateCheck;
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;

      if (!lastChecked || (now - lastChecked) > ONE_DAY) {
        GithubUpdater.check(now);
      }
    });
  },

  check(timestamp: number) {
    const match = /github\.com\/([^/]+)\/([^/]+)/.exec(meta.page);
    const repo = match ? `${match[1]}/${match[2]}` : 'HASJ/4chan-xtd';
    const url = `https://api.github.com/repos/${repo}/releases/latest`;

    CrossOrigin.ajax(url, {
      onloadend() {
        // Always update last checked timestamp to avoid spamming calls
        $.set('lastUpdateCheck', timestamp);

        if (this.status !== 200 || !this.response) return;

        const latestVersion = this.response.tag_name;
        const downloadUrl = this.response.html_url;

        if (latestVersion && downloadUrl && GithubUpdater.isNewer(g.VERSION, latestVersion)) {
          GithubUpdater.notify(latestVersion.replace(/^v/, ''), downloadUrl);
        }
      }
    });
  },

  isNewer(current: string, latest: string): boolean {
    const currentParts = current.replace(/^v/, '').split('.').map(Number);
    const latestParts = latest.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const c = currentParts[i] || 0;
      const l = latestParts[i] || 0;
      if (l > c) return true;
      if (c > l) return false;
    }
    return false;
  },

  notify(version: string, downloadUrl: string): Notice {
    const el = $.el('span', {
      innerHTML: `A new version of ${meta.name} (v${version}) is available. ` +
                 `<a href="${downloadUrl}" target="_blank">View Release & Update</a>.`
    });
    return new Notice('info', el, 30);
  }
};

export default GithubUpdater;
