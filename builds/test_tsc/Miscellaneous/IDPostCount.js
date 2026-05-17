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
var IDPostCount = {
    init: function () {
        if ((globals_1.g.VIEW !== 'thread') || !globals_1.Conf['Count Posts by ID']) {
            return;
        }
        Callbacks_1.default.Thread.push({
            name: 'Count Posts by ID',
            cb: function () { return IDPostCount.thread = this; }
        });
        return Callbacks_1.default.Post.push({
            name: 'Count Posts by ID',
            cb: this.node
        });
    },
    node: function () {
        if (this.nodes.uniqueID && (this.thread === IDPostCount.thread)) {
            return _1.default.on(this.nodes.uniqueID, 'mouseover', IDPostCount.count);
        }
    },
    count: function () {
        var uniqueID = Get_1.default.postFromNode(this).info.uniqueID;
        var n = 0;
        IDPostCount.thread.posts.forEach(function (post) {
            if (post.info.uniqueID === uniqueID) {
                return n++;
            }
        });
        return this.title = "".concat(n, " post").concat(n === 1 ? '' : 's', " by this ID");
    }
};
exports.default = IDPostCount;
