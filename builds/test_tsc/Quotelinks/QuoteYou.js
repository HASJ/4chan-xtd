"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var DataBoard_1 = require("../classes/DataBoard");
var Notice_1 = require("../classes/Notice");
var Get_1 = require("../General/Get");
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var Menu_1 = require("../Menu/Menu");
var ExpandComment_1 = require("../Miscellaneous/ExpandComment");
var ScrollMarkers_1 = require("../Miscellaneous/ScrollMarkers");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var PostRedirect_1 = require("../Posting/PostRedirect");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var QuoteYou = {
    init: function () {
        if (!globals_1.Conf['Remember Your Posts']) {
            return;
        }
        this.db = new DataBoard_1.default('yourPosts');
        _1.default.sync('Remember Your Posts', function (enabled) { return globals_1.Conf['Remember Your Posts'] = enabled; });
        _1.default.on(globals_1.d, 'QRPostSuccessful', function (e) {
            var cb = PostRedirect_1.default.delay();
            return _1.default.get('Remember Your Posts', globals_1.Conf['Remember Your Posts'], function (items) {
                if (!items['Remember Your Posts']) {
                    return;
                }
                var _a = e.detail, boardID = _a.boardID, threadID = _a.threadID, postID = _a.postID;
                return QuoteYou.db.set({ boardID: boardID, threadID: threadID, postID: postID, val: true }, cb);
            });
        });
        if (!['index', 'thread', 'archive'].includes(globals_1.g.VIEW)) {
            return;
        }
        if (globals_1.Conf['Highlight Own Posts']) {
            _1.default.addClass(globals_1.doc, 'highlight-own');
        }
        if (globals_1.Conf['Highlight Posts Quoting You']) {
            _1.default.addClass(globals_1.doc, 'highlight-you');
        }
        if (globals_1.Conf['Comment Expansion']) {
            ExpandComment_1.default.callbacks.push(this.node);
        }
        // \u00A0 is nbsp
        this.mark = _1.default.el('span', {
            textContent: '\u00A0(You)',
            className: 'qmark-you'
        });
        Callbacks_1.default.Post.push({
            name: 'Mark Quotes of You',
            cb: this.node
        });
        QuoteYou.menu.init();
    },
    isYou: function (post) {
        var _a;
        return !!((_a = QuoteYou.db) === null || _a === void 0 ? void 0 : _a.get({
            boardID: post.boardID,
            threadID: post.threadID,
            postID: post.ID
        }));
    },
    node: function () {
        if (this.isClone) {
            return;
        }
        if (QuoteYou.isYou(this)) {
            _1.default.addClass(this.nodes.root, 'yourPost');
            ScrollMarkers_1.default.markScroll();
        }
        // Stop there if there's no quotes in that post.
        if (!this.quotes.length) {
            return;
        }
        for (var _i = 0, _a = this.nodes.quotelinks; _i < _a.length; _i++) {
            var quotelink = _a[_i];
            if (QuoteYou.db.get(Get_1.default.postDataFromLink(quotelink))) {
                if (globals_1.Conf['Mark Quotes of You']) {
                    _1.default.add(quotelink, QuoteYou.mark.cloneNode(true));
                }
                _1.default.addClass(quotelink, 'you');
                _1.default.addClass(this.nodes.root, 'quotesYou');
            }
        }
    },
    menu: {
        init: function () {
            var _a;
            var label = _1.default.el('label', { className: 'toggle-you' }, { innerHTML: '<input type="checkbox"> You' });
            var input = (0, _1.default)('input', label);
            _1.default.on(input, 'change', QuoteYou.menu.toggle);
            (_a = Menu_1.default.menu) === null || _a === void 0 ? void 0 : _a.addEntry({
                el: label,
                order: 80,
                open: function (post) {
                    QuoteYou.menu.post = (post.origin || post);
                    input.checked = QuoteYou.isYou(post);
                    return true;
                }
            });
        },
        toggle: function () {
            var post = QuoteYou.menu.post;
            var data = { boardID: post.board.ID, threadID: post.thread.ID, postID: post.ID, val: true };
            if (this.checked) {
                QuoteYou.db.set(data);
            }
            else {
                QuoteYou.db.delete(data);
            }
            for (var _i = 0, _a = [post].concat(post.clones); _i < _a.length; _i++) {
                var clone = _a[_i];
                clone.nodes.root.classList.toggle('yourPost', this.checked);
            }
            for (var _b = 0, _c = Get_1.default.allQuotelinksLinkingTo(post); _b < _c.length; _b++) {
                var quotelink = _c[_b];
                if (this.checked) {
                    if (globals_1.Conf['Mark Quotes of You']) {
                        _1.default.add(quotelink, QuoteYou.mark.cloneNode(true));
                    }
                }
                else {
                    _1.default.rm((0, _1.default)('.qmark-you', quotelink));
                }
                quotelink.classList.toggle('you', this.checked);
                if (_1.default.hasClass(quotelink, 'quotelink')) {
                    var quoter = Get_1.default.postFromNode(quotelink).nodes.root;
                    quoter.classList.toggle('quotesYou', !!(0, _1.default)('.quotelink.you', quoter));
                }
            }
            ScrollMarkers_1.default.markScroll();
        }
    },
    cb: {
        seek: function (type) {
            var highlighted, post;
            var result;
            var highlight = globals_1.g.SITE.classes.highlight;
            if (highlighted = (0, _1.default)(".".concat(highlight))) {
                _1.default.rmClass(highlighted, highlight);
            }
            if (!QuoteYou.lastRead || !globals_1.doc.contains(QuoteYou.lastRead) || !_1.default.hasClass(QuoteYou.lastRead, 'quotesYou')) {
                if (!(post = (QuoteYou.lastRead = (0, _1.default)('.quotesYou')))) {
                    new Notice_1.default('warning', 'No posts are currently quoting you, loser.', 20);
                    return;
                }
                if (QuoteYou.cb.scroll(post)) {
                    return;
                }
            }
            else {
                post = QuoteYou.lastRead;
            }
            var str = "".concat(type, "::div[contains(@class,'quotesYou')]");
            while (post = (result = _1.default.X(str, post)).snapshotItem(type === 'preceding' ? result.snapshotLength - 1 : 0)) {
                if (QuoteYou.cb.scroll(post)) {
                    return;
                }
            }
            var posts = (0, __1.default)('.quotesYou');
            return QuoteYou.cb.scroll(posts[type === 'following' ? 0 : posts.length - 1]);
        },
        scroll: function (root) {
            var post = Get_1.default.postFromRoot(root);
            if (!post.nodes.post.getBoundingClientRect().height) {
                return false;
            }
            else {
                QuoteYou.lastRead = root;
                location.href = Get_1.default.url('post', post);
                Header_1.default.scrollTo(post.nodes.post);
                if (post.isReply) {
                    var sel = "".concat(globals_1.g.SITE.selectors.postContainer).concat(globals_1.g.SITE.selectors.highlightable.reply);
                    var node = post.nodes.root;
                    if (!node.matches(sel)) {
                        node = (0, _1.default)(sel, node);
                    }
                    _1.default.addClass(node, globals_1.g.SITE.classes.highlight);
                }
                return true;
            }
        }
    }
};
exports.default = QuoteYou;
