"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var RemoveSpoilers = {
    init: function () {
        if (globals_1.Conf['Reveal Spoilers']) {
            _1.default.addClass(globals_1.doc, 'reveal-spoilers');
        }
        if (!globals_1.Conf['Remove Spoilers']) {
            return;
        }
        Callbacks_1.default.Post.push({
            name: 'Reveal Spoilers',
            cb: this.node
        });
        if (globals_1.g.VIEW === 'archive') {
            return _1.default.ready(function () { return RemoveSpoilers.unspoiler(_1.default.id('arc-list')); });
        }
    },
    node: function () {
        return RemoveSpoilers.unspoiler(this.nodes.comment);
    },
    unspoiler: function (el) {
        var spoilers = (0, __1.default)(globals_1.g.SITE.selectors.spoiler, el);
        for (var _i = 0, spoilers_1 = spoilers; _i < spoilers_1.length; _i++) {
            var spoiler = spoilers_1[_i];
            var span = _1.default.el('span', { className: 'removed-spoiler' });
            _1.default.replace(spoiler, span);
            _1.default.add(span, __spreadArray([], spoiler.childNodes, true));
        }
    }
};
exports.default = RemoveSpoilers;
