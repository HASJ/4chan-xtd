// @ts-nocheck
import { Conf, doc, g } from "../globals/globals";
import $ from "../platform/$";
import { dict } from "../platform/helpers";
import SW from "./SW";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Site = {
  defaultProperties: {
    '4chan.org':    {software: 'yotsuba'},
    '4channel.org': {canonical: '4chan.org'},
    '4cdn.org':     {canonical: '4chan.org'},
    'notso.smuglo.li': {canonical: 'smuglo.li'},
    'smugloli.net':    {canonical: 'smuglo.li'},
    'smug.nepu.moe':   {canonical: 'smuglo.li'}
  },

  init(cb) {
    $.extend(Conf['siteProperties'], Site.defaultProperties);
    let hostname = Site.resolve();
    if (hostname && $.hasOwn(SW, Conf['siteProperties'][hostname].software)) {
      this.set(hostname);
      cb();
    }
    $.onExists(doc, 'body', () => {
      for (var software in SW) {
        var changes;
        if (changes = SW[software].detect?.()) {
          changes.software = software;
          hostname = location.hostname.replace(/^www\./, '');
          var properties = (Conf['siteProperties'][hostname] || (Conf['siteProperties'][hostname] = dict()));
          var changed = 0;
          for (var key in changes) {
            if (properties[key] !== changes[key]) {
              properties[key] = changes[key];
              changed++;
            }
          }
          if (changed) {
            $.set('siteProperties', Conf['siteProperties']);
          }
          if (!g.SITE) {
            this.set(hostname);
            cb();
          }
          return;
        }
      }
    });
  },

  resolve(url=location) {
    let {hostname} = url;
    while (hostname && !$.hasOwn(Conf['siteProperties'], hostname)) {
      hostname = hostname.replace(/^[^.]*\.?/, '');
    }
    if (hostname) {
      let canonical;
      if (canonical = Conf['siteProperties'][hostname].canonical) { hostname = canonical; }
    }
    return hostname;
  },

  parseURL(url=location) {
    const siteID = Site.resolve(url);
    const site = g.sites[siteID];
    const r = {};

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

  set(hostname) {
    for (var ID in Conf['siteProperties']) {
      var site;
      var properties = Conf['siteProperties'][ID];
      if (properties.canonical) { continue; }
      var {
        software
      } = properties;
      if (!software || !$.hasOwn(SW, software)) { continue; }
      g.sites[ID] = (site = Object.create(SW[software]));
      $.extend(site, {ID, siteID: ID, properties, software});
    }
    return g.SITE = g.sites[hostname];
  }
};
export default Site;

