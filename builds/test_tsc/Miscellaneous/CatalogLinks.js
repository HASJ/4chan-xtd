"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Filter_1 = require("../Filtering/Filter");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var package_json_1 = require("../../package.json");
var Index_1 = require("../General/Index");
var Site_1 = require("../site/Site");
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var UI_1 = require("../General/UI");
var Get_1 = require("../General/Get");
var helpers_1 = require("../platform/helpers");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var CatalogLinks = {
    init: function () {
        if ((globals_1.g.SITE.software === 'yotsuba') && (globals_1.Conf['External Catalog'] || globals_1.Conf['JSON Index']) && !(globals_1.Conf['JSON Index'] && (globals_1.g.VIEW === 'index'))) {
            var selector_1 = (function () {
                switch (globals_1.g.VIEW) {
                    case 'thread':
                    case 'archive': return '.navLinks.desktop > a';
                    case 'catalog': return '.navLinks > :first-child > a';
                    case 'index': return '#ctrl-top > a, .cataloglink > a';
                }
            })();
            _1.default.ready(function () {
                var _a, _b;
                for (var _i = 0, _c = (0, __1.default)(selector_1); _i < _c.length; _i++) {
                    var link = _c[_i];
                    var catalogURL;
                    switch (link.pathname.replace(/\/+/g, '/')) {
                        case "/".concat(globals_1.g.BOARD, "/"):
                            if (globals_1.Conf['JSON Index']) {
                                link.textContent = 'Index';
                            }
                            link.href = CatalogLinks.index();
                            break;
                        case "/".concat(globals_1.g.BOARD, "/catalog"):
                            link.href = CatalogLinks.catalog();
                            break;
                    }
                    if ((globals_1.g.VIEW === 'catalog') && ((catalogURL = CatalogLinks.catalog()) !== ((_b = (_a = globals_1.g.SITE.urls).catalog) === null || _b === void 0 ? void 0 : _b.call(_a, globals_1.g.BOARD)))) {
                        var catalogLink = link.parentNode.cloneNode(true);
                        var link2 = catalogLink.firstElementChild;
                        link2.href = catalogURL;
                        link2.textContent = link2.hostname === location.hostname ? "".concat(package_json_1.default.name, " Catalog") : 'External Catalog';
                        _1.default.after(link.parentNode, [_1.default.tn(' '), catalogLink]);
                    }
                }
            });
        }
        if ((globals_1.g.SITE.software === 'yotsuba') && globals_1.Conf['JSON Index'] && globals_1.Conf["Use ".concat(package_json_1.default.name, " Catalog")]) {
            Callbacks_1.default.Post.push({
                name: 'Catalog Link Rewrite',
                cb: this.node
            });
        }
        if (this.enabled = globals_1.Conf['Catalog Links']) {
            var el = void 0;
            CatalogLinks.el = (el = UI_1.default.checkbox('Header catalog links', 'Catalog Links'));
            el.id = 'toggleCatalog';
            var input = (0, _1.default)('input', el);
            _1.default.on(input, 'change', this.toggle);
            _1.default.sync('Header catalog links', CatalogLinks.set);
            return Header_1.default.menu.addEntry({
                el: el,
                order: 95
            });
        }
    },
    node: function () {
        for (var _i = 0, _a = (0, __1.default)('a', this.nodes.comment); _i < _a.length; _i++) {
            var a = _a[_i];
            var m;
            if (m = a.href.match(/^https?:\/\/(boards\.4chan(?:nel)?\.org\/[^\/]+)\/catalog(#s=.*)?/)) {
                a.href = "//".concat(m[1], "/").concat(m[2] || '#catalog');
            }
        }
    },
    toggle: function () {
        _1.default.event('CloseMenu');
        _1.default.set('Header catalog links', this.checked);
        return CatalogLinks.set(this.checked);
    },
    set: function (useCatalog) {
        globals_1.Conf['Header catalog links'] = useCatalog;
        CatalogLinks.setLinks(Header_1.default.boardList);
        CatalogLinks.setLinks(Header_1.default.bottomBoardList);
        CatalogLinks.el.title = "Turn catalog links ".concat(useCatalog ? 'off' : 'on', ".");
        return (0, _1.default)('input', CatalogLinks.el).checked = useCatalog;
    },
    // Also called by Header when board lists are loaded / generated.
    setLinks: function (list) {
        var _a;
        var _b;
        if ((!((_b = CatalogLinks.enabled) !== null && _b !== void 0 ? _b : globals_1.Conf['Catalog Links'])) || !list) {
            return;
        }
        // do not transform links unless they differ from the expected value at most by this tail
        var tail = /(?:index)?(?:\.\w+)?$/;
        for (var _i = 0, _c = (0, __1.default)('a:not([data-only])', list); _i < _c.length; _i++) {
            var a = _c[_i];
            var _d = a.dataset, siteID = _d.siteID, boardID = _d.boardID;
            if (!siteID || !boardID) {
                var VIEW;
                (_a = Site_1.default.parseURL(a), siteID = _a.siteID, boardID = _a.boardID, VIEW = _a.VIEW);
                if (!siteID || !boardID ||
                    !['index', 'catalog'].includes(VIEW) ||
                    (!a.dataset.indexOptions && (a.href.replace(tail, '') !== (Get_1.default.url(VIEW, { siteID: siteID, boardID: boardID }) || '').replace(tail, '')))) {
                    continue;
                }
                _1.default.extend(a.dataset, { siteID: siteID, boardID: boardID });
            }
            var board = { siteID: siteID, boardID: boardID };
            var url = globals_1.Conf['Header catalog links'] ? CatalogLinks.catalog(board) : Get_1.default.url('index', board);
            if (url) {
                a.href = url;
                if (a.dataset.indexOptions && (url.split('#')[0] === Get_1.default.url('index', board))) {
                    a.href += (a.hash ? '/' : '#') + a.dataset.indexOptions;
                }
            }
        }
    },
    externalParse: function () {
        var _a, _b;
        CatalogLinks.externalList = (0, helpers_1.dict)();
        for (var _i = 0, _c = globals_1.Conf['externalCatalogURLs'].split('\n'); _i < _c.length; _i++) {
            var line = _c[_i];
            if (line[0] === '#') {
                continue;
            }
            var url = line.split(';')[0];
            var boards = Filter_1.default.parseBoards(((_a = line.match(/;boards:([^;]+)/)) === null || _a === void 0 ? void 0 : _a[1]) || '*');
            var excludes = Filter_1.default.parseBoards((_b = line.match(/;exclude:([^;]+)/)) === null || _b === void 0 ? void 0 : _b[1]) || (0, helpers_1.dict)();
            for (var board in boards) {
                if (!excludes[board] && !excludes[board.split('/')[0] + '/*']) {
                    CatalogLinks.externalList[board] = url;
                }
            }
        }
    },
    external: function (_a) {
        var siteID = _a.siteID, boardID = _a.boardID;
        if (!CatalogLinks.externalList) {
            CatalogLinks.externalParse();
        }
        var external = (CatalogLinks.externalList["".concat(siteID, "/").concat(boardID)] || CatalogLinks.externalList["".concat(siteID, "/*")]);
        if (external) {
            return external.replace(/%board/g, boardID);
        }
        else {
            return undefined;
        }
    },
    jsonIndex: function (board, hash) {
        if ((globals_1.g.SITE.ID === board.siteID) && (globals_1.g.BOARD.ID === board.boardID) && (globals_1.g.VIEW === 'index')) {
            return hash;
        }
        else {
            return Get_1.default.url('index', board) + hash;
        }
    },
    catalog: function (board) {
        if (board === void 0) { board = globals_1.g.BOARD; }
        var external, nativeCatalog;
        if (globals_1.Conf['External Catalog'] && (external = CatalogLinks.external(board))) {
            return external;
        }
        else if (Index_1.default.enabledOn(board) && globals_1.Conf["Use ".concat(package_json_1.default.name, " Catalog")]) {
            return CatalogLinks.jsonIndex(board, '#catalog');
        }
        else if (nativeCatalog = Get_1.default.url('catalog', board)) {
            return nativeCatalog;
        }
        else {
            return CatalogLinks.external(board);
        }
    },
    index: function (board) {
        if (board === void 0) { board = globals_1.g.BOARD; }
        if (Index_1.default.enabledOn(board)) {
            return CatalogLinks.jsonIndex(board, '#index');
        }
        else {
            return Get_1.default.url('index', board);
        }
    }
};
exports.default = CatalogLinks;
