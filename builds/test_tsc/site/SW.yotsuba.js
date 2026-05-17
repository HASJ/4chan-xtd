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
var Redirect_1 = require("../Archive/Redirect");
var PassMessage_1 = require("../Miscellaneous/PassMessage");
var Report_1 = require("../Miscellaneous/Report");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var Captcha_1 = require("../Posting/Captcha");
var PostSuccessful_1 = require("../Posting/PostSuccessful");
var ImageHost_1 = require("../Images/ImageHost");
var globals_1 = require("../globals/globals");
var BoardConfig_1 = require("../General/BoardConfig");
var CSS_1 = require("../css/CSS");
var PostInfoHtml_1 = require("./SW.yotsuba.Build/PostInfoHtml");
var FileHtml_1 = require("./SW.yotsuba.Build/FileHtml");
var CatalogThreadHtml_1 = require("./SW.yotsuba.Build/CatalogThreadHtml");
var jsx_1 = require("../globals/jsx");
var helpers_1 = require("../platform/helpers");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var SWYotsuba = {
    isOPContainerThread: false,
    hasIPCount: true,
    archivedBoardsKnown: true,
    urls: {
        thread: function (_a) {
            var boardID = _a.boardID, threadID = _a.threadID;
            return "".concat(location.protocol, "//").concat(BoardConfig_1.default.domain(boardID), "/").concat(boardID, "/thread/").concat(threadID);
        },
        post: function (_a) {
            var postID = _a.postID;
            return "#p".concat(postID);
        },
        index: function (_a) {
            var boardID = _a.boardID;
            return "".concat(location.protocol, "//").concat(BoardConfig_1.default.domain(boardID), "/").concat(boardID, "/");
        },
        catalog: function (_a) {
            var boardID = _a.boardID;
            if (boardID === 'f') {
                return undefined;
            }
            else {
                return "".concat(location.protocol, "//").concat(BoardConfig_1.default.domain(boardID), "/").concat(boardID, "/catalog");
            }
        },
        archive: function (_a) {
            var boardID = _a.boardID;
            if (BoardConfig_1.default.isArchived(boardID)) {
                return "".concat(location.protocol, "//").concat(BoardConfig_1.default.domain(boardID), "/").concat(boardID, "/archive");
            }
            else {
                return undefined;
            }
        },
        threadJSON: function (_a) {
            var boardID = _a.boardID, threadID = _a.threadID;
            return "".concat(location.protocol, "//a.4cdn.org/").concat(boardID, "/thread/").concat(threadID, ".json");
        },
        threadsListJSON: function (_a) {
            var boardID = _a.boardID;
            return "".concat(location.protocol, "//a.4cdn.org/").concat(boardID, "/threads.json");
        },
        archiveListJSON: function (_a) {
            var boardID = _a.boardID;
            if (BoardConfig_1.default.isArchived(boardID)) {
                return "".concat(location.protocol, "//a.4cdn.org/").concat(boardID, "/archive.json");
            }
            else {
                return '';
            }
        },
        catalogJSON: function (_a) {
            var boardID = _a.boardID;
            return "".concat(location.protocol, "//a.4cdn.org/").concat(boardID, "/catalog.json");
        },
        file: function (_a, filename) {
            var boardID = _a.boardID;
            var hostname = boardID === 'f' ? ImageHost_1.default.flashHost() : ImageHost_1.default.host();
            return "".concat(location.protocol, "//").concat(hostname, "/").concat(boardID, "/").concat(filename);
        },
        thumb: function (_a, filename) {
            var boardID = _a.boardID;
            return "".concat(location.protocol, "//").concat(ImageHost_1.default.thumbHost(), "/").concat(boardID, "/").concat(filename);
        }
    },
    isPrunedByAge: function (_a) {
        var boardID = _a.boardID;
        return boardID === 'f';
    },
    areMD5sDeferred: function (_a) {
        var boardID = _a.boardID;
        return boardID === 'f';
    },
    isOnePage: function (_a) {
        var boardID = _a.boardID;
        return boardID === 'f';
    },
    noAudio: function (_a) {
        var boardID = _a.boardID;
        return BoardConfig_1.default.noAudio(boardID);
    },
    selectors: {
        board: '.board',
        thread: '.thread',
        threadDivider: '.board > hr',
        summary: 'a.summary',
        postContainer: '.postContainer',
        replyOriginal: '.replyContainer:not([data-clone])',
        sideArrows: 'div.sideArrows',
        post: '.post',
        infoRoot: '.postInfo',
        info: {
            subject: '.subject',
            name: '.name',
            email: '.useremail',
            tripcode: '.postertrip',
            uniqueIDRoot: '.posteruid',
            uniqueID: '.posteruid > .hand',
            capcode: '.capcode.hand',
            pass: '.n-pu',
            flag: '.flag, .bfl',
            date: '.dateTime',
            nameBlock: '.nameBlock',
            quote: '.postNum > a:nth-of-type(2)',
            reply: '.replylink'
        },
        icons: {
            isSticky: '.stickyIcon',
            isClosed: '.closedIcon',
            isArchived: '.archivedIcon'
        },
        file: {
            text: '.fileText, .fileInfo',
            link: '.fileText > a',
            thumb: 'a.fileThumb > [data-md5]'
        },
        thumbLink: 'a.fileThumb',
        highlightable: {
            op: '.opContainer',
            reply: ' > .reply',
            catalog: ''
        },
        comment: '.postMessage',
        spoiler: 's',
        quotelink: ':not(pre) > .quotelink', // XXX https://github.com/4chan/4chan-JS/issues/77: 4chan currently creates quote links inside [code] tags; ignore them
        catalog: {
            board: '#threads',
            thread: '.thread',
            thumb: '.thumb'
        },
        boardList: '#boardNavDesktop > .boardList',
        boardListBottom: '#boardNavDesktopFoot > .boardList',
        styleSheet: 'link[rel*="stylesheet"][title]',
        psa: '#globalMessage',
        psaTop: '#globalToggle',
        searchBox: '#search-box',
        nav: {
            prev: '.prev > form > [type=submit]',
            next: '.next > form > [type=submit]'
        }
    },
    classes: {
        highlight: 'highlight'
    },
    xpath: {
        thread: 'div[contains(concat(" ",@class," ")," thread ")]',
        postContainer: 'div[contains(@class,"postContainer")]',
        replyContainer: 'div[contains(@class,"replyContainer")]'
    },
    regexp: {
        quotelink: new RegExp("^https?://boards\\.4chan(?:nel)?\\.org/+([^/]+)/+thread/+(\\d+)(?:[/?][^#]*)?(?:#p(\\d+))?$"),
        quotelinkHTML: /<a [^>]*\bhref="(?:(?:\/\/boards\.4chan(?:nel)?\.org)?\/([^\/]+)\/thread\/)?(\d+)?(?:#p(\d+))?"/g,
        pass: /^https?:\/\/www\.4chan(?:nel)?\.org\/+pass(?:$|[?#])/,
        captcha: /^https?:\/\/sys\.4chan(?:nel)?\.org\/+captcha(?:$|[?#])/,
    },
    bgColoredEl: function () {
        return _1.default.el('div', { className: 'reply' });
    },
    isThisPageLegit: function () {
        // not 404 error page or similar.
        return ['boards.4chan.org', 'boards.4channel.org'].includes(location.hostname) &&
            globals_1.d.doctype &&
            !(0, _1.default)('link[href*="favicon-status.ico"]', globals_1.d.head) &&
            !['4chan - Temporarily Offline', '4chan - Error', '504 Gateway Time-out', 'MathJax Equation Source'].includes(globals_1.d.title);
    },
    is404: function () {
        // XXX Sometimes threads don't 404 but are left over as stubs containing one garbage reply post.
        return ['4chan - Temporarily Offline', '4chan - 404 Not Found'].includes(globals_1.d.title) || ((globals_1.g.VIEW === 'thread') && (0, _1.default)('.board') && !(0, _1.default)('.opContainer'));
    },
    isIncomplete: function () {
        return ['index', 'thread'].includes(globals_1.g.VIEW) && !(0, _1.default)('.board + *');
    },
    isBoardlessPage: function (url) {
        return ['www.4chan.org', 'www.4channel.org'].includes(url.hostname);
    },
    isAuxiliaryPage: function (url) {
        return !['boards.4chan.org', 'boards.4channel.org'].includes(url.hostname);
    },
    isFileURL: function (url) {
        return ImageHost_1.default.test(url.hostname);
    },
    initAuxiliary: function () {
        switch (location.hostname) {
            case 'www.4chan.org':
            case 'www.4channel.org':
                if (SWYotsuba.regexp.pass.test(location.href)) {
                    PassMessage_1.default.init();
                }
                else {
                    _1.default.onExists(globals_1.doc, 'body', function () { return _1.default.addStyle(CSS_1.default.www); });
                    Captcha_1.default.replace.init();
                }
                return;
            case 'sys.4chan.org':
            case 'sys.4channel.org':
                var pathname = location.pathname.split(/\/+/);
                if (pathname[2] === 'imgboard.php') {
                    var match_1;
                    if (/\bmode=report\b/.test(location.search)) {
                        Report_1.default.init();
                    }
                    else if (match_1 = location.search.match(/\bres=(\d+)/)) {
                        _1.default.ready(function () {
                            var _a;
                            if (globals_1.Conf['404 Redirect'] && (((_a = _1.default.id('errmsg')) === null || _a === void 0 ? void 0 : _a.textContent) === 'Error: Specified thread does not exist.')) {
                                return Redirect_1.default.navigate('thread', {
                                    boardID: globals_1.g.BOARD.ID,
                                    postID: +match_1[1]
                                });
                            }
                        });
                    }
                }
                else if (pathname[2] === 'post') {
                    PostSuccessful_1.default.init();
                }
                return;
        }
    },
    scriptData: function () {
        for (var _i = 0, _a = (0, __1.default)('script:not([src])', globals_1.d.head); _i < _a.length; _i++) {
            var script = _a[_i];
            if (/\bcooldowns *=/.test(script.textContent)) {
                return script.textContent;
            }
        }
        return '';
    },
    parseThreadMetadata: function (thread) {
        var m;
        var scriptData = this.scriptData();
        thread.postLimit = /\bbumplimit *= *1\b/.test(scriptData);
        thread.fileLimit = /\bimagelimit *= *1\b/.test(scriptData);
        thread.ipCount = (m = scriptData.match(/\bunique_ips *= *(\d+)\b/)) ? +m[1] : undefined;
        if ((globals_1.g.BOARD.ID === 'f') && thread.OP.file) {
            var file_1 = thread.OP.file;
            return _1.default.ajax(this.urls.threadJSON({ boardID: 'f', threadID: thread.ID }), {
                timeout: helpers_1.MINUTE,
                onloadend: function () {
                    if (this.response) {
                        return file_1.text.dataset.md5 = (file_1.MD5 = this.response.posts[0].md5);
                    }
                }
            });
        }
    },
    parseNodes: function (post, nodes) {
        // Add CSS classes to sticky/closed icons on /f/ to match other boards.
        if (post.boardID === 'f') {
            return (function () {
                var result = [];
                for (var _i = 0, _a = ['Sticky', 'Closed']; _i < _a.length; _i++) {
                    var type = _a[_i];
                    var icon;
                    if (icon = (0, _1.default)("img[alt=".concat(type, "]"), nodes.info)) {
                        result.push(_1.default.addClass(icon, "".concat(type.toLowerCase(), "Icon"), 'retina'));
                    }
                }
                return result;
            })();
        }
    },
    parseDate: function (node) {
        return new Date(node.dataset.utc * 1000);
    },
    parseFile: function (post, file) {
        var _a, _b, _c;
        var info;
        var text = file.text, link = file.link, thumb = file.thumb;
        if (!(info = (_a = link.nextSibling) === null || _a === void 0 ? void 0 : _a.textContent.match(/\(([\d.]+ [KMG]?B).*\)/))) {
            return false;
        }
        _1.default.extend(file, {
            name: text.title || link.title || link.textContent,
            size: info[1],
            dimensions: (_b = info[0].match(/\d+x\d+/)) === null || _b === void 0 ? void 0 : _b[0],
            tag: (_c = info[0].match(/,[^,]*, ([a-z]+)\)/i)) === null || _c === void 0 ? void 0 : _c[1],
            MD5: text.dataset.md5
        });
        if (thumb) {
            _1.default.extend(file, {
                thumbURL: thumb.src,
                MD5: thumb.dataset.md5,
                isSpoiler: _1.default.hasClass(thumb.parentNode, 'imgspoiler')
            });
            if (file.isSpoiler) {
                var m = void 0;
                file.thumbURL = (m = link.href.match(/\d+(?=\.\w+$)/)) ? "".concat(location.protocol, "//").concat(ImageHost_1.default.thumbHost(), "/").concat(post.board, "/").concat(m[0], "s.jpg") : undefined;
            }
        }
        return true;
    },
    cleanComment: function (bq) {
        var abbr;
        if (abbr = (0, _1.default)('.abbr', bq)) { // 'Comment too long' or 'EXIF data available'
            for (var _i = 0, _a = (0, __1.default)('.abbr + br, .exif', bq); _i < _a.length; _i++) {
                var node = _a[_i];
                _1.default.rm(node);
            }
            for (var i = 0; i < 2; i++) {
                var br;
                if ((br = abbr.previousSibling) && (br.nodeName === 'BR')) {
                    _1.default.rm(br);
                }
            }
            return _1.default.rm(abbr);
        }
    },
    cleanCommentDisplay: function (bq) {
        var b;
        if ((b = (0, _1.default)('b', bq)) && /^Rolled /.test(b.textContent)) {
            _1.default.rm(b);
        }
        return _1.default.rm((0, _1.default)('.fortune', bq));
    },
    insertTags: function (bq) {
        var node;
        for (var _i = 0, _a = (0, __1.default)('s, .removed-spoiler', bq); _i < _a.length; _i++) {
            node = _a[_i];
            _1.default.replace(node, __spreadArray(__spreadArray([_1.default.tn('[spoiler]')], node.childNodes, true), [_1.default.tn('[/spoiler]')], false));
        }
        for (var _b = 0, _c = (0, __1.default)('.prettyprint', bq); _b < _c.length; _b++) {
            node = _c[_b];
            _1.default.replace(node, __spreadArray(__spreadArray([_1.default.tn('[code]')], node.childNodes, true), [_1.default.tn('[/code]')], false));
        }
    },
    hasCORS: function (url) {
        return url.split('/').slice(0, 3).join('/') === (location.protocol + '//a.4cdn.org');
    },
    sfwBoards: function (sfw) {
        return BoardConfig_1.default.sfwBoards(sfw);
    },
    uidColor: function (uid) {
        var msg = 0;
        var i = 0;
        while (i < 8) {
            msg = ((msg << 5) - msg) + uid.charCodeAt(i++);
        }
        return (msg >> 8) & 0xFFFFFF;
    },
    isLinkified: function (link) {
        return ImageHost_1.default.test(link.hostname);
    },
    testNativeExtension: function () {
        return _1.default.global('testNativeExtension', {});
    },
    transformBoardList: function () {
        var node;
        var nodes = [];
        var spacer = function () { return _1.default.el('span', { className: 'spacer' }); };
        var items = _1.default.X('.//a|.//text()[not(ancestor::a)]', (0, _1.default)(SWYotsuba.selectors.boardList));
        var i = 0;
        while ((node = items.snapshotItem(i++))) {
            switch (node.nodeName) {
                case '#text':
                    for (var _i = 0, _a = node.nodeValue; _i < _a.length; _i++) {
                        var chr = _a[_i];
                        var span = _1.default.el('span', { textContent: chr });
                        if (chr === ' ') {
                            span.className = 'space';
                        }
                        if (chr === ']') {
                            nodes.push(spacer());
                        }
                        nodes.push(span);
                        if (chr === '[') {
                            nodes.push(spacer());
                        }
                    }
                    break;
                case 'A':
                    var a = node.cloneNode(true);
                    nodes.push(a);
                    break;
            }
        }
        return nodes;
    },
    Build: {
        staticPath: '//s.4cdn.org/image/',
        gifIcon: window.devicePixelRatio >= 2 ? '@2x.gif' : '.gif',
        spoilerRange: Object.create(null),
        shortFilename: function (filename) {
            var ext = filename.match(/\.?[^\.]*$/)[0];
            if ((filename.length - ext.length) > 30) {
                return "".concat(filename.match(/(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[^]){0,25}/)[0], "(...)").concat(ext);
            }
            else {
                return filename;
            }
        },
        spoilerThumb: function (boardID) {
            var spoilerRange;
            if ((spoilerRange = this.spoilerRange[boardID])) {
                // Randomize the spoiler image.
                return "".concat(this.staticPath, "spoiler-").concat(boardID).concat(Math.floor(1 + (spoilerRange * Math.random())), ".png");
            }
            else {
                return "".concat(this.staticPath, "spoiler.png");
            }
        },
        sameThread: function (boardID, threadID) {
            return (globals_1.g.VIEW === 'thread') && (globals_1.g.BOARD.ID === boardID) && (globals_1.g.THREADID === +threadID);
        },
        threadURL: function (boardID, threadID) {
            if (boardID !== globals_1.g.BOARD.ID) {
                return "//".concat(BoardConfig_1.default.domain(boardID), "/").concat(boardID, "/thread/").concat(threadID);
            }
            else if ((globals_1.g.VIEW !== 'thread') || (+threadID !== globals_1.g.THREADID)) {
                return "/".concat(boardID, "/thread/").concat(threadID);
            }
            else {
                return '';
            }
        },
        postURL: function (boardID, threadID, postID) {
            return "".concat(this.threadURL(boardID, threadID), "#p").concat(postID);
        },
        parseJSON: function (data, _a) {
            var _b;
            var siteID = _a.siteID, boardID = _a.boardID;
            var o = {
                // id
                ID: data.no,
                postID: data.no,
                threadID: data.resto || data.no,
                boardID: boardID,
                siteID: siteID,
                isReply: !!data.resto,
                // thread status
                isSticky: !!data.sticky,
                isClosed: !!data.closed,
                isArchived: !!data.archived,
                threadReplies: data.replies,
                threadImages: data.images,
                // file status
                fileDeleted: !!data.filedeleted,
                filesDeleted: data.filedeleted ? [0] : []
            };
            o.info = {
                subject: _1.default.unescape(data.sub),
                email: _1.default.unescape(data.email),
                name: _1.default.unescape(data.name) || '',
                tripcode: data.trip,
                pass: (data.since4pass != null) ? "".concat(data.since4pass) : undefined,
                uniqueID: data.id,
                flagCode: data.country,
                flagCodeTroll: data.board_flag,
                flag: _1.default.unescape((data.country_name || data.flag_name)),
                dateUTC: data.time,
                dateText: data.now,
                // Yes, we use the raw string here
                commentHTML: (_b = { innerHTML: data.com || '' }, _b[jsx_1.isEscaped] = true, _b)
            };
            if (data.capcode) {
                o.info.capcode = data.capcode.replace(/_highlight$/, '').replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
                o.capcodeHighlight = /_highlight$/.test(data.capcode);
                delete o.info.uniqueID;
            }
            o.files = [];
            if (data.ext) {
                o.file = this.parseJSONFile(data, { siteID: siteID, boardID: boardID });
                o.files.push(o.file);
            }
            // Temporary JSON properties for events such as April 1 / Halloween
            o.extra = (0, helpers_1.dict)();
            for (var key in data) {
                if (key[0] === 'x') {
                    o.extra[key] = data[key];
                }
            }
            return o;
        },
        parseJSONFile: function (data, _a) {
            var siteID = _a.siteID, boardID = _a.boardID;
            var site = globals_1.g.sites[siteID];
            var filename = (site.software === 'yotsuba') && (boardID === 'f') ?
                "".concat(encodeURIComponent(data.filename)).concat(data.ext)
                :
                    "".concat(data.tim).concat(data.ext);
            var o = {
                name: (_1.default.unescape(data.filename)) + data.ext,
                url: site.urls.file({ siteID: siteID, boardID: boardID }, filename),
                height: data.h,
                width: data.w,
                MD5: data.md5,
                size: _1.default.bytesToString(data.fsize),
                thumbURL: site.urls.thumb({ siteID: siteID, boardID: boardID }, "".concat(data.tim, "s.jpg")),
                theight: data.tn_h,
                twidth: data.tn_w,
                isSpoiler: !!data.spoiler,
                tag: data.tag,
                hasDownscale: !!data.m_img
            };
            if ((data.h != null) && !/\.pdf$/.test(o.url)) {
                o.dimensions = "".concat(o.width, "x").concat(o.height);
            }
            return o;
        },
        parseComment: function (html) {
            html = html
                .replace(/<br\b[^<]*>/gi, '\n')
                .replace(/\n\n<span\b[^<]* class="abbr"[^]*$/i, '') // EXIF data (/p/)
                .replace(/<[^>]*>/g, '');
            return _1.default.unescape(html);
        },
        parseCommentDisplay: function (html) {
            // Hide spoilers.
            if (!globals_1.Conf['Remove Spoilers'] && !globals_1.Conf['Reveal Spoilers']) {
                var html2 = void 0;
                while ((html2 = html.replace(/<s>(?:(?!<\/?s>).)*<\/s>/g, '[spoiler]')) !== html) {
                    html = html2;
                }
            }
            html = html
                .replace(/^<b\b[^<]*>Rolled [^<]*<\/b>/i, '') // Rolls (/tg/, /qst/)
                .replace(/<span\b[^<]* class="fortune"[^]*$/i, ''); // Fortunes (/s4s/)
            // Remove preceding and following new lines, trailing spaces.
            return this.parseComment(html).trim().replace(/\s+$/gm, '');
        },
        postFromObject: function (data, boardID) {
            var o = this.parseJSON(data, { boardID: boardID, siteID: globals_1.g.SITE.ID });
            return this.post(o);
        },
        post: function (o) {
            var ID = o.ID, threadID = o.threadID, boardID = o.boardID, file = o.file;
            var _a = o.info, subject = _a.subject, email = _a.email, name = _a.name, tripcode = _a.tripcode, capcode = _a.capcode, pass = _a.pass, uniqueID = _a.uniqueID, flagCode = _a.flagCode, flagCodeTroll = _a.flagCodeTroll, flag = _a.flag, dateUTC = _a.dateUTC, dateText = _a.dateText, commentHTML = _a.commentHTML;
            var _b = this, staticPath = _b.staticPath, gifIcon = _b.gifIcon;
            /* Post Info */
            var capcodeDescription, capcodePlural, capcodeLC;
            if (capcode) {
                capcodeLC = capcode.toLowerCase();
                if (capcode === 'Founder') {
                    capcodePlural = 'the Founder';
                    capcodeDescription = "4chan's Founder";
                }
                else if (capcode === 'Verified') {
                    capcodePlural = 'Verified Users';
                    capcodeDescription = '';
                }
                else {
                    var capcodeLong = _1.default.getOwn({ 'Admin': 'Administrator', 'Mod': 'Moderator' }, capcode) || capcode;
                    capcodePlural = "".concat(capcodeLong, "s");
                    capcodeDescription = "a 4chan ".concat(capcodeLong);
                }
            }
            var url = this.threadURL(boardID, threadID);
            var postLink = "".concat(url, "#p").concat(ID);
            var quoteLink = this.sameThread(boardID, threadID) ?
                "javascript:quote('".concat(+ID, "');")
                :
                    "".concat(url, "#q").concat(ID);
            var postInfo = (0, PostInfoHtml_1.default)(ID, o, subject, capcode, email, name, tripcode, pass, capcodeLC, capcodePlural, staticPath, gifIcon, capcodeDescription, uniqueID, flag, flagCode, flagCodeTroll, dateUTC, dateText, postLink, quoteLink, boardID, threadID);
            /* File Info */
            var protocol, fileURL, shortFilename, fileThumb;
            if (file) {
                protocol = /^https?:(?=\/\/i\.4cdn\.org\/)/;
                fileURL = file.url.replace(protocol, '');
                shortFilename = this.shortFilename(file.name);
                fileThumb = file.isSpoiler ? this.spoilerThumb(boardID) : file.thumbURL.replace(protocol, '');
            }
            var fileBlock = (0, FileHtml_1.default)(file, ID, boardID, fileURL, shortFilename, fileThumb, o, staticPath, gifIcon);
            /* Whole Post */
            var postClass = o.isReply ? 'reply' : 'op';
            var postContent = o.isReply ? [postInfo, fileBlock] : [fileBlock, postInfo];
            postContent.push((0, jsx_1.default)("blockquote", { class: "postMessage", id: "m".concat(ID) }, commentHTML));
            // I wonder if there's a better way to skip this in the catalog without breaking hovers.
            // Currently, this is just hidden by css.
            if (!o.isReply && o.threadReplies != null) {
                postContent.push((0, jsx_1.default)("span", { class: "summary preview-summary" }, this.summaryText('', o.threadReplies, o.threadImages, true)));
            }
            var wholePost = (0, jsx_1.default)(jsx_1.hFragment, null,
                (o.isReply ? (0, jsx_1.default)("div", { class: "sideArrows", id: "sa".concat(ID) }, ">>") : ''),
                jsx_1.default.apply(void 0, __spreadArray(["div", { id: "p".concat(ID), class: "post ".concat(postClass).concat(o.capcodeHighlight ? ' highlightPost' : '') }], postContent, false)));
            var container = _1.default.el('div', {
                className: "postContainer ".concat(postClass, "Container"),
                id: "pc".concat(ID)
            });
            _1.default.extend(container, wholePost);
            // Fix quotelinks
            for (var _i = 0, _c = (0, __1.default)('.quotelink', container); _i < _c.length; _i++) {
                var quote = _c[_i];
                var href = quote.getAttribute('href');
                if (href[0] === '#') {
                    if (!this.sameThread(boardID, threadID)) {
                        quote.href = this.threadURL(boardID, threadID) + href;
                    }
                }
                else {
                    var match;
                    if ((match = quote.href.match(SWYotsuba.regexp.quotelink)) && (this.sameThread(match[1], match[2]))) {
                        quote.href = href.match(/(#[^#]*)?$/)[0] || '#';
                    }
                }
            }
            return container;
        },
        summaryText: function (status, posts, files, hoverPreview) {
            if (hoverPreview === void 0) { hoverPreview = false; }
            var text = '';
            if (status)
                text += "".concat(status, " ");
            text += "".concat(posts, " post").concat(posts == 1 ? '' : 's');
            if (+files)
                text += " and ".concat(files, " image repl").concat(files > 1 ? 'ies' : 'y');
            return hoverPreview ? text : "".concat(text, " ").concat(status === '-' ? 'shown' : 'omitted', ".");
        },
        summary: function (boardID, threadID, posts, files) {
            return _1.default.el('a', {
                className: 'summary',
                textContent: this.summaryText('', posts, files),
                href: "/".concat(boardID, "/thread/").concat(threadID)
            });
        },
        thread: function (thread, data, withReplies) {
            var root;
            if (root = thread.nodes.root) {
                _1.default.rmAll(root);
            }
            else {
                thread.nodes.root = (root = _1.default.el('div', {
                    className: 'thread',
                    id: "t".concat(data.no)
                }));
            }
            if (this.hat) {
                _1.default.add(root, this.hat.cloneNode(false));
            }
            _1.default.add(root, thread.OP.nodes.root);
            if (data.omitted_posts || (!withReplies && data.replies)) {
                var _a = withReplies ?
                    // XXX data.omitted_images is not accurate.
                    [data.omitted_posts, data.images - data.last_replies.filter(function (data) { return !!data.ext; }).length]
                    :
                        [data.replies, data.images], posts = _a[0], files = _a[1];
                var summary = this.summary(thread.board.ID, data.no, posts, files);
                _1.default.add(root, summary);
            }
            return root;
        },
        catalogThread: function (thread, data, pageCount) {
            var cssText, imgClass, src;
            var _a = this, staticPath = _a.staticPath, gifIcon = _a.gifIcon;
            var tn_w = data.tn_w, tn_h = data.tn_h;
            if (data.spoiler && !globals_1.Conf['Reveal Spoiler Thumbnails']) {
                var spoilerRange = void 0;
                src = "".concat(staticPath, "spoiler");
                if (spoilerRange = this.spoilerRange[thread.board]) {
                    // Randomize the spoiler image.
                    src += ("-".concat(thread.board)) + Math.floor(1 + (spoilerRange * Math.random()));
                }
                src += '.png';
                imgClass = 'spoiler-file';
                cssText = "--tn-w: 100; --tn-h: 100;";
            }
            else if (data.filedeleted) {
                src = "".concat(staticPath, "filedeleted-res").concat(gifIcon);
                imgClass = 'deleted-file';
            }
            else if (thread.OP.file) {
                src = thread.OP.file.thumbURL;
                var ratio = 250 / Math.max(tn_w, tn_h);
                cssText = "--tn-w: ".concat(tn_w * ratio, "; --tn-h: ").concat(tn_h * ratio, ";");
            }
            else {
                src = "".concat(staticPath, "nofile.png");
                imgClass = 'no-file';
            }
            var postCount = data.replies + 1;
            var fileCount = data.images + !!data.ext;
            var container = _1.default.el('div', (0, CatalogThreadHtml_1.default)(thread, src, imgClass, data, postCount, fileCount, pageCount, staticPath, gifIcon));
            _1.default.before(thread.OP.nodes.info, __spreadArray([], container.childNodes, true));
            for (var _i = 0, _b = (0, __1.default)('br', thread.OP.nodes.comment); _i < _b.length; _i++) {
                var br = _b[_i];
                if (br.previousSibling && (br.previousSibling.nodeName === 'BR')) {
                    _1.default.addClass(br, 'extra-linebreak');
                }
            }
            var root = _1.default.el('div', {
                className: 'thread catalog-thread',
                id: "t".concat(thread)
            });
            if (thread.OP.highlights) {
                _1.default.addClass.apply(_1.default, __spreadArray([root], thread.OP.highlights, false));
            }
            if (!thread.OP.file) {
                _1.default.addClass(root, 'noFile');
            }
            root.style.cssText = cssText || '';
            return root;
        },
        catalogReply: function (thread, data) {
            var excerpt = '';
            if (data.com) {
                excerpt = this.parseCommentDisplay(data.com).replace(/>>\d+/g, '').trim().replace(/\n+/g, ' // ');
            }
            if (data.ext) {
                if (!excerpt) {
                    excerpt = "".concat(_1.default.unescape(data.filename)).concat(data.ext);
                }
            }
            if (data.com) {
                if (!excerpt) {
                    excerpt = _1.default.unescape(data.com.replace(/<br\b[^<]*>/gi, ' // '));
                }
            }
            if (!excerpt) {
                excerpt = '\xA0';
            }
            if (excerpt.length > 73) {
                excerpt = "".concat(excerpt.slice(0, 70), "...");
            }
            var link = this.postURL(thread.board.ID, thread.ID, data.no);
            return _1.default.el('div', { className: 'catalog-reply' }, (0, jsx_1.default)(jsx_1.hFragment, null,
                (0, jsx_1.default)("span", null,
                    (0, jsx_1.default)("time", { "data-utc": data.time * 1000, "data-abbrev": "1" }, "..."),
                    ": "),
                (0, jsx_1.default)("a", { class: "catalog-reply-excerpt", href: link }, excerpt),
                (0, jsx_1.default)("a", { class: "catalog-reply-preview", href: link }, "...")));
        }
    }
};
exports.default = SWYotsuba;
