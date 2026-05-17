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
var Callbacks_1 = require("../classes/Callbacks");
var Fetcher_1 = require("../classes/Fetcher");
var Get_1 = require("../General/Get");
var globals_1 = require("../globals/globals");
var ExpandComment_1 = require("../Miscellaneous/ExpandComment");
var Unread_1 = require("../Monitoring/Unread");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var QuoteInline = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Quote Inlining']) {
            return;
        }
        if (globals_1.Conf['Comment Expansion']) {
            ExpandComment_1.default.callbacks.push(this.node);
        }
        return Callbacks_1.default.Post.push({
            name: 'Quote Inlining',
            cb: this.node
        });
    },
    node: function () {
        var process = QuoteInline.process;
        var isClone = this.isClone;
        for (var _i = 0, _a = this.nodes.quotelinks.concat(__spreadArray([], this.nodes.backlinks, true), this.nodes.archivelinks); _i < _a.length; _i++) {
            var link = _a[_i];
            process(link, isClone);
        }
    },
    process: function (link, clone) {
        if (globals_1.Conf['Quote Hash Navigation']) {
            if (!clone) {
                _1.default.after(link, QuoteInline.qiQuote(link, _1.default.hasClass(link, 'filtered')));
            }
        }
        return _1.default.on(link, 'click', QuoteInline.toggle);
    },
    qiQuote: function (link, hidden) {
        var name = "hashlink";
        if (hidden) {
            name += " filtered";
        }
        return _1.default.el('a', {
            className: name,
            textContent: '#',
            href: link.href
        });
    },
    toggle: function (e) {
        var _a;
        if (_1.default.modifiedClick(e)) {
            return;
        }
        var _b = Get_1.default.postDataFromLink(this), boardID = _b.boardID, threadID = _b.threadID, postID = _b.postID;
        if (globals_1.Conf['Inline Cross-thread Quotes Only'] && (globals_1.g.VIEW === 'thread') && ((_a = globals_1.g.posts.get("".concat(boardID, ".").concat(postID))) === null || _a === void 0 ? void 0 : _a.nodes.root.offsetParent)) {
            return;
        } // exists and not hidden
        if (_1.default.hasClass(globals_1.doc, 'catalog-mode')) {
            return;
        }
        e.preventDefault();
        var quoter = Get_1.default.postFromNode(this);
        var context = quoter.context;
        if (_1.default.hasClass(this, 'inlined')) {
            QuoteInline.rm(this, boardID, threadID, postID, context);
        }
        else {
            if (_1.default.x("ancestor::div[@data-full-i-d='".concat(boardID, ".").concat(postID, "']"), this)) {
                return;
            }
            QuoteInline.add(this, boardID, threadID, postID, context, quoter);
        }
        return this.classList.toggle('inlined');
    },
    findRoot: function (quotelink, isBacklink) {
        if (isBacklink) {
            return _1.default.x('ancestor::*[parent::*[contains(@class,"post")]][1]', quotelink);
        }
        else {
            return _1.default.x('ancestor-or-self::*[parent::blockquote][1]', quotelink);
        }
    },
    add: function (quotelink, boardID, threadID, postID, context, quoter) {
        var post;
        var isBacklink = _1.default.hasClass(quotelink, 'backlink');
        var inline = _1.default.el('div', { className: 'inline' });
        inline.dataset.fullID = "".concat(boardID, ".").concat(postID);
        var root = QuoteInline.findRoot(quotelink, isBacklink);
        _1.default.after(root, inline);
        var qroot = _1.default.x('ancestor::*[contains(@class,"postContainer")][1]', root);
        _1.default.addClass(qroot, 'hasInline');
        new Fetcher_1.default(boardID, threadID, postID, inline, quoter);
        if (!((post = globals_1.g.posts.get("".concat(boardID, ".").concat(postID))) &&
            (context.thread === post.thread))) {
            return;
        }
        // Hide forward post if it's a backlink of a post in this thread.
        // Will only unhide if there's no inlined backlinks of it anymore.
        if (isBacklink && globals_1.Conf['Forward Hiding']) {
            _1.default.addClass(post.nodes.root, 'forwarded');
            post.forwarded++ || (post.forwarded = 1);
        }
        // Decrease the unread count if this post
        // is in the array of unread posts.
        if (!Unread_1.default.posts) {
            return;
        }
        return Unread_1.default.readSinglePost(post);
    },
    rm: function (quotelink, boardID, threadID, postID, context) {
        var _a;
        var el;
        var inlined;
        var isBacklink = _1.default.hasClass(quotelink, 'backlink');
        // Select the corresponding inlined quote, and remove it.
        var root = QuoteInline.findRoot(quotelink, isBacklink);
        root = _1.default.x("following-sibling::div[@data-full-i-d='".concat(boardID, ".").concat(postID, "'][1]"), root);
        var qroot = _1.default.x('ancestor::*[contains(@class,"postContainer")][1]', root);
        var parentNode = root.parentNode;
        _1.default.rm(root);
        _1.default.event('PostsRemoved', null, parentNode);
        if (!(0, _1.default)('.inline', qroot)) {
            _1.default.rmClass(qroot, 'hasInline');
        }
        // Stop if it only contains text.
        if (!(el = root.firstElementChild)) {
            return;
        }
        // Dereference clone.
        var post = globals_1.g.posts.get("".concat(boardID, ".").concat(postID));
        post.rmClone(el.dataset.clone);
        // Decrease forward count and unhide.
        if (globals_1.Conf['Forward Hiding'] &&
            isBacklink &&
            (context.thread === globals_1.g.threads.get("".concat(boardID, ".").concat(threadID))) &&
            !--post.forwarded) {
            delete post.forwarded;
            _1.default.rmClass(post.nodes.root, 'forwarded');
        }
        // Repeat.
        while ((inlined = (0, _1.default)('.inlined', el))) {
            (_a = Get_1.default.postDataFromLink(inlined), boardID = _a.boardID, threadID = _a.threadID, postID = _a.postID);
            QuoteInline.rm(inlined, boardID, threadID, postID, context);
            _1.default.rmClass(inlined, 'inlined');
        }
    }
};
exports.default = QuoteInline;
