"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var _1 = require("../platform/$");
var Callbacks_1 = require("../classes/Callbacks");
var CrossOrigin_1 = require("../platform/CrossOrigin");
var globals_1 = require("../globals/globals");
var Get_1 = require("../General/Get");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Metadata = {
    init: function () {
        if (!globals_1.Conf['WEBM Metadata'] || !['index', 'thread'].includes(globals_1.g.VIEW)) {
            return;
        }
        return Callbacks_1.default.Post.push({
            name: 'WEBM Metadata',
            cb: this.node
        });
    },
    node: function () {
        for (var i = 0; i < this.files.length; i++) {
            var file = this.files[i];
            if (/webm$/i.test(file.url)) {
                var el;
                if (this.isClone) {
                    el = (0, _1.default)('.webm-title', file.text);
                }
                else {
                    el = _1.default.el('span', { className: 'webm-title' });
                    el.dataset.index = i;
                    _1.default.extend(el, { innerHTML: "<a href=\"javascript:;\"></a>" });
                    _1.default.add(file.text, [_1.default.tn(' '), el]);
                }
                if (el.children.length === 1) {
                    _1.default.one(el.lastElementChild, 'mouseover focus', Metadata.load);
                }
            }
        }
    },
    load: function () {
        var _this = this;
        _1.default.rmClass(this.parentNode, 'error');
        _1.default.addClass(this.parentNode, 'loading');
        var index = this.parentNode.dataset.index;
        return CrossOrigin_1.default.binary(Get_1.default.postFromNode(this).files[+index].url, function (data) {
            _1.default.rmClass(_this.parentNode, 'loading');
            if (data != null) {
                var title = Metadata.parse(data);
                var output = _1.default.el('span', { textContent: title || '' });
                if (title == null) {
                    _1.default.addClass(_this.parentNode, 'not-found');
                }
                _1.default.before(_this, output);
                _this.parentNode.tabIndex = 0;
                if (globals_1.d.activeElement === _this) {
                    _this.parentNode.focus();
                }
                return _this.tabIndex = -1;
            }
            else {
                _1.default.addClass(_this.parentNode, 'error');
                return _1.default.one(_this, 'click', Metadata.load);
            }
        }, { Range: 'bytes=0-9999' });
    },
    parse: function (data) {
        var readInt = function () {
            var n = data[i++];
            var len = 0;
            while (n < (0x80 >> len)) {
                len++;
            }
            n ^= (0x80 >> len);
            while (len-- && (i < data.length)) {
                n = (n << 8) ^ data[i++];
            }
            return n;
        };
        var i = 0;
        while (i < data.length) {
            var element = readInt();
            var size = readInt();
            if (element === 0x3BA9) { // Title
                var title = '';
                while (size-- && (i < data.length)) {
                    title += String.fromCharCode(data[i++]);
                }
                return decodeURIComponent(escape(title)); // UTF-8 decoding
            }
            else if (![0x8538067, 0x549A966].includes(element)) { // Segment, Info
                i += size;
            }
        }
        return null;
    }
};
exports.default = Metadata;
