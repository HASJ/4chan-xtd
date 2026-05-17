"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BoardConfig_1 = require("../General/BoardConfig");
var globals_1 = require("../globals/globals");
var SimpleDict_1 = require("./SimpleDict");
var helpers_1 = require("../platform/helpers");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Board = /** @class */ (function () {
    function Board(ID) {
        var _a;
        this.ID = ID;
        this.boardID = this.ID;
        this.siteID = globals_1.g.SITE.ID;
        this.threads = new SimpleDict_1.default();
        this.posts = new SimpleDict_1.default();
        this.config = ((_a = BoardConfig_1.default.boards) === null || _a === void 0 ? void 0 : _a[this.ID]) || {};
        globals_1.g.boards[this.ID] = this;
    }
    Board.prototype.toString = function () { return this.ID; };
    Board.prototype.cooldowns = function () {
        var c2 = (this.config || {}).cooldowns || {};
        var c = {
            thread: c2.threads || 0,
            reply: c2.replies || 0,
            image: c2.images || 0,
            thread_global: 300 // inter-board thread cooldown
        };
        // Pass users have reduced cooldowns.
        if ((0, helpers_1.isPassEnabled)()) {
            for (var _i = 0, _a = ['reply', 'image']; _i < _a.length; _i++) {
                var key = _a[_i];
                c[key] = Math.ceil(c[key] / 2);
            }
        }
        return c;
    };
    return Board;
}());
exports.default = Board;
