"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
var __1 = require("../platform/$$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ImageHost = {
    init: function () {
        if ((!(this.useFaster = /\S/.test(globals_1.Conf['fourchanImageHost']))) || (globals_1.g.SITE.software !== 'yotsuba') || !['index', 'thread'].includes(globals_1.g.VIEW)) {
            return;
        }
        return Callbacks_1.default.Post.push({
            name: 'Image Host Rewriting',
            cb: this.node
        });
    },
    suggestions: ['i.4cdn.org', 'is2.4chan.org'],
    host: function () {
        return globals_1.Conf['fourchanImageHost'].trim() || 'i.4cdn.org';
    },
    flashHost: function () {
        return 'i.4cdn.org';
    },
    thumbHost: function () {
        return 'i.4cdn.org';
    },
    test: function (hostname) {
        return (hostname === 'i.4cdn.org') || ImageHost.regex.test(hostname);
    },
    regex: /^is\d*\.4chan(?:nel)?\.org$/,
    node: function () {
        if (this.isClone) {
            return;
        }
        var host = ImageHost.host();
        if (this.file && ImageHost.test(this.file.url.split('/')[2]) && !/\.swf$/.test(this.file.url)) {
            this.file.link.hostname = host;
            if (this.file.thumbLink) {
                this.file.thumbLink.hostname = host;
            }
            this.file.url = this.file.link.href;
        }
        return ImageHost.fixLinks((0, __1.default)('a', this.nodes.comment));
    },
    fixLinks: function (links) {
        for (var _i = 0, links_1 = links; _i < links_1.length; _i++) {
            var link = links_1[_i];
            if (ImageHost.test(link.hostname) && !/\.swf$/.test(link.pathname)) {
                var host = ImageHost.host();
                if (link.hostname !== host) {
                    link.hostname = host;
                }
            }
        }
    }
};
exports.default = ImageHost;
