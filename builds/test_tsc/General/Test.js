"use strict";
// @ts-nocheck
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Notice_1 = require("../classes/Notice");
var Post_1 = require("../classes/Post");
var Config_1 = require("../config/Config");
var Filter_1 = require("../Filtering/Filter");
var ImageHost_1 = require("../Images/ImageHost");
var Keybinds_1 = require("../Miscellaneous/Keybinds");
var Unread_1 = require("../Monitoring/Unread");
var __1 = require("../platform/$$");
var _1 = require("../platform/$");
var Header_1 = require("./Header");
var globals_1 = require("../globals/globals");
var Menu_1 = require("../Menu/Menu");
var Test = {
    init: function () {
        if ((globals_1.g.SITE.software !== 'yotsuba') || !['index', 'thread'].includes(globals_1.g.VIEW)) {
            return;
        }
        if (globals_1.Conf['Menu']) {
            var a_1 = _1.default.el('a', { textContent: 'Test HTML building' });
            _1.default.on(a_1, 'click', this.cb.testOne);
            Menu_1.default.menu.addEntry({
                el: a_1,
                open: function (post) {
                    a_1.dataset.fullID = post.fullID;
                    return true;
                }
            });
        }
        var a2 = _1.default.el('a', { textContent: 'Test HTML building' });
        _1.default.on(a2, 'click', this.cb.testAll);
        Header_1.default.menu.addEntry({
            el: a2
        });
        if (Unread_1.default.posts) {
            var testOrderLink = _1.default.el('a', { textContent: 'Test Post Order' });
            _1.default.on(testOrderLink, 'click', this.cb.testOrder);
            Header_1.default.menu.addEntry({
                el: testOrderLink
            });
        }
        return _1.default.on(globals_1.d, 'keydown', this.cb.keydown);
    },
    assert: function (condition) {
        if (!condition()) {
            return new Notice_1.default('warning', "Assertion failed: ".concat(condition), 30);
        }
    },
    normalize: function (root) {
        var _a, _b, _c;
        var el, i;
        var node;
        var root2 = root.cloneNode(true);
        for (var _i = 0, _d = (0, __1.default)('.mobile', root2); _i < _d.length; _i++) {
            el = _d[_i];
            _1.default.rm(el);
        }
        for (var _e = 0, _f = (0, __1.default)('a[href]', root2); _e < _f.length; _e++) {
            el = _f[_e];
            var href = el.href;
            href = href.replace(/(^\w+:\/\/boards\.4chan(?:nel)?\.org\/[^\/]+\/thread\/\d+)\/.*/, '$1');
            el.setAttribute('href', href);
        }
        ImageHost_1.default.fixLinks((0, __1.default)('.fileText > a, a.fileThumb', root2));
        for (var _g = 0, _h = (0, __1.default)('img[src]', root2); _g < _h.length; _g++) {
            el = _h[_g];
            el.src = el.src.replace(/(spoiler-\w+)\d(\.png)$/, '$11$2');
        }
        for (var _j = 0, _k = (0, __1.default)('pre.prettyprinted', root2); _j < _k.length; _j++) {
            el = _k[_j];
            var nodes = _1.default.X('.//br|.//wbr|.//text()', el);
            i = 0;
            nodes = ((function () {
                var result = [];
                while (node = nodes.snapshotItem(i++)) {
                    result.push(node);
                }
                return result;
            })());
            _1.default.rmAll(el);
            _1.default.add(el, nodes);
            el.normalize();
            _1.default.rmClass(el, 'prettyprinted');
        }
        for (var _l = 0, _m = (0, __1.default)('pre[style=""]', root2); _l < _m.length; _l++) {
            el = _m[_l];
            el.removeAttribute('style');
        }
        // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=1021289
        (_a = (0, _1.default)('.fileInfo[data-md5]', root2)) === null || _a === void 0 ? void 0 : _a.removeAttribute('data-md5');
        var textNodes = _1.default.X('.//text()', root2);
        i = 0;
        while (node = textNodes.snapshotItem(i++)) {
            node.data = node.data.replace(/\ +/g, ' ');
            // XXX https://a.4cdn.org/sci/thread/5942502.json, https://a.4cdn.org/news/thread/6.json, https://a.4cdn.org/wsg/thread/957536.json
            if (((_b = node.previousSibling) === null || _b === void 0 ? void 0 : _b.nodeName) === 'BR') {
                node.data = node.data.replace(/^\n+/g, '');
            }
            if (((_c = node.nextSibling) === null || _c === void 0 ? void 0 : _c.nodeName) === 'BR') {
                node.data = node.data.replace(/\n+$/g, '');
            }
            if (node.data === '') {
                _1.default.rm(node);
            }
        }
        return root2;
    },
    firstDiff: function (x, y) {
        var x2 = x.cloneNode(false);
        var y2 = y.cloneNode(false);
        if (!x2.isEqualNode(y2)) {
            return [x2, y2];
        }
        var i = 0;
        while (true) {
            x2 = x.childNodes[i];
            y2 = y.childNodes[i];
            if (!x2 || !y2) {
                return [x2, y2];
            }
            if (!x2.isEqualNode(y2)) {
                return Test.firstDiff(x2, y2);
            }
            i++;
        }
    },
    testOne: function (post) {
        Test.postsRemaining++;
        return _1.default.cache(globals_1.g.SITE.urls.threadJSON({ boardID: post.boardID, threadID: post.threadID }), function () {
            if (!this.response) {
                return;
            }
            var posts = this.response.posts;
            globals_1.g.SITE.Build.spoilerRange[post.board.ID] = posts[0].custom_spoiler;
            for (var _i = 0, posts_1 = posts; _i < posts_1.length; _i++) {
                var postData = posts_1[_i];
                if (postData.no === post.ID) {
                    var t1 = new Date().getTime();
                    var obj = globals_1.g.SITE.Build.parseJSON(postData, post.board);
                    var root = globals_1.g.SITE.Build.post(obj);
                    var t2 = new Date().getTime();
                    Test.time += t2 - t1;
                    var post2 = new Post_1.default(root, post.thread, post.board, { forBuildTest: true });
                    var fail = false;
                    var x = post.normalizedOriginal;
                    var y = post2.normalizedOriginal;
                    if (!x.isEqualNode(y)) {
                        fail = true;
                        globals_1.c.log("".concat(post.fullID, " differs"));
                        var _a = Test.firstDiff(x, y), x2 = _a[0], y2 = _a[1];
                        globals_1.c.log(x2);
                        globals_1.c.log(y2);
                        globals_1.c.log(x.outerHTML);
                        globals_1.c.log(y.outerHTML);
                    }
                    for (var key in Config_1.default.filter) {
                        if ((!key === 'General') && !((key === 'MD5') && (post.board.ID === 'f'))) {
                            var val1 = Filter_1.default.values(key, obj);
                            var val2 = Filter_1.default.values(key, post2);
                            if ((val1.length !== val2.length) || !val1.every(function (x, i) { return x === val2[i]; })) {
                                fail = true;
                                globals_1.c.log("".concat(post.fullID, " has filter bug in ").concat(key));
                                globals_1.c.log(val1);
                                globals_1.c.log(val2);
                            }
                        }
                    }
                    if (fail) {
                        Test.postsFailed++;
                    }
                    else {
                        globals_1.c.log("".concat(post.fullID, " correct"));
                    }
                    Test.postsRemaining--;
                    if (Test.postsRemaining === 0) {
                        Test.report();
                    }
                }
            }
        });
    },
    testAll: function () {
        globals_1.g.posts.forEach(function (post) {
            if (!post.isClone && !post.isFetchedQuote) {
                var abbr = void 0;
                if (!((abbr = (0, _1.default)('.abbr', post.nodes.comment)) && /Comment too long\./.test(abbr.textContent))) {
                    return Test.testOne(post);
                }
            }
        });
    },
    postsRemaining: 0,
    postsFailed: 0,
    time: 0,
    report: function () {
        if (Test.postsFailed) {
            new Notice_1.default('warning', "".concat(Test.postsFailed, " post(s) differ (").concat(Test.time, " ms)"), 30);
        }
        else {
            new Notice_1.default('success', "All correct (".concat(Test.time, " ms)"), 5);
        }
        return Test.postsFailed = (Test.time = 0);
    },
    cb: {
        testOne: function () {
            Test.testOne(globals_1.g.posts.get(this.dataset.fullID));
            return Menu_1.default.menu.close();
        },
        testAll: function () {
            Test.testAll();
            return Header_1.default.menu.close();
        },
        testOrder: function () {
            var x;
            var list1 = ((function () {
                var result = [];
                for (var _i = 0, _a = Unread_1.default.order.order(); _i < _a.length; _i++) {
                    x = _a[_i];
                    result.push(x.ID);
                }
                return result;
            })());
            var list2 = ((function () {
                var result1 = [];
                for (var _i = 0, _a = ((0, __1.default)((globals_1.g.SITE.isOPContainerThread ? "".concat(globals_1.g.SITE.selectors.thread, ", ") : '') + globals_1.g.SITE.selectors.postContainer)); _i < _a.length; _i++) {
                    x = _a[_i];
                    result1.push(+x.id.match(/\d*$/)[0]);
                }
                return result1;
            })());
            var pass = (function () {
                if (list1.length !== list2.length) {
                    return false;
                }
                for (var i = 0, end = list1.length; i < end; i++) {
                    if (list1[i] !== list2[i]) {
                        return false;
                    }
                }
                return true;
            })();
            if (pass) {
                return new Notice_1.default('success', "Orders same (".concat(list1.length, " posts)"), 5);
            }
            else {
                new Notice_1.default('warning', 'Orders differ.', 30);
                globals_1.c.log(list1);
                return globals_1.c.log(list2);
            }
        },
        keydown: function (e) {
            if (Keybinds_1.default.keyCode(e) !== 'v') {
                return;
            }
            if (['INPUT', 'TEXTAREA'].includes(e.target.nodeName)) {
                return;
            }
            Test.testAll();
            e.preventDefault();
            return e.stopPropagation();
        }
    }
};
exports.default = Test;
