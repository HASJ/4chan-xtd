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
var Anonymize = {
    init: function () {
        if (!globals_1.Conf['Anonymize']) {
            return;
        }
        return _1.default.addClass(globals_1.doc, 'anonymize');
    }
};
exports.default = Anonymize;
