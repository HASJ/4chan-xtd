"use strict";
/*
 * This file has the code for the jsx to { innerHTML: "safe string" }
 *
 * Usage: import h from this file.
 * Attributes are stringified raw, so the names must be like html text: eg class and not className.
 * Boolean values are stringified as followed: true will mean the attribute is there, false means it will be omitted.
 * Strings bound to attributes and children will be escaped automatically.
 * It returns interface EscapedHtml { innerHTML: "safe string", [isEscaped]: true }
 *
 * For strings that don't have a parent element you can use fragments: <></>.
 * Note that you need to import hFragment, which for some reason isn't auto imported on "add all missing imports"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hFragment = exports.isEscaped = void 0;
exports.default = h;
var globals_1 = require("./globals");
/**
 * The symbol indicating that a string is safely escaped.
 * This is a symbol so it can't be faked by a json blob from the internet.
 */
exports.isEscaped = Symbol('isEscaped');
var voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr',]);
exports.hFragment = Symbol('hFragment');
/** Function that jsx/tsx will be compiled to. */
function h(tag, attributes) {
    var _a;
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    var innerHTML = tag === exports.hFragment ? '' : "<".concat(tag);
    if (attributes) {
        for (var _b = 0, _c = Object.entries(attributes); _b < _c.length; _b++) {
            var _d = _c[_b], attribute = _d[0], value = _d[1];
            if (!value && value !== 0)
                continue;
            innerHTML += " ".concat(attribute);
            if (value === true)
                continue;
            innerHTML += "=\"".concat((0, globals_1.E)(value.toString()), "\"");
        }
    }
    if (tag !== exports.hFragment)
        innerHTML += '>';
    var isVoid = tag !== exports.hFragment && voidElements.has(tag);
    if (isVoid) {
        if (children.length)
            throw new TypeError("".concat(tag, " is a void html element and can't have child elements"));
    }
    else {
        for (var _e = 0, children_1 = children; _e < children_1.length; _e++) {
            var child = children_1[_e];
            if (child === null || child === undefined || child === '')
                continue;
            if (child instanceof Object && "innerHTML" in child && child[exports.isEscaped]) {
                innerHTML += child.innerHTML;
                continue;
            }
            innerHTML += (0, globals_1.E)(child.toString());
        }
    }
    if (!isVoid && tag !== exports.hFragment)
        innerHTML += "</".concat(tag, ">");
    return _a = { innerHTML: innerHTML }, _a[exports.isEscaped] = true, _a;
}
