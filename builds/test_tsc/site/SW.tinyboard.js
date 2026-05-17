"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var helpers_1 = require("../platform/helpers");
var SW_yotsuba_1 = require("./SW.yotsuba");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var SWTinyboard = {
    isOPContainerThread: true,
    mayLackJSON: true,
    threadModTimeIgnoresSage: true,
    disabledFeatures: [
        'Resurrect Quotes',
        'Quick Reply Personas',
        'Quick Reply',
        'Cooldown',
        'Report Link',
        'Delete Link',
        'Edit Link',
        'Quote Inlining',
        'Quote Previewing',
        'Quote Backlinks',
        'File Info Formatting',
        'Image Expansion',
        'Image Expansion (Menu)',
        'Comment Expansion',
        'Thread Expansion',
        'Favicon',
        'Quote Threading',
        'Thread Updater',
        'Banner',
        'Flash Features',
        'Reply Pruning'
    ],
    detect: function () {
        for (var _i = 0, _a = (0, __1.default)('script:not([src])', globals_1.d.head); _i < _a.length; _i++) {
            var script = _a[_i];
            var m;
            if (m = script.textContent.match(/\bvar configRoot=(".*?")/)) {
                var properties = (0, helpers_1.dict)();
                try {
                    var root = JSON.parse(m[1]);
                    if (root[0] === '/') {
                        properties.root = location.origin + root;
                    }
                    else if (/^https?:/.test(root)) {
                        properties.root = root;
                    }
                }
                catch (error) { }
                return properties;
            }
        }
        return false;
    },
    awaitBoard: function (cb) {
        var reactUI;
        if (reactUI = _1.default.id('react-ui')) {
            var s = (this.selectors = Object.create(this.selectors));
            s.boardFor = { index: '.page-container' };
            s.thread = 'div[id^="thread_"]';
            return _1.default.on(globals_1.d, '4chanXMounted', cb);
        }
        else {
            return cb();
        }
    },
    urls: {
        thread: function (_a, isArchived) {
            var _b;
            var siteID = _a.siteID, boardID = _a.boardID, threadID = _a.threadID;
            return "".concat(((_b = globals_1.Conf['siteProperties'][siteID]) === null || _b === void 0 ? void 0 : _b.root) || "http://".concat(siteID, "/")).concat(boardID, "/").concat(isArchived ? 'archive/' : '', "res/").concat(threadID, ".html");
        },
        post: function (_a) {
            var postID = _a.postID;
            return "#".concat(postID);
        },
        index: function (_a) {
            var _b;
            var siteID = _a.siteID, boardID = _a.boardID;
            return "".concat(((_b = globals_1.Conf['siteProperties'][siteID]) === null || _b === void 0 ? void 0 : _b.root) || "http://".concat(siteID, "/")).concat(boardID, "/");
        },
        catalog: function (_a) {
            var _b;
            var siteID = _a.siteID, boardID = _a.boardID;
            return "".concat(((_b = globals_1.Conf['siteProperties'][siteID]) === null || _b === void 0 ? void 0 : _b.root) || "http://".concat(siteID, "/")).concat(boardID, "/catalog.html");
        },
        threadJSON: function (_a, isArchived) {
            var _b;
            var siteID = _a.siteID, boardID = _a.boardID, threadID = _a.threadID;
            var root = (_b = globals_1.Conf['siteProperties'][siteID]) === null || _b === void 0 ? void 0 : _b.root;
            if (root) {
                return "".concat(root).concat(boardID, "/").concat(isArchived ? 'archive/' : '', "res/").concat(threadID, ".json");
            }
            else {
                return '';
            }
        },
        archivedThreadJSON: function (thread) {
            return SWTinyboard.urls.threadJSON(thread, true);
        },
        threadsListJSON: function (_a) {
            var _b;
            var siteID = _a.siteID, boardID = _a.boardID;
            var root = (_b = globals_1.Conf['siteProperties'][siteID]) === null || _b === void 0 ? void 0 : _b.root;
            if (root) {
                return "".concat(root).concat(boardID, "/threads.json");
            }
            else {
                return '';
            }
        },
        archiveListJSON: function (_a) {
            var _b;
            var siteID = _a.siteID, boardID = _a.boardID;
            var root = (_b = globals_1.Conf['siteProperties'][siteID]) === null || _b === void 0 ? void 0 : _b.root;
            if (root) {
                return "".concat(root).concat(boardID, "/archive/archive.json");
            }
            else {
                return '';
            }
        },
        catalogJSON: function (_a) {
            var _b;
            var siteID = _a.siteID, boardID = _a.boardID;
            var root = (_b = globals_1.Conf['siteProperties'][siteID]) === null || _b === void 0 ? void 0 : _b.root;
            if (root) {
                return "".concat(root).concat(boardID, "/catalog.json");
            }
            else {
                return '';
            }
        },
        file: function (_a, filename) {
            var _b;
            var siteID = _a.siteID, boardID = _a.boardID;
            return "".concat(((_b = globals_1.Conf['siteProperties'][siteID]) === null || _b === void 0 ? void 0 : _b.root) || "http://".concat(siteID, "/")).concat(boardID, "/").concat(filename);
        },
        thumb: function (board, filename) {
            return SWTinyboard.urls.file(board, filename);
        }
    },
    selectors: {
        board: 'form[name="postcontrols"]',
        thread: 'input[name="board"] ~ div[id^="thread_"]',
        threadDivider: 'div[id^="thread_"] > hr:last-child',
        summary: '.omitted',
        postContainer: 'div[id^="reply_"]:not(.hidden)', // postContainer is thread for OP
        opBottom: '.op',
        replyOriginal: 'div[id^="reply_"]:not(.hidden)',
        infoRoot: '.intro',
        info: {
            subject: '.subject',
            name: '.name',
            email: '.email',
            tripcode: '.trip',
            uniqueID: '.poster_id',
            capcode: '.capcode',
            flag: '.flag',
            date: 'time',
            nameBlock: 'label',
            quote: 'a[href*="#q"]',
            reply: 'a[href*="/res/"]:not([href*="#"])'
        },
        icons: {
            isSticky: '.fa-thumb-tack',
            isClosed: '.fa-lock'
        },
        file: {
            text: '.fileinfo',
            link: '.fileinfo > a',
            thumb: 'a > .post-image'
        },
        thumbLink: '.file > a',
        multifile: '.files > .file',
        highlightable: {
            op: ' > .op',
            reply: '.reply',
            catalog: ' > .thread'
        },
        comment: '.body',
        spoiler: '.spoiler',
        quotelink: 'a[onclick*="highlightReply("]',
        catalog: {
            board: '#Grid',
            thread: '.mix',
            thumb: '.thread-image'
        },
        boardList: '.boardlist',
        boardListBottom: '.boardlist.bottom',
        styleSheet: '#stylesheet',
        psa: '.blotter',
        nav: {
            prev: '.pages > form > [value=Previous]',
            next: '.pages > form > [value=Next]'
        }
    },
    classes: {
        highlight: 'highlighted'
    },
    xpath: {
        thread: 'div[starts-with(@id,"thread_")]',
        postContainer: 'div[starts-with(@id,"reply_") or starts-with(@id,"thread_")]',
        replyContainer: 'div[starts-with(@id,"reply_")]'
    },
    regexp: {
        quotelink: new RegExp("/([^/]+)/res/(\\d+)(?:\\.\\w+)?#(\\d+)$"),
        quotelinkHTML: /<a [^>]*\bhref="[^"]*\/([^\/]+)\/res\/(\d+)(?:\.\w+)?#(\d+)"/g
    },
    Build: {
        parseJSON: function (data, board) {
            var o = SW_yotsuba_1.default.Build.parseJSON(data, board);
            if (data.ext === 'deleted') {
                delete o.file;
                _1.default.extend(o, {
                    files: [],
                    fileDeleted: true,
                    filesDeleted: [0]
                });
            }
            if (data.extra_files) {
                var file = void 0;
                for (var i = 0; i < data.extra_files.length; i++) {
                    var extra_file = data.extra_files[i];
                    if (extra_file.ext === 'deleted') {
                        o.filesDeleted.push(i);
                    }
                    else {
                        file = SW_yotsuba_1.default.Build.parseJSONFile(data, board);
                        o.files.push(file);
                    }
                }
                if (o.files.length) {
                    o.file = o.files[0];
                }
            }
            return o;
        },
        parseComment: function (html) {
            html = html
                .replace(/<br\b[^<]*>/gi, '\n')
                .replace(/<[^>]*>/g, '');
            return _1.default.unescape(html);
        }
    },
    bgColoredEl: function () {
        return _1.default.el('div', { className: 'post reply' });
    },
    isFileURL: function (url) {
        return /\/src\/[^\/]+/.test(url.pathname);
    },
    preParsingFixes: function (board) {
        // fixes effects of unclosed link in announcement
        var broken;
        if (broken = (0, _1.default)('a > input[name="board"]', board)) {
            return _1.default.before(broken.parentNode, broken);
        }
    },
    parseNodes: function (post, nodes) {
        // Add vichan's span.poster_id around the ID if not already present.
        var m;
        if (nodes.uniqueID) {
            return;
        }
        var text = '';
        var node = nodes.nameBlock.nextSibling;
        while (node && (node.nodeType === 3)) {
            text += node.textContent;
            node = node.nextSibling;
        }
        if (m = text.match(/(\s*ID:\s*)(\S+)/)) {
            var uniqueID = void 0;
            nodes.info.normalize();
            var nextSibling = nodes.nameBlock.nextSibling;
            nextSibling = nextSibling.splitText(m[1].length);
            nextSibling.splitText(m[2].length);
            nodes.uniqueID = (uniqueID = _1.default.el('span', { className: 'poster_id' }));
            _1.default.replace(nextSibling, uniqueID);
            return _1.default.add(uniqueID, nextSibling);
        }
    },
    parseDate: function (node) {
        var _a;
        var date = Date.parse((_a = node.getAttribute('datetime')) === null || _a === void 0 ? void 0 : _a.trim());
        if (!isNaN(date)) {
            return new Date(date);
        }
        date = Date.parse(node.textContent.trim() + ' UTC'); // e.g. onesixtwo.club
        if (!isNaN(date)) {
            return new Date(date);
        }
        return undefined;
    },
    parseFile: function (post, file) {
        var _a, _b;
        var info, infoNode;
        var text = file.text, link = file.link, thumb = file.thumb;
        if (_1.default.x("ancestor::".concat(this.xpath.postContainer, "[1]"), text) !== post.nodes.root) {
            return false;
        } // file belongs to a reply
        if (!(infoNode = ((_a = link.nextSibling) === null || _a === void 0 ? void 0 : _a.textContent.includes('(')) ? link.nextSibling : link.nextElementSibling)) {
            return false;
        }
        if (!(info = infoNode.textContent.match(/\((.*,\s*)?([\d.]+ ?[KMG]?B).*\)/))) {
            return false;
        }
        var nameNode = (0, _1.default)('.postfilename', text);
        _1.default.extend(file, {
            name: nameNode ? (nameNode.title || nameNode.textContent) : link.pathname.match(/[^/]*$/)[0],
            size: info[2],
            dimensions: (_b = info[0].match(/\d+x\d+/)) === null || _b === void 0 ? void 0 : _b[0]
        });
        if (thumb) {
            _1.default.extend(file, {
                thumbURL: /\/static\//.test(thumb.src) && _1.default.isImage(link.href) ? link.href : thumb.src,
                isSpoiler: /^Spoiler/i.test(info[1] || '') || (link.textContent === 'Spoiler Image')
            });
        }
        return true;
    },
    isThumbExpanded: function (file) {
        // Detect old Tinyboard image expansion that changes src attribute on thumbnail.
        return _1.default.hasClass(file.thumb.parentNode, 'expanded') || (file.thumb.parentNode.dataset.expanded === 'true');
    },
    isLinkified: function (link) {
        return /\bnofollow\b/.test(link.rel);
    },
    catalogPin: function (threadRoot) {
        return threadRoot.dataset.sticky = 'true';
    }
};
exports.default = SWTinyboard;
