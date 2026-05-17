"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Tinyboard = {
    init: function () {
        if (globals_1.g.SITE.software !== 'tinyboard') {
            return;
        }
        if (globals_1.g.VIEW === 'thread') {
            return _1.default.on(globals_1.d, '4chanXInitFinished', function () { return _1.default.global("initTinyBoard", { boardID: globals_1.g.BOARD.ID, threadID: globals_1.g.THREADID.toString() }); });
        }
    }
};
exports.default = Tinyboard;
