"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Header_1 = require("../General/Header");
var UI_1 = require("../General/UI");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var ThreadStats = {
    postCount: 0,
    fileCount: 0,
    postIndex: 0,
    init: function () {
        var _a, _b;
        var sc;
        if ((globals_1.g.VIEW !== 'thread') || !globals_1.Conf['Thread Stats']) {
            return;
        }
        if (globals_1.Conf['Page Count in Stats']) {
            this[((_b = (_a = globals_1.g.SITE).isPrunedByAge) === null || _b === void 0 ? void 0 : _b.call(_a, globals_1.g.BOARD)) ? 'showPurgePos' : 'showPage'] = true;
        }
        var statsHTML = { innerHTML: "<span id=\"post-count\">?</span> / <span id=\"file-count\">?</span>" + ((globals_1.Conf["IP Count in Stats"] && globals_1.g.SITE.hasIPCount) ? " / <span id=\"ip-count\">?</span>" : "") + ((globals_1.Conf["Page Count in Stats"]) ? " / <span id=\"page-count\">?</span>" : "") };
        var statsTitle = 'Posts / Files';
        if (globals_1.Conf['IP Count in Stats'] && globals_1.g.SITE.hasIPCount) {
            statsTitle += ' / IPs';
        }
        if (globals_1.Conf['Page Count in Stats']) {
            if (this.showPurgePos) {
                statsTitle += ' / Purge Position';
            }
            else {
                statsTitle += ' / Page';
                if (globals_1.Conf['Purge Position'])
                    statsTitle += ' (Purge Position)';
            }
        }
        if (globals_1.Conf['Updater and Stats in Header']) {
            this.dialog = (sc = _1.default.el('span', {
                id: 'thread-stats',
                title: statsTitle
            }));
            _1.default.extend(sc, statsHTML);
            Header_1.default.addShortcut('stats', sc, 200);
        }
        else {
            this.dialog = (sc = UI_1.default.dialog('thread-stats', { innerHTML: "<div class=\"move\" title=\"" + (0, globals_1.E)(statsTitle) + "\">" + (statsHTML).innerHTML + "</div>" }));
            _1.default.addClass(globals_1.doc, 'float');
            _1.default.ready(function () { return _1.default.add(globals_1.d.body, sc); });
        }
        this.postCountEl = (0, _1.default)('#post-count', sc);
        this.fileCountEl = (0, _1.default)('#file-count', sc);
        this.ipCountEl = (0, _1.default)('#ip-count', sc);
        this.pageCountEl = (0, _1.default)('#page-count', sc);
        if (this.pageCountEl) {
            _1.default.on(this.pageCountEl, 'click', ThreadStats.fetchPage);
        }
        return Callbacks_1.default.Thread.push({
            name: 'Thread Stats',
            cb: this.node
        });
    },
    node: function () {
        ThreadStats.thread = this;
        ThreadStats.count();
        ThreadStats.update();
        ThreadStats.fetchPage();
        _1.default.on(globals_1.d, 'PostsInserted', function () { return _1.default.queueTask(ThreadStats.onPostsInserted); });
        return _1.default.on(globals_1.d, 'ThreadUpdate', ThreadStats.onUpdate);
    },
    count: function () {
        var posts = ThreadStats.thread.posts;
        var n = posts.keys.length;
        for (var i = ThreadStats.postIndex, end = n; i < end; i++) {
            var post = posts.get(posts.keys[i]);
            if (!post.isFetchedQuote) {
                ThreadStats.postCount++;
                ThreadStats.fileCount += post.files.length;
            }
        }
        ThreadStats.postIndex = n;
    },
    onUpdate: function (e) {
        if (e.detail[404]) {
            return;
        }
        var _a = e.detail, postCount = _a.postCount, fileCount = _a.fileCount;
        _1.default.extend(ThreadStats, { postCount: postCount, fileCount: fileCount });
        ThreadStats.postIndex = ThreadStats.thread.posts.keys.length;
        ThreadStats.update();
        if (ThreadStats.showPage && (ThreadStats.pageCountEl.textContent !== '1')) {
            return ThreadStats.fetchPage();
        }
    },
    onPostsInserted: function () {
        if (ThreadStats.thread.posts.keys.length <= ThreadStats.postIndex) {
            return;
        }
        ThreadStats.count();
        ThreadStats.update();
        if (ThreadStats.showPage && (ThreadStats.pageCountEl.textContent !== '1')) {
            return ThreadStats.fetchPage();
        }
    },
    update: function () {
        var _a;
        var thread = ThreadStats.thread, postCountEl = ThreadStats.postCountEl, fileCountEl = ThreadStats.fileCountEl, ipCountEl = ThreadStats.ipCountEl;
        postCountEl.textContent = ThreadStats.postCount;
        fileCountEl.textContent = ThreadStats.fileCount;
        if (ipCountEl) {
            if (thread.ipCount) {
                ipCountEl.textContent = thread.ipCount;
            }
            else if ((_a = globals_1.g.BOARD) === null || _a === void 0 ? void 0 : _a.config.user_ids) {
                var IDs_1 = new Set();
                globals_1.g.posts.forEach(function (post) {
                    IDs_1.add(post.info.uniqueID);
                });
                ipCountEl.textContent = IDs_1.size;
            }
            else {
                ipCountEl.textContent = '?';
            }
        }
        postCountEl.classList.toggle('warning', (thread.postLimit && !thread.isSticky));
        fileCountEl.classList.toggle('warning', (thread.fileLimit && !thread.isSticky));
    },
    fetchPage: function () {
        if (!ThreadStats.pageCountEl) {
            return;
        }
        clearTimeout(ThreadStats.timeout);
        if (ThreadStats.thread.isDead) {
            ThreadStats.pageCountEl.textContent = 'Dead';
            _1.default.addClass(ThreadStats.pageCountEl, 'warning');
            return;
        }
        ThreadStats.timeout = setTimeout(ThreadStats.fetchPage, globals_1.Conf['Purge Position'] && ThreadStats.pageCountEl.classList.contains('warning')
            ? (5 * helpers_1.SECOND) : (2 * helpers_1.MINUTE));
        _1.default.whenModified(globals_1.g.SITE.urls.threadsListJSON(ThreadStats.thread), 'ThreadStats', ThreadStats.onThreadsLoad);
    },
    onThreadsLoad: function () {
        if (this.status === 200) {
            var page = void 0, thread = void 0;
            if (ThreadStats.showPurgePos) {
                var purgePos = 1;
                for (var _i = 0, _a = this.response; _i < _a.length; _i++) {
                    page = _a[_i];
                    for (var _b = 0, _c = page.threads; _b < _c.length; _b++) {
                        thread = _c[_b];
                        if (thread.no < ThreadStats.thread.ID) {
                            purgePos++;
                        }
                    }
                }
                ThreadStats.pageCountEl.textContent = purgePos;
                ThreadStats.pageCountEl.classList.toggle('warning', (purgePos === 1));
            }
            else {
                var nThreads = void 0;
                var i = (nThreads = 0);
                for (var _d = 0, _e = this.response; _d < _e.length; _d++) {
                    page = _e[_d];
                    nThreads += page.threads.length;
                }
                for (var pageNum = 0; pageNum < this.response.length; pageNum++) {
                    page = this.response[pageNum];
                    for (var _f = 0, _g = page.threads; _f < _g.length; _f++) {
                        thread = _g[_f];
                        if (thread.no === ThreadStats.thread.ID) {
                            ThreadStats.pageCountEl.textContent = pageNum + 1;
                            var hasWarning = (i >= (nThreads - this.response[0].threads.length));
                            ThreadStats.pageCountEl.classList.toggle('warning', hasWarning);
                            if (hasWarning && globals_1.Conf['Purge Position']) {
                                ThreadStats.pageCountEl.textContent += " (".concat(nThreads - i - 1, ")");
                            }
                            ThreadStats.lastPageUpdate = new Date(thread.last_modified * helpers_1.SECOND);
                            ThreadStats.retry();
                            return;
                        }
                        i++;
                    }
                }
            }
        }
        else if (this.status === 304) {
            ThreadStats.retry();
        }
    },
    retry: function () {
        // If thread data is stale (modification date given < time of last post), try again.
        // Skip this on vichan sites due to sage posts not updating modification time in threads.json.
        if (!ThreadStats.showPage ||
            (ThreadStats.pageCountEl.textContent === '1') ||
            !!globals_1.g.SITE.threadModTimeIgnoresSage ||
            (ThreadStats.thread.posts.get(ThreadStats.thread.lastPost).info.date <= ThreadStats.lastPageUpdate)) {
            return;
        }
        clearTimeout(ThreadStats.timeout);
        ThreadStats.timeout = setTimeout(ThreadStats.fetchPage, 5 * helpers_1.SECOND);
    }
};
exports.default = ThreadStats;
