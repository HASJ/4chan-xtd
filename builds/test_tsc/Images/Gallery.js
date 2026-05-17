"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Gallery_html_1 = require("./Gallery/Gallery.html");
var _1 = require("../platform/$");
var Callbacks_1 = require("../classes/Callbacks");
var Notice_1 = require("../classes/Notice");
var Keybinds_1 = require("../Miscellaneous/Keybinds");
var __1 = require("../platform/$$");
var ImageCommon_1 = require("./ImageCommon");
var Sauce_1 = require("./Sauce");
var Volume_1 = require("./Volume");
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var UI_1 = require("../General/UI");
var Get_1 = require("../General/Get");
var helpers_1 = require("../platform/helpers");
var icon_1 = require("../Icons/icon");
var Gallery = {
    init: function () {
        if (!(this.enabled = globals_1.Conf['Gallery'] && ['index', 'thread'].includes(globals_1.g.VIEW))) {
            return;
        }
        this.delay = globals_1.Conf['Slide Delay'];
        var el = _1.default.el('a', {
            href: 'javascript:;',
            title: 'Gallery',
        });
        icon_1.default.set(el, 'image', 'Gallery');
        _1.default.on(el, 'click', this.cb.toggle);
        Header_1.default.addShortcut('gallery', el, 530);
        return Callbacks_1.default.Post.push({
            name: 'Gallery',
            cb: this.node
        });
    },
    node: function () {
        var _this = this;
        return (function () {
            var result = [];
            for (var _i = 0, _a = _this.files; _i < _a.length; _i++) {
                var file = _a[_i];
                if (file.thumb) {
                    if (Gallery.nodes) {
                        Gallery.generateThumb(_this, file);
                        Gallery.nodes.total.textContent = Gallery.images.length;
                    }
                    if (!globals_1.Conf['Image Expansion'] && ((globals_1.g.SITE.software !== 'tinyboard') || !_1.default.hasClass(globals_1.doc, 'js-enabled'))) {
                        result.push(_1.default.on(file.thumbLink, 'click', Gallery.cb.image));
                    }
                    else {
                        result.push(undefined);
                    }
                }
            }
            return result;
        })();
    },
    build: function (image) {
        var _a, _b;
        var dialog, thumb;
        var cb = Gallery.cb;
        if (globals_1.Conf['Fullscreen Gallery']) {
            _1.default.one(globals_1.d, 'fullscreenchange mozfullscreenchange webkitfullscreenchange', function () { return _1.default.on(globals_1.d, 'fullscreenchange mozfullscreenchange webkitfullscreenchange', cb.close); });
            (_a = globals_1.doc.mozRequestFullScreen) === null || _a === void 0 ? void 0 : _a.call(globals_1.doc);
            (_b = globals_1.doc.webkitRequestFullScreen) === null || _b === void 0 ? void 0 : _b.call(globals_1.doc, Element.ALLOW_KEYBOARD_INPUT);
        }
        Gallery.images = [];
        var nodes = (Gallery.nodes = {});
        Gallery.fileIDs = (0, helpers_1.dict)();
        Gallery.slideshow = false;
        nodes.el = (dialog = _1.default.el('div', { id: 'a-gallery' }));
        _1.default.extend(dialog, { innerHTML: Gallery_html_1.default });
        var object = {
            buttons: '.gal-buttons',
            frame: '.gal-image',
            name: '.gal-name',
            count: '.count',
            total: '.total',
            sauce: '.gal-sauce',
            thumbs: '.gal-thumbnails',
            next: '.gal-image a',
            current: '.gal-image img'
        };
        for (var key in object) {
            var value = object[key];
            nodes[key] = (0, _1.default)(value, dialog);
        }
        var menuButton = (0, _1.default)('.menu-button', dialog);
        nodes.menu = new UI_1.default.Menu('gallery');
        _1.default.on(nodes.frame, 'click', cb.blank);
        if (globals_1.Conf['Mouse Wheel Volume']) {
            _1.default.on(nodes.frame, 'wheel', Volume_1.default.wheel);
        }
        _1.default.on(nodes.next, 'click', cb.click);
        _1.default.on(nodes.name, 'click', ImageCommon_1.default.download);
        var prev = (0, _1.default)('.gal-prev', dialog);
        var next = (0, _1.default)('.gal-next', dialog);
        var start = (0, _1.default)('.gal-start', dialog);
        var stop = (0, _1.default)('.gal-stop', dialog);
        var close = (0, _1.default)('.gal-close', dialog);
        _1.default.on(prev, 'click', cb.prev);
        _1.default.on(next, 'click', cb.next);
        _1.default.on(start, 'click', cb.start);
        _1.default.on(stop, 'click', cb.stop);
        _1.default.on(close, 'click', cb.close);
        _1.default.on(menuButton, 'click', function (e) {
            return nodes.menu.toggle(e, this, globals_1.g);
        });
        icon_1.default.set(menuButton, 'caretDown');
        icon_1.default.set(start, 'play');
        icon_1.default.set(stop, 'stop');
        icon_1.default.set(close, 'xmark');
        icon_1.default.set(prev, 'caretLeft');
        icon_1.default.set(next, 'caretRight');
        for (var _i = 0, _c = Gallery.menu.createSubEntries(); _i < _c.length; _i++) {
            var entry = _c[_i];
            entry.order = 0;
            nodes.menu.addEntry(entry);
        }
        _1.default.on(globals_1.d, 'keydown', cb.keybinds);
        if (globals_1.Conf['Keybinds']) {
            _1.default.off(globals_1.d, 'keydown', Keybinds_1.default.keydown);
        }
        _1.default.on(window, 'resize', Gallery.cb.setHeight);
        for (var _d = 0, _e = (0, __1.default)(globals_1.g.SITE.selectors.file.thumb); _d < _e.length; _d++) {
            var postThumb = _e[_d];
            var post;
            if (!(post = Get_1.default.postFromNode(postThumb))) {
                continue;
            }
            for (var _f = 0, _g = post.files; _f < _g.length; _f++) {
                var file = _g[_f];
                if (file.thumb) {
                    Gallery.generateThumb(post, file);
                    // If no image to open is given, pick image we have scrolled to.
                    if (!image && Gallery.fileIDs["".concat(post.fullID, ".").concat(file.index)]) {
                        var candidate = file.thumbLink;
                        if ((Header_1.default.getTopOf(candidate) + candidate.getBoundingClientRect().height) >= 0) {
                            image = candidate;
                        }
                    }
                }
            }
        }
        _1.default.addClass(globals_1.doc, 'gallery-open');
        _1.default.add(globals_1.d.body, dialog);
        nodes.thumbs.scrollTop = 0;
        nodes.current.parentElement.scrollTop = 0;
        if (image) {
            thumb = (0, _1.default)("[href='".concat(image.href, "']"), nodes.thumbs);
        }
        if (!thumb) {
            thumb = Gallery.images[Gallery.images.length - 1];
        }
        if (thumb) {
            Gallery.open(thumb);
        }
        globals_1.doc.style.overflow = 'hidden';
        return nodes.total.textContent = Gallery.images.length;
    },
    generateThumb: function (post, file) {
        if (post.isClone || post.isHidden) {
            return;
        }
        if (!file || !file.thumb || (!file.isImage && !file.isVideo && !globals_1.Conf['PDF in Gallery'])) {
            return;
        }
        if (Gallery.fileIDs["".concat(post.fullID, ".").concat(file.index)]) {
            return;
        }
        Gallery.fileIDs["".concat(post.fullID, ".").concat(file.index)] = true;
        var thumb = _1.default.el('a', {
            className: 'gal-thumb',
            href: file.url,
            target: '_blank',
            title: file.name
        });
        thumb.dataset.id = Gallery.images.length;
        thumb.dataset.post = post.fullID;
        thumb.dataset.file = file.index;
        var thumbImg = file.thumb.cloneNode(false);
        thumbImg.style.cssText = '';
        _1.default.add(thumb, thumbImg);
        _1.default.on(thumb, 'click', Gallery.cb.open);
        Gallery.images.push(thumb);
        return _1.default.add(Gallery.nodes.thumbs, thumb);
    },
    load: function (thumb, errorCB) {
        var ext = thumb.href.match(/\w*$/);
        var elType = _1.default.getOwn({ 'webm': 'video', 'mp4': 'video', 'ogv': 'video', 'pdf': 'iframe' }, ext) || 'img';
        var file = _1.default.el(elType);
        _1.default.extend(file.dataset, thumb.dataset);
        _1.default.on(file, 'error', errorCB);
        file.src = thumb.href;
        return file;
    },
    open: function (thumb) {
        var _a;
        var el, file, post;
        var nodes = Gallery.nodes;
        var oldID = +nodes.current.dataset.id;
        var newID = +thumb.dataset.id;
        // Highlight, center selected thumbnail
        if (el = Gallery.images[oldID]) {
            _1.default.rmClass(el, 'gal-highlight');
        }
        _1.default.addClass(thumb, 'gal-highlight');
        nodes.thumbs.scrollTop = (thumb.offsetTop + (thumb.offsetHeight / 2)) - (nodes.thumbs.clientHeight / 2);
        // Load image or use preloaded image
        if (((_a = Gallery.cache) === null || _a === void 0 ? void 0 : _a.dataset.id) === ('' + newID)) {
            file = Gallery.cache;
            _1.default.off(file, 'error', Gallery.cacheError);
            _1.default.on(file, 'error', Gallery.error);
        }
        else {
            file = Gallery.load(thumb, Gallery.error);
        }
        // Replace old image with new one
        _1.default.off(nodes.current, 'error', Gallery.error);
        ImageCommon_1.default.pause(nodes.current);
        _1.default.replace(nodes.current, file);
        nodes.current = file;
        if (file.nodeName === 'VIDEO') {
            file.loop = true;
            Volume_1.default.setup(file);
            if (globals_1.Conf['Autoplay']) {
                file.play();
            }
            if (globals_1.Conf['Show Controls'])
                file.controls = true;
        }
        globals_1.doc.classList.toggle('gal-pdf', file.nodeName === 'IFRAME');
        Gallery.cb.setHeight();
        nodes.count.textContent = +thumb.dataset.id + 1;
        nodes.name.download = (nodes.name.textContent = thumb.title);
        nodes.name.href = thumb.href;
        nodes.frame.scrollTop = 0;
        nodes.next.focus();
        // Set sauce links
        _1.default.rmAll(nodes.sauce);
        if (globals_1.Conf['Sauce'] && Sauce_1.default.links && (post = globals_1.g.posts.get(file.dataset.post))) {
            var sauces = [];
            for (var _i = 0, _b = Sauce_1.default.links; _i < _b.length; _i++) {
                var link = _b[_i];
                var node;
                if (node = Sauce_1.default.createSauceLink(link, post, post.files[+file.dataset.file])) {
                    sauces.push(_1.default.tn(' '), node);
                }
            }
            _1.default.add(nodes.sauce, sauces);
        }
        // Continue slideshow if moving forward, stop otherwise
        if (Gallery.slideshow && ((newID > oldID) || ((oldID === (Gallery.images.length - 1)) && (newID === 0)))) {
            Gallery.setupTimer();
        }
        else {
            Gallery.cb.stop();
        }
        // Scroll to post
        if (globals_1.Conf['Scroll to Post'] && (post = globals_1.g.posts.get(file.dataset.post))) {
            Header_1.default.scrollTo(post.nodes.root);
        }
        // Preload next image
        if (isNaN(oldID) || (newID === ((oldID + 1) % Gallery.images.length))) {
            return Gallery.cache = Gallery.load(Gallery.images[(newID + 1) % Gallery.images.length], Gallery.cacheError);
        }
    },
    error: function () {
        var _this = this;
        var _a;
        if (((_a = this.error) === null || _a === void 0 ? void 0 : _a.code) === MediaError.MEDIA_ERR_DECODE) {
            return new Notice_1.default('error', 'Corrupt or unplayable video', 30);
        }
        if (ImageCommon_1.default.isFromArchive(this)) {
            return;
        }
        var post = globals_1.g.posts.get(this.dataset.post);
        var file = post.files[+this.dataset.file];
        return ImageCommon_1.default.error(this, post, file, null, function (url) {
            if (!url) {
                return;
            }
            Gallery.images[+_this.dataset.id].href = url;
            if (Gallery.nodes.current === _this) {
                return _this.src = url;
            }
        });
    },
    cacheError: function () {
        return delete Gallery.cache;
    },
    cleanupTimer: function () {
        clearTimeout(Gallery.timeoutID);
        var current = Gallery.nodes.current;
        _1.default.off(current, 'canplaythrough load', Gallery.startTimer);
        return _1.default.off(current, 'ended', Gallery.cb.next);
    },
    startTimer: function () {
        return Gallery.timeoutID = setTimeout(Gallery.checkTimer, Gallery.delay * helpers_1.SECOND);
    },
    setupTimer: function () {
        Gallery.cleanupTimer();
        var current = Gallery.nodes.current;
        var isVideo = current.nodeName === 'VIDEO';
        if (isVideo) {
            current.play();
        }
        if ((isVideo ? current.readyState >= 4 : current.complete) || (current.nodeName === 'IFRAME')) {
            return Gallery.startTimer();
        }
        else {
            return _1.default.on(current, (isVideo ? 'canplaythrough' : 'load'), Gallery.startTimer);
        }
    },
    checkTimer: function () {
        var current = Gallery.nodes.current;
        if ((current.nodeName === 'VIDEO') && !current.paused) {
            _1.default.on(current, 'ended', Gallery.cb.next);
            return current.loop = false;
        }
        else {
            return Gallery.cb.next();
        }
    },
    cb: {
        keybinds: function (e) {
            var key;
            if (!(key = Keybinds_1.default.keyCode(e))) {
                return;
            }
            var cb = (function () {
                switch (key) {
                    case globals_1.Conf['Close']:
                    case globals_1.Conf['Open Gallery']:
                        return Gallery.cb.close;
                    case globals_1.Conf['Next Gallery Image']:
                        return Gallery.cb.next;
                    case globals_1.Conf['Advance Gallery']:
                        return Gallery.cb.advance;
                    case globals_1.Conf['Previous Gallery Image']:
                        return Gallery.cb.prev;
                    case globals_1.Conf['Pause']:
                        return Gallery.cb.pause;
                    case globals_1.Conf['Slideshow']:
                        return Gallery.cb.toggleSlideshow;
                    case globals_1.Conf['Rotate image anticlockwise']:
                        return Gallery.cb.rotateLeft;
                    case globals_1.Conf['Rotate image clockwise']:
                        return Gallery.cb.rotateRight;
                    case globals_1.Conf['Download Gallery Image']:
                        return Gallery.cb.download;
                }
            })();
            if (!cb) {
                return;
            }
            e.stopPropagation();
            e.preventDefault();
            return cb();
        },
        open: function (e) {
            if (e) {
                e.preventDefault();
            }
            if (this) {
                return Gallery.open(this);
            }
        },
        image: function (e) {
            e.preventDefault();
            e.stopPropagation();
            return Gallery.build(this);
        },
        prev: function () {
            return Gallery.cb.open.call(Gallery.images[+Gallery.nodes.current.dataset.id - 1] || Gallery.images[Gallery.images.length - 1]);
        },
        next: function () {
            return Gallery.cb.open.call(Gallery.images[+Gallery.nodes.current.dataset.id + 1] || Gallery.images[0]);
        },
        click: function (e) {
            if (ImageCommon_1.default.onControls(e)) {
                return;
            }
            e.preventDefault();
            return Gallery.cb.advance();
        },
        advance: function () { if (!globals_1.Conf['Autoplay'] && Gallery.nodes.current.paused) {
            return Gallery.nodes.current.play();
        }
        else {
            return Gallery.cb.next();
        } },
        toggle: function () { return (Gallery.nodes ? Gallery.cb.close : Gallery.build)(); },
        blank: function (e) { if (e.target === this) {
            return Gallery.cb.close();
        } },
        toggleSlideshow: function () { return Gallery.cb[Gallery.slideshow ? 'stop' : 'start'](); },
        download: function () {
            var name = (0, _1.default)('.gal-name');
            return name.click();
        },
        pause: function () {
            Gallery.cb.stop();
            var current = Gallery.nodes.current;
            if (current.nodeName === 'VIDEO') {
                return current[current.paused ? 'play' : 'pause']();
            }
        },
        start: function () {
            _1.default.addClass(Gallery.nodes.buttons, 'gal-playing');
            Gallery.slideshow = true;
            return Gallery.setupTimer();
        },
        stop: function () {
            if (!Gallery.slideshow) {
                return;
            }
            Gallery.cleanupTimer();
            var current = Gallery.nodes.current;
            if (current.nodeName === 'VIDEO') {
                current.loop = true;
            }
            _1.default.rmClass(Gallery.nodes.buttons, 'gal-playing');
            return Gallery.slideshow = false;
        },
        rotateLeft: function () { return Gallery.cb.rotate(270); },
        rotateRight: function () { return Gallery.cb.rotate(90); },
        rotate: (0, helpers_1.debounce)(100, function (delta) {
            var current = Gallery.nodes.current;
            if (current.nodeName === 'IFRAME') {
                return;
            }
            current.dataRotate = ((current.dataRotate || 0) + delta) % 360;
            current.style.transform = "rotate(".concat(current.dataRotate, "deg)");
            return Gallery.cb.setHeight();
        }),
        close: function () {
            var _a, _b;
            _1.default.off(Gallery.nodes.current, 'error', Gallery.error);
            ImageCommon_1.default.pause(Gallery.nodes.current);
            _1.default.rm(Gallery.nodes.el);
            _1.default.rmClass(globals_1.doc, 'gallery-open');
            if (globals_1.Conf['Fullscreen Gallery']) {
                _1.default.off(globals_1.d, 'fullscreenchange mozfullscreenchange webkitfullscreenchange', Gallery.cb.close);
                (_a = globals_1.d.mozCancelFullScreen) === null || _a === void 0 ? void 0 : _a.call(globals_1.d);
                (_b = globals_1.d.webkitExitFullscreen) === null || _b === void 0 ? void 0 : _b.call(globals_1.d);
            }
            delete Gallery.nodes;
            delete Gallery.fileIDs;
            globals_1.doc.style.overflow = '';
            _1.default.off(globals_1.d, 'keydown', Gallery.cb.keybinds);
            if (globals_1.Conf['Keybinds']) {
                _1.default.on(globals_1.d, 'keydown', Keybinds_1.default.keydown);
            }
            _1.default.off(window, 'resize', Gallery.cb.setHeight);
            return clearTimeout(Gallery.timeoutID);
        },
        setFitness: function () {
            return (this.checked ? _1.default.addClass : _1.default.rmClass)(globals_1.doc, "gal-".concat(this.name.toLowerCase().replace(/\s+/g, '-')));
        },
        setHeight: (0, helpers_1.debounce)(100, function () {
            var _a;
            var _b;
            var dim, margin, minHeight;
            var _c = Gallery.nodes, current = _c.current, frame = _c.frame;
            var style = current.style;
            if (globals_1.Conf['Stretch to Fit'] && (dim = (_b = globals_1.g.posts.get(current.dataset.post)) === null || _b === void 0 ? void 0 : _b.files[+current.dataset.file].dimensions)) {
                var _d = dim.split('x'), width = _d[0], height = _d[1];
                var containerWidth = frame.clientWidth;
                var containerHeight = globals_1.doc.clientHeight - 25;
                if (((current.dataRotate || 0) % 180) === 90) {
                    _a = [containerHeight, containerWidth], containerWidth = _a[0], containerHeight = _a[1];
                }
                minHeight = Math.min(containerHeight, (height / width) * containerWidth);
                style.minHeight = minHeight + 'px';
                style.minWidth = ((width / height) * minHeight) + 'px';
            }
            else {
                style.minHeight = (style.minWidth = '');
            }
            if (((current.dataRotate || 0) % 180) === 90) {
                style.maxWidth = globals_1.Conf['Fit Height'] ? "".concat(globals_1.doc.clientHeight - 25, "px") : 'none';
                style.maxHeight = globals_1.Conf['Fit Width'] ? "".concat(frame.clientWidth, "px") : 'none';
                margin = (current.clientWidth - current.clientHeight) / 2;
                return style.margin = "".concat(margin, "px ").concat(-margin, "px");
            }
            else {
                return style.maxWidth = (style.maxHeight = (style.margin = ''));
            }
        }),
        setDelay: function () { return Gallery.delay = +this.value; }
    },
    menu: {
        init: function () {
            if (!Gallery.enabled) {
                return;
            }
            var el = _1.default.el('span', {
                textContent: 'Gallery',
                className: 'gallery-link'
            });
            return Header_1.default.menu.addEntry({
                el: el,
                order: 105,
                subEntries: Gallery.menu.createSubEntries()
            });
        },
        createSubEntry: function (name) {
            var label = UI_1.default.checkbox(name, name);
            var input = label.firstElementChild;
            if (['Hide Thumbnails', 'Fit Width', 'Fit Height'].includes(name)) {
                _1.default.on(input, 'change', Gallery.cb.setFitness);
            }
            _1.default.event('change', null, input);
            _1.default.on(input, 'change', _1.default.cb.checked);
            if (['Hide Thumbnails', 'Fit Width', 'Fit Height', 'Stretch to Fit'].includes(name)) {
                _1.default.on(input, 'change', Gallery.cb.setHeight);
            }
            return { el: label };
        },
        createSubEntries: function () {
            var subEntries = (['Hide Thumbnails', 'Fit Width', 'Fit Height', 'Stretch to Fit', 'Scroll to Post'].map(function (item) { return Gallery.menu.createSubEntry(item); }));
            var delayLabel = _1.default.el('label', { innerHTML: 'Slide Delay: <input type="number" name="Slide Delay" min="0" step="any" class="field">' });
            var delayInput = delayLabel.firstElementChild;
            delayInput.value = Gallery.delay;
            _1.default.on(delayInput, 'change', Gallery.cb.setDelay);
            _1.default.on(delayInput, 'change', _1.default.cb.value);
            subEntries.push({ el: delayLabel });
            return subEntries;
        }
    }
};
exports.default = Gallery;
