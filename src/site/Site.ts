import { Conf, doc, g } from "../globals/globals";
import $ from "../platform/$";
import { dict } from "../platform/helpers";
import SW from "./SW";

interface SiteProperties {
  software?: string;
  canonical?: string;
  [key: string]: any;
}

const Site = {
  defaultProperties: {
    '4chan.org':    {software: 'yotsuba'},
    '4channel.org': {canonical: '4chan.org'},
    '4cdn.org':     {canonical: '4chan.org'},
    'notso.smuglo.li': {canonical: 'smuglo.li'},
    'smugloli.net':    {canonical: 'smuglo.li'},
    'smug.nepu.moe':   {canonical: 'smuglo.li'}
  } as { [key: string]: SiteProperties },

  init(cb: () => void): void {
    $.extend(Conf['siteProperties'], Site.defaultProperties);
    const hostname = Site.resolve();
    if (hostname && $.hasOwn(SW, Conf['siteProperties'][hostname].software)) {
      this.set(hostname);
      cb();
    }
    $.onExists(doc, 'body', () => Site.detectAndApply(cb));
  },

  detectAndApply(cb: () => void): void {
    for (const software in SW) {
      const changes = SW[software].detect?.();
      if (!changes) { continue; }
      changes.software = software;
      const hostname = location.hostname.replace(/^www\./, '');
      const properties = (Conf['siteProperties'][hostname] || (Conf['siteProperties'][hostname] = dict()));
      Site.applyChanges(properties, changes);
      if (!g.SITE) {
        this.set(hostname);
        cb();
      }
      return;
    }
  },

  applyChanges(properties: any, changes: any): void {
    let changed = 0;
    for (const key in changes) {
      if (properties[key] !== changes[key]) {
        properties[key] = changes[key];
        changed++;
      }
    }
    if (changed) {
      $.set('siteProperties', Conf['siteProperties']);
    }
  },

  resolve(url: { hostname: string } | Location = location): string {
    let { hostname } = url;
    while (hostname && !$.hasOwn(Conf['siteProperties'], hostname)) {
      hostname = hostname.replace(/^[^.]*\.?/, '');
    }
    if (hostname) {
      const canonical: string | undefined = Conf['siteProperties'][hostname]?.canonical;
      if (canonical) {
        hostname = canonical;
      }
    }
    return hostname;
  },

  parseURL(url: { pathname: string } | Location = location): { [key: string]: any } {
    const siteID = Site.resolve(url as Location);
    const site = g.sites[siteID];
    const r: { [key: string]: any } = {};

    if (!site) { return r; }
    r.siteID = site.ID;

    if (site.isBoardlessPage?.(url)) { return r; }
    const pathname = url.pathname.split(/\/+/);
    r.boardID = pathname[1];

    if (site.isFileURL(url)) {
      r.VIEW = 'file';
    } else if (site.isAuxiliaryPage?.(url)) {
      // pass
    } else if (['thread', 'res'].includes(pathname[2])) {
      r.VIEW = 'thread';
      r.threadID = (r.THREADID = +pathname[3].replace(/\.\w+$/, ''));
    } else if ((pathname[2] === 'archive') && (pathname[3] === 'res')) {
      r.VIEW = 'thread';
      r.threadID = (r.THREADID = +pathname[4].replace(/\.\w+$/, ''));
      r.threadArchived = true;
    } else if (/^(?:catalog|archive)(?:\.\w+)?$/.test(pathname[2])) {
      r.VIEW = pathname[2].replace(/\.\w+$/, '');
    } else if (/^(?:index|\d*)(?:\.\w+)?$/.test(pathname[2])) {
      r.VIEW = 'index';
    }
    return r;
  },

  set(hostname: string): any {
    for (const ID of Object.keys(Conf['siteProperties'])) {
      const properties = Conf['siteProperties'][ID];
      if (properties.canonical) { continue; }
      const { software } = properties;
      if (!software || !$.hasOwn(SW, software)) { continue; }
      const site: any = Object.create(SW[software]);
      (g.sites as Record<string, any>)[ID] = site;
      $.extend(site, { ID, siteID: ID, properties, software });
    }
    const site = g.sites[hostname];
    g.SITE = site;
    return site;
  }
};

export default Site;
