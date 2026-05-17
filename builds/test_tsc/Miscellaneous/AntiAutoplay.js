"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var AntiAutoplay = {
    init: function () {
        var _this = this;
        if (!globals_1.Conf['Disable Autoplaying Sounds']) {
            return;
        }
        _1.default.addClass(globals_1.doc, 'anti-autoplay');
        for (var _i = 0, _a = (0, __1.default)('audio[autoplay]', globals_1.doc); _i < _a.length; _i++) {
            var audio = _a[_i];
            this.stop(audio);
        }
        window.addEventListener('loadstart', (function (e) { return _this.stop(e.target); }), true);
        Callbacks_1.default.Post.push({
            name: 'Disable Autoplaying Sounds',
            cb: this.node
        });
        return _1.default.ready(function () { return _this.process(globals_1.d.body); });
    },
    stop: function (audio) {
        if (!audio.autoplay) {
            return;
        }
        audio.pause();
        audio.autoplay = false;
        if (audio.controls) {
            return;
        }
        audio.controls = true;
        return _1.default.addClass(audio, 'controls-added');
    },
    node: function () {
        return AntiAutoplay.process(this.nodes.comment);
    },
    process: function (root) {
        for (var _i = 0, _a = (0, __1.default)('iframe[src*="youtube"][src*="autoplay=1"]', root); _i < _a.length; _i++) {
            var iframe = _a[_i];
            AntiAutoplay.processVideo(iframe, 'src');
        }
        for (var _b = 0, _c = (0, __1.default)('object[data*="youtube"][data*="autoplay=1"]', root); _b < _c.length; _b++) {
            var object = _c[_b];
            AntiAutoplay.processVideo(object, 'data');
        }
    },
    processVideo: function (el, attr) {
        el[attr] = el[attr].replace(/\?autoplay=1&?/, '?').replace('&autoplay=1', '');
        if (window.getComputedStyle(el).display === 'none') {
            el.style.display = 'block';
        }
        return _1.default.addClass(el, 'autoplay-removed');
    }
};
exports.default = AntiAutoplay;
