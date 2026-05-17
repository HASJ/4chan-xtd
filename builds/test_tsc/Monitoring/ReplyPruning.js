"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Header_1 = require("../General/Header");
var UI_1 = require("../General/UI");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var QuoteThreading_1 = require("../Quotelinks/QuoteThreading");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ReplyPruning = {
    init: function () {
        var _this = this;
        if ((globals_1.g.VIEW !== 'thread') || !globals_1.Conf['Reply Pruning']) {
            return;
        }
        this.container = _1.default.frag();
        this.summary = _1.default.el('span', {
            hidden: true,
            className: 'summary'
        });
        this.summary.style.cursor = 'pointer';
        _1.default.on(this.summary, 'click', function () {
            _this.inputs.enabled.checked = !_this.inputs.enabled.checked;
            return _1.default.event('change', null, _this.inputs.enabled);
        });
        var label = UI_1.default.checkbox('Prune Replies', 'Show Last', globals_1.Conf['Prune All Threads']);
        var el = _1.default.el('span', { title: 'Maximum number of replies to show.' }, { innerHTML: " <input type=\"number\" name=\"Max Replies\" min=\"0\" step=\"1\" value=\"" + (0, globals_1.E)(globals_1.Conf["Max Replies"]) + "\" class=\"field\">" });
        _1.default.prepend(el, label);
        this.inputs = {
            enabled: label.firstElementChild,
            replies: el.lastElementChild
        };
        this.setEnabled.call(this.inputs.enabled);
        _1.default.on(this.inputs.enabled, 'change', this.setEnabled);
        _1.default.on(this.inputs.replies, 'change', _1.default.cb.value);
        Header_1.default.menu.addEntry({
            el: el,
            order: 190
        });
        return Callbacks_1.default.Thread.push({
            name: 'Reply Pruning',
            cb: this.node
        });
    },
    position: 0,
    hidden: 0,
    hiddenFiles: 0,
    total: 0,
    totalFiles: 0,
    setEnabled: function () {
        var other = QuoteThreading_1.default.input;
        if (this.checked && (other === null || other === void 0 ? void 0 : other.checked)) {
            other.checked = false;
            _1.default.event('change', null, other);
        }
        return ReplyPruning.active = this.checked;
    },
    showIfHidden: function (id) {
        if (ReplyPruning.container && (0, _1.default)("#".concat(id), ReplyPruning.container)) {
            ReplyPruning.inputs.enabled.checked = false;
            return _1.default.event('change', null, ReplyPruning.inputs.enabled);
        }
    },
    node: function () {
        var middle;
        ReplyPruning.thread = this;
        if (this.isSticky) {
            ReplyPruning.active = (ReplyPruning.inputs.enabled.checked = true);
            if (QuoteThreading_1.default.input) {
                // Disable Quote Threading for this thread but don't save the setting.
                globals_1.Conf['Thread Quotes'] = (QuoteThreading_1.default.input.checked = false);
            }
        }
        this.posts.forEach(function (post) {
            if (post.isReply) {
                ReplyPruning.total++;
                if (post.file) {
                    return ReplyPruning.totalFiles++;
                }
            }
        });
        // If we're linked to a post that we would hide, don't hide the posts in the first place.
        if (ReplyPruning.active &&
            /^#p\d+$/.test(location.hash) &&
            (1 <= (middle = this.posts.keys.indexOf(location.hash.slice(2))) && middle < 1 + Math.max(ReplyPruning.total - +globals_1.Conf["Max Replies"], 0))) {
            ReplyPruning.active = (ReplyPruning.inputs.enabled.checked = false);
        }
        _1.default.after(this.OP.nodes.root, ReplyPruning.summary);
        _1.default.on(ReplyPruning.inputs.enabled, 'change', ReplyPruning.update);
        _1.default.on(ReplyPruning.inputs.replies, 'change', ReplyPruning.update);
        _1.default.on(globals_1.d, 'ThreadUpdate', ReplyPruning.updateCount);
        _1.default.on(globals_1.d, 'ThreadUpdate', ReplyPruning.update);
        return ReplyPruning.update();
    },
    updateCount: function (e) {
        if (e.detail[404]) {
            return;
        }
        for (var _i = 0, _a = e.detail.newPosts; _i < _a.length; _i++) {
            var fullID = _a[_i];
            ReplyPruning.total++;
            if (globals_1.g.posts.get(fullID).file) {
                ReplyPruning.totalFiles++;
            }
        }
    },
    update: function () {
        var boardTop, node, post;
        var hidden1 = ReplyPruning.hidden;
        var hidden2 = ReplyPruning.active ?
            Math.max(ReplyPruning.total - +globals_1.Conf["Max Replies"], 0)
            :
                0;
        // Record position from bottom of document
        var oldPos = globals_1.d.body.clientHeight - window.scrollY;
        var posts = ReplyPruning.thread.posts;
        if (ReplyPruning.hidden < hidden2) {
            while ((ReplyPruning.hidden < hidden2) && (ReplyPruning.position < posts.keys.length)) {
                post = posts.get(posts.keys[ReplyPruning.position++]);
                if (post.isReply && !post.isFetchedQuote) {
                    while ((node = ReplyPruning.summary.nextSibling) && (node !== post.nodes.root)) {
                        _1.default.add(ReplyPruning.container, node);
                    }
                    _1.default.add(ReplyPruning.container, post.nodes.root);
                    ReplyPruning.hidden++;
                    if (post.file) {
                        ReplyPruning.hiddenFiles++;
                    }
                }
            }
        }
        else if (ReplyPruning.hidden > hidden2) {
            var frag = _1.default.frag();
            while ((ReplyPruning.hidden > hidden2) && (ReplyPruning.position > 0)) {
                post = posts.get(posts.keys[--ReplyPruning.position]);
                if (post.isReply && !post.isFetchedQuote) {
                    while ((node = ReplyPruning.container.lastChild) && (node !== post.nodes.root)) {
                        _1.default.prepend(frag, node);
                    }
                    _1.default.prepend(frag, post.nodes.root);
                    ReplyPruning.hidden--;
                    if (post.file) {
                        ReplyPruning.hiddenFiles--;
                    }
                }
            }
            _1.default.after(ReplyPruning.summary, frag);
            _1.default.event('PostsInserted', null, ReplyPruning.summary.parentNode);
        }
        ReplyPruning.summary.textContent = ReplyPruning.active ?
            globals_1.g.SITE.Build.summaryText('+', ReplyPruning.hidden, ReplyPruning.hiddenFiles)
            :
                globals_1.g.SITE.Build.summaryText('-', ReplyPruning.total, ReplyPruning.totalFiles);
        ReplyPruning.summary.hidden = (ReplyPruning.total <= +globals_1.Conf["Max Replies"]);
        // Maintain position in thread when posts are added/removed above
        if ((hidden1 !== hidden2) && ((boardTop = Header_1.default.getTopOf((0, _1.default)('.board'))) < 0)) {
            return window.scrollBy(0, Math.max(globals_1.d.body.clientHeight - oldPos, window.scrollY + boardTop) - window.scrollY);
        }
    }
};
exports.default = ReplyPruning;
