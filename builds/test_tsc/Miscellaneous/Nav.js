"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Get_1 = require("../General/Get");
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var icon_1 = require("../Icons/icon");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Nav = {
    init: function () {
        switch (globals_1.g.VIEW) {
            case 'index':
                if (!globals_1.Conf['Index Navigation']) {
                    return;
                }
                break;
            case 'thread':
                if (!globals_1.Conf['Reply Navigation']) {
                    return;
                }
                break;
            default:
                return;
        }
        var span = _1.default.el('span', { id: 'navlinks' });
        var prev = _1.default.el('a', {
            textContent: 'â–²',
            className: 'navlinks-navlink navlink-prev',
            href: 'javascript:;'
        });
        var next = _1.default.el('a', {
            textContent: 'â–¼',
            className: 'navlinks-navlink navlink-next',
            href: 'javascript:;'
        });
        icon_1.default.set(prev, 'arrowUpLong');
        icon_1.default.set(next, 'arrowDownLong');
        _1.default.on(prev, 'click', this.prev);
        _1.default.on(next, 'click', this.next);
        _1.default.add(span, [prev, _1.default.tn(' '), next]);
        var append = function () {
            _1.default.off(globals_1.d, '4chanXInitFinished', append);
            return _1.default.add(globals_1.d.body, span);
        };
        return _1.default.on(globals_1.d, '4chanXInitFinished', append);
    },
    prev: function () {
        if (globals_1.g.VIEW === 'thread') {
            return window.scrollTo(0, 0);
        }
        else {
            return Nav.scroll(-1);
        }
    },
    next: function () {
        if (globals_1.g.VIEW === 'thread') {
            return window.scrollTo(0, globals_1.d.body.scrollHeight);
        }
        else {
            return Nav.scroll(+1);
        }
    },
    getThread: function () {
        if (globals_1.g.VIEW === 'thread') {
            return globals_1.g.threads.get("".concat(globals_1.g.BOARD, ".").concat(globals_1.g.THREADID)).nodes.root;
        }
        if (_1.default.hasClass(globals_1.doc, 'catalog-mode')) {
            return;
        }
        for (var _i = 0, _a = (0, __1.default)(globals_1.g.SITE.selectors.thread); _i < _a.length; _i++) {
            var threadRoot = _a[_i];
            var thread = Get_1.default.threadFromRoot(threadRoot);
            if (thread.isHidden && !thread.stub) {
                continue;
            }
            if (Header_1.default.getTopOf(threadRoot) >= -threadRoot.getBoundingClientRect().height) { // not scrolled past
                return threadRoot;
            }
        }
    },
    scroll: function (delta) {
        var _a;
        var next;
        (_a = globals_1.d.activeElement) === null || _a === void 0 ? void 0 : _a.blur();
        var thread = Nav.getThread();
        if (!thread) {
            return;
        }
        var axis = delta === +1 ?
            'following'
            :
                'preceding';
        if (next = _1.default.x("".concat(axis, "-sibling::").concat(globals_1.g.SITE.xpath.thread, "[not(@hidden)][1]"), thread)) {
            // Unless we're not at the beginning of the current thread,
            // and thus wanting to move to beginning,
            // or we're above the first thread and don't want to skip it.
            var top_1 = Header_1.default.getTopOf(thread);
            if (((delta === +1) && (top_1 < 5)) || ((delta === -1) && (top_1 > -5))) {
                thread = next;
            }
        }
        // Add extra space to the end of the page if necessary so that all threads can be selected by keybinds.
        var extra = (Header_1.default.getTopOf(thread) + globals_1.doc.clientHeight) - globals_1.d.body.getBoundingClientRect().bottom;
        if (extra > 0) {
            globals_1.d.body.style.marginBottom = "".concat(extra, "px");
        }
        Header_1.default.scrollTo(thread);
        if ((extra > 0) && !Nav.haveExtra) {
            Nav.haveExtra = true;
            return _1.default.on(globals_1.d, 'scroll', Nav.removeExtra);
        }
    },
    removeExtra: function () {
        var extra = globals_1.doc.clientHeight - globals_1.d.body.getBoundingClientRect().bottom;
        if (extra > 0) {
            return globals_1.d.body.style.marginBottom = "".concat(extra, "px");
        }
        else {
            globals_1.d.body.style.marginBottom = '';
            delete Nav.haveExtra;
            return _1.default.off(globals_1.d, 'scroll', Nav.removeExtra);
        }
    }
};
exports.default = Nav;
