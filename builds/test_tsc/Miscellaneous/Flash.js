"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Flash = {
    init: function () {
        if ((globals_1.g.BOARD.ID === 'f') && globals_1.Conf['Enable Native Flash Embedding']) {
            return _1.default.ready(Flash.initReady);
        }
    },
    initReady: function () {
        if (_1.default.hasStorage) {
            _1.default.global('initFlash');
        }
        else {
            if (globals_1.g.VIEW === 'thread') {
                _1.default.global('setThreadId');
            }
            _1.default.global('initFlashNoStorage');
        }
    }
};
exports.default = Flash;
