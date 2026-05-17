"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var DataBoard_1 = require("../classes/DataBoard");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var PostSuccessful = {
    init: function () {
        if (!globals_1.Conf['Remember Your Posts']) {
            return;
        }
        return _1.default.ready(this.ready);
    },
    ready: function () {
        if (globals_1.d.title !== 'Post successful!') {
            return;
        }
        var _a = (0, _1.default)('h1').nextSibling.textContent.match(/thread:(\d+),no:(\d+)/), _ = _a[0], threadID = _a[1], postID = _a[2];
        postID = +postID;
        threadID = +threadID || postID;
        var db = new DataBoard_1.default('yourPosts');
        return db.set({
            boardID: globals_1.g.BOARD.ID,
            threadID: threadID,
            postID: postID,
            val: true
        });
    }
};
exports.default = PostSuccessful;
