"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var _1 = require("../platform/$");
var CSS_1 = require("../css/CSS");
var globals_1 = require("../globals/globals");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var CustomCSS = {
    init: function () {
        if (!globals_1.Conf['Custom CSS']) {
            return;
        }
        return this.addStyle();
    },
    addStyle: function () {
        return this.style = _1.default.addStyle(CSS_1.default.sub(globals_1.Conf['usercss']), 'custom-css', '#fourchanx-css');
    },
    rmStyle: function () {
        if (this.style) {
            _1.default.rm(this.style);
            return delete this.style;
        }
    },
    update: function () {
        if (!this.style) {
            return this.addStyle();
        }
        return this.style.textContent = CSS_1.default.sub(globals_1.Conf['usercss']);
    }
};
exports.default = CustomCSS;
