"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ThreadLinks = {
    init: function () {
        if ((globals_1.g.VIEW !== 'index') || !globals_1.Conf['Open Threads in New Tab']) {
            return;
        }
        Callbacks_1.default.Post.push({
            name: 'Thread Links',
            cb: this.node
        });
        return Callbacks_1.default.CatalogThread.push({
            name: 'Thread Links',
            cb: this.catalogNode
        });
    },
    node: function () {
        if (this.isReply || this.isClone) {
            return;
        }
        return ThreadLinks.process(this.nodes.reply);
    },
    catalogNode: function () {
        return ThreadLinks.process(this.nodes.thumb.parentNode);
    },
    process: function (link) {
        return link.target = '_blank';
    }
};
exports.default = ThreadLinks;
