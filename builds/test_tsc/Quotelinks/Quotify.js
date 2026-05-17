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
var Redirect_1 = require("../Archive/Redirect");
var Callbacks_1 = require("../classes/Callbacks");
var Post_1 = require("../classes/Post");
var globals_1 = require("../globals/globals");
var ExpandComment_1 = require("../Miscellaneous/ExpandComment");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Quotify = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Resurrect Quotes']) {
            return;
        }
        _1.default.addClass(globals_1.doc, 'resurrect-quotes');
        if (globals_1.Conf['Comment Expansion']) {
            ExpandComment_1.default.callbacks.push(this.node);
        }
        return Callbacks_1.default.Post.push({
            name: 'Resurrect Quotes',
            cb: this.node
        });
    },
    node: function () {
        if (this.isClone) {
            this.nodes.archivelinks = (0, __1.default)('a.linkify.quotelink', this.nodes.comment);
            return;
        }
        for (var _i = 0, _a = (0, __1.default)('a.linkify', this.nodes.comment); _i < _a.length; _i++) {
            var link = _a[_i];
            Quotify.parseArchivelink.call(this, link);
        }
        for (var _b = 0, _c = (0, __1.default)('.deadlink', this.nodes.comment); _b < _c.length; _b++) {
            var deadlink = _c[_b];
            Quotify.parseDeadlink.call(this, deadlink);
        }
    },
    parseArchivelink: function (link) {
        var m;
        if (!(m = link.pathname.match(/^\/([^/]+)\/thread\/S?(\d+)\/?$/))) {
            return;
        }
        if (['boards.4chan.org', 'boards.4channel.org'].includes(link.hostname)) {
            return;
        }
        var boardID = m[1];
        var threadID = m[2];
        var postID = link.hash.match(/^#[pq]?(\d+)$|$/)[1] || threadID;
        if (Redirect_1.default.to('post', { boardID: boardID, postID: postID })) {
            _1.default.addClass(link, 'quotelink');
            _1.default.extend(link.dataset, { boardID: boardID, threadID: threadID, postID: postID });
            return this.nodes.archivelinks.push(link);
        }
    },
    parseDeadlink: function (deadlink) {
        var _a;
        var a, m, post, postID;
        if (_1.default.hasClass(deadlink.parentNode, 'prettyprint')) {
            // Don't quotify deadlinks inside code tags,
            // un-`span` them.
            // This won't be necessary once 4chan
            // stops quotifying inside code tags:
            // https://github.com/4chan/4chan-JS/issues/77
            Quotify.fixDeadlink(deadlink);
            return;
        }
        var quote = deadlink.textContent;
        if (!(postID = (_a = quote.match(/\d+$/)) === null || _a === void 0 ? void 0 : _a[0])) {
            return;
        }
        if (postID[0] === '0') {
            // Fix quotelinks that start with a `0`.
            Quotify.fixDeadlink(deadlink);
            return;
        }
        var boardID = (m = quote.match(/^>>>\/([a-z\d]+)/)) ?
            m[1]
            :
                this.board.ID;
        var quoteID = "".concat(boardID, ".").concat(postID);
        if (post = globals_1.g.posts.get(quoteID)) {
            if (!post.isDead) {
                // Don't (Dead) when quotifying in an archived post,
                // and we know the post still exists.
                a = _1.default.el('a', {
                    href: globals_1.g.SITE.Build.postURL(boardID, post.thread.ID, postID),
                    className: 'quotelink',
                    textContent: quote
                });
            }
            else {
                // Replace the .deadlink span if we can redirect.
                a = _1.default.el('a', {
                    href: globals_1.g.SITE.Build.postURL(boardID, post.thread.ID, postID),
                    className: 'quotelink deadlink',
                    textContent: quote
                });
                _1.default.add(a, Post_1.default.deadMark.cloneNode(true));
                _1.default.extend(a.dataset, { boardID: boardID, threadID: post.thread.ID, postID: postID });
            }
        }
        else {
            var redirect = Redirect_1.default.to('thread', { boardID: boardID, threadID: 0, postID: postID });
            var fetchable = Redirect_1.default.to('post', { boardID: boardID, postID: postID });
            if (redirect || fetchable) {
                // Replace the .deadlink span if we can redirect or fetch the post.
                a = _1.default.el('a', {
                    href: redirect || 'javascript:;',
                    className: 'deadlink',
                    textContent: quote
                });
                _1.default.add(a, Post_1.default.deadMark.cloneNode(true));
                if (fetchable) {
                    // Make it function as a normal quote if we can fetch the post.
                    _1.default.addClass(a, 'quotelink');
                    _1.default.extend(a.dataset, { boardID: boardID, postID: postID });
                }
            }
        }
        if (!this.quotes.includes(quoteID)) {
            this.quotes.push(quoteID);
        }
        if (!a) {
            _1.default.add(deadlink, Post_1.default.deadMark.cloneNode(true));
            return;
        }
        _1.default.replace(deadlink, a);
        if (_1.default.hasClass(a, 'quotelink')) {
            return this.nodes.quotelinks.push(a);
        }
    },
    fixDeadlink: function (deadlink) {
        var el;
        if (!(el = deadlink.previousSibling) || (el.nodeName === 'BR')) {
            var green = _1.default.el('span', { className: 'quote' });
            _1.default.before(deadlink, green);
            _1.default.add(green, deadlink);
        }
        return _1.default.replace(deadlink, __spreadArray([], deadlink.childNodes, true));
    }
};
exports.default = Quotify;
