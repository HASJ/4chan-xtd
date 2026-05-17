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
var Post_1 = require("../classes/Post");
var Get_1 = require("../General/Get");
var Index_1 = require("../General/Index");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var helpers_1 = require("../platform/helpers");
var ExpandThread = {
    statuses: (0, helpers_1.dict)(),
    init: function () {
        if (!((globals_1.g.VIEW === 'index') && globals_1.Conf['Thread Expansion'])) {
            return;
        }
        if (globals_1.Conf['JSON Index']) {
            _1.default.on(globals_1.d, 'IndexRefreshInternal', this.onIndexRefresh);
        }
        else {
            Callbacks_1.default.Thread.push({
                name: 'Expand Thread',
                cb: function () { ExpandThread.setButton(this); }
            });
        }
    },
    setButton: function (thread) {
        var _a;
        if (!thread.nodes.root)
            return;
        var a = (0, _1.default)('a.summary', thread.nodes.root);
        if (!a)
            return;
        a.textContent = (_a = globals_1.g.SITE.Build).summaryText.apply(_a, __spreadArray(['+'], a.textContent.match(/\d+/g), false));
        a.style.cursor = 'pointer';
        _1.default.on(a, 'click', ExpandThread.cbToggle);
    },
    disconnect: function (refresh) {
        if ((globals_1.g.VIEW === 'thread') || !globals_1.Conf['Thread Expansion']) {
            return;
        }
        for (var threadID in ExpandThread.statuses) {
            var oldReq;
            var status = ExpandThread.statuses[threadID];
            if (oldReq = status.req) {
                delete status.req;
                oldReq.abort();
            }
            delete ExpandThread.statuses[threadID];
        }
        if (!refresh)
            _1.default.off(globals_1.d, 'IndexRefreshInternal', this.onIndexRefresh);
    },
    onIndexRefresh: function () {
        ExpandThread.disconnect(true);
        globals_1.g.BOARD.threads.forEach(function (thread) { return ExpandThread.setButton(thread); });
    },
    cbToggle: function (e) {
        if (_1.default.modifiedClick(e)) {
            return;
        }
        e.preventDefault();
        ExpandThread.toggle(Get_1.default.threadFromNode(this));
    },
    cbToggleBottom: function (e) {
        if (_1.default.modifiedClick(e)) {
            return;
        }
        e.preventDefault();
        var thread = Get_1.default.threadFromNode(this);
        _1.default.rm(this); // remove before fixing bottom of thread position
        var bottom = thread.nodes.root.getBoundingClientRect().bottom;
        ExpandThread.toggle(thread);
        return window.scrollBy(0, (thread.nodes.root.getBoundingClientRect().bottom - bottom));
    },
    toggle: function (thread) {
        if (!thread.nodes.root)
            return;
        var a = (0, _1.default)('a.summary', thread.nodes.root);
        if (!a)
            return;
        if (thread.ID in ExpandThread.statuses) {
            ExpandThread.contract(thread, a, thread.nodes.root);
        }
        else {
            ExpandThread.expand(thread, a);
        }
    },
    expand: function (thread, a) {
        var _a;
        var status;
        ExpandThread.statuses[thread] = (status = {});
        a.textContent = (_a = globals_1.g.SITE.Build).summaryText.apply(_a, __spreadArray(['...'], a.textContent.match(/\d+/g), false));
        status.req = _1.default.cache(globals_1.g.SITE.urls.threadJSON({ boardID: thread.board.ID, threadID: thread.ID }), function () {
            if (this !== status.req) {
                return;
            } // aborted
            delete status.req;
            ExpandThread.parse(this, thread, a);
        });
        status.numReplies = (0, __1.default)(globals_1.g.SITE.selectors.replyOriginal, thread.nodes.root).length;
    },
    contract: function (thread, a, threadRoot) {
        var _a;
        var oldReq;
        var status = ExpandThread.statuses[thread];
        delete ExpandThread.statuses[thread];
        if (oldReq = status.req) {
            delete status.req;
            oldReq.abort();
            if (a) {
                a.textContent = (_a = globals_1.g.SITE.Build).summaryText.apply(_a, __spreadArray(['+'], a.textContent.match(/\d+/g), false));
            }
            return;
        }
        var replies = (0, __1.default)('.thread > .replyContainer', threadRoot);
        if (status.numReplies) {
            replies = replies.slice(0, (-status.numReplies));
        }
        var postsCount = 0;
        var filesCount = 0;
        for (var _i = 0, replies_1 = replies; _i < replies_1.length; _i++) {
            var reply = replies_1[_i];
            // rm clones
            if (globals_1.Conf['Quote Inlining']) {
                var inlined;
                while ((inlined = (0, _1.default)('.inlined', reply))) {
                    inlined.click();
                }
            }
            postsCount++;
            if ('file' in Get_1.default.postFromRoot(reply)) {
                filesCount++;
            }
            _1.default.rm(reply);
        }
        if (Index_1.default.enabled) { // otherwise handled by Main.addPosts
            _1.default.event('PostsRemoved', null, a.parentNode);
        }
        a.textContent = globals_1.g.SITE.Build.summaryText('+', postsCount, filesCount);
        _1.default.rm((0, _1.default)('.summary-bottom', threadRoot));
    },
    parse: function (req, thread, a) {
        var root;
        if (![200, 304].includes(req.status)) {
            a.textContent = req.status ? "Error ".concat(req.statusText, " (").concat(req.status, ")") : 'Connection Error';
            return;
        }
        globals_1.g.SITE.Build.spoilerRange[thread.board] = req.response.posts[0].custom_spoiler;
        var posts = [];
        var postsRoot = [];
        var filesCount = 0;
        for (var _i = 0, _a = req.response.posts; _i < _a.length; _i++) {
            var postData = _a[_i];
            var post;
            if (postData.no === thread.ID) {
                continue;
            }
            if ((post = thread.posts.get(postData.no)) && !post.isFetchedQuote) {
                if ('file' in post) {
                    filesCount++;
                }
                (root = post.nodes.root);
                postsRoot.push(root);
                continue;
            }
            root = globals_1.g.SITE.Build.postFromObject(postData, thread.board.ID);
            post = new Post_1.default(root, thread, thread.board);
            if ('file' in post) {
                filesCount++;
            }
            posts.push(post);
            postsRoot.push(root);
        }
        for (var _b = 0, posts_1 = posts; _b < posts_1.length; _b++) {
            var post_1 = posts_1[_b];
            Callbacks_1.default.Post.execute(post_1);
        }
        _1.default.after(a, postsRoot);
        _1.default.event('PostsInserted', null, a.parentNode);
        var postsCount = postsRoot.length;
        a.textContent = globals_1.g.SITE.Build.summaryText('-', postsCount, filesCount);
        if (root) {
            var a2 = a.cloneNode(true);
            a2.classList.add('summary-bottom');
            _1.default.on(a2, 'click', ExpandThread.cbToggleBottom);
            _1.default.after(root, a2);
        }
    }
};
exports.default = ExpandThread;
