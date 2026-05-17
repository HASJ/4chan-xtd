"use strict";
// This file was created because these functions on $ were sometimes not initialized yet because of circular
// dependencies, so try to keep this file without dependencies, so these functions don't have to wait for something else
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPassEnabled = exports.platform = exports.DAY = exports.HOUR = exports.MINUTE = exports.SECOND = exports.dict = exports.debounce = void 0;
/**
 * @param wait Time to wait in milliseconds.
 * @param fn The function to execute
 * @param leading Wether to run immediately, otherwise it waits for timeout even if there is no older call.
 */
var debounce = function (wait, fn, leading) {
    if (leading === void 0) { leading = true; }
    var lastCall = 0;
    var timeout = null;
    var that = null;
    var args = null;
    var exec = function () {
        lastCall = Date.now();
        return fn.apply(that, args);
    };
    return function () {
        args = arguments;
        that = this;
        if (leading && lastCall < (Date.now() - wait)) {
            exec();
            return;
        }
        // stop current reset
        if (timeout !== null)
            clearTimeout(timeout);
        // after wait, let next invocation execute immediately
        timeout = setTimeout(exec, wait);
    };
};
exports.debounce = debounce;
var dict = function () { return Object.create(null); };
exports.dict = dict;
exports.dict.clone = function (obj) {
    if ((typeof obj !== 'object') || (obj === null)) {
        return obj;
    }
    else if (obj instanceof Array) {
        var arr = [];
        for (var i = 0, end = obj.length; i < end; i++) {
            arr.push(exports.dict.clone(obj[i]));
        }
        return arr;
    }
    else {
        var map = Object.create(null);
        for (var key in obj) {
            var val = obj[key];
            map[key] = exports.dict.clone(val);
        }
        return map;
    }
};
exports.dict.json = function (str) { return exports.dict.clone(JSON.parse(str)); };
exports.SECOND = 1000;
exports.MINUTE = exports.SECOND * 60;
exports.HOUR = exports.MINUTE * 60;
exports.DAY = exports.HOUR * 24;
exports.platform = window.GM_xmlhttpRequest ? 'userscript' : 'crx';
var isPassEnabled = function () {
    if (document.cookie.indexOf('pass_enabled=1') >= 0)
        return true;
    try {
        if (localStorage.getItem('4chan-tc-ticket') || localStorage.getItem('4chan_pass_token'))
            return true;
    }
    catch (e) { }
    return false;
};
exports.isPassEnabled = isPassEnabled;
