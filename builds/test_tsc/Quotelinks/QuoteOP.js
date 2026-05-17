"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Get_1 = require("../General/Get");
var globals_1 = require("../globals/globals");
var ExpandComment_1 = require("../Miscellaneous/ExpandComment");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var QuoteOP = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Mark OP Quotes']) {
            return;
        }
        if (globals_1.Conf['Comment Expansion']) {
            ExpandComment_1.default.callbacks.push(this.node);
        }
        // \u00A0 is nbsp
        this.mark = _1.default.el('span', {
            textContent: '\u00A0(OP)',
            className: 'qmark-op'
        });
        return Callbacks_1.default.Post.push({
            name: 'Mark OP Quotes',
            cb: this.node
        });
    },
    node: function () {
        // Stop there if it's a clone of a post in the same thread.
        var i, quotelink, quotes;
        if (this.isClone && (this.thread === this.context.thread)) {
            return;
        }
        // Stop there if there's no quotes in that post.
        if (!(quotes = this.quotes).length) {
            return;
        }
        var quotelinks = this.nodes.quotelinks;
        // rm (OP) from cross-thread quotes.
        if (this.isClone && quotes.includes(this.thread.fullID)) {
            i = 0;
            while ((quotelink = quotelinks[i++])) {
                _1.default.rm((0, _1.default)('.qmark-op', quotelink));
            }
        }
        var fullID = this.context.thread.fullID;
        // add (OP) to quotes quoting this context's OP.
        if (!quotes.includes(fullID)) {
            return;
        }
        i = 0;
        while ((quotelink = quotelinks[i++])) {
            var _a = Get_1.default.postDataFromLink(quotelink), boardID = _a.boardID, postID = _a.postID;
            if ("".concat(boardID, ".").concat(postID) === fullID) {
                _1.default.add(quotelink, QuoteOP.mark.cloneNode(true));
            }
        }
    }
};
exports.default = QuoteOP;
