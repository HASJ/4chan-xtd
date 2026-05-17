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
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var icon_1 = require("../Icons/icon");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ImageLoader = {
    init: function () {
        if (!['index', 'thread', 'archive'].includes(globals_1.g.VIEW)) {
            return;
        }
        var replace = globals_1.Conf['Replace JPG'] || globals_1.Conf['Replace PNG'] || globals_1.Conf['Replace GIF'] || globals_1.Conf['Replace WEBM'];
        if (!globals_1.Conf['Image Prefetching'] && !replace) {
            return;
        }
        Callbacks_1.default.Post.push({
            name: 'Image Replace',
            cb: this.node
        });
        _1.default.on(globals_1.d, 'PostsInserted', function () {
            if (ImageLoader.prefetchEnabled || replace) {
                return globals_1.g.posts.forEach(ImageLoader.prefetchAll);
            }
        });
        if (globals_1.Conf['Replace WEBM']) {
            _1.default.on(globals_1.d, 'scroll visibilitychange 4chanXInitFinished PostsInserted', this.playVideos);
        }
        if (!globals_1.Conf['Image Prefetching'] || !['index', 'thread'].includes(globals_1.g.VIEW)) {
            return;
        }
        var el = _1.default.el('a', {
            href: 'javascript:;',
            title: 'Prefetch Images',
            className: 'disabled',
        });
        icon_1.default.set(el, 'bolt', 'Prefetch');
        _1.default.on(el, 'click', this.toggle);
        return Header_1.default.addShortcut('prefetch', el, 525);
    },
    node: function () {
        if (this.isClone) {
            return;
        }
        for (var _i = 0, _a = this.files; _i < _a.length; _i++) {
            var file = _a[_i];
            if (globals_1.Conf['Replace WEBM'] && file.isVideo) {
                ImageLoader.replaceVideo(this, file);
            }
            ImageLoader.prefetch(this, file);
        }
    },
    replaceVideo: function (post, file) {
        var thumb = file.thumb;
        var video = _1.default.el('video', {
            preload: 'none',
            loop: true,
            muted: true,
            poster: thumb.src || thumb.dataset.src,
            textContent: thumb.alt,
            className: thumb.className
        });
        video.setAttribute('muted', 'muted');
        video.dataset.md5 = thumb.dataset.md5;
        for (var _i = 0, _a = ['height', 'width', 'maxHeight', 'maxWidth']; _i < _a.length; _i++) {
            var attr = _a[_i];
            video.style[attr] = thumb.style[attr];
        }
        video.src = file.url;
        _1.default.replace(thumb, video);
        file.thumb = video;
        return file.videoThumb = true;
    },
    prefetch: function (post, file) {
        var _a;
        var clone, type;
        var isImage = file.isImage, isVideo = file.isVideo, thumb = file.thumb, url = file.url;
        if (file.isPrefetched || !(isImage || isVideo) || post.isHidden || post.thread.isHidden) {
            return;
        }
        if (isVideo) {
            type = 'WEBM';
        }
        else {
            type = (_a = url.match(/\.([^.]+)$/)) === null || _a === void 0 ? void 0 : _a[1].toUpperCase();
            if (type === 'JPEG') {
                type = 'JPG';
            }
        }
        var replace = globals_1.Conf["Replace ".concat(type)] && !/spoiler/.test(thumb.src || thumb.dataset.src);
        if (!replace && !ImageLoader.prefetchEnabled) {
            return;
        }
        if (_1.default.hasClass(globals_1.doc, 'catalog-mode')) {
            return;
        }
        if (!__spreadArray([post], post.clones, true).some(function (clone) { return globals_1.doc.contains(clone.nodes.root); })) {
            return;
        }
        file.isPrefetched = true;
        if (file.videoThumb) {
            for (var _i = 0, _b = post.clones; _i < _b.length; _i++) {
                clone = _b[_i];
                clone.file.thumb.preload = 'auto';
            }
            thumb.preload = 'auto';
            // XXX Cloned video elements with poster in Firefox cause momentary display of image loading icon.
            if (_1.default.engine === 'gecko') {
                _1.default.on(thumb, 'loadeddata', function () { return this.removeAttribute('poster'); });
            }
            return;
        }
        var el = _1.default.el(isImage ? 'img' : 'video');
        if (isVideo) {
            el.preload = 'auto';
        }
        if (replace && isImage) {
            _1.default.on(el, 'load', function () {
                for (var _i = 0, _a = post.clones; _i < _a.length; _i++) {
                    clone = _a[_i];
                    clone.file.thumb.src = url;
                }
                return thumb.src = url;
            });
        }
        return el.src = url;
    },
    prefetchAll: function (post) {
        for (var _i = 0, _a = post.files; _i < _a.length; _i++) {
            var file = _a[_i];
            ImageLoader.prefetch(post, file);
        }
    },
    toggle: function () {
        ImageLoader.prefetchEnabled = !ImageLoader.prefetchEnabled;
        this.classList.toggle('disabled', !ImageLoader.prefetchEnabled);
        if (ImageLoader.prefetchEnabled) {
            globals_1.g.posts.forEach(ImageLoader.prefetchAll);
        }
    },
    playVideos: function () {
        var _a;
        // Special case: Quote previews are off screen when inserted into document, but quickly moved on screen.
        var qpClone = (_a = _1.default.id('qp')) === null || _a === void 0 ? void 0 : _a.firstElementChild;
        return globals_1.g.posts.forEach(function (post) {
            for (var _i = 0, _a = __spreadArray([post], post.clones, true); _i < _a.length; _i++) {
                post = _a[_i];
                for (var _b = 0, _c = post.files; _b < _c.length; _b++) {
                    var file = _c[_b];
                    if (file.videoThumb) {
                        var thumb = file.thumb;
                        if (Header_1.default.isNodeVisible(thumb) || (post.nodes.root === qpClone)) {
                            thumb.play();
                        }
                        else {
                            thumb.pause();
                        }
                    }
                }
            }
        });
    }
};
exports.default = ImageLoader;
