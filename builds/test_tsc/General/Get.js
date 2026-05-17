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
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Get = {
    url: function (type, IDs) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var f, site;
        if ((site = globals_1.g.sites[IDs.siteID]) && (f = _1.default.getOwn(site.urls, type))) {
            return f.apply(void 0, __spreadArray([IDs], args, false));
        }
        else {
            return undefined;
        }
    },
    threadExcerpt: function (thread) {
        var _a, _b;
        var OP = thread.OP;
        var excerpt = ("/".concat(decodeURIComponent(thread.board.ID), "/ - ")) + (((_a = OP.info.subject) === null || _a === void 0 ? void 0 : _a.trim()) ||
            OP.commentDisplay().replace(/\n+/g, ' // ') ||
            ((_b = OP.file) === null || _b === void 0 ? void 0 : _b.name) ||
            "No.".concat(OP));
        if (excerpt.length > 73) {
            return "".concat(excerpt.slice(0, 70), "...");
        }
        return excerpt;
    },
    threadFromRoot: function (root) {
        if (root == null) {
            return null;
        }
        var board = root.dataset.board;
        return globals_1.g.threads.get("".concat(board ? encodeURIComponent(board) : globals_1.g.BOARD.ID, ".").concat(root.id.match(/\d*$/)[0]));
    },
    threadFromNode: function (node) {
        return Get.threadFromRoot(_1.default.x("ancestor-or-self::".concat(globals_1.g.SITE.xpath.thread), node));
    },
    postFromRoot: function (root) {
        if (root == null) {
            return null;
        }
        var post = globals_1.g.posts.get(root.dataset.fullID);
        var index = root.dataset.clone;
        if (index) {
            return post.clones[+index];
        }
        else {
            return post;
        }
    },
    postFromNode: function (root) {
        return Get.postFromRoot(_1.default.x("ancestor-or-self::".concat(globals_1.g.SITE.xpath.postContainer, "[1]"), root));
    },
    postDataFromLink: function (link) {
        var _a, _b;
        var boardID, postID, threadID;
        if (link.dataset.postID) { // resurrected quote
            (_a = link.dataset, boardID = _a.boardID, threadID = _a.threadID, postID = _a.postID);
            if (!threadID) {
                threadID = 0;
            }
        }
        else {
            var match = link.href.match(globals_1.g.SITE.regexp.quotelink);
            _b = match.slice(1), boardID = _b[0], threadID = _b[1], postID = _b[2];
            if (!postID) {
                postID = threadID;
            }
        }
        return {
            boardID: boardID,
            threadID: +threadID,
            postID: +postID
        };
    },
    allQuotelinksLinkingTo: function (post) {
        // Get quotelinks & backlinks linking to the given post.
        var quotelinks = [];
        var posts = globals_1.g.posts;
        var fullID = post.fullID;
        var handleQuotes = function (qPost, type) {
            quotelinks.push.apply(quotelinks, (qPost.nodes[type] || []));
            for (var _i = 0, _a = qPost.clones; _i < _a.length; _i++) {
                var clone = _a[_i];
                quotelinks.push.apply(quotelinks, (clone.nodes[type] || []));
            }
        };
        // First:
        //   In every posts,
        //   if it did quote this post,
        //   get all their backlinks.
        posts.forEach(function (qPost) {
            if (qPost.quotes.includes(fullID)) {
                return handleQuotes(qPost, 'quotelinks');
            }
        });
        // Second:
        //   If we have quote backlinks:
        //   in all posts this post quoted
        //   and their clones,
        //   get all of their backlinks.
        if (globals_1.Conf['Quote Backlinks']) {
            for (var _i = 0, _a = post.quotes; _i < _a.length; _i++) {
                var quote = _a[_i];
                var qPost;
                if ((qPost = posts.get(quote))) {
                    handleQuotes(qPost, 'backlinks');
                }
            }
        }
        // Third:
        //   Filter out irrelevant quotelinks.
        return quotelinks.filter(function (quotelink) {
            var _a = Get.postDataFromLink(quotelink), boardID = _a.boardID, postID = _a.postID;
            return (boardID === post.board.ID) && (postID === post.ID);
        });
    }
};
exports.default = Get;
