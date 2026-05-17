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
exports.checkbox = exports.hoverend = exports.hover = exports.dragend = exports.touchend = exports.drag = exports.touchmove = exports.dragstart = void 0;
// @ts-nocheck
var globals_1 = require("../globals/globals");
var Callbacks_1 = require("../classes/Callbacks");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var Header_1 = require("./Header");
var icon_1 = require("../Icons/icon");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var dialog = function (id, properties) {
    var el = _1.default.el('div', {
        className: 'dialog',
        id: id
    });
    _1.default.extend(el, properties);
    el.style.cssText = globals_1.Conf["".concat(id, ".position")];
    var move = (0, _1.default)('.move', el);
    _1.default.on(move, 'touchstart mousedown', exports.dragstart);
    for (var _i = 0, _a = move.children; _i < _a.length; _i++) {
        var child = _a[_i];
        if (!child.tagName) {
            continue;
        }
        _1.default.on(child, 'touchstart mousedown', function (e) { return e.stopPropagation(); });
    }
    return el;
};
var Menu = (function () {
    var currentMenu = undefined;
    var lastToggledButton = undefined;
    Menu = /** @class */ (function () {
        function Menu(type) {
            var _this = this;
            // XXX AddMenuEntry event is deprecated
            this.setPosition = this.setPosition.bind(this);
            this.close = this.close.bind(this);
            this.keybinds = this.keybinds.bind(this);
            this.onFocus = this.onFocus.bind(this);
            this.addEntry = this.addEntry.bind(this);
            this.type = type;
            _1.default.on(globals_1.d, 'AddMenuEntry', function (_a) {
                var detail = _a.detail;
                if (detail.type !== _this.type) {
                    return;
                }
                delete detail.open;
                return _this.addEntry(detail);
            });
            this.entries = [];
        }
        Menu.initClass = function () {
            currentMenu = null;
            lastToggledButton = null;
        };
        Menu.prototype.makeMenu = function () {
            var menu = _1.default.el('div', {
                className: 'dialog',
                id: 'menu',
                tabIndex: 0
            });
            menu.dataset.type = this.type;
            _1.default.on(menu, 'click', function (e) { return e.stopPropagation(); });
            _1.default.on(menu, 'keydown', this.keybinds);
            return menu;
        };
        Menu.prototype.toggle = function (e, button, data) {
            e.preventDefault();
            e.stopPropagation();
            if (currentMenu) {
                // Close if it's already opened.
                // Reopen if we clicked on another button.
                var previousButton = lastToggledButton;
                currentMenu.close();
                if (previousButton === button) {
                    return;
                }
            }
            if (!this.entries.length) {
                return;
            }
            return this.open(button, data);
        };
        Menu.prototype.open = function (button, data) {
            var entry;
            var menu = (this.menu = this.makeMenu());
            currentMenu = this;
            lastToggledButton = button;
            this.entries.sort(function (first, second) { return first.order - second.order; });
            for (var _i = 0, _a = this.entries; _i < _a.length; _i++) {
                entry = _a[_i];
                this.insertEntry(entry, menu, data);
            }
            _1.default.addClass(lastToggledButton, 'active');
            _1.default.on(globals_1.d, 'click CloseMenu', this.close);
            _1.default.on(globals_1.d, 'scroll', this.setPosition);
            _1.default.on(window, 'resize', this.setPosition);
            _1.default.after(button, menu);
            this.setPosition();
            entry = (0, _1.default)('.entry', menu);
            // We've removed flexbox, so we don't use order anymore.
            // while prevEntry = @findNextEntry entry, -1
            //   entry = prevEntry
            this.focus(entry);
            return menu.focus();
        };
        Menu.prototype.setPosition = function () {
            var mRect = this.menu.getBoundingClientRect();
            var bRect = lastToggledButton.getBoundingClientRect();
            var cHeight = globals_1.doc.clientHeight;
            var cWidth = globals_1.doc.clientWidth;
            var _a = (bRect.top + bRect.height + mRect.height) < cHeight ?
                ["".concat(bRect.bottom, "px"), '']
                :
                    ['', "".concat(cHeight - bRect.top, "px")], top = _a[0], bottom = _a[1];
            var _b = (bRect.left + mRect.width) < cWidth ?
                ["".concat(bRect.left, "px"), '']
                :
                    ['', "".concat(cWidth - bRect.right, "px")], left = _b[0], right = _b[1];
            _1.default.extend(this.menu.style, { top: top, right: right, bottom: bottom, left: left });
            return this.menu.classList.toggle('left', right);
        };
        Menu.prototype.insertEntry = function (entry, parent, data) {
            var _a;
            var submenu;
            if (typeof entry.open === 'function') {
                try {
                    if (!entry.open(data)) {
                        return;
                    }
                }
                catch (err) {
                    (_a = Callbacks_1.default.errorHandler) === null || _a === void 0 ? void 0 : _a.call(Callbacks_1.default, {
                        message: "Error in building the ".concat(this.type, " menu."),
                        error: err
                    });
                    return;
                }
            }
            _1.default.add(parent, entry.el);
            if (!entry.subEntries) {
                return;
            }
            if (submenu = (0, _1.default)('.submenu', entry.el)) {
                // Reset sub menu, remove irrelevant entries.
                _1.default.rm(submenu);
            }
            submenu = _1.default.el('div', { className: 'dialog submenu' });
            for (var _i = 0, _b = entry.subEntries; _i < _b.length; _i++) {
                var subEntry = _b[_i];
                this.insertEntry(subEntry, submenu, data);
            }
            _1.default.add(entry.el, submenu);
        };
        Menu.prototype.close = function () {
            _1.default.rm(this.menu);
            delete this.menu;
            _1.default.rmClass(lastToggledButton, 'active');
            currentMenu = null;
            lastToggledButton = null;
            _1.default.off(globals_1.d, 'click scroll CloseMenu', this.close);
            _1.default.off(globals_1.d, 'scroll', this.setPosition);
            return _1.default.off(window, 'resize', this.setPosition);
        };
        Menu.prototype.findNextEntry = function (entry, direction) {
            var entries = __spreadArray([], entry.parentNode.children, true);
            entries.sort(function (first, second) { return first.style.order - second.style.order; });
            return entries[entries.indexOf(entry) + direction];
        };
        Menu.prototype.keybinds = function (e) {
            var subEntry;
            var next, submenu;
            var entry = (0, _1.default)('.focused', this.menu);
            while ((subEntry = (0, _1.default)('.focused', entry))) {
                entry = subEntry;
            }
            switch (e.keyCode) {
                case 27: // Esc
                    lastToggledButton.focus();
                    this.close();
                    break;
                case 13:
                case 32: // Enter, Space
                    entry.click();
                    break;
                case 38: // Up
                    if (next = this.findNextEntry(entry, -1)) {
                        this.focus(next);
                    }
                    break;
                case 40: // Down
                    if (next = this.findNextEntry(entry, +1)) {
                        this.focus(next);
                    }
                    break;
                case 39: // Right
                    if ((submenu = (0, _1.default)('.submenu', entry)) && (next = submenu.firstElementChild)) {
                        var nextPrev = void 0;
                        while ((nextPrev = this.findNextEntry(next, -1))) {
                            next = nextPrev;
                        }
                        this.focus(next);
                    }
                    break;
                case 37: // Left
                    if (next = _1.default.x('parent::*[contains(@class,"submenu")]/parent::*', entry)) {
                        this.focus(next);
                    }
                    break;
                default:
                    return;
            }
            e.preventDefault();
            return e.stopPropagation();
        };
        Menu.prototype.onFocus = function (e) {
            e.stopPropagation();
            return this.focus(e.target);
        };
        Menu.prototype.focus = function (entry) {
            var focused, submenu;
            while ((focused = _1.default.x('parent::*/child::*[contains(@class,"focused")]', entry))) {
                _1.default.rmClass(focused, 'focused');
            }
            for (var _i = 0, _a = (0, __1.default)('.focused', entry); _i < _a.length; _i++) {
                focused = _a[_i];
                _1.default.rmClass(focused, 'focused');
            }
            _1.default.addClass(entry, 'focused');
            // Submenu positioning.
            if (!(submenu = (0, _1.default)('.submenu', entry))) {
                return;
            }
            var sRect = submenu.getBoundingClientRect();
            var eRect = entry.getBoundingClientRect();
            var cHeight = globals_1.doc.clientHeight;
            var cWidth = globals_1.doc.clientWidth;
            var _b = (eRect.top + sRect.height) < cHeight ?
                ['0px', 'auto']
                :
                    ['auto', '0px'], top = _b[0], bottom = _b[1];
            var _c = (eRect.right + sRect.width) < (cWidth - 150) ?
                ['100%', 'auto']
                :
                    ['auto', '100%'], left = _c[0], right = _c[1];
            var style = submenu.style;
            style.top = top;
            style.bottom = bottom;
            style.left = left;
            return style.right = right;
        };
        Menu.prototype.addEntry = function (entry) {
            this.parseEntry(entry);
            return this.entries.push(entry);
        };
        Menu.prototype.parseEntry = function (entry) {
            var el = entry.el, subEntries = entry.subEntries;
            _1.default.addClass(el, 'entry');
            _1.default.on(el, 'focus mouseover', this.onFocus);
            el.style.order = entry.order || 100;
            if (!subEntries) {
                return;
            }
            _1.default.addClass(el, 'has-submenu');
            for (var _i = 0, subEntries_1 = subEntries; _i < subEntries_1.length; _i++) {
                var subEntry = subEntries_1[_i];
                this.parseEntry(subEntry);
            }
            var span = _1.default.el('span', { className: 'menu-indicator' });
            icon_1.default.set(span, 'caretRight');
            _1.default.add(el, span);
        };
        return Menu;
    }());
    Menu.initClass();
    return Menu;
})();
var dragstart = function (e) {
    var _a;
    var isTouching;
    if ((e.type === 'mousedown') && (e.button !== 0)) {
        return;
    } // not LMB
    // prevent text selection
    e.preventDefault();
    if (isTouching = e.type === 'touchstart') {
        e = e.changedTouches[e.changedTouches.length - 1];
    }
    // distance from pointer to el edge is constant; calculate it here.
    var el = _1.default.x('ancestor::div[contains(@class,"dialog")][1]', this);
    var rect = el.getBoundingClientRect();
    var screenHeight = globals_1.doc.clientHeight;
    var screenWidth = globals_1.doc.clientWidth;
    var o = {
        id: el.id,
        style: el.style,
        dx: e.clientX - rect.left,
        dy: e.clientY - rect.top,
        height: screenHeight - rect.height,
        width: screenWidth - rect.width,
        screenHeight: screenHeight,
        screenWidth: screenWidth,
        isTouching: isTouching
    };
    _a = globals_1.Conf['Header auto-hide'] || !globals_1.Conf['Fixed Header'] ?
        [0, 0]
        : globals_1.Conf['Bottom Header'] ?
            [0, Header_1.default.bar.getBoundingClientRect().height]
            :
                [Header_1.default.bar.getBoundingClientRect().height, 0], o.topBorder = _a[0], o.bottomBorder = _a[1];
    if (isTouching) {
        o.identifier = e.identifier;
        o.move = exports.touchmove.bind(o);
        o.up = exports.touchend.bind(o);
        _1.default.on(globals_1.d, 'touchmove', o.move);
        return _1.default.on(globals_1.d, 'touchend touchcancel', o.up);
    }
    else { // mousedown
        o.move = exports.drag.bind(o);
        o.up = exports.dragend.bind(o);
        _1.default.on(globals_1.d, 'mousemove', o.move);
        return _1.default.on(globals_1.d, 'mouseup', o.up);
    }
};
exports.dragstart = dragstart;
var touchmove = function (e) {
    for (var _i = 0, _a = e.changedTouches; _i < _a.length; _i++) {
        var touch = _a[_i];
        if (touch.identifier === this.identifier) {
            exports.drag.call(this, touch);
            return;
        }
    }
};
exports.touchmove = touchmove;
var drag = function (e) {
    var clientX = e.clientX, clientY = e.clientY;
    var left = clientX - this.dx;
    left = left < 10 ?
        0
        : (this.width - left) < 10 ?
            ''
            :
                ((left / this.screenWidth) * 100) + '%';
    var top = clientY - this.dy;
    top = top < (10 + this.topBorder) ?
        this.topBorder + 'px'
        : (this.height - top) < (10 + this.bottomBorder) ?
            ''
            :
                ((top / this.screenHeight) * 100) + '%';
    var right = left === '' ?
        0
        :
            '';
    var bottom = top === '' ?
        this.bottomBorder + 'px'
        :
            '';
    var style = this.style;
    style.left = left;
    style.right = right;
    style.top = top;
    style.bottom = bottom;
};
exports.drag = drag;
var touchend = function (e) {
    for (var _i = 0, _a = e.changedTouches; _i < _a.length; _i++) {
        var touch = _a[_i];
        if (touch.identifier === this.identifier) {
            exports.dragend.call(this);
            return;
        }
    }
};
exports.touchend = touchend;
var dragend = function () {
    if (this.isTouching) {
        _1.default.off(globals_1.d, 'touchmove', this.move);
        _1.default.off(globals_1.d, 'touchend touchcancel', this.up);
    }
    else { // mouseup
        _1.default.off(globals_1.d, 'mousemove', this.move);
        _1.default.off(globals_1.d, 'mouseup', this.up);
    }
    if (this.style.length === 2) { // assume only left or right and top or bottom
        _1.default.set("".concat(this.id, ".position"), this.style.cssText);
    }
    else { // only include position data.
        var _a = this.style, left = _a.left, right = _a.right, top_1 = _a.top, bottom = _a.bottom;
        var position = '';
        if (left)
            position += "left:".concat(left, ";");
        if (right)
            position += "right:".concat(right, ";");
        if (top_1)
            position += "top:".concat(top_1, ";");
        if (bottom)
            position += "bottom:".concat(bottom, ";");
        _1.default.set("".concat(this.id, ".position"), position);
    }
};
exports.dragend = dragend;
var hoverstart = function (_a) {
    var root = _a.root, el = _a.el, latestEvent = _a.latestEvent, endEvents = _a.endEvents, height = _a.height, width = _a.width, cb = _a.cb, noRemove = _a.noRemove;
    var rect = root.getBoundingClientRect();
    var o = {
        root: root,
        el: el,
        style: el.style,
        isImage: ['IMG', 'VIDEO'].includes(el.nodeName),
        cb: cb,
        endEvents: endEvents,
        latestEvent: latestEvent,
        clientHeight: globals_1.doc.clientHeight,
        clientWidth: globals_1.doc.clientWidth,
        height: height,
        width: width,
        noRemove: noRemove,
        clientX: (rect.left + rect.right) / 2,
        clientY: (rect.top + rect.bottom) / 2
    };
    o.hover = exports.hover.bind(o);
    o.hoverend = exports.hoverend.bind(o);
    o.hover(o.latestEvent);
    new MutationObserver(function () {
        if (el.parentNode) {
            return o.hover(o.latestEvent);
        }
    }).observe(el, { childList: true });
    _1.default.on(root, endEvents, o.hoverend);
    if (_1.default.x('ancestor::div[contains(@class,"inline")][1]', root)) {
        _1.default.on(globals_1.d, 'keydown', o.hoverend);
    }
    _1.default.on(root, 'mousemove', o.hover);
    // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=674955
    o.workaround = function (e) { if (!root.contains(e.target)) {
        return o.hoverend(e);
    } };
    return _1.default.on(globals_1.doc, 'mousemove', o.workaround);
};
hoverstart.padding = 25;
var hover = function (e) {
    this.latestEvent = e;
    var height = (this.height || this.el.offsetHeight) + hoverstart.padding;
    var width = (this.width || this.el.offsetWidth);
    var _a = globals_1.Conf['Follow Cursor'] ? e : this, clientX = _a.clientX, clientY = _a.clientY;
    var top = this.isImage ?
        Math.max(0, (clientY * (this.clientHeight - height)) / this.clientHeight)
        :
            Math.max(0, Math.min(this.clientHeight - height, clientY - 120));
    var threshold = this.clientWidth / 2;
    if (!this.isImage) {
        threshold = Math.max(threshold, this.clientWidth - 400);
    }
    var marginX = (clientX <= threshold ? clientX : this.clientWidth - clientX) + 45;
    if (this.isImage) {
        marginX = Math.min(marginX, this.clientWidth - width);
    }
    marginX += 'px';
    var _b = clientX <= threshold ? [marginX, ''] : ['', marginX], left = _b[0], right = _b[1];
    var style = this.style;
    style.top = top + 'px';
    style.left = left;
    return style.right = right;
};
exports.hover = hover;
var hoverend = function (e) {
    if (((e.type === 'keydown') && (e.keyCode !== 13)) || (e.target.nodeName === "TEXTAREA")) {
        return;
    }
    if (!this.noRemove) {
        _1.default.rm(this.el);
    }
    _1.default.off(this.root, this.endEvents, this.hoverend);
    _1.default.off(globals_1.d, 'keydown', this.hoverend);
    _1.default.off(this.root, 'mousemove', this.hover);
    // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=674955
    _1.default.off(globals_1.doc, 'mousemove', this.workaround);
    if (this.cb) {
        return this.cb.call(this);
    }
};
exports.hoverend = hoverend;
var checkbox = function (name, text, checked) {
    if (checked == null) {
        checked = globals_1.Conf[name];
    }
    var label = _1.default.el('label');
    var input = _1.default.el('input', { type: 'checkbox', name: name, checked: checked });
    _1.default.add(label, [input, _1.default.tn(" ".concat(text))]);
    return label;
};
exports.checkbox = checkbox;
var UI = {
    dialog: dialog,
    Menu: Menu,
    hover: hoverstart,
    checkbox: exports.checkbox
};
exports.default = UI;
