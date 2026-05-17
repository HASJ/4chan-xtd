"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Notice_1 = require("../classes/Notice");
var Config_1 = require("../config/Config");
var Filter_1 = require("../Filtering/Filter");
var ThreadHiding_1 = require("../Filtering/ThreadHiding");
var BoardConfig_1 = require("../General/BoardConfig");
var Get_1 = require("../General/Get");
var Header_1 = require("../General/Header");
var Index_1 = require("../General/Index");
var Settings_1 = require("../General/Settings");
var globals_1 = require("../globals/globals");
var FappeTyme_1 = require("../Images/FappeTyme");
var Gallery_1 = require("../Images/Gallery");
var ImageExpand_1 = require("../Images/ImageExpand");
var Embedding_1 = require("../Linkification/Embedding");
var ThreadUpdater_1 = require("../Monitoring/ThreadUpdater");
var ThreadWatcher_1 = require("../Monitoring/ThreadWatcher");
var UnreadIndex_1 = require("../Monitoring/UnreadIndex");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var QR_1 = require("../Posting/QR");
var QuoteThreading_1 = require("../Quotelinks/QuoteThreading");
var QuoteYou_1 = require("../Quotelinks/QuoteYou");
var CatalogLinks_1 = require("./CatalogLinks");
var ExpandThread_1 = require("./ExpandThread");
var Nav_1 = require("./Nav");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Keybinds = {
    init: function () {
        if (!globals_1.Conf['Keybinds']) {
            return;
        }
        for (var hotkey in Config_1.default.hotkeys) {
            _1.default.sync(hotkey, Keybinds.sync);
        }
        var init = function () {
            _1.default.off(globals_1.d, '4chanXInitFinished', init);
            _1.default.on(globals_1.d, 'keydown', Keybinds.keydown);
            for (var _i = 0, _a = (0, __1.default)('[accesskey]'); _i < _a.length; _i++) {
                var node = _a[_i];
                node.removeAttribute('accesskey');
            }
        };
        return _1.default.on(globals_1.d, '4chanXInitFinished', init);
    },
    sync: function (key, hotkey) {
        return globals_1.Conf[hotkey] = key;
    },
    keydown: function (e) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        var key, thread, threadRoot;
        var catalog, notifications;
        if (!(key = Keybinds.keyCode(e))) {
            return;
        }
        var target = e.target;
        if (['INPUT', 'TEXTAREA'].includes(target.nodeName)) {
            if (!/(Esc|Alt|Ctrl|Meta|Shift\+\w{2,})/.test(key) || !!/^Alt\+(\d|Up|Down|Left|Right)$/.test(key)) {
                return;
            }
        }
        if (['index', 'thread'].includes(globals_1.g.VIEW)) {
            threadRoot = Nav_1.default.getThread();
            thread = Get_1.default.threadFromRoot(threadRoot);
        }
        var hasAction = false;
        // QR & Options
        if (key === globals_1.Conf['Toggle board list'] && globals_1.Conf['Custom Board Navigation']) {
            Header_1.default.toggleBoardList();
            hasAction = true;
        }
        if (key === globals_1.Conf['Toggle header']) {
            Header_1.default.toggleBarVisibility();
            hasAction = true;
        }
        if (key === globals_1.Conf['Open empty QR'] && QR_1.default.postingIsEnabled) {
            Keybinds.qr();
            hasAction = true;
        }
        if (key === globals_1.Conf['Open QR'] && QR_1.default.postingIsEnabled && threadRoot) {
            Keybinds.qr(threadRoot);
            hasAction = true;
        }
        if (key === globals_1.Conf['Open settings']) {
            Settings_1.default.open();
            hasAction = true;
        }
        if (key === globals_1.Conf['Close']) {
            if (Settings_1.default.dialog) {
                Settings_1.default.close();
            }
            else if ((notifications = (0, __1.default)('.notification')).length) {
                for (var _i = 0, notifications_1 = notifications; _i < notifications_1.length; _i++) {
                    var notification = notifications_1[_i];
                    (0, _1.default)('.close', notification).click();
                }
            }
            else if ((_a = QR_1.default.nodes) === null || _a === void 0 ? void 0 : _a.preview) {
                QR_1.default.closePreview();
            }
            else if (QR_1.default.nodes && !(QR_1.default.nodes.el.hidden || (window.getComputedStyle(QR_1.default.nodes.form).display === 'none'))) {
                if (globals_1.Conf['Persistent QR']) {
                    QR_1.default.hide();
                }
                else {
                    QR_1.default.close();
                }
            }
            else if (Embedding_1.default.lastEmbed) {
                Embedding_1.default.closeFloat();
            }
            hasAction = true;
        }
        if (key === globals_1.Conf['Spoiler tags'] && target.nodeName === 'TEXTAREA') {
            Keybinds.tags('spoiler', target);
            hasAction = true;
        }
        if (key === globals_1.Conf['Code tags'] && target.nodeName === 'TEXTAREA') {
            Keybinds.tags('code', target);
            hasAction = true;
        }
        if (key === globals_1.Conf['Eqn tags'] && target.nodeName === 'TEXTAREA') {
            Keybinds.tags('eqn', target);
            hasAction = true;
        }
        if (key === globals_1.Conf['Math tags'] && target.nodeName === 'TEXTAREA') {
            Keybinds.tags('math', target);
            hasAction = true;
        }
        if (key === globals_1.Conf['SJIS tags'] && target.nodeName === 'TEXTAREA') {
            Keybinds.tags('sjis', target);
            hasAction = true;
        }
        if (key === globals_1.Conf['Toggle sage'] && QR_1.default.nodes && !QR_1.default.nodes.el.hidden) {
            Keybinds.sage();
            hasAction = true;
        }
        if (key === globals_1.Conf['Toggle Cooldown'] && QR_1.default.nodes && !QR_1.default.nodes.el.hidden
            && _1.default.hasClass(QR_1.default.nodes.fileSubmit, 'custom-cooldown')) {
            QR_1.default.toggleCustomCooldown();
            hasAction = true;
        }
        if (key === globals_1.Conf['Post from URL'] && QR_1.default.postingIsEnabled) {
            QR_1.default.handleUrl('');
            hasAction = true;
        }
        if (key === globals_1.Conf['Add new post'] && QR_1.default.postingIsEnabled) {
            QR_1.default.addPost();
            hasAction = true;
        }
        if (key === globals_1.Conf['Submit QR'] && QR_1.default.nodes && !QR_1.default.nodes.el.hidden && !QR_1.default.status()) {
            QR_1.default.submit();
            hasAction = true;
        }
        // Index/Thread related
        if (key === globals_1.Conf['Update']) {
            switch (globals_1.g.VIEW) {
                case 'thread':
                    if (ThreadUpdater_1.default.enabled)
                        ThreadUpdater_1.default.update();
                    hasAction = true;
                    break;
                case 'index':
                    if (Index_1.default.enabled)
                        Index_1.default.update();
                    hasAction = true;
            }
        }
        if (key === globals_1.Conf['Watch'] && ThreadWatcher_1.default.enabled && thread) {
            ThreadWatcher_1.default.toggle(thread);
            hasAction = true;
        }
        if (key === globals_1.Conf['Update thread watcher'] && ThreadWatcher_1.default.enabled) {
            ThreadWatcher_1.default.buttonFetchAll();
            hasAction = true;
        }
        if (key === globals_1.Conf['Toggle thread watcher'] && ThreadWatcher_1.default.enabled) {
            ThreadWatcher_1.default.toggleWatcher();
            hasAction = true;
        }
        if (key === globals_1.Conf['Toggle threading'] && QuoteThreading_1.default.ready) {
            QuoteThreading_1.default.toggleThreading();
            hasAction = true;
        }
        if (key === globals_1.Conf['Mark thread read'] && globals_1.g.VIEW === 'index' && thread && UnreadIndex_1.default.enabled) {
            UnreadIndex_1.default.markRead.call(threadRoot);
            hasAction = true;
        }
        // Images
        if (key === globals_1.Conf['Expand image'] && ImageExpand_1.default.enabled && threadRoot) {
            var post = Get_1.default.postFromNode(Keybinds.post(threadRoot));
            if (post.file) {
                ImageExpand_1.default.toggle(post);
                hasAction = true;
            }
        }
        if (key === globals_1.Conf['Expand images'] && ImageExpand_1.default.enabled) {
            ImageExpand_1.default.cb.toggleAll();
            hasAction = true;
        }
        if (key === globals_1.Conf['Open Gallery'] && Gallery_1.default.enabled) {
            Gallery_1.default.cb.toggle();
            hasAction = true;
        }
        if (key === globals_1.Conf['fappeTyme'] && ((_b = FappeTyme_1.default.nodes) === null || _b === void 0 ? void 0 : _b.fappe)) {
            FappeTyme_1.default.toggle('fappe');
            hasAction = true;
        }
        if (key === globals_1.Conf['werkTyme'] && ((_c = FappeTyme_1.default.nodes) === null || _c === void 0 ? void 0 : _c.werk)) {
            FappeTyme_1.default.toggle('werk');
            hasAction = true;
        }
        // Board Navigation
        if (key === globals_1.Conf['Front page']) {
            if (Index_1.default.enabled) {
                Index_1.default.userPageNav(1);
            }
            else {
                location.href = "/".concat(globals_1.g.BOARD, "/");
            }
            hasAction = true;
        }
        if (key === globals_1.Conf['Open front page']) {
            _1.default.open("".concat(location.origin, "/").concat(globals_1.g.BOARD, "/"));
            hasAction = true;
        }
        if (key === globals_1.Conf['Next page'] && globals_1.g.VIEW === 'index' && !((_e = (_d = globals_1.g.SITE).isOnePage) === null || _e === void 0 ? void 0 : _e.call(_d, globals_1.g.BOARD))) {
            if (Index_1.default.enabled) {
                if (!['paged', 'infinite'].includes(globals_1.Conf['Index Mode'])) {
                    return;
                }
                (0, _1.default)('.next button', Index_1.default.pagelist).click();
            }
            else {
                (_f = (0, _1.default)(globals_1.g.SITE.selectors.nav.next)) === null || _f === void 0 ? void 0 : _f.click();
            }
            hasAction = true;
        }
        if (key === globals_1.Conf['Previous page'] && globals_1.g.VIEW === 'index' && !((_h = (_g = globals_1.g.SITE).isOnePage) === null || _h === void 0 ? void 0 : _h.call(_g, globals_1.g.BOARD))) {
            if (Index_1.default.enabled) {
                if (!['paged', 'infinite'].includes(globals_1.Conf['Index Mode'])) {
                    return;
                }
                (0, _1.default)('.prev button', Index_1.default.pagelist).click();
            }
            else {
                (_j = (0, _1.default)(globals_1.g.SITE.selectors.nav.prev)) === null || _j === void 0 ? void 0 : _j.click();
            }
            hasAction = true;
        }
        if (key === globals_1.Conf['Search form'] && globals_1.g.VIEW === 'index') {
            var searchInput = Index_1.default.enabled ?
                Index_1.default.searchInput
                : globals_1.g.SITE.selectors.searchBox ?
                    (0, _1.default)(globals_1.g.SITE.selectors.searchBox)
                    :
                        undefined;
            if (searchInput) {
                Header_1.default.scrollToIfNeeded(searchInput);
                searchInput.focus();
                hasAction = true;
            }
        }
        if (key === globals_1.Conf['Paged mode'] && Index_1.default.enabledOn(globals_1.g.BOARD)) {
            location.href = globals_1.g.VIEW === 'index' ? '#paged' : "/".concat(globals_1.g.BOARD, "/#paged");
        }
        if (key === globals_1.Conf['Infinite scrolling mode'] && Index_1.default.enabledOn(globals_1.g.BOARD)) {
            location.href = globals_1.g.VIEW === 'index' ? '#infinite' : "/".concat(globals_1.g.BOARD, "/#infinite");
        }
        if (key === globals_1.Conf['All pages mode'] && Index_1.default.enabledOn(globals_1.g.BOARD)) {
            location.href = globals_1.g.VIEW === 'index' ? '#all-pages' : "/".concat(globals_1.g.BOARD, "/#all-pages");
        }
        if (key === globals_1.Conf['Open catalog'] && (catalog = CatalogLinks_1.default.catalog())) {
            location.href = catalog;
        }
        if (key === globals_1.Conf['Cycle sort type'] && Index_1.default.enabled) {
            Index_1.default.cycleSortType();
            hasAction = true;
        }
        // Thread Navigation
        if (key === globals_1.Conf['Next thread'] && globals_1.g.VIEW === 'index' && threadRoot) {
            Nav_1.default.scroll(+1);
            hasAction = true;
        }
        if (key === globals_1.Conf['Previous thread'] && globals_1.g.VIEW === 'index' && threadRoot) {
            Nav_1.default.scroll(-1);
            hasAction = true;
        }
        if (key === globals_1.Conf['Expand thread'] && globals_1.g.VIEW === 'index' && threadRoot) {
            ExpandThread_1.default.toggle(thread);
            // Keep thread from moving off screen when contracted.
            Header_1.default.scrollTo(threadRoot);
            hasAction = true;
        }
        if (key === globals_1.Conf['Open thread'] && globals_1.g.VIEW === 'index' && threadRoot) {
            Keybinds.open(thread);
            hasAction = true;
        }
        if (key === globals_1.Conf['Open thread tab'] && globals_1.g.VIEW === 'index' && threadRoot) {
            Keybinds.open(thread, true);
            hasAction = true;
        }
        // Reply Navigation
        if (key === globals_1.Conf['Next reply'] && threadRoot) {
            Keybinds.hl(+1, threadRoot);
            hasAction = true;
        }
        if (key === globals_1.Conf['Previous reply'] && threadRoot) {
            Keybinds.hl(-1, threadRoot);
            hasAction = true;
        }
        if (key === globals_1.Conf['Deselect reply'] && threadRoot) {
            Keybinds.hl(0, threadRoot);
            hasAction = true;
        }
        if (key === globals_1.Conf['Hide'] && thread && ThreadHiding_1.default.db) {
            Header_1.default.scrollTo(threadRoot);
            ThreadHiding_1.default.toggle(thread);
            hasAction = true;
        }
        if (key === globals_1.Conf['Quick Filter MD5'] && threadRoot) {
            post = Keybinds.post(threadRoot);
            Keybinds.hl(+1, threadRoot);
            Filter_1.default.quickFilterMD5.call(post, e);
            hasAction = true;
        }
        if (key === globals_1.Conf['Previous Post Quoting You'] && threadRoot && QuoteYou_1.default.db) {
            QuoteYou_1.default.cb.seek('preceding');
            hasAction = true;
        }
        if (key === globals_1.Conf['Next Post Quoting You'] && threadRoot && QuoteYou_1.default.db) {
            QuoteYou_1.default.cb.seek('following');
            hasAction = true;
        }
        if (hasAction) {
            e.preventDefault();
            e.stopPropagation();
        }
    },
    keyCode: function (e) {
        var key = (function () {
            var kc;
            switch ((kc = e.keyCode)) {
                case 8: // return
                    return '';
                case 13:
                    return 'Enter';
                case 27:
                    return 'Esc';
                case 32:
                    return 'Space';
                case 37:
                    return 'Left';
                case 38:
                    return 'Up';
                case 39:
                    return 'Right';
                case 40:
                    return 'Down';
                case 188:
                    return 'Comma';
                case 190:
                    return 'Period';
                case 191:
                    return 'Slash';
                case 59:
                case 186:
                    return 'Semicolon';
                default:
                    if ((48 <= kc && kc <= 57) || (65 <= kc && kc <= 90)) { // 0-9, A-Z
                        return String.fromCharCode(kc).toLowerCase();
                    }
                    else if (96 <= kc && kc <= 105) { // numpad 0-9
                        return String.fromCharCode(kc - 48);
                    }
                    else {
                        return null;
                    }
            }
        })();
        if (key) {
            if (e.altKey) {
                key = 'Alt+' + key;
            }
            if (e.ctrlKey) {
                key = 'Ctrl+' + key;
            }
            if (e.metaKey) {
                key = 'Meta+' + key;
            }
            if (e.shiftKey) {
                key = 'Shift+' + key;
            }
        }
        return key;
    },
    post: function (thread) {
        var s = globals_1.g.SITE.selectors;
        return ((0, _1.default)("".concat(s.postContainer).concat(s.highlightable.reply, ".").concat(globals_1.g.SITE.classes.highlight), thread) ||
            (0, _1.default)("".concat(globals_1.g.SITE.isOPContainerThread ? s.thread : s.postContainer).concat(s.highlightable.op), thread));
    },
    qr: function (thread) {
        QR_1.default.open();
        if (thread != null) {
            QR_1.default.quote.call(Keybinds.post(thread));
        }
        return QR_1.default.nodes.com.focus();
    },
    tags: function (tag, ta) {
        BoardConfig_1.default.ready(function () {
            var config = globals_1.g.BOARD.config;
            var supported = (function () {
                switch (tag) {
                    case 'spoiler': return !!config.spoilers;
                    case 'code': return !!config.code_tags;
                    case 'math':
                    case 'eqn': return !!config.math_tags;
                    case 'sjis': return !!config.sjis_tags;
                }
            })();
            if (!supported) {
                return new Notice_1.default('warning', "[".concat(tag, "] tags are not supported on /").concat(globals_1.g.BOARD, "/."), 20);
            }
        });
        var value = ta.value;
        var selStart = ta.selectionStart;
        var selEnd = ta.selectionEnd;
        ta.value =
            value.slice(0, selStart) +
                "[".concat(tag, "]") + value.slice(selStart, selEnd) + "[/".concat(tag, "]") +
                value.slice(selEnd);
        // Move the caret to the end of the selection.
        var range = ("[".concat(tag, "]")).length + selEnd;
        ta.setSelectionRange(range, range);
        // Fire the 'input' event
        return _1.default.event('input', null, ta);
    },
    sage: function () {
        var isSage = /sage/i.test(QR_1.default.nodes.email.value);
        return QR_1.default.nodes.email.value = isSage ?
            ""
            : "sage";
    },
    open: function (thread, tab) {
        if (globals_1.g.VIEW !== 'index') {
            return;
        }
        var url = Get_1.default.url('thread', thread);
        if (tab) {
            return _1.default.open(url);
        }
        else {
            return location.href = url;
        }
    },
    hl: function (delta, thread) {
        var replySelector = "".concat(globals_1.g.SITE.selectors.postContainer).concat(globals_1.g.SITE.selectors.highlightable.reply);
        var highlight = globals_1.g.SITE.classes.highlight;
        var postEl = (0, _1.default)("".concat(replySelector, ".").concat(highlight), thread);
        if (!delta) {
            if (postEl) {
                _1.default.rmClass(postEl, highlight);
            }
            return;
        }
        if (postEl) {
            var height = postEl.getBoundingClientRect().height;
            if ((Header_1.default.getTopOf(postEl) >= -height) && (Header_1.default.getBottomOf(postEl) >= -height)) { // We're at least partially visible
                var next = void 0;
                var root = Get_1.default.postFromNode(postEl).nodes.root;
                var axis = delta === +1 ?
                    'following'
                    :
                        'preceding';
                if (!(next = _1.default.x("".concat(axis, "-sibling::").concat(globals_1.g.SITE.xpath.replyContainer, "[not(@hidden) and not(child::div[@class='stub'])][1]"), root))) {
                    return;
                }
                if (!next.matches(replySelector)) {
                    next = (0, _1.default)(replySelector, next);
                }
                Header_1.default.scrollToIfNeeded(next, delta === +1);
                _1.default.addClass(next, highlight);
                _1.default.rmClass(postEl, highlight);
                return;
            }
            _1.default.rmClass(postEl, highlight);
        }
        var replies = (0, __1.default)(replySelector, thread);
        if (delta === -1) {
            replies.reverse();
        }
        for (var _i = 0, replies_1 = replies; _i < replies_1.length; _i++) {
            var reply = replies_1[_i];
            if (((delta === +1) && (Header_1.default.getTopOf(reply) > 0)) || ((delta === -1) && (Header_1.default.getBottomOf(reply) > 0))) {
                _1.default.addClass(reply, highlight);
                return;
            }
        }
    }
};
exports.default = Keybinds;
