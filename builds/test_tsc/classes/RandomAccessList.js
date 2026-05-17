"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var RandomAccessList = /** @class */ (function () {
    function RandomAccessList(items) {
        this.length = 0;
        if (items) {
            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                var item = items_1[_i];
                this.push(item);
            }
        }
    }
    RandomAccessList.prototype.push = function (data) {
        var item;
        var ID = data.ID;
        if (!ID) {
            ID = data.id;
        }
        if (this[ID]) {
            return;
        }
        var last = this.last;
        this[ID] = (item = {
            prev: last,
            next: null,
            data: data,
            ID: ID
        });
        item.prev = last;
        this.last = last ?
            (last.next = item)
            :
                (this.first = item);
        return this.length++;
    };
    RandomAccessList.prototype.before = function (root, item) {
        if ((item.next === root) || (item === root)) {
            return;
        }
        this.rmi(item);
        var prev = root.prev;
        root.prev = item;
        item.next = root;
        item.prev = prev;
        if (prev) {
            return prev.next = item;
        }
        else {
            return this.first = item;
        }
    };
    RandomAccessList.prototype.after = function (root, item) {
        if ((item.prev === root) || (item === root)) {
            return;
        }
        this.rmi(item);
        var next = root.next;
        root.next = item;
        item.prev = root;
        item.next = next;
        if (next) {
            return next.prev = item;
        }
        else {
            return this.last = item;
        }
    };
    RandomAccessList.prototype.prepend = function (item) {
        var first = this.first;
        if ((item === first) || !this[item.ID]) {
            return;
        }
        this.rmi(item);
        item.next = first;
        if (first) {
            first.prev = item;
        }
        else {
            this.last = item;
        }
        this.first = item;
        return delete item.prev;
    };
    RandomAccessList.prototype.shift = function () {
        return this.rm(this.first.ID);
    };
    RandomAccessList.prototype.order = function () {
        var item;
        var order = [(item = this.first)];
        while ((item = item.next)) {
            order.push(item);
        }
        return order;
    };
    RandomAccessList.prototype.rm = function (ID) {
        var item = this[ID];
        if (!item) {
            return;
        }
        delete this[ID];
        this.length--;
        this.rmi(item);
        delete item.next;
        return delete item.prev;
    };
    RandomAccessList.prototype.rmi = function (item) {
        var prev = item.prev, next = item.next;
        if (prev) {
            prev.next = next;
        }
        else {
            this.first = next;
        }
        if (next) {
            return next.prev = prev;
        }
        else {
            return this.last = prev;
        }
    };
    return RandomAccessList;
}());
exports.default = RandomAccessList;
