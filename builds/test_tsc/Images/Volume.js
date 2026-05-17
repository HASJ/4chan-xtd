"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Config_1 = require("../config/Config");
var Header_1 = require("../General/Header");
var UI_1 = require("../General/UI");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Volume = {
    init: function () {
        var _a, _b;
        if (!['index', 'thread'].includes(globals_1.g.VIEW) ||
            (!globals_1.Conf['Image Expansion'] && !globals_1.Conf['Image Hover'] && !globals_1.Conf['Image Hover in Catalog'] && !globals_1.Conf['Gallery'])) {
            return;
        }
        _1.default.sync('Allow Sound', function (x) {
            globals_1.Conf['Allow Sound'] = x;
            if (Volume.inputs)
                Volume.inputs.unmute.checked = x;
        });
        _1.default.sync('Default Volume', function (x) {
            globals_1.Conf['Default Volume'] = x;
            if (Volume.inputs)
                Volume.inputs.volume.value = x;
        });
        if (globals_1.Conf['Mouse Wheel Volume']) {
            Callbacks_1.default.Post.push({
                name: 'Mouse Wheel Volume',
                cb: this.node
            });
        }
        if ((_b = (_a = globals_1.g.SITE).noAudio) === null || _b === void 0 ? void 0 : _b.call(_a, globals_1.g.BOARD)) {
            return;
        }
        if (globals_1.Conf['Mouse Wheel Volume']) {
            Callbacks_1.default.CatalogThread.push({
                name: 'Mouse Wheel Volume',
                cb: this.catalogNode
            });
        }
        var unmuteEntry = UI_1.default.checkbox('Allow Sound', 'Allow Sound');
        unmuteEntry.title = Config_1.default.main['Images and Videos']['Allow Sound'][1];
        var volumeEntry = _1.default.el('label', { title: 'Default volume for videos.' });
        _1.default.extend(volumeEntry, { innerHTML: "<input name=\"Default Volume\" type=\"range\" min=\"0\" max=\"1\" step=\"0.01\" value=\"" + (0, globals_1.E)(globals_1.Conf["Default Volume"]) + "\"> Volume" });
        this.inputs = {
            unmute: unmuteEntry.firstElementChild,
            volume: volumeEntry.firstElementChild
        };
        _1.default.on(this.inputs.unmute, 'change', _1.default.cb.checked);
        _1.default.on(this.inputs.volume, 'change', _1.default.cb.value);
        Header_1.default.menu.addEntry({ el: unmuteEntry, order: 200 });
        return Header_1.default.menu.addEntry({ el: volumeEntry, order: 201 });
    },
    setup: function (video) {
        video.muted = !globals_1.Conf['Allow Sound'];
        video.volume = globals_1.Conf['Default Volume'];
        return _1.default.on(video, 'volumechange', Volume.change);
    },
    change: function () {
        var _a = this, muted = _a.muted, volume = _a.volume;
        var items = {
            'Allow Sound': !muted,
            'Default Volume': volume
        };
        for (var key in items) {
            var val = items[key];
            if (globals_1.Conf[key] === val) {
                delete items[key];
            }
        }
        _1.default.set(items);
        _1.default.extend(globals_1.Conf, items);
        if (Volume.inputs) {
            Volume.inputs.unmute.checked = !muted;
            return Volume.inputs.volume.value = volume;
        }
    },
    node: function () {
        var _a, _b;
        if ((_b = (_a = globals_1.g.SITE).noAudio) === null || _b === void 0 ? void 0 : _b.call(_a, this.board)) {
            return;
        }
        for (var _i = 0, _c = this.files; _i < _c.length; _i++) {
            var file = _c[_i];
            if (file.isVideo) {
                if (file.thumb) {
                    _1.default.on(file.thumb, 'wheel', Volume.wheel.bind(Header_1.default.hover));
                }
                _1.default.on(((0, _1.default)('.file-info', file.text) || file.link), 'wheel', Volume.wheel.bind(file.thumbLink));
            }
        }
    },
    catalogNode: function () {
        var file = this.thread.OP.files[0];
        if (!(file === null || file === void 0 ? void 0 : file.isVideo)) {
            return;
        }
        return _1.default.on(this.nodes.thumb, 'wheel', Volume.wheel.bind(Header_1.default.hover));
    },
    wheel: function (e) {
        var el;
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
            return;
        }
        if (!(el = (0, _1.default)('video:not([data-md5])', this))) {
            return;
        }
        if (el.muted || !_1.default.hasAudio(el)) {
            return;
        }
        var volume = el.volume + 0.1;
        if (e.deltaY < 0) {
            volume *= 1.1;
        }
        if (e.deltaY > 0) {
            volume /= 1.1;
        }
        el.volume = _1.default.minmax(volume - 0.1, 0, 1);
        return e.preventDefault();
    }
};
exports.default = Volume;
