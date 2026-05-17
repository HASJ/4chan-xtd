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
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
var Recursive = {
    recursives: new Map(),
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW))
            return;
        Callbacks_1.default.Post.push({
            name: 'Recursive',
            cb: this.node
        });
    },
    node: function () {
        var _a;
        if (this.isClone || this.isFetchedQuote)
            return;
        for (var _i = 0, _b = this.quotes; _i < _b.length; _i++) {
            var quote = _b[_i];
            var obj = Recursive.recursives.get(quote);
            if (obj) {
                for (var i = 0; i < obj.recursives.length; i++) {
                    (_a = obj.recursives)[i].apply(_a, __spreadArray([this], obj.args[i], false));
                }
            }
        }
    },
    add: function (recursive, post) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var obj = Recursive.recursives.get(post.fullID);
        if (!obj) {
            obj = { recursives: [], args: [] };
            Recursive.recursives.set(post.fullID, obj);
        }
        obj.recursives.push(recursive);
        obj.args.push(args);
    },
    rm: function (recursive, post) {
        var obj = Recursive.recursives.get(post.fullID);
        if (!obj)
            return;
        for (var i = obj.recursives.length - 1; i >= 0; --i) {
            if (obj.recursives[i] === recursive) {
                obj.recursives.splice(i, 1);
                obj.args.splice(i, 1);
            }
        }
    },
    apply: function (recursive, post) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var fullID = post.fullID;
        globals_1.g.posts.forEach(function (post) {
            if (post.quotes.includes(fullID)) {
                recursive.apply(void 0, __spreadArray([post], args, false));
            }
        });
    },
    applyAndAdd: function (recursive, post) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        Recursive.apply.apply(Recursive, __spreadArray([recursive, post], args, false));
        this.add.apply(this, __spreadArray([recursive, post], args, false));
    },
};
exports.default = Recursive;
