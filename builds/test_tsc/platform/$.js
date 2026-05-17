"use strict";
// @ts-nocheck
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// loosely follows the jquery api:
// http://api.jquery.com/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var Notice_1 = require("../classes/Notice");
var globals_1 = require("../globals/globals");
var helpers_1 = require("./helpers");
var package_json_1 = require("../../package.json");
var pageContext_1 = require("../PageContext/pageContext");
// not chainable
var $ = function (selector, root) {
    if (root === void 0) { root = document.body; }
    return root.querySelector(selector);
};
$.id = function (id) { return globals_1.d.getElementById(id); };
$.ready = function (fc) {
    if (globals_1.d.readyState !== 'loading') {
        $.queueTask(fc);
        return;
    }
    var cb = function () {
        $.off(globals_1.d, 'DOMContentLoaded', cb);
        fc();
    };
    $.on(globals_1.d, 'DOMContentLoaded', cb);
};
$.formData = function (form) {
    if (form instanceof HTMLFormElement) {
        return new FormData(form);
    }
    var fd = new FormData();
    for (var key in form) {
        var val = form[key];
        if (val) {
            if ((typeof val === 'object') && 'newName' in val) {
                fd.append(key, val, val.newName);
            }
            else {
                fd.append(key, val);
            }
        }
    }
    return fd;
};
$.extend = function (object, properties) {
    for (var key in properties) {
        var val = properties[key];
        object[key] = val;
    }
};
$.hasOwn = function (obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); };
$.getOwn = function (obj, key) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return obj[key];
    }
    else {
        return undefined;
    }
};
$.ajax = (function () {
    var pageXHR = XMLHttpRequest;
    if (window.wrappedJSObject && !XMLHttpRequest.wrappedJSObject) {
        try {
            pageXHR = XPCNativeWrapper(window.wrappedJSObject.XMLHttpRequest);
        }
        catch (e) { }
    }
    return function (url, options) {
        if (options === void 0) { options = {}; }
        if (options.responseType == null) {
            options.responseType = 'json';
        }
        if (!options.type) {
            options.type = (options.form && 'post') || 'get';
        }
        // XXX https://forums.lanik.us/viewtopic.php?f=64&t=24173&p=78310
        url = url.replace(/^((?:https?:)?\/\/(?:\w+\.)?(?:4chan|4channel|4cdn)\.org)\/adv\//, '$1//adv/');
        var onloadend = options.onloadend, timeout = options.timeout, responseType = options.responseType, withCredentials = options.withCredentials, type = options.type, onprogress = options.onprogress, form = options.form, headers = options.headers;
        var r = new pageXHR();
        try {
            r.open(type, url, true);
            var object = headers || {};
            for (var key in object) {
                var value = object[key];
                r.setRequestHeader(key, value);
            }
            $.extend(r, { onloadend: onloadend, timeout: timeout, responseType: responseType, withCredentials: withCredentials });
            $.extend(r.upload, { onprogress: onprogress });
            // connection error or content blocker
            $.on(r, 'error', function () { if (!r.status) {
                globals_1.c.warn("".concat(package_json_1.default.name, " failed to load: ").concat(url));
            } });
            r.send(form);
        }
        catch (err) {
            // XXX Some content blockers in Firefox (e.g. Adblock Plus and NoScript) throw an exception instead of simulating a connection error.
            if (err.result !== 0x805e0006) {
                throw err;
            }
            r.onloadend = onloadend;
            $.queueTask($.event, 'error', null, r);
            $.queueTask($.event, 'loadend', null, r);
        }
        return r;
    };
})();
// Status Code 304: Not modified
// With the `If-Modified-Since` header we only receive the HTTP headers and no body for 304 responses.
// This saves a lot of bandwidth and CPU time for both the users and the servers.
$.lastModified = (0, helpers_1.dict)();
$.whenModified = function (url, bucket, cb, options) {
    var _a;
    if (options === void 0) { options = {}; }
    var t;
    var timeout = options.timeout, ajax = options.ajax;
    var headers = (0, helpers_1.dict)();
    if ((t = (_a = $.lastModified[bucket]) === null || _a === void 0 ? void 0 : _a[url]) != null) {
        headers['If-Modified-Since'] = t;
    }
    var r = (ajax || $.ajax)(url, {
        onloadend: function () {
            ($.lastModified[bucket] || ($.lastModified[bucket] = (0, helpers_1.dict)()))[url] = this.getResponseHeader('Last-Modified');
            return cb.call(this);
        },
        timeout: timeout,
        headers: headers
    });
    return r;
};
(function () {
    var reqs = (0, helpers_1.dict)();
    $.cache = function (url, cb, options) {
        if (options === void 0) { options = {}; }
        var req;
        var ajax = options.ajax;
        if (req = reqs[url]) {
            if (req.callbacks) {
                req.callbacks.push(cb);
            }
            else {
                $.queueTask(function () { return cb.call(req, { isCached: true }); });
            }
            return req;
        }
        var onloadend = function () {
            var _this = this;
            if (!this.status) {
                delete reqs[url];
            }
            for (var _i = 0, _a = this.callbacks; _i < _a.length; _i++) {
                cb = _a[_i];
                (function (cb) { return $.queueTask(function () { return cb.call(_this, { isCached: false }); }); })(cb);
            }
            return delete this.callbacks;
        };
        req = (ajax || $.ajax)(url, { onloadend: onloadend });
        req.callbacks = [cb];
        return reqs[url] = req;
    };
    return $.cleanCache = function (testf) {
        for (var url in reqs) {
            if (testf(url)) {
                delete reqs[url];
            }
        }
    };
})();
$.cb = {
    checked: function () {
        if ($.hasOwn(globals_1.Conf, this.name)) {
            $.set(this.name, this.checked);
            return globals_1.Conf[this.name] = this.checked;
        }
    },
    value: function () {
        if ($.hasOwn(globals_1.Conf, this.name)) {
            $.set(this.name, this.value.trim());
            return globals_1.Conf[this.name] = this.value;
        }
    }
};
$.asap = function (test, cb) {
    if (test()) {
        return cb();
    }
    else {
        return setTimeout($.asap, 25, test, cb);
    }
};
$.onExists = function (root, selector, cb) {
    var el;
    if (el = $(selector, root)) {
        cb(el);
        return;
    }
    var observer = new MutationObserver(function () {
        if (el = $(selector, root)) {
            observer.disconnect();
            cb(el);
        }
    });
    observer.observe(root, { childList: true, subtree: true });
};
$.addStyle = function (css, id, test) {
    if (test === void 0) { test = 'head'; }
    var style = $.el('style', { textContent: css });
    if (id != null) {
        style.id = id;
    }
    $.onExists(globals_1.doc, test, function () { return $.add(globals_1.d.head, style); });
    return style;
};
$.addCSP = function (policy) {
    var meta = $.el('meta', {
        httpEquiv: 'Content-Security-Policy',
        content: policy
    });
    if (globals_1.d.head) {
        $.add(globals_1.d.head, meta);
        return $.rm(meta);
    }
    else {
        var head = $.add((globals_1.doc || globals_1.d), $.el('head'));
        $.add(head, meta);
        return $.rm(head);
    }
};
$.x = function (path, root) {
    if (!root) {
        root = globals_1.d.body;
    }
    // XPathResult.ANY_UNORDERED_NODE_TYPE === 8
    return globals_1.d.evaluate(path, root, null, 8, null).singleNodeValue;
};
$.X = function (path, root) {
    if (!root) {
        root = globals_1.d.body;
    }
    // XPathResult.ORDERED_NODE_SNAPSHOT_TYPE === 7
    return globals_1.d.evaluate(path, root, null, 7, null);
};
$.addClass = function (el) {
    var _a;
    var classNames = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        classNames[_i - 1] = arguments[_i];
    }
    (_a = el.classList).add.apply(_a, classNames);
};
$.rmClass = function (el) {
    var _a;
    var classNames = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        classNames[_i - 1] = arguments[_i];
    }
    (_a = el.classList).remove.apply(_a, classNames);
};
$.toggleClass = function (el, className) { return el.classList.toggle(className); };
$.hasClass = function (el, className) { return el.classList.contains(className); };
$.rm = function (el) { return el === null || el === void 0 ? void 0 : el.remove(); };
$.rmAll = function (root) { return root.textContent = null; };
$.tn = function (s) { return globals_1.d.createTextNode(s); };
$.frag = function () { return globals_1.d.createDocumentFragment(); };
$.nodes = function (nodes) {
    if (!(nodes instanceof Array)) {
        return nodes;
    }
    var frag = $.frag();
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var node = nodes_1[_i];
        frag.appendChild(node);
    }
    return frag;
};
$.add = function (parent, el) { return parent.appendChild($.nodes(el)); };
$.prepend = function (parent, el) { return parent.insertBefore($.nodes(el), parent.firstChild); };
$.after = function (root, el) { return root.parentNode.insertBefore($.nodes(el), root.nextSibling); };
$.before = function (root, el) { return root.parentNode.insertBefore($.nodes(el), root); };
$.replace = function (root, el) { return root.parentNode.replaceChild($.nodes(el), root); };
$.el = function (tag, properties, properties2) {
    var el = globals_1.d.createElement(tag);
    if (properties)
        $.extend(el, properties);
    if (properties2)
        $.extend(el, properties2);
    return el;
};
$.on = function (el, events, handler) {
    for (var _i = 0, _a = events.split(' '); _i < _a.length; _i++) {
        var event = _a[_i];
        el.addEventListener(event, handler, false);
    }
};
$.off = function (el, events, handler) {
    for (var _i = 0, _a = events.split(' '); _i < _a.length; _i++) {
        var event = _a[_i];
        el.removeEventListener(event, handler, false);
    }
};
$.one = function (el, events, handler) {
    var cb = function (e) {
        $.off(el, events, cb);
        return handler.call(this, e);
    };
    return $.on(el, events, cb);
};
$.event = function (event, detail, root) {
    var _a;
    if (root === void 0) { root = globals_1.d; }
    if (!((_a = globalThis.chrome) === null || _a === void 0 ? void 0 : _a.extension)) {
        if ((detail != null) && (typeof cloneInto === 'function')) {
            detail = cloneInto(detail, globals_1.d.defaultView);
        }
    }
    return root.dispatchEvent(new CustomEvent(event, { bubbles: true, cancelable: true, detail: detail }));
};
if (helpers_1.platform === 'userscript') {
    // XXX Make $.event work in Pale Moon with GM 3.x (no cloneInto function).
    (function () {
        var _a;
        if (!/PaleMoon\//.test(navigator.userAgent) || (+((_a = GM_info === null || GM_info === void 0 ? void 0 : GM_info.version) === null || _a === void 0 ? void 0 : _a.split('.')[0]) < 2) || (typeof cloneInto !== 'undefined')) {
            return;
        }
        try {
            return new CustomEvent('x', { detail: {} });
        }
        catch (err) {
            var unsafeConstructors_1 = {
                Object: unsafeWindow.Object,
                Array: unsafeWindow.Array
            };
            var clone = function (obj) {
                var constructor;
                if ((obj != null) && (typeof obj === 'object') && (constructor = unsafeConstructors_1[obj.constructor.name])) {
                    var obj2 = new constructor();
                    for (var key in obj) {
                        var val = obj[key];
                        obj2[key] = clone(val);
                    }
                    return obj2;
                }
                else {
                    return obj;
                }
            };
            return $.event = function (event, detail, root) {
                if (root === void 0) { root = globals_1.d; }
                return root.dispatchEvent(new CustomEvent(event, { bubbles: true, cancelable: true, detail: clone(detail) }));
            };
        }
    })();
}
$.modifiedClick = function (e) { return e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || (e.button !== 0); };
if (!((_a = globalThis.chrome) === null || _a === void 0 ? void 0 : _a.extension)) {
    $.open =
        ((GM === null || GM === void 0 ? void 0 : GM.openInTab) != null) ?
            GM.openInTab
            : (typeof GM_openInTab !== 'undefined' && GM_openInTab !== null) ?
                GM_openInTab
                :
                    function (url) { return window.open(url, '_blank'); };
}
else {
    $.open =
        function (url) { return window.open(url, '_blank'); };
}
$.debounce = function (wait, fn) {
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
        if (lastCall < (Date.now() - wait)) {
            return exec();
        }
        // stop current reset
        clearTimeout(timeout);
        // after wait, let next invocation execute immediately
        return timeout = setTimeout(exec, wait);
    };
};
$.queueTask = (function () {
    var taskQueue = [];
    var execTask = function () {
        var _a = taskQueue.shift(), func = _a[0], args = _a.slice(1);
        func.apply(void 0, args);
    };
    return function () {
        taskQueue.push(arguments);
        // setTimeout is throttled in background tabs on firefox
        Promise.resolve().then(execTask);
    };
})();
if (helpers_1.platform === 'crx') {
    var callbacks_1 = new Map();
    chrome.runtime.onMessage.addListener(function (_a) {
        var id = _a.id, data = _a.data;
        callbacks_1.get(id)(data);
        callbacks_1.delete(id);
    });
    $.eventPageRequest = function (params) { return new Promise(function (resolve) {
        chrome.runtime.sendMessage(params, function (id) { callbacks_1.set(id, resolve); });
    }); };
}
/**
 * Runs a function on the page instead of the user script or extension context.
 * @param fn The name of the function in pageContext.ts. It must be defined there to run in a manifest V3 context.
 * @param data Data to pass to the function. Will be passed as `this`.
 * @returns A promise with the data object, which might be mutated by the function. If you're not using that, you can
 * still await it to make sure the function is done.
 */
