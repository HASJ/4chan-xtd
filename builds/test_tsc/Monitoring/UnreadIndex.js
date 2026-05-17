"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var DataBoard_1 = require("../classes/DataBoard");
var Get_1 = require("../General/Get");
var Header_1 = require("../General/Header");
var Index_1 = require("../General/Index");
var globals_1 = require("../globals/globals");
var ExpandThread_1 = require("../Miscellaneous/ExpandThread");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var QuoteYou_1 = require("../Quotelinks/QuoteYou");
var ThreadWatcher_1 = require("./ThreadWatcher");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var UnreadIndex = {
    lastReadPost: (0, helpers_1.dict)(),
    hr: (0, helpers_1.dict)(),
    markReadLink: (0, helpers_1.dict)(),
    init: function () {
        if ((globals_1.g.VIEW !== 'index') || !globals_1.Conf['Remember Last Read Post'] || !globals_1.Conf['Unread Line in Index']) {
            return;
        }
        this.enabled = true;
        this.db = new DataBoard_1.default('lastReadPosts', this.sync);
        Callbacks_1.default.Thread.push({
            name: 'Unread Line in Index',
            cb: this.node
        });
        _1.default.on(globals_1.d, 'IndexRefreshInternal', this.onIndexRefresh);
        return _1.default.on(globals_1.d, 'PostsInserted PostsRemoved', this.onPostsInserted);
    },
    node: function () {
        UnreadIndex.lastReadPost[this.fullID] = UnreadIndex.db.get({
            boardID: this.board.ID,
            threadID: this.ID
        }) || 0;
        if (!Index_1.default.enabled) { // let onIndexRefresh handle JSON Index
            return UnreadIndex.update(this);
        }
    },
    onIndexRefresh: function (e) {
        if (e.detail.isCatalog) {
            return;
        }
        return (function () {
            var result = [];
            for (var _i = 0, _a = e.detail.threadIDs; _i < _a.length; _i++) {
                var threadID = _a[_i];
                var thread = globals_1.g.threads.get(threadID);
                result.push(UnreadIndex.update(thread));
            }
            return result;
        })();
    },
    onPostsInserted: function (e) {
        var _a, _b;
        if (e.target === Index_1.default.root) {
            return;
        } // onIndexRefresh handles this case
        var thread = Get_1.default.threadFromNode(e.target);
        if (!thread || (thread.nodes.root !== e.target)) {
            return;
        }
        var wasVisible = !!((_a = UnreadIndex.hr[thread.fullID]) === null || _a === void 0 ? void 0 : _a.parentNode);
        UnreadIndex.update(thread);
        if (globals_1.Conf['Scroll to Last Read Post'] && (e.type === 'PostsInserted') && !wasVisible && !!((_b = UnreadIndex.hr[thread.fullID]) === null || _b === void 0 ? void 0 : _b.parentNode)) {
            return Header_1.default.scrollToIfNeeded(UnreadIndex.hr[thread.fullID], true);
        }
    },
    sync: function () {
        return globals_1.g.threads.forEach(function (thread) {
            var _a;
            var lastReadPost = UnreadIndex.db.get({
                boardID: thread.board.ID,
                threadID: thread.ID
            }) || 0;
            if (lastReadPost !== UnreadIndex.lastReadPost[thread.fullID]) {
                UnreadIndex.lastReadPost[thread.fullID] = lastReadPost;
                if ((_a = thread.nodes.root) === null || _a === void 0 ? void 0 : _a.parentNode) {
                    return UnreadIndex.update(thread);
                }
            }
        });
    },
    update: function (thread) {
        var divider;
        var lastReadPost = UnreadIndex.lastReadPost[thread.fullID];
        var repliesShown = 0;
        var repliesRead = 0;
        var firstUnread = null;
        thread.posts.forEach(function (post) {
            if (post.isReply && thread.nodes.root.contains(post.nodes.root)) {
                repliesShown++;
                if (post.ID <= lastReadPost) {
                    return repliesRead++;
                }
                else if ((!firstUnread || (post.ID < firstUnread.ID)) && !post.isHidden && !QuoteYou_1.default.isYou(post)) {
                    return firstUnread = post;
                }
            }
        });
        var hr = UnreadIndex.hr[thread.fullID];
        if (firstUnread && (repliesRead || ((lastReadPost === thread.OP.ID) && (!(0, _1.default)(globals_1.g.SITE.selectors.summary, thread.nodes.root) || thread.ID in ExpandThread_1.default.statuses)))) {
            if (!hr) {
                hr = (UnreadIndex.hr[thread.fullID] = _1.default.el('hr', { className: 'unread-line' }));
            }
            _1.default.before(firstUnread.nodes.root, hr);
        }
        else {
            _1.default.rm(hr);
        }
        var hasUnread = repliesShown ?
            firstUnread || !repliesRead
            : Index_1.default.enabled ?
                thread.lastPost > lastReadPost
                :
                    thread.OP.ID > lastReadPost;
        thread.nodes.root.classList.toggle('unread-thread', hasUnread);
        var link = UnreadIndex.markReadLink[thread.fullID];
        if (!link) {
            link = (UnreadIndex.markReadLink[thread.fullID] = _1.default.el('a', {
                className: 'unread-mark-read brackets-wrap',
                href: 'javascript:;',
                textContent: 'Mark Read'
            }));
            _1.default.on(link, 'click', UnreadIndex.markRead);
        }
        if (divider = (0, _1.default)(globals_1.g.SITE.selectors.threadDivider, thread.nodes.root)) { // divider inside thread as in Tinyboard
            return _1.default.before(divider, link);
        }
        else {
            return _1.default.add(thread.nodes.root, link);
        }
    },
    markRead: function () {
        var thread = Get_1.default.threadFromNode(this);
        UnreadIndex.lastReadPost[thread.fullID] = thread.lastPost;
        UnreadIndex.db.set({
            boardID: thread.board.ID,
            threadID: thread.ID,
            val: thread.lastPost
        });
        _1.default.rm(UnreadIndex.hr[thread.fullID]);
        thread.nodes.root.classList.remove('unread-thread');
        return ThreadWatcher_1.default.update(globals_1.g.SITE.ID, thread.board.ID, thread.ID, {
            last: thread.lastPost,
            unread: 0,
            quotingYou: 0
        });
    }
};
exports.default = UnreadIndex;
