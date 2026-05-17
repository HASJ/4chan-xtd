"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Get_1 = require("../General/Get");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ExpandComment = {
    init: function () {
        if ((globals_1.g.VIEW !== 'index') || !globals_1.Conf['Comment Expansion'] || globals_1.Conf['JSON Index']) {
            return;
        }
        return Callbacks_1.default.Post.push({
            name: 'Comment Expansion',
            cb: this.node
        });
    },
    node: function () {
        var a;
        if (a = (0, _1.default)('.abbr > a:not([onclick])', this.nodes.comment)) {
            return _1.default.on(a, 'click', ExpandComment.cb);
        }
    },
    callbacks: [],
    cb: function (e) {
        e.preventDefault();
        return ExpandComment.expand(Get_1.default.postFromNode(this));
    },
    expand: function (post) {
        var a;
        if (post.nodes.longComment && !post.nodes.longComment.parentNode) {
            _1.default.replace(post.nodes.shortComment, post.nodes.longComment);
            post.nodes.comment = post.nodes.longComment;
            return;
        }
        if (!(a = (0, _1.default)('.abbr > a', post.nodes.comment))) {
            return;
        }
        a.textContent = "Post No.".concat(post, " Loading...");
        return _1.default.cache(globals_1.g.SITE.urls.threadJSON({ boardID: post.boardID, threadID: post.threadID }), function () { return ExpandComment.parse(this, a, post); });
    },
    contract: function (post) {
        if (!post.nodes.shortComment) {
            return;
        }
        var a = (0, _1.default)('.abbr > a', post.nodes.shortComment);
        a.textContent = 'here';
        _1.default.replace(post.nodes.longComment, post.nodes.shortComment);
        return post.nodes.comment = post.nodes.shortComment;
    },
    parse: function (req, a, post) {
        var postObj, spoilerRange;
        var status = req.status;
        if (![200, 304].includes(status)) {
            a.textContent = status ? "Error ".concat(req.statusText, " (").concat(status, ")") : 'Connection Error';
            return;
        }
        var posts = req.response.posts;
        if (spoilerRange = posts[0].custom_spoiler) {
            globals_1.g.SITE.Build.spoilerRange[globals_1.g.BOARD] = spoilerRange;
        }
        for (var _i = 0, posts_1 = posts; _i < posts_1.length; _i++) {
            postObj = posts_1[_i];
            if (postObj.no === post.ID) {
                break;
            }
        }
        if (postObj.no !== post.ID) {
            a.textContent = "Post No.".concat(post, " not found.");
            return;
        }
        var comment = post.nodes.comment;
        var clone = comment.cloneNode(false);
        clone.innerHTML = postObj.com;
        // Fix pathnames
        for (var _a = 0, _b = (0, __1.default)('.quotelink', clone); _a < _b.length; _a++) {
            var quote = _b[_a];
            var href = quote.getAttribute('href');
            if (href[0] === '/') {
                continue;
            } // Cross-board quote, or board link
            if (href[0] === '#') {
                quote.href = "".concat(a.pathname.split(/\/+/).splice(0, 4).join('/')).concat(href);
            }
            else {
                quote.href = "".concat(a.pathname.split(/\/+/).splice(0, 3).join('/'), "/").concat(href);
            }
        }
        post.nodes.shortComment = comment;
        _1.default.replace(comment, clone);
        post.nodes.comment = (post.nodes.longComment = clone);
        post.parseComment();
        post.parseQuotes();
        for (var _c = 0, _d = ExpandComment.callbacks; _c < _d.length; _c++) {
            var callback = _d[_c];
            callback.call(post);
        }
    }
};
exports.default = ExpandComment;
;
