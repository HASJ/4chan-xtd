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
var Redirect_1 = require("../Archive/Redirect");
var Notice_1 = require("../classes/Notice");
var globals_1 = require("../globals/globals");
var CatalogLinks_1 = require("../Miscellaneous/CatalogLinks");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var BoardConfig_1 = require("./BoardConfig");
var Get_1 = require("./Get");
var Settings_1 = require("./Settings");
var UI_1 = require("./UI");
var package_json_1 = require("../../package.json");
var icon_1 = require("../Icons/icon");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Header = {
    init: function () {
        var _this = this;
        _1.default.onExists(globals_1.doc, 'body', function () {
            if (!(globals_1.g.SITE.isThisPageLegit ? globals_1.g.SITE.isThisPageLegit() : !!_1.default.id('postForm'))) {
                return;
            }
            _1.default.add(_this.bar, [_this.noticesRoot, _this.toggle]);
            _1.default.prepend(globals_1.d.body, _this.bar);
            _1.default.add(globals_1.d.body, Header.hover);
            return _this.setBarPosition(globals_1.Conf['Bottom Header']);
        });
        this.menu = new UI_1.default.Menu('header');
        var menuButton = _1.default.el('span', { className: 'menu-button' });
        icon_1.default.set(menuButton, 'caretDown', 'Menu');
        var box = UI_1.default.checkbox;
        var barFixedToggler = box('Fixed Header', 'Fixed Header');
        var headerToggler = box('Header auto-hide', 'Auto-hide header');
        var scrollHeaderToggler = box('Header auto-hide on scroll', 'Auto-hide header on scroll');
        var barPositionToggler = box('Bottom Header', 'Bottom header');
        var linkJustifyToggler = box('Centered links', 'Centered links');
        var customNavToggler = box('Custom Board Navigation', 'Custom board navigation');
        var footerToggler = box('Bottom Board List', 'Hide bottom board list');
        var shortcutToggler = box('Shortcut Icons', 'Shortcut Icons');
        var editCustomNav = _1.default.el('a', {
            textContent: 'Edit custom board navigation',
            href: 'javascript:;'
        });
        this.barFixedToggler = barFixedToggler.firstElementChild;
        this.scrollHeaderToggler = scrollHeaderToggler.firstElementChild;
        this.barPositionToggler = barPositionToggler.firstElementChild;
        this.linkJustifyToggler = linkJustifyToggler.firstElementChild;
        this.headerToggler = headerToggler.firstElementChild;
        this.footerToggler = footerToggler.firstElementChild;
        this.shortcutToggler = shortcutToggler.firstElementChild;
        this.customNavToggler = customNavToggler.firstElementChild;
        _1.default.on(menuButton, 'click', this.menuToggle);
        _1.default.on(this.headerToggler, 'change', this.toggleBarVisibility);
        _1.default.on(this.barFixedToggler, 'change', this.toggleBarFixed);
        _1.default.on(this.barPositionToggler, 'change', this.toggleBarPosition);
        _1.default.on(this.scrollHeaderToggler, 'change', this.toggleHideBarOnScroll);
        _1.default.on(this.linkJustifyToggler, 'change', this.toggleLinkJustify);
        _1.default.on(this.footerToggler, 'change', this.toggleFooterVisibility);
        _1.default.on(this.shortcutToggler, 'change', this.toggleShortcutIcons);
        _1.default.on(this.customNavToggler, 'change', this.toggleCustomNav);
        _1.default.on(editCustomNav, 'click', this.editCustomNav);
        this.setBarFixed(globals_1.Conf['Fixed Header']);
        this.setHideBarOnScroll(globals_1.Conf['Header auto-hide on scroll']);
        this.setBarVisibility(globals_1.Conf['Header auto-hide']);
        this.setLinkJustify(globals_1.Conf['Centered links']);
        this.setShortcutIcons(globals_1.Conf['Shortcut Icons']);
        this.setFooterVisibility(globals_1.Conf['Bottom Board List']);
        _1.default.sync('Fixed Header', this.setBarFixed);
        _1.default.sync('Header auto-hide on scroll', this.setHideBarOnScroll);
        _1.default.sync('Bottom Header', this.setBarPosition);
        _1.default.sync('Shortcut Icons', this.setShortcutIcons);
        _1.default.sync('Header auto-hide', this.setBarVisibility);
        _1.default.sync('Centered links', this.setLinkJustify);
        _1.default.sync('Bottom Board List', this.setFooterVisibility);
        this.addShortcut('menu', menuButton, 900);
        this.menu.addEntry({
            el: _1.default.el('span', { textContent: 'Header' }),
            order: 107,
            subEntries: [
                { el: barFixedToggler },
                { el: headerToggler },
                { el: scrollHeaderToggler },
                { el: barPositionToggler },
                { el: linkJustifyToggler },
                { el: footerToggler },
                { el: shortcutToggler },
                { el: customNavToggler },
                { el: editCustomNav }
            ]
        });
        _1.default.on(globals_1.d, 'CreateNotification', this.createNotification);
        this.setBoardList();
        _1.default.onExists(globals_1.doc, "".concat(globals_1.g.SITE.selectors.boardList, " + *"), Header.generateFullBoardList);
        _1.default.ready(function () {
            var isPageLegit = globals_1.g.SITE.isThisPageLegit ? globals_1.g.SITE.isThisPageLegit() : !/^[45]\d\d\b/.test(document.title) && !/\.(?:json|rss)$/.test(location.pathname);
            if (!isPageLegit) {
                return;
            }
            var footer;
            if ((globals_1.g.SITE.software === 'yotsuba') && !(footer = _1.default.id('boardNavDesktopFoot'))) {
                var absbot = void 0;
                if (!(absbot = _1.default.id('absbot'))) {
                    return;
                }
                footer = _1.default.id('boardNavDesktop').cloneNode(true);
                footer.id = 'boardNavDesktopFoot';
                (0, _1.default)('#navtopright', footer).id = 'navbotright';
                (0, _1.default)('#settingsWindowLink', footer).id = 'settingsWindowLinkBot';
                _1.default.before(absbot, footer);
                _1.default.global('stubCloneTopNav');
            }
            if (Header.bottomBoardList = (0, _1.default)(globals_1.g.SITE.selectors.boardListBottom)) {
                for (var _i = 0, _a = (0, __1.default)('a', Header.bottomBoardList); _i < _a.length; _i++) {
                    var a = _a[_i];
                    if ((a.hostname === location.hostname) && (a.pathname.split('/')[1] === globals_1.g.BOARD.ID)) {
                        a.className = 'current';
                    }
                }
                return CatalogLinks_1.default.setLinks(Header.bottomBoardList);
            }
        });
        if ((globals_1.g.SITE.software === 'yotsuba') && ((globals_1.g.VIEW === 'catalog') || !globals_1.Conf['Disable Native Extension'])) {
            var cs = _1.default.el('a', { href: 'javascript:;' });
            if (globals_1.g.VIEW === 'catalog') {
                cs.title = (cs.textContent = 'Catalog Settings');
                icon_1.default.set(cs, 'bookOpen', 'Catalog Settings');
                this.addShortcut('native', cs, 810);
            }
            else {
                cs.title = (cs.textContent = '4chan Settings');
                cs.className = 'native-settings';
                this.addShortcut('native', cs, 810);
            }
            _1.default.on(cs, 'click', function () { return _1.default.id('settingsWindowLink').click(); });
        }
        return this.enableDesktopNotifications();
    },
    bar: _1.default.el('div', { id: 'header-bar' }),
    bottomBoardList: undefined,
    boardList: undefined,
    noticesRoot: _1.default.el('div', { id: 'notifications' }),
    shortcuts: _1.default.el('span', { id: 'shortcuts' }),
    hover: _1.default.el('div', { id: 'hoverUI' }),
    toggle: _1.default.el('div', { id: 'scroll-marker' }),
    setBoardList: function () {
        var boardList;
        Header.boardList = (boardList = _1.default.el('span', { id: 'board-list' }));
        _1.default.extend(boardList, { innerHTML: "<span id=\"custom-board-list\"></span><span id=\"full-board-list\" hidden><span class=\"hide-board-list-container brackets-wrap\"><a href=\"javascript:;\" class=\"hide-board-list-button\">&nbsp;-&nbsp;</a></span> <span class=\"boardList\"></span></span>" });
        var btn = (0, _1.default)('.hide-board-list-button', boardList);
        _1.default.on(btn, 'click', Header.toggleBoardList);
        _1.default.prepend(Header.bar, [Header.boardList, Header.shortcuts]);
        Header.setCustomNav(globals_1.Conf['Custom Board Navigation']);
        Header.generateBoardList(globals_1.Conf['boardnav']);
        _1.default.sync('Custom Board Navigation', Header.setCustomNav);
        return _1.default.sync('boardnav', Header.generateBoardList);
    },
    generateFullBoardList: function () {
        var nodes;
        if (globals_1.g.SITE.transformBoardList) {
            nodes = globals_1.g.SITE.transformBoardList();
        }
        else {
            nodes = __spreadArray([], (0, _1.default)(globals_1.g.SITE.selectors.boardList).cloneNode(true).childNodes, true);
        }
        var fullBoardList = (0, _1.default)('.boardList', Header.boardList);
        _1.default.add(fullBoardList, nodes);
        for (var _i = 0, _a = (0, __1.default)('a', fullBoardList); _i < _a.length; _i++) {
            var a = _a[_i];
            if ((a.hostname === location.hostname) && (a.pathname.split('/')[1] === globals_1.g.BOARD.ID)) {
                a.className = 'current';
            }
        }
        return CatalogLinks_1.default.setLinks(fullBoardList);
    },
    generateBoardList: function (boardnav) {
        var list = (0, _1.default)('#custom-board-list', Header.boardList);
        _1.default.rmAll(list);
        if (!boardnav)
            return;
        boardnav = boardnav.replace(/(\r\n|\n|\r)/g, ' ');
        var segments = boardnav.split(/(\{\{(?:"[^"]+")?|\}\})/);
        var spanStack = [];
        var currentContainer = list;
        segments.forEach(function (segment) {
            if (segment.startsWith('{{')) {
                var span = _1.default.el('span');
                _1.default.add(currentContainer, span);
                spanStack.push(span);
                currentContainer = span;
                if (segment.length > 2)
                    span.className = segment.slice(3, -1);
            }
            else if (segment === '}}') {
                spanStack.pop();
                currentContainer = spanStack.length > 0 ? spanStack[spanStack.length - 1] : list;
            }
            else {
                var re = /[\w@]+(-(all|title|replace|full|index|catalog|archive|expired|nt|(mode|sort|text):"[^"]+"(,"[^"]+")?))*|[^\w@]+/g;
                var segmentNodes = (segment.match(re) || []).map(function (t) { return Header.mapCustomNavigation(t); });
                segmentNodes.forEach(function (node) { return currentContainer.appendChild(node); });
            }
        });
        return CatalogLinks_1.default.setLinks(list);
    },
    mapCustomNavigation: function (t) {
        var a, href, m, url;
        if (/^[^\w@]/.test(t)) {
            return _1.default.tn(t);
        }
        var text = (url = null);
        t = t.replace(/-text:"([^"]+)"(?:,"([^"]+)")?/g, function (m0, m1, m2) {
            text = m1;
            url = m2;
            return '';
        });
        var indexOptions = [];
        t = t.replace(/-(?:mode|sort):"([^"]+)"/g, function (m0, m1) {
            indexOptions.push(m1.toLowerCase().replace(/\ /g, '-'));
            return '';
        });
        indexOptions = indexOptions.join('/');
        if (/^toggle-all/.test(t)) {
            a = _1.default.el('a', {
                className: 'show-board-list-button',
                textContent: text || '+',
                href: 'javascript:;'
            });
            _1.default.on(a, 'click', Header.toggleBoardList);
            return a;
        }
        if (/^external/.test(t)) {
            a = _1.default.el('a', {
                href: url || 'javascript:;',
                textContent: text || '+',
                className: 'external'
            });
            if (/-nt/.test(t)) {
                a.target = '_blank';
                a.rel = 'noopener';
            }
            return a;
        }
        var boardID = t.split('-')[0];
        if (boardID === 'current') {
            if (['boards.4chan.org', 'boards.4channel.org'].includes(location.hostname)) {
                boardID = globals_1.g.BOARD.ID;
            }
            else {
                a = _1.default.el('a', {
                    href: "/".concat(globals_1.g.BOARD.ID, "/"),
                    textContent: text || decodeURIComponent(globals_1.g.BOARD.ID),
                    className: 'current'
                });
                if (/-nt/.test(t)) {
                    a.target = '_blank';
                    a.rel = 'noopener';
                }
                if (/-index/.test(t)) {
                    a.dataset.only = 'index';
                }
                else if (/-catalog/.test(t)) {
                    a.dataset.only = 'catalog';
                    a.href += 'catalog.html';
                }
                else if (/-(archive|expired)/.test(t)) {
                    a = a.firstChild; // Its text node.
                }
                return a;
            }
        }
        a = (function () {
            var urlV;
            if (boardID === '@') {
                return _1.default.el('a', {
                    href: 'https://twitter.com/4chan',
                    title: '4chan Twitter',
                    className: 'navSmall',
                    textContent: '@'
                });
            }
            a = _1.default.el('a', {
                href: "//".concat(BoardConfig_1.default.domain(boardID), "/").concat(boardID, "/"),
                textContent: boardID,
                title: BoardConfig_1.default.title(boardID)
            });
            if (['catalog', 'archive'].includes(globals_1.g.VIEW) && (urlV = Get_1.default.url(globals_1.g.VIEW, { siteID: '4chan.org', boardID: boardID }))) {
                a.href = urlV;
            }
            if ((a.hostname === location.hostname) && (boardID === globals_1.g.BOARD.ID)) {
                a.className = 'current';
            }
            return a;
        })();
        a.textContent = /-title/.test(t) || (/-replace/.test(t) && (a.hostname === location.hostname) && (boardID === globals_1.g.BOARD.ID)) ?
            a.title || a.textContent
            : /-full/.test(t) ?
                ("/".concat(boardID, "/")) + (a.title ? " - ".concat(a.title) : '')
                :
                    text || boardID;
        if (m = t.match(/-(index|catalog)/)) {
            var urlIC = CatalogLinks_1.default[m[1]]({ siteID: '4chan.org', boardID: boardID });
            if (urlIC) {
                a.dataset.only = m[1];
                a.href = urlIC;
                if (m[1] === 'catalog') {
                    _1.default.addClass(a, 'catalog');
                }
            }
            else {
                return a.firstChild; // Its text node.
            }
        }
        if (globals_1.Conf['JSON Index'] && indexOptions) {
            a.dataset.indexOptions = indexOptions;
            if (['boards.4chan.org', 'boards.4channel.org'].includes(a.hostname) && (a.pathname.split('/')[2] === '')) {
                a.href += (a.hash ? '/' : '#') + indexOptions;
            }
        }
        if (/-archive/.test(t)) {
            if (href = Redirect_1.default.to('board', { boardID: boardID })) {
                a.href = href;
            }
            else {
                return a.firstChild; // Its text node.
            }
        }
        if (/-expired/.test(t)) {
            if (BoardConfig_1.default.isArchived(boardID)) {
                a.href = "//".concat(BoardConfig_1.default.domain(boardID), "/").concat(boardID, "/archive");
            }
            else {
                return a.firstChild; // Its text node.
            }
        }
        if (/-nt/.test(t)) {
            a.target = '_blank';
            a.rel = 'noopener';
        }
        return a;
    },
    toggleBoardList: function () {
        var bar = Header.bar;
        var custom = (0, _1.default)('#custom-board-list', bar);
        var full = (0, _1.default)('#full-board-list', bar);
        var showBoardList = !full.hidden;
        custom.hidden = !showBoardList;
        return full.hidden = showBoardList;
    },
    setLinkJustify: function (centered) {
        Header.linkJustifyToggler.checked = centered;
        if (centered) {
            return _1.default.addClass(globals_1.doc, 'centered-links');
        }
        else {
            return _1.default.rmClass(globals_1.doc, 'centered-links');
        }
    },
    toggleLinkJustify: function () {
        _1.default.event('CloseMenu', null);
        var centered = this.nodeName === 'INPUT' ?
            this.checked : undefined;
        Header.setLinkJustify(centered);
        return _1.default.set('Centered links', centered);
    },
    setBarFixed: function (fixed) {
        Header.barFixedToggler.checked = fixed;
        if (fixed) {
            _1.default.addClass(globals_1.doc, 'fixed');
            return _1.default.addClass(Header.bar, 'dialog');
        }
        else {
            _1.default.rmClass(globals_1.doc, 'fixed');
            return _1.default.rmClass(Header.bar, 'dialog');
        }
    },
    toggleBarFixed: function () {
        _1.default.event('CloseMenu', null);
        Header.setBarFixed(this.checked);
        globals_1.Conf['Fixed Header'] = this.checked;
        return _1.default.set('Fixed Header', this.checked);
    },
    setShortcutIcons: function (show) {
        Header.shortcutToggler.checked = show;
        if (show) {
            return _1.default.addClass(globals_1.doc, 'shortcut-icons');
        }
        else {
            return _1.default.rmClass(globals_1.doc, 'shortcut-icons');
        }
    },
    toggleShortcutIcons: function () {
        _1.default.event('CloseMenu', null);
        Header.setShortcutIcons(this.checked);
        globals_1.Conf['Shortcut Icons'] = this.checked;
        return _1.default.set('Shortcut Icons', this.checked);
    },
    setBarVisibility: function (hide) {
        Header.headerToggler.checked = hide;
        _1.default.event('CloseMenu', null);
        (hide ? _1.default.addClass : _1.default.rmClass)(Header.bar, 'autohide');
        return (hide ? _1.default.addClass : _1.default.rmClass)(globals_1.doc, 'autohide');
    },
    toggleBarVisibility: function () {
        var hide = this.nodeName === 'INPUT' ?
            this.checked
            :
                !_1.default.hasClass(Header.bar, 'autohide');
        globals_1.Conf['Header auto-hide'] = hide;
        _1.default.set('Header auto-hide', hide);
        Header.setBarVisibility(hide);
        var message = "The header bar will ".concat(hide ?
            'automatically hide itself.'
            :
                'remain visible.');
        return new Notice_1.default('info', message, 2);
    },
    setHideBarOnScroll: function (hide) {
        Header.scrollHeaderToggler.checked = hide;
        if (hide) {
            _1.default.on(window, 'scroll', Header.hideBarOnScroll);
            return;
        }
        _1.default.off(window, 'scroll', Header.hideBarOnScroll);
        _1.default.rmClass(Header.bar, 'scroll');
        return Header.bar.classList.toggle('autohide', globals_1.Conf['Header auto-hide']);
    },
    toggleHideBarOnScroll: function () {
        var hide = this.checked;
        _1.default.cb.checked.call(this);
        return Header.setHideBarOnScroll(hide);
    },
    hideBarOnScroll: function () {
        var offsetY = window.pageYOffset;
        if (offsetY > (Header.previousOffset || 0)) {
            _1.default.addClass(Header.bar, 'autohide', 'scroll');
        }
        else {
            _1.default.rmClass(Header.bar, 'autohide', 'scroll');
        }
        return Header.previousOffset = offsetY;
    },
    setBarPosition: function (bottom) {
        if (Header.barPositionToggler)
            Header.barPositionToggler.checked = bottom;
        _1.default.event('CloseMenu', null);
        var args = bottom ? [
            'bottom-header',
            'top-header',
            'after'
        ] : [
            'top-header',
            'bottom-header',
            'add'
        ];
        _1.default.addClass(globals_1.doc, args[0]);
        _1.default.rmClass(globals_1.doc, args[1]);
        return _1.default[args[2]](Header.bar, Header.noticesRoot);
    },
    toggleBarPosition: function () {
        _1.default.cb.checked.call(this);
        return Header.setBarPosition(this.checked);
    },
    setFooterVisibility: function (hide) {
        Header.footerToggler.checked = hide;
        return globals_1.doc.classList.toggle('hide-bottom-board-list', hide);
    },
    toggleFooterVisibility: function () {
        _1.default.event('CloseMenu', null);
        var hide = this.nodeName === 'INPUT' ?
            this.checked
            :
                _1.default.hasClass(globals_1.doc, 'hide-bottom-board-list');
        Header.setFooterVisibility(hide);
        _1.default.set('Bottom Board List', hide);
        var message = hide ?
            'The bottom navigation will now be hidden.'
            :
                'The bottom navigation will remain visible.';
        return new Notice_1.default('info', message, 2);
    },
    setCustomNav: function (show) {
        var _a;
        Header.customNavToggler.checked = show;
        var cust = (0, _1.default)('#custom-board-list', Header.bar);
        var full = (0, _1.default)('#full-board-list', Header.bar);
        var btn = (0, _1.default)('.hide-board-list-container', full);
        return _a = show ? [false, true, false] : [true, false, true], cust.hidden = _a[0], full.hidden = _a[1], btn.hidden = _a[2], _a;
    },
    toggleCustomNav: function () {
        _1.default.cb.checked.call(this);
        return Header.setCustomNav(this.checked);
    },
    editCustomNav: function () {
        Settings_1.default.open('Advanced');
        var settings = _1.default.id('fourchanx-settings');
        return (0, _1.default)('[name=boardnav]', settings).focus();
    },
    scrollTo: function (root, down, needed) {
        if (down === void 0) { down = false; }
        if (needed === void 0) { needed = false; }
        var height, x;
        if (!root.offsetParent) {
            return;
        } // hidden or fixed
        if (down) {
            x = Header.getBottomOf(root);
            if (globals_1.Conf['Fixed Header'] && globals_1.Conf['Header auto-hide on scroll'] && globals_1.Conf['Bottom header']) {
                (height = Header.bar.getBoundingClientRect().height);
                if (x <= 0) {
                    if (!Header.isHidden()) {
                        x += height;
                    }
                }
                else {
                    if (Header.isHidden()) {
                        x -= height;
                    }
                }
            }
            if (!needed || (x < 0)) {
                return window.scrollBy(0, -x);
            }
        }
        else {
            x = Header.getTopOf(root);
            if (globals_1.Conf['Fixed Header'] && globals_1.Conf['Header auto-hide on scroll'] && !globals_1.Conf['Bottom header']) {
                (height = Header.bar.getBoundingClientRect().height);
                if (x >= 0) {
                    if (!Header.isHidden()) {
                        x += height;
                    }
                }
                else {
                    if (Header.isHidden()) {
                        x -= height;
                    }
                }
            }
            if (!needed || (x < 0)) {
                return window.scrollBy(0, x);
            }
        }
    },
    scrollToIfNeeded: function (root, down) {
        return Header.scrollTo(root, down, true);
    },
    getTopOf: function (root) {
        var top = root.getBoundingClientRect().top;
        if (globals_1.Conf['Fixed Header'] && !globals_1.Conf['Bottom Header']) {
            var headRect = Header.toggle.getBoundingClientRect();
            top -= headRect.top + headRect.height;
        }
        return top;
    },
    getBottomOf: function (root) {
        var clientHeight = globals_1.doc.clientHeight;
        var bottom = clientHeight - root.getBoundingClientRect().bottom;
        if (globals_1.Conf['Fixed Header'] && globals_1.Conf['Bottom Header']) {
            var headRect = Header.toggle.getBoundingClientRect();
            bottom -= (clientHeight - headRect.bottom) + headRect.height;
        }
        return bottom;
    },
    isNodeVisible: function (node) {
        if (globals_1.d.hidden || !globals_1.doc.contains(node)) {
            return false;
        }
        var height = node.getBoundingClientRect().height;
        return ((Header.getTopOf(node) + height) >= 0) && ((Header.getBottomOf(node) + height) >= 0);
    },
    isHidden: function () {
        var top = Header.bar.getBoundingClientRect().top;
        if (globals_1.Conf['Bottom header']) {
            return top === globals_1.doc.clientHeight;
        }
        else {
            return top < 0;
        }
    },
    addShortcut: function (id, el, index) {
        var shortcut = _1.default.el('span', {
            id: "shortcut-".concat(id),
            className: 'shortcut brackets-wrap'
        });
        _1.default.add(shortcut, el);
        shortcut.dataset.index = index.toString();
        for (var _i = 0, _a = (0, __1.default)('[data-index]', Header.shortcuts); _i < _a.length; _i++) {
            var item = _a[_i];
            if (+item.dataset.index > +index) {
                _1.default.before(item, shortcut);
                return;
            }
        }
        return _1.default.add(Header.shortcuts, shortcut);
    },
    rmShortcut: function (el) {
        return _1.default.rm(el.parentElement);
    },
    menuToggle: function (e) {
        return Header.menu.toggle(e, this, globals_1.g);
    },
    createNotification: function (e) {
        var notice;
        var _a = e.detail, type = _a.type, content = _a.content, lifetime = _a.lifetime;
        return notice = new Notice_1.default(type, content, lifetime);
    },
    areNotificationsEnabled: false,
    enableDesktopNotifications: function () {
        var notice;
        if (!window.Notification || !globals_1.Conf['Desktop Notifications']) {
            return;
        }
        switch (Notification.permission) {
            case 'granted':
                Header.areNotificationsEnabled = true;
                return;
                break;
            case 'denied':
                // requestPermission doesn't work if status is 'denied',
                // but it'll still work if status is 'default'.
                return;
                break;
        }
        var el = _1.default.el('span', { innerHTML: "".concat(package_json_1.default.name, " needs your permission to show desktop notifications. ") +
                "[<a href=\"".concat((0, globals_1.E)(package_json_1.default.upstreamFaq), "#why-is-4chan-x-asking-for-permission-to-show-desktop-notifications\" target=\"_blank\">FAQ</a>]") +
                "<br><button>Authorize</button> or <button>Disable</button>"
        });
        var _a = (0, __1.default)('button', el), authorize = _a[0], disable = _a[1];
        _1.default.on(authorize, 'click', function () { return Notification.requestPermission(function (status) {
            Header.areNotificationsEnabled = status === 'granted';
            if (status === 'default') {
                return;
            }
            return notice.close();
        }); });
        _1.default.on(disable, 'click', function () {
            _1.default.set('Desktop Notifications', false);
            return notice.close();
        });
        return notice = new Notice_1.default('info', el);
    }
};
exports.default = Header;
