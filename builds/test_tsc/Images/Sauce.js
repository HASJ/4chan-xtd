"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Notice_1 = require("../classes/Notice");
var Filter_1 = require("../Filtering/Filter");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Sauce = {
    init: function () {
        var link;
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Sauce']) {
            return;
        }
        _1.default.addClass(globals_1.doc, 'show-sauce');
        var links = [];
        for (var _i = 0, _a = globals_1.Conf['sauces'].split('\n'); _i < _a.length; _i++) {
            link = _a[_i];
            var linkData;
            if ((link[0] !== '#') && (linkData = this.parseLink(link))) {
                links.push(linkData);
            }
        }
        if (!links.length) {
            return;
        }
        this.links = links;
        this.link = _1.default.el('a', {
            target: '_blank',
            className: 'sauce'
        });
        return Callbacks_1.default.Post.push({
            name: 'Sauce',
            cb: this.node
        });
    },
    parseLink: function (link) {
        var _a;
        if (!(link = link.trim())) {
            return null;
        }
        var parts = (0, helpers_1.dict)();
        var iterable = link.split(/;(?=(?:text|boards|types|regexp|sandbox):?)/);
        for (var i = 0; i < iterable.length; i++) {
            var part = iterable[i];
            if (i === 0) {
                parts['url'] = part;
            }
            else {
                var m = part.match(/^(\w*):?(.*)$/);
                parts[m[1]] = m[2];
            }
        }
        if (!parts['text']) {
            parts['text'] = ((_a = parts['url'].match(/(\w+)\.\w+\//)) === null || _a === void 0 ? void 0 : _a[1]) || '?';
        }
        if ('boards' in parts) {
            parts['boards'] = Filter_1.default.parseBoards(parts['boards']);
        }
        if ('regexp' in parts) {
            try {
                var regexp = void 0;
                if (regexp = parts['regexp'].match(/^\/(.*)\/(\w*)$/)) {
                    parts['regexp'] = RegExp(regexp[1], regexp[2]);
                }
                else {
                    parts['regexp'] = RegExp(parts['regexp']);
                }
            }
            catch (err) {
                new Notice_1.default('warning', [
                    _1.default.tn("Invalid regexp for Sauce link:"),
                    _1.default.el('br'),
                    _1.default.tn(link),
                    _1.default.el('br'),
                    _1.default.tn(err.message)
                ], 60);
                return null;
            }
        }
        return parts;
    },
    createSauceLink: function (link, post, file) {
        var _a, _b;
        var a, matches, needle;
        var ext = file.url.match(/[^.]*$/)[0];
        var parts = (0, helpers_1.dict)();
        _1.default.extend(parts, link);
        if (!!parts['boards'] && !parts['boards']["".concat(post.siteID, "/").concat(post.boardID)] && !parts['boards']["".concat(post.siteID, "/*")]) {
            return null;
        }
        if (!!parts['types'] && (needle = ext, !parts['types'].split(',').includes(needle))) {
            return null;
        }
        if (!!parts['regexp'] && (!(matches = file.name.match(parts['regexp'])))) {
            return null;
        }
        var missing = [];
        for (var _i = 0, _c = ['url', 'text']; _i < _c.length; _i++) {
            var key = _c[_i];
            parts[key] = parts[key].replace(/%(T?URL|IMG|[sh]?MD5|board|name|%|semi|\$\d+)/g, function (orig, parameter) {
                var type;
                if (parameter[0] === '$') {
                    if (!matches) {
                        return orig;
                    }
                    type = matches[parameter.slice(1)] || '';
                }
                else {
                    type = Sauce.formatters[parameter](post, file, ext);
                    if ((type == null)) {
                        missing.push(parameter);
                        return '';
                    }
                }
                if ((key === 'url') && !['%', 'semi'].includes(parameter)) {
                    if (/^javascript:/i.test(parts['url'])) {
                        type = JSON.stringify(type);
                    }
                    type = encodeURIComponent(type);
                }
                return type;
            });
        }
        if (((_b = (_a = globals_1.g.SITE).areMD5sDeferred) === null || _b === void 0 ? void 0 : _b.call(_a, post.board)) && missing.length && !missing.filter(function (x) { return !/^.?MD5$/.test(x); }).length) {
            a = Sauce.link.cloneNode(false);
            a.dataset.skip = '1';
            return a;
        }
        if (missing.length) {
            return null;
        }
        a = Sauce.link.cloneNode(false);
        a.href = parts['url'];
        a.textContent = parts['text'];
        if (/^javascript:/i.test(parts['url'])) {
            a.removeAttribute('target');
        }
        return a;
    },
    node: function () {
        if (this.isClone) {
            return;
        }
        for (var _i = 0, _a = this.files; _i < _a.length; _i++) {
            var file = _a[_i];
            Sauce.file(this, file);
        }
    },
    file: function (post, file) {
        var link, node;
        var nodes = [];
        var skipped = [];
        for (var _i = 0, _a = Sauce.links; _i < _a.length; _i++) {
            link = _a[_i];
            if (node = Sauce.createSauceLink(link, post, file)) {
                nodes.push(_1.default.tn(' '), node);
                if (node.dataset.skip) {
                    skipped.push([link, node]);
                }
            }
        }
        _1.default.add(file.text, nodes);
        if (skipped.length) {
            var observer = new MutationObserver(function () {
                var _a;
                if (file.text.dataset.md5) {
                    for (var _i = 0, skipped_1 = skipped; _i < skipped_1.length; _i++) {
                        _a = skipped_1[_i], link = _a[0], node = _a[1];
                        var node2;
                        if (node2 = Sauce.createSauceLink(link, post, file)) {
                            _1.default.replace(node, node2);
                        }
                    }
                    return observer.disconnect();
                }
            });
            return observer.observe(file.text, { attributes: true });
        }
    },
    formatters: {
        TURL: function (post, file) { return file.thumbURL; },
        URL: function (post, file) { return file.url; },
        IMG: function (post, file, ext) { if (['gif', 'jpg', 'jpeg', 'png'].includes(ext)) {
            return file.url;
        }
        else {
            return file.thumbURL;
        } },
        MD5: function (post, file) { return file.MD5; },
        sMD5: function (post, file) { var _a; return (_a = file.MD5) === null || _a === void 0 ? void 0 : _a.replace(/[+/=]/g, function (c) { return ({ '+': '-', '/': '_', '=': '' })[c]; }); },
        hMD5: function (post, file) {
            if (file.MD5) {
                return Array.from(atob(file.MD5), function (c) { return c.charCodeAt(0).toString(16).padStart(2, '0'); }).join('');
            }
        },
        board: function (post) { return post.board.ID; },
        name: function (post, file) { return file.name; },
        '%': function () { return '%'; },
        semi: function () { return ';'; }
    }
};
exports.default = Sauce;
