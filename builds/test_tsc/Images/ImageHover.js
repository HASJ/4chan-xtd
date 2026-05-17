"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Header_1 = require("../General/Header");
var UI_1 = require("../General/UI");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var ImageCommon_1 = require("./ImageCommon");
var Volume_1 = require("./Volume");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ImageHover = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW)) {
            return;
        }
        if (globals_1.Conf['Image Hover']) {
            Callbacks_1.default.Post.push({
                name: 'Image Hover',
                cb: this.node
            });
        }
        if (globals_1.Conf['Image Hover in Catalog']) {
            return Callbacks_1.default.CatalogThread.push({
                name: 'Image Hover',
                cb: this.catalogNode
            });
        }
    },
    node: function () {
        var _this = this;
        return this.files.filter(function (file) { return (file.isImage || file.isVideo) && file.thumb; }).map(function (file) {
            return _1.default.on(file.thumb, 'mouseover', ImageHover.mouseover(_this, file));
        });
    },
    catalogNode: function () {
        var file = this.thread.OP.files[0];
        if (!file || (!file.isImage && !file.isVideo)) {
            return;
        }
        return _1.default.on(this.nodes.thumb, 'mouseover', ImageHover.mouseover(this.thread.OP, file));
    },
    mouseover: function (post, file) {
        return function (e) {
            var _a;
            var _b, _c, _d;
            var el, height, width;
            if (!globals_1.doc.contains(this)) {
                return;
            }
            var isVideo = file.isVideo;
            if (file.isExpanding || file.isExpanded || ((_c = (_b = globals_1.g.SITE).isThumbExpanded) === null || _c === void 0 ? void 0 : _c.call(_b, file))) {
                return;
            }
            var error = ImageHover.error(post, file);
            if (((_d = ImageCommon_1.default.cache) === null || _d === void 0 ? void 0 : _d.dataset.fileID) === "".concat(post.fullID, ".").concat(file.index)) {
                el = ImageCommon_1.default.popCache();
                _1.default.on(el, 'error', error);
            }
            else {
                el = _1.default.el((isVideo ? 'video' : 'img'));
                el.dataset.fileID = "".concat(post.fullID, ".").concat(file.index);
                _1.default.on(el, 'error', error);
                el.src = file.url;
            }
            if (globals_1.Conf['Restart when Opened']) {
                ImageCommon_1.default.rewind(el);
                ImageCommon_1.default.rewind(this);
            }
            el.id = 'ihover';
            _1.default.add(Header_1.default.hover, el);
            if (isVideo) {
                el.loop = true;
                el.controls = false;
                Volume_1.default.setup(el);
                if (globals_1.Conf['Autoplay']) {
                    el.play();
                    if (this.nodeName === 'VIDEO') {
                        this.currentTime = el.currentTime;
                    }
                }
            }
            if (file.dimensions) {
                _a = file.dimensions.split('x').map(function (x) { return +x; }), width = _a[0], height = _a[1];
                var maxWidth = globals_1.doc.clientWidth;
                var maxHeight = globals_1.doc.clientHeight - UI_1.default.hover.padding;
                var scale = Math.min(1, maxWidth / width, maxHeight / height);
                width *= scale;
                height *= scale;
                el.style.maxWidth = "".concat(width, "px");
                el.style.maxHeight = "".concat(height, "px");
            }
            return UI_1.default.hover({
                root: this,
                el: el,
                latestEvent: e,
                endEvents: 'mouseout click',
                height: height,
                width: width,
                noRemove: true,
                cb: function () {
                    _1.default.off(el, 'error', error);
                    ImageCommon_1.default.pushCache(el);
                    ImageCommon_1.default.pause(el);
                    _1.default.rm(el);
                    return el.removeAttribute('style');
                }
            });
        };
    },
    error: function (post, file) {
        return function () {
            var _this = this;
            if (ImageCommon_1.default.decodeError(this, file)) {
                return;
            }
            return ImageCommon_1.default.error(this, post, file, 3 * helpers_1.SECOND, function (URL) {
                if (URL) {
                    return _this.src = URL + (_this.src === URL ? '?' + Date.now() : '');
                }
                else {
                    return _1.default.rm(_this);
                }
            });
        };
    }
};
exports.default = ImageHover;
