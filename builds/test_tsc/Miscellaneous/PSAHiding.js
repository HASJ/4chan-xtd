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
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var icon_1 = require("../Icons/icon");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var PSAHiding = {
    init: function () {
        if (!globals_1.Conf['Announcement Hiding'] || !globals_1.g.SITE.selectors.psa) {
            return;
        }
        _1.default.addClass(globals_1.doc, 'hide-announcement');
        _1.default.onExists(globals_1.doc, globals_1.g.SITE.selectors.psa, this.setup);
        return _1.default.ready(function () {
            if (!(0, _1.default)(globals_1.g.SITE.selectors.psa)) {
                return _1.default.rmClass(globals_1.doc, 'hide-announcement');
            }
        });
    },
    setup: function (psa) {
        var _a, _b, _c;
        var btn, hr;
        PSAHiding.psa = psa;
        PSAHiding.text = (_a = psa.dataset.utc) !== null && _a !== void 0 ? _a : psa.innerHTML;
        if (globals_1.g.SITE.selectors.psaTop && (hr = (_b = (0, _1.default)(globals_1.g.SITE.selectors.psaTop)) === null || _b === void 0 ? void 0 : _b.previousElementSibling) && (hr.nodeName === 'HR')) {
            PSAHiding.hr = hr;
        }
        PSAHiding.content = _1.default.el('div');
        var entry = {
            el: _1.default.el('a', {
                textContent: 'Show announcement',
                className: 'show-announcement',
                href: 'javascript:;'
            }),
            order: 50,
            open: function () { return psa.hidden; }
        };
        Header_1.default.menu.addEntry(entry);
        _1.default.on(entry.el, 'click', PSAHiding.toggle);
        PSAHiding.btn = (btn = _1.default.el('a', {
            title: 'Mark announcement as read and hide.',
            className: 'hide-announcement-button',
            href: 'javascript:;',
            textContent: 'âž–ï¸Ž',
        }));
        icon_1.default.set(btn, 'squareMinus');
        _1.default.on(btn, 'click', PSAHiding.toggle);
        if (((_c = psa.firstChild) === null || _c === void 0 ? void 0 : _c.tagName) === 'HR') {
            _1.default.after(psa.firstChild, btn);
        }
        else {
            _1.default.prepend(psa, btn);
        }
        PSAHiding.sync(globals_1.Conf['hiddenPSAList']);
        _1.default.rmClass(globals_1.doc, 'hide-announcement');
        return _1.default.sync('hiddenPSAList', PSAHiding.sync);
    },
    toggle: function () {
        var hide = _1.default.hasClass(this, 'hide-announcement-button');
        var set = function (hiddenPSAList) {
            if (hide) {
                return hiddenPSAList[globals_1.g.SITE.ID] = PSAHiding.text;
            }
            else {
                return delete hiddenPSAList[globals_1.g.SITE.ID];
            }
        };
        set(globals_1.Conf['hiddenPSAList']);
        PSAHiding.sync(globals_1.Conf['hiddenPSAList']);
        return _1.default.get('hiddenPSAList', globals_1.Conf['hiddenPSAList'], function (_a) {
            var hiddenPSAList = _a.hiddenPSAList;
            set(hiddenPSAList);
            return _1.default.set('hiddenPSAList', hiddenPSAList);
        });
    },
    sync: function (hiddenPSAList) {
        var psa = PSAHiding.psa, content = PSAHiding.content;
        psa.hidden = (hiddenPSAList[globals_1.g.SITE.ID] === PSAHiding.text);
        // Remove content to prevent autoplaying sounds from hidden announcements
        if (psa.hidden) {
            _1.default.add(content, __spreadArray([], psa.childNodes, true));
        }
        else {
            _1.default.add(psa, __spreadArray([], content.childNodes, true));
        }
        if (PSAHiding.hr)
            PSAHiding.hr.hidden = psa.hidden;
    }
};
exports.default = PSAHiding;
