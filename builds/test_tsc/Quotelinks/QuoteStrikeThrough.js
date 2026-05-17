"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Get_1 = require("../General/Get");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var QuoteStrikeThrough = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) ||
            (!globals_1.Conf['Reply Hiding Buttons'] && (!globals_1.Conf['Menu'] || !globals_1.Conf['Reply Hiding Link']) && !globals_1.Conf['Filter'])) {
            return;
        }
        return Callbacks_1.default.Post.push({
            name: 'Strike-through Quotes',
            cb: this.node
        });
    },
    node: function () {
        var _a;
        if (this.isClone) {
            return;
        }
        for (var _i = 0, _b = this.nodes.quotelinks; _i < _b.length; _i++) {
            var quotelink = _b[_i];
            var _c = Get_1.default.postDataFromLink(quotelink), boardID = _c.boardID, postID = _c.postID;
            if ((_a = globals_1.g.posts.get("".concat(boardID, ".").concat(postID))) === null || _a === void 0 ? void 0 : _a.isHidden) {
                _1.default.addClass(quotelink, 'filtered');
            }
        }
    }
};
exports.default = QuoteStrikeThrough;
