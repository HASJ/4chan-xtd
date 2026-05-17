"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var _1 = require("../platform/$");
var CatalogThread = /** @class */ (function () {
    function CatalogThread(root, thread) {
        this.thread = thread;
        this.ID = this.thread.ID;
        this.board = this.thread.board;
        var post = this.thread.OP.nodes.post;
        this.nodes = {
            root: root,
            thumb: (0, _1.default)('.catalog-thumb', post),
            icons: (0, _1.default)('.catalog-icons', post),
            postCount: (0, _1.default)('.post-count', post),
            fileCount: (0, _1.default)('.file-count', post),
            pageCount: (0, _1.default)('.page-count', post),
            replies: null
        };
        this.thread.catalogView = this;
    }
    CatalogThread.prototype.toString = function () { return this.ID; };
    return CatalogThread;
}());
exports.default = CatalogThread;
