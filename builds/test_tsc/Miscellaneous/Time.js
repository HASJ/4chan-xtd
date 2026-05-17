"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../platform/$");
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
var Time = {
    init: function () {
        if (!['index', 'thread', 'archive'].includes(globals_1.g.VIEW) || !globals_1.Conf['Time Formatting']) {
            return;
        }
        Callbacks_1.default.Post.push({
            name: 'Time Formatting',
            cb: this.node
        });
    },
    node: function () {
        if (!this.info.date || this.isClone) {
            return;
        }
        var textContent = this.nodes.date.textContent;
        this.nodes.date.textContent = textContent.match(/^\s*/)[0] + Time.format(this.info.date) + textContent.match(/\s*$/)[0];
    },
    format: function (date, formatString) {
        if (formatString === void 0) { formatString = globals_1.Conf['time']; }
        return formatString.replace(/%(.)/g, function (s, c) {
            if (_1.default.hasOwn(Time.formatters, c)) {
                return Time.formatters[c].call(date);
            }
            else {
                return s;
            }
        });
    },
    zeroPad: function (n) { if (n < 10) {
        return "0".concat(n);
    }
    else {
        return n;
    } },
    // Setting up the formatter takes more time than actually formatting the date,
    // So while setting up this cache is a bit more code, it's faster at runtime
    formatterCache: new Map(),
    formatters: {
        a: function () {
            var formatter = Time.formatterCache.get('a');
            if (!formatter) {
                // || undefined to fall back to browser locale, an empty string gives an error
                formatter = Intl.DateTimeFormat(globals_1.Conf['timeLocale'] || undefined, { weekday: 'short' });
                Time.formatterCache.set('a', formatter);
            }
            return formatter.format(this);
        },
        A: function () {
            var formatter = Time.formatterCache.get('A');
            if (!formatter) {
                formatter = Intl.DateTimeFormat(globals_1.Conf['timeLocale'] || undefined, { weekday: 'long' });
                Time.formatterCache.set('A', formatter);
            }
            return formatter.format(this);
        },
        b: function () {
            var formatter = Time.formatterCache.get('b');
            if (!formatter) {
                formatter = Intl.DateTimeFormat(globals_1.Conf['timeLocale'] || undefined, { month: 'short' });
                Time.formatterCache.set('b', formatter);
            }
            return formatter.format(this);
        },
        B: function () {
            var formatter = Time.formatterCache.get('B');
            if (!formatter) {
                formatter = Intl.DateTimeFormat(globals_1.Conf['timeLocale'] || undefined, { month: 'long' });
                Time.formatterCache.set('B', formatter);
            }
            return formatter.format(this);
        },
        d: function () { return Time.zeroPad(this.getDate()); },
        e: function () { return this.getDate(); },
        H: function () { return Time.zeroPad(this.getHours()); },
        I: function () { return Time.zeroPad((this.getHours() % 12) || 12); },
        k: function () { return this.getHours(); },
        l: function () { return (this.getHours() % 12) || 12; },
        m: function () { return Time.zeroPad(this.getMonth() + 1); },
        n: function () { return this.getMonth() + 1; },
        M: function () { return Time.zeroPad(this.getMinutes()); },
        p: function () {
            var formatter = Time.formatterCache.get('p');
            if (!formatter) {
                formatter = Intl.DateTimeFormat(globals_1.Conf['timeLocale'] || undefined, { hour: 'numeric', hour12: true });
                Time.formatterCache.set('p', formatter);
            }
            var parts = formatter.formatToParts(this);
            return parts.find(function (entry) { return entry.type === 'dayPeriod'; }).value;
        },
        P: function () { return Time.formatters.p.call(this).toLowerCase(); },
        S: function () { return Time.zeroPad(this.getSeconds()); },
        y: function () { return this.getFullYear().toString().slice(2); },
        Y: function () { return this.getFullYear(); },
        '%': function () { return '%'; }
    },
};
exports.default = Time;