$.global = function (fn, data) {
    return __awaiter(this, void 0, void 0, function () {
        var script;
        return __generator(this, function (_a) {
            if (helpers_1.platform === 'crx' && chrome.runtime.getManifest().manifest_version === 3) {
                return [2 /*return*/, $.eventPageRequest({ type: 'runInPageContext', fn: fn, data: data })];
            }
            else {
                if (globals_1.doc) {
                    script = $.el('script', { textContent: "(".concat(pageContext_1.default[fn], ")(document.currentScript.dataset);") });
                    if (data) {
                        $.extend(script.dataset, data);
                    }
                    $.add((globals_1.d.head || globals_1.doc), script);
                    $.rm(script);
                    return [2 /*return*/, script.dataset];
                }
                else {
                    // XXX dwb
                    try {
                        pageContext_1.default[fn](data);
                    }
                    catch (error) {
                        console.error(error);
                    }
                    return [2 /*return*/, data];
                }
            }
            return [2 /*return*/];
        });
    });
};
$.bytesToString = function (size) {
    var unit = 0; // Bytes
    while (size >= 1024) {
        size /= 1024;
        unit++;
    }
    // Remove trailing 0s.
    size =
        unit > 1 ?
            // Keep the size as a float if the size is greater than 2^20 B.
            // Round to hundredth.
            Math.round(size * 100) / 100
            :
                // Round to an integer otherwise.
                Math.round(size);
    return "".concat(size, " ").concat(['B', 'KB', 'MB', 'GB'][unit]);
};
$.minmax = function (value, min, max) { return value < min ?
    min
    :
        value > max ?
            max
            :
                value; };
