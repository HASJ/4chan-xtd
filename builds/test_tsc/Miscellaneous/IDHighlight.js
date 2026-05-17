"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var IDHighlight = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW)) {
            return;
        }
        return Callbacks_1.default.Post.push({
            name: 'Highlight by User ID',
            cb: this.node
        });
    },
    uniqueID: null,
    node: function () {
        if (this.nodes.uniqueIDRoot) {
            _1.default.on(this.nodes.uniqueIDRoot, 'click', IDHighlight.click(this));
        }
        if (this.nodes.capcode) {
            _1.default.on(this.nodes.capcode, 'click', IDHighlight.click(this));
        }
        if (!this.isClone) {
            return IDHighlight.set(this);
        }
    },
    set: function (post) {
        var match = (post.info.uniqueID || post.info.capcode) === IDHighlight.uniqueID;
        return _1.default[match ? 'addClass' : 'rmClass'](post.nodes.post, 'highlight');
    },
    click: function (post) {
        return function () {
            var uniqueID = post.info.uniqueID || post.info.capcode;
            IDHighlight.uniqueID = IDHighlight.uniqueID === uniqueID ? null : uniqueID;
            return globals_1.g.posts.forEach(IDHighlight.set);
        };
    }
};
exports.default = IDHighlight;
