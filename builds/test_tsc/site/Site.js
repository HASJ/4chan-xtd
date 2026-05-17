"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var SW_1 = require("./SW");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Site = {
    defaultProperties: {
        '4chan.org': { software: 'yotsuba' },
        '4channel.org': { canonical: '4chan.org' },
        '4cdn.org': { canonical: '4chan.org' },
        'notso.smuglo.li': { canonical: 'smuglo.li' },
        'smugloli.net': { canonical: 'smuglo.li' },
        'smug.nepu.moe': { canonical: 'smuglo.li' }
    },
    init: function (cb) {
        var _this = this;
        _1.default.extend(globals_1.Conf['siteProperties'], Site.defaultProperties);
        var hostname = Site.resolve();
        if (hostname && _1.default.hasOwn(SW_1.default, globals_1.Conf['siteProperties'][hostname].software)) {
            this.set(hostname);
            cb();
        }
        _1.default.onExists(globals_1.doc, 'body', function () {
            var _a, _b;
            for (var software in SW_1.default) {
                var changes;
                if (changes = (_b = (_a = SW_1.default[software]).detect) === null || _b === void 0 ? void 0 : _b.call(_a)) {
                    changes.software = software;
                    hostname = location.hostname.replace(/^www\./, '');
                    var properties = (globals_1.Conf['siteProperties'][hostname] || (globals_1.Conf['siteProperties'][hostname] = (0, helpers_1.dict)()));
                    var changed = 0;
                    for (var key in changes) {
                        if (properties[key] !== changes[key]) {
                            properties[key] = changes[key];
                            changed++;
                        }
                    }
                    if (changed) {
                        _1.default.set('siteProperties', globals_1.Conf['siteProperties']);
                    }
                    if (!globals_1.g.SITE) {
                        _this.set(hostname);
                        cb();
                    }
                    return;
                }
            }
        });
    },
    resolve: function (url) {
        if (url === void 0) { url = location; }
        var hostname = url.hostname;
        while (hostname && !_1.default.hasOwn(globals_1.Conf['siteProperties'], hostname)) {
            hostname = hostname.replace(/^[^.]*\.?/, '');
        }
        if (hostname) {
            var canonical = void 0;
            if (canonical = globals_1.Conf['siteProperties'][hostname].canonical) {
                hostname = canonical;
            }
        }
        return hostname;
    },
    parseURL: function (url) {
        var _a, _b;
        if (url === void 0) { url = location; }
        var siteID = Site.resolve(url);
        var site = globals_1.g.sites[siteID];
        var r = {};
        if (!site) {
            return r;
        }
        r.siteID = site.ID;
        if ((_a = site.isBoardlessPage) === null || _a === void 0 ? void 0 : _a.call(site, url)) {
            return r;
        }
        var pathname = url.pathname.split(/\/+/);
        r.boardID = pathname[1];
        if (site.isFileURL(url)) {
            r.VIEW = 'file';
        }
        else if ((_b = site.isAuxiliaryPage) === null || _b === void 0 ? void 0 : _b.call(site, url)) {
            // pass
        }
        else if (['thread', 'res'].includes(pathname[2])) {
            r.VIEW = 'thread';
            r.threadID = (r.THREADID = +pathname[3].replace(/\.\w+$/, ''));
        }
        else if ((pathname[2] === 'archive') && (pathname[3] === 'res')) {
            r.VIEW = 'thread';
            r.threadID = (r.THREADID = +pathname[4].replace(/\.\w+$/, ''));
            r.threadArchived = true;
        }
        else if (/^(?:catalog|archive)(?:\.\w+)?$/.test(pathname[2])) {
            r.VIEW = pathname[2].replace(/\.\w+$/, '');
        }
        else if (/^(?:index|\d*)(?:\.\w+)?$/.test(pathname[2])) {
            r.VIEW = 'index';
        }
        return r;
    },
    set: function (hostname) {
        for (var ID in globals_1.Conf['siteProperties']) {
            var site;
            var properties = globals_1.Conf['siteProperties'][ID];
            if (properties.canonical) {
                continue;
            }
            var software = properties.software;
            if (!software || !_1.default.hasOwn(SW_1.default, software)) {
                continue;
            }
            globals_1.g.sites[ID] = (site = Object.create(SW_1.default[software]));
            _1.default.extend(site, { ID: ID, siteID: ID, properties: properties, software: software });
        }
        return globals_1.g.SITE = globals_1.g.sites[hostname];
    }
};
exports.default = Site;
