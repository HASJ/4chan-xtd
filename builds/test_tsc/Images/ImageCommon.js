"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Redirect_1 = require("../Archive/Redirect");
var Notice_1 = require("../classes/Notice");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var CrossOrigin_1 = require("../platform/CrossOrigin");
var ImageHost_1 = require("./ImageHost");
var Volume_1 = require("./Volume");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ImageCommon = {
    // Pause and mute video in preparation for removing the element from the document.
    pause: function (video) {
        if (video.nodeName !== 'VIDEO') {
            return;
        }
        video.pause();
        _1.default.off(video, 'volumechange', Volume_1.default.change);
        return video.muted = true;
    },
    rewind: function (el) {
        if (el.nodeName === 'VIDEO') {
            if (el.readyState >= el.HAVE_METADATA) {
                return el.currentTime = 0;
            }
        }
        else if (/\.gif$/.test(el.src)) {
            return _1.default.queueTask(function () { return el.src = el.src; });
        }
    },
    pushCache: function (el) {
        ImageCommon.cache = el;
        return _1.default.on(el, 'error', ImageCommon.cacheError);
    },
    popCache: function () {
        var el = ImageCommon.cache;
        _1.default.off(el, 'error', ImageCommon.cacheError);
        delete ImageCommon.cache;
        return el;
    },
    cacheError: function () {
        if (ImageCommon.cache === this) {
            return delete ImageCommon.cache;
        }
    },
    decodeError: function (file, fileObj) {
        var _a;
        var message;
        if (((_a = file.error) === null || _a === void 0 ? void 0 : _a.code) !== MediaError.MEDIA_ERR_DECODE) {
            return false;
        }
        if (!(message = (0, _1.default)('.warning', fileObj.thumb.parentNode))) {
            message = _1.default.el('div', { className: 'warning' });
            _1.default.after(fileObj.thumb, message);
        }
        message.textContent = 'Error: Corrupt or unplayable video';
        return true;
    },
    isFromArchive: function (file) {
        return (globals_1.g.SITE.software === 'yotsuba') && !ImageHost_1.default.test(file.src.split('/')[2]);
    },
    error: function (file, post, fileObj, delay, cb) {
        var _a, _b;
        var timeoutID;
        var src = fileObj.url.split('/');
        var url = null;
        if ((globals_1.g.SITE.software === 'yotsuba') && globals_1.Conf['404 Redirect']) {
            url = Redirect_1.default.to('file', {
                boardID: post.board.ID,
                filename: src[src.length - 1]
            });
        }
        if (!url || !Redirect_1.default.securityCheck(url)) {
            url = null;
        }
        if ((post.isDead || fileObj.isDead) && !ImageCommon.isFromArchive(file)) {
            return cb(url);
        }
        if (delay != null) {
            timeoutID = setTimeout((function () { return cb(url); }), delay);
        }
        if (post.isDead || fileObj.isDead) {
            return;
        }
        var redirect = function () {
            if (!ImageCommon.isFromArchive(file)) {
                if (delay != null) {
                    clearTimeout(timeoutID);
                }
                return cb(url);
            }
        };
        var threadJSON = (_b = (_a = globals_1.g.SITE.urls).threadJSON) === null || _b === void 0 ? void 0 : _b.call(_a, post);
        if (!threadJSON) {
            return;
        }
        var parseJSON = function (isArchiveURL) {
            var _a, _b;
            var needle, postObj;
            if (this.status === 404) {
                var archivedThreadJSON = void 0;
                if (!isArchiveURL && (archivedThreadJSON = (_b = (_a = globals_1.g.SITE.urls).archivedThreadJSON) === null || _b === void 0 ? void 0 : _b.call(_a, post))) {
                    _1.default.ajax(archivedThreadJSON, { onloadend: function () { return parseJSON.call(this, true); } });
                }
                else {
                    post.kill(!post.isClone, fileObj.index);
                }
            }
            if (this.status !== 200) {
                return redirect();
            }
            for (var _i = 0, _c = this.response.posts; _i < _c.length; _i++) {
                postObj = _c[_i];
                if (postObj.no === post.ID) {
                    break;
                }
            }
            if (postObj.no !== post.ID) {
                post.kill();
                return redirect();
            }
            else if ((needle = fileObj.docIndex, globals_1.g.SITE.Build.parseJSON(postObj, post.board).filesDeleted.includes(needle))) {
                post.kill(true);
                return redirect();
            }
            else {
                return url = fileObj.url;
            }
        };
        return _1.default.ajax(threadJSON, { onloadend: function () { return parseJSON.call(this); } });
    },
    // XXX Estimate whether clicks are on the video controls and should be ignored.
    onControls: function (e) {
        return (globals_1.Conf['Show Controls'] && globals_1.Conf['Click Passthrough'] && (e.target.nodeName === 'VIDEO')) ||
            (e.target.controls && ((e.target.getBoundingClientRect().bottom - e.clientY) < 35));
    },
    download: function (e) {
        if (this.protocol === 'blob:') {
            return true;
        }
        e.preventDefault();
        var _a = this, href = _a.href, download = _a.download;
        return CrossOrigin_1.default.file(href, function (blob) {
            if (blob) {
                var a = _1.default.el('a', {
                    href: URL.createObjectURL(blob),
                    download: download,
                    hidden: true
                });
                _1.default.add(globals_1.d.body, a);
                a.click();
                return _1.default.rm(a);
            }
            else {
                return new Notice_1.default('warning', "Could not download ".concat(href), 20);
            }
        });
    }
};
exports.default = ImageCommon;
