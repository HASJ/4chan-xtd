"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../platform/$");
var SimpleDict = /** @class */ (function () {
    function SimpleDict() {
        this.keys = [];
    }
    SimpleDict.prototype.push = function (key, data) {
        key = "".concat(key);
        if (!this[key]) {
            this.keys.push(key);
        }
        this[key] = data;
    };
    SimpleDict.prototype.insert = function (key, data, compare) {
        if (compare === void 0) { compare = function (lastKey, key) { return (+lastKey) < (+key); }; }
        var keyString = key.toString();
        if (keyString in this) {
            this[keyString] = data;
            return this.keys.indexOf(keyString);
        }
        var length = this.keys.length;
        if (!length || compare(this.lastKey(), key)) {
            this.push(key, data);
            return length;
        }
        var indexOfNext = this.keys.findIndex(function (k) { return !compare(k, key); });
        if (indexOfNext === -1) {
            this.push(key, data);
        }
        else {
            this[keyString] = data;
            this.keys.splice(indexOfNext, 0, keyString);
        }
        return indexOfNext;
    };
    SimpleDict.prototype.insertAt = function (key, index, data) {
        this[key] = data;
        this.keys.splice(index, 0, key);
    };
    SimpleDict.prototype.rm = function (key) {
        var i;
        key = "".concat(key);
        if ((i = this.keys.indexOf(key)) !== -1) {
            this.keys.splice(i, 1);
            delete this[key];
        }
    };
    SimpleDict.prototype.forEach = function (fn) {
        for (var _i = 0, _a = this.keys; _i < _a.length; _i++) {
            var key = _a[_i];
            fn(this[key]);
        }
    };
    SimpleDict.prototype.get = function (key) {
        if (key === 'keys') {
            return undefined;
        }
        else {
            return _1.default.getOwn(this, key);
        }
    };
    SimpleDict.prototype.lastKey = function () {
        return this.keys[this.keys.length - 1];
    };
    SimpleDict.prototype.last = function () {
        return this.keys.length ? this[this.keys.length - 1] : undefined;
    };
    return SimpleDict;
}());
exports.default = SimpleDict;
