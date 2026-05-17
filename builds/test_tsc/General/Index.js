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
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Callbacks_1 = require("../classes/Callbacks");
var CatalogThread_1 = require("../classes/CatalogThread");
var Notice_1 = require("../classes/Notice");
var Post_1 = require("../classes/Post");
var Thread_1 = require("../classes/Thread");
var Config_1 = require("../config/Config");
var Filter_1 = require("../Filtering/Filter");
var PostHiding_1 = require("../Filtering/PostHiding");
var ThreadHiding_1 = require("../Filtering/ThreadHiding");
var CatalogLinks_1 = require("../Miscellaneous/CatalogLinks");
var RelativeDates_1 = require("../Miscellaneous/RelativeDates");
var ThreadWatcher_1 = require("../Monitoring/ThreadWatcher");
var __1 = require("../platform/$$");
var _1 = require("../platform/$");
var QuotePreview_1 = require("../Quotelinks/QuotePreview");
var globals_1 = require("../globals/globals");
var Header_1 = require("./Header");
var UI_1 = require("./UI");
var Menu_1 = require("../Menu/Menu");
var NavLinks_html_1 = require("./Index/NavLinks.html");
var PageList_html_1 = require("./Index/PageList.html");
var BoardConfig_1 = require("./BoardConfig");
var Get_1 = require("./Get");
var helpers_1 = require("../platform/helpers");
var icon_1 = require("../Icons/icon");
var Index = {
    showHiddenThreads: false,
    changed: {},
    enabledOn: function (_a) {
        var siteID = _a.siteID, boardID = _a.boardID;
        return globals_1.Conf['JSON Index'] && (globals_1.g.sites[siteID].software === 'yotsuba') && (boardID !== 'f');
    },
    init: function () {
        var _a, _b, _c, _d, _e;
        var input, inputs, name;
        if (globals_1.g.VIEW !== 'index') {
            return;
        }
        // For IndexRefresh events
        _1.default.one(globals_1.d, '4chanXInitFinished', this.cb.initFinished);
        _1.default.on(globals_1.d, 'PostsInserted', this.cb.postsInserted);
        if (!this.enabledOn(globals_1.g.BOARD)) {
            return;
        }
        this.enabled = true;
        Callbacks_1.default.Post.push({
            name: 'Index Page Numbers',
            cb: this.node
        });
        Callbacks_1.default.CatalogThread.push({
            name: 'Catalog Features',
            cb: this.catalogNode
        });
        this.search = ((_a = history.state) === null || _a === void 0 ? void 0 : _a.searched) || '';
        if ((_b = history.state) === null || _b === void 0 ? void 0 : _b.mode) {
            globals_1.Conf['Index Mode'] = (_c = history.state) === null || _c === void 0 ? void 0 : _c.mode;
        }
        this.currentSort = (_d = history.state) === null || _d === void 0 ? void 0 : _d.sort;
        if (!this.currentSort) {
            this.currentSort = typeof globals_1.Conf['Index Sort'] === 'object' ? (globals_1.Conf['Index Sort'][globals_1.g.BOARD.ID] || 'bump') : (globals_1.Conf['Index Sort']);
        }
        this.currentPage = this.getCurrentPage();
        this.processHash();
        _1.default.addClass(globals_1.doc, 'index-loading', "".concat(globals_1.Conf['Index Mode'].replace(/\ /g, '-'), "-mode"));
        _1.default.on(window, 'popstate', this.cb.popstate);
        _1.default.on(globals_1.d, 'scroll', this.scroll);
        _1.default.on(globals_1.d, 'SortIndex', this.cb.resort);
        // Header refresh button
        this.button = _1.default.el('a', {
            title: 'Refresh',
            href: 'javascript:;',
        });
        icon_1.default.set(this.button, 'refresh', 'Refresh');
        _1.default.on(this.button, 'click', function () { return Index.update(); });
        Header_1.default.addShortcut('index-refresh', this.button, 590);
        // Header "Index Navigation" submenu
        var entries = [];
        this.inputs = (inputs = (0, helpers_1.dict)());
        for (name in Config_1.default.Index) {
            var arr = Config_1.default.Index[name];
            if (arr instanceof Array) {
                var label = UI_1.default.checkbox(name, "".concat(name[0]).concat(name.slice(1).toLowerCase()));
                label.title = arr[1];
                entries.push({ el: label });
                input = label.firstChild;
                _1.default.on(input, 'change', _1.default.cb.checked);
                inputs[name] = input;
            }
        }
        _1.default.on(inputs['Show Replies'], 'change', this.cb.replies);
        _1.default.on(inputs['Catalog Hover Expand'], 'change', this.cb.hover);
        _1.default.on(inputs['Pin Watched Threads'], 'change', this.cb.resort);
        _1.default.on(inputs['Anchor Hidden Threads'], 'change', this.cb.resort);
        var watchSettings = function (e) {
            if (input = _1.default.getOwn(inputs, e.target.name)) {
                input.checked = e.target.checked;
                return _1.default.event('change', null, input);
            }
        };
        _1.default.on(globals_1.d, 'OpenSettings', function () { return _1.default.on(_1.default.id('fourchanx-settings'), 'change', watchSettings); });
        var sortEntry = UI_1.default.checkbox('Per-Board Sort Type', 'Per-board sort type', (typeof globals_1.Conf['Index Sort'] === 'object'));
        sortEntry.title = 'Set the sorting order of each board independently.';
        _1.default.on(sortEntry.firstChild, 'change', this.cb.perBoardSort);
        entries.splice(3, 0, { el: sortEntry });
        Header_1.default.menu.addEntry({
            el: _1.default.el('span', { textContent: 'Index Navigation' }),
            order: 100,
            subEntries: entries
        });
        // Navigation links at top of index
        this.navLinks = _1.default.el('div', { className: 'navLinks json-index' });
        _1.default.extend(this.navLinks, { innerHTML: NavLinks_html_1.default });
        (0, _1.default)('.cataloglink a', this.navLinks).href = CatalogLinks_1.default.catalog();
        if (!BoardConfig_1.default.isArchived(globals_1.g.BOARD.ID)) {
            (0, _1.default)('.archlistlink', this.navLinks).hidden = true;
        }
        _1.default.on((0, _1.default)('#index-last-refresh a', this.navLinks), 'click', this.cb.refreshFront);
        // Search field
        this.searchInput = (0, _1.default)('#index-search', this.navLinks);
        this.setupSearch();
        _1.default.on(this.searchInput, 'input', this.onSearchInput);
        _1.default.on((0, _1.default)('#index-search-clear', this.navLinks), 'click', this.clearSearch);
        icon_1.default.set((0, _1.default)('#index-search-clear', this.navLinks), 'xmark');
        // Hidden threads toggle
        this.hideLabel = (0, _1.default)('#hidden-label', this.navLinks);
        _1.default.on((0, _1.default)('#hidden-toggle a', this.navLinks), 'click', this.cb.toggleHiddenThreads);
        // Drop-down menus and reverse sort toggle
        this.selectRev = (0, _1.default)('#index-rev', this.navLinks);
        this.selectMode = (0, _1.default)('#index-mode', this.navLinks);
        this.selectSort = (0, _1.default)('#index-sort', this.navLinks);
        this.selectSize = (0, _1.default)('#index-size', this.navLinks);
        _1.default.on(this.selectRev, 'change', this.cb.sort);
        _1.default.on(this.selectMode, 'change', this.cb.mode);
        _1.default.on(this.selectSort, 'change', this.cb.sort);
        _1.default.on(this.selectSize, 'change', _1.default.cb.value);
        _1.default.on(this.selectSize, 'change', this.cb.size);
        for (var _i = 0, _f = [this.selectMode, this.selectSize]; _i < _f.length; _i++) {
            var select = _f[_i];
            select.value = globals_1.Conf[select.name];
        }
        this.selectRev.checked = /-rev$/.test(Index.currentSort);
        this.selectSort.value = Index.currentSort.replace(/-rev$/, '');
        // Last Long Reply options
        this.lastLongOptions = (0, _1.default)('#lastlong-options', this.navLinks);
        this.lastLongInputs = (0, __1.default)('input', this.lastLongOptions);
        this.lastLongThresholds = [0, 0];
        this.lastLongOptions.hidden = (this.selectSort.value !== 'lastlong');
        for (var i = 0; i < this.lastLongInputs.length; i++) {
            input = this.lastLongInputs[i];
            _1.default.on(input, 'change', this.cb.lastLongThresholds);
            var tRaw = globals_1.Conf["Last Long Reply Thresholds ".concat(i)];
            input.value = (this.lastLongThresholds[i] =
                typeof tRaw === 'object' ? ((_e = tRaw[globals_1.g.BOARD.ID]) !== null && _e !== void 0 ? _e : 100) : tRaw);
        }
        // Thread container
        this.root = _1.default.el('div', { className: 'board json-index' });
        _1.default.on(this.root, 'click', this.cb.hoverToggle);
        this.cb.size();
        this.cb.hover();
        // Page list
        this.pagelist = _1.default.el('div', { className: 'pagelist json-index' });
        _1.default.extend(this.pagelist, { innerHTML: PageList_html_1.default });
        (0, _1.default)('.cataloglink a', this.pagelist).href = CatalogLinks_1.default.catalog();
        _1.default.on(this.pagelist, 'click', this.cb.pageNav);
        this.update(true);
        _1.default.onExists(globals_1.doc, 'title + *', function () { return globals_1.d.title = globals_1.d.title.replace(/\ -\ Page\ \d+/, ''); });
        _1.default.onExists(globals_1.doc, '.board > .thread > .postContainer, .board + *', function () {
            var el;
            globals_1.g.SITE.Build.hat = (0, _1.default)('.board > .thread > img:first-child');
            if (globals_1.g.SITE.Build.hat) {
                globals_1.g.BOARD.threads.forEach(function (thread) {
                    if (thread.nodes.root) {
                        return _1.default.prepend(thread.nodes.root, globals_1.g.SITE.Build.hat.cloneNode(false));
                    }
                });
                _1.default.addClass(globals_1.doc, 'hats-enabled');
                _1.default.addStyle(".catalog-thread::after {background-image: url(".concat(globals_1.g.SITE.Build.hat.src, ");}"));
            }
            var board = (0, _1.default)('.board');
            _1.default.replace(board, Index.root);
            if (Index.loaded) {
                _1.default.event('PostsInserted', null, Index.root);
            }
            // Hacks:
            // - When removing an element from the document during page load,
            //   its ancestors will still be correctly created inside of it.
            // - Creating loadable elements inside of an origin-less document
            //   will not download them.
            // - Combine the two and you get a download canceller!
            //   Does not work on Firefox unfortunately. bugzil.la/939713
            try {
                globals_1.d.implementation.createDocument(null, null, null).appendChild(board);
            }
            catch (error) { }
            for (var _i = 0, _a = (0, __1.default)('.navLinks'); _i < _a.length; _i++) {
                el = _a[_i];
                _1.default.rm(el);
            }
            _1.default.rm(_1.default.id('ctrl-top'));
            var topNavPos = _1.default.id('delform').previousElementSibling;
            _1.default.before(topNavPos, _1.default.el('hr'));
            _1.default.before(topNavPos, Index.navLinks);
            var timeEl = (0, _1.default)('#index-last-refresh time', Index.navLinks);
            if (timeEl.dataset.utc) {
                return RelativeDates_1.default.update(timeEl);
            }
        });
        return _1.default.on(globals_1.d, '4chanXInitFinished', function () {
            var pagelist;
            if (pagelist = (0, _1.default)('.pagelist')) {
                _1.default.replace(pagelist, Index.pagelist);
            }
            return _1.default.rmClass(globals_1.doc, 'index-loading');
        });
    },
    scroll: function () {
        if (Index.req || !Index.liveThreadData || (globals_1.Conf['Index Mode'] !== 'infinite') || (window.scrollY <= (globals_1.doc.scrollHeight - (300 + window.innerHeight)))) {
            return;
        }
        if (Index.pageNum == null) {
            Index.pageNum = Index.currentPage;
        } // Avoid having to pushState to keep track of the current page
        var pageNum = ++Index.pageNum;
        if (pageNum > Index.pagesNum) {
            return Index.endNotice();
        }
        var threadIDs = Index.threadsOnPage(pageNum);
        return Index.buildStructure(threadIDs);
    },
    endNotice: (function () {
        var notify = false;
        var reset = function () { return notify = false; };
        return function () {
            if (notify) {
                return;
            }
            notify = true;
            new Notice_1.default('info', "Last page reached.", 2);
            return setTimeout(reset, 3 * helpers_1.SECOND);
        };
    })(),
    menu: {
        init: function () {
            if ((globals_1.g.VIEW !== 'index') || !globals_1.Conf['Menu'] || !globals_1.Conf['Thread Hiding Link'] || !Index.enabledOn(globals_1.g.BOARD)) {
                return;
            }
            return Menu_1.default.menu.addEntry({
                el: _1.default.el('a', {
                    href: 'javascript:;',
                    className: 'has-shortcut-text'
                }, { innerHTML: "<span></span><span class=\"shortcut-text\">Shift+click</span>" }),
                order: 20,
                open: function (_a) {
                    var thread = _a.thread;
                    if (globals_1.Conf['Index Mode'] !== 'catalog') {
                        return false;
                    }
                    this.el.firstElementChild.textContent = thread.isHidden ?
                        'Unhide'
                        :
                            'Hide';
                    if (this.cb) {
                        _1.default.off(this.el, 'click', this.cb);
                    }
                    this.cb = function () {
                        _1.default.event('CloseMenu');
                        return Index.toggleHide(thread);
                    };
                    _1.default.on(this.el, 'click', this.cb);
                    return true;
                }
            });
        }
    },
    node: function () {
        if (this.isReply || this.isClone || (Index.threadPosition[this.ID] == null)) {
            return;
        }
        return this.thread.setPage(Math.floor(Index.threadPosition[this.ID] / Index.threadsNumPerPage) + 1);
    },
    catalogNode: function () {
        var _this = this;
        return _1.default.on(this.nodes.root, 'click', function (e) {
            if ((e.button !== 0) || !e.shiftKey)
                return;
            e.preventDefault();
            getSelection().removeAllRanges();
            if (globals_1.Conf['MD5 Quick Filter in the Catalog'] && e.target.classList.contains('catalog-thumb')) {
                Filter_1.default.quickFilterMD5.call(_this.thread.OP);
            }
            else {
                Index.toggleHide(_this.thread);
            }
        });
    },
    toggleHide: function (thread) {
        if (Index.showHiddenThreads) {
            ThreadHiding_1.default.show(thread);
            if (!ThreadHiding_1.default.db.get({ boardID: thread.board.ID, threadID: thread.ID })) {
                return;
            }
            // Don't save when un-hiding filtered threads.
        }
        else {
            ThreadHiding_1.default.hide(thread);
        }
        return ThreadHiding_1.default.saveHiddenState(thread);
    },
    cycleSortType: function () {
        var i;
        var types = Index.selectSort.options.filter(function (option) { return !option.disabled; });
        for (i = 0; i < types.length; i++) {
            var type = types[i];
            if (type.selected) {
                break;
            }
        }
        types[(i + 1) % types.length].selected = true;
        return _1.default.event('change', null, Index.selectSort);
    },
    cb: {
        initFinished: function () {
            Index.initFinishedFired = true;
            return _1.default.queueTask(function () { return Index.cb.postsInserted(); });
        },
        postsInserted: function () {
            if (!Index.initFinishedFired) {
                return;
            }
            var n = 0;
            globals_1.g.posts.forEach(function (post) {
                if (!post.isFetchedQuote && !post.indexRefreshSeen && globals_1.doc.contains(post.nodes.root)) {
                    post.indexRefreshSeen = true;
                    return n++;
                }
            });
            if (n) {
                return _1.default.event('IndexRefresh');
            }
        },
        toggleHiddenThreads: function () {
            (0, _1.default)('#hidden-toggle a', Index.navLinks).textContent = (Index.showHiddenThreads = !Index.showHiddenThreads) ?
                'Hide'
                :
                    'Show';
            Index.sort();
            return Index.buildIndex();
        },
        mode: function () {
            Index.pushState({ mode: this.value });
            return Index.pageLoad(false);
        },
        sort: function () {
            var value = Index.selectRev.checked ? Index.selectSort.value + "-rev" : Index.selectSort.value;
            Index.pushState({ sort: value });
            return Index.pageLoad(false);
        },
        resort: function (e) {
            var _a;
            Index.changed.order = true;
            if (!((_a = e === null || e === void 0 ? void 0 : e.detail) === null || _a === void 0 ? void 0 : _a.deferred)) {
                return Index.pageLoad(false);
            }
        },
        perBoardSort: function () {
            globals_1.Conf['Index Sort'] = this.checked ? (0, helpers_1.dict)() : '';
            Index.saveSort();
            for (var i = 0; i < 2; i++) {
                globals_1.Conf["Last Long Reply Thresholds ".concat(i)] = this.checked ? (0, helpers_1.dict)() : '';
                Index.saveLastLongThresholds(i);
            }
        },
        lastLongThresholds: function () {
            var i = __spreadArray([], this.parentNode.children, true).indexOf(this);
            var value = +this.value;
            if (!Number.isFinite(value)) {
                this.value = Index.lastLongThresholds[i];
                return;
            }
            Index.lastLongThresholds[i] = value;
            Index.saveLastLongThresholds(i);
            Index.changed.order = true;
            return Index.pageLoad(false);
        },
        size: function (e) {
            if (globals_1.Conf['Index Mode'] !== 'catalog') {
                _1.default.rmClass(Index.root, 'catalog-small');
                _1.default.rmClass(Index.root, 'catalog-large');
            }
            else if (globals_1.Conf['Index Size'] === 'small') {
                _1.default.addClass(Index.root, 'catalog-small');
                _1.default.rmClass(Index.root, 'catalog-large');
            }
            else {
                _1.default.addClass(Index.root, 'catalog-large');
                _1.default.rmClass(Index.root, 'catalog-small');
            }
            if (e) {
                return Index.buildIndex();
            }
        },
        replies: function () {
            return Index.buildIndex();
        },
        hover: function () {
            return globals_1.doc.classList.toggle('catalog-hover-expand', globals_1.Conf['Catalog Hover Expand']);
        },
        hoverToggle: function (e) {
            if (globals_1.Conf['Catalog Hover Toggle'] && _1.default.hasClass(globals_1.doc, 'catalog-mode') && !_1.default.modifiedClick(e) && !_1.default.x('ancestor-or-self::a', e.target)) {
                var thread = void 0;
                var input = Index.inputs['Catalog Hover Expand'];
                input.checked = !input.checked;
                _1.default.event('change', null, input);
                if (thread = Get_1.default.threadFromNode(e.target)) {
                    Index.cb.catalogReplies.call(thread);
                    return Index.cb.hoverAdjust.call(thread.OP.nodes);
                }
            }
        },
        popstate: function (e) {
            if (e === null || e === void 0 ? void 0 : e.state) {
                var _a = e.state, searched = _a.searched, mode = _a.mode, sort = _a.sort;
                var page = Index.getCurrentPage();
                Index.setState({ search: searched, mode: mode, sort: sort, page: page });
                return Index.pageLoad(false);
            }
            else {
                // page load or hash change
                var nCommands = Index.processHash();
                if (globals_1.Conf['Refreshed Navigation'] && nCommands) {
                    return Index.update();
                }
                else {
                    return Index.pageLoad();
                }
            }
        },
        pageNav: function (e) {
            var a;
            if (_1.default.modifiedClick(e)) {
                return;
            }
            switch (e.target.nodeName) {
                case 'BUTTON':
                    e.target.blur();
                    a = e.target.parentNode;
                    break;
                case 'A':
                    a = e.target;
                    break;
                default:
                    return;
            }
            if (a.textContent === 'Catalog') {
                return;
            }
            e.preventDefault();
            return Index.userPageNav(+a.pathname.split(/\/+/)[2] || 1);
        },
        refreshFront: function () {
            Index.pushState({ page: 1 });
            return Index.update();
        },
        catalogReplies: function () {
            if (globals_1.Conf['Show Replies'] && _1.default.hasClass(globals_1.doc, 'catalog-hover-expand') && !this.catalogView.nodes.replies) {
                return Index.buildCatalogReplies(this);
            }
        },
        hoverAdjust: function () {
            // Prevent hovered catalog threads from going offscreen.
            var x;
            if (!_1.default.hasClass(globals_1.doc, 'catalog-hover-expand')) {
                return;
            }
            var rect = this.post.getBoundingClientRect();
            if (x = _1.default.minmax(0, -rect.left, globals_1.doc.clientWidth - rect.right)) {
                var style_1 = this.post.style;
                style_1.left = "".concat(x, "px");
                style_1.right = "".concat(-x, "px");
                return _1.default.one(this.root, 'mouseleave', function () { return style_1.left = (style_1.right = null); });
            }
        }
    },
    scrollToIndex: function () {
        // Scroll to navlinks, or top of board if navlinks are hidden.
        return Header_1.default.scrollToIfNeeded((Index.navLinks.getBoundingClientRect().height ? Index.navLinks : Index.root));
    },
    getCurrentPage: function () {
        return +window.location.pathname.split(/\/+/)[2] || 1;
    },
    userPageNav: function (page) {
        Index.pushState({ page: page });
        if (globals_1.Conf['Refreshed Navigation']) {
            return Index.update();
        }
        else {
            return Index.pageLoad();
        }
    },
    hashCommands: {
        mode: {
            'paged': 'paged',
            'infinite-scrolling': 'infinite',
            'infinite': 'infinite',
            'all-threads': 'all pages',
            'all-pages': 'all pages',
            'catalog': 'catalog'
        },
        sort: {
            'bump-order': 'bump',
            'last-reply': 'lastreply',
            'last-long-reply': 'lastlong',
            'creation-date': 'birth',
            'reply-count': 'replycount',
            'file-count': 'filecount',
            'posts-per-minute': 'activity'
        }
    },
    processHash: function () {
        var _a;
        // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=483304
        var hash = ((_a = location.href.match(/#.*/)) === null || _a === void 0 ? void 0 : _a[0]) || '';
        var state = { replace: true };
        var commands = hash.slice(1).split('/');
        var leftover = [];
        for (var _i = 0, commands_1 = commands; _i < commands_1.length; _i++) {
            var command = commands_1[_i];
            var mode, sort;
            if (mode = _1.default.getOwn(Index.hashCommands.mode, command)) {
                state.mode = mode;
            }
            else if (command === 'index') {
                state.mode = globals_1.Conf['Previous Index Mode'];
                state.page = 1;
            }
            else if (sort = _1.default.getOwn(Index.hashCommands.sort, command.replace(/-rev$/, ''))) {
                state.sort = sort;
                if (/-rev$/.test(command)) {
                    state.sort += '-rev';
                }
            }
            else if (/^s=/.test(command)) {
                state.search = decodeURIComponent(command.slice(2)).replace(/\+/g, ' ').trim();
            }
            else {
                leftover.push(command);
            }
        }
        hash = leftover.join('/');
        if (hash) {
            state.hash = "#".concat(hash);
        }
        Index.pushState(state);
        return commands.length - leftover.length;
    },
    pushState: function (state) {
        var _a;
        var search = state.search, hash = state.hash, replace = state.replace;
        var pageBeforeSearch = (_a = history.state) === null || _a === void 0 ? void 0 : _a.oldpage;
        if ((search != null) && (search !== Index.search)) {
            state.page = search ? 1 : (pageBeforeSearch || 1);
            if (!search) {
                pageBeforeSearch = undefined;
            }
            else if (!Index.search) {
                pageBeforeSearch = Index.currentPage;
            }
        }
        Index.setState(state);
        var pathname = Index.currentPage === 1 ? "/".concat(globals_1.g.BOARD, "/") : "/".concat(globals_1.g.BOARD, "/").concat(Index.currentPage);
        if (!hash) {
            hash = '';
        }
        return history[replace ? 'replaceState' : 'pushState']({
            mode: globals_1.Conf['Index Mode'],
            sort: Index.currentSort,
            searched: Index.search,
            oldpage: pageBeforeSearch
        }, '', "".concat(location.protocol, "//").concat(location.host).concat(pathname).concat(hash));
    },
    setState: function (_a) {
        var search = _a.search, mode = _a.mode, sort = _a.sort, page = _a.page, hash = _a.hash;
        if ((search != null) && (search !== Index.search)) {
            Index.changed.search = true;
            Index.search = search;
        }
        if ((mode != null) && (mode !== globals_1.Conf['Index Mode'])) {
            Index.changed.mode = true;
            globals_1.Conf['Index Mode'] = mode;
            _1.default.set('Index Mode', mode);
            if ((mode !== 'catalog') && (globals_1.Conf['Previous Index Mode'] !== mode)) {
                globals_1.Conf['Previous Index Mode'] = mode;
                _1.default.set('Previous Index Mode', mode);
            }
        }
        if ((sort != null) && (sort !== Index.currentSort)) {
            Index.changed.sort = true;
            Index.currentSort = sort;
            Index.saveSort();
        }
        if (['all pages', 'catalog'].includes(globals_1.Conf['Index Mode'])) {
            page = 1;
        }
        if ((page != null) && (page !== Index.currentPage)) {
            Index.changed.page = true;
            Index.currentPage = page;
        }
        if (hash != null) {
            return Index.changed.hash = true;
        }
    },
    savePerBoard: function (key, value) {
        if (typeof globals_1.Conf[key] === 'object') {
            globals_1.Conf[key][globals_1.g.BOARD.ID] = value;
        }
        else {
            globals_1.Conf[key] = value;
        }
        return _1.default.set(key, globals_1.Conf[key]);
    },
    saveSort: function () {
        return Index.savePerBoard('Index Sort', Index.currentSort);
    },
    saveLastLongThresholds: function (i) {
        return Index.savePerBoard("Last Long Reply Thresholds ".concat(i), Index.lastLongThresholds[i]);
    },
    pageLoad: function (scroll) {
        if (scroll === void 0) { scroll = true; }
        if (!Index.liveThreadData) {
            return;
        }
        var _a = Index.changed, threads = _a.threads, order = _a.order, search = _a.search, mode = _a.mode, sort = _a.sort, page = _a.page, hash = _a.hash;
        if (!threads) {
            threads = search;
        }
        if (!order) {
            order = sort;
        }
        if (threads || order) {
            Index.sort();
        }
        if (threads) {
            Index.buildPagelist();
        }
        if (search) {
            Index.setupSearch();
        }
        if (mode) {
            Index.setupMode();
        }
        if (sort) {
            Index.setupSort();
        }
        if (threads || mode || page || order) {
            Index.buildIndex();
        }
        if (threads || page) {
            Index.setPage();
        }
        if (scroll && !hash) {
            Index.scrollToIndex();
        }
        return Index.changed = {};
    },
    setupMode: function () {
        for (var _i = 0, _a = ['paged', 'infinite', 'all pages', 'catalog']; _i < _a.length; _i++) {
            var mode = _a[_i];
            _1.default[mode === globals_1.Conf['Index Mode'] ? 'addClass' : 'rmClass'](globals_1.doc, "".concat(mode.replace(/\ /g, '-'), "-mode"));
        }
        Index.selectMode.value = globals_1.Conf['Index Mode'];
        Index.cb.size();
        Index.showHiddenThreads = false;
        return (0, _1.default)('#hidden-toggle a', Index.navLinks).textContent = 'Show';
    },
    setupSort: function () {
        Index.selectRev.checked = /-rev$/.test(Index.currentSort);
        Index.selectSort.value = Index.currentSort.replace(/-rev$/, '');
        return Index.lastLongOptions.hidden = (Index.selectSort.value !== 'lastlong');
    },
    getPagesNum: function () {
        if (Index.search) {
            return Math.ceil(Index.sortedThreadIDs.length / Index.threadsNumPerPage);
        }
        else {
            return Index.pagesNum;
        }
    },
    getMaxPageNum: function () {
        return Math.max(1, Index.getPagesNum());
    },
    buildPagelist: function () {
        var pagesRoot = (0, _1.default)('.pages', Index.pagelist);
        var maxPageNum = Index.getMaxPageNum();
        if (pagesRoot.childElementCount !== maxPageNum) {
            var nodes = [];
            for (var i = 1, end = maxPageNum; i <= end; i++) {
                var a = _1.default.el('a', {
                    textContent: i,
                    href: i === 1 ? './' : i
                });
                nodes.push(_1.default.tn('['), a, _1.default.tn('] '));
            }
            _1.default.rmAll(pagesRoot);
            return _1.default.add(pagesRoot, nodes);
        }
    },
    setPage: function () {
        var a, strong;
        var pageNum = Index.currentPage;
        var maxPageNum = Index.getMaxPageNum();
        var pagesRoot = (0, _1.default)('.pages', Index.pagelist);
        // Previous/Next buttons
        var prev = pagesRoot.previousElementSibling.firstElementChild;
        var next = pagesRoot.nextElementSibling.firstElementChild;
        var href = Math.max(pageNum - 1, 1);
        prev.href = href === 1 ? './' : href;
        prev.firstElementChild.disabled = href === pageNum;
        href = Math.min(pageNum + 1, maxPageNum);
        next.href = href === 1 ? './' : href;
        next.firstElementChild.disabled = href === pageNum;
        // <strong> current page
        if (strong = (0, _1.default)('strong', pagesRoot)) {
            if (+strong.textContent === pageNum) {
                return;
            }
            _1.default.replace(strong, strong.firstChild);
        }
        else {
            strong = _1.default.el('strong');
        }
        if (a = pagesRoot.children[pageNum - 1]) {
            _1.default.before(a, strong);
            return _1.default.add(strong, a);
        }
    },
    updateHideLabel: function () {
        if (!Index.hideLabel) {
            return;
        }
        var hiddenCount = 0;
        for (var _i = 0, _a = Index.liveThreadIDs; _i < _a.length; _i++) {
            var threadID = _a[_i];
            if (Index.isHidden(threadID)) {
                hiddenCount++;
            }
        }
        if (!hiddenCount) {
            Index.hideLabel.hidden = true;
            if (Index.showHiddenThreads) {
                Index.cb.toggleHiddenThreads();
            }
            return;
        }
        Index.hideLabel.hidden = false;
        return (0, _1.default)('#hidden-count', Index.navLinks).textContent = hiddenCount === 1 ?
            '1 hidden thread'
            :
                "".concat(hiddenCount, " hidden threads");
    },
    update: function (firstTime) {
        var oldReq;
        if (oldReq = Index.req) {
            delete Index.req;
            oldReq.abort();
        }
        if (globals_1.Conf['Index Refresh Notifications']) {
            // Optional notification for manual refreshes
            if (!Index.notice) {
                Index.notice = new Notice_1.default('info', 'Refreshing index...');
            }
            if (!Index.nTimeout) {
                Index.nTimeout = setTimeout(function () {
                    if (Index.notice) {
                        Index.notice.el.lastElementChild.textContent += ' (disable JSON Index if this takes too long)';
                    }
                }, 3 * helpers_1.SECOND);
            }
        }
        else {
            // Also display notice if Index Refresh is taking too long
            if (!Index.nTimeout) {
                Index.nTimeout = setTimeout(function () { return Index.notice || (Index.notice = new Notice_1.default('info', 'Refreshing index... (disable JSON Index if this takes too long)')); }, 3 * helpers_1.SECOND);
            }
        }
        // Hard refresh in case of incomplete page load.
        if (!firstTime && (globals_1.d.readyState !== 'loading') && !(0, _1.default)('.board + *')) {
            location.reload();
            return;
        }
        Index.req = _1.default.whenModified(globals_1.g.SITE.urls.catalogJSON({ boardID: globals_1.g.BOARD.ID }), 'Index', Index.load);
        return _1.default.addClass(Index.button, 'spin');
    },
    load: function () {
        var err;
        if (this !== Index.req) {
            return;
        } // aborted
        _1.default.rmClass(Index.button, 'spin');
        var notice = Index.notice, nTimeout = Index.nTimeout;
        if (nTimeout) {
            clearTimeout(nTimeout);
        }
        delete Index.nTimeout;
        delete Index.req;
        delete Index.notice;
        if (![200, 304].includes(this.status)) {
            err = "Index refresh failed. ".concat(this.status ? "Error ".concat(this.statusText, " (").concat(this.status, ")") : 'Connection Error');
            if (notice) {
                notice.setType('warning');
                notice.el.lastElementChild.textContent = err;
                setTimeout(notice.close, helpers_1.SECOND);
            }
            else {
                new Notice_1.default('warning', err, 1);
            }
            return;
        }
        try {
            if (this.status === 200) {
                Index.parse(this.response);
            }
            else if (this.status === 304) {
                Index.pageLoad();
            }
        }
        catch (error) {
            err = error;
            globals_1.c.error("Index failure: ".concat(err.message), err.stack);
            if (notice) {
                notice.setType('error');
                notice.el.lastElementChild.textContent = 'Index refresh failed.';
                setTimeout(notice.close, helpers_1.SECOND);
            }
            else {
                new Notice_1.default('error', 'Index refresh failed.', 1);
            }
            return;
        }
        if (notice) {
            if (globals_1.Conf['Index Refresh Notifications']) {
                notice.setType('success');
                notice.el.lastElementChild.textContent = 'Index refreshed!';
                setTimeout(notice.close, helpers_1.SECOND);
            }
            else {
                notice.close();
            }
        }
        var timeEl = (0, _1.default)('#index-last-refresh time', Index.navLinks);
        timeEl.dataset.utc = Date.parse(this.getResponseHeader('Last-Modified'));
        return RelativeDates_1.default.update(timeEl);
    },
    parse: function (pages) {
        _1.default.cleanCache(function (url) { return /^https?:\/\/a\.4cdn\.org\//.test(url); });
        Index.parseThreadList(pages);
        Index.changed.threads = true;
        return Index.pageLoad();
    },
    parseThreadList: function (pages) {
        var _a;
        Index.pagesNum = pages.length;
        Index.threadsNumPerPage = ((_a = pages[0]) === null || _a === void 0 ? void 0 : _a.threads.length) || 1;
        Index.liveThreadData = pages.reduce((function (arr, next) { return arr.concat(next.threads); }), []);
        Index.liveThreadIDs = Index.liveThreadData.map(function (data) { return data.no; });
        Index.liveThreadDict = (0, helpers_1.dict)();
        Index.threadPosition = (0, helpers_1.dict)();
        Index.parsedThreads = (0, helpers_1.dict)();
        Index.replyData = (0, helpers_1.dict)();
        for (var i = 0; i < Index.liveThreadData.length; i++) {
            var obj, results;
            var data = Index.liveThreadData[i];
            Index.liveThreadDict[data.no] = data;
            Index.threadPosition[data.no] = i;
            Index.parsedThreads[data.no] = (obj = globals_1.g.SITE.Build.parseJSON(data, globals_1.g.BOARD));
            results = Filter_1.default.test(obj);
            obj.isOnTop = results.top;
            obj.isHidden = results.hide || ThreadHiding_1.default.isHidden(obj.boardID, obj.threadID);
            if (data.last_replies) {
                for (var _i = 0, _b = data.last_replies; _i < _b.length; _i++) {
                    var reply = _b[_i];
                    Index.replyData["".concat(globals_1.g.BOARD, ".").concat(reply.no)] = reply;
                }
            }
        }
        if (Index.liveThreadData[0]) {
            globals_1.g.SITE.Build.spoilerRange[globals_1.g.BOARD.ID] = Index.liveThreadData[0].custom_spoiler;
        }
        globals_1.g.BOARD.threads.forEach(function (thread) {
            if (!Index.liveThreadIDs.includes(thread.ID)) {
                return thread.collect();
            }
        });
        _1.default.event('IndexUpdate', { threads: ((Index.liveThreadIDs.map(function (ID) { return "".concat(globals_1.g.BOARD, ".").concat(ID); }))) });
    },
    isHidden: function (threadID) {
        var thread;
        if ((thread = globals_1.g.BOARD.threads.get(threadID)) && thread.OP && !thread.OP.isFetchedQuote) {
            return thread.isHidden;
        }
        else {
            return Index.parsedThreads[threadID].isHidden;
        }
    },
    isHiddenReply: function (threadID, replyData) {
        return PostHiding_1.default.isHidden(globals_1.g.BOARD.ID, threadID, replyData.no) || Filter_1.default.isHidden(globals_1.g.SITE.Build.parseJSON(replyData, globals_1.g.BOARD));
    },
    buildThreads: function (threadIDs, isCatalog, withReplies) {
        var _a;
        var errors;
        var threads = [];
        var newThreads = [];
        var newPosts = [];
        for (var _i = 0, threadIDs_1 = threadIDs; _i < threadIDs_1.length; _i++) {
            var ID = threadIDs_1[_i];
            var opRoot, thread;
            try {
                var OP;
                var threadData = Index.liveThreadDict[ID];
                if (thread = globals_1.g.BOARD.threads.get(ID)) {
                    var isStale = (thread.json !== threadData) && (JSON.stringify(thread.json) !== JSON.stringify(threadData));
                    if (isStale) {
                        thread.setCount('post', threadData.replies + 1, threadData.bumplimit);
                        thread.setCount('file', threadData.images + !!threadData.ext, threadData.imagelimit);
                        thread.setStatus('Sticky', !!threadData.sticky);
                        thread.setStatus('Closed', !!threadData.closed);
                    }
                    if (thread.catalogView) {
                        _1.default.rm(thread.catalogView.nodes.replies);
                        thread.catalogView.nodes.replies = null;
                    }
                }
                else {
                    thread = new Thread_1.default(ID, globals_1.g.BOARD);
                    newThreads.push(thread);
                }
                var lastPost = threadData.last_replies && threadData.last_replies.length ? threadData.last_replies[threadData.last_replies.length - 1].no : ID;
                if (lastPost > thread.lastPost) {
                    thread.lastPost = lastPost;
                }
                thread.json = threadData;
                threads.push(thread);
                if ((OP = thread.OP) && !OP.isFetchedQuote) {
                    OP.setCatalogOP(isCatalog);
                    thread.setPage(Math.floor(Index.threadPosition[ID] / Index.threadsNumPerPage) + 1);
                }
                else {
                    var obj = Index.parsedThreads[ID];
                    opRoot = globals_1.g.SITE.Build.post(obj);
                    OP = new Post_1.default(opRoot, thread, globals_1.g.BOARD);
                    OP.filterResults = obj.filterResults;
                    newPosts.push(OP);
                }
                if (!isCatalog || !thread.nodes.root) {
                    globals_1.g.SITE.Build.thread(thread, threadData, withReplies);
                }
            }
            catch (err) {
                // Skip posts that we failed to parse.
                if (!errors) {
                    errors = [];
                }
                errors.push({
                    message: "Parsing of Thread No.".concat(thread, " failed. Thread will be skipped."),
                    error: err,
                    html: opRoot === null || opRoot === void 0 ? void 0 : opRoot.outerHTML
                });
            }
        }
        if (errors) {
            (_a = Callbacks_1.default.errorHandler) === null || _a === void 0 ? void 0 : _a.call(Callbacks_1.default, errors);
        }
        if (withReplies) {
            newPosts = newPosts.concat(Index.buildReplies(threads));
        }
        for (var _b = 0, newThreads_1 = newThreads; _b < newThreads_1.length; _b++) {
            var thread_1 = newThreads_1[_b];
            Callbacks_1.default.Thread.execute(thread_1);
        }
        for (var _c = 0, newPosts_1 = newPosts; _c < newPosts_1.length; _c++) {
            var post = newPosts_1[_c];
            Callbacks_1.default.Post.execute(post);
        }
        Index.updateHideLabel();
        _1.default.event('IndexRefreshInternal', { threadIDs: (threads.map(function (t) { return t.fullID; })), isCatalog: isCatalog });
        return threads;
    },
    buildReplies: function (threads) {
        var _a;
        var errors;
        var posts = [];
        for (var _i = 0, threads_1 = threads; _i < threads_1.length; _i++) {
            var thread = threads_1[_i];
            var lastReplies;
            if (!(lastReplies = Index.liveThreadDict[thread.ID].last_replies)) {
                continue;
            }
            var nodes = [];
            for (var _b = 0, lastReplies_1 = lastReplies; _b < lastReplies_1.length; _b++) {
                var data = lastReplies_1[_b];
                var node, post;
                if ((post = thread.posts.get(data.no)) && !post.isFetchedQuote) {
                    nodes.push(post.nodes.root);
                    continue;
                }
                nodes.push(node = globals_1.g.SITE.Build.postFromObject(data, thread.board.ID));
                try {
                    posts.push(new Post_1.default(node, thread, thread.board));
                }
                catch (err) {
                    // Skip posts that we failed to parse.
                    if (!errors) {
                        errors = [];
                    }
                    errors.push({
                        message: "Parsing of Post No.".concat(data.no, " failed. Post will be skipped."),
                        error: err,
                        html: node === null || node === void 0 ? void 0 : node.outerHTML
                    });
                }
            }
            _1.default.add(thread.nodes.root, nodes);
        }
        if (errors) {
            (_a = Callbacks_1.default.errorHandler) === null || _a === void 0 ? void 0 : _a.call(Callbacks_1.default, errors);
        }
        return posts;
    },
    buildCatalogViews: function (threads) {
        var catalogThreads = [];
        for (var _i = 0, threads_2 = threads; _i < threads_2.length; _i++) {
            var thread = threads_2[_i];
            if (!thread.catalogView) {
                var ID = thread.ID;
                var page = Math.floor(Index.threadPosition[ID] / Index.threadsNumPerPage) + 1;
                var root = globals_1.g.SITE.Build.catalogThread(thread, Index.liveThreadDict[ID], page);
                catalogThreads.push(new CatalogThread_1.default(root, thread));
            }
        }
        for (var _a = 0, catalogThreads_1 = catalogThreads; _a < catalogThreads_1.length; _a++) {
            var catalogThread = catalogThreads_1[_a];
            Callbacks_1.default.CatalogThread.execute(catalogThread);
        }
    },
    sizeCatalogViews: function (threads) {
        // XXX When browsers support CSS3 attr(), use it instead.
        var size = globals_1.Conf['Index Size'] === 'small' ? 150 : 250;
        for (var _i = 0, threads_3 = threads; _i < threads_3.length; _i++) {
            var thread = threads_3[_i];
            var thumb = thread.catalogView.nodes.thumb;
            var _a = thumb.dataset, width = _a.width, height = _a.height;
            if (!width) {
                continue;
            }
            var ratio = size / Math.max(width, height);
            thumb.style.width = (width * ratio) + 'px';
            thumb.style.height = (height * ratio) + 'px';
        }
    },
    buildCatalogReplies: function (thread) {
        var lastReplies;
        var nodes = thread.catalogView.nodes;
        if (!(lastReplies = Index.liveThreadDict[thread.ID].last_replies)) {
            return;
        }
        var replies = [];
        for (var _i = 0, lastReplies_2 = lastReplies; _i < lastReplies_2.length; _i++) {
            var data = lastReplies_2[_i];
            if (Index.isHiddenReply(thread.ID, data)) {
                continue;
            }
            var reply = globals_1.g.SITE.Build.catalogReply(thread, data);
            RelativeDates_1.default.update((0, _1.default)('time', reply));
            _1.default.on((0, _1.default)('.catalog-reply-preview', reply), 'mouseover', QuotePreview_1.default.mouseover);
            replies.push(reply);
        }
        nodes.replies = _1.default.el('div', { className: 'catalog-replies' });
        _1.default.add(nodes.replies, replies);
        _1.default.add(thread.OP.nodes.post, nodes.replies);
    },
    sort: function () {
        var threadIDs;
        var liveThreadIDs = Index.liveThreadIDs, liveThreadData = Index.liveThreadData;
        if (!liveThreadData) {
            return;
        }
        var tmp_time = new Date().getTime() / 1000;
        var sortType = Index.currentSort.replace(/-rev$/, '');
        Index.sortedThreadIDs = (function () {
            switch (sortType) {
                case 'lastreply':
                case 'lastlong':
                    var repliesAvailable = liveThreadData.some(function (thread) { var _a; return (_a = thread.last_replies) === null || _a === void 0 ? void 0 : _a.length; });
                    var lastlong = function (thread) {
                        var _a;
                        if (!repliesAvailable) {
                            return thread.last_modified;
                        }
                        var iterable = thread.last_replies || [];
                        for (var i = iterable.length - 1; i >= 0; i--) {
                            var r = iterable[i];
                            if (Index.isHiddenReply(thread.no, r)) {
                                continue;
                            }
                            if (sortType === 'lastreply') {
                                return r;
                            }
                            var len = r.com ? globals_1.g.SITE.Build.parseComment(r.com).replace(/[^a-z]/ig, '').length : 0;
                            if (len >= Index.lastLongThresholds[+!!r.ext]) {
                                return r;
                            }
                        }
                        if (thread.omitted_posts && ((_a = thread.last_replies) === null || _a === void 0 ? void 0 : _a.length)) {
                            return thread.last_replies[0];
                        }
                        else {
                            return thread;
                        }
                    };
                    var lastlongD = (0, helpers_1.dict)();
                    for (var _i = 0, liveThreadData_1 = liveThreadData; _i < liveThreadData_1.length; _i++) {
                        var thread = liveThreadData_1[_i];
                        lastlongD[thread.no] = lastlong(thread).no;
                    }
                    return __spreadArray([], liveThreadData, true).sort(function (a, b) { return lastlongD[b.no] - lastlongD[a.no]; }).map(function (post) { return post.no; });
                case 'bump': return liveThreadIDs;
                case 'birth': return __spreadArray([], liveThreadIDs, true).sort(function (a, b) { return b - a; });
                case 'replycount': return __spreadArray([], liveThreadData, true).sort(function (a, b) { return b.replies - a.replies; }).map(function (post) { return post.no; });
                case 'filecount': return __spreadArray([], liveThreadData, true).sort(function (a, b) { return b.images - a.images; }).map(function (post) { return post.no; });
                case 'activity': return __spreadArray([], liveThreadData, true).sort(function (a, b) { return ((tmp_time - a.time) / (a.replies + 1)) - ((tmp_time - b.time) / (b.replies + 1)); }).map(function (post) { return post.no; });
                default: return liveThreadIDs;
            }
        })();
        if (/-rev$/.test(Index.currentSort)) {
            Index.sortedThreadIDs.reverse();
        }
        if (Index.search && (threadIDs = Index.querySearch(Index.search))) {
            Index.sortedThreadIDs = threadIDs;
        }
        // Sticky threads
        Index.sortOnTop(function (obj) { return obj.isSticky; });
        // Highlighted threads
        Index.sortOnTop(function (obj) { return obj.isOnTop || (globals_1.Conf['Pin Watched Threads'] && ThreadWatcher_1.default.isWatchedRaw(obj.boardID, obj.threadID)); });
        // Non-hidden threads
        if (globals_1.Conf['Anchor Hidden Threads']) {
            return Index.sortOnTop(function (obj) { return !Index.isHidden(obj.threadID); });
        }
    },
    sortOnTop: function (match) {
        var topThreads = [];
        var bottomThreads = [];
        for (var _i = 0, _a = Index.sortedThreadIDs; _i < _a.length; _i++) {
            var ID = _a[_i];
            (match(Index.parsedThreads[ID]) ? topThreads : bottomThreads).push(ID);
        }
        return Index.sortedThreadIDs = topThreads.concat(bottomThreads);
    },
    buildIndex: function () {
        var threadIDs;
        if (!Index.liveThreadData) {
            return;
        }
        switch (globals_1.Conf['Index Mode']) {
            case 'all pages':
                threadIDs = Index.sortedThreadIDs;
                break;
            case 'catalog':
                threadIDs = Index.sortedThreadIDs.filter(function (ID) { return !Index.isHidden(ID) !== Index.showHiddenThreads; });
                break;
            default:
                threadIDs = Index.threadsOnPage(Index.currentPage);
        }
        delete Index.pageNum;
        _1.default.rmAll(Index.root);
        _1.default.rmAll(Header_1.default.hover);
        if (Index.loaded && Index.root.parentNode) {
            _1.default.event('PostsRemoved', null, Index.root);
        }
        if (globals_1.Conf['Index Mode'] === 'catalog') {
            Index.buildCatalog(threadIDs);
        }
        else {
            Index.buildStructure(threadIDs);
        }
    },
    threadsOnPage: function (pageNum) {
        var nodesPerPage = Index.threadsNumPerPage;
        var offset = nodesPerPage * (pageNum - 1);
        return Index.sortedThreadIDs.slice(offset, offset + nodesPerPage);
    },
    buildStructure: function (threadIDs) {
        var threads = Index.buildThreads(threadIDs, false, globals_1.Conf['Show Replies']);
        var nodes = [];
        for (var _i = 0, threads_4 = threads; _i < threads_4.length; _i++) {
            var thread = threads_4[_i];
            nodes.push(thread.nodes.root, _1.default.el('hr'));
        }
        _1.default.add(Index.root, nodes);
        if (Index.root.parentNode) {
            _1.default.event('PostsInserted', null, Index.root);
        }
        Index.loaded = true;
    },
    buildCatalog: function (threadIDs) {
        var i = 0;
        var n = threadIDs.length;
        var node0 = null;
        var fn = function () {
            if (node0 && !node0.parentNode) {
                return;
            } // Index.root cleared
            var j = (i > 0) && Index.root.parentNode ? n : i + 30;
            node0 = Index.buildCatalogPart(threadIDs.slice(i, j))[0];
            i = j;
            if (i < n) {
                return _1.default.queueTask(fn);
            }
            else {
                if (Index.root.parentNode) {
                    _1.default.event('PostsInserted', null, Index.root);
                }
                return Index.loaded = true;
            }
        };
        fn();
    },
    buildCatalogPart: function (threadIDs) {
        var threads = Index.buildThreads(threadIDs, true);
        Index.buildCatalogViews(threads);
        Index.sizeCatalogViews(threads);
        var nodes = [];
        for (var _i = 0, threads_5 = threads; _i < threads_5.length; _i++) {
            var thread = threads_5[_i];
            thread.OP.setCatalogOP(true);
            _1.default.add(thread.catalogView.nodes.root, thread.OP.nodes.root);
            nodes.push(thread.catalogView.nodes.root);
            _1.default.on(thread.catalogView.nodes.root, 'mouseenter', Index.cb.catalogReplies.bind(thread));
            _1.default.on(thread.OP.nodes.root, 'mouseenter', Index.cb.hoverAdjust.bind(thread.OP.nodes));
        }
        _1.default.add(Index.root, nodes);
        return nodes;
    },
    clearSearch: function () {
        Index.searchInput.value = '';
        Index.onSearchInput();
        return Index.searchInput.focus();
    },
    setupSearch: function () {
        Index.searchInput.value = Index.search;
        if (Index.search) {
            return Index.searchInput.dataset.searching = 1;
        }
        else {
            // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=1021289
            return Index.searchInput.removeAttribute('data-searching');
        }
    },
    onSearchInput: function () {
        var search = Index.searchInput.value.trim();
        if (search === Index.search) {
            return;
        }
        Index.pushState({
            search: search,
            replace: !!search === !!Index.search
        });
        return Index.pageLoad(false);
    },
    querySearch: function (query) {
        var keywords, match;
        if (match = query.match(/^([\w+]+):\/(.*)\/(\w*)$/)) {
            var regexp_1;
            try {
                regexp_1 = RegExp(match[2], match[3]);
            }
            catch (error) {
                return [];
            }
            return Index.sortedThreadIDs.filter(function (ID) { return regexp_1.test(Filter_1.default.values(match[1], Index.parsedThreads[ID]).join('\n')); });
        }
        if (!(keywords = query.toLowerCase().match(/\S+/g))) {
            return;
        }
        return Index.sortedThreadIDs.filter(function (ID) { return Index.searchMatch(Index.parsedThreads[ID], keywords); });
    },
    searchMatch: function (obj, keywords) {
        var info = obj.info, file = obj.file;
        if (info.comment == null) {
            info.comment = globals_1.g.SITE.Build.parseComment(info.commentHTML.innerHTML);
        }
        var text = [];
        for (var _i = 0, _a = ['comment', 'subject', 'name', 'tripcode']; _i < _a.length; _i++) {
            var key = _a[_i];
            if (key in info) {
                text.push(info[key]);
            }
        }
        if (file) {
            text.push(file.name);
        }
        text = text.join(' ').toLowerCase();
        for (var _b = 0, keywords_1 = keywords; _b < keywords_1.length; _b++) {
            var keyword = keywords_1[_b];
            if (-1 === text.indexOf(keyword)) {
                return false;
            }
        }
        return true;
    }
};
exports.default = Index;
