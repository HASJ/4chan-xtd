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
var Config_1 = require("../config/Config");
var Get_1 = require("../General/Get");
var Header_1 = require("../General/Header");
var UI_1 = require("../General/UI");
var globals_1 = require("../globals/globals");
var Nav_1 = require("../Miscellaneous/Nav");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var ImageCommon_1 = require("./ImageCommon");
var Volume_1 = require("./Volume");
var Audio_1 = require("./Audio");
var icon_1 = require("../Icons/icon");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ImageExpand = {
    init: function () {
        if (!(this.enabled = globals_1.Conf['Image Expansion'] && ['index', 'thread'].includes(globals_1.g.VIEW))) {
            return;
        }
        this.EAI = _1.default.el('a', {
            className: 'expand-all-shortcut',
            title: 'Expand All Images',
            href: 'javascript:;'
        });
        icon_1.default.set(this.EAI, 'expand', 'Expand All Images');
        _1.default.on(this.EAI, 'click', this.cb.toggleAll);
        Header_1.default.addShortcut('expand-all', this.EAI, 520);
        _1.default.on(globals_1.d, 'scroll visibilitychange', this.cb.playVideos);
        this.videoControls = _1.default.el('span', { className: 'video-controls' });
        _1.default.extend(this.videoControls, { innerHTML: " <a href=\"javascript:;\" title=\"You can also contract the video by dragging it to the left.\">contract</a>" });
        return Callbacks_1.default.Post.push({
            name: 'Image Expansion',
            cb: this.node
        });
    },
    node: function () {
        var _a;
        if (!this.file || (!this.file.isImage && !this.file.isVideo)) {
            return;
        }
        _1.default.on(this.file.thumbLink, 'click', ImageExpand.cb.toggle);
        if (this.isClone) {
            if (this.file.isExpanding) {
                // If we clone a post where the image is still loading,
                // make it loading in the clone too.
                ImageExpand.contract(this);
                return ImageExpand.expand(this);
            }
            else if (this.file.isExpanded && this.file.isVideo) {
                Volume_1.default.setup(this.file.fullImage);
                ImageExpand.setupVideoCB(this);
                return ImageExpand.setupVideo(this, !((_a = this.origin.file.fullImage) === null || _a === void 0 ? void 0 : _a.paused) || this.origin.file.wasPlaying, this.file.fullImage.controls);
            }
        }
        else if (ImageExpand.on && !this.isHidden && !this.isFetchedQuote &&
            (globals_1.Conf['Expand spoilers'] || !this.file.isSpoiler) &&
            (globals_1.Conf['Expand videos'] || !this.file.isVideo)) {
            return ImageExpand.expand(this);
        }
    },
    cb: {
        toggle: function (e) {
            var _a;
            if (_1.default.modifiedClick(e)) {
                return;
            }
            var post = Get_1.default.postFromNode(this);
            var file = post.file;
            if (file.isExpanded && ImageCommon_1.default.onControls(e)) {
                return;
            }
            e.preventDefault();
            if (!globals_1.Conf['Autoplay'] && ((_a = file.fullImage) === null || _a === void 0 ? void 0 : _a.paused)) {
                return file.fullImage.play();
            }
            else {
                return ImageExpand.toggle(post);
            }
        },
        toggleAll: function () {
            var func;
            _1.default.event('CloseMenu');
            var threadRoot = Nav_1.default.getThread();
            var toggle = function (post) {
                var file = post.file;
                if (!file || (!file.isImage && !file.isVideo) || !globals_1.doc.contains(post.nodes.root)) {
                    return;
                }
                if (ImageExpand.on &&
                    ((!globals_1.Conf['Expand spoilers'] && file.isSpoiler) ||
                        (!globals_1.Conf['Expand videos'] && file.isVideo) ||
                        (globals_1.Conf['Expand from here'] && (Header_1.default.getTopOf(file.thumb) < 0)) ||
                        (globals_1.Conf['Expand thread only'] && (globals_1.g.VIEW === 'index') && !(threadRoot === null || threadRoot === void 0 ? void 0 : threadRoot.contains(file.thumb))))) {
                    return;
                }
                return _1.default.queueTask(func, post);
            };
            if (ImageExpand.on = _1.default.hasClass(ImageExpand.EAI, 'expand-all-shortcut')) {
                ImageExpand.EAI.className = 'contract-all-shortcut';
                ImageExpand.EAI.title = 'Contract All Images';
                icon_1.default.set(ImageExpand.EAI, 'shrink', 'Contract All Images');
                func = ImageExpand.expand;
            }
            else {
                ImageExpand.EAI.className = 'expand-all-shortcut';
                ImageExpand.EAI.title = 'Expand All Images';
                icon_1.default.set(ImageExpand.EAI, 'expand', 'Expand All Images');
                func = ImageExpand.contract;
            }
            return globals_1.g.posts.forEach(function (post) {
                for (var _i = 0, _a = __spreadArray([post], post.clones, true); _i < _a.length; _i++) {
                    post = _a[_i];
                    toggle(post);
                }
            });
        },
        playVideos: function () {
            return globals_1.g.posts.forEach(function (post) {
                for (var _i = 0, _a = __spreadArray([post], post.clones, true); _i < _a.length; _i++) {
                    post = _a[_i];
                    var file = post.file;
                    if (!file || !file.isVideo || !file.isExpanded) {
                        continue;
                    }
                    var video = file.fullImage;
                    var visible = (_1.default.hasAudio(video) && !video.muted) || Header_1.default.isNodeVisible(video);
                    if (visible && file.wasPlaying) {
                        delete file.wasPlaying;
                        video.play();
                    }
                    else if (!visible && !video.paused) {
                        file.wasPlaying = true;
                        video.pause();
                    }
                }
            });
        },
        setFitness: function () {
            return _1.default[this.checked ? 'addClass' : 'rmClass'](globals_1.doc, this.name.toLowerCase().replace(/\s+/g, '-'));
        }
    },
    toggle: function (post) {
        if (!post.file.isExpanding && !post.file.isExpanded) {
            post.file.scrollIntoView = globals_1.Conf['Scroll into view'];
            ImageExpand.expand(post);
            return;
        }
        ImageExpand.contract(post);
        if (globals_1.Conf['Advance on contract']) {
            var next = post.nodes.root;
            while ((next = _1.default.x("following::div[contains(@class,'postContainer')][1]", next))) {
                if (!(0, _1.default)('.stub', next) && (next.offsetHeight !== 0)) {
                    break;
                }
            }
            if (next) {
                return Header_1.default.scrollTo(next);
            }
        }
    },
    contract: function (post) {
        var bottom, el, oldHeight, scrollY;
        var file = post.file;
        if (el = file.fullImage) {
            var top_1 = Header_1.default.getTopOf(el);
            bottom = top_1 + el.getBoundingClientRect().height;
            oldHeight = globals_1.d.body.clientHeight;
            (scrollY = window.scrollY);
        }
        _1.default.rmClass(post.nodes.root, 'expanded-image');
        _1.default.rmClass(file.thumb, 'expanding');
        _1.default.rm(file.videoControls);
        file.thumbLink.href = file.url;
        file.thumbLink.target = '_blank';
        for (var _i = 0, _a = ['isExpanding', 'isExpanded', 'videoControls', 'wasPlaying', 'scrollIntoView']; _i < _a.length; _i++) {
            var x = _a[_i];
            delete file[x];
        }
        if (!el) {
            return;
        }
        if (globals_1.doc.contains(el)) {
            if (bottom <= 0) {
                // For images entirely above us, scroll to remain in place.
                window.scrollBy(0, ((scrollY - window.scrollY) + globals_1.d.body.clientHeight) - oldHeight);
            }
            else {
                // For images not above us that would be moved above us, scroll to the thumbnail.
                Header_1.default.scrollToIfNeeded(post.nodes.root);
            }
            if (window.scrollX > 0) {
                // If we have scrolled right viewing an expanded image, return to the left.
                window.scrollBy(-window.scrollX, 0);
            }
        }
        _1.default.off(el, 'error', ImageExpand.error);
        ImageCommon_1.default.pushCache(el);
        if (file.isVideo) {
            ImageCommon_1.default.pause(el);
            for (var eventName in ImageExpand.videoCB) {
                var cb = ImageExpand.videoCB[eventName];
                _1.default.off(el, eventName, cb);
            }
        }
        if (globals_1.Conf['Restart when Opened']) {
            ImageCommon_1.default.rewind(file.thumb);
        }
        delete file.fullImage;
        _1.default.queueTask(function () {
            // XXX Work around Chrome/Chromium not firing mouseover on the thumbnail.
            if (file.isExpanding || file.isExpanded) {
                return;
            }
            _1.default.rmClass(el, 'full-image');
            if (el.id) {
                return;
            }
            return _1.default.rm(el);
        });
        if (file.audio) {
            file.audio.remove();
            delete file.audio;
            if (file.audioSlider) {
                file.audioSlider.remove();
                delete file.audioSlider;
            }
        }
    },
    expand: function (post, src) {
        var _a;
        var file = post.file;
        var thumb = file.thumb, thumbLink = file.thumbLink, isVideo = file.isVideo;
        // Do not expand images of hidden/filtered replies, or already expanded pictures.
        if (post.isHidden || file.isExpanding || file.isExpanded) {
            return;
        }
        var el;
        _1.default.addClass(thumb, 'expanding');
        file.isExpanding = true;
        if (file.fullImage) {
            el = file.fullImage;
        }
        else if (((_a = ImageCommon_1.default.cache) === null || _a === void 0 ? void 0 : _a.dataset.fileID) === "".concat(post.fullID, ".").concat(file.index)) {
            el = (file.fullImage = ImageCommon_1.default.popCache());
            _1.default.on(el, 'error', ImageExpand.error);
            if (globals_1.Conf['Restart when Opened'] && (el.id !== 'ihover')) {
                ImageCommon_1.default.rewind(el);
            }
            el.removeAttribute('id');
        }
        else {
            el = (file.fullImage = _1.default.el((isVideo ? 'video' : 'img')));
            el.dataset.fileID = "".concat(post.fullID, ".").concat(file.index);
            _1.default.on(el, 'error', ImageExpand.error);
            el.src = src || file.url;
        }
        el.className = 'full-image';
        _1.default.after(thumb, el);
        if (isVideo) {
            // add contract link to file info
            if (!file.videoControls) {
                file.videoControls = ImageExpand.videoControls.cloneNode(true);
                _1.default.add(file.text, file.videoControls);
            }
            // disable link to file so native controls can work
            thumbLink.removeAttribute('href');
            thumbLink.removeAttribute('target');
            el.loop = true;
            Volume_1.default.setup(el);
            ImageExpand.setupVideoCB(post);
        }
        if (!isVideo) {
            _1.default.asap((function () { return el.naturalHeight; }), function () { return ImageExpand.completeExpand(post); });
        }
        else if (el.readyState >= el.HAVE_METADATA) {
            ImageExpand.completeExpand(post);
        }
        else {
            _1.default.on(el, 'loadedmetadata', function () { return ImageExpand.completeExpand(post); });
        }
        if (globals_1.Conf['Enable sound posts'] && globals_1.Conf['Allow Sound']) {
            var soundUrlMatch = file.name.match(/\[sound=([^\]]+)]/i);
            if (soundUrlMatch) {
                var src_1 = decodeURIComponent(soundUrlMatch[1]);
                if (!src_1.startsWith('http'))
                    src_1 = "https://".concat(src_1);
                var audioEl = _1.default.el('audio', { src: src_1 });
                Volume_1.default.setup(audioEl);
                if (isVideo) {
                    Audio_1.default.setupSync(el, audioEl);
                    el.controls = false;
                }
                audioEl.loop = true;
                audioEl.controls = globals_1.Conf['Show Controls'];
                audioEl.autoplay = globals_1.Conf['Autoplay'];
                _1.default.after(el, audioEl);
                file.audio = audioEl;
            }
        }
    },
    completeExpand: function (post) {
        var file = post.file;
        if (!file.isExpanding) {
            return;
        } // contracted before the image loaded
        var bottom = Header_1.default.getTopOf(file.thumb) + file.thumb.getBoundingClientRect().height;
        var oldHeight = globals_1.d.body.clientHeight;
        var scrollY = window.scrollY;
        _1.default.addClass(post.nodes.root, 'expanded-image');
        _1.default.rmClass(file.thumb, 'expanding');
        file.isExpanded = true;
        delete file.isExpanding;
        // Scroll to keep our place in the thread when images are expanded above us.
        if (globals_1.doc.contains(post.nodes.root) && (bottom <= 0)) {
            window.scrollBy(0, ((scrollY - window.scrollY) + globals_1.d.body.clientHeight) - oldHeight);
        }
        // Scroll to display full image.
        if (file.scrollIntoView) {
            delete file.scrollIntoView;
            var imageBottom = Math.min(globals_1.doc.clientHeight - file.fullImage.getBoundingClientRect().bottom - 25, Header_1.default.getBottomOf(file.fullImage));
            if (imageBottom < 0) {
                window.scrollBy(0, Math.min(-imageBottom, Header_1.default.getTopOf(file.fullImage)));
            }
        }
        if (file.isVideo) {
            return ImageExpand.setupVideo(post, globals_1.Conf['Autoplay'], globals_1.Conf['Show Controls']);
        }
    },
    setupVideo: function (post, playing, controls) {
        var audio = post.file.audio;
        var fullImage = post.file.fullImage;
        if (!playing && !audio) {
            fullImage.controls = controls;
            return;
        }
        fullImage.controls = false;
        _1.default.asap((function () { return globals_1.doc.contains(fullImage); }), function () {
            if (!globals_1.d.hidden && Header_1.default.isNodeVisible(fullImage)) {
                fullImage.play();
            }
            else {
                post.file.wasPlaying = true;
            }
        });
        fullImage.controls = controls && !audio;
    },
    videoCB: (function () {
        // dragging to the left contracts the video
        var mousedown = false;
        return {
            mouseover: function () { return mousedown = false; },
            mousedown: function (e) { if (e.button === 0) {
                return mousedown = true;
            } },
            mouseup: function (e) { if (e.button === 0) {
                return mousedown = false;
            } },
            mouseout: function (e) { if (((e.buttons & 1) || mousedown) && (e.clientX <= this.getBoundingClientRect().left)) {
                return ImageExpand.toggle(Get_1.default.postFromNode(this));
            } }
        };
    })(),
    setupVideoCB: function (post) {
        for (var eventName in ImageExpand.videoCB) {
            var cb = ImageExpand.videoCB[eventName];
            _1.default.on(post.file.fullImage, eventName, cb);
        }
        if (post.file.videoControls) {
            return _1.default.on(post.file.videoControls.firstElementChild, 'click', function () { return ImageExpand.toggle(post); });
        }
    },
    error: function () {
        var post = Get_1.default.postFromNode(this);
        _1.default.rm(this);
        delete post.file.fullImage;
        // Images can error:
        //  - before the image started loading.
        //  - after the image started loading.
        // Don't try to re-expand if it was already contracted.
        if (!post.file.isExpanding && !post.file.isExpanded) {
            return;
        }
        if (ImageCommon_1.default.decodeError(this, post.file)) {
            return ImageExpand.contract(post);
        }
        // Don't autoretry images from the archive.
        if (ImageCommon_1.default.isFromArchive(this)) {
            return ImageExpand.contract(post);
        }
        return ImageCommon_1.default.error(this, post, post.file, 10 * helpers_1.SECOND, function (URL) {
            if (post.file.isExpanding || post.file.isExpanded) {
                ImageExpand.contract(post);
                if (URL) {
                    return ImageExpand.expand(post, URL);
                }
            }
        });
    },
    menu: {
        init: function () {
            if (!ImageExpand.enabled) {
                return;
            }
            var el = _1.default.el('span', {
                textContent: 'Image Expansion',
                className: 'image-expansion-link'
            });
            var createSubEntry = ImageExpand.menu.createSubEntry;
            var subEntries = [];
            for (var name in Config_1.default.imageExpansion) {
                var conf = Config_1.default.imageExpansion[name];
                subEntries.push(createSubEntry(name, conf[1]));
            }
            return Header_1.default.menu.addEntry({
                el: el,
                order: 105,
                subEntries: subEntries
            });
        },
        createSubEntry: function (name, desc) {
            var label = UI_1.default.checkbox(name, name);
            label.title = desc;
            var input = label.firstElementChild;
            if (['Fit width', 'Fit height'].includes(name)) {
                _1.default.on(input, 'change', ImageExpand.cb.setFitness);
            }
            _1.default.event('change', null, input);
            _1.default.on(input, 'change', _1.default.cb.checked);
            return { el: label };
        }
    }
};
exports.default = ImageExpand;
