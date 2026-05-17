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
var ThreadWatcher_html_1 = require("./ThreadWatcher/ThreadWatcher.html");
var _1 = require("../platform/$");
var Board_1 = require("../classes/Board");
var Callbacks_1 = require("../classes/Callbacks");
var DataBoard_1 = require("../classes/DataBoard");
var Thread_1 = require("../classes/Thread");
var Filter_1 = require("../Filtering/Filter");
var __1 = require("../platform/$$");
var Config_1 = require("../config/Config");
var CrossOrigin_1 = require("../platform/CrossOrigin");
var PostRedirect_1 = require("../Posting/PostRedirect");
var QuoteYou_1 = require("../Quotelinks/QuoteYou");
var Unread_1 = require("./Unread");
var UnreadIndex_1 = require("./UnreadIndex");
var Header_1 = require("../General/Header");
var Index_1 = require("../General/Index");
var globals_1 = require("../globals/globals");
var Menu_1 = require("../Menu/Menu");
var UI_1 = require("../General/UI");
var Get_1 = require("../General/Get");
var helpers_1 = require("../platform/helpers");
var icon_1 = require("../Icons/icon");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ThreadWatcher = {
    init: function () {
        var sc;
        if (!(this.enabled = globals_1.Conf['Thread Watcher'])) {
            return;
        }
        this.shortcut = (sc = _1.default.el('a', {
            id: 'watcher-link',
            title: 'Thread Watcher',
            href: 'javascript:;',
        }));
        icon_1.default.set(this.shortcut, 'eye', 'Watcher');
        this.db = new DataBoard_1.default('watchedThreads', this.refresh, true);
        this.dbLM = new DataBoard_1.default('watcherLastModified', null, true);
        this.dialog = UI_1.default.dialog('thread-watcher', { innerHTML: ThreadWatcher_html_1.default });
        this.status = (0, _1.default)('#watcher-status', this.dialog);
        this.list = this.dialog.lastElementChild;
        this.refreshButton = (0, _1.default)('.refresh', this.dialog);
        this.menuButton = (0, _1.default)('.menu-button', this.dialog);
        this.closeButton = (0, _1.default)('.move > .close', this.dialog);
        this.unreaddb = Unread_1.default.db || UnreadIndex_1.default.db || new DataBoard_1.default('lastReadPosts');
        this.unreadEnabled = globals_1.Conf['Remember Last Read Post'];
        icon_1.default.set(this.refreshButton, 'refresh');
        icon_1.default.set(this.menuButton, 'caretDown');
        icon_1.default.set(this.closeButton, 'xmark');
        _1.default.on(globals_1.d, 'QRPostSuccessful', this.cb.post);
        _1.default.on(sc, 'click', this.toggleWatcher);
        _1.default.on(this.refreshButton, 'click', this.buttonFetchAll);
        _1.default.on(this.closeButton, 'click', this.toggleWatcher);
        this.menu.addHeaderMenuEntry();
        _1.default.onExists(globals_1.doc, 'body', this.addDialog);
        switch (globals_1.g.VIEW) {
            case 'index':
                _1.default.on(globals_1.d, 'IndexUpdate', this.cb.onIndexUpdate);
                break;
            case 'thread':
                _1.default.on(globals_1.d, 'ThreadUpdate', this.cb.onThreadRefresh);
                break;
        }
        if (globals_1.Conf['Fixed Thread Watcher']) {
            _1.default.addClass(globals_1.doc, 'fixed-watcher');
        }
        if (!globals_1.Conf['Persistent Thread Watcher']) {
            _1.default.addClass(ThreadWatcher.shortcut, 'disabled');
            this.dialog.hidden = true;
        }
        Header_1.default.addShortcut('watcher', sc, 510);
        ThreadWatcher.initLastModified();
        ThreadWatcher.fetchAuto();
        _1.default.on(window, 'visibilitychange focus', function () { return _1.default.queueTask(ThreadWatcher.fetchAuto); });
        if (globals_1.Conf['Menu'] && Index_1.default.enabled) {
            Menu_1.default.menu.addEntry({
                el: _1.default.el('a', {
                    href: 'javascript:;',
                    className: 'has-shortcut-text'
                }, { innerHTML: '<span></span><span class="shortcut-text">Alt+click</span>' }),
                order: 6,
                open: function (_a) {
                    var thread = _a.thread;
                    if (globals_1.Conf['Index Mode'] !== 'catalog') {
                        return false;
                    }
                    this.el.firstElementChild.textContent = ThreadWatcher.isWatched(thread) ?
                        'Unwatch'
                        :
                            'Watch';
                    if (this.cb) {
                        _1.default.off(this.el, 'click', this.cb);
                    }
                    this.cb = function () {
                        _1.default.event('CloseMenu');
                        return ThreadWatcher.toggle(thread, true);
                    };
                    _1.default.on(this.el, 'click', this.cb);
                    return true;
                }
            });
        }
        if (!['index', 'thread'].includes(globals_1.g.VIEW)) {
            return;
        }
        Callbacks_1.default.Post.push({
            name: 'Thread Watcher',
            cb: this.node
        });
        return Callbacks_1.default.CatalogThread.push({
            name: 'Thread Watcher',
            cb: this.catalogNode
        });
    },
    isWatched: function (thread) {
        var _a;
        return !!((_a = ThreadWatcher.db) === null || _a === void 0 ? void 0 : _a.get({ boardID: thread.board.ID, threadID: thread.ID }));
    },
    isWatchedRaw: function (boardID, threadID) {
        var _a;
        return !!((_a = ThreadWatcher.db) === null || _a === void 0 ? void 0 : _a.get({ boardID: boardID, threadID: threadID }));
    },
    setToggler: function (toggler, isWatched) {
        toggler.classList.toggle('watched', isWatched);
        return toggler.title = "".concat(isWatched ? 'Unwatch' : 'Watch', " Thread");
    },
    node: function () {
        var _this = this;
        var toggler;
        if (this.isReply) {
            return;
        }
        if (this.isClone) {
            toggler = (0, _1.default)('.watch-thread-link', this.nodes.info);
        }
        else {
            toggler = _1.default.el('button', {
                type: 'button',
                className: 'watch-thread-link'
            });
            icon_1.default.set(toggler, 'heart');
            _1.default.before((0, _1.default)('input', this.nodes.info), toggler);
        }
        var siteID = globals_1.g.SITE.ID;
        var boardID = this.board.ID;
        var threadID = this.thread.ID;
        var data = ThreadWatcher.db.get({ siteID: siteID, boardID: boardID, threadID: threadID });
        ThreadWatcher.setToggler(toggler, !!data);
        _1.default.on(toggler, 'click', ThreadWatcher.cb.toggle);
        // Add missing excerpt for threads added by Auto Watch
        if (data && (data.excerpt == null)) {
            return _1.default.queueTask(function () {
                return ThreadWatcher.update(siteID, boardID, threadID, { excerpt: Get_1.default.threadExcerpt(_this.thread) });
            });
        }
    },
    catalogNode: function () {
        var _this = this;
        if (ThreadWatcher.isWatched(this.thread)) {
            _1.default.addClass(this.nodes.root, 'watched');
        }
        return _1.default.on(this.nodes.root, 'mousedown click', function (e) {
            if ((e.button !== 0) || !e.altKey)
                return;
            if (e.type === 'click')
                ThreadWatcher.toggle(_this.thread, true);
            return e.preventDefault();
        });
    }, // Also on mousedown to prevent highlighting thumbnail in Firefox.
    addDialog: function () {
        if (!(globals_1.g.SITE.isThisPageLegit ? globals_1.g.SITE.isThisPageLegit() : !!_1.default.id('postForm'))) {
            return;
        }
        ThreadWatcher.build();
        return _1.default.prepend(globals_1.d.body, ThreadWatcher.dialog);
    },
    toggleWatcher: function () {
        _1.default.toggleClass(ThreadWatcher.shortcut, 'disabled');
        return ThreadWatcher.dialog.hidden = !ThreadWatcher.dialog.hidden;
    },
    cb: {
        openAll: function () {
            if (_1.default.hasClass(this, 'disabled'))
                return;
            for (var _i = 0, _a = (0, __1.default)('a.watcher-link', ThreadWatcher.list); _i < _a.length; _i++) {
                var a = _a[_i];
                _1.default.open(a.href);
            }
            _1.default.event('CloseMenu');
        },
        openUnread: function () {
            if (_1.default.hasClass(this, 'disabled'))
                return;
            for (var _i = 0, _a = (0, __1.default)('.replies-unread > a.watcher-link', ThreadWatcher.list); _i < _a.length; _i++) {
                var a = _a[_i];
                _1.default.open(a.href);
            }
            _1.default.event('CloseMenu');
        },
        openDeads: function () {
            if (_1.default.hasClass(this, 'disabled'))
                return;
            for (var _i = 0, _a = (0, __1.default)('.dead-thread.replies-unread > a.watcher-link', ThreadWatcher.list); _i < _a.length; _i++) {
                var a = _a[_i];
                _1.default.open(a.href);
            }
            _1.default.event('CloseMenu');
        },
        clear: function () {
            if (!confirm("Delete ALL threads from watcher?"))
                return;
            var ref = ThreadWatcher.getAll();
            for (var i = 0, len = ref.length; i < len; i++) {
                var _a = ref[i], siteID = _a.siteID, boardID = _a.boardID, threadID = _a.threadID;
                ThreadWatcher.db.delete({ siteID: siteID, boardID: boardID, threadID: threadID });
            }
            ThreadWatcher.refresh(true);
            _1.default.event('CloseMenu');
        },
        pruneDeads: function () {
            if (_1.default.hasClass(this, 'disabled'))
                return;
            for (var _i = 0, _a = ThreadWatcher.getAll(); _i < _a.length; _i++) {
                var _b = _a[_i], siteID = _b.siteID, boardID = _b.boardID, threadID = _b.threadID, data = _b.data;
                if (data.isDead) {
                    ThreadWatcher.db.delete({ siteID: siteID, boardID: boardID, threadID: threadID });
                }
            }
            ThreadWatcher.refresh(true);
            _1.default.event('CloseMenu');
        },
        pruneReadDeads: function () {
            if (_1.default.hasClass(this, 'disabled'))
                return;
            for (var _i = 0, _a = ThreadWatcher.getAll(); _i < _a.length; _i++) {
                var _b = _a[_i], siteID = _b.siteID, boardID = _b.boardID, threadID = _b.threadID, data = _b.data;
                if (data.isDead && !data.unread) {
                    ThreadWatcher.db.delete({ siteID: siteID, boardID: boardID, threadID: threadID });
                }
            }
            ThreadWatcher.refresh(true);
            _1.default.event('CloseMenu');
        },
        dismiss: function () {
            for (var _i = 0, _a = ThreadWatcher.getAll(); _i < _a.length; _i++) {
                var _b = _a[_i], siteID = _b.siteID, boardID = _b.boardID, threadID = _b.threadID, data = _b.data;
                if (data.quotingYou) {
                    ThreadWatcher.update(siteID, boardID, threadID, { dismiss: data.quotingYou || 0 });
                }
            }
            _1.default.event('CloseMenu');
        },
        toggle: function () {
            var thread = Get_1.default.postFromNode(this).thread;
            ThreadWatcher.toggle(thread, true);
        },
        rm: function () {
            var siteID = this.parentNode.dataset.siteID;
            var _a = this.parentNode.dataset.fullID.split('.'), boardID = _a[0], threadID = _a[1];
            ThreadWatcher.rm(siteID, boardID, +threadID, undefined, true);
        },
        post: function (e) {
            var _a = e.detail, boardID = _a.boardID, threadID = _a.threadID, postID = _a.postID;
            var cb = PostRedirect_1.default.delay();
            if (postID === threadID) {
                if (globals_1.Conf['Auto Watch']) {
                    ThreadWatcher.addRaw(boardID, threadID, {}, cb, true);
                }
            }
            else if (globals_1.Conf['Auto Watch Reply']) {
                ThreadWatcher.add((globals_1.g.threads.get(boardID + '.' + threadID) || new Thread_1.default(threadID, globals_1.g.boards[boardID] || new Board_1.default(boardID))), cb, true);
            }
        },
        onIndexUpdate: function (e) {
            var db = ThreadWatcher.db;
            var siteID = globals_1.g.SITE.ID;
            var boardID = globals_1.g.BOARD.ID;
            var nKilled = 0;
            for (var threadID in db.data[siteID].boards[boardID]) {
                // Don't prune threads that have yet to appear in index.
                var data = db.data[siteID].boards[boardID][threadID];
                if (!(data === null || data === void 0 ? void 0 : data.isDead) && !e.detail.threads.includes("".concat(boardID, ".").concat(threadID))) {
                    if (!e.detail.threads.some(function (fullID) { return +fullID.split('.')[1] > threadID; })) {
                        continue;
                    }
                    if (globals_1.Conf['Auto Prune'] || !(data && (typeof data === 'object'))) { // corrupt data
                        db.delete({ boardID: boardID, threadID: threadID });
                        nKilled++;
                    }
                    else {
                        ThreadWatcher.fetchStatus({ siteID: siteID, boardID: boardID, threadID: threadID, data: data });
                    }
                }
            }
            if (nKilled) {
                return ThreadWatcher.refresh();
            }
        },
        onThreadRefresh: function (e) {
            var thread = globals_1.g.threads.get(e.detail.threadID);
            if (!e.detail[404] || !ThreadWatcher.isWatched(thread)) {
                return;
            }
            // Update dead status.
            return ThreadWatcher.add(thread);
        }
    },
    requests: [],
    fetched: 0,
    fetch: function (url, _a, args, cb) {
        var _b;
        var siteID = _a.siteID, force = _a.force;
        if (ThreadWatcher.requests.length === 0) {
            ThreadWatcher.status.textContent = '...';
            _1.default.addClass(ThreadWatcher.refreshButton, 'spin');
        }
        var onloadend = function () {
            if (this.finished) {
                return;
            }
            this.finished = true;
            ThreadWatcher.fetched++;
            if (ThreadWatcher.fetched === ThreadWatcher.requests.length) {
                ThreadWatcher.clearRequests();
            }
            else {
                ThreadWatcher.status.textContent = "".concat(Math.round((ThreadWatcher.fetched / ThreadWatcher.requests.length) * 100), "%");
            }
            return cb.apply(this, args);
        };
        var ajax = siteID === globals_1.g.SITE.ID ? _1.default.ajax : CrossOrigin_1.default.ajax;
        if (force) {
            (_b = _1.default.lastModified.ThreadWatcher) === null || _b === void 0 ? true : delete _b[url];
        }
        var req = _1.default.whenModified(url, 'ThreadWatcher', onloadend, { timeout: helpers_1.MINUTE, ajax: ajax });
        return ThreadWatcher.requests.push(req);
    },
    clearRequests: function () {
        ThreadWatcher.requests = [];
        ThreadWatcher.fetched = 0;
        ThreadWatcher.status.textContent = '';
        return _1.default.rmClass(ThreadWatcher.refreshButton, 'spin');
    },
    abort: function () {
        delete ThreadWatcher.syncing;
        for (var _i = 0, _a = ThreadWatcher.requests; _i < _a.length; _i++) {
            var req = _a[_i];
            if (!req.finished) {
                req.finished = true;
                req.abort();
            }
        }
        return ThreadWatcher.clearRequests();
    },
    initLastModified: function () {
        var lm = (_1.default.lastModified['ThreadWatcher'] || (_1.default.lastModified['ThreadWatcher'] = (0, helpers_1.dict)()));
        for (var siteID in ThreadWatcher.dbLM.data) {
            var boards = ThreadWatcher.dbLM.data[siteID];
            for (var boardID in boards.boards) {
                var data = boards.boards[boardID];
                if (ThreadWatcher.db.get({ siteID: siteID, boardID: boardID })) {
                    for (var url in data) {
                        var date = data[url];
                        lm[url] = date;
                    }
                }
                else {
                    ThreadWatcher.dbLM.delete({ siteID: siteID, boardID: boardID });
                }
            }
        }
    },
    fetchAuto: function () {
        var middle;
        clearTimeout(ThreadWatcher.timeout);
        if (!globals_1.Conf['Auto Update Thread Watcher']) {
            return;
        }
        var db = ThreadWatcher.db;
        var interval = globals_1.Conf['Show Page'] || (ThreadWatcher.unreadEnabled && globals_1.Conf['Show Unread Count']) ? 5 * helpers_1.MINUTE : 2 * helpers_1.HOUR;
        var now = Date.now();
        if ((now - interval >= ((middle = db.data.lastChecked || 0)) || middle > now) && !globals_1.d.hidden && !!globals_1.d.hasFocus()) {
            ThreadWatcher.fetchAllStatus(interval);
        }
        return ThreadWatcher.timeout = setTimeout(ThreadWatcher.fetchAuto, interval);
    },
    buttonFetchAll: function () {
        if (ThreadWatcher.syncing || ThreadWatcher.requests.length) {
            return ThreadWatcher.abort();
        }
        else {
            return ThreadWatcher.fetchAllStatus();
        }
    },
    fetchAllStatus: function (interval) {
        if (interval === void 0) { interval = 0; }
        ThreadWatcher.status.textContent = '...';
        _1.default.addClass(ThreadWatcher.refreshButton, 'spin');
        ThreadWatcher.syncing = true;
        var dbs = [ThreadWatcher.db, ThreadWatcher.unreaddb, QuoteYou_1.default.db].filter(function (x) { return x; });
        var n = 0;
        return dbs.map(function (dbi) {
            return dbi.forceSync(function () {
                if ((++n) === dbs.length) {
                    var middle = void 0;
                    if (!ThreadWatcher.syncing) {
                        return;
                    } // aborted
                    delete ThreadWatcher.syncing;
                    if (0 > (middle = Date.now() - (ThreadWatcher.db.data.lastChecked || 0)) || middle >= interval) { // not checked in another tab
                        // XXX On vichan boards, last_modified field of threads.json does not account for sage posts.
                        // Occasionally check replies field of catalog.json to find these posts.
                        var middle1 = void 0;
                        var db = ThreadWatcher.db;
                        var now = Date.now();
                        var deep = !(now - (2 * helpers_1.HOUR) < ((middle1 = db.data.lastChecked2 || 0)) && middle1 <= now);
                        var boards = ThreadWatcher.getAll(true);
                        for (var _i = 0, boards_1 = boards; _i < boards_1.length; _i++) {
                            var board = boards_1[_i];
                            ThreadWatcher.fetchBoard(board, deep);
                        }
                        db.setLastChecked();
                        if (deep) {
                            db.setLastChecked('lastChecked2');
                        }
                    }
                    if (ThreadWatcher.fetched === ThreadWatcher.requests.length) {
                        return ThreadWatcher.clearRequests();
                    }
                }
            });
        });
    },
    fetchBoard: function (board, deep) {
        var _a, _b;
        if (!board.some(function (thread) { return !thread.data.isDead; })) {
            return;
        }
        var force = false;
        for (var _i = 0, board_1 = board; _i < board_1.length; _i++) {
            var thread = board_1[_i];
            var data = thread.data;
            if (!data.isDead && (data.last !== -1)) {
                if (globals_1.Conf['Show Page'] && (data.page == null)) {
                    force = true;
                }
                if ((data.modified == null)) {
                    force = (thread.force = true);
                }
            }
        }
        var _c = board[0], siteID = _c.siteID, boardID = _c.boardID;
        var site = globals_1.g.sites[siteID];
        if (!site) {
            return;
        }
        var urlF = deep && site.threadModTimeIgnoresSage ? 'catalogJSON' : 'threadsListJSON';
        var url = (_b = (_a = site.urls)[urlF]) === null || _b === void 0 ? void 0 : _b.call(_a, { siteID: siteID, boardID: boardID });
        if (!url) {
            return;
        }
        return ThreadWatcher.fetch(url, { siteID: siteID, force: force }, [board, url], ThreadWatcher.parseBoard);
    },
    parseBoard: function (board, url) {
        var _a;
        var _b, _c, _d;
        var page, thread;
        if (this.status !== 200) {
            return;
        }
        var _e = board[0], siteID = _e.siteID, boardID = _e.boardID;
        var lmDate = this.getResponseHeader('Last-Modified');
        ThreadWatcher.dbLM.extend({ siteID: siteID, boardID: boardID, val: _1.default.item(url, lmDate) });
        var threads = (0, helpers_1.dict)();
        var pageLength = 0;
        var nThreads = 0;
        var oldest = null;
        try {
            pageLength = ((_b = this.response[0]) === null || _b === void 0 ? void 0 : _b.threads.length) || 0;
            for (var i = 0; i < this.response.length; i++) {
                page = this.response[i];
                for (var _i = 0, _f = page.threads; _i < _f.length; _i++) {
                    var item = _f[_i];
                    threads[item.no] = {
                        page: i + 1,
                        index: nThreads,
                        modified: item.last_modified,
                        replies: item.replies
                    };
                    nThreads++;
                    if ((oldest == null) || (item.no < oldest)) {
                        oldest = item.no;
                    }
                }
            }
        }
        catch (error) {
            for (var _g = 0, board_2 = board; _g < board_2.length; _g++) {
                thread = board_2[_g];
                ThreadWatcher.fetchStatus(thread);
            }
        }
        for (var _h = 0, board_3 = board; _h < board_3.length; _h++) {
            thread = board_3[_h];
            var threadID = thread.threadID, data = thread.data;
            if (threads[threadID]) {
                var index, modified, replies;
                (_a = threads[threadID], page = _a.page, index = _a.index, modified = _a.modified, replies = _a.replies);
                if (globals_1.Conf['Show Page']) {
                    var lastPage = ((_d = (_c = globals_1.g.sites[siteID]).isPrunedByAge) === null || _d === void 0 ? void 0 : _d.call(_c, { siteID: siteID, boardID: boardID })) ?
                        threadID === oldest
                        :
                            index >= (nThreads - pageLength);
                    ThreadWatcher.update(siteID, boardID, threadID, { page: page, lastPage: lastPage });
                }
                if (ThreadWatcher.unreadEnabled && globals_1.Conf['Show Unread Count']) {
                    if ((modified !== data.modified) || ((replies != null) && (replies !== data.replies))) {
                        (thread.newData || (thread.newData = {})).modified = modified;
                        ThreadWatcher.fetchStatus(thread);
                    }
                }
            }
            else {
                ThreadWatcher.fetchStatus(thread);
            }
        }
    },
    fetchStatus: function (thread) {
        var _a, _b, _c;
        var siteID = thread.siteID, boardID = thread.boardID, threadID = thread.threadID, data = thread.data, force = thread.force;
        var url = (_c = (_a = globals_1.g.sites[siteID]) === null || _a === void 0 ? void 0 : (_b = _a.urls).threadJSON) === null || _c === void 0 ? void 0 : _c.call(_b, { siteID: siteID, boardID: boardID, threadID: threadID });
        if (!url) {
            return;
        }
        if (data.isDead && !force) {
            return;
        }
        if (data.last === -1) {
            return;
        } // 404 or no JSON API
        return ThreadWatcher.fetch(url, { siteID: siteID, force: force }, [thread], ThreadWatcher.parseStatus);
    },
    parseStatus: function (thread, isArchiveURL) {
        var _a, _b, _c, _d, _e;
        var isDead, last;
        var siteID = thread.siteID, boardID = thread.boardID, threadID = thread.threadID, data = thread.data, newData = thread.newData, force = thread.force;
        var site = globals_1.g.sites[siteID];
        if ((this.status === 200) && this.response) {
            var isArchived = void 0;
            last = this.response.posts[this.response.posts.length - 1].no;
            var replies = this.response.posts.length - 1;
            isDead = (isArchived = !!(this.response.posts[0].archived || isArchiveURL));
            if (isDead && globals_1.Conf['Auto Prune']) {
                ThreadWatcher.rm(siteID, boardID, threadID);
                return;
            }
            if ((last === data.last) && (isDead === data.isDead) && (isArchived === data.isArchived)) {
                return;
            }
            var lastReadPost = ThreadWatcher.unreaddb.get({ siteID: siteID, boardID: boardID, threadID: threadID, defaultValue: 0 });
            var unread = data.unread || 0;
            var quotingYou = data.quotingYou || 0;
            var youOP = !!((_a = QuoteYou_1.default.db) === null || _a === void 0 ? void 0 : _a.get({ siteID: siteID, boardID: boardID, threadID: threadID, postID: threadID }));
            for (var _i = 0, _f = this.response.posts; _i < _f.length; _i++) {
                var postObj = _f[_i];
                if ((postObj.no <= (data.last || 0)) || (postObj.no <= lastReadPost)) {
                    continue;
                }
                if ((_b = QuoteYou_1.default.db) === null || _b === void 0 ? void 0 : _b.get({ siteID: siteID, boardID: boardID, threadID: threadID, postID: postObj.no })) {
                    continue;
                }
                var quotesYou = false;
                if (!globals_1.Conf['Require OP Quote Link'] && youOP) {
                    quotesYou = true;
                }
                else if (QuoteYou_1.default.db && postObj.com) {
                    var match;
                    var regexp = site.regexp.quotelinkHTML;
                    regexp.lastIndex = 0;
                    while (match = regexp.exec(postObj.com)) {
                        if (QuoteYou_1.default.db.get({
                            siteID: siteID,
                            boardID: match[1] ? encodeURIComponent(match[1]) : boardID,
                            threadID: match[2] || threadID,
                            postID: match[3] || match[2] || threadID
                        })) {
                            quotesYou = true;
                            break;
                        }
                    }
                }
                if (!unread || (!quotingYou && quotesYou)) {
                    if (Filter_1.default.isHidden(site.Build.parseJSON(postObj, { siteID: siteID, boardID: boardID }))) {
                        continue;
                    }
                }
                unread++;
                if (quotesYou) {
                    quotingYou = postObj.no;
                }
            }
            if (!newData) {
                newData = {};
            }
            _1.default.extend(newData, { last: last, replies: replies, isDead: isDead, isArchived: isArchived, unread: unread, quotingYou: quotingYou });
            return ThreadWatcher.update(siteID, boardID, threadID, newData);
        }
        else if (this.status === 404) {
            var archiveURL = (_e = (_c = globals_1.g.sites[siteID]) === null || _c === void 0 ? void 0 : (_d = _c.urls).archivedThreadJSON) === null || _e === void 0 ? void 0 : _e.call(_d, { siteID: siteID, boardID: boardID, threadID: threadID });
            if (!isArchiveURL && archiveURL) {
                return ThreadWatcher.fetch(archiveURL, { siteID: siteID, force: force }, [thread, true], ThreadWatcher.parseStatus);
            }
            else if (site.mayLackJSON && (data.last == null)) {
                return ThreadWatcher.update(siteID, boardID, threadID, { last: -1 });
            }
            else {
                return ThreadWatcher.update(siteID, boardID, threadID, { isDead: true });
            }
        }
    },
    getAll: function (groupByBoard) {
        var all = [];
        for (var siteID in ThreadWatcher.db.data) {
            var boards = ThreadWatcher.db.data[siteID];
            for (var boardID in boards.boards) {
                var cont;
                var threads = boards.boards[boardID];
                if (globals_1.Conf['Current Board'] && ((siteID !== globals_1.g.SITE.ID) || (boardID !== globals_1.g.BOARD.ID))) {
                    continue;
                }
                if (groupByBoard) {
                    all.push((cont = []));
                }
                for (var threadID in threads) {
                    var data = threads[threadID];
                    if (data && (typeof data === 'object')) {
                        (groupByBoard ? cont : all).push({ siteID: siteID, boardID: boardID, threadID: threadID, data: data });
                    }
                }
            }
        }
        return all;
    },
    makeLine: function (siteID, boardID, threadID, data) {
        var _a;
        var page;
        var x = _1.default.el('a', {
            textContent: 'âœ•',
            href: 'javascript:;'
        });
        icon_1.default.set(x, 'xmark');
        _1.default.on(x, 'click', ThreadWatcher.cb.rm);
        var excerpt = data.excerpt, isArchived = data.isArchived;
        if (!excerpt) {
            excerpt = "/".concat(boardID, "/ - No.").concat(threadID);
        }
        if (globals_1.Conf['Show Site Prefix']) {
            excerpt = ThreadWatcher.prefixes[siteID] + excerpt;
        }
        var link = _1.default.el('a', {
            href: ((_a = globals_1.g.sites[siteID]) === null || _a === void 0 ? void 0 : _a.urls.thread({ siteID: siteID, boardID: boardID, threadID: threadID }, isArchived)) || '',
            title: excerpt,
            className: 'watcher-link'
        });
        if (globals_1.Conf['Show Page'] && (data.page != null)) {
            page = _1.default.el('span', {
                textContent: "[".concat(data.page, "]"),
                className: 'watcher-page'
            });
            _1.default.add(link, page);
        }
        if (ThreadWatcher.unreadEnabled && globals_1.Conf['Show Unread Count'] && (data.unread != null)) {
            var count = _1.default.el('span', {
                textContent: "(".concat(data.unread, ")"),
                className: 'watcher-unread'
            });
            _1.default.add(link, count);
        }
        var title = _1.default.el('span', {
            textContent: excerpt,
            className: 'watcher-title'
        });
        _1.default.add(link, title);
        var div = _1.default.el('div');
        var fullID = "".concat(boardID, ".").concat(threadID);
        div.dataset.fullID = fullID;
        div.dataset.siteID = siteID;
        if ((globals_1.g.VIEW === 'thread') && (fullID === "".concat(globals_1.g.BOARD, ".").concat(globals_1.g.THREADID))) {
            _1.default.addClass(div, 'current');
        }
        if (data.isDead) {
            _1.default.addClass(div, 'dead-thread');
        }
        if (globals_1.Conf['Show Page']) {
            if (data.lastPage) {
                _1.default.addClass(div, 'last-page');
            }
            if (data.page != null) {
                div.dataset.page = data.page;
            }
        }
        if (ThreadWatcher.unreadEnabled && globals_1.Conf['Show Unread Count']) {
            if (data.unread === 0) {
                _1.default.addClass(div, 'replies-read');
            }
            if (data.unread) {
                _1.default.addClass(div, 'replies-unread');
            }
            if ((data.quotingYou || 0) > (data.dismiss || 0)) {
                _1.default.addClass(div, 'replies-quoting-you');
            }
        }
        _1.default.add(div, [x, _1.default.tn(' '), link]);
        return div;
    },
    setPrefixes: function (threads) {
        var prefixes = (0, helpers_1.dict)();
        for (var _i = 0, threads_1 = threads; _i < threads_1.length; _i++) {
            var siteID = threads_1[_i].siteID;
            if (siteID in prefixes) {
                continue;
            }
            var len = 0;
            var prefix = '';
            var conflicts = Object.keys(prefixes);
            while (conflicts.length > 0) {
                len++;
                prefix = siteID.slice(0, len);
                var conflicts2 = [];
                for (var _a = 0, conflicts_1 = conflicts; _a < conflicts_1.length; _a++) {
                    var siteID2 = conflicts_1[_a];
                    if (siteID2.slice(0, len) === prefix) {
                        conflicts2.push(siteID2);
                    }
                    else if (prefixes[siteID2].length < len) {
                        prefixes[siteID2] = siteID2.slice(0, len);
                    }
                }
                conflicts = conflicts2;
            }
            prefixes[siteID] = prefix;
        }
        return ThreadWatcher.prefixes = prefixes;
    },
    build: function () {
        var nodes = [];
        var threads = ThreadWatcher.getAll();
        ThreadWatcher.setPrefixes(threads);
        for (var _i = 0, threads_2 = threads; _i < threads_2.length; _i++) {
            var _a = threads_2[_i], siteID = _a.siteID, boardID = _a.boardID, threadID = _a.threadID, data = _a.data;
            // Add missing excerpt for threads added by Auto Watch
            var thread;
            if ((data.excerpt == null) && (siteID === globals_1.g.SITE.ID) && (thread = globals_1.g.threads.get("".concat(boardID, ".").concat(threadID))) && thread.OP) {
                ThreadWatcher.db.extend({ boardID: boardID, threadID: threadID, val: { excerpt: Get_1.default.threadExcerpt(thread) } });
            }
            nodes.push(ThreadWatcher.makeLine(siteID, boardID, threadID, data));
        }
        var list = ThreadWatcher.list;
        _1.default.rmAll(list);
        _1.default.add(list, nodes);
        return ThreadWatcher.refreshIcon();
    },
    refresh: function (manual) {
        ThreadWatcher.build();
        globals_1.g.threads.forEach(function (thread) {
            var isWatched = ThreadWatcher.isWatched(thread);
            if (thread.OP) {
                for (var _i = 0, _a = __spreadArray([thread.OP], thread.OP.clones, true); _i < _a.length; _i++) {
                    var post = _a[_i];
                    var toggler;
                    if (toggler = (0, _1.default)('.watch-thread-link', post.nodes.info)) {
                        ThreadWatcher.setToggler(toggler, isWatched);
                    }
                }
            }
            if (thread.catalogView) {
                return thread.catalogView.nodes.root.classList.toggle('watched', isWatched);
            }
        });
        if (globals_1.Conf['Pin Watched Threads']) {
            return _1.default.event('SortIndex', { deferred: !(manual && globals_1.Conf['Index Mode'] === 'catalog') });
        }
    },
    refreshIcon: function () {
        for (var _i = 0, _a = ['replies-unread', 'replies-quoting-you']; _i < _a.length; _i++) {
            var className = _a[_i];
            ThreadWatcher.shortcut.classList.toggle(className, !!(0, _1.default)(".".concat(className), ThreadWatcher.dialog));
        }
    },
    update: function (siteID, boardID, threadID, newData) {
        var _a;
        var data, key, line, val;
        if (!(data = (_a = ThreadWatcher.db) === null || _a === void 0 ? void 0 : _a.get({ siteID: siteID, boardID: boardID, threadID: threadID }))) {
            return;
        }
        if (newData.isDead && globals_1.Conf['Auto Prune']) {
            ThreadWatcher.rm(siteID, boardID, threadID);
            return;
        }
        if (newData.isDead || (newData.last === -1)) {
            for (var _i = 0, _b = ['isArchived', 'page', 'lastPage', 'unread', 'quotingyou']; _i < _b.length; _i++) {
                key = _b[_i];
                if (!(key in newData)) {
                    newData[key] = undefined;
                }
            }
        }
        if ((newData.last != null) && (newData.last < data.last)) {
            newData.modified = undefined;
        }
        var n = 0;
        for (key in newData) {
            val = newData[key];
            if (data[key] !== val) {
                n++;
            }
        }
        if (!n) {
            return;
        }
        ThreadWatcher.db.extend({ siteID: siteID, boardID: boardID, threadID: threadID, val: newData });
        if (line = (0, _1.default)("#watched-threads > [data-site-i-d='".concat(siteID, "'][data-full-i-d='").concat(boardID, ".").concat(threadID, "']"), ThreadWatcher.dialog)) {
            var newLine = ThreadWatcher.makeLine(siteID, boardID, threadID, data);
            _1.default.replace(line, newLine);
            return ThreadWatcher.refreshIcon();
        }
        else {
            return ThreadWatcher.refresh();
        }
    },
    set404: function (boardID, threadID, cb) {
        var _a;
        var data;
        if (!(data = (_a = ThreadWatcher.db) === null || _a === void 0 ? void 0 : _a.get({ boardID: boardID, threadID: threadID }))) {
            return cb();
        }
        if (globals_1.Conf['Auto Prune']) {
            ThreadWatcher.db.delete({ boardID: boardID, threadID: threadID });
            return cb();
        }
        if (data.isDead && !((data.isArchived != null) || (data.page != null) || (data.lastPage != null) || (data.unread != null) || (data.quotingYou != null))) {
            return cb();
        }
        return ThreadWatcher.db.extend({ boardID: boardID, threadID: threadID, val: { isDead: true, isArchived: undefined, page: undefined, lastPage: undefined, unread: undefined, quotingYou: undefined } }, cb);
    },
    toggle: function (thread, manual) {
        var siteID = globals_1.g.SITE.ID;
        var boardID = thread.board.ID;
        var threadID = thread.ID;
        if (ThreadWatcher.db.get({ boardID: boardID, threadID: threadID })) {
            return ThreadWatcher.rm(siteID, boardID, threadID, undefined, manual);
        }
        else {
            return ThreadWatcher.add(thread, undefined, manual);
        }
    },
    add: function (thread, cb, manual) {
        var data = {};
        var siteID = globals_1.g.SITE.ID;
        var boardID = thread.board.ID;
        var threadID = thread.ID;
        if (thread.isDead) {
            if (globals_1.Conf['Auto Prune'] && ThreadWatcher.db.get({ boardID: boardID, threadID: threadID })) {
                ThreadWatcher.rm(siteID, boardID, threadID, cb);
                return;
            }
            data.isDead = true;
        }
        if (thread.OP) {
            data.excerpt = Get_1.default.threadExcerpt(thread);
        }
        return ThreadWatcher.addRaw(boardID, threadID, data, cb, manual);
    },
    addRaw: function (boardID, threadID, data, cb, manual) {
        var oldData = ThreadWatcher.db.get({ boardID: boardID, threadID: threadID, defaultValue: (0, helpers_1.dict)() });
        delete oldData.last;
        delete oldData.modified;
        _1.default.extend(oldData, data);
        ThreadWatcher.db.set({ boardID: boardID, threadID: threadID, val: oldData }, cb);
        ThreadWatcher.refresh(manual);
        var thread = { siteID: globals_1.g.SITE.ID, boardID: boardID, threadID: threadID, data: data, force: true };
        if (globals_1.Conf['Show Page'] && !data.isDead) {
            return ThreadWatcher.fetchBoard([thread]);
        }
        else if (ThreadWatcher.unreadEnabled && globals_1.Conf['Show Unread Count']) {
            return ThreadWatcher.fetchStatus(thread);
        }
    },
    rm: function (siteID, boardID, threadID, cb, manual) {
        ThreadWatcher.db.delete({ siteID: siteID, boardID: boardID, threadID: threadID }, cb);
        return ThreadWatcher.refresh(manual);
    },
    menu: {
        init: function () {
            if (!globals_1.Conf['Thread Watcher']) {
                return;
            }
            var menu = (this.menu = new UI_1.default.Menu('thread watcher'));
            _1.default.on((0, _1.default)('.menu-button', ThreadWatcher.dialog), 'click', function (e) {
                return menu.toggle(e, this, ThreadWatcher);
            });
            return this.addMenuEntries();
        },
        addHeaderMenuEntry: function () {
            if (globals_1.g.VIEW !== 'thread') {
                return;
            }
            var entryEl = _1.default.el('a', { href: 'javascript:;' });
            Header_1.default.menu.addEntry({
                el: entryEl,
                order: 60,
                open: function () {
                    var _a = !!ThreadWatcher.db.get({ boardID: globals_1.g.BOARD.ID, threadID: globals_1.g.THREADID }) ?
                        ['unwatch-thread', 'watch-thread', 'Unwatch thread']
                        :
                            ['watch-thread', 'unwatch-thread', 'Watch thread'], addClass = _a[0], rmClass = _a[1], text = _a[2];
                    _1.default.addClass(entryEl, addClass);
                    _1.default.rmClass(entryEl, rmClass);
                    entryEl.textContent = text;
                    return true;
                }
            });
            return _1.default.on(entryEl, 'click', function () { return ThreadWatcher.toggle(globals_1.g.threads.get("".concat(globals_1.g.BOARD, ".").concat(globals_1.g.THREADID)), true); });
        },
        addMenuEntries: function () {
            var toggleDisabledDead = function () {
                this.el.classList.toggle('disabled', !(0, _1.default)('.dead-thread', ThreadWatcher.list));
                return true;
            };
            var entries = [
                // `Open all` entry
                {
                    text: 'Open all threads',
                    cb: ThreadWatcher.cb.openAll,
                    open: function () {
                        this.el.classList.toggle('disabled', !ThreadWatcher.list.firstElementChild);
                        return true;
                    }
                },
                {
                    text: 'Clear all threads',
                    cb: ThreadWatcher.cb.clear,
                    open: function () {
                        this.el.classList.toggle('disabled', !ThreadWatcher.list.firstElementChild);
                        return true;
                    }
                },
                // `Open Unread` entry
                {
                    text: 'Open unread threads',
                    cb: ThreadWatcher.cb.openUnread,
                    open: function () {
                        this.el.classList.toggle('disabled', !(0, _1.default)('.replies-unread', ThreadWatcher.list));
                        return true;
                    }
                },
                // `Open unread dead threads` entry
                {
                    text: 'Open unread dead threads',
                    cb: ThreadWatcher.cb.openDeads,
                    open: toggleDisabledDead,
                },
                // `Prune all dead threads` entry
                {
                    text: 'Prune all dead threads',
                    cb: ThreadWatcher.cb.pruneDeads,
                    open: toggleDisabledDead,
                },
                // `Prune read dead threads` entry
                {
                    text: 'Prune read dead threads',
                    cb: ThreadWatcher.cb.pruneReadDeads,
                    open: toggleDisabledDead,
                },
                // `Dismiss posts quoting you` entry
                {
                    text: 'Dismiss posts quoting you',
                    title: 'Unhighlight the thread watcher icon and threads until there are new replies quoting you.',
                    cb: ThreadWatcher.cb.dismiss,
                    open: function () {
                        this.el.classList.toggle('disabled', !_1.default.hasClass(ThreadWatcher.shortcut, 'replies-quoting-you'));
                        return true;
                    }
                },
            ];
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var _a = entries_1[_i], text = _a.text, title = _a.title, cb = _a.cb, open = _a.open;
                var entry = {
                    el: _1.default.el('a', {
                        textContent: text,
                        href: 'javascript:;'
                    })
                };
                if (title) {
                    entry.el.title = title;
                }
                _1.default.on(entry.el, 'click', cb);
                entry.open = open.bind(entry);
                this.menu.addEntry(entry);
            }
            // Settings checkbox entries:
            for (var name in Config_1.default.threadWatcher) {
                var conf = Config_1.default.threadWatcher[name];
                this.addCheckbox(name, conf[1]);
            }
        },
        addCheckbox: function (name, desc) {
            var entry = {
                type: 'thread watcher',
                el: UI_1.default.checkbox(name, name.replace(' Thread Watcher', ''))
            };
            entry.el.title = desc;
            var input = entry.el.firstElementChild;
            if ((name === 'Show Unread Count') && !ThreadWatcher.unreadEnabled) {
                input.disabled = true;
                _1.default.addClass(entry.el, 'disabled');
                entry.el.title += '\n[Remember Last Read Post is disabled.]';
            }
            _1.default.on(input, 'change', _1.default.cb.checked);
            if (['Current Board', 'Show Page', 'Show Unread Count', 'Show Site Prefix'].includes(name))
                _1.default.on(input, 'change', function () { return ThreadWatcher.refresh(); });
            if (['Show Page', 'Show Unread Count', 'Auto Update Thread Watcher'].includes(name))
                _1.default.on(input, 'change', ThreadWatcher.fetchAuto);
            return this.menu.addEntry(entry);
        }
    }
};
exports.default = ThreadWatcher;
