"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var _1 = require("../platform/$");
var Callbacks_1 = require("../classes/Callbacks");
var ExpandComment_1 = require("../Miscellaneous/ExpandComment");
var globals_1 = require("../globals/globals");
var Get_1 = require("../General/Get");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var QuoteCT = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Mark Cross-thread Quotes']) {
            return;
        }
        if (globals_1.Conf['Comment Expansion']) {
            ExpandComment_1.default.callbacks.push(this.node);
        }
        // \u00A0 is nbsp
        this.mark = _1.default.el('span', {
            textContent: '\u00A0(Cross-thread)',
            className: 'qmark-ct'
        });
        return Callbacks_1.default.Post.push({
            name: 'Mark Cross-thread Quotes',
            cb: this.node
        });
    },
    node: function () {
        // Stop there if it's a clone of a post in the same thread.
        if (this.isClone && (this.thread === this.context.thread)) {
            return;
        }
        var _a = this.context, board = _a.board, thread = _a.thread;
        for (var _i = 0, _b = this.nodes.quotelinks; _i < _b.length; _i++) {
            var quotelink = _b[_i];
            var _c = Get_1.default.postDataFromLink(quotelink), boardID = _c.boardID, threadID = _c.threadID;
            if (!threadID) {
                continue;
            } // deadlink
            if (this.isClone) {
                _1.default.rm((0, _1.default)('.qmark-ct', quotelink));
            }
            if ((boardID === board.ID) && (threadID !== thread.ID)) {
                _1.default.add(quotelink, QuoteCT.mark.cloneNode(true));
            }
        }
    }
};
exports.default = QuoteCT;
