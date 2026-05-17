"use strict";
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Callbacks = /** @class */ (function () {
    function Callbacks(type) {
        this.type = type;
        this.keys = [];
    }
    Callbacks.initClass = function () {
        this.Post = new Callbacks('Post');
        this.Thread = new Callbacks('Thread');
        this.CatalogThread = new Callbacks('Catalog Thread');
        this.CatalogThreadNative = new Callbacks('Catalog Thread');
    };
    Callbacks.prototype.push = function (_a) {
        var name = _a.name, cb = _a.cb;
        if (!this[name]) {
            this.keys.push(name);
        }
        return this[name] = cb;
    };
    Callbacks.prototype.execute = function (node, keys, force) {
        var _a, _b, _c, _d;
        if (keys === void 0) { keys = this.keys; }
        if (force === void 0) { force = false; }
        var errors;
        if (node.callbacksExecuted && !force) {
            return;
        }
        node.callbacksExecuted = true;
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var name = keys_1[_i];
            try {
                (_a = this[name]) === null || _a === void 0 ? void 0 : _a.call(node);
            }
            catch (err) {
                if (!errors) {
                    errors = [];
                }
                errors.push({
                    message: ['"', name, '" crashed on node ', this.type, ' No.', node.ID, ' (', node.board, ').'].join(''),
                    error: err,
                    html: (_c = (_b = node.nodes) === null || _b === void 0 ? void 0 : _b.root) === null || _c === void 0 ? void 0 : _c.outerHTML
                });
            }
        }
        if (errors) {
            return (_d = Callbacks.errorHandler) === null || _d === void 0 ? void 0 : _d.call(Callbacks, errors);
        }
    };
    return Callbacks;
}());
exports.default = Callbacks;
Callbacks.errorHandler = null;
Callbacks.initClass();
