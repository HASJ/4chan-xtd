"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var BoardConfig_1 = require("../General/BoardConfig");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var ExpandComment_1 = require("./ExpandComment");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Fourchan = {
    init: function () {
        if ((globals_1.g.SITE.software !== 'yotsuba') || !['index', 'thread', 'archive'].includes(globals_1.g.VIEW)) {
            return;
        }
        BoardConfig_1.default.ready(this.initBoard);
        return _1.default.on(globals_1.d, '4chanXInitFinished', this.initReady);
    },
    initBoard: function () {
        if (globals_1.g.BOARD.config.code_tags) {
            _1.default.on(window, 'prettyprint:cb', function (e) {
                var post, pre;
                if (!(post = globals_1.g.posts.get(e.detail.ID))) {
                    return;
                }
                if (!(pre = (0, __1.default)('.prettyprint', post.nodes.comment)[+e.detail.i])) {
                    return;
                }
                if (!_1.default.hasClass(pre, 'prettyprinted')) {
                    pre.innerHTML = e.detail.html;
                    return _1.default.addClass(pre, 'prettyprinted');
                }
            });
            _1.default.global('fourChanPrettyPrintListener');
            Callbacks_1.default.Post.push({
                name: 'Parse [code] tags',
                cb: Fourchan.code
            });
            globals_1.g.posts.forEach(function (post) {
                if (post.callbacksExecuted) {
                    return Callbacks_1.default.Post.execute(post, ['Parse [code] tags'], true);
                }
            });
            ExpandComment_1.default.callbacks.push(Fourchan.code);
        }
        if (globals_1.g.BOARD.config.math_tags) {
            _1.default.global('fourChanMathjaxListener');
            Callbacks_1.default.Post.push({
                name: 'Parse [math] tags',
                cb: Fourchan.math
            });
            globals_1.g.posts.forEach(function (post) {
                if (post.callbacksExecuted) {
                    return Callbacks_1.default.Post.execute(post, ['Parse [math] tags'], true);
                }
            });
            return ExpandComment_1.default.callbacks.push(Fourchan.math);
        }
    },
    // Disable 4chan's ID highlighting (replaced by IDHighlight) and reported post hiding.
    initReady: function () {
        return _1.default.global('disable4chanIdHl');
    },
    code: function () {
        var _this = this;
        if (this.isClone) {
            return;
        }
        return _1.default.ready(function () {
            var iterable = (0, __1.default)('.prettyprint', _this.nodes.comment);
            for (var i = 0; i < iterable.length; i++) {
                var pre = iterable[i];
                if (!_1.default.hasClass(pre, 'prettyprinted')) {
                    _1.default.event('prettyprint', { ID: _this.fullID, i: i, html: pre.innerHTML }, window);
                }
            }
        });
    },
    math: function () {
        var _this = this;
        var wbrs;
        if (!/\[(math|eqn)\]/.test(this.nodes.comment.textContent)) {
            return;
        }
        // XXX <wbr> tags frequently break MathJax; remove them.
        if ((wbrs = (0, __1.default)('wbr', this.nodes.comment)).length) {
            for (var _i = 0, wbrs_1 = wbrs; _i < wbrs_1.length; _i++) {
                var wbr = wbrs_1[_i];
                _1.default.rm(wbr);
            }
            this.nodes.comment.normalize();
        }
        var cb = function () {
            if (!globals_1.doc.contains(_this.nodes.comment)) {
                return;
            }
            _1.default.off(globals_1.d, 'PostsInserted', cb);
            return _1.default.event('mathjax', null, _this.nodes.comment);
        };
        _1.default.on(globals_1.d, 'PostsInserted', cb);
        return cb();
    }
};
exports.default = Fourchan;
