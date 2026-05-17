"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var $$ = function (selector, root) {
    if (root === void 0) { root = globals_1.d.body; }
    return Array.from(root.querySelectorAll(selector));
};
exports.default = $$;