$.hasAudio = function (video) {
    var _a;
    return video.mozHasAudio || !!video.webkitAudioDecodedByteCount ||
        ((_a = video.nextElementSibling) === null || _a === void 0 ? void 0 : _a.tagName) === 'AUDIO';
}; // sound posts
$.luma = function (rgb) { return (rgb[0] * 0.299) + (rgb[1] * 0.587) + (rgb[2] * 0.114); };
$.unescape = function (text) {
    if (text == null) {
        return text;
    }
    return text.replace(/<[^>]*>/g, '').replace(/&(amp|#039|quot|lt|gt|#44);/g, function (c) { return ({ '&amp;': '&', '&#039;': "'", '&quot;': '"', '&lt;': '<', '&gt;': '>', '&#44;': ',' })[c]; });
};
$.isImage = function (url) { return /\.(jpe?g|jfif|png|gif|bmp|webp|avif|jxl)$/i.test(url); };
$.isVideo = function (url) { return /\.(webm|mp4|ogv)$/i.test(url); };
$.engine = (function () {
    if (/Edge\//.test(navigator.userAgent)) {
        return 'edge';
    }
    if (/Chrome\//.test(navigator.userAgent)) {
        return 'blink';
    }
    if (/WebKit\//.test(navigator.userAgent)) {
        return 'webkit';
    }
    if (/Gecko\/|Goanna/.test(navigator.userAgent)) {
        return 'gecko';
    } // Goanna = Pale Moon 26+
})();
$.hasStorage = (function () {
    try {
        if (localStorage.getItem(globals_1.g.NAMESPACE + 'hasStorage') === 'true') {
            return true;
        }
        localStorage.setItem(globals_1.g.NAMESPACE + 'hasStorage', 'true');
        return localStorage.getItem(globals_1.g.NAMESPACE + 'hasStorage') === 'true';
    }
    catch (error) {
        return false;
    }
})();
$.item = function (key, val) {
    var item = (0, helpers_1.dict)();
    item[key] = val;
    return item;
};
$.oneItemSugar = function (fn) { return (function (key, val, cb) {
    if (typeof key === 'string') {
        return fn($.item(key, val), cb);
    }
    else {
        return fn(key, val);
    }
}); };
$.syncing = (0, helpers_1.dict)();
$.securityCheck = function (data) {
    if (location.protocol !== 'https:') {
        return delete data['Redirect to HTTPS'];
    }
};
if (helpers_1.platform === 'crx') {
    // https://developer.chrome.com/extensions/storage.html
    $.oldValue = {
        local: (0, helpers_1.dict)(),
        sync: (0, helpers_1.dict)()
    };
    chrome.storage.onChanged.addListener(function (changes, area) {
        var _a, _b;
        for (var key in changes) {
            var oldValue = (_a = $.oldValue.local[key]) !== null && _a !== void 0 ? _a : $.oldValue.sync[key];
            $.oldValue[area][key] = helpers_1.dict.clone(changes[key].newValue);
            var newValue = (_b = $.oldValue.local[key]) !== null && _b !== void 0 ? _b : $.oldValue.sync[key];
            var cb = $.syncing[key];
            if (cb && (JSON.stringify(newValue) !== JSON.stringify(oldValue))) {
                cb(newValue, key);
            }
        }
    });
    $.sync = function (key, cb) { return $.syncing[key] = cb; };
    $.forceSync = function () { };
    $.crxWorking = function () {
        try {
            if (chrome.runtime.getManifest()) {
                return true;
            }
        }
        catch (error) { }
        if (!$.crxWarningShown) {
            var msg = $.el('div', { innerHTML: "".concat(package_json_1.default.name, " seems to have been updated. You will need to <a href=\"javascript:;\">reload</a> the page.") });
            $.on($('a', msg), 'click', function () { return location.reload(); });
            new Notice_1.default('warning', msg);
            $.crxWarningShown = true;
        }
        return false;
    };
    $.get = $.oneItemSugar(function (data, cb) {
        if (!$.crxWorking()) {
            return;
        }
        var results = {};
        var get = function (area) {
            var keys = Object.keys(data);
            // XXX slow performance in Firefox
            if (($.engine === 'gecko') && (area === 'sync') && (keys.length > 3)) {
                keys = null;
            }
            return chrome.storage[area].get(keys, function (result) {
                var key;
                result = helpers_1.dict.clone(result);
                if (chrome.runtime.lastError) {
                    globals_1.c.error(chrome.runtime.lastError.message);
                }
                if (keys === null) {
                    var result2 = (0, helpers_1.dict)();
                    for (key in result) {
                        var val = result[key];
                        if ($.hasOwn(data, key)) {
                            result2[key] = val;
                        }
                    }
                    result = result2;
                }
                for (key in data) {
                    $.oldValue[area][key] = result[key];
                }
                results[area] = result;
                if (results.local && results.sync) {
                    $.extend(data, results.sync);
                    $.extend(data, results.local);
                    return cb(data);
                }
            });
        };
        get('local');
        return get('sync');
    });
    (function () {
        var items = {
            local: (0, helpers_1.dict)(),
            sync: (0, helpers_1.dict)()
        };
        var exceedsQuota = function (key, value) {
            return unescape(encodeURIComponent(JSON.stringify(key))).length + unescape(encodeURIComponent(JSON.stringify(value))).length > chrome.storage.sync.QUOTA_BYTES_PER_ITEM;
        };
        $.delete = function (keys) {
            if (!$.crxWorking()) {
                return;
            }
            if (typeof keys === 'string') {
                keys = [keys];
            }
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                delete items.local[key];
                delete items.sync[key];
            }
            chrome.storage.local.remove(keys);
            return chrome.storage.sync.remove(keys);
        };
        var timeout = {};
        var setArea = function (area, cb) {
            var data = (0, helpers_1.dict)();
            $.extend(data, items[area]);
            if (!Object.keys(data).length || (timeout[area] > Date.now())) {
                return;
            }
            return chrome.storage[area].set(data, function () {
                var err;
                var key;
                if (err = chrome.runtime.lastError) {
                    globals_1.c.error(err.message);
                    setTimeout(setArea, helpers_1.MINUTE, area);
                    timeout[area] = Date.now() + helpers_1.MINUTE;
                    return cb === null || cb === void 0 ? void 0 : cb(err);
                }
                delete timeout[area];
                for (key in data) {
                    if (items[area][key] === data[key]) {
                        delete items[area][key];
                    }
                }
                if (area === 'local') {
                    for (key in data) {
                        var val = data[key];
                        if (!exceedsQuota(key, val)) {
                            items.sync[key] = val;
                        }
                    }
                    setSync();
                }
                else {
                    chrome.storage.local.remove(((function () {
                        var result = [];
                        for (key in data) {
                            if (!(key in items.local)) {
                                result.push(key);
                            }
                        }
                        return result;
                    })()));
                }
                return cb === null || cb === void 0 ? void 0 : cb();
            });
        };
        var setSync = (0, helpers_1.debounce)(helpers_1.SECOND, function () { return setArea('sync'); });
        $.set = $.oneItemSugar(function (data, cb) {
            if (!$.crxWorking()) {
                return;
            }
            $.securityCheck(data);
            $.extend(items.local, data);
            return setArea('local', cb);
        });
        return $.clear = function (cb) {
            if (!$.crxWorking()) {
                return;
            }
            items.local = (0, helpers_1.dict)();
            items.sync = (0, helpers_1.dict)();
            var count = 2;
            var err = null;
            var done = function () {
                if (chrome.runtime.lastError) {
                    globals_1.c.error(chrome.runtime.lastError.message);
                }
                if (err == null) {
                    err = chrome.runtime.lastError;
                }
                if (!--count) {
                    return cb === null || cb === void 0 ? void 0 : cb(err);
                }
            };
            chrome.storage.local.clear(done);
            return chrome.storage.sync.clear(done);
        };
    })();
}
else {
    // http://wiki.greasespot.net/Main_Page
    // https://tampermonkey.net/documentation.php
    if (((GM === null || GM === void 0 ? void 0 : GM.deleteValue) != null) && window.BroadcastChannel && (typeof GM_addValueChangeListener === 'undefined' || GM_addValueChangeListener === null)) {
        $.syncChannel = new BroadcastChannel(globals_1.g.NAMESPACE + 'sync');
        $.on($.syncChannel, 'message', function (e) { return (function () {
            var result = [];
            for (var key in e.data) {
                var cb;
                var val = e.data[key];
                if (cb = $.syncing[key]) {
                    result.push(cb(helpers_1.dict.json(JSON.stringify(val)), key));
                }
            }
            return result;
        })(); });
        $.sync = function (key, cb) { return $.syncing[key] = cb; };
        $.forceSync = function () { };
        $.delete = function (keys, cb) {
            var key;
            if (!(keys instanceof Array)) {
                keys = [keys];
            }
            Promise.all(keys.map(function (key) { return GM.deleteValue(globals_1.g.NAMESPACE + key); })).then(function () {
                var items = (0, helpers_1.dict)();
                for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
                    key = keys_2[_i];
                    items[key] = undefined;
                }
                $.syncChannel.postMessage(items);
                cb === null || cb === void 0 ? void 0 : cb();
            });
        };
        $.get = $.oneItemSugar(function (items, cb) {
            var keys = Object.keys(items);
            return Promise.all(keys.map(function (key) { return GM.getValue(globals_1.g.NAMESPACE + key); })).then(function (values) {
                for (var i = 0; i < values.length; i++) {
                    var val = values[i];
                    if (val) {
                        items[keys[i]] = helpers_1.dict.json(val);
                    }
                }
                return cb(items);
            });
        });
        $.set = $.oneItemSugar(function (items, cb) {
            $.securityCheck(items);
            return Promise.all((function () {
                var result = [];
                for (var key in items) {
                    var val = items[key];
                    result.push(GM.setValue(globals_1.g.NAMESPACE + key, JSON.stringify(val)));
                }
                return result;
            })()).then(function () {
                $.syncChannel.postMessage(items);
                return cb === null || cb === void 0 ? void 0 : cb();
            });
        });
        $.clear = function (cb) { return GM.listValues().then(function (keys) { return $.delete(keys.map(function (key) { return key.replace(globals_1.g.NAMESPACE, ''); }), cb); }).catch(function () { return $.delete(Object.keys(globals_1.Conf).concat(['previousversion', 'QR Size', 'QR.persona']), cb); }); };
    }
    else {
        if (typeof GM_deleteValue !== 'undefined' && GM_deleteValue !== null) {
            $.getValue = GM_getValue;
            $.listValues = function () { return GM_listValues(); }; // error when called if missing
        }
        else if ($.hasStorage) {
            $.getValue = function (key) { return localStorage.getItem(key); };
            $.listValues = function () { return (function () {
                var result = [];
                for (var key in localStorage) {
                    if (key.slice(0, globals_1.g.NAMESPACE.length) === globals_1.g.NAMESPACE) {
                        result.push(key);
                    }
                }
                return result;
            })(); };
        }
        else {
            $.getValue = function () { };
            $.listValues = function () { return []; };
        }
        if (typeof GM_addValueChangeListener !== 'undefined' && GM_addValueChangeListener !== null) {
            $.setValue = GM_setValue;
            $.deleteValue = GM_deleteValue;
        }
        else if (typeof GM_deleteValue !== 'undefined' && GM_deleteValue !== null) {
            $.oldValue = (0, helpers_1.dict)();
            $.setValue = function (key, val) {
                GM_setValue(key, val);
                if (key in $.syncing) {
                    $.oldValue[key] = val;
                    if ($.hasStorage) {
                        return localStorage.setItem(key, val);
                    } // for `storage` events
                }
            };
            $.deleteValue = function (key) {
                GM_deleteValue(key);
                if (key in $.syncing) {
                    delete $.oldValue[key];
                    if ($.hasStorage) {
                        return localStorage.removeItem(key);
                    } // for `storage` events
                }
            };
            if (!$.hasStorage) {
                $.cantSync = true;
            }
        }
        else if ($.hasStorage) {
            $.oldValue = (0, helpers_1.dict)();
            $.setValue = function (key, val) {
                if (key in $.syncing) {
                    $.oldValue[key] = val;
                }
                return localStorage.setItem(key, val);
            };
            $.deleteValue = function (key) {
                if (key in $.syncing) {
                    delete $.oldValue[key];
                }
                return localStorage.removeItem(key);
            };
        }
        else {
            $.setValue = function () { };
            $.deleteValue = function () { };
            $.cantSync = ($.cantSet = true);
        }
        if (typeof GM_addValueChangeListener !== 'undefined' && GM_addValueChangeListener !== null) {
            $.sync = function (key, cb) { return $.syncing[key] = GM_addValueChangeListener(globals_1.g.NAMESPACE + key, function (key2, oldValue, newValue, remote) {
                if (remote) {
                    if (newValue !== undefined) {
                        newValue = helpers_1.dict.json(newValue);
                    }
                    return cb(newValue, key);
                }
            }); };
            $.forceSync = function () { };
        }
        else if ((typeof GM_deleteValue !== 'undefined' && GM_deleteValue !== null) || $.hasStorage) {
            $.sync = function (key, cb) {
                key = globals_1.g.NAMESPACE + key;
                $.syncing[key] = cb;
                return $.oldValue[key] = $.getValue(key);
            };
            (function () {
                var onChange = function (_a) {
                    var key = _a.key, newValue = _a.newValue;
                    var cb;
                    if (!(cb = $.syncing[key])) {
                        return;
                    }
                    if (newValue != null) {
                        if (newValue === $.oldValue[key]) {
                            return;
                        }
                        $.oldValue[key] = newValue;
                        return cb(helpers_1.dict.json(newValue), key.slice(globals_1.g.NAMESPACE.length));
                    }
                    else {
                        if ($.oldValue[key] == null) {
                            return;
                        }
                        delete $.oldValue[key];
                        return cb(undefined, key.slice(globals_1.g.NAMESPACE.length));
                    }
                };
                $.on(window, 'storage', onChange);
                return $.forceSync = function (key) {
                    // Storage events don't work across origins
                    // e.g. http://boards.4chan.org and https://boards.4chan.org
                    // so force a check for changes to avoid lost data.
                    key = globals_1.g.NAMESPACE + key;
                    return onChange({ key: key, newValue: $.getValue(key) });
                };
            })();
        }
        else {
            $.sync = function () { };
            $.forceSync = function () { };
        }
        $.delete = function (keys) {
            if (!(keys instanceof Array)) {
                keys = [keys];
            }
            for (var _i = 0, keys_3 = keys; _i < keys_3.length; _i++) {
                var key = keys_3[_i];
                $.deleteValue(globals_1.g.NAMESPACE + key);
            }
        };
        $.get = $.oneItemSugar(function (items, cb) { return $.queueTask($.getSync, items, cb); });
        $.getSync = function (items, cb) {
            for (var key in items) {
                var val2;
                if (val2 = $.getValue(globals_1.g.NAMESPACE + key)) {
                    try {
                        items[key] = helpers_1.dict.json(val2);
                    }
                    catch (err) {
                        // XXX https://github.com/ccd0/4chan-x/issues/2218
                        if (!/^(?:undefined)*$/.test(val2)) {
                            throw err;
                        }
                    }
                }
            }
            return cb(items);
        };
        $.set = $.oneItemSugar(function (items, cb) {
            $.securityCheck(items);
            return $.queueTask(function () {
                for (var key in items) {
                    var value = items[key];
                    $.setValue(globals_1.g.NAMESPACE + key, JSON.stringify(value));
                }
                return cb === null || cb === void 0 ? void 0 : cb();
            });
        });
        $.clear = function (cb) {
            // XXX https://github.com/greasemonkey/greasemonkey/issues/2033
            // Also support case where GM_listValues is not defined.
            $.delete(Object.keys(globals_1.Conf));
            $.delete(['previousversion', 'QR Size', 'QR.persona']);
            try {
                $.delete($.listValues().map(function (key) { return key.replace(globals_1.g.NAMESPACE, ''); }));
            }
            catch (error) { }
            return cb === null || cb === void 0 ? void 0 : cb();
        };
    }
}
exports.default = $;
