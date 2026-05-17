"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var Board_1 = require("./Board");
var Thread_1 = require("./Thread");
var CatalogThreadNative = /** @class */ (function () {
    function CatalogThreadNative(root) {
        this.nodes = {
            root: root,
            thumb: (0, _1.default)(globals_1.g.SITE.selectors.catalog.thumb, root)
        };
        this.siteID = globals_1.g.SITE.ID;
        this.boardID = this.nodes.thumb.parentNode.pathname.split(/\/+/)[1];
        this.board = globals_1.g.boards[this.boardID] || new Board_1.default(this.boardID);
        this.ID = (this.threadID = +(root.dataset.id || root.id).match(/\d*$/)[0]);
        this.thread = this.board.threads.get(this.ID) || new Thread_1.default(this.ID, this.board);
    }
    CatalogThreadNative.prototype.toString = function () { return this.ID; };
    return CatalogThreadNative;
}());
exports.default = CatalogThreadNative;
