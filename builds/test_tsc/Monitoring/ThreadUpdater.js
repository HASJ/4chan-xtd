"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var beep_wav_1 = require("./ThreadUpdater/beep.wav");
var _1 = require("../platform/$");
var Callbacks_1 = require("../classes/Callbacks");
var Notice_1 = require("../classes/Notice");
var Post_1 = require("../classes/Post");
var Config_1 = require("../config/Config");
var Settings_1 = require("../General/Settings");
var QuoteThreading_1 = require("../Quotelinks/QuoteThreading");
var Unread_1 = require("./Unread");
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var UI_1 = require("../General/UI");
var helpers_1 = require("../platform/helpers");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ThreadUpdater = {
    init: function () {
        var _this = this;
        var sc;
        // Chromium won't play audio created in an inactive tab until the tab has been focused, so set it up now.
        // XXX Sometimes the loading stalls in Firefox, esp. when opening in private browsing window followed by normal window.
        // Don't let it keep the loading icon on indefinitely.
        this.audio = _1.default.el('audio');
        if (_1.default.engine !== 'gecko') {
            this.audio.src = this.beep;
        }
        _1.default.on(this.audio, 'error', function () {
            new Notice_1.default('error', _this.audio.error.message || 'Error when trying to play thread updater beep.', 15);
        });
        // Return after the audio player is initiated, so it works in the settings preview.
        if ((globals_1.g.VIEW !== 'thread') || !globals_1.Conf['Thread Updater'])
            return;
        this.enabled = true;
        if (globals_1.Conf['Updater and Stats in Header']) {
            this.dialog = (sc = _1.default.el('span', { id: 'updater' }));
            _1.default.extend(sc, { innerHTML: '<span id="update-status" class="empty"></span><span id="update-timer" class="empty" title="Update now"></span>' });
            Header_1.default.addShortcut('updater', sc, 100);
        }
        else {
            this.dialog = (sc = UI_1.default.dialog('updater', { innerHTML: '<div class="move"></div><span id="update-status" class="empty"></span><span id="update-timer" class="empty" title="Update now"></span>' }));
            _1.default.addClass(globals_1.doc, 'float');
            _1.default.ready(function () { return _1.default.add(globals_1.d.body, sc); });
        }
        this.checkPostCount = 0;
        this.timer = (0, _1.default)('#update-timer', sc);
        this.status = (0, _1.default)('#update-status', sc);
        _1.default.on(this.timer, 'click', this.update);
        _1.default.on(this.status, 'click', this.update);
        var updateLink = _1.default.el('span', { className: 'brackets-wrap updatelink' });
        _1.default.extend(updateLink, { innerHTML: '<a href="javascript:;">Update</a>' });
        _1.default.on(globals_1.d, '4chanXInitFinished', function () {
            var navLinksBot;
            if (navLinksBot = (0, _1.default)('.navLinksBot')) {
                return _1.default.add(navLinksBot, [_1.default.tn(' '), updateLink]);
            }
        });
        _1.default.on(updateLink.firstElementChild, 'click', this.update);
        var subEntries = [];
        for (var name_1 in Config_1.default.updater.checkbox) {
            var conf = Config_1.default.updater.checkbox[name_1];
            var el = UI_1.default.checkbox(name_1, name_1);
            el.title = conf[1];
            var input = el.firstElementChild;
            _1.default.on(input, 'change', _1.default.cb.checked);
            if (input.name === 'Scroll BG') {
                _1.default.on(input, 'change', this.cb.scrollBG);
                this.cb.scrollBG();
            }
            else if (input.name === 'Auto Update') {
                _1.default.on(input, 'change', this.setInterval);
            }
            subEntries.push({ el: el });
        }
        this.settings = _1.default.el('span', { innerHTML: '<a href="javascript:;">Interval</a>' });
        _1.default.on(this.settings, 'click', this.intervalShortcut);
        subEntries.push({ el: this.settings });
        Header_1.default.menu.addEntry(this.entry = {
            el: _1.default.el('span', { textContent: 'Updater' }),
            order: 110,
            subEntries: subEntries
        });
        return Callbacks_1.default.Thread.push({
            name: 'Thread Updater',
            cb: this.node
        });
    },
    node: function () {
        ThreadUpdater.thread = this;
        ThreadUpdater.root = this.nodes.root;
        ThreadUpdater.outdateCount = 0;
        // We must keep track of our own list of live posts/files
        // to provide an accurate deletedPosts/deletedFiles on update
        // as posts may be `kill`ed elsewhere.
        ThreadUpdater.postIDs = [];
        ThreadUpdater.fileIDs = [];
        this.posts.forEach(function (post) {
            ThreadUpdater.postIDs.push(post.ID);
            if (post.file) {
                return ThreadUpdater.fileIDs.push(post.ID);
            }
        });
        ThreadUpdater.cb.interval.call(_1.default.el('input', { value: globals_1.Conf['Interval'] }));
        _1.default.on(globals_1.d, 'QRPostSuccessful', ThreadUpdater.cb.checkpost);
        _1.default.on(globals_1.d, 'visibilitychange', ThreadUpdater.cb.visibility);
        return ThreadUpdater.setInterval();
    },
    /*
    http://freesound.org/people/pierrecartoons1979/sounds/90112/
    cc-by-nc-3.0
    */
    beep: "data:audio/wav;base64,".concat(beep_wav_1.default),
    playBeep: function (repeatIfPlaying) {
        if (repeatIfPlaying === void 0) { repeatIfPlaying = true; }
        var audio = ThreadUpdater.audio;
        var source = globals_1.Conf.beepSource || ThreadUpdater.beep;
        if (audio.src !== source)
            audio.src = source;
        audio.volume = Math.max(.01, Math.min(+globals_1.Conf.beepVolume, 1));
        if (audio.paused) {
            audio.play();
        }
        else if (repeatIfPlaying) {
            _1.default.one(audio, 'ended', ThreadUpdater.playBeep);
        }
    },
    cb: {
        checkpost: function (e) {
            if (e.detail.threadID !== ThreadUpdater.thread.ID) {
                return;
            }
            ThreadUpdater.postID = e.detail.postID;
            ThreadUpdater.checkPostCount = 0;
            ThreadUpdater.outdateCount = 0;
            return ThreadUpdater.setInterval();
        },
        visibility: function () {
            if (globals_1.d.hidden) {
                return;
            }
            // Reset the counter when we focus this tab.
            ThreadUpdater.outdateCount = 0;
            if (ThreadUpdater.seconds > ThreadUpdater.interval) {
                return ThreadUpdater.setInterval();
            }
        },
        scrollBG: function () {
            return ThreadUpdater.scrollBG = globals_1.Conf['Scroll BG'] ?
                function () { return true; }
                :
                    function () { return !globals_1.d.hidden; };
        },
        interval: function (e) {
            var val = parseInt(this.value, 10);
            if (val < 1) {
                val = 1;
            }
            ThreadUpdater.interval = (this.value = val);
            if (e) {
                return _1.default.cb.value.call(this);
            }
        },
        load: function () {
            if (this !== ThreadUpdater.req) {
                return;
            } // aborted
            switch (this.status) {
                case 200:
                    ThreadUpdater.parse(this);
                    if (ThreadUpdater.thread.isArchived) {
                        return ThreadUpdater.kill();
                    }
                    else {
                        return ThreadUpdater.setInterval();
                    }
                case 404:
                    // XXX workaround for 4chan sending false 404s
                    return _1.default.ajax(globals_1.g.SITE.urls.catalogJSON({ boardID: ThreadUpdater.thread.board.ID }), { onloadend: function () {
                            var confirmed;
                            if (this.status === 200) {
                                confirmed = true;
                                for (var _i = 0, _a = this.response; _i < _a.length; _i++) {
                                    var page = _a[_i];
                                    for (var _b = 0, _c = page.threads; _b < _c.length; _b++) {
                                        var thread = _c[_b];
                                        if (thread.no === ThreadUpdater.thread.ID) {
                                            confirmed = false;
                                            break;
                                        }
                                    }
                                }
                            }
                            else {
                                confirmed = false;
                            }
                            if (confirmed) {
                                ThreadUpdater.kill();
                            }
                            else {
                                ThreadUpdater.error(this);
                            }
                        }
                    });
                default:
                    return ThreadUpdater.error(this);
            }
        }
    },
    kill: function () {
        ThreadUpdater.thread.kill();
        ThreadUpdater.setInterval();
        return _1.default.event('ThreadUpdate', {
            404: true,
            threadID: ThreadUpdater.thread.fullID
        });
    },
    error: function (req) {
        if (req.status === 304) {
            ThreadUpdater.set('status', '');
        }
        ThreadUpdater.setInterval();
        if (!req.status) {
            return ThreadUpdater.set('status', 'Connection Error', 'warning');
        }
        else if (req.status !== 304) {
            return ThreadUpdater.set('status', "".concat(req.statusText, " (").concat(req.status, ")"), 'warning');
        }
    },
    setInterval: function () {
        clearTimeout(ThreadUpdater.timeoutID);
        if (ThreadUpdater.thread.isDead) {
            ThreadUpdater.set('status', (ThreadUpdater.thread.isArchived ? 'Archived' : '404'), 'warning');
            ThreadUpdater.set('timer', '');
            return;
        }
        // Fetching your own posts after posting
        if (ThreadUpdater.postID && (ThreadUpdater.checkPostCount < 5)) {
            ThreadUpdater.set('timer', '...', 'loading');
            ThreadUpdater.timeoutID = setTimeout(ThreadUpdater.update, ++ThreadUpdater.checkPostCount * helpers_1.SECOND);
            return;
        }
        if (!globals_1.Conf['Auto Update']) {
            ThreadUpdater.set('timer', 'Update');
            return;
        }
        var interval = ThreadUpdater.interval;
        if (globals_1.Conf['Optional Increase']) {
            // Lower the max refresh rate limit on visible tabs.
            var limit = globals_1.d.hidden ? 10 : 5;
            var j = Math.min(ThreadUpdater.outdateCount, limit);
            // 1 second to 100, 30 to 300.
            var cur = (Math.floor(interval * 0.1) || 1) * j * j;
            ThreadUpdater.seconds = _1.default.minmax(cur, interval, 300);
        }
        else {
            ThreadUpdater.seconds = interval;
        }
        return ThreadUpdater.timeout();
    },
    intervalShortcut: function () {
        Settings_1.default.open('Advanced');
        var settings = _1.default.id('fourchanx-settings');
        return (0, _1.default)('input[name=Interval]', settings).focus();
    },
    set: function (name, text, klass) {
        var node;
        var el = ThreadUpdater[name];
        if ((node = el.firstChild)) {
            // Prevent the creation of a new DOM Node
            // by setting the text node's data.
            node.data = text;
        }
        else {
            el.textContent = text;
        }
        return el.className = klass !== null && klass !== void 0 ? klass : (text === '' ? 'empty' : '');
    },
    timeout: function () {
        if (ThreadUpdater.seconds) {
            ThreadUpdater.set('timer', ThreadUpdater.seconds);
            ThreadUpdater.timeoutID = setTimeout(ThreadUpdater.timeout, 1000);
        }
        else {
            ThreadUpdater.outdateCount++;
            ThreadUpdater.update();
        }
        return ThreadUpdater.seconds--;
    },
    update: function () {
        var oldReq;
        clearTimeout(ThreadUpdater.timeoutID);
        ThreadUpdater.set('timer', '...', 'loading');
        if (oldReq = ThreadUpdater.req) {
            delete ThreadUpdater.req;
            oldReq.abort();
        }
        return ThreadUpdater.req = _1.default.whenModified(globals_1.g.SITE.urls.threadJSON({ boardID: ThreadUpdater.thread.board.ID, threadID: ThreadUpdater.thread.ID }), 'ThreadUpdater', ThreadUpdater.cb.load, { timeout: helpers_1.MINUTE });
    },
    updateThreadStatus: function (type, status) {
        var hasChanged;
        if (!(hasChanged = ThreadUpdater.thread["is".concat(type)] !== status)) {
            return;
        }
        ThreadUpdater.thread.setStatus(type, status);
        if ((type === 'Closed') && ThreadUpdater.thread.isArchived) {
            return;
        }
        var change = type === 'Sticky' ?
            status ?
                'now a sticky'
                :
                    'not a sticky anymore'
            :
                status ?
                    'now closed'
                    :
                        'not closed anymore';
        return new Notice_1.default('info', "The thread is ".concat(change, "."), 30);
    },
    parse: function (req) {
        var _a, _b, _c, _d;
        var ID, ipCountEl, post;
        var postObjects = req.response.posts;
        var OP = postObjects[0];
        var thread = ThreadUpdater.thread;
        var board = thread.board;
        var lastPost = ThreadUpdater.postIDs[ThreadUpdater.postIDs.length - 1];
        // XXX Reject updates that falsely delete the last post.
        if ((postObjects[postObjects.length - 1].no < lastPost) &&
            ((new Date(req.getResponseHeader('Last-Modified')) - thread.posts.get(lastPost).info.date) < (30 * helpers_1.SECOND))) {
            return;
        }
        globals_1.g.SITE.Build.spoilerRange[board] = OP.custom_spoiler;
        thread.setStatus('Archived', !!OP.archived);
        ThreadUpdater.updateThreadStatus('Sticky', !!OP.sticky);
        ThreadUpdater.updateThreadStatus('Closed', !!OP.closed);
        thread.postLimit = !!OP.bumplimit;
        thread.fileLimit = !!OP.imagelimit;
        if (OP.unique_ips)
            thread.ipCount = OP.unique_ips;
        var posts = []; // new post objects
        var index = []; // existing posts
        var files = []; // existing files
        var newPosts = []; // new post fullID list for API
        // Build the index, create posts.
        for (var _i = 0, postObjects_1 = postObjects; _i < postObjects_1.length; _i++) {
            var postObject = postObjects_1[_i];
            ID = postObject.no;
            index.push(ID);
            if (postObject.fsize) {
                files.push(ID);
            }
            // Insert new posts, not older ones.
            if (ID <= lastPost) {
                continue;
            }
            // XXX Resurrect wrongly deleted posts.
            if ((post = thread.posts.get(ID)) && !post.isFetchedQuote) {
                post.resurrect();
                continue;
            }
            newPosts.push("".concat(board, ".").concat(ID));
            var node = globals_1.g.SITE.Build.postFromObject(postObject, board.ID);
            posts.push(new Post_1.default(node, thread, board));
            // Fetching your own posts after posting
            if (ThreadUpdater.postID === ID) {
                delete ThreadUpdater.postID;
            }
        }
        // Check for deleted posts.
        var deletedPosts = [];
        for (var _e = 0, _f = ThreadUpdater.postIDs; _e < _f.length; _e++) {
            ID = _f[_e];
            if (!index.includes(ID)) {
                thread.posts.get(ID).kill();
                deletedPosts.push("".concat(board, ".").concat(ID));
            }
        }
        ThreadUpdater.postIDs = index;
        // Check for deleted files.
        var deletedFiles = [];
        for (var _g = 0, _h = ThreadUpdater.fileIDs; _g < _h.length; _g++) {
            ID = _h[_g];
            if (!(files.includes(ID) || deletedPosts.includes("".concat(board, ".").concat(ID)))) {
                thread.posts.get(ID).kill(true);
                deletedFiles.push("".concat(board, ".").concat(ID));
            }
        }
        ThreadUpdater.fileIDs = files;
        if (!posts.length) {
            ThreadUpdater.set('status', '');
        }
        else {
            ThreadUpdater.set('status', "+".concat(posts.length), 'new');
            ThreadUpdater.outdateCount = 0;
            var unreadCount = (_a = Unread_1.default.posts) === null || _a === void 0 ? void 0 : _a.size;
            var unreadQYCount = (_b = Unread_1.default.postsQuotingYou) === null || _b === void 0 ? void 0 : _b.size;
            for (var _j = 0, posts_1 = posts; _j < posts_1.length; _j++) {
                var post_1 = posts_1[_j];
                Callbacks_1.default.Post.execute(post_1);
            }
            if (globals_1.d.hidden || !globals_1.d.hasFocus()) {
                if (globals_1.Conf['Beep Quoting You'] && (((_c = Unread_1.default.postsQuotingYou) === null || _c === void 0 ? void 0 : _c.size) > unreadQYCount)) {
                    ThreadUpdater.playBeep();
                    if (globals_1.Conf['Beep']) {
                        ThreadUpdater.playBeep();
                    }
                }
                else if (globals_1.Conf['Beep'] && (((_d = Unread_1.default.posts) === null || _d === void 0 ? void 0 : _d.size) > 0) && (unreadCount === 0)) {
                    ThreadUpdater.playBeep();
                }
            }
            var scroll_1 = globals_1.Conf['Auto Scroll'] && ThreadUpdater.scrollBG() &&
                ((ThreadUpdater.root.getBoundingClientRect().bottom - globals_1.doc.clientHeight) < 25);
            var firstPost = null;
            for (var _k = 0, posts_2 = posts; _k < posts_2.length; _k++) {
                post = posts_2[_k];
                if (!QuoteThreading_1.default.insert(post)) {
                    if (!firstPost) {
                        firstPost = post.nodes.root;
                    }
                    _1.default.add(ThreadUpdater.root, post.nodes.root);
                }
            }
            _1.default.event('PostsInserted', null, ThreadUpdater.root);
            if (scroll_1) {
                if (globals_1.Conf['Bottom Scroll']) {
                    window.scrollTo(0, globals_1.d.body.clientHeight);
                }
                else {
                    if (firstPost) {
                        Header_1.default.scrollTo(firstPost);
                    }
                }
            }
        }
        // Update IP count in original post form.
        if (OP.unique_ips && (ipCountEl = _1.default.id('unique-ips'))) {
            ipCountEl.textContent = OP.unique_ips;
            ipCountEl.previousSibling.textContent = ipCountEl.previousSibling.textContent.replace(/\b(?:is|are)\b/, OP.unique_ips === 1 ? 'is' : 'are');
            ipCountEl.nextSibling.textContent = ipCountEl.nextSibling.textContent.replace(/\bposters?\b/, OP.unique_ips === 1 ? 'poster' : 'posters');
        }
        return _1.default.event('ThreadUpdate', {
            404: false,
            threadID: thread.fullID,
            newPosts: newPosts,
            deletedPosts: deletedPosts,
            deletedFiles: deletedFiles,
            postCount: OP.replies + 1,
            fileCount: OP.images + !!OP.fsize,
            ipCount: OP.unique_ips
        });
    }
};
exports.default = ThreadUpdater;
