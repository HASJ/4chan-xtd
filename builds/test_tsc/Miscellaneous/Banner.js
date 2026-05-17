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
var DataBoard_1 = require("../classes/DataBoard");
var globals_1 = require("../globals/globals");
var Unread_1 = require("../Monitoring/Unread");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var helpers_1 = require("../platform/helpers");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Banner = {
    init: function () {
        if (globals_1.Conf['Custom Board Titles']) {
            this.db = new DataBoard_1.default('customTitles', null, true);
        }
        _1.default.asap((function () { return globals_1.d.body; }), function () { return _1.default.asap((function () { return (0, _1.default)('hr'); }), Banner.ready); });
        // Let 4chan's JS load the banner if enabled; otherwise, load it ourselves.
        if (globals_1.g.BOARD.ID !== 'f') {
            return _1.default.on(globals_1.d, '4chanXInitFinished', function () { return _1.default.queueTask(Banner.load); });
        }
    },
    ready: function () {
        var banner = (0, _1.default)(".boardBanner");
        var children = banner.children;
        if ((globals_1.g.VIEW === 'thread') && globals_1.Conf['Remove Thread Excerpt']) {
            Banner.setTitle(children[1].textContent);
        }
        children[0].title = "Click to change";
        _1.default.on(children[0], 'click', Banner.cb.toggle);
        if (globals_1.Conf['Custom Board Titles']) {
            Banner.custom(children[1]);
            if (children[2]) {
                return Banner.custom(children[2]);
            }
        }
    },
    load: function () {
        var bannerCnt = _1.default.id('bannerCnt');
        if (!bannerCnt.firstChild) {
            var img = _1.default.el('img', {
                alt: '4chan',
                src: '//s.4cdn.org/image/title/' + bannerCnt.dataset.src
            });
            return _1.default.add(bannerCnt, img);
        }
    },
    setTitle: function (title) {
        if (Unread_1.default.title != null) {
            Unread_1.default.title = title;
            return Unread_1.default.update();
        }
        else {
            return globals_1.d.title = title;
        }
    },
    cb: {
        toggle: function () {
            var _a;
            if (!((_a = Banner.choices) === null || _a === void 0 ? void 0 : _a.length)) {
                Banner.choices = globals_1.Conf['knownBanners'].split(',').slice();
            }
            var i = Math.floor(Banner.choices.length * Math.random());
            var banner = Banner.choices.splice(i, 1);
            return (0, _1.default)('img', this.parentNode).src = "//s.4cdn.org/image/title/".concat(banner);
        },
        click: function (e) {
            if (!e.ctrlKey && !e.metaKey) {
                return;
            }
            if (Banner.original[this.className] == null) {
                Banner.original[this.className] = this.cloneNode(true);
            }
            this.contentEditable = true;
            for (var _i = 0, _a = (0, __1.default)('br', this); _i < _a.length; _i++) {
                var br = _a[_i];
                _1.default.replace(br, _1.default.tn('\n'));
            }
            return this.focus();
        },
        keydown: function (e) {
            e.stopPropagation();
            if (!e.shiftKey && (e.keyCode === 13)) {
                return this.blur();
            }
        },
        blur: function () {
            for (var _i = 0, _a = (0, __1.default)('br', this); _i < _a.length; _i++) {
                var br = _a[_i];
                _1.default.replace(br, _1.default.tn('\n'));
            }
            if (this.textContent = this.textContent.replace(/\n*$/, '')) {
                this.contentEditable = false;
                return Banner.db.set({
                    boardID: globals_1.g.BOARD.ID,
                    threadID: this.className,
                    val: {
                        title: this.textContent,
                        orig: Banner.original[this.className].textContent
                    }
                });
            }
            else {
                _1.default.rmAll(this);
                _1.default.add(this, __spreadArray([], Banner.original[this.className].cloneNode(true).childNodes, true));
                return Banner.db.delete({
                    boardID: globals_1.g.BOARD.ID,
                    threadID: this.className
                });
            }
        }
    },
    original: (0, helpers_1.dict)(),
    custom: function (child) {
        var data;
        var className = child.className;
        child.title = "Ctrl/\u2318+click to edit board ".concat(className.slice(5).toLowerCase());
        child.spellcheck = false;
        for (var _i = 0, _a = ['click', 'keydown', 'blur']; _i < _a.length; _i++) {
            var event = _a[_i];
            _1.default.on(child, event, Banner.cb[event]);
        }
        if (data = Banner.db.get({ boardID: globals_1.g.BOARD.ID, threadID: className })) {
            if (globals_1.Conf['Persistent Custom Board Titles'] || (data.orig === child.textContent)) {
                Banner.original[className] = child.cloneNode(true);
                return child.textContent = data.title;
            }
            else {
                return Banner.db.delete({ boardID: globals_1.g.BOARD.ID, threadID: className });
            }
        }
    }
};
exports.default = Banner;
