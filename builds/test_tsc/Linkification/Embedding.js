"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Get_1 = require("../General/Get");
var Header_1 = require("../General/Header");
var UI_1 = require("../General/UI");
var globals_1 = require("../globals/globals");
var ImageHost_1 = require("../Images/ImageHost");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var CrossOrigin_1 = require("../platform/CrossOrigin");
var helpers_1 = require("../platform/helpers");
var Embed_html_1 = require("./Embedding/Embed.html");
var FxTwitter_1 = require("./Embedding/FxTwitter");
var icon_1 = require("../Icons/icon");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Embedding = {
    init: function () {
        if (!['index', 'thread', 'archive'].includes(globals_1.g.VIEW) || !globals_1.Conf['Linkify'] || (!globals_1.Conf['Embedding'] && !globals_1.Conf['Link Title'] && !globals_1.Conf['Cover Preview'])) {
            return;
        }
        this.types = (0, helpers_1.dict)();
        for (var _i = 0, _a = this.ordered_types; _i < _a.length; _i++) {
            var type = _a[_i];
            this.types[type.key] = type;
        }
        if (globals_1.Conf['Embedding'] && (globals_1.g.VIEW !== 'archive')) {
            this.dialog = UI_1.default.dialog('embedding', { innerHTML: Embed_html_1.default });
            this.media = (0, _1.default)('#media-embed', this.dialog);
            _1.default.one(globals_1.d, '4chanXInitFinished', this.ready);
            _1.default.on(globals_1.d, 'IndexRefreshInternal', function () { return globals_1.g.posts.forEach(function (post) {
                for (var _i = 0, _a = __spreadArray([post], post.clones, true); _i < _a.length; _i++) {
                    post = _a[_i];
                    for (var _b = 0, _c = post.nodes.embedlinks; _b < _c.length; _b++) {
                        var embed = _c[_b];
                        Embedding.cb.catalogRemove.call(embed);
                    }
                }
            }); });
        }
        if (Embedding.shouldFetchTitles()) {
            _1.default.on(globals_1.d, '4chanXInitFinished PostsInserted', function () {
                var _a;
                for (var _i = 0, _b = Object.values(Embedding.types); _i < _b.length; _i++) {
                    var service = _b[_i];
                    if ((_a = service.title) === null || _a === void 0 ? void 0 : _a.batchSize) {
                        Embedding.flushTitles(service.title);
                    }
                }
            });
        }
    },
    events: function (post) {
        var el, i, items;
        if (globals_1.g.VIEW === 'archive') {
            return;
        }
        if (globals_1.Conf['Embedding']) {
            i = 0;
            items = (post.nodes.embedlinks = (0, __1.default)('.embedder', post.nodes.comment));
            while ((el = items[i++])) {
                _1.default.on(el, 'click', Embedding.cb.click);
                if (_1.default.hasClass(el, 'embedded')) {
                    Embedding.cb.toggle.call(el);
                }
            }
        }
        if (globals_1.Conf['Cover Preview']) {
            i = 0;
            items = (0, __1.default)('.linkify', post.nodes.comment);
            while ((el = items[i++])) {
                var data;
                if (data = Embedding.services(el)) {
                    Embedding.preview(data);
                }
            }
            return;
        }
    },
    process: function (link, post) {
        var data;
        if (!globals_1.Conf['Embedding'] && !globals_1.Conf['Link Title'] && !globals_1.Conf['Cover Preview']) {
            return;
        }
        if (_1.default.x('ancestor::pre', link)) {
            return;
        }
        if (data = Embedding.services(link)) {
            data.post = post;
            if (globals_1.Conf['Embedding'] && (globals_1.g.VIEW !== 'archive')) {
                Embedding.embed(data);
            }
            if (Embedding.shouldFetchTitles())
                Embedding.title(data);
            if (globals_1.Conf['Cover Preview'] && (globals_1.g.VIEW !== 'archive')) {
                return Embedding.preview(data);
            }
        }
    },
    services: function (link) {
        var href = link.href;
        for (var _i = 0, _a = Embedding.ordered_types; _i < _a.length; _i++) {
            var type = _a[_i];
            var match;
            if (match = type.regExp.exec(href)) {
                return { key: type.key, uid: match[1], options: match[2], link: link };
            }
        }
    },
    embed: function (data) {
        var key = data.key, uid = data.uid, options = data.options, link = data.link, post = data.post;
        var href = link.href;
        _1.default.addClass(link, key.toLowerCase());
        var embed = _1.default.el('a', {
            className: 'embedder',
            href: 'javascript:;'
        }, { innerHTML: '(<span>un</span>embed)' });
        var object = { key: key, uid: uid, options: options, href: href };
        for (var name in object) {
            var value = object[name];
            embed.dataset[name] = value;
        }
        _1.default.on(embed, 'click', Embedding.cb.click);
        _1.default.after(link, [_1.default.tn(' '), embed]);
        post.nodes.embedlinks.push(embed);
        if (globals_1.Conf['Auto-embed'] && !globals_1.Conf['Floating Embeds'] && !post.isFetchedQuote) {
            if (_1.default.hasClass(globals_1.doc, 'catalog-mode')) {
                return _1.default.addClass(embed, 'embed-removed');
            }
            else {
                return Embedding.cb.toggle.call(embed);
            }
        }
    },
    ready: function () {
        if (!(globals_1.g.SITE.isThisPageLegit ? globals_1.g.SITE.isThisPageLegit() : !!_1.default.id('postForm'))) {
            return;
        }
        _1.default.addClass(Embedding.dialog, 'empty');
        var close = (0, _1.default)('.close', Embedding.dialog);
        var jump = (0, _1.default)('.jump', Embedding.dialog);
        _1.default.on(close, 'click', Embedding.closeFloat);
        _1.default.on((0, _1.default)('.move', Embedding.dialog), 'mousedown', Embedding.dragEmbed);
        _1.default.on(jump, 'click', function () {
            if (globals_1.doc.contains(Embedding.lastEmbed))
                return Header_1.default.scrollTo(Embedding.lastEmbed);
        });
        icon_1.default.set(jump, 'arrowRightLong');
        icon_1.default.set(close, 'xmark');
        return _1.default.add(globals_1.d.body, Embedding.dialog);
    },
    closeFloat: function () {
        delete Embedding.lastEmbed;
        _1.default.addClass(Embedding.dialog, 'empty');
        return _1.default.replace(Embedding.media.firstChild, _1.default.el('div'));
    },
    dragEmbed: function () {
        // only webkit can handle a blocking div
        var style = Embedding.media.style;
        if (Embedding.dragEmbed.mouseup) {
            _1.default.off(globals_1.d, 'mouseup', Embedding.dragEmbed);
            Embedding.dragEmbed.mouseup = false;
            style.pointerEvents = '';
            return;
        }
        _1.default.on(globals_1.d, 'mouseup', Embedding.dragEmbed);
        Embedding.dragEmbed.mouseup = true;
        return style.pointerEvents = 'none';
    },
    title: function (data) {
        var service;
        var key = data.key, uid = data.uid, options = data.options, link = data.link, post = data.post;
        if (!(service = Embedding.types[key].title)) {
            return;
        }
        _1.default.addClass(link, key.toLowerCase());
        if (service.batchSize) {
            (service.queue || (service.queue = [])).push(data);
            if (service.queue.length >= service.batchSize) {
                return Embedding.flushTitles(service);
            }
        }
        else {
            return CrossOrigin_1.default.cache(service.api(uid), (function () { return Embedding.cb.title(this, data); }));
        }
    },
    flushTitles: function (service) {
        var data;
        var queue = service.queue;
        if (!(queue === null || queue === void 0 ? void 0 : queue.length)) {
            return;
        }
        service.queue = [];
        var cb = function () {
            for (var _i = 0, queue_1 = queue; _i < queue_1.length; _i++) {
                data = queue_1[_i];
                Embedding.cb.title(this, data);
            }
        };
        return CrossOrigin_1.default.cache(service.api(queue.map(function (data) { return data.uid; })), cb);
    },
    preview: function (data) {
        var service;
        var key = data.key, uid = data.uid, link = data.link;
        if (!(service = Embedding.types[key].preview)) {
            return;
        }
        return _1.default.on(link, 'mouseover', function (e) {
            var src = service.url(uid);
            var height = service.height;
            var el = _1.default.el('img', {
                src: src,
                id: 'ihover'
            });
            el.setAttribute("referrerpolicy", "no-referrer");
            _1.default.add(Header_1.default.hover, el);
            return UI_1.default.hover({
                root: link,
                el: el,
                latestEvent: e,
                endEvents: 'mouseout click',
                height: height
            });
        });
    },
    cb: {
        click: function (e) {
            e.preventDefault();
            if (!_1.default.hasClass(this, 'embedded') && (globals_1.Conf['Floating Embeds'] || _1.default.hasClass(globals_1.doc, 'catalog-mode'))) {
                var div = void 0;
                if (!(div = Embedding.media.firstChild)) {
                    return;
                }
                _1.default.replace(div, Embedding.cb.embed(this));
                Embedding.lastEmbed = Get_1.default.postFromNode(this).nodes.root;
                return _1.default.rmClass(Embedding.dialog, 'empty');
            }
            else {
                return Embedding.cb.toggle.call(this);
            }
        },
        toggle: function () {
            if (_1.default.hasClass(this, "embedded")) {
                _1.default.rm(this.nextElementSibling);
            }
            else {
                _1.default.after(this, Embedding.cb.embed(this));
            }
            return _1.default.toggleClass(this, 'embedded');
        },
        embed: function (a) {
            // We create an element to embed
            var el, type;
            var container = _1.default.el('div', { className: 'media-embed' });
            _1.default.add(container, (el = (type = Embedding.types[a.dataset.key]).el(a)));
            // Set style values.
            el.style.cssText = (type.style != null) ?
                type.style
                :
                    'border: none; width: 640px; height: 360px;';
            return container;
        },
        catalogRemove: function () {
            var isCatalog = _1.default.hasClass(globals_1.doc, 'catalog-mode');
            if ((isCatalog && _1.default.hasClass(this, 'embedded')) || (!isCatalog && _1.default.hasClass(this, 'embed-removed'))) {
                Embedding.cb.toggle.call(this);
                return _1.default.toggleClass(this, 'embed-removed');
            }
        },
        title: function (req, data) {
            var text;
            var key = data.key, uid = data.uid, options = data.options, link = data.link, post = data.post;
            var service = Embedding.types[key].title;
            var status = req.status;
            if ([200, 304].includes(status) && service.status) {
                status = service.status(req.response)[0];
            }
            if (!status) {
                return;
            }
            text = "[".concat(key, "] ").concat((function () {
                switch (status) {
                    case 200:
                    case 304:
                        text = service.text(req.response, uid);
                        if (typeof text === 'string') {
                            return text;
                        }
                        else {
                            return text = link.textContent;
                        }
                    case 404:
                        return "Not Found";
                    case 403:
                    case 401:
                        return "Forbidden or Private";
                    default:
                        return "".concat(status, "'d");
                }
            })());
            link.dataset.original = link.textContent;
            link.textContent = text;
            for (var _i = 0, _a = post.clones; _i < _a.length; _i++) {
                var post2 = _a[_i];
                for (var _b = 0, _c = (0, __1.default)('a.linkify', post2.nodes.comment); _b < _c.length; _b++) {
                    var link2 = _c[_b];
                    if (link2.href === link.href) {
                        if (link2.dataset.original == null) {
                            link2.dataset.original = link2.textContent;
                        }
                        link2.textContent = text;
                    }
                }
            }
        }
    },
    ordered_types: [{
            key: 'audio',
            regExp: /^[^?#]+\.(?:mp3|m4a|oga|wav|flac)(?:[?#]|$)/i,
            style: '',
            el: function (a) {
                return _1.default.el('audio', {
                    controls: true,
                    preload: 'auto',
                    src: a.dataset.href
                });
            }
        },
        {
            key: 'image',
            regExp: /^[^?#]+\.(?:gif|png|jpg|jpeg|bmp|webp)(?::\w+)?(?:[?#]|$)/i,
            style: '',
            el: function (a) {
                var hrefEsc = (0, globals_1.E)(a.dataset.href);
                return _1.default.el('div', { innerHTML: "<a target=\"_blank\" href=\"".concat(hrefEsc, "\"><img src=\"").concat(hrefEsc, "\" style=\"max-width: 80vw; max-height: 80vh;\"></a>") });
            }
        },
        {
            key: 'video',
            regExp: /^[^?#]+\.(?:og[gv]|webm|mp4)(?:[?#]|$)/i,
            style: 'max-width: 80vw; max-height: 80vh;',
            el: function (a) {
                var el = _1.default.el('video', {
                    hidden: true,
                    controls: true,
                    preload: 'auto',
                    src: a.dataset.href,
                    loop: ImageHost_1.default.test(a.dataset.href.split('/')[2])
                });
                _1.default.on(el, 'loadedmetadata', function () {
                    if ((el.videoHeight === 0) && el.parentNode) {
                        return _1.default.replace(el, Embedding.types.audio.el(a));
                    }
                    else {
                        return el.hidden = false;
                    }
                });
                return el;
            }
        },
        {
            key: 'PeerTube',
            regExp: /^(\w+:\/\/[^\/]+\/videos\/watch\/\w{8}-\w{4}-\w{4}-\w{4}-\w{12})(.*)/,
            el: function (a) {
                var start;
                var options = (start = a.dataset.options.match(/[?&](start=\w+)/)) ? "?".concat(start[1]) : '';
                var el = _1.default.el('iframe', { src: a.dataset.uid.replace('/videos/watch/', '/videos/embed/') + options });
                el.setAttribute("allowfullscreen", "true");
                return el;
            }
        },
        {
            key: 'BitChute',
            regExp: /^\w+:\/\/(?:www\.)?bitchute\.com\/video\/([\w\-]+)/,
            el: function (a) {
                var el = _1.default.el('iframe', { src: "https://www.bitchute.com/embed/".concat(a.dataset.uid, "/") });
                el.setAttribute("allowfullscreen", "true");
                return el;
            }
        },
        {
            key: 'Clyp',
            regExp: /^\w+:\/\/(?:www\.)?clyp\.it\/(\w{8})/,
            style: 'border: 0; width: 640px; height: 160px;',
            el: function (a) {
                return _1.default.el('iframe', { src: "https://clyp.it/".concat(a.dataset.uid, "/widget") });
            },
            title: {
                api: function (uid) { return "https://api.clyp.it/oembed?url=https://clyp.it/".concat(uid); },
                text: function (_) { return _.title; }
            }
        },
        {
            key: 'Dailymotion',
            regExp: /^\w+:\/\/(?:(?:www\.)?dailymotion\.com\/(?:embed\/)?video|dai\.ly)\/([A-Za-z0-9]+)[^?]*(.*)/,
            el: function (a) {
                var start;
                var options = (start = a.dataset.options.match(/[?&](start=\d+)/)) ? "?".concat(start[1]) : '';
                var el = _1.default.el('iframe', { src: "//www.dailymotion.com/embed/video/".concat(a.dataset.uid).concat(options) });
                el.setAttribute("allowfullscreen", "true");
                return el;
            },
            title: {
                api: function (uid) { return "https://api.dailymotion.com/video/".concat(uid); },
                text: function (_) { return _.title; }
            },
            preview: {
                url: function (uid) { return "https://www.dailymotion.com/thumbnail/video/".concat(uid); },
                height: 240
            }
        },
        {
            key: 'Gfycat',
            regExp: /^\w+:\/\/(?:www\.)?gfycat\.com\/(?:iframe\/)?(\w+)/,
            el: function (a) {
                var el = _1.default.el('iframe', { src: "//gfycat.com/ifr/".concat(a.dataset.uid) });
                el.setAttribute("allowfullscreen", "true");
                return el;
            }
        },
        {
            key: 'Gist',
            regExp: /^\w+:\/\/gist\.github\.com\/[\w\-]+\/(\w+)/,
            style: '',
            el: (function () {
                var counter = 0;
                return function (a) {
                    var el = _1.default.el('pre', {
                        hidden: true,
                        id: "gist-embed-".concat(counter++)
                    });
                    CrossOrigin_1.default.cache("https://api.github.com/gists/".concat(a.dataset.uid), function () {
                        el.textContent = Object.values(this.response.files)[0].content;
                        el.className = 'prettyprint';
                        _1.default.global('prettyPrint', { id: el.id });
                        return el.hidden = false;
                    });
                    return el;
                };
            })(),
            title: {
                api: function (uid) { return "https://api.github.com/gists/".concat(uid); },
                text: function (_a) {
                    var files = _a.files;
                    for (var file in files) {
                        if (files.hasOwnProperty(file)) {
                            return file;
                        }
                    }
                }
            }
        },
        {
            key: 'InstallGentoo',
            regExp: /^\w+:\/\/paste\.installgentoo\.com\/view\/(?:raw\/|download\/|embed\/)?(\w+)/,
            el: function (a) {
                return _1.default.el('iframe', { src: "https://paste.installgentoo.com/view/embed/".concat(a.dataset.uid) });
            }
        },
        {
            key: 'LiveLeak',
            regExp: /^\w+:\/\/(?:\w+\.)?liveleak\.com\/.*\?.*[tif]=(\w+)/,
            el: function (a) {
                var el = _1.default.el('iframe', { src: "https://www.liveleak.com/e/".concat(a.dataset.uid), });
                el.setAttribute("allowfullscreen", "true");
                return el;
            }
        },
        {
            key: 'Loopvid',
            regExp: /^\w+:\/\/(?:www\.)?loopvid.appspot.com\/#?((?:pf|kd|lv|gd|gh|db|dx|nn|cp|wu|ig|ky|mf|m2|pc|1c|pi|ni|wl|ko|mm|ic|gc)\/[\w\-\/]+(?:,[\w\-\/]+)*|fc\/\w+\/\d+|https?:\/\/.+)/,
            style: 'max-width: 80vw; max-height: 80vh;',
            el: function (a) {
                var el = _1.default.el('video', {
                    controls: true,
                    preload: 'auto',
                    loop: true
                });
                if (/^http/.test(a.dataset.uid)) {
                    _1.default.add(el, _1.default.el('source', { src: a.dataset.uid }));
                    return el;
                }
                var _a = a.dataset.uid.match(/(\w+)\/(.*)/), _ = _a[0], host = _a[1], names = _a[2];
                var types = (function () {
                    switch (host) {
                        case 'gd':
                        case 'wu':
                        case 'fc': return [''];
                        case 'gc': return ['giant', 'fat', 'zippy'];
                        default: return ['.webm', '.mp4'];
                    }
                })();
                for (var _i = 0, _b = names.split(','); _i < _b.length; _i++) {
                    var name = _b[_i];
                    for (var _c = 0, types_1 = types; _c < types_1.length; _c++) {
                        var type = types_1[_c];
                        var base = "".concat(name).concat(type);
                        var urls = (function () {
                            switch (host) {
                                // list from src/common.py at http://loopvid.appspot.com/source.html
                                case 'pf': return ["https://kastden.org/_loopvid_media/pf/".concat(base), "https://web.archive.org/web/2/http://a.pomf.se/".concat(base)];
                                case 'kd': return ["https://kastden.org/loopvid/".concat(base)];
                                case 'lv': return ["https://lv.kastden.org/".concat(base)];
                                case 'gd': return ["https://docs.google.com/uc?export=download&id=".concat(base)];
                                case 'gh': return ["https://googledrive.com/host/".concat(base)];
                                case 'db': return ["https://dl.dropboxusercontent.com/u/".concat(base)];
                                case 'dx': return ["https://dl.dropboxusercontent.com/".concat(base)];
                                case 'nn': return ["https://kastden.org/_loopvid_media/nn/".concat(base)];
                                case 'cp': return ["https://copy.com/".concat(base)];
                                case 'wu': return ["http://webmup.com/".concat(base, "/vid.webm")];
                                case 'ig': return ["https://i.imgur.com/".concat(base)];
                                case 'ky': return ["https://kastden.org/_loopvid_media/ky/".concat(base)];
                                case 'mf': return ["https://kastden.org/_loopvid_media/mf/".concat(base), "https://web.archive.org/web/2/https://d.maxfile.ro/".concat(base)];
                                case 'm2': return ["https://kastden.org/_loopvid_media/m2/".concat(base)];
                                case 'pc': return ["https://kastden.org/_loopvid_media/pc/".concat(base), "https://web.archive.org/web/2/http://a.pomf.cat/".concat(base)];
                                case '1c': return ["http://b.1339.cf/".concat(base)];
                                case 'pi': return ["https://kastden.org/_loopvid_media/pi/".concat(base), "https://web.archive.org/web/2/https://u.pomf.is/".concat(base)];
                                case 'ni': return ["https://kastden.org/_loopvid_media/ni/".concat(base), "https://web.archive.org/web/2/https://u.nya.is/".concat(base)];
                                case 'wl': return ["http://webm.land/media/".concat(base)];
                                case 'ko': return ["https://kordy.kastden.org/loopvid/".concat(base)];
                                case 'mm': return ["https://kastden.org/_loopvid_media/mm/".concat(base), "https://web.archive.org/web/2/https://my.mixtape.moe/".concat(base)];
                                case 'ic': return ["https://media.8ch.net/file_store/".concat(base)];
                                case 'fc': return ["//".concat(ImageHost_1.default.host(), "/").concat(base, ".webm")];
                                case 'gc': return ["https://".concat(type, ".gfycat.com/").concat(name, ".webm")];
                            }
                        })();
                        for (var _d = 0, urls_1 = urls; _d < urls_1.length; _d++) {
                            var url = urls_1[_d];
                            _1.default.add(el, _1.default.el('source', { src: url }));
                        }
                    }
                }
                return el;
            }
        },
        {
            key: 'Openings.moe',
            regExp: /^\w+:\/\/openings.moe\/\?video=([^.&=]+)/,
            style: 'width: 1280px; height: 720px; max-width: 80vw; max-height: 80vh;',
            el: function (a) {
                var el = _1.default.el('iframe', { src: "https://openings.moe/?video=".concat(a.dataset.uid), });
                el.setAttribute("allowfullscreen", "true");
                return el;
            }
        },
        {
            key: 'Pastebin',
            regExp: /^\w+:\/\/(?:\w+\.)?pastebin\.com\/(?!u\/)(?:[\w.]+(?:\/|\?i\=))?(\w+)/,
            el: function (a) {
                var div;
                return div = _1.default.el('iframe', { src: "//pastebin.com/embed_iframe/".concat(a.dataset.uid) });
            }
        },
        {
            key: 'SoundCloud',
            regExp: /^\w+:\/\/(?:www\.)?(?:soundcloud\.com\/|snd\.sc\/)([\w\-\/]+)/,
            style: 'border: 0; width: 500px; height: 400px;',
            el: function (a) {
                return _1.default.el('iframe', { src: "https://w.soundcloud.com/player/?visual=true&show_comments=false&url=https%3A%2F%2Fsoundcloud.com%2F".concat(encodeURIComponent(a.dataset.uid)) });
            },
            title: {
                api: function (uid) { return "".concat(location.protocol, "//soundcloud.com/oembed?format=json&url=https%3A%2F%2Fsoundcloud.com%2F").concat(encodeURIComponent(uid)); },
                text: function (_) { return _.title; }
            }
        },
        {
            key: 'StrawPoll',
            regExp: /^\w+:\/\/(?:www\.)?strawpoll\.me\/(?:embed_\d+\/)?(\d+(?:\/r)?)/,
            style: 'border: 0; width: 600px; height: 406px;',
            el: function (a) {
                return _1.default.el('iframe', { src: "https://www.strawpoll.me/embed_1/".concat(a.dataset.uid) });
            }
        },
        {
            key: 'Streamable',
            regExp: /^\w+:\/\/(?:www\.)?streamable\.com\/(\w+)/,
            el: function (a) {
                var el = _1.default.el('iframe', { src: "https://streamable.com/o/".concat(a.dataset.uid) });
                el.setAttribute("allowfullscreen", "true");
                return el;
            },
            title: {
                api: function (uid) { return "https://api.streamable.com/oembed?url=https://streamable.com/".concat(uid); },
                text: function (_) { return _.title; }
            }
        },
        {
            key: 'TwitchTV',
            regExp: /^\w+:\/\/(?:www\.|secure\.|clips\.|m\.)?twitch\.tv\/(\w[^#\&\?]*)/,
            el: function (a) {
                var url;
                var m = a.dataset.href.match(/^\w+:\/\/(?:(clips\.)|\w+\.)?twitch\.tv\/(?:\w+\/)?(clip\/)?(\w[^#\&\?]*)/);
                if (m[1] || m[2]) {
                    url = "//clips.twitch.tv/embed?clip=".concat(m[3], "&parent=").concat(location.hostname);
                }
                else {
                    var time = void 0;
                    m = a.dataset.uid.match(/(\w+)(?:\/(?:v\/)?(\d+))?/);
                    url = "//player.twitch.tv/?".concat(m[2] ? "video=v".concat(m[2]) : "channel=".concat(m[1]), "&autoplay=false&parent=").concat(location.hostname);
                    if (time = a.dataset.href.match(/\bt=(\w+)/)) {
                        url += "&time=".concat(time[1]);
                    }
                }
                var el = _1.default.el('iframe', { src: url });
                el.setAttribute("allowfullscreen", "true");
                return el;
            }
        },
        {
            key: 'Twitter',
            regExp: /^\w+:\/\/(?:www\.|mobile\.)?(?:(?:(?:fx|vx)?twitter|(?:fixup|fixv)?x|twittpr|xcancel)\.com|nitter\.\w+.\w+)\/(\w+\/status\/\d+)/,
            style: 'border: none; width: 550px; height: 250px; overflow: hidden; resize: both;',
            el: function (a) {
                if (globals_1.Conf.XEmbedder === 'tf') {
                    var el_1 = _1.default.el('iframe');
                    _1.default.on(el_1, 'load', function () {
                        return this.contentWindow.postMessage({ element: 't', query: 'height' }, 'https://twitframe.com');
                    });
                    var onMessage = function (e) {
                        if ((e.source === el_1.contentWindow) && (e.origin === 'https://twitframe.com')) {
                            _1.default.off(window, 'message', onMessage);
                            return (cont || el_1).style.height = "".concat(+_1.default.minmax(e.data.height, 250, 0.8 * globals_1.doc.clientHeight), "px");
                        }
                    };
                    _1.default.on(window, 'message', onMessage);
                    el_1.src = "https://twitframe.com/show?url=https://twitter.com/".concat(a.dataset.uid);
                    if (_1.default.engine === 'gecko') {
                        // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=680823
                        el_1.style.cssText = 'border: none; width: 100%; height: 100%;';
                        var cont = _1.default.el('div');
                        _1.default.add(cont, el_1);
                        return cont;
                    }
                    else {
                        return el_1;
                    }
                }
                return (0, FxTwitter_1.default)(a);
            },
        },
        {
            key: 'VidLii',
            regExp: /^\w+:\/\/(?:www\.)?vidlii\.com\/watch\?v=(\w{11})/,
            style: 'border: none; width: 640px; height: 392px;',
            el: function (a) {
                var el = _1.default.el('iframe', { src: "https://www.vidlii.com/embed?v=".concat(a.dataset.uid, "&a=0") });
                el.setAttribute("allowfullscreen", "true");
                return el;
            }
        },
        {
            key: 'Vimeo',
            regExp: /^\w+:\/\/(?:www\.)?vimeo\.com\/(\d+)/,
            el: function (a) {
                var el = _1.default.el('iframe', { src: "//player.vimeo.com/video/".concat(a.dataset.uid, "?wmode=opaque") });
                el.setAttribute("allowfullscreen", "true");
                return el;
            },
            title: {
                api: function (uid) { return "https://vimeo.com/api/oembed.json?url=https://vimeo.com/".concat(uid); },
                text: function (_) { return _.title; }
            }
        },
        {
            key: 'Vine',
            regExp: /^\w+:\/\/(?:www\.)?vine\.co\/v\/(\w+)/,
            style: 'border: none; width: 500px; height: 500px;',
            el: function (a) {
                return _1.default.el('iframe', { src: "https://vine.co/v/".concat(a.dataset.uid, "/card") });
            }
        },
        {
            key: 'Vocaroo',
            regExp: /^\w+:\/\/(?:(?:www\.|old\.)?vocaroo\.com|voca\.ro)\/((?:i\/)?\w+)/,
            style: '',
            el: function (a) {
                var el = _1.default.el('iframe');
                el.width = 300;
                el.height = 60;
                el.setAttribute('frameborder', 0);
                el.src = "https://vocaroo.com/embed/".concat(a.dataset.uid.replace(/^i\//, ''), "?autoplay=0");
                return el;
            }
        },
        {
            key: 'YouTube',
            regExp: /^\w+:\/\/(?:youtu.be\/|[\w.]*youtube[\w.]*\/.*(?:v=|\bembed\/|\bv\/|shorts\/|live\/|watch\/))([\w\-]{11})(.*)/,
            el: function (a) {
                var start = a.dataset.options.match(/\b(?:star)?t\=(\w+)/);
                if (start) {
                    start = start[1];
                }
                if (start && !/^\d+$/.test(start)) {
                    start += ' 0h0m0s';
                    start = (3600 * start.match(/(\d+)h/)[1]) + (60 * start.match(/(\d+)m/)[1]) + (1 * start.match(/(\d+)s/)[1]);
                }
                var el = _1.default.el('iframe', { src: "//www.youtube.com/embed/".concat(a.dataset.uid, "?rel=0&wmode=opaque").concat(start ? '&start=' + start : '') });
                el.setAttribute("allowfullscreen", "true");
                return el;
            },
            title: {
                api: function (uid) { return "https://www.youtube.com/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D".concat(uid, "&format=json"); },
                text: function (_) { return _.title; },
                status: function (_) {
                    if (_.error) {
                        var m = _.error.match(/^(\d*)\s*(.*)/);
                        return [+m[1], m[2]];
                    }
                    else {
                        return [200, 'OK'];
                    }
                }
            },
            preview: {
                url: function (uid) { return "https://img.youtube.com/vi/".concat(uid, "/0.jpg"); },
                height: 360
            }
        }
    ],
    shouldFetchTitles: function () {
        if (!globals_1.Conf['Link Title'])
            return false;
        if (globals_1.Conf['Link Title in the catalog'])
            return true;
        return globals_1.g.VIEW !== 'catalog' && !(globals_1.g.VIEW === 'index' && globals_1.Conf['Index Mode'] === 'catalog');
    },
};
exports.default = Embedding;
