"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var icon_1 = require("../Icons/icon");
var Notice = /** @class */ (function () {
    function Notice(type, content, timeout, onclose) {
        this.add = this.add.bind(this);
        this.close = this.close.bind(this);
        this.timeout = timeout;
        this.onclose = onclose;
        this.el = _1.default.el('div', {
            innerHTML: "<a href=\"javascript:;\" class=\"close\" title=\"Close\">".concat(icon_1.default.get('xmark'), "</a><div class=\"message\"></div>")
        });
        this.el.style.opacity = 0;
        this.setType(type);
        _1.default.on(this.el.firstElementChild, 'click', this.close);
        if (typeof content === 'string') {
            content = _1.default.tn(content);
        }
        _1.default.add(this.el.lastElementChild, content);
        _1.default.ready(this.add);
    }
    Notice.prototype.setType = function (type) {
        this.el.className = "notification ".concat(type);
    };
    Notice.prototype.add = function () {
        if (this.closed)
            return;
        if (globals_1.d.hidden) {
            _1.default.on(globals_1.d, 'visibilitychange', this.add);
            return;
        }
        _1.default.off(globals_1.d, 'visibilitychange', this.add);
        _1.default.add(Header_1.default.noticesRoot, this.el);
        this.el.clientHeight; // force reflow
        this.el.style.opacity = 1;
        if (this.timeout) {
            this.timeoutId = setTimeout(this.close, this.timeout * helpers_1.SECOND);
        }
    };
    Notice.prototype.close = function () {
        var _a;
        if (this.timeoutId)
            clearTimeout(this.timeoutId);
        this.closed = true;
        _1.default.off(globals_1.d, 'visibilitychange', this.add);
        _1.default.rm(this.el);
        (_a = this.onclose) === null || _a === void 0 ? void 0 : _a.call(this);
    };
    Notice.prototype.resetTimer = function () {
        if (this.timeout) {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(this.close, this.timeout * helpers_1.SECOND);
        }
    };
    return Notice;
}());
exports.default = Notice;
