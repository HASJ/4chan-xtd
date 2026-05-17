"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var DataBoard_1 = require("../classes/DataBoard");
var RandomAccessList_1 = require("../classes/RandomAccessList");
var Get_1 = require("../General/Get");
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var QuoteYou_1 = require("../Quotelinks/QuoteYou");
var Favicon_1 = require("./Favicon");
var ThreadWatcher_1 = require("./ThreadWatcher");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Unread = {
    init: function () {
        if ((globals_1.g.VIEW !== 'thread') || (!globals_1.Conf['Unread Count'] &&
            !globals_1.Conf['Unread Favicon'] &&
            !globals_1.Conf['Unread Line'] &&
            !globals_1.Conf['Remember Last Read Post'] &&
            !globals_1.Conf['Desktop Notifications'] &&
            !globals_1.Conf['Quote Threading'])) {
            return;
        }
        if (globals_1.Conf['Remember Last Read Post']) {
            _1.default.sync('Remember Last Read Post', function (enabled) { return globals_1.Conf['Remember Last Read Post'] = enabled; });
            this.db = new DataBoard_1.default('lastReadPosts', this.sync);
        }
        this.hr = _1.default.el('hr', {
            id: 'unread-line',
            className: 'unread-line'
        });
        this.posts = new Set();
        this.postsQuotingYou = new Set();
        this.order = new RandomAccessList_1.default();
        this.position = null;
        Callbacks_1.default.Thread.push({
            name: 'Unread',
            cb: this.node
        });
        return Callbacks_1.default.Post.push({
            name: 'Unread',
            cb: this.addPost
        });
    },
    node: function () {
        var _a;
        Unread.thread = this;
        Unread.title = globals_1.d.title;
        Unread.lastReadPost = ((_a = Unread.db) === null || _a === void 0 ? void 0 : _a.get({
            boardID: this.board.ID,
            threadID: this.ID
        })) || 0;
        Unread.readCount = 0;
        for (var _i = 0, _b = this.posts.keys; _i < _b.length; _i++) {
            var ID = _b[_i];
            if (+ID <= Unread.lastReadPost) {
                Unread.readCount++;
            }
        }
        _1.default.one(globals_1.d, '4chanXInitFinished', Unread.ready);
        _1.default.on(globals_1.d, 'PostsInserted', Unread.onUpdate);
        _1.default.on(globals_1.d, 'ThreadUpdate', function (e) { if (e.detail[404]) {
            return Unread.update();
        } });
        var resetLink = _1.default.el('a', {
            href: 'javascript:;',
            className: 'unread-reset',
            textContent: 'Mark all unread'
        });
        _1.default.on(resetLink, 'click', Unread.reset);
        return Header_1.default.menu.addEntry({
            el: resetLink,
            order: 70
        });
    },
    ready: function () {
        if (globals_1.Conf['Remember Last Read Post'] && globals_1.Conf['Scroll to Last Read Post']) {
            Unread.scroll();
        }
        Unread.setLine(true);
        Unread.read();
        Unread.update();
        _1.default.on(globals_1.d, 'scroll visibilitychange', Unread.read);
        if (globals_1.Conf['Unread Line']) {
            return _1.default.on(globals_1.d, 'visibilitychange', Unread.setLine);
        }
    },
    positionPrev: function () {
        if (Unread.position) {
            return Unread.position.prev;
        }
        else {
            return Unread.order.last;
        }
    },
    scroll: function () {
        // Let the header's onload callback handle it.
        var hash;
        if ((hash = location.hash.match(/\d+/)) && hash[0] in Unread.thread.posts) {
            return;
        }
        var position = Unread.positionPrev();
        while (position) {
            var bottom = position.data.nodes.bottom;
            if (!bottom.getBoundingClientRect().height) {
                // Don't try to scroll to posts with display: none
                position = position.prev;
            }
            else {
                Header_1.default.scrollToIfNeeded(bottom, true);
                break;
            }
        }
    },
    reset: function () {
        if (Unread.lastReadPost == null) {
            return;
        }
        Unread.posts = new Set();
        Unread.postsQuotingYou = new Set();
        Unread.order = new RandomAccessList_1.default();
        Unread.position = null;
        Unread.lastReadPost = 0;
        Unread.readCount = 0;
        Unread.thread.posts.forEach(function (post) { return Unread.addPost.call(post); });
        _1.default.forceSync('Remember Last Read Post');
        if (globals_1.Conf['Remember Last Read Post'] && (!Unread.thread.isDead || Unread.thread.isArchived)) {
            Unread.db.set({
                boardID: Unread.thread.board.ID,
                threadID: Unread.thread.ID,
                val: 0
            });
        }
        Unread.updatePosition();
        Unread.setLine();
        return Unread.update();
    },
    sync: function () {
        if (Unread.lastReadPost == null) {
            return;
        }
        var lastReadPost = Unread.db.get({
            boardID: Unread.thread.board.ID,
            threadID: Unread.thread.ID,
            defaultValue: 0
        });
        if (Unread.lastReadPost >= lastReadPost) {
            return;
        }
        Unread.lastReadPost = lastReadPost;
        var postIDs = Unread.thread.posts.keys;
        for (var i = Unread.readCount, end = postIDs.length; i < end; i++) {
            var ID = +postIDs[i];
            if (!Unread.thread.posts.get(ID).isFetchedQuote) {
                if (ID > Unread.lastReadPost) {
                    break;
                }
                Unread.posts.delete(ID);
                Unread.postsQuotingYou.delete(ID);
            }
            Unread.readCount++;
        }
        Unread.updatePosition();
        Unread.setLine();
        return Unread.update();
    },
    addPost: function () {
        if (this.isFetchedQuote || this.isClone)
            return;
        Unread.order.push(this);
        if ((this.ID <= Unread.lastReadPost) || this.isHidden || QuoteYou_1.default.isYou(this))
            return;
        Unread.posts.add((Unread.posts.last = this.ID));
        Unread.addPostQuotingYou(this);
        return Unread.position != null ? Unread.position : (Unread.position = Unread.order[this.ID]);
    },
    addPostQuotingYou: function (post) {
        var _a;
        for (var _i = 0, _b = post.nodes.quotelinks; _i < _b.length; _i++) {
            var quotelink = _b[_i];
            if ((_a = QuoteYou_1.default.db) === null || _a === void 0 ? void 0 : _a.get(Get_1.default.postDataFromLink(quotelink))) {
                Unread.postsQuotingYou.add((Unread.postsQuotingYou.last = post.ID));
                Unread.openNotification(post);
                return;
            }
        }
    },
    openNotification: function (post, predicate) {
        if (predicate === void 0) { predicate = ' replied to you'; }
        if (!Header_1.default.areNotificationsEnabled) {
            return;
        }
        var notif = new Notification("".concat(post.info.nameBlock).concat(predicate), {
            body: post.commentDisplay(),
            icon: Favicon_1.default.logo
        });
        notif.onclick = function () {
            Header_1.default.scrollToIfNeeded(post.nodes.bottom, true);
            return window.focus();
        };
        return notif.onshow = function () { return setTimeout(function () { return notif.close(); }, 7 * helpers_1.SECOND); };
    },
    onUpdate: function () {
        return _1.default.queueTask(function () {
            Unread.setLine();
            Unread.read();
            return Unread.update();
        });
    },
    readSinglePost: function (post) {
        var ID = post.ID;
        if (!Unread.posts.has(ID)) {
            return;
        }
        Unread.posts.delete(ID);
        Unread.postsQuotingYou.delete(ID);
        Unread.updatePosition();
        Unread.saveLastReadPost();
        return Unread.update();
    },
    read: (0, helpers_1.debounce)(100, function (e) {
        // Update the lastReadPost when hidden posts are added to the thread.
        if (!Unread.posts.size && (Unread.readCount !== Unread.thread.posts.keys.length)) {
            Unread.saveLastReadPost();
        }
        if (globals_1.d.hidden || !Unread.posts.size) {
            return;
        }
        var count = 0;
        while (Unread.position) {
            var _a = Unread.position, ID = _a.ID, data = _a.data;
            var bottom = data.nodes.bottom;
            if (!!bottom.getBoundingClientRect().height && // post has been hidden
                (Header_1.default.getBottomOf(bottom) <= -1)) {
                break;
            } // post is completely read
            count++;
            Unread.posts.delete(ID);
            Unread.postsQuotingYou.delete(ID);
            Unread.position = Unread.position.next;
        }
        if (!count) {
            return;
        }
        Unread.updatePosition();
        Unread.saveLastReadPost();
        if (e) {
            return Unread.update();
        }
    }),
    updatePosition: function () {
        while (Unread.position && !Unread.posts.has(Unread.position.ID)) {
            Unread.position = Unread.position.next;
        }
    },
    saveLastReadPost: (0, helpers_1.debounce)(2 * helpers_1.SECOND, function () {
        var ID;
        _1.default.forceSync('Remember Last Read Post');
        if (!globals_1.Conf['Remember Last Read Post'] || !Unread.db) {
            return;
        }
        var postIDs = Unread.thread.posts.keys;
        for (var i = Unread.readCount, end = postIDs.length; i < end; i++) {
            ID = +postIDs[i];
            if (!Unread.thread.posts.get(ID).isFetchedQuote) {
                if (Unread.posts.has(ID)) {
                    break;
                }
                Unread.lastReadPost = ID;
            }
            Unread.readCount++;
        }
        if (Unread.thread.isDead && !Unread.thread.isArchived) {
            return;
        }
        return Unread.db.set({
            boardID: Unread.thread.board.ID,
            threadID: Unread.thread.ID,
            val: Unread.lastReadPost
        });
    }),
    setLine: function (force) {
        var _a;
        if (!globals_1.Conf['Unread Line']) {
            return;
        }
        if (Unread.hr.hidden || globals_1.d.hidden || (force === true)) {
            var oldPosition = Unread.linePosition;
            if (Unread.linePosition = Unread.positionPrev()) {
                if (Unread.linePosition !== oldPosition) {
                    var node = Unread.linePosition.data.nodes.bottom;
                    if (((_a = node.nextSibling) === null || _a === void 0 ? void 0 : _a.tagName) === 'BR') {
                        node = node.nextSibling;
                    }
                    _1.default.after(node, Unread.hr);
                }
            }
            else {
                _1.default.rm(Unread.hr);
            }
        }
        return Unread.hr.hidden = Unread.linePosition === Unread.order.last;
    },
    update: function () {
        var count = Unread.posts.size;
        var countQuotingYou = Unread.postsQuotingYou.size;
        if (globals_1.Conf['Unread Count']) {
            var titleQuotingYou = globals_1.Conf['Quoted Title'] && countQuotingYou ? '(!) ' : '';
            var titleCount = count || !globals_1.Conf['Hide Unread Count at (0)'] ? "(".concat(count, ") ") : '';
            var titleDead = Unread.thread.isDead ?
                Unread.title.replace('-', (Unread.thread.isArchived ? '- Archived -' : '- 404 -'))
                :
                    Unread.title;
            globals_1.d.title = "".concat(titleQuotingYou).concat(titleCount).concat(titleDead);
        }
        Unread.saveThreadWatcherCount();
        if (globals_1.Conf['Unread Favicon'] && (globals_1.g.SITE.software === 'yotsuba')) {
            var isDead = Unread.thread.isDead;
            return Favicon_1.default.set((countQuotingYou ?
                (isDead ? 'unreadDeadY' : 'unreadY')
                : count ?
                    (isDead ? 'unreadDead' : 'unread')
                    :
                        (isDead ? 'dead' : 'default')));
        }
    },
    saveThreadWatcherCount: (0, helpers_1.debounce)(2 * helpers_1.SECOND, function () {
        _1.default.forceSync('Remember Last Read Post');
        if (globals_1.Conf['Remember Last Read Post'] && (!Unread.thread.isDead || Unread.thread.isArchived)) {
            var posts = void 0;
            var quotingYou = !globals_1.Conf['Require OP Quote Link'] && QuoteYou_1.default.isYou(Unread.thread.OP) ? Unread.posts : Unread.postsQuotingYou;
            if (!quotingYou.size) {
                quotingYou.last = 0;
            }
            else if (!quotingYou.has(quotingYou.last)) {
                quotingYou.last = 0;
                posts = Unread.thread.posts.keys;
                for (var i = posts.length - 1; i >= 0; i--) {
                    if (quotingYou.has(+posts[i])) {
                        quotingYou.last = posts[i];
                        break;
                    }
                }
            }
            return ThreadWatcher_1.default.update(globals_1.g.SITE.ID, Unread.thread.board.ID, Unread.thread.ID, {
                last: Unread.thread.lastPost,
                isDead: Unread.thread.isDead,
                isArchived: Unread.thread.isArchived,
                unread: Unread.posts.size,
                quotingYou: (quotingYou.last || 0)
            });
        }
    })
};
exports.default = Unread;
