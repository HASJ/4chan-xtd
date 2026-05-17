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
var Callbacks_1 = require("../classes/Callbacks");
var Notice_1 = require("../classes/Notice");
var Config_1 = require("../config/Config");
var Get_1 = require("../General/Get");
var Settings_1 = require("../General/Settings");
var globals_1 = require("../globals/globals");
var Menu_1 = require("../Menu/Menu");
var Unread_1 = require("../Monitoring/Unread");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var helpers_1 = require("../platform/helpers");
var QuoteYou_1 = require("../Quotelinks/QuoteYou");
var PostHiding_1 = require("./PostHiding");
var ThreadHiding_1 = require("./ThreadHiding");
var Post_1 = require("../classes/Post");
var Recursive_1 = require("./Recursive");
;
var Filter = {
    /**
     * Uses a Map for string types, with the value to filter for as the key.
     * This allows faster lookup than iterating over every filter.
     */
    filters: new Map(),
    init: function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        if (!['index', 'thread', 'catalog'].includes(globals_1.g.VIEW) || !globals_1.Conf['Filter'])
            return;
        if ((globals_1.g.VIEW === 'catalog') && !globals_1.Conf['Filter in Native Catalog'])
            return;
        if (!globals_1.Conf['Filtered Backlinks']) {
            _1.default.addClass(globals_1.doc, 'hide-backlinks');
        }
        for (var key in Config_1.default.filter) {
            var _loop_1 = function () {
                var hl = void 0;
                var regexp = void 0;
                var top_1 = void 0;
                var hide = true;
                var mask = 0;
                var boards = false;
                var excludes = false;
                var reason = void 0;
                var poster = false;
                var replies = false;
                var noti = false;
                var stub = globals_1.Conf.Stubs;
                if (line[0] === '#')
                    return "continue";
                var regexpMatch = line.match(/\/(.*)\/(\w*)/);
                if (!regexpMatch) {
                    return "continue";
                }
                if (key === 'uniqueID' || key === 'MD5') {
                    // MD5 filter will use strings instead of regular expressions.
                    regexp = regexpMatch[1];
                }
                else {
                    try {
                        // Please, don't write silly regular expressions.
                        regexp = RegExp(regexpMatch[1], regexpMatch[2]);
                    }
                    catch (err) {
                        // I warned you, bro.
                        new Notice_1.default('warning', [
                            _1.default.tn("Invalid ".concat(key, " filter:")),
                            _1.default.el('br'),
                            _1.default.tn(line),
                            _1.default.el('br'),
                            _1.default.tn(err.message)
                        ], 60);
                        return "continue";
                    }
                }
                // Don't mix up filter flags with the regular expression.
                var options = line.length > regexpMatch[0].length ? line.replace(regexpMatch[0], '') : '';
                if (options) {
                    // List of the boards this filter applies to.
                    boards = this_1.parseBoards((_a = options.match(/(?:^|;)\s*boards:([^;]+)/)) === null || _a === void 0 ? void 0 : _a[1]);
                    // Boards to exclude from an otherwise global rule.
                    excludes = this_1.parseBoards((_b = options.match(/(?:^|;)\s*exclude:([^;]+)/)) === null || _b === void 0 ? void 0 : _b[1]);
                    // Filter OPs along with their threads or replies only.
                    var op = ((_c = options.match(/(?:^|;)\s*op:(no|only)/)) === null || _c === void 0 ? void 0 : _c[1]) || '';
                    mask = _1.default.getOwn({ 'no': 1, 'only': 2 }, op) || 0;
                    // Filter only posts with/without files.
                    var file = ((_d = options.match(/(?:^|;)\s*file:(no|only)/)) === null || _d === void 0 ? void 0 : _d[1]) || '';
                    mask = mask | (_1.default.getOwn({ 'no': 4, 'only': 8 }, file) || 0);
                    // Overrule the `Show Stubs` setting.
                    // Defaults to stub showing.
                    stub = (function () {
                        var _a;
                        switch ((_a = options.match(/(?:^|;)\s*stub:(yes|no)/)) === null || _a === void 0 ? void 0 : _a[1]) {
                            case 'yes':
                                return true;
                            case 'no':
                                return false;
                            default:
                                return globals_1.Conf['Stubs'];
                        }
                    })();
                    // Desktop notification
                    noti = /(?:^|;)\s*notify/.test(options);
                    // Highlight the post.
                    // If not specified, the highlight class will be filter-highlight.
                    var highlightRes = options.match(/(?:^|;)\s*highlight(?::([\w-]+))?/);
                    if (highlightRes) {
                        hl = highlightRes[1] || 'filter-highlight';
                        // Put highlighted OP's thread on top of the board page or not.
                        // Defaults to on top.
                        top_1 = (((_e = options.match(/(?:^|;)\s*top:(yes|no)/)) === null || _e === void 0 ? void 0 : _e[1]) || 'yes') === 'yes';
                        hide = /(?:^|;)\s*hide(?:[;:]|$)/.test(options);
                    }
                    // Hide the post (default case).
                    hide = hide || !(hl || noti);
                    reason = (_f = options.match(/(?:^|;)\s*reason:([^;$]+)/)) === null || _f === void 0 ? void 0 : _f[1];
                    poster = /(?:^|;)\s*poster(?:[;:]|$)/.test(options);
                    replies = /(?:^|;)\s*replies(?:[;:]|$)/.test(options);
                }
                var filterObj = { regexp: regexp, boards: boards, excludes: excludes, mask: mask, hide: hide, stub: stub, hl: hl, top: top_1, noti: noti, reason: reason, poster: poster, replies: replies };
                // Fields that this filter applies to (for 'general' filters)
                if (key === 'general') {
                    var types = ((_g = options.match(/(?:^|;)\s*type:([^;]*)/)) === null || _g === void 0 ? void 0 : _g[1].split(','))
                        || ['subject', 'name', 'filename', 'comment'];
                    for (var _t = 0, types_1 = types; _t < types_1.length; _t++) {
                        var type = types_1[_t];
                        (_j = (_h = this_1.filters.get(type)) === null || _h === void 0 ? void 0 : _h.push(filterObj)) !== null && _j !== void 0 ? _j : this_1.filters.set(type, [filterObj]);
                    }
                }
                else {
                    (_l = (_k = this_1.filters.get(key)) === null || _k === void 0 ? void 0 : _k.push(filterObj)) !== null && _l !== void 0 ? _l : this_1.filters.set(key, [filterObj]);
                }
            };
            var this_1 = this;
            for (var _i = 0, _p = globals_1.Conf[key].split('\n'); _i < _p.length; _i++) {
                var line = _p[_i];
                _loop_1();
            }
        }
        if (!this.filters.size)
            return;
        // conversion from array to map for string types
        for (var _q = 0, _r = ['MD5', 'uniqueID']; _q < _r.length; _q++) {
            var type_1 = _r[_q];
            var filtersForType = this.filters.get(type_1);
            if (!filtersForType)
                continue;
            var map = new Map();
            for (var _s = 0, filtersForType_1 = filtersForType; _s < filtersForType_1.length; _s++) {
                var filter = filtersForType_1[_s];
                (_o = (_m = map.get(filter.regexp)) === null || _m === void 0 ? void 0 : _m.push(filter)) !== null && _o !== void 0 ? _o : map.set(filter.regexp, [filter]);
            }
            this.filters.set(type_1, map);
        }
        if (globals_1.g.VIEW === 'catalog') {
            return Filter.catalog();
        }
        else {
            return Callbacks_1.default.Post.push({
                name: 'Filter',
                cb: this.node
            });
        }
    },
    // Parse comma-separated list of boards.
    // Sites can be specified by a beginning part of the site domain followed by a colon.
    parseBoards: function (boardsRaw) {
        var _a;
        var _b;
        var boards;
        if (!boardsRaw) {
            return false;
        }
        if (boards = Filter.parseBoardsMemo[boardsRaw]) {
            return boards;
        }
        boards = (0, helpers_1.dict)();
        var siteFilter = '';
        for (var _i = 0, _c = boardsRaw.split(','); _i < _c.length; _i++) {
            var boardID = _c[_i];
            if (boardID.includes(':')) {
                _a = boardID.split(':').slice(-2), siteFilter = _a[0], boardID = _a[1];
            }
            for (var siteID in globals_1.g.sites) {
                var site = globals_1.g.sites[siteID];
                if (siteID.slice(0, siteFilter.length) === siteFilter) {
                    if (['nsfw', 'sfw'].includes(boardID)) {
                        for (var _d = 0, _e = ((_b = site.sfwBoards) === null || _b === void 0 ? void 0 : _b.call(site, boardID === 'sfw')) || []; _d < _e.length; _d++) {
                            var boardID2 = _e[_d];
                            boards["".concat(siteID, "/").concat(boardID2)] = true;
                        }
                    }
                    else {
                        boards["".concat(siteID, "/").concat(encodeURIComponent(boardID))] = true;
                    }
                }
            }
        }
        Filter.parseBoardsMemo[boardsRaw] = boards;
        return boards;
    },
    parseBoardsMemo: (0, helpers_1.dict)(),
    test: function (post, hideable) {
        if (hideable === void 0) { hideable = true; }
        if (post.filterResults)
            return post.filterResults;
        var hide = false;
        var stub = true;
        var hl = undefined;
        var top = false;
        var noti = false;
        var poster = false;
        var replies = false;
        var reasons;
        if (QuoteYou_1.default.isYou(post)) {
            hideable = false;
        }
        var mask = (post.isReply ? 2 : 1);
        mask = (mask | (post.file ? 4 : 8));
        var board = "".concat(post.siteID, "/").concat(post.boardID);
        var site = "".concat(post.siteID, "/*");
        for (var _i = 0, _a = Filter.filters.keys(); _i < _a.length; _i++) {
            var type = _a[_i];
            for (var _b = 0, _c = Filter.values(type, post); _b < _c.length; _b++) {
                var value = _c[_b];
                var filtersOrMap = Filter.filters.get(type);
                var filtersForType = Array.isArray(filtersOrMap) ? filtersOrMap : filtersOrMap.get(value);
                if (!filtersForType)
                    continue;
                var isString = type === 'uniqueID' || type === 'MD5';
                for (var _d = 0, filtersForType_2 = filtersForType; _d < filtersForType_2.length; _d++) {
                    var filter = filtersForType_2[_d];
                    if ((filter.boards && !(filter.boards[board] || filter.boards[site])) ||
                        (filter.excludes && (filter.excludes[board] || filter.excludes[site])) ||
                        (filter.mask & mask) ||
                        (isString ? (filter.regexp !== value) : !filter.regexp.test(value)))
                        continue;
                    if (filter.hide) {
                        if (hideable) {
                            hide = true;
                            if (stub) {
                                (stub = filter.stub);
                                (reasons || (reasons = [])).push(filter.reason || "Filtered ".concat(type, " ").concat(filter.regexp));
                            }
                        }
                    }
                    if (filter.hl && !(hl === null || hl === void 0 ? void 0 : hl.includes(filter.hl))) {
                        (hl || (hl = [])).push(filter.hl);
                    }
                    if (!top) {
                        (top = filter.top);
                    }
                    if (filter.noti)
                        noti = true;
                    if (filter.poster)
                        poster = true;
                    if (filter.replies)
                        replies = true;
                }
            }
        }
        post.filterResults = { hide: hide, stub: stub, hl: hl, top: top, noti: noti, poster: poster, replies: replies, reasons: reasons };
        return post.filterResults;
    },
    node: function () {
        var _this = this;
        var _a, _b, _c;
        if (this.isClone ||
            // Happens when hovering over a dead link in the catalog.
            (!this.isReply && !this.thread.nodes.root))
            return;
        var _d = Filter.test(this, (!this.isFetchedQuote && (this.isReply || (globals_1.g.VIEW === 'index')))), hide = _d.hide, stub = _d.stub, hl = _d.hl, noti = _d.noti, poster = _d.poster, replies = _d.replies;
        // Add temporary filter for the poster ID for future posts.
        var reason;
        if (poster && this.info.uniqueID) {
            reason = "Hidden because it's the same poster as ".concat(this.ID, " (").concat(this.filterResults.reasons, ")");
            var uniqueID = this.info.uniqueID;
            var newFilter = {
                regexp: uniqueID,
                boards: false,
                excludes: false,
                mask: 0,
                hide: hide,
                stub: stub,
                replies: replies,
                // A filter can only have one hl class.
                hl: hl === null || hl === void 0 ? void 0 : hl[0],
                reason: reason,
            };
            var map = Filter.filters.get('uniqueID');
            if (map) {
                (_b = (_a = map.get(uniqueID)) === null || _a === void 0 ? void 0 : _a.push(newFilter)) !== null && _b !== void 0 ? _b : map.set(uniqueID, [newFilter]);
            }
            else {
                Filter.filters.set('uniqueID', (new Map()).set(uniqueID, [newFilter]));
            }
        }
        if (hide) {
            if (this.isReply) {
                PostHiding_1.default.hide(this, stub);
                if (replies) {
                    Recursive_1.default.applyAndAdd(PostHiding_1.default.hide, this, stub, undefined, "Hidden recursively from ".concat(this.ID));
                }
                if (poster && this.info.uniqueID) {
                    globals_1.g.posts.forEach(function (p) {
                        if (p.info.uniqueID === _this.info.uniqueID && p !== _this) {
                            PostHiding_1.default.hide(p, stub, replies, reason);
                            if (replies) {
                                Recursive_1.default.applyAndAdd(PostHiding_1.default.hide, p, stub, undefined, "Hidden recursively from ".concat(p.ID));
                            }
                        }
                    });
                }
            }
            else {
                ThreadHiding_1.default.hide(this.thread, stub);
            }
        }
        if (hl) {
            this.highlights = hl;
            _1.default.addClass.apply(_1.default, __spreadArray([this.nodes.root], hl, false));
            if (this.isReply) {
                var hlFn_1 = function (post) {
                    var hl = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        hl[_i - 1] = arguments[_i];
                    }
                    _1.default.addClass.apply(_1.default, __spreadArray([post.nodes.root], hl, false));
                };
                if (replies)
                    Recursive_1.default.applyAndAdd.apply(Recursive_1.default, __spreadArray([hlFn_1, this], hl, false));
                if (poster && this.info.uniqueID) {
                    globals_1.g.posts.forEach(function (p) {
                        if (p.info.uniqueID === _this.info.uniqueID && p !== _this) {
                            _1.default.addClass.apply(_1.default, __spreadArray([p.nodes.root], hl, false));
                            if (replies)
                                Recursive_1.default.applyAndAdd.apply(Recursive_1.default, __spreadArray([hlFn_1, p], hl, false));
                        }
                    });
                }
            }
        }
        if (noti && Unread_1.default.posts && (this.ID > Unread_1.default.lastReadPost) && !QuoteYou_1.default.isYou(this)) {
            Unread_1.default.openNotification(this, ' triggered a notification filter');
        }
        if ((_c = this.file) === null || _c === void 0 ? void 0 : _c.thumbLink) {
            _1.default.on(this.file.thumbLink, 'click', function (e) {
                if (!e.shiftKey || !globals_1.Conf['MD5 Quick Filter in Threads'])
                    return;
                Filter.quickFilterMD5.call(_this);
                e.preventDefault();
                e.stopImmediatePropagation();
            });
        }
    },
    catalog: function () {
        var _a, _b;
        var url;
        if (!(url = (_b = (_a = globals_1.g.SITE.urls).catalogJSON) === null || _b === void 0 ? void 0 : _b.call(_a, globals_1.g.BOARD))) {
            return;
        }
        Filter.catalogData = (0, helpers_1.dict)();
        _1.default.ajax(url, { onloadend: Filter.catalogParse });
        return Callbacks_1.default.CatalogThreadNative.push({
            name: 'Filter',
            cb: this.catalogNode
        });
    },
    catalogParse: function () {
        if (![200, 404].includes(this.status)) {
            new Notice_1.default('warning', "Failed to fetch catalog JSON data. ".concat(this.status ? "Error ".concat(this.statusText, " (").concat(this.status, ")") : 'Connection Error'), 1);
            return;
        }
        for (var _i = 0, _a = this.response; _i < _a.length; _i++) {
            var page = _a[_i];
            for (var _b = 0, _c = page.threads; _b < _c.length; _b++) {
                var item = _c[_b];
                Filter.catalogData[item.no] = item;
            }
        }
        globals_1.g.BOARD.threads.forEach(function (thread) {
            if (thread.catalogViewNative) {
                return Filter.catalogNode.call(thread.catalogViewNative);
            }
        });
    },
    catalogNode: function () {
        var _a, _b, _c;
        if ((this.boardID !== globals_1.g.BOARD.ID) || !Filter.catalogData[this.ID]) {
            return;
        }
        if ((_a = QuoteYou_1.default.db) === null || _a === void 0 ? void 0 : _a.get({ siteID: globals_1.g.SITE.ID, boardID: this.boardID, threadID: this.ID, postID: this.ID })) {
            return;
        }
        var _d = Filter.test(globals_1.g.SITE.Build.parseJSON(Filter.catalogData[this.ID], this)), hide = _d.hide, hl = _d.hl, top = _d.top;
        if (hide) {
            this.nodes.root.hidden = true;
        }
        if (hl) {
            this.highlights = hl;
            _1.default.addClass.apply(_1.default, __spreadArray([this.nodes.root], hl, false));
        }
        if (top) {
            _1.default.prepend(this.nodes.root.parentNode, this.nodes.root);
            (_c = (_b = globals_1.g.SITE).catalogPin) === null || _c === void 0 ? void 0 : _c.call(_b, this.nodes.root);
        }
    },
    isHidden: function (post) {
        return !!Filter.test(post).hide;
    },
    valueF: {
        postID: function (post) { return ["".concat(post.ID)]; },
        name: function (post) { return post.info.name === undefined ? [] : [post.info.name]; },
        uniqueID: function (post) { return [post.info.uniqueID || '']; },
        tripcode: function (post) { return post.info.tripcode === undefined ? [] : [post.info.tripcode]; },
        capcode: function (post) { return post.info.capcode === undefined ? [] : [post.info.capcode]; },
        pass: function (post) { return [post.info.pass]; },
        email: function (post) { return [post.info.email]; },
        subject: function (post) { return [post.info.subject || (post.isReply ? undefined : '')]; },
        comment: function (post) {
            var _a, _b, _c;
            if (post.info.comment == null) {
                post.info.comment = (_c = (_b = (_a = globals_1.g.sites[post.siteID]) === null || _a === void 0 ? void 0 : _a.Build) === null || _b === void 0 ? void 0 : _b.parseComment) === null || _c === void 0 ? void 0 : _c.call(_b, post.info.commentHTML.innerHTML);
            }
            return [post.info.comment];
        },
        flag: function (post) { return post.info.flag === undefined ? [] : [post.info.flag]; },
        filename: function (post) { return post.files.map(function (f) { return f.name; }); },
        dimensions: function (post) { return post.files.map(function (f) { return f.dimensions; }); },
        filesize: function (post) { return post.files.map(function (f) { return f.size; }); },
        MD5: function (post) { return post.files.map(function (f) { return f.MD5; }); }
    },
    values: function (key, post) {
        if (_1.default.hasOwn(Filter.valueF, key)) {
            return Filter.valueF[key](post).filter(function (v) { return v != null; });
        }
        else {
            return [key.split('+').map(function (k) {
                    var f;
                    if (f = _1.default.getOwn(Filter.valueF, k)) {
                        return f(post).map(function (v) { return v || ''; }).join('\n');
                    }
                    else {
                        return '';
                    }
                }).join('\n')];
        }
    },
    addFilter: function (type, re, cb) {
        if (!_1.default.hasOwn(Config_1.default.filter, type)) {
            return;
        }
        return _1.default.get(type, globals_1.Conf[type], function (item) {
            var save = item[type];
            // Add a new line before the regexp unless the text is empty.
            save =
                save ?
                    "".concat(save, "\n").concat(re)
                    :
                        re;
            return _1.default.set(type, save, cb);
        });
    },
    removeFilters: function (type, res, cb) {
        return _1.default.get(type, globals_1.Conf[type], function (item) {
            var save = item[type];
            var filterArray = Array.isArray(res) ? res : __spreadArray([], res.values(), true).flat();
            var r = filterArray.map(Filter.escape).join('|');
            save = save.replace(RegExp("(?:$\n|^)(?:".concat(r, ")$"), 'mg'), '');
            return _1.default.set(type, save, cb);
        });
    },
    showFilters: function (type) {
        // Open the settings and display & focus the relevant filter textarea.
        Settings_1.default.open('Filter');
        var section = (0, _1.default)('.section-container');
        var select = (0, _1.default)('select[name=filter]', section);
        select.value = type;
        Settings_1.default.selectFilter.call(select);
        return _1.default.onExists(section, 'textarea', function (ta) {
            var tl = ta.textLength;
            ta.setSelectionRange(tl, tl);
            return ta.focus();
        });
    },
    quickFilterMD5: function () {
        var post = this instanceof Post_1.default ? this : Get_1.default.postFromNode(this);
        var files = post.files.filter(function (f) { return f.MD5; });
        if (!files.length) {
            return;
        }
        var filter = files.map(function (f) { return "/".concat(f.MD5, "/"); }).join('\n');
        Filter.addFilter('MD5', filter);
        var origin = post.origin || post;
        if (origin.isReply) {
            PostHiding_1.default.hide(origin, undefined, undefined, files.map(function (f) { return "Filtered MD5 ".concat(f.MD5); }).join(' & '));
        }
        else if (globals_1.g.VIEW === 'index') {
            ThreadHiding_1.default.hide(origin.thread);
        }
        if (!globals_1.Conf['MD5 Quick Filter Notifications']) {
            // feedback for when nothing gets hidden
            if (post.nodes.post.getBoundingClientRect().height) {
                new Notice_1.default('info', 'MD5 filtered.', 2);
            }
            return;
        }
        var notice = Filter.quickFilterMD5.notice;
        if (notice) {
            notice.filters.push(filter);
            notice.posts.push(origin);
            (0, _1.default)('span', notice.el).textContent = "".concat(notice.filters.length, " MD5s filtered.");
            notice.resetTimer();
        }
        else {
            var msg = _1.default.el('div', { innerHTML: "<span>MD5 filtered.</span> [<a href=\"javascript:;\">show</a>] [<a href=\"javascript:;\">undo</a>]" });
            notice = (Filter.quickFilterMD5.notice = new Notice_1.default('info', msg, 10, function () { return delete Filter.quickFilterMD5.notice; }));
            notice.filters = [filter];
            notice.posts = [origin];
            var links = (0, __1.default)('a', msg);
            _1.default.on(links[0], 'click', Filter.quickFilterCB.show.bind(notice));
            _1.default.on(links[1], 'click', Filter.quickFilterCB.undo.bind(notice));
        }
    },
    quickFilterCB: {
        show: function () {
            Filter.showFilters('MD5');
            return this.close();
        },
        undo: function () {
            Filter.removeFilters('MD5', this.filters);
            for (var _i = 0, _a = this.posts; _i < _a.length; _i++) {
                var post = _a[_i];
                if (post.isReply) {
                    PostHiding_1.default.show(post);
                }
                else if (globals_1.g.VIEW === 'index') {
                    ThreadHiding_1.default.show(post.thread);
                }
            }
            return this.close();
        }
    },
    escape: function (value) {
        return value.replace(/\/|\\|\^|\$|\n|\.|\(|\)|\{|\}|\[|\]|\?|\*|\+|\|/g, function (c) {
            if (c === '\n') {
                return '\\n';
            }
            else {
                return "\\".concat(c);
            }
        });
    },
    menu: {
        init: function () {
            if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Menu'] || !globals_1.Conf['Filter']) {
                return;
            }
            var div = _1.default.el('div', { textContent: 'Filter' });
            var entry = {
                el: div,
                order: 50,
                open: function (post) {
                    Filter.menu.post = post;
                    return true;
                },
                subEntries: []
            };
            for (var _i = 0, _a = [
                ['Name', 'name'],
                ['Unique ID', 'uniqueID'],
                ['Tripcode', 'tripcode'],
                ['Capcode', 'capcode'],
                ['Pass Date', 'pass'],
                ['Email', 'email'],
                ['Subject', 'subject'],
                ['Comment', 'comment'],
                ['Flag', 'flag'],
                ['Filename', 'filename'],
                ['Image dimensions', 'dimensions'],
                ['Filesize', 'filesize'],
                ['Image MD5', 'MD5']
            ]; _i < _a.length; _i++) {
                var type = _a[_i];
                // Add a sub entry for each filter type.
                entry.subEntries.push(Filter.menu.createSubEntry(type[0], type[1]));
            }
            return Menu_1.default.menu.addEntry(entry);
        },
        createSubEntry: function (text, type) {
            var el = _1.default.el('a', {
                href: 'javascript:;',
                textContent: text
            });
            el.dataset.type = type;
            _1.default.on(el, 'click', Filter.menu.makeFilter);
            return {
                el: el,
                open: function (post) {
                    return Filter.values(type, post).length;
                }
            };
        },
        makeFilter: function () {
            var type = this.dataset.type;
            // Convert value -> regexp, unless type is MD5
            var values = Filter.values(type, Filter.menu.post);
            var res = values.map(function (value) {
                if (['uniqueID', 'MD5'].includes(type)) {
                    return "/".concat(value, "/");
                }
                else {
                    return "/^".concat(Filter.escape(value), "$/");
                }
            }).join('\n');
            return Filter.addFilter(type, res, function () { return Filter.showFilters(type); });
        }
    }
};
exports.default = Filter;
