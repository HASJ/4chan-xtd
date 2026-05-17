"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var QuoteInline_1 = require("./QuoteInline");
var QuotePreview_1 = require("./QuotePreview");
var QuoteYou_1 = require("./QuoteYou");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var QuoteBacklink = {
    // Backlinks appending need to work for:
    //  - previous, same, and following posts.
    //  - existing and yet-to-exist posts.
    //  - newly fetched posts.
    //  - in copies.
    // XXX what about order for fetched posts?
    //
    // First callback creates backlinks and add them to relevant containers.
    // Second callback adds relevant containers into posts.
    // This is is so that fetched posts can get their backlinks,
    // and that as much backlinks are appended in the background as possible.
    containers: (0, helpers_1.dict)(),
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Quote Backlinks']) {
            return;
        }
        // Add a class to differentiate when backlinks are at
        // the top (default) or bottom of a post
        if (this.bottomBacklinks = globals_1.Conf['Bottom Backlinks']) {
            _1.default.addClass(globals_1.doc, 'bottom-backlinks');
        }
        Callbacks_1.default.Post.push({
            name: 'Quote Backlinking Part 1',
            cb: this.firstNode
        });
        return Callbacks_1.default.Post.push({
            name: 'Quote Backlinking Part 2',
            cb: this.secondNode
        });
    },
    firstNode: function () {
        var _this = this;
        if (this.isClone || !this.quotes.length || this.isRebuilt) {
            return;
        }
        var markYours = globals_1.Conf['Mark Quotes of You'] && QuoteYou_1.default.isYou(this);
        var a = _1.default.el('a', {
            href: globals_1.g.SITE.Build.postURL(this.board.ID, this.thread.ID, this.ID),
            className: this.isHidden ? 'filtered backlink' : 'backlink',
            textContent: globals_1.Conf['backlink'].replace(/%(?:id|%)/g, function (x) { return ({ '%id': _this.ID, '%%': '%' })[x]; })
        });
        if (markYours) {
            _1.default.add(a, QuoteYou_1.default.mark.cloneNode(true));
        }
        for (var _i = 0, _a = this.quotes; _i < _a.length; _i++) {
            var quote = _a[_i];
            var post;
            var containers = [QuoteBacklink.getContainer(quote)];
            if ((post = globals_1.g.posts.get(quote)) && post.nodes.backlinkContainer) {
                // Don't add OP clones when OP Backlinks is disabled,
                // as the clones won't have the backlink containers.
                for (var _b = 0, _c = post.clones; _b < _c.length; _b++) {
                    var clone = _c[_b];
                    containers.push(clone.nodes.backlinkContainer);
                }
            }
            for (var _d = 0, containers_1 = containers; _d < containers_1.length; _d++) {
                var container = containers_1[_d];
                var link = a.cloneNode(true);
                var nodes = container.firstChild ? [_1.default.tn(' '), link] : [link];
                if (globals_1.Conf['Quote Previewing']) {
                    _1.default.on(link, 'mouseover', QuotePreview_1.default.mouseover);
                }
                if (globals_1.Conf['Quote Inlining']) {
                    _1.default.on(link, 'click', QuoteInline_1.default.toggle);
                    if (globals_1.Conf['Quote Hash Navigation']) {
                        var hash = QuoteInline_1.default.qiQuote(link, _1.default.hasClass(link, 'filtered'));
                        nodes.push(hash);
                    }
                }
                _1.default.add(container, nodes);
            }
        }
    },
    secondNode: function () {
        if (this.isClone && (this.origin.isReply || globals_1.Conf['OP Backlinks'])) {
            this.nodes.backlinkContainer = (0, _1.default)('.container', this.nodes.post);
            return;
        }
        // Don't backlink the OP.
        if (!this.isReply && !globals_1.Conf['OP Backlinks']) {
            return;
        }
        var container = QuoteBacklink.getContainer(this.fullID);
        this.nodes.backlinkContainer = container;
        if (QuoteBacklink.bottomBacklinks) {
            return _1.default.add(this.nodes.post, container);
        }
        else {
            return _1.default.add(this.nodes.info, container);
        }
    },
    getContainer: function (id) {
        return this.containers[id] ||
            (this.containers[id] = _1.default.el('span', { className: 'container' }));
    }
};
exports.default = QuoteBacklink;
