"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var QR_1 = require("../Posting/QR");
var _1 = require("./$");
var helpers_1 = require("./helpers");
var CrossOrigin = {
    binary: function (url, cb, headers) {
        if (headers === void 0) { headers = (0, helpers_1.dict)(); }
        // XXX https://forums.lanik.us/viewtopic.php?f=64&t=24173&p=78310
        url = url.replace(/^((?:https?:)?\/\/(?:\w+\.)?(?:4chan|4channel|4cdn)\.org)\/adv\//, '$1//adv/');
        if (helpers_1.platform === 'crx') {
            _1.default.eventPageRequest({ type: 'ajax', url: url, headers: headers, responseType: 'arraybuffer' })
                .then(function (_a) {
                var response = _a.response, responseHeaderString = _a.responseHeaderString;
                if (response)
                    response = new Uint8Array(response);
                cb(response, responseHeaderString);
            });
        }
        else {
            var fallback = function () {
                return _1.default.ajax(url, {
                    headers: headers,
                    responseType: 'arraybuffer',
                    onloadend: function () {
                        if (this.status && this.response) {
                            return cb(new Uint8Array(this.response), this.getAllResponseHeaders());
                        }
                        else {
                            return cb(null);
                        }
                    }
                });
            };
            if ((typeof window.GM_xmlhttpRequest === 'undefined' || window.GM_xmlhttpRequest === null)) {
                fallback();
                return;
            }
            var gmOptions = {
                method: "GET",
                anonymous: true,
                url: url,
                headers: headers,
                responseType: 'arraybuffer',
                overrideMimeType: 'text/plain; charset=x-user-defined',
                onload: function (xhr) {
                    var data;
                    if (xhr.response instanceof ArrayBuffer) {
                        data = new Uint8Array(xhr.response);
                    }
                    else {
                        var r = xhr.responseText;
                        data = new Uint8Array(r.length);
                        var i = 0;
                        while (i < r.length) {
                            data[i] = r.charCodeAt(i);
                            i++;
                        }
                    }
                    return cb(data, xhr.responseHeaders);
                },
                onerror: function () {
                    return cb(null);
                },
                onabort: function () {
                    return cb(null);
                }
            };
            try {
                return ((GM === null || GM === void 0 ? void 0 : GM.xmlHttpRequest) || GM_xmlhttpRequest)(gmOptions);
            }
            catch (error) {
                return fallback();
            }
        }
    },
    file: function (url, cb) {
        return CrossOrigin.binary(url, function (data, headers) {
            var _a, _b, _c, _d, _e;
            if (data == null) {
                return cb(null);
            }
            var name = (_a = url.match(/([^\/?#]+)\/*(?:$|[?#])/)) === null || _a === void 0 ? void 0 : _a[1];
            var contentType = (_b = headers.match(/Content-Type:\s*(.*)/i)) === null || _b === void 0 ? void 0 : _b[1];
            var contentDisposition = (_c = headers.match(/Content-Disposition:\s*(.*)/i)) === null || _c === void 0 ? void 0 : _c[1];
            var mime = (contentType === null || contentType === void 0 ? void 0 : contentType.match(/[^;]*/)[0]) || 'application/octet-stream';
            var match = ((_d = contentDisposition === null || contentDisposition === void 0 ? void 0 : contentDisposition.match(/\bfilename\s*=\s*"((\\"|[^"])+)"/i)) === null || _d === void 0 ? void 0 : _d[1]) ||
                ((_e = contentType === null || contentType === void 0 ? void 0 : contentType.match(/\bname\s*=\s*"((\\"|[^"])+)"/i)) === null || _e === void 0 ? void 0 : _e[1]);
            if (match) {
                name = match.replace(/\\"/g, '"');
            }
            if (/^text\/plain;\s*charset=x-user-defined$/i.test(mime)) {
                // In JS Blocker (Safari) content type comes back as 'text/plain; charset=x-user-defined'; guess from filename instead.
                mime = _1.default.getOwn(QR_1.default.typeFromExtension, name.match(/[^.]*$/)[0].toLowerCase()) || 'application/octet-stream';
            }
            cb(new File([data], name, { type: mime }));
        });
    },
    Request: (function () {
        var Request = /** @class */ (function () {
            function Request() {
            }
            Request.initClass = function () {
                this.prototype.status = 0;
                this.prototype.statusText = '';
                this.prototype.response = null;
                this.prototype.responseHeaderString = null;
            };
            Request.prototype.getResponseHeader = function (headerName) {
                var _a, _b;
                if ((this.responseHeaders == null) && (this.responseHeaderString != null)) {
                    this.responseHeaders = (0, helpers_1.dict)();
                    for (var _i = 0, _c = this.responseHeaderString.split('\r\n'); _i < _c.length; _i++) {
                        var header = _c[_i];
                        var i;
                        if ((i = header.indexOf(':')) >= 0) {
                            var key = header.slice(0, i).trim().toLowerCase();
                            var val = header.slice(i + 1).trim();
                            this.responseHeaders[key] = val;
                        }
                    }
                }
                return (_b = (_a = this.responseHeaders) === null || _a === void 0 ? void 0 : _a[headerName.toLowerCase()]) !== null && _b !== void 0 ? _b : null;
            };
            Request.prototype.abort = function () { };
            Request.prototype.onloadend = function () { };
            return Request;
        }());
        Request.initClass();
        return Request;
    })(),
    // Attempts to fetch `url` using cross-origin privileges, if available.
    // Interface is a subset of that of $.ajax.
    // Options:
    //   `onloadend` - called with the returned object as `this` on success or error/abort/timeout.
    //   `timeout` - time limit for request
    //   `responseType` - expected response type, 'json' by default; 'json' and 'text' supported
    //   `headers` - request headers
    // Returned object properties:
    //   `status` - HTTP status (0 if connection not successful)
    //   `statusText` - HTTP status text
    //   `response` - decoded response body
    //   `abort` - function for aborting the request (silently fails on some platforms)
    //   `getResponseHeader` - function for reading response headers
    ajax: function (url, options) {
        var _a;
        if (options === void 0) { options = {}; }
        var gmReq;
        var onloadend = options.onloadend, timeout = options.timeout, responseType = options.responseType, headers = options.headers;
        if (responseType == null) {
            responseType = 'json';
        }
        var req = new CrossOrigin.Request();
        req.onloadend = onloadend;
        if (helpers_1.platform === 'userscript') {
            if (((_a = window.GM) === null || _a === void 0 ? void 0 : _a.xmlHttpRequest) == null && window.GM_xmlhttpRequest == null) {
                return _1.default.ajax(url, options);
            }
            var gmOptions = {
                method: 'GET',
                anonymous: true,
                url: url,
                headers: headers,
                timeout: timeout,
                onload: function (xhr) {
                    try {
                        var response = xhr.responseText;
                        if (responseType === 'json') {
                            try {
                                response = JSON.parse(xhr.responseText);
                            }
                            catch (error) {
                                console.error(error);
                                console.error(xhr);
                            }
                        }
                        _1.default.extend(req, {
                            url: url,
                            headers: headers,
                            response: response,
                            status: xhr.status,
                            statusText: xhr.statusText,
                            responseHeaderString: xhr.responseHeaders
                        });
                    }
                    catch (error) { }
                    return req.onloadend();
                },
                onerror: function () { return req.onloadend(); },
                onabort: function () { return req.onloadend(); },
                ontimeout: function () { return req.onloadend(); }
            };
            try {
                gmReq = ((GM === null || GM === void 0 ? void 0 : GM.xmlHttpRequest) || GM_xmlhttpRequest)(gmOptions);
            }
            catch (error) {
                return _1.default.ajax(url, options);
            }
            if (gmReq && (typeof gmReq.abort === 'function')) {
                req.abort = function () {
                    try {
                        return gmReq.abort();
                    }
                    catch (error1) { }
                };
            }
        }
        else {
            _1.default.eventPageRequest({ type: 'ajax', url: url, responseType: responseType, headers: headers, timeout: timeout }).then(function (result) {
                if (result.status) {
                    _1.default.extend(req, result);
                }
                return req.onloadend();
            });
        }
        return req;
    },
    ajaxPromise: function (url, options) {
        if (options === void 0) { options = {}; }
        return new Promise(function (resolve) { return CrossOrigin.ajax(url, __assign(__assign({}, options), { onloadend: function () { resolve(this); } })); });
    },
    cache: function (url, cb) {
        return _1.default.cache(url, cb, { ajax: CrossOrigin.ajax });
    },
    cachePromise: function (url) {
        return new Promise(function (resolve) {
            CrossOrigin.cache(url, function () { resolve(this); });
        });
    },
    permission: function (cb, cbFail, origins) {
        if (helpers_1.platform === 'crx') {
            return _1.default.eventPageRequest({ type: 'permission', origins: origins }).then(function (result) {
                if (result) {
                    return cb();
                }
                else {
                    return cbFail();
                }
            });
        }
        return cb();
    },
};
exports.default = CrossOrigin;
