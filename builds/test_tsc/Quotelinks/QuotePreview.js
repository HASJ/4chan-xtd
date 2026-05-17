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
var Header_1 = require("../General/Header");
var UI_1 = require("../General/UI");
var globals_1 = require("../globals/globals");
var ExpandComment_1 = require("../Miscellaneous/ExpandComment");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var QuotePreview = {
    init: function () {
        if (!globals_1.Conf['Quote Previewing']) {
            return;
        }
        if (globals_1.g.VIEW === 'archive') {
            _1.default.on(globals_1.d, 'mouseover', function (e) {
                if ((e.target.nodeName === 'A') && _1.default.hasClass(e.target, 'quotelink')) {
                    return QuotePreview.mouseover.call(e.target, e);
                }
            });
        }
        if (!['index', 'thread'].includes(globals_1.g.VIEW)) {
            return;
        }
        if (globals_1.Conf['Comment Expansion']) {
            ExpandComment_1.default.callbacks.push(this.node);
        }
        return Callbacks_1.default.Post.push({
            name: 'Quote Previewing',
            cb: this.node
        });
    },
    node: function () {
        for (var _i = 0, _a = this.nodes.quotelinks.concat(__spreadArray([], this.nodes.backlinks, true), this.nodes.archivelinks); _i < _a.length; _i++) {
            var link = _a[_i];
            _1.default.on(link, 'mouseover', QuotePreview.mouseover);
        }
    },
    mouseover: function (e) {
        var origin;
        if ((_1.default.hasClass(this, 'inlined') && !_1.default.hasClass(globals_1.doc, 'catalog-mode')) || !globals_1.d.contains(this)) {
            return;
        }
        var _a = Get_1.default.postDataFromLink(this), boardID = _a.boardID, threadID = _a.threadID, postID = _a.postID;
        var qp = _1.default.el('div', {
            id: 'qp',
            className: 'dialog'
        });
        _1.default.add(Header_1.default.hover, qp);
        new Fetcher_1.default(boardID, threadID, postID, qp, Get_1.default.postFromNode(this));
        UI_1.default.hover({
            root: this,
            el: qp,
            latestEvent: e,
            endEvents: 'mouseout click',
            cb: QuotePreview.mouseout
        });
        if (globals_1.Conf['Quote Highlighting'] && (origin = globals_1.g.posts.get("".concat(boardID, ".").concat(postID)))) {
            var posts = [origin].concat(origin.clones);
            // Remove the clone that's in the qp from the array.
            posts.pop();
            for (var _i = 0, posts_1 = posts; _i < posts_1.length; _i++) {
                var post = posts_1[_i];
                _1.default.addClass(post.nodes.post, 'qphl');
            }
        }
    },
    mouseout: function () {
        // Stop if it only contains text.
        var root;
        if (!(root = this.el.firstElementChild)) {
            return;
        }
        _1.default.event('PostsRemoved', null, Header_1.default.hover);
        var clone = Get_1.default.postFromRoot(root);
        var post = clone.origin;
        post.rmClone(root.dataset.clone);
        if (!globals_1.Conf['Quote Highlighting']) {
            return;
        }
        for (var _i = 0, _a = [post].concat(post.clones); _i < _a.length; _i++) {
            post = _a[_i];
            _1.default.rmClass(post.nodes.post, 'qphl');
        }
    }
};
exports.default = QuotePreview;
