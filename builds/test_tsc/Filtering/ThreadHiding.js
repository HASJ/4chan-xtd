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
var Callbacks_1 = require("../classes/Callbacks");
var DataBoard_1 = require("../classes/DataBoard");
var Thread_1 = require("../classes/Thread");
var Index_1 = require("../General/Index");
var UI_1 = require("../General/UI");
var globals_1 = require("../globals/globals");
var Menu_1 = require("../Menu/Menu");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var helpers_1 = require("../platform/helpers");
var icon_1 = require("../Icons/icon");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ThreadHiding = {
    init: function () {
        if (!['index', 'catalog'].includes(globals_1.g.VIEW) || (!globals_1.Conf['Thread Hiding Buttons'] && !(globals_1.Conf['Menu'] && globals_1.Conf['Thread Hiding Link']) && !globals_1.Conf['JSON Index'])) {
            return;
        }
        this.db = new DataBoard_1.default('hiddenThreads');
        if (globals_1.g.VIEW === 'catalog') {
            return this.catalogWatch();
        }
        this.catalogSet(globals_1.g.BOARD);
        _1.default.on(globals_1.d, 'IndexRefreshInternal', this.onIndexRefresh);
        if (globals_1.Conf['Thread Hiding Buttons']) {
            _1.default.addClass(globals_1.doc, 'thread-hide');
        }
        return Callbacks_1.default.Post.push({
            name: 'Thread Hiding',
            cb: this.node
        });
    },
    catalogSet: function (board) {
        if (!_1.default.hasStorage || (globals_1.g.SITE.software !== 'yotsuba')) {
            return;
        }
        var hiddenThreads = ThreadHiding.db.get({
            boardID: board.ID,
            defaultValue: (0, helpers_1.dict)()
        });
        for (var threadID in hiddenThreads) {
            hiddenThreads[threadID] = true;
        }
        return localStorage.setItem("4chan-hide-t-".concat(board), JSON.stringify(hiddenThreads));
    },
    catalogWatch: function () {
        if (!_1.default.hasStorage || (globals_1.g.SITE.software !== 'yotsuba')) {
            return;
        }
        this.hiddenThreads = JSON.parse(localStorage.getItem("4chan-hide-t-".concat(globals_1.g.BOARD))) || {};
        return _1.default.on(globals_1.d, '4chanXInitFinished', function () {
            return new MutationObserver(ThreadHiding.catalogSave).observe(_1.default.id('threads'), {
                attributes: true,
                subtree: true,
                attributeFilter: ['style']
            });
        });
    },
    catalogSave: function () {
        var threadID;
        var hiddenThreads2 = JSON.parse(localStorage.getItem("4chan-hide-t-".concat(globals_1.g.BOARD))) || {};
        for (threadID in hiddenThreads2) {
            if (!_1.default.hasOwn(ThreadHiding.hiddenThreads, threadID)) {
                ThreadHiding.db.set({
                    boardID: globals_1.g.BOARD.ID,
                    threadID: threadID,
                    val: { makeStub: globals_1.Conf['Stubs'] }
                });
            }
        }
        for (threadID in ThreadHiding.hiddenThreads) {
            if (!_1.default.hasOwn(hiddenThreads2, threadID)) {
                ThreadHiding.db.delete({
                    boardID: globals_1.g.BOARD.ID,
                    threadID: threadID
                });
            }
        }
        return ThreadHiding.hiddenThreads = hiddenThreads2;
    },
    isHidden: function (boardID, threadID) {
        return !!(ThreadHiding.db && ThreadHiding.db.get({ boardID: boardID, threadID: threadID }));
    },
    node: function () {
        var data;
        if (this.isReply || this.isClone || this.isFetchedQuote) {
            return;
        }
        if (globals_1.Conf['Thread Hiding Buttons']) {
            _1.default.prepend(this.nodes.root, ThreadHiding.makeButton(this.thread, 'hide'));
        }
        if (data = ThreadHiding.db.get({ boardID: this.board.ID, threadID: this.ID })) {
            ThreadHiding.hide(this.thread, data.makeStub, 'Hidden manually');
        }
    },
    onIndexRefresh: function () {
        return globals_1.g.BOARD.threads.forEach(function (thread) {
            var root = thread.nodes.root;
            if (thread.isHidden && thread.stub && !root.contains(thread.stub)) {
                ThreadHiding.makeStub(thread, root);
            }
        });
    },
    menu: {
        init: function () {
            if ((globals_1.g.VIEW !== 'index') || !globals_1.Conf['Menu'] || !globals_1.Conf['Thread Hiding Link']) {
                return;
            }
            var div = _1.default.el('div', {
                className: 'hide-thread-link',
                textContent: 'Hide'
            });
            var apply = _1.default.el('a', {
                textContent: 'Apply',
                href: 'javascript:;'
            });
            _1.default.on(apply, 'click', ThreadHiding.menu.hide);
            var makeStub = UI_1.default.checkbox('Stubs', 'Make stub');
            Menu_1.default.menu.addEntry({
                el: div,
                order: 20,
                open: function (_a) {
                    var thread = _a.thread, isReply = _a.isReply;
                    if (isReply || thread.isHidden || (globals_1.Conf['JSON Index'] && (globals_1.Conf['Index Mode'] === 'catalog'))) {
                        return false;
                    }
                    ThreadHiding.menu.thread = thread;
                    return true;
                },
                subEntries: [{ el: apply }, { el: makeStub }]
            });
            div = _1.default.el('a', {
                className: 'show-thread-link',
                textContent: 'Show',
                href: 'javascript:;'
            });
            _1.default.on(div, 'click', ThreadHiding.menu.show);
            Menu_1.default.menu.addEntry({
                el: div,
                order: 20,
                open: function (_a) {
                    var thread = _a.thread, isReply = _a.isReply;
                    if (isReply || !thread.isHidden || (globals_1.Conf['JSON Index'] && (globals_1.Conf['Index Mode'] === 'catalog'))) {
                        return false;
                    }
                    ThreadHiding.menu.thread = thread;
                    return true;
                }
            });
            var hideStubLink = _1.default.el('a', {
                textContent: 'Hide stub',
                href: 'javascript:;'
            });
            _1.default.on(hideStubLink, 'click', ThreadHiding.menu.hideStub);
            return Menu_1.default.menu.addEntry({
                el: hideStubLink,
                order: 15,
                open: function (_a) {
                    var thread = _a.thread, isReply = _a.isReply;
                    if (isReply || !thread.isHidden || (globals_1.Conf['JSON Index'] && (globals_1.Conf['Index Mode'] === 'catalog'))) {
                        return false;
                    }
                    return ThreadHiding.menu.thread = thread;
                }
            });
        },
        hide: function () {
            var makeStub = (0, _1.default)('input', this.parentNode).checked;
            var thread = ThreadHiding.menu.thread;
            ThreadHiding.hide(thread, makeStub, 'Hidden manually');
            ThreadHiding.saveHiddenState(thread, makeStub);
            return _1.default.event('CloseMenu');
        },
        show: function () {
            var thread = ThreadHiding.menu.thread;
            ThreadHiding.show(thread);
            ThreadHiding.saveHiddenState(thread);
            return _1.default.event('CloseMenu');
        },
        hideStub: function () {
            var thread = ThreadHiding.menu.thread;
            ThreadHiding.show(thread);
            ThreadHiding.hide(thread, false);
            ThreadHiding.saveHiddenState(thread, false);
            _1.default.event('CloseMenu');
        }
    },
    makeButton: function (thread, type) {
        var span = _1.default.el('span', {
            className: 'stub-icon',
        });
        var a = _1.default.el('a', {
            className: "".concat(type, "-post-button ").concat(type, "-thread-button"),
            href: 'javascript:;'
        });
        icon_1.default.set(span, type === 'hide' ? 'squareMinus' : 'squarePlus');
        _1.default.add(a, span);
        a.dataset.fullID = thread.fullID;
        _1.default.on(a, 'click', ThreadHiding.toggle);
        return a;
    },
    makeStub: function (thread, root, reason) {
        var _a;
        var summary, threadDivider;
        var numReplies = (0, __1.default)(globals_1.g.SITE.selectors.replyOriginal, root).length;
        if (summary = (0, _1.default)(globals_1.g.SITE.selectors.summary, root)) {
            numReplies += +summary.textContent.match(/\d+/);
        }
        var a = ThreadHiding.makeButton(thread, 'show');
        var _b = thread.OP.info, nameBlock = _b.nameBlock, subject = _b.subject;
        if (subject) {
            _1.default.add(a, _1.default.el('span', {
                className: 'stub-subject',
                textContent: subject
            }));
        }
        _1.default.add(a, _1.default.el('span', {
            className: 'stub-name',
            textContent: nameBlock
        }));
        _1.default.add(a, _1.default.el('span', {
            className: 'stub-replies',
            textContent: "(".concat(numReplies, " repl").concat(numReplies === 1 ? 'y' : 'ies', ")")
        }));
        var reasons = ((_a = thread.OP.filterResults) === null || _a === void 0 ? void 0 : _a.reasons) || [];
        if (reason)
            reasons = __spreadArray(__spreadArray([], reasons, true), [reason], false);
        if (globals_1.Conf['Filter Reason'] && reasons.length) {
            var reasonsSpan = _1.default.el('span', { className: 'stub-reasons' });
            _1.default.add(reasonsSpan, reasons.map(function (re) { return _1.default.el('span', { className: 'stub-reason', textContent: re }); }));
            a.appendChild(reasonsSpan);
        }
        thread.stub = _1.default.el('div', { className: 'stub' });
        if (globals_1.Conf['Menu']) {
            _1.default.add(thread.stub, [a, Menu_1.default.makeButton(thread.OP)]);
        }
        else {
            _1.default.add(thread.stub, a);
        }
        if (!globals_1.Conf['Filter Reason'] && reasons)
            thread.stub.title = reasons.join(' & ');
        _1.default.prepend(root, thread.stub);
        // Prevent hiding of thread divider on sites that put it inside the thread
        if (threadDivider = (0, _1.default)(globals_1.g.SITE.selectors.threadDivider, root)) {
            return _1.default.addClass(threadDivider, 'threadDivider');
        }
    },
    saveHiddenState: function (thread, makeStub) {
        if (thread.isHidden) {
            ThreadHiding.db.set({
                boardID: thread.board.ID,
                threadID: thread.ID,
                val: { makeStub: makeStub }
            });
        }
        else {
            ThreadHiding.db.delete({
                boardID: thread.board.ID,
                threadID: thread.ID
            });
        }
        return ThreadHiding.catalogSet(thread.board);
    },
    toggle: function (thread) {
        if (!(thread instanceof Thread_1.default)) {
            thread = globals_1.g.threads.get(this.dataset.fullID);
        }
        if (thread.isHidden) {
            ThreadHiding.show(thread);
        }
        else {
            ThreadHiding.hide(thread, undefined, 'Hidden manually');
        }
        return ThreadHiding.saveHiddenState(thread);
    },
    hide: function (thread, makeStub, reason) {
        if (makeStub === void 0) { makeStub = globals_1.Conf['Stubs']; }
        if (thread.isHidden) {
            return;
        }
        var threadRoot = thread.nodes.root;
        thread.isHidden = true;
        Index_1.default.updateHideLabel();
        if (thread.catalogView && !Index_1.default.showHiddenThreads) {
            _1.default.rm(thread.catalogView.nodes.root);
            _1.default.event('PostsRemoved', null, Index_1.default.root);
        }
        if (!makeStub) {
            return threadRoot.hidden = true;
        }
        ThreadHiding.makeStub(thread, threadRoot, reason);
    },
    show: function (thread) {
        if (thread.stub) {
            _1.default.rm(thread.stub);
            delete thread.stub;
        }
        var threadRoot = thread.nodes.root;
        threadRoot.hidden = (thread.isHidden = false);
        Index_1.default.updateHideLabel();
        if (thread.catalogView && globals_1.Conf['Index Mode'] === 'catalog') {
            var root = thread.catalogView.nodes.root;
            if (Index_1.default.showHiddenThreads) {
                _1.default.rm(root);
                _1.default.event('PostsRemoved', null, Index_1.default.root);
            }
            else {
                var i = Index_1.default.sortedThreadIDs.indexOf(thread.ID) - 1;
                while (true) {
                    if (i < 0) {
                        (0, _1.default)('.board').insertAdjacentElement('afterbegin', root);
                        break;
                    }
                    var rootPrevious = globals_1.d.getElementById("t".concat(Index_1.default.sortedThreadIDs[i]));
                    if (rootPrevious) {
                        rootPrevious.insertAdjacentElement('afterend', root);
                        break;
                    }
                    --i;
                }
                _1.default.event('PostsInserted', null, Index_1.default.root);
            }
        }
    }
};
exports.default = ThreadHiding;
