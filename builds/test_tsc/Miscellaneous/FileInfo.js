"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Filter_1 = require("../Filtering/Filter");
var globals_1 = require("../globals/globals");
var jsx_1 = require("../globals/jsx");
var icon_1 = require("../Icons/icon");
var ImageCommon_1 = require("../Images/ImageCommon");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var SW_1 = require("../site/SW");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var FileInfo = {
    init: function () {
        if (!['index', 'thread', 'archive'].includes(globals_1.g.VIEW) || !globals_1.Conf['File Info Formatting']) {
            return;
        }
        return Callbacks_1.default.Post.push({
            name: 'File Info Formatting',
            cb: this.node
        });
    },
    node: function () {
        if (!this.file) {
            return;
        }
        if (this.isClone) {
            var a = void 0;
            for (var _i = 0, _a = (0, __1.default)('.file-info .download-button', this.file.text); _i < _a.length; _i++) {
                a = _a[_i];
                _1.default.on(a, 'click', ImageCommon_1.default.download);
            }
            for (var _b = 0, _c = (0, __1.default)('.file-info .quick-filter-md5', this.file.text); _b < _c.length; _b++) {
                a = _c[_b];
                _1.default.on(a, 'click', Filter_1.default.quickFilterMD5);
            }
            return;
        }
        var oldInfo = _1.default.el('span', { className: 'fileText-original' });
        _1.default.prepend(this.file.link.parentNode, oldInfo);
        _1.default.add(oldInfo, [this.file.link.previousSibling, this.file.link, this.file.link.nextSibling]);
        var info = _1.default.el('span', { className: 'file-info' });
        FileInfo.format(globals_1.Conf['fileInfo'], this, info);
        return _1.default.prepend(this.file.text, info);
    },
    format: function (formatString, post, outputNode) {
        var a;
        var output = [];
        formatString.replace(/%(.)|[^%]+/g, function (s, c) {
            output.push(_1.default.hasOwn(FileInfo.formatters, c) ?
                FileInfo.formatters[c].call(post)
                :
                    { innerHTML: (0, globals_1.E)(s) });
            return '';
        });
        _1.default.extend(outputNode, { innerHTML: globals_1.E.cat(output) });
        for (var _i = 0, _a = (0, __1.default)('.download-button', outputNode); _i < _a.length; _i++) {
            a = _a[_i];
            _1.default.on(a, 'click', ImageCommon_1.default.download);
        }
        for (var _b = 0, _c = (0, __1.default)('.quick-filter-md5', outputNode); _b < _c.length; _b++) {
            a = _c[_b];
            _1.default.on(a, 'click', Filter_1.default.quickFilterMD5);
        }
    },
    formatters: {
        t: function () {
            var _a;
            return _a = { innerHTML: (0, globals_1.E)(this.file.url.match(/[^/]*$/)[0]) }, _a[jsx_1.isEscaped] = true, _a;
        },
        T: function () { return (0, jsx_1.default)("a", { href: this.file.url, target: "_blank" }, FileInfo.formatters.t.call(this)); },
        l: function () { return (0, jsx_1.default)("a", { href: this.file.url, target: "_blank" }, FileInfo.formatters.n.call(this)); },
        L: function () { return (0, jsx_1.default)("a", { href: this.file.url, target: "_blank" }, FileInfo.formatters.N.call(this)); },
        n: function () {
            var _a;
            var fullname = this.file.name;
            var shortname = SW_1.default.yotsuba.Build.shortFilename(this.file.name, this.isReply);
            if (fullname === shortname) {
                return _a = { innerHTML: (0, globals_1.E)(fullname) }, _a[jsx_1.isEscaped] = true, _a;
            }
            else {
                return (0, jsx_1.default)("span", { class: "fnswitch" },
                    (0, jsx_1.default)("span", { class: "fntrunc" }, shortname),
                    (0, jsx_1.default)("span", { class: "fnfull" }, fullname));
            }
        },
        N: function () {
            var _a;
            return _a = { innerHTML: (0, globals_1.E)(this.file.name) }, _a[jsx_1.isEscaped] = true, _a;
        },
        d: function () {
            return (0, jsx_1.default)("a", { href: this.file.url, download: this.file.name, class: "download-button" }, icon_1.default.raw('download'));
        },
        f: function () {
            var _a;
            return _a = {
                    innerHTML: "<a href=\"javascript:;\" class=\"quick-filter-md5\">".concat(icon_1.default.get('xmark'), "</a>")
                },
                _a[jsx_1.isEscaped] = true,
                _a;
        },
        p: function () {
            var _a;
            return _a = { innerHTML: ((this.file.isSpoiler) ? "Spoiler, " : "") }, _a[jsx_1.isEscaped] = true, _a;
        },
        s: function () {
            var _a;
            return _a = { innerHTML: (0, globals_1.E)(this.file.size) }, _a[jsx_1.isEscaped] = true, _a;
        },
        B: function () {
            var _a;
            return _a = { innerHTML: Math.round(this.file.sizeInBytes) + " Bytes" }, _a[jsx_1.isEscaped] = true, _a;
        },
        K: function () {
            var _a;
            return _a = { innerHTML: (Math.round(this.file.sizeInBytes / 1024)) + " KB" }, _a[jsx_1.isEscaped] = true, _a;
        },
        M: function () {
            var _a;
            return _a = { innerHTML: (Math.round(this.file.sizeInBytes / 1048576 * 100) / 100) + " MB" }, _a[jsx_1.isEscaped] = true, _a;
        },
        r: function () {
            var _a;
            return _a = { innerHTML: (0, globals_1.E)(this.file.dimensions || "PDF") }, _a[jsx_1.isEscaped] = true, _a;
        },
        g: function () {
            var _a;
            return _a = { innerHTML: ((this.file.tag) ? ", " + (0, globals_1.E)(this.file.tag) : "") }, _a[jsx_1.isEscaped] = true, _a;
        },
        '%': function () {
            var _a;
            return _a = { innerHTML: "%" }, _a[jsx_1.isEscaped] = true, _a;
        }
    }
};
exports.default = FileInfo;
