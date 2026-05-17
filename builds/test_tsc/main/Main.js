"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Main = void 0;
var Redirect_1 = require("../Archive/Redirect");
var Board_1 = require("../classes/Board");
var Callbacks_1 = require("../classes/Callbacks");
var CatalogThreadNative_1 = require("../classes/CatalogThreadNative");
var DataBoard_1 = require("../classes/DataBoard");
var Notice_1 = require("../classes/Notice");
var Post_1 = require("../classes/Post");
var SimpleDict_1 = require("../classes/SimpleDict");
var Thread_1 = require("../classes/Thread");
var Config_1 = require("../config/Config");
var Anonymize_1 = require("../Filtering/Anonymize");
var Filter_1 = require("../Filtering/Filter");
var PostHiding_1 = require("../Filtering/PostHiding");
var Recursive_1 = require("../Filtering/Recursive");
var ThreadHiding_1 = require("../Filtering/ThreadHiding");
var Index_1 = require("../General/Index");
var Settings_1 = require("../General/Settings");
var DownloadAll_1 = require("../Images/DownloadAll");
var FappeTyme_1 = require("../Images/FappeTyme");
var Gallery_1 = require("../Images/Gallery");
var ImageExpand_1 = require("../Images/ImageExpand");
var ImageHost_1 = require("../Images/ImageHost");
var ImageHover_1 = require("../Images/ImageHover");
var ImageLoader_1 = require("../Images/ImageLoader");
var Metadata_1 = require("../Images/Metadata");
var RevealSpoilers_1 = require("../Images/RevealSpoilers");
var Sauce_1 = require("../Images/Sauce");
var Volume_1 = require("../Images/Volume");
var Linkify_1 = require("../Linkification/Linkify");
var ArchiveLink_1 = require("../Menu/ArchiveLink");
var CopyTextLink_1 = require("../Menu/CopyTextLink");
var DeleteLink_1 = require("../Menu/DeleteLink");
var DownloadLink_1 = require("../Menu/DownloadLink");
var ReportLink_1 = require("../Menu/ReportLink");
var AntiAutoplay_1 = require("../Miscellaneous/AntiAutoplay");
var Banner_1 = require("../Miscellaneous/Banner");
var CatalogLinks_1 = require("../Miscellaneous/CatalogLinks");
var CustomCSS_1 = require("../Miscellaneous/CustomCSS");
var ExpandComment_1 = require("../Miscellaneous/ExpandComment");
var ExpandThread_1 = require("../Miscellaneous/ExpandThread");
var FileInfo_1 = require("../Miscellaneous/FileInfo");
var Flash_1 = require("../Miscellaneous/Flash");
var Fourchan_1 = require("../Miscellaneous/Fourchan");
var IDColor_1 = require("../Miscellaneous/IDColor");
var IDHighlight_1 = require("../Miscellaneous/IDHighlight");
var IDPostCount_1 = require("../Miscellaneous/IDPostCount");
var Keybinds_1 = require("../Miscellaneous/Keybinds");
var ModContact_1 = require("../Miscellaneous/ModContact");
var Nav_1 = require("../Miscellaneous/Nav");
var NormalizeURL_1 = require("../Miscellaneous/NormalizeURL");
var PostJumper_1 = require("../Miscellaneous/PostJumper");
var PSA_1 = require("../Miscellaneous/PSA");
var PSAHiding_1 = require("../Miscellaneous/PSAHiding");
var RelativeDates_1 = require("../Miscellaneous/RelativeDates");
var RemoveSpoilers_1 = require("../Miscellaneous/RemoveSpoilers");
var ThreadLinks_1 = require("../Miscellaneous/ThreadLinks");
var Time_1 = require("../Miscellaneous/Time");
var Tinyboard_1 = require("../Miscellaneous/Tinyboard");
var Favicon_1 = require("../Monitoring/Favicon");
var MarkNewIPs_1 = require("../Monitoring/MarkNewIPs");
var ReplyPruning_1 = require("../Monitoring/ReplyPruning");
var ThreadStats_1 = require("../Monitoring/ThreadStats");
var ThreadUpdater_1 = require("../Monitoring/ThreadUpdater");
var ThreadWatcher_1 = require("../Monitoring/ThreadWatcher");
var Unread_1 = require("../Monitoring/Unread");
var UnreadIndex_1 = require("../Monitoring/UnreadIndex");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var PassLink_1 = require("../Posting/PassLink");
var PostRedirect_1 = require("../Posting/PostRedirect");
var QR_1 = require("../Posting/QR");
var QuoteBacklink_1 = require("../Quotelinks/QuoteBacklink");
var QuoteCT_1 = require("../Quotelinks/QuoteCT");
var QuoteInline_1 = require("../Quotelinks/QuoteInline");
var QuoteOP_1 = require("../Quotelinks/QuoteOP");
var QuotePreview_1 = require("../Quotelinks/QuotePreview");
var QuoteStrikeThrough_1 = require("../Quotelinks/QuoteStrikeThrough");
var QuoteThreading_1 = require("../Quotelinks/QuoteThreading");
var QuoteYou_1 = require("../Quotelinks/QuoteYou");
var Quotify_1 = require("../Quotelinks/Quotify");
var Site_1 = require("../site/Site");
var SW_1 = require("../site/SW");
var CSS_1 = require("../css/CSS");
var package_json_1 = require("../../package.json");
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var Menu_1 = require("../Menu/Menu");
var BoardConfig_1 = require("../General/BoardConfig");
var Captcha_replace_1 = require("../Posting/Captcha.replace");
var Get_1 = require("../General/Get");
var helpers_1 = require("../platform/helpers");
var RestoreDeletedFromArchive_1 = require("../Archive/RestoreDeletedFromArchive");
var ScrollMarkers_1 = require("../Miscellaneous/ScrollMarkers");
// #region tests_enabled
var Test_1 = require("../General/Test");
exports.Main = {
    isFirstRun: false,
    jsEnabled: false,
    thisPageIsLegit: undefined,
    expectInitFinished: false,
    isMounted: false,
    addThreadsObserver: null,
    addPostsObserver: null,
    addCatalogThreadsObserver: null,
    bgColorStyle: null,
    init: function () {
        // Return if the url is exactly https://www.4chan.org, this is only the home page which has a cloudflare checking
        // system which breaks this script. Keep it in the includes so it can be found on greasy fork.
        // __cf is also a cloudflare check page
        if (location.hostname === 'www.4chan.org' || location.search.includes("__cf"))
            return;
        // XXX dwb userscripts extension reloads scripts run at document-start when replaceState/pushState is called.
        // XXX Firefox reinjects WebExtension content scripts when extension is updated / reloaded.
        try {
            var w = window;
            if (helpers_1.platform === 'crx') {
                w = (w.wrappedJSObject || w);
            }
            if ("".concat(package_json_1.default.name, " antidup") in w) {
                return;
            }
            w["".concat(package_json_1.default.name, " antidup")] = true;
        }
        catch (error) { }
        // Don't run inside ad iframes.
        try {
            if (window.frameElement && ['', 'about:blank'].includes(window.frameElement.src)) {
                return;
            }
        }
        catch (error1) { }
        // Detect multiple copies of 4chan X
        if (globals_1.doc && _1.default.hasClass(globals_1.doc, 'fourchan-x')) {
            return;
        }
        _1.default.asap(globals_1.docSet, function () {
            _1.default.addClass(globals_1.doc, 'fourchan-xt', 'fourchan-x', 'seaweedchan');
            if (_1.default.engine)
                _1.default.addClass(globals_1.doc, "ua-".concat(_1.default.engine));
            BoardConfig_1.default.ready(function () {
                var _a;
                if (((_a = globals_1.g.BOARD) === null || _a === void 0 ? void 0 : _a.config.ws_board) != null)
                    _1.default.addClass(globals_1.doc, globals_1.g.BOARD.config.ws_board ? 'ws' : 'nws');
            });
        });
        try {
            _1.default.global('exposeVersion', { version: globals_1.g.VERSION, buildDate: globals_1.g.VERSION_DATE.getTime().toString() });
        }
        catch (e) {
            console.error(e);
        }
        _1.default.on(globals_1.d, '4chanXInitFinished', function () {
            if (exports.Main.expectInitFinished) {
                return delete exports.Main.expectInitFinished;
            }
            else {
                new Notice_1.default('error', "Error: Multiple copies of ".concat(package_json_1.default.name, " or 4chan X are enabled."));
                return _1.default.addClass(globals_1.doc, 'tainted');
            }
        });
        // Detect "mounted" event from Kissu
        var mountedCB = function () {
            globals_1.d.removeEventListener('mounted', mountedCB, true);
            exports.Main.isMounted = true;
            exports.Main.mountedCBs.map(function (cb) {
                return (function () {
                    try {
                        return cb();
                    }
                    catch (error2) { }
                })();
            });
        };
        globals_1.d.addEventListener('mounted', mountedCB, true);
        // Flatten default values from Config into Conf
        var flatten = function (parent, obj) {
            if (obj instanceof Array) {
                globals_1.Conf[parent] = helpers_1.dict.clone(obj[0]);
            }
            else if (typeof obj === 'object') {
                for (var key in obj) {
                    flatten(key, obj[key]);
                }
            }
            else { // string or number
                globals_1.Conf[parent] = obj;
            }
        };
        // XXX Remove document-breaking ad
        if (location.hostname === 'boards.4chan.org') {
            _1.default.asap(globals_1.docSet, function () { return _1.default.onExists(globals_1.doc, 'iframe[srcdoc]', _1.default.rm); });
        }
        flatten(null, Config_1.default);
        for (var _i = 0, _a = DataBoard_1.default.keys; _i < _a.length; _i++) {
            var db = _a[_i];
            globals_1.Conf[db] = (0, helpers_1.dict)();
        }
        globals_1.Conf['customTitles'] = helpers_1.dict.clone({ '4chan.org': { boards: { 'qa': { 'boardTitle': { orig: '/qa/ - Question & Answer', title: '/qa/ - 2D/Random' } } } } });
        globals_1.Conf['boardConfig'] = { boards: (0, helpers_1.dict)() };
        globals_1.Conf['archives'] = Redirect_1.default.archives;
        globals_1.Conf['selectedArchives'] = (0, helpers_1.dict)();
        globals_1.Conf['cooldowns'] = (0, helpers_1.dict)();
        globals_1.Conf['Index Sort'] = (0, helpers_1.dict)();
        for (var i = 0; i < 2; i++) {
            globals_1.Conf["Last Long Reply Thresholds ".concat(i)] = (0, helpers_1.dict)();
        }
        globals_1.Conf['siteProperties'] = (0, helpers_1.dict)();
        // XXX old key names
        globals_1.Conf['Except Archives from Encryption'] = false;
        globals_1.Conf['JSON Navigation'] = true;
        globals_1.Conf['Oekaki Links'] = true;
        globals_1.Conf['Show Name and Subject'] = false;
        globals_1.Conf['QR Shortcut'] = true;
        globals_1.Conf['Bottom QR Link'] = true;
        globals_1.Conf['Toggleable Thread Watcher'] = true;
        globals_1.Conf['siteSoftware'] = '';
        globals_1.Conf['Use Faster Image Host'] = 'true';
        globals_1.Conf['Captcha Fixes'] = true;
        globals_1.Conf['captchaServiceDomain'] = '';
        globals_1.Conf['captchaServiceKey'] = (0, helpers_1.dict)();
        // Enforce JS whitelist
        if (/\.4chan(?:nel)?\.org$/.test(location.hostname) &&
            !SW_1.default.yotsuba.regexp.pass.test(location.href) &&
            !SW_1.default.yotsuba.regexp.captcha.test(location.href) &&
            !(0, __1.default)('script:not([src])', globals_1.d).filter(function (s) { return /this\[/.test(s.textContent); }).length) {
            (_1.default.getSync || _1.default.get)({ 'jsWhitelist': globals_1.Conf['jsWhitelist'] }, function (_a) {
                var jsWhitelist = _a.jsWhitelist;
                var parsedList = jsWhitelist.replace(/^#.*$/mg, '').replace(/[\s;]+/g, ' ').trim();
                if (/\S/.test(parsedList))
                    _1.default.addCSP("script-src ".concat(parsedList));
            });
        }
        // Get saved values as items
        var items = (0, helpers_1.dict)();
        for (var key in globals_1.Conf)
            items[key] = undefined;
        items['previousversion'] = undefined;
        (_1.default.getSync || _1.default.get)(items, function (items) {
            _1.default.asap(globals_1.docSet, function () {
                var _a;
                // Don't hide the local storage warning behind a settings panel.
                if (_1.default.cantSet) {
                    // pass
                    // Fresh install
                }
                else if ((items.previousversion == null)) {
                    exports.Main.isFirstRun = true;
                    exports.Main.ready(function () {
                        _1.default.set('previousversion', globals_1.g.VERSION);
                        return Settings_1.default.open(null);
                    });
                    // Migrate old settings
                }
                else if (items.previousversion !== globals_1.g.VERSION) {
                    exports.Main.upgrade(items);
                }
                // Combine default values with saved values
                for (var key in globals_1.Conf) {
                    globals_1.Conf[key] = (_a = items[key]) !== null && _a !== void 0 ? _a : globals_1.Conf[key];
                }
                Site_1.default.init(exports.Main.initFeatures);
            });
        });
    },
    upgrade: function (items) {
        var previousversion = items.previousversion;
        var changes = Settings_1.default.upgrade(items, previousversion);
        items.previousversion = (changes.previousversion = globals_1.g.VERSION);
        return _1.default.set(changes, function () {
            var _a;
            if ((_a = items['Show Updated Notifications']) !== null && _a !== void 0 ? _a : true) {
                var el = _1.default.el('span', { innerHTML: "".concat(package_json_1.default.name, " has been updated to <a href=\"").concat(package_json_1.default.changelog, "\" target=\"_blank\">version ").concat(globals_1.g.VERSION, "</a>.") });
                return new Notice_1.default('info', el, 15);
            }
        });
    },
    parseURL: function (site, url) {
        var _a, _b;
        if (site === void 0) { site = globals_1.g.SITE; }
        if (url === void 0) { url = location; }
        var r = {};
        if (!site) {
            return r;
        }
        r.siteID = site.ID;
        if ((_a = site.isBoardlessPage) === null || _a === void 0 ? void 0 : _a.call(site, url)) {
            return r;
        }
        var pathname = url.pathname.split(/\/+/);
        r.boardID = pathname[1];
        if (site.isFileURL(url)) {
            r.VIEW = 'file';
        }
        else if ((_b = site.isAuxiliaryPage) === null || _b === void 0 ? void 0 : _b.call(site, url)) {
            // pass
        }
        else if (['thread', 'res'].includes(pathname[2])) {
            r.VIEW = 'thread';
            r.threadID = (r.THREADID = +pathname[3].replace(/\.\w+$/, ''));
        }
        else if ((pathname[2] === 'archive') && (pathname[3] === 'res')) {
            r.VIEW = 'thread';
            r.threadID = (r.THREADID = +pathname[4].replace(/\.\w+$/, ''));
            r.threadArchived = true;
        }
        else if (/^(?:catalog|archive)(?:\.\w+)?$/.test(pathname[2])) {
            r.VIEW = pathname[2].replace(/\.\w+$/, '');
        }
        else if (/^(?:index|\d*)(?:\.\w+)?$/.test(pathname[2])) {
            r.VIEW = 'index';
        }
        return r;
    },
    initFeatures: function () {
        var _a, _b;
        _1.default.global('initMain');
        exports.Main.jsEnabled = _1.default.hasClass(globals_1.doc, 'js-enabled');
        _1.default.extend(globals_1.g, exports.Main.parseURL());
        if (globals_1.g.boardID) {
            globals_1.g.BOARD = new Board_1.default(globals_1.g.boardID);
        }
        if (!globals_1.g.VIEW) {
            (_b = (_a = globals_1.g.SITE).initAuxiliary) === null || _b === void 0 ? void 0 : _b.call(_a);
            return;
        }
        if (globals_1.g.VIEW === 'file') {
            _1.default.asap((function () { return globals_1.d.readyState !== 'loading'; }), function () {
                var _a, _b;
                var video;
                if ((globals_1.g.SITE.software === 'yotsuba') && globals_1.Conf['404 Redirect'] && ((_b = (_a = globals_1.g.SITE).is404) === null || _b === void 0 ? void 0 : _b.call(_a))) {
                    var pathname = location.pathname.split(/\/+/);
                    return Redirect_1.default.navigate('file', {
                        boardID: globals_1.g.BOARD.ID,
                        filename: pathname[pathname.length - 1]
                    }, '');
                }
                else if (video = (0, _1.default)('video')) {
                    if (globals_1.Conf['Volume in New Tab']) {
                        Volume_1.default.setup(video);
                    }
                    if (globals_1.Conf['Loop in New Tab']) {
                        video.loop = true;
                        video.controls = true;
                        video.play();
                    }
                }
            });
            return;
        }
        globals_1.g.threads = new SimpleDict_1.default();
        globals_1.g.posts = new SimpleDict_1.default();
        // set up CSS when <head> is completely loaded
        _1.default.onExists(globals_1.doc, 'body', exports.Main.initStyle);
        // c.time 'All initializations'
        for (var _i = 0, _c = exports.Main.features; _i < _c.length; _i++) {
            var _d = _c[_i], name_1 = _d[0], feature = _d[1];
            if (globals_1.g.SITE.disabledFeatures && globals_1.g.SITE.disabledFeatures.includes(name_1)) {
                continue;
            }
            // c.time "#{name} initialization"
            try {
                feature.init();
            }
            catch (err) {
                exports.Main.handleErrors({
                    message: "\"".concat(name_1, "\" initialization crashed."),
                    error: err
                });
            }
        }
        // finally
        //   c.timeEnd "#{name} initialization"
        // c.timeEnd 'All initializations'
        return _1.default.ready(exports.Main.initReady);
    },
    initStyle: function () {
        if (!exports.Main.isThisPageLegit()) {
            return;
        }
        // disable the mobile layout
        var mobileLink = (0, _1.default)('link[href*=mobile]', globals_1.d.head);
        if (mobileLink)
            mobileLink.disabled = true;
        globals_1.doc.dataset.host = location.host;
        _1.default.addClass(globals_1.doc, "sw-".concat(globals_1.g.SITE.software));
        _1.default.addClass(globals_1.doc, globals_1.g.VIEW === 'thread' ? 'thread-view' : globals_1.g.VIEW);
        _1.default.onExists(globals_1.doc, '.ad-cnt, .adg-rects > .desktop', function (ad) { return _1.default.onExists(ad, 'img, iframe', function () { return _1.default.addClass(globals_1.doc, 'ads-loaded'); }); });
        if (globals_1.Conf['Autohiding Scrollbar']) {
            _1.default.addClass(globals_1.doc, 'autohiding-scrollbar');
        }
        _1.default.ready(function () {
            if ((globals_1.d.body.clientHeight > globals_1.doc.clientHeight) && ((window.innerWidth === globals_1.doc.clientWidth) !== globals_1.Conf['Autohiding Scrollbar'])) {
                globals_1.Conf['Autohiding Scrollbar'] = !globals_1.Conf['Autohiding Scrollbar'];
                _1.default.set('Autohiding Scrollbar', globals_1.Conf['Autohiding Scrollbar']);
                return _1.default.toggleClass(globals_1.doc, 'autohiding-scrollbar');
            }
        });
        _1.default.addStyle(CSS_1.default.sub(CSS_1.default.boards), 'fourchanx-css');
        exports.Main.bgColorStyle = _1.default.el('style', { id: 'fourchanx-bgcolor-css' });
        return exports.Main.setClass();
    },
    setClass: function () {
        var _a;
        var mainStyleSheet, style, styleSheets;
        var knownStyles = ['yotsuba', 'yotsuba-b', 'futaba', 'burichan', 'photon', 'tomorrow', 'spooky'];
        if ((globals_1.g.SITE.software === 'yotsuba') && (globals_1.g.VIEW === 'catalog')) {
            if (mainStyleSheet = _1.default.id('base-css')) {
                style = (_a = mainStyleSheet.href.match(/catalog_(\w+)/)) === null || _a === void 0 ? void 0 : _a[1].replace('_new', '').replace(/_+/g, '-');
                if (knownStyles.includes(style)) {
                    _1.default.addClass(globals_1.doc, style);
                    return;
                }
            }
        }
        style = (mainStyleSheet = (styleSheets = null));
        var setStyle = function () {
            // Use preconfigured CSS for 4chan's default themes.
            if (globals_1.g.SITE.software === 'yotsuba') {
                _1.default.rmClass(globals_1.doc, style);
                style = null;
                for (var _i = 0, styleSheets_1 = styleSheets; _i < styleSheets_1.length; _i++) {
                    var styleSheet = styleSheets_1[_i];
                    if (!styleSheet.disabled) {
                        style = styleSheet.title.toLowerCase().replace('new', '').trim().replace(/\s+/g, '-');
                        if (style === '_special') {
                            style = styleSheet.href.match(/[a-z]*(?=[^/]*$)/)[0];
                        }
                        if (!knownStyles.includes(style)) {
                            style = null;
                        }
                        break;
                    }
                }
                if (style) {
                    _1.default.addClass(globals_1.doc, style);
                    _1.default.rm(exports.Main.bgColorStyle);
                    return;
                }
            }
            // Determine proper dialog background color for other themes.
            var div = globals_1.g.SITE.bgColoredEl();
            div.style.position = 'absolute';
            div.style.visibility = 'hidden';
            _1.default.add(globals_1.d.body, div);
            var bgColor = window.getComputedStyle(div).backgroundColor;
            _1.default.rm(div);
            var rgb = bgColor.match(/[\d.]+/g);
            // Use body background if reply background is transparent
            if (!/^rgb\(/.test(bgColor)) {
                var s = window.getComputedStyle(globals_1.d.body);
                bgColor = "".concat(s.backgroundColor, " ").concat(s.backgroundImage, " ").concat(s.backgroundRepeat, " ").concat(s.backgroundPosition);
            }
            var css = ".dialog, .suboption-list > div:last-of-type, :root.catalog-hover-expand .catalog-container:hover > .post {\n  background: ".concat(bgColor, ";\n}\n.unread-mark-read {\n  background-color: rgba(").concat(rgb.slice(0, 3).join(', '), ", ").concat(0.5 * (parseFloat(rgb[3]) || 1), ");\n}");
            if (_1.default.luma(rgb) < 100) {
                css += '.watch-thread-link { --xt-watcher: #c8c8c8 }';
            }
            exports.Main.bgColorStyle.textContent = css;
            return _1.default.after(_1.default.id('fourchanx-css'), exports.Main.bgColorStyle);
        };
        _1.default.onExists(globals_1.d.head, globals_1.g.SITE.selectors.styleSheet, function () {
            styleSheets = (0, __1.default)(globals_1.g.SITE.selectors.styleSheet, globals_1.d.head);
            if (globals_1.g.SITE.software === 'yotsuba') {
                var observer = new MutationObserver(setStyle);
                for (var _i = 0, styleSheets_2 = styleSheets; _i < styleSheets_2.length; _i++) {
                    var styleSheet = styleSheets_2[_i];
                    _1.default.on(styleSheet, 'load', setStyle);
                    observer.observe(styleSheet, {
                        attributes: true,
                        attributeFilter: ['disabled']
                    });
                }
            }
            return setStyle();
        });
    },
    initReady: function () {
        var _a, _b, _c, _d;
        if ((_b = (_a = globals_1.g.SITE).is404) === null || _b === void 0 ? void 0 : _b.call(_a)) {
            if (globals_1.g.VIEW === 'thread') {
                ThreadWatcher_1.default.set404(globals_1.g.BOARD.ID, globals_1.g.THREADID, function () {
                    if (globals_1.Conf['404 Redirect']) {
                        return Redirect_1.default.navigate('thread', {
                            boardID: globals_1.g.BOARD.ID,
                            threadID: globals_1.g.THREADID,
                            postID: +location.hash.match(/\d+/)
                        } // post number or 0
                        , "/".concat(globals_1.g.BOARD, "/"));
                    }
                });
            }
            return;
        }
        if ((_d = (_c = globals_1.g.SITE).isIncomplete) === null || _d === void 0 ? void 0 : _d.call(_c)) {
            var msg = _1.default.el('div', { innerHTML: 'The page didn&#039;t load completely.<br>Some features may not work unless you <a href="javascript:;">reload</a>.' });
            _1.default.on((0, _1.default)('a', msg), 'click', function () { return location.reload(); });
            new Notice_1.default('warning', msg);
        }
        // Parse HTML or skip it and start building from JSON.
        if (globals_1.g.VIEW === 'catalog') {
            exports.Main.initCatalog();
        }
        else if (!Index_1.default.enabled) {
            if (globals_1.g.SITE.awaitBoard) {
                globals_1.g.SITE.awaitBoard(exports.Main.initThread);
            }
            else {
                exports.Main.initThread();
            }
        }
        else {
            exports.Main.expectInitFinished = true;
            _1.default.event('4chanXInitFinished', null);
        }
    },
    initThread: function () {
        var _a, _b, _c, _d, _e;
        var board;
        var s = globals_1.g.SITE.selectors;
        if (board = (0, _1.default)((((_a = s.boardFor) === null || _a === void 0 ? void 0 : _a[globals_1.g.VIEW]) || s.board))) {
            var threads_1 = [];
            var posts_1 = [];
            var errors = [];
            try {
                (_c = (_b = globals_1.g.SITE).preParsingFixes) === null || _c === void 0 ? void 0 : _c.call(_b, board);
            }
            catch (error) { }
            exports.Main.addThreadsObserver = new MutationObserver(exports.Main.addThreads);
            exports.Main.addPostsObserver = new MutationObserver(exports.Main.addPosts);
            exports.Main.addThreadsObserver.observe(board, { childList: true });
            exports.Main.parseThreads((0, __1.default)(s.thread, board), threads_1, posts_1, errors);
            if (errors.length) {
                exports.Main.handleErrors(errors);
            }
            if (globals_1.g.VIEW === 'thread') {
                if (globals_1.g.threadArchived) {
                    threads_1[0].isArchived = true;
                    threads_1[0].kill();
                }
                (_e = (_d = globals_1.g.SITE).parseThreadMetadata) === null || _e === void 0 ? void 0 : _e.call(_d, threads_1[0]);
            }
            setTimeout(function () {
                exports.Main.callbackNodes('Thread', threads_1);
                exports.Main.callbackNodesDB('Post', posts_1, function () {
                    for (var _i = 0, posts_2 = posts_1; _i < posts_2.length; _i++) {
                        var post = posts_2[_i];
                        QuoteThreading_1.default.insert(post);
                    }
                    exports.Main.expectInitFinished = true;
                    _1.default.event('4chanXInitFinished', null);
                });
            }, 0);
        }
        else {
            exports.Main.expectInitFinished = true;
            _1.default.event('4chanXInitFinished', null);
        }
    },
    parseThreads: function (threadRoots, threads, posts, errors) {
        var _a;
        var _loop_1 = function (threadRoot) {
            var boardObj = (function () {
                var boardID;
                if (boardID = threadRoot.dataset.board) {
                    boardID = encodeURIComponent(boardID);
                    return globals_1.g.boards[boardID] || new Board_1.default(boardID);
                }
                else {
                    return globals_1.g.BOARD;
                }
            })();
            var threadID = +threadRoot.id.match(/\d*$/)[0];
            if (!threadID || ((_a = boardObj.threads.get(threadID)) === null || _a === void 0 ? void 0 : _a.nodes.root)) {
                return { value: void 0 };
            }
            var thread = new Thread_1.default(threadID, boardObj);
            thread.nodes.root = threadRoot;
            threads.push(thread);
            var postRoots = (0, __1.default)(globals_1.g.SITE.selectors.postContainer, threadRoot);
            if (globals_1.g.SITE.isOPContainerThread) {
                postRoots.unshift(threadRoot);
            }
            exports.Main.parsePosts(postRoots, thread, posts, errors);
            exports.Main.addPostsObserver.observe(threadRoot, { childList: true });
        };
        for (var _i = 0, threadRoots_1 = threadRoots; _i < threadRoots_1.length; _i++) {
            var threadRoot = threadRoots_1[_i];
            var state_1 = _loop_1(threadRoot);
            if (typeof state_1 === "object")
                return state_1.value;
        }
    },
    parsePosts: function (postRoots, thread, posts, errors) {
        for (var _i = 0, postRoots_1 = postRoots; _i < postRoots_1.length; _i++) {
            var postRoot = postRoots_1[_i];
            if (!(postRoot.dataset.fullID && globals_1.g.posts.get(postRoot.dataset.fullID)) && (0, _1.default)(globals_1.g.SITE.selectors.comment, postRoot)) {
                try {
                    posts.push(new Post_1.default(postRoot, thread, thread.board));
                }
                catch (err) {
                    // Skip posts that we failed to parse.
                    errors.push({
                        message: "Parsing of Post No.".concat(postRoot.id.match(/\d+/), " failed. Post will be skipped."),
                        error: err,
                        html: postRoot.outerHTML
                    });
                }
            }
        }
    },
    addThreads: function (records) {
        var threadRoots = [];
        for (var _i = 0, records_1 = records; _i < records_1.length; _i++) {
            var record = records_1[_i];
            for (var _a = 0, _b = record.addedNodes; _a < _b.length; _a++) {
                var node = _b[_a];
                if ((node.nodeType === Node.ELEMENT_NODE) && node.matches(globals_1.g.SITE.selectors.thread)) {
                    threadRoots.push(node);
                }
            }
        }
        if (!threadRoots.length) {
            return;
        }
        var threads = [];
        var posts = [];
        var errors = [];
        exports.Main.parseThreads(threadRoots, threads, posts, errors);
        if (errors.length) {
            exports.Main.handleErrors(errors);
        }
        exports.Main.callbackNodes('Thread', threads);
        exports.Main.callbackNodesDB('Post', posts, function () { return _1.default.event('PostsInserted', null, records[0].target); });
    },
    addPosts: function (records) {
        var _a;
        var thread;
        var threads = [];
        var threadsRM = [];
        var posts = [];
        var errors = [];
        for (var _i = 0, records_2 = records; _i < records_2.length; _i++) {
            var record = records_2[_i];
            thread = Get_1.default.threadFromRoot(record.target);
            var postRoots = [];
            for (var _b = 0, _c = record.addedNodes; _b < _c.length; _b++) {
                var node = _c[_b];
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches(globals_1.g.SITE.selectors.postContainer) || (node = (0, _1.default)(globals_1.g.SITE.selectors.postContainer, node))) {
                        postRoots.push(node);
                    }
                }
            }
            var n = posts.length;
            exports.Main.parsePosts(postRoots, thread, posts, errors);
            if ((posts.length > n) && !threads.includes(thread)) {
                threads.push(thread);
            }
            var anyRemoved = false;
            for (var _d = 0, _e = record.removedNodes; _d < _e.length; _d++) {
                var el = _e[_d];
                if ((((_a = Get_1.default.postFromRoot(el)) === null || _a === void 0 ? void 0 : _a.nodes.root) === el) && !globals_1.doc.contains(el)) {
                    anyRemoved = true;
                    break;
                }
            }
            if (anyRemoved && !threadsRM.includes(thread)) {
                threadsRM.push(thread);
            }
        }
        if (errors.length) {
            exports.Main.handleErrors(errors);
        }
        exports.Main.callbackNodesDB('Post', posts, function () {
            for (var _i = 0, threads_2 = threads; _i < threads_2.length; _i++) {
                thread = threads_2[_i];
                _1.default.event('PostsInserted', null, thread.nodes.root);
            }
            for (var _a = 0, threadsRM_1 = threadsRM; _a < threadsRM_1.length; _a++) {
                thread = threadsRM_1[_a];
                _1.default.event('PostsRemoved', null, thread.nodes.root);
            }
        });
    },
    initCatalog: function () {
        var board;
        var s = globals_1.g.SITE.selectors.catalog;
        if (s && (board = (0, _1.default)(s.board))) {
            var threads = [];
            var errors = [];
            exports.Main.addCatalogThreadsObserver = new MutationObserver(exports.Main.addCatalogThreads);
            exports.Main.addCatalogThreadsObserver.observe(board, { childList: true });
            exports.Main.parseCatalogThreads((0, __1.default)(s.thread, board), threads, errors);
            if (errors.length) {
                exports.Main.handleErrors(errors);
            }
            exports.Main.callbackNodes('CatalogThreadNative', threads);
        }
        exports.Main.expectInitFinished = true;
        _1.default.event('4chanXInitFinished', null);
    },
    parseCatalogThreads: function (threadRoots, threads, errors) {
        var _a;
        for (var _i = 0, threadRoots_2 = threadRoots; _i < threadRoots_2.length; _i++) {
            var threadRoot = threadRoots_2[_i];
            try {
                var thread = new CatalogThreadNative_1.default(threadRoot);
                if (((_a = thread.thread.catalogViewNative) === null || _a === void 0 ? void 0 : _a.nodes.root) !== threadRoot) {
                    thread.thread.catalogViewNative = thread;
                    threads.push(thread);
                }
            }
            catch (err) {
                // Skip threads that we failed to parse.
                errors.push({
                    message: "Parsing of Catalog Thread No.".concat((threadRoot.dataset.id || threadRoot.id).match(/\d+/), " failed. Thread will be skipped."),
                    error: err,
                    html: threadRoot.outerHTML
                });
            }
        }
    },
    addCatalogThreads: function (records) {
        var threadRoots = [];
        for (var _i = 0, records_3 = records; _i < records_3.length; _i++) {
            var record = records_3[_i];
            for (var _a = 0, _b = record.addedNodes; _a < _b.length; _a++) {
                var node = _b[_a];
                if ((node.nodeType === Node.ELEMENT_NODE) && node.matches(globals_1.g.SITE.selectors.catalog.thread)) {
                    threadRoots.push(node);
                }
            }
        }
        if (!threadRoots.length) {
            return;
        }
        var threads = [];
        var errors = [];
        exports.Main.parseCatalogThreads(threadRoots, threads, errors);
        if (errors.length) {
            exports.Main.handleErrors(errors);
        }
        return exports.Main.callbackNodes('CatalogThreadNative', threads);
    },
    callbackNodes: function (klass, nodes) {
        var node;
        var i = 0;
        var cb = Callbacks_1.default[klass];
        while ((node = nodes[i++])) {
            cb.execute(node);
        }
    },
    callbackNodesDB: function (klass, nodes, cb) {
        var i = 0;
        var cbs = Callbacks_1.default[klass];
        var fn = function () {
            var node;
            if (!(node = nodes[i])) {
                return false;
            }
            cbs.execute(node);
            return ++i % 250;
        };
        var softTask = function () {
            while (fn()) {
                continue;
            }
            if (!nodes[i]) {
                if (cb) {
                    cb();
                }
                return;
            }
            setTimeout(softTask, 0);
        };
        softTask();
    },
    handleErrors: function (errors) {
        // Detect conflicts with 4chan X v2
        var error;
        if (globals_1.d.body && _1.default.hasClass(globals_1.d.body, 'fourchan_x') && !_1.default.hasClass(globals_1.doc, 'tainted')) {
            new Notice_1.default('error', "Error: Multiple copies of ".concat(package_json_1.default.name, " or 4chan X are enabled."));
            _1.default.addClass(globals_1.doc, 'tainted');
        }
        // Detect conflicts with native extension
        if (globals_1.g.SITE.testNativeExtension && !_1.default.hasClass(globals_1.doc, 'tainted')) {
            globals_1.g.SITE.testNativeExtension().then(function (_a) {
                var enabled = _a.enabled;
                if (enabled) {
                    _1.default.addClass(globals_1.doc, 'tainted');
                    if (globals_1.Conf['Disable Native Extension'] && !exports.Main.isFirstRun) {
                        var msg = _1.default.el('div', { innerHTML: 'Failed to disable the native extension. You may need to <a href="' + (0, globals_1.E)(package_json_1.default.upstreamFaq) +
                                '#blocking-native-extension" target="_blank">block it</a>.' });
                        new Notice_1.default('error', msg);
                    }
                }
            });
        }
        if (!(errors instanceof Array)) {
            error = errors;
        }
        else if (errors.length === 1) {
            error = errors[0];
        }
        if (error) {
            new Notice_1.default('error', exports.Main.parseError(error, exports.Main.reportLink([error])), 15);
            return;
        }
        var div = _1.default.el('div', {
            innerHTML: "".concat(errors.length, " errors occurred.").concat(exports.Main.reportLink(errors).innerHTML, " [<a href=\"javascript:;\">show</a>]")
        });
        _1.default.on(div.lastElementChild, 'click', function () {
            var _a;
            return _a = this.textContent === 'show' ? ['hide', false] : ['show', true], this.textContent = _a[0], logs.hidden = _a[1], _a;
        });
        var logs = _1.default.el('div', { hidden: true });
        for (var _i = 0, _a = errors; _i < _a.length; _i++) {
            error = _a[_i];
            _1.default.add(logs, exports.Main.parseError(error));
        }
        return new Notice_1.default('error', [div, logs], 30);
    },
    parseError: function (data, reportLink) {
        var _a, _b;
        globals_1.c.error(data.message, data.error.stack);
        var message = _1.default.el('div', { innerHTML: (0, globals_1.E)(data.message) + ((reportLink) ? (reportLink).innerHTML : "") });
        var error = _1.default.el('div', { textContent: "".concat(data.error.name || 'Error', ": ").concat(data.error.message || 'see console for details') });
        var lines = ((_b = (_a = data.error.stack) === null || _a === void 0 ? void 0 : _a.match(/\d+(?=:\d+\)?$)/mg)) === null || _b === void 0 ? void 0 : _b.join().replace(/^/, ' at ')) || '';
        var context = _1.default.el('div', { textContent: "(".concat(package_json_1.default.name, " ").concat(package_json_1.default.fork, " v").concat(globals_1.g.VERSION, " ").concat(helpers_1.platform, " on ").concat(_1.default.engine).concat(lines, ")") });
        return [message, error, context];
    },
    reportLink: function (errors) {
        var info;
        var data = errors[0];
        var title = data.message;
        if (errors.length > 1) {
            title += " (+".concat(errors.length - 1, " other errors)");
        }
        var details = '';
        var addDetails = function (text) {
            if (encodeURIComponent(title + details + text + '\n').length <= package_json_1.default.newIssueMaxLength - package_json_1.default.newIssue.replace(/%(title|details)/, '').length) {
                return details += text + '\n';
            }
        };
        addDetails("[Please describe the steps needed to reproduce this error.]\n\nScript: ".concat(package_json_1.default.name, " ").concat(package_json_1.default.fork, " v").concat(globals_1.g.VERSION, " ").concat(helpers_1.platform, "\nURL: ").concat(location.href, "\nUser agent: ").concat(navigator.userAgent));
        if ((helpers_1.platform === 'userscript') && (info = (function () {
            if (typeof GM !== 'undefined' && GM !== null) {
                return GM.info;
            }
            else {
                if (typeof GM_info !== 'undefined' && GM_info !== null) {
                    return GM_info;
                }
            }
        })())) {
            addDetails("Userscript manager: ".concat(info.scriptHandler, " ").concat(info.version));
        }
        addDetails('\n' + data.error);
        if (data.error.stack) {
            addDetails(data.error.stack.replace(data.error.toString(), '').trim());
        }
        if (data.html) {
            addDetails('\n`' + data.html + '`');
        }
        details = details.replace(/file:\/{3}.+\//g, ''); // Remove local file paths
        var url = package_json_1.default.newIssue.replace('%title', encodeURIComponent(title)).replace('%details', encodeURIComponent(details));
        return { innerHTML: "<span class=\"report-error\"> [<a href=\"".concat(url, "\" target=\"_blank\">report</a>]</span>") };
    },
    isThisPageLegit: function () {
        // not 404 error page or similar.
        if (exports.Main.thisPageIsLegit === undefined) {
            exports.Main.thisPageIsLegit = globals_1.g.SITE.isThisPageLegit ?
                globals_1.g.SITE.isThisPageLegit()
                :
                    !/^[45]\d\d\b/.test(document.title) && !/\.(?:json|rss)$/.test(location.pathname);
        }
        return exports.Main.thisPageIsLegit;
    },
    ready: function (cb) {
        return _1.default.ready(function () {
            if (exports.Main.isThisPageLegit()) {
                return cb();
            }
        });
    },
    mounted: function (cb) {
        if (exports.Main.isMounted) {
            cb();
        }
        else {
            exports.Main.mountedCBs.push(cb);
        }
    },
    mountedCBs: [],
    features: [
        ['Board Configuration', BoardConfig_1.default],
        ['Normalize URL', NormalizeURL_1.default],
        ['Delay Redirect on Post', PostRedirect_1.default],
        ['Captcha Configuration', Captcha_replace_1.default],
        ['Image Host Rewriting', ImageHost_1.default],
        ['Redirect', Redirect_1.default],
        ['Header', Header_1.default],
        ['Catalog Links', CatalogLinks_1.default],
        ['Settings', Settings_1.default],
        ['Index Generator', Index_1.default],
        ['Disable Autoplay', AntiAutoplay_1.default],
        ['Announcement Hiding', PSAHiding_1.default],
        ['Fourchan thingies', Fourchan_1.default],
        ['Tinyboard Glue', Tinyboard_1.default],
        ['Color User IDs', IDColor_1.default],
        ['Highlight by User ID', IDHighlight_1.default],
        ['Count Posts by ID', IDPostCount_1.default],
        ['Custom CSS', CustomCSS_1.default],
        ['Thread Links', ThreadLinks_1.default],
        ['Linkify', Linkify_1.default],
        ['Reveal Spoilers', RemoveSpoilers_1.default],
        ['Resurrect Quotes', Quotify_1.default],
        ['Filter', Filter_1.default],
        ['Thread Hiding Buttons', ThreadHiding_1.default],
        ['Reply Hiding Buttons', PostHiding_1.default],
        ['Recursive', Recursive_1.default],
        ['Strike-through Quotes', QuoteStrikeThrough_1.default],
        ['Quick Reply Personas', QR_1.default.persona],
        ['Quick Reply', QR_1.default],
        ['Cooldown', QR_1.default.cooldown],
        ['Post Jumper', PostJumper_1.default],
        ['Pass Link', PassLink_1.default],
        ['Menu', Menu_1.default],
        ['Index Generator (Menu)', Index_1.default.menu],
        ['Report Link', ReportLink_1.default],
        ['Copy Text Link', CopyTextLink_1.default],
        ['Thread Hiding (Menu)', ThreadHiding_1.default.menu],
        ['Reply Hiding (Menu)', PostHiding_1.default.menu],
        ['Delete Link', DeleteLink_1.default],
        ['Filter (Menu)', Filter_1.default.menu],
        ['Edit Link', QR_1.default.oekaki.menu],
        ['Download Link', DownloadLink_1.default],
        ['Archive Link', ArchiveLink_1.default],
        ['Quote Inlining', QuoteInline_1.default],
        ['Quote Previewing', QuotePreview_1.default],
        ['Quote Backlinks', QuoteBacklink_1.default],
        ['Mark Quotes of You', QuoteYou_1.default],
        ['Mark OP Quotes', QuoteOP_1.default],
        ['Mark Cross-thread Quotes', QuoteCT_1.default],
        ['Anonymize', Anonymize_1.default],
        ['Time Formatting', Time_1.default],
        ['Relative Post Dates', RelativeDates_1.default],
        ['File Info Formatting', FileInfo_1.default],
        ['Download All Media', DownloadAll_1.default],
        ['Fappe Tyme', FappeTyme_1.default],
        ['Gallery', Gallery_1.default],
        ['Gallery (menu)', Gallery_1.default.menu],
        ['Sauce', Sauce_1.default],
        ['Image Expansion', ImageExpand_1.default],
        ['Image Expansion (Menu)', ImageExpand_1.default.menu],
        ['Reveal Spoiler Thumbnails', RevealSpoilers_1.default],
        ['Image Loading', ImageLoader_1.default],
        ['Image Hover', ImageHover_1.default],
        ['Volume Control', Volume_1.default],
        ['WEBM Metadata', Metadata_1.default],
        ['Comment Expansion', ExpandComment_1.default],
        ['Thread Expansion', ExpandThread_1.default],
        ['Favicon', Favicon_1.default],
        ['Unread', Unread_1.default],
        ['Unread Line in Index', UnreadIndex_1.default],
        ['Quote Threading', QuoteThreading_1.default],
        ['Thread Stats', ThreadStats_1.default],
        ['Thread Updater', ThreadUpdater_1.default],
        ['Thread Watcher', ThreadWatcher_1.default],
        ['Thread Watcher (Menu)', ThreadWatcher_1.default.menu],
        ['Mark New IPs', MarkNewIPs_1.default],
        ['Index Navigation', Nav_1.default],
        ['Keybinds', Keybinds_1.default],
        ['Banner', Banner_1.default],
        ['Announcements', PSA_1.default],
        ['Flash Features', Flash_1.default],
        ['Reply Pruning', ReplyPruning_1.default],
        ['Mod Contact Links', ModContact_1.default],
        ['Restore deleted posts from archive', RestoreDeletedFromArchive_1.default],
        ['Mark posts on scroll bar', ScrollMarkers_1.default],
    ]
};
Callbacks_1.default.errorHandler = exports.Main.handleErrors;
exports.default = exports.Main;
// Avoid Rollup tree-shaking of Main and its features
if (typeof window !== 'undefined') {
    _1.default.ready(function () { return exports.Main.init(); });
}
// #region tests_enabled
exports.Main.features.push(['Build Test', Test_1.default]);
// #endregion
