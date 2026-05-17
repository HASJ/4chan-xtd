"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var QuickReply_html_1 = require("./QR/QuickReply.html");
var _1 = require("../platform/$");
var Callbacks_1 = require("../classes/Callbacks");
var Notice_1 = require("../classes/Notice");
var Favicon_1 = require("../Monitoring/Favicon");
var __1 = require("../platform/$$");
var CrossOrigin_1 = require("../platform/CrossOrigin");
var Captcha_1 = require("./Captcha");
var package_json_1 = require("../../package.json");
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var Menu_1 = require("../Menu/Menu");
var UI_1 = require("../General/UI");
var BoardConfig_1 = require("../General/BoardConfig");
var Get_1 = require("../General/Get");
var helpers_1 = require("../platform/helpers");
var icon_1 = require("../Icons/icon");
var VideoStripper_1 = require("./VideoStripper");
;
var QR = {
    postingIsEnabled: false,
    // will be set at init
    captcha: undefined,
    min_width: 0,
    min_height: 0,
    max_width: 0,
    max_height: 0,
    max_size: 0,
    max_size_video: 0,
    max_comment: 0,
    max_width_video: 0,
    max_height_video: 0,
    max_duration_video: 0,
    forcedAnon: false,
    spoiler: false,
    link: undefined,
    post: undefined,
    posts: undefined,
    nodes: undefined,
    shortcut: undefined,
    hasFocus: false,
    req: undefined,
    selected: undefined,
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/vnd.adobe.flash.movie', 'application/x-shockwave-flash', 'video/webm', 'video/mp4'],
    validExtension: /\.(jpe?g|png|gif|pdf|swf|webm|mp4)$/i,
    typeFromExtension: {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'swf': 'application/vnd.adobe.flash.movie',
        'webm': 'video/webm',
        'mp4': 'video/mp4'
    },
    extensionFromType: {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'application/pdf': 'pdf',
        'application/vnd.adobe.flash.movie': 'swf',
        'application/x-shockwave-flash': 'swf',
        'video/webm': 'webm',
        'video/mp4': 'mp4'
    },
    init: function () {
        var sc;
        if (!globals_1.Conf['Quick Reply']) {
            return;
        }
        this.posts = [];
        _1.default.on(globals_1.d, '4chanXInitFinished', function () { return BoardConfig_1.default.ready(QR.initReady); });
        Callbacks_1.default.Post.push({
            name: 'Quick Reply',
            cb: this.node
        });
        this.shortcut = (sc = _1.default.el('a', {
            className: 'disabled',
            title: 'Quick Reply',
            href: 'javascript:;',
        }));
        icon_1.default.set(this.shortcut, 'comment', 'Quick Reply');
        _1.default.on(sc, 'click', function () {
            if (!QR.postingIsEnabled) {
                return;
            }
            if (globals_1.Conf['Persistent QR'] || !QR.nodes || QR.nodes.el.hidden) {
                QR.open();
                QR.nodes.com.focus();
            }
            else {
                QR.close();
            }
        });
        Header_1.default.addShortcut('qr', sc, 540);
        window.addEventListener('message', function (event) {
            var _a, _b;
            if ((_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.twister) === null || _b === void 0 ? void 0 : _b.error) {
                QR.error(_1.default.el('div', { innerHTML: event.data.twister.error }));
            }
        });
    },
    initReady: function () {
        var origToggle;
        var captchaVersion = (0, _1.default)('#g-recaptcha, #captcha-forced-noscript') ? 'v2' : 't';
        QR.captcha = Captcha_1.default[captchaVersion];
        QR.postingIsEnabled = true;
        var config = globals_1.g.BOARD.config;
        var prop = function (key, def) { var _a; return +((_a = config[key]) !== null && _a !== void 0 ? _a : def); };
        QR.min_width = prop('min_image_width', 1);
        QR.min_height = prop('min_image_height', 1);
        QR.max_width = (QR.max_height = 10000);
        QR.max_size = prop('max_filesize', 4194304);
        QR.max_size_video = prop('max_webm_filesize', QR.max_size);
        QR.max_comment = prop('max_comment_chars', 2000);
        QR.max_width_video = (QR.max_height_video = 2048);
        QR.max_duration_video = prop('max_webm_duration', 120);
        QR.forcedAnon = !!config.forced_anon;
        QR.spoiler = !!config.spoilers;
        if (origToggle = _1.default.id('togglePostFormLink')) {
            var link = _1.default.el('h1', { className: "qr-link-container" });
            _1.default.extend(link, {
                innerHTML: "<a href=\"javascript:;\" class=\"qr-link\">".concat(globals_1.g.VIEW === "thread" ? "Reply to Thread" : "Start a Thread", "</a>")
            });
            QR.link = link.firstElementChild;
            _1.default.on(link.firstChild, 'click', function () {
                QR.open();
                return QR.nodes.com.focus();
            });
            _1.default.before(origToggle, link);
            origToggle.firstElementChild.textContent = 'Original Form';
        }
        if (globals_1.g.VIEW === 'thread') {
            var navLinksBot = void 0;
            var linkBot = _1.default.el('div', { className: "brackets-wrap qr-link-container-bottom" });
            _1.default.extend(linkBot, { innerHTML: '<a href="javascript:;" class="qr-link-bottom">Reply to Thread</a>' });
            _1.default.on(linkBot.firstElementChild, 'click', function () {
                QR.open();
                return QR.nodes.com.focus();
            });
            if (navLinksBot = (0, _1.default)('.navLinksBot')) {
                _1.default.prepend(navLinksBot, linkBot);
            }
        }
        _1.default.on(globals_1.d, 'QRGetFile', QR.getFile);
        _1.default.on(globals_1.d, 'QRDrawFile', QR.drawFile);
        _1.default.on(globals_1.d, 'QRSetFile', QR.setFile);
        _1.default.on(globals_1.d, 'paste', QR.paste);
        _1.default.on(globals_1.d, 'dragover', QR.dragOver);
        _1.default.on(globals_1.d, 'drop', QR.dropFile);
        _1.default.on(globals_1.d, 'dragstart dragend', QR.drag);
        _1.default.on(globals_1.d, 'IndexRefreshInternal', QR.generatePostableThreadsList);
        _1.default.on(globals_1.d, 'ThreadUpdate', QR.statusCheck);
        if (!globals_1.Conf['Persistent QR']) {
            return;
        }
        QR.open();
        if (globals_1.Conf['Auto Hide QR']) {
            return QR.hide();
        }
    },
    statusCheck: function () {
        if (!QR.nodes) {
            return;
        }
        var thread = QR.posts[0].thread;
        if ((thread !== 'new') && globals_1.g.threads.get("".concat(globals_1.g.BOARD, ".").concat(thread)).isDead) {
            return QR.abort();
        }
        else {
            return QR.status();
        }
    },
    node: function () {
        _1.default.on(this.nodes.quote, 'click', QR.quote);
        if (this.isFetchedQuote) {
            return QR.generatePostableThreadsList();
        }
    },
    open: function () {
        var _a;
        if (QR.nodes) {
            if (QR.nodes.el.hidden) {
                QR.captcha.setup();
            }
            QR.nodes.el.hidden = false;
            QR.unhide();
        }
        else {
            try {
                QR.dialog();
            }
            catch (err) {
                delete QR.nodes;
                (_a = Callbacks_1.default.errorHandler) === null || _a === void 0 ? void 0 : _a.call(Callbacks_1.default, {
                    message: 'Quick Reply dialog creation crashed.',
                    error: err
                });
                return;
            }
        }
        return _1.default.rmClass(QR.shortcut, 'disabled');
    },
    close: function () {
        if (QR.req) {
            QR.abort();
            return;
        }
        QR.nodes.el.hidden = true;
        QR.cleanNotifications();
        QR.blur();
        _1.default.rmClass(QR.nodes.el, 'dump');
        _1.default.addClass(QR.shortcut, 'disabled');
        new QR.post(true);
        for (var _i = 0, _a = QR.posts.splice(0, QR.posts.length - 1); _i < _a.length; _i++) {
            var post = _a[_i];
            post.delete();
        }
        QR.cooldown.auto = false;
        QR.status();
        return QR.captcha.destroy();
    },
    focus: function () {
        return _1.default.queueTask(function () {
            if (!QR.inBubble()) {
                QR.hasFocus = globals_1.d.activeElement && QR.nodes.el.contains(globals_1.d.activeElement);
                return QR.nodes.el.classList.toggle('focus', QR.hasFocus);
            }
        });
    },
    inBubble: function () {
        var bubbles = (0, __1.default)('iframe[src^="https://www.google.com/recaptcha/api2/frame"]');
        return bubbles.includes(globals_1.d.activeElement) || bubbles.some(function (el) { return (getComputedStyle(el).visibility !== 'hidden') && (el.getBoundingClientRect().bottom > 0); });
    },
    hide: function () {
        QR.blur();
        _1.default.addClass(QR.nodes.el, 'autohide');
        return QR.nodes.autohide.checked = true;
    },
    unhide: function () {
        _1.default.rmClass(QR.nodes.el, 'autohide');
        return QR.nodes.autohide.checked = false;
    },
    toggleHide: function () {
        if (this.checked) {
            return QR.hide();
        }
        else {
            return QR.unhide();
        }
    },
    blur: function () {
        if (QR.nodes.el.contains(globals_1.d.activeElement)) {
            return globals_1.d.activeElement.blur();
        }
    },
    toggleSJIS: function (e) {
        e.preventDefault();
        globals_1.Conf['sjisPreview'] = !globals_1.Conf['sjisPreview'];
        _1.default.set('sjisPreview', globals_1.Conf['sjisPreview']);
        return QR.nodes.el.classList.toggle('sjis-preview', globals_1.Conf['sjisPreview']);
    },
    texPreviewShow: function () {
        if (_1.default.hasClass(QR.nodes.el, 'tex-preview')) {
            return QR.texPreviewHide();
        }
        _1.default.addClass(QR.nodes.el, 'tex-preview');
        QR.nodes.texPreview.textContent = QR.nodes.com.value;
        return _1.default.event('mathjax', null, QR.nodes.texPreview);
    },
    texPreviewHide: function () {
        return _1.default.rmClass(QR.nodes.el, 'tex-preview');
    },
    addPost: function () {
        var wasOpen = (QR.nodes && !QR.nodes.el.hidden);
        QR.open();
        if (wasOpen) {
            _1.default.addClass(QR.nodes.el, 'dump');
            new QR.post(true);
        }
        return QR.nodes.com.focus();
    },
    setCustomCooldown: function (enabled) {
        globals_1.Conf['customCooldownEnabled'] = enabled;
        QR.cooldown.customCooldown = enabled;
        return QR.nodes.customCooldown.classList.toggle('disabled', !enabled);
    },
    toggleCustomCooldown: function () {
        var enabled = _1.default.hasClass(QR.nodes.customCooldown, 'disabled');
        QR.setCustomCooldown(enabled);
        return _1.default.set('customCooldownEnabled', enabled);
    },
    error: function (err, focusOverride) {
        var el;
        QR.open();
        if (typeof err === 'string') {
            el = _1.default.tn(err);
        }
        else {
            el = err;
            el.removeAttribute('style');
        }
        var notice = new Notice_1.default('warning', el);
        QR.notifications.push(notice);
        if (!Header_1.default.areNotificationsEnabled) {
            if (globals_1.d.hidden && !QR.cooldown.auto) {
                return alert(el.textContent);
            }
        }
        else if (globals_1.d.hidden || !(focusOverride || globals_1.d.hasFocus())) {
            var notif_1 = new Notification(el.textContent, {
                body: el.textContent,
                icon: Favicon_1.default.logo
            });
            notif_1.onclick = function () { return window.focus(); };
            if (_1.default.engine !== 'gecko') {
                // Firefox automatically closes notifications
                // so we can't control the onclose properly.
                notif_1.onclose = function () { return notice.close(); };
                return notif_1.onshow = function () { return setTimeout(function () {
                    notif_1.onclose = null;
                    return notif_1.close();
                }, 7 * helpers_1.SECOND); };
            }
        }
    },
    connectionError: function () {
        return _1.default.el('span', { innerHTML: 'Connection error while posting. ' +
                '[<a href="' + (0, globals_1.E)(package_json_1.default.upstreamFaq) + '#connection-errors" target="_blank">More info</a>]'
        });
    },
    notifications: [],
    cleanNotifications: function () {
        for (var _i = 0, _a = QR.notifications; _i < _a.length; _i++) {
            var notification = _a[_i];
            notification.close();
        }
        return QR.notifications = [];
    },
    /* Returns true if the QR is disabled. */
    status: function () {
        var disabled, value;
        if (!QR.nodes) {
            return;
        }
        var thread = QR.posts[0].thread;
        if ((thread !== 'new') && globals_1.g.threads.get("".concat(globals_1.g.BOARD, ".").concat(thread)).isDead) {
            value = 'Dead';
            disabled = true;
            QR.cooldown.auto = false;
        }
        value = QR.req ?
            QR.req.progress
            :
                QR.cooldown.seconds || value;
        var status = QR.nodes.status;
        status.value = !value ?
            'Submit'
            : QR.cooldown.auto ?
                "Auto ".concat(value)
                :
                    value;
        status.disabled = disabled || false;
        return status.disabled;
    },
    openPost: function () {
        QR.open();
        if (QR.selected.isLocked) {
            var index = QR.posts.indexOf(QR.selected);
            (QR.posts[index + 1] || new QR.post()).select();
            _1.default.addClass(QR.nodes.el, 'dump');
            return QR.cooldown.auto = true;
        }
    },
    quote: function (e) {
        var _a, _b, _c;
        var range;
        e === null || e === void 0 ? void 0 : e.preventDefault();
        if (!QR.postingIsEnabled) {
            return;
        }
        var sel = globals_1.d.getSelection();
        var post = Get_1.default.postFromNode(this);
        var root = post.nodes.root;
        var postRange = new Range();
        postRange.selectNode(root);
        var text = post.board.ID === globals_1.g.BOARD.ID ? ">>".concat(post, "\n") : ">>>/".concat(post.board, "/").concat(post, "\n");
        for (var i = 0; i < sel.rangeCount; i++) {
            try {
                var insideCode, node;
                range = sel.getRangeAt(i);
                // Trim range to be fully inside post
                if (range.compareBoundaryPoints(Range.START_TO_START, postRange) < 0) {
                    range.setStartBefore(root);
                }
                if (range.compareBoundaryPoints(Range.END_TO_END, postRange) > 0) {
                    range.setEndAfter(root);
                }
                if (!range.toString().trim()) {
                    continue;
                }
                var frag = range.cloneContents();
                var ancestor = range.commonAncestorContainer;
                // Quoting the insides of a spoiler/code tag.
                if (_1.default.x('ancestor-or-self::*[self::s or contains(@class,"removed-spoiler")]', ancestor)) {
                    _1.default.prepend(frag, _1.default.tn('[spoiler]'));
                    _1.default.add(frag, _1.default.tn('[/spoiler]'));
                }
                if (insideCode = _1.default.x('ancestor-or-self::pre[contains(@class,"prettyprint")]', ancestor)) {
                    _1.default.prepend(frag, _1.default.tn('[code]'));
                    _1.default.add(frag, _1.default.tn('[/code]'));
                }
                for (var _i = 0, _d = (0, __1.default)((insideCode ? 'br' : '.prettyprint br'), frag); _i < _d.length; _i++) {
                    node = _d[_i];
                    _1.default.replace(node, _1.default.tn('\n'));
                }
                for (var _e = 0, _f = (0, __1.default)('br', frag); _e < _f.length; _e++) {
                    node = _f[_e];
                    if (node !== frag.lastChild) {
                        _1.default.replace(node, _1.default.tn('\n>'));
                    }
                }
                (_b = (_a = globals_1.g.SITE).insertTags) === null || _b === void 0 ? void 0 : _b.call(_a, frag);
                for (var _g = 0, _h = (0, __1.default)('.linkify[data-original]', frag); _g < _h.length; _g++) {
                    node = _h[_g];
                    _1.default.replace(node, _1.default.tn(node.dataset.original));
                }
                for (var _j = 0, _k = (0, __1.default)('.embedder', frag); _j < _k.length; _j++) {
                    node = _k[_j];
                    if (((_c = node.previousSibling) === null || _c === void 0 ? void 0 : _c.nodeValue) === ' ') {
                        _1.default.rm(node.previousSibling);
                    }
                    _1.default.rm(node);
                }
                text += ">".concat(frag.textContent.trim(), "\n");
            }
            catch (error) { }
        }
        QR.openPost();
        var _l = QR.nodes, com = _l.com, thread = _l.thread;
        if (!com.value) {
            thread.value = Get_1.default.threadFromNode(this);
        }
        var wasOnlyQuotes = QR.selected.isOnlyQuotes();
        var caretPos = com.selectionStart;
        // Replace selection for text.
        com.value = com.value.slice(0, caretPos) + text + com.value.slice(com.selectionEnd);
        // Move the caret to the end of the new quote.
        range = caretPos + text.length;
        com.setSelectionRange(range, range);
        com.focus();
        // This allows us to determine if any text other than quotes has been typed.
        if (wasOnlyQuotes) {
            QR.selected.quotedText = com.value;
        }
        QR.selected.save(com);
        return QR.selected.save(thread);
    },
    characterCount: function () {
        var counter = QR.nodes.charCount;
        var count = QR.nodes.com.value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length;
        counter.textContent = count.toString();
        counter.hidden = count < (QR.max_comment / 2);
        var splitPost = QR.nodes.splitPost;
        splitPost.hidden = count < QR.max_comment;
        return (count > QR.max_comment ? _1.default.addClass : _1.default.rmClass)(counter, 'warning');
    },
    splitPost: function () {
        var _a;
        if (QR.selected.isLocked)
            return;
        var count = QR.nodes.com.value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length;
        if (count < QR.max_comment)
            return;
        var text = QR.nodes.com.value;
        var lastPostLength = 0;
        var splitCount = 0;
        var idx = QR.posts.indexOf(QR.selected);
        QR.selected.setComment("");
        for (var _i = 0, _b = text.split("\n"); _i < _b.length; _i++) {
            var line = _b[_i];
            var currentLength = line.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length + 1; // +1 for newline at end
            if (currentLength + lastPostLength > QR.max_comment) {
                var post_1 = new QR.post(true);
                post_1.setComment(line);
                lastPostLength = currentLength;
                splitCount++;
            }
            else {
                var newComment = [QR.selected.com, line].filter(function (el) { return el !== null; }).join('\n');
                QR.selected.setComment(newComment);
                lastPostLength += currentLength;
            }
        }
        var newPostIdx = QR.posts.length - splitCount;
        var newPosts = QR.posts.splice(newPostIdx, splitCount);
        (_a = QR.posts).splice.apply(_a, __spreadArray([idx + 1, 0], newPosts, false));
        var rearrangedDumpList = __spreadArray([], QR.nodes.dumpList.children, true);
        var newDumps = rearrangedDumpList.splice(newPostIdx, splitCount);
        rearrangedDumpList.splice.apply(rearrangedDumpList, __spreadArray([idx + 1, 0], newDumps, false));
        for (var _c = 0, rearrangedDumpList_1 = rearrangedDumpList; _c < rearrangedDumpList_1.length; _c++) {
            var e = rearrangedDumpList_1[_c];
            QR.nodes.dumpList.appendChild(e);
        }
        QR.nodes.el.classList.add('dump');
    },
    getFile: function () {
        var _a;
        return _1.default.event('QRFile', (_a = QR.selected) === null || _a === void 0 ? void 0 : _a.file);
    },
    drawFile: function (e) {
        var _a;
        var file = (_a = QR.selected) === null || _a === void 0 ? void 0 : _a.file;
        if (!file || !/^(image|video)\//.test(file.type)) {
            return;
        }
        var isVideo = /^video\//.test(file);
        var el = _1.default.el((isVideo ? 'video' : 'img'));
        _1.default.on(el, 'error', function () { return QR.openError(); });
        _1.default.on(el, (isVideo ? 'loadeddata' : 'load'), function () {
            e.target.getContext('2d').drawImage(el, 0, 0);
            URL.revokeObjectURL(el.src);
            return _1.default.event('QRImageDrawn', null, e.target);
        });
        return el.src = URL.createObjectURL(file);
    },
    openError: function () {
        var div = _1.default.el('div');
        _1.default.extend(div, {
            innerHTML: 'Could not open file. [<a href="' + (0, globals_1.E)(package_json_1.default.upstreamFaq) + '#error-reading-metadata" target="_blank">More info</a>]'
        });
        return QR.error(div);
    },
    setFile: function (e) {
        var _a = e.detail, file = _a.file, name = _a.name, source = _a.source;
        if (name != null) {
            file.name = name;
        }
        if (source != null) {
            file.source = source;
        }
        QR.open();
        return QR.handleFiles([file]);
    },
    drag: function (e) {
        // Let it drag anything from the page.
        var toggle = e.type === 'dragstart' ? _1.default.off : _1.default.on;
        toggle(globals_1.d, 'dragover', QR.dragOver);
        return toggle(globals_1.d, 'drop', QR.dropFile);
    },
    dragOver: function (e) {
        e.preventDefault();
        return e.dataTransfer.dropEffect = 'copy';
    }, // cursor feedback
    dropFile: function (e) {
        // Let it only handle files from the desktop.
        if (!e.dataTransfer.files.length) {
            return;
        }
        e.preventDefault();
        QR.open();
        return QR.handleFiles(e.dataTransfer.files);
    },
    paste: function (e) {
        if (!e.clipboardData.items) {
            return;
        }
        var file = null;
        var score = -1;
        for (var _i = 0, _a = e.clipboardData.items; _i < _a.length; _i++) {
            var item = _a[_i];
            var file2;
            if ((item.kind === 'file') && (file2 = item.getAsFile())) {
                var score2 = (2 * +(file2.size <= QR.max_size)) + +(file2.type === 'image/png');
                if (score2 > score) {
                    file = file2;
                    score = score2;
                }
            }
        }
        if (file) {
            var type = file.type;
            var blob = new Blob([file], { type: type });
            blob.name = "".concat(globals_1.Conf['pastedname'], ".").concat(_1.default.getOwn(QR.extensionFromType, type) || 'jpg');
            QR.open();
            QR.handleFiles([blob]);
        }
    },
    pasteFF: function () {
        var pasteArea = QR.nodes.pasteArea;
        if (!pasteArea.childNodes.length) {
            return;
        }
        var images = (0, __1.default)('img', pasteArea);
        _1.default.rmAll(pasteArea);
        for (var _i = 0, images_1 = images; _i < images_1.length; _i++) {
            var img = images_1[_i];
            var m;
            var src = img.src;
            if (m = src.match(/data:(image\/(\w+));base64,(.+)/)) {
                var bstr = atob(m[3]);
                var arr = new Uint8Array(bstr.length);
                for (var i = 0; i < bstr.length; i++) {
                    arr[i] = bstr.charCodeAt(i);
                }
                var blob = new Blob([arr], { type: m[1] });
                blob.name = "".concat(globals_1.Conf['pastedname'], ".").concat(m[2]);
                QR.handleFiles([blob]);
            }
            else if (/^https?:\/\//.test(src)) {
                QR.handleUrl(src);
            }
        }
    },
    handleUrl: function (urlDefault) {
        QR.open();
        var selected = QR.selected;
        selected.preventAutoPost();
        CrossOrigin_1.default.permission(function () {
            var url = prompt('Enter a URL:', urlDefault);
            if (!url)
                return;
            QR.nodes.fileButton.focus();
            CrossOrigin_1.default.file(url, function (blob) {
                if (blob && !/^text\//.test(blob.type)) {
                    selected.setFile(blob);
                    _1.default.addClass(QR.nodes.el, 'dump');
                }
                else {
                    QR.error("Can't load file.");
                }
            });
        });
    },
    handleFiles: function (files) {
        if (this !== QR) { // file input
            files = __spreadArray([], this.files, true);
            this.value = null;
        }
        if (!files.length) {
            return;
        }
        QR.cleanNotifications();
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            QR.handleFile(file, files.length);
        }
        _1.default.addClass(QR.nodes.el, 'dump');
        if ((globals_1.d.activeElement === QR.nodes.fileButton) && _1.default.hasClass(QR.nodes.fileSubmit, 'has-file')) {
            return QR.nodes.filename.focus();
        }
    },
    handleFile: function (file, nfiles) {
        var post;
        var isText = /^text\//.test(file.type);
        if (nfiles === 1) {
            post = QR.selected;
        }
        else {
            post = QR.posts[QR.posts.length - 1];
            if (isText ? post.com || post.pasting : post.file) {
                post = new QR.post();
            }
        }
        return post[isText ? 'pasteText' : 'setFile'](file);
    },
    openFileInput: function () {
        if (QR.nodes.fileButton.disabled) {
            return;
        }
        QR.nodes.fileInput.click();
        return QR.nodes.fileButton.focus();
    },
    generatePostableThreadsList: function () {
        if (!QR.nodes) {
            return;
        }
        var list = QR.nodes.thread;
        var options = [list.firstElementChild];
        for (var _i = 0, _a = globals_1.g.BOARD.threads.keys; _i < _a.length; _i++) {
            var thread = _a[_i];
            options.push(_1.default.el('option', {
                value: thread,
                textContent: "Thread ".concat(thread)
            }));
        }
        var val = list.value;
        _1.default.rmAll(list);
        _1.default.add(list, options);
        list.value = val;
        if (list.value === val) {
            return;
        }
        // Fix the value if the option disappeared.
        list.value = globals_1.g.VIEW === 'thread' ?
            globals_1.g.THREADID
            :
                'new';
        return (globals_1.g.VIEW === 'thread' ? _1.default.addClass : _1.default.rmClass)(QR.nodes.el, 'reply-to-thread');
    },
    dialog: function () {
        var _this = this;
        var dialog, event, nodes;
        var name;
        QR.nodes = (nodes = {
            el: (dialog = UI_1.default.dialog('qr', { innerHTML: QuickReply_html_1.default }))
        });
        var setNode = function (name, query) { return nodes[name] = (0, _1.default)(query, dialog); };
        setNode('move', '.move');
        setNode('autohide', '#autohide');
        setNode('close', '.close');
        setNode('thread', 'select');
        setNode('form', 'form');
        setNode('sjisToggle', '#sjis-toggle');
        setNode('texButton', '#tex-preview-button');
        setNode('name', '[data-name=name]');
        setNode('email', '[data-name=email]');
        setNode('sub', '[data-name=sub]');
        setNode('com', '[data-name=com]');
        setNode('charCount', '#char-count');
        setNode('texPreview', '#tex-preview');
        setNode('dumpList', '#dump-list');
        setNode('addPost', '#add-post');
        setNode('oekaki', '.oekaki');
        setNode('drawButton', '#qr-draw-button');
        setNode('randomizeButton', '#qr-randomize');
        setNode('compress', '#qr-jpg');
        setNode('view', '#qr-view');
        setNode('restoreNameButton', '#qr-restore-name');
        setNode('fileSubmit', '#file-n-submit');
        setNode('fileButton', '#qr-file-button');
        setNode('noFile', '#qr-no-file');
        setNode('filename', '#qr-filename');
        setNode('spoiler', '#qr-file-spoiler');
        setNode('oekakiButton', '#qr-oekaki-button');
        setNode('fileRM', '#qr-filerm');
        setNode('urlButton', '#url-button');
        setNode('pasteArea', '#paste-area');
        setNode('customCooldown', '#custom-cooldown-button');
        setNode('dumpButton', '#dump-button');
        setNode('status', '[type=submit]');
        setNode('flashTag', '[name=filetag]');
        setNode('fileInput', '[type=file]');
        setNode('splitPost', '#split-post');
        var config = globals_1.g.BOARD.config;
        var classList = QR.nodes.el.classList;
        classList.toggle('forced-anon', QR.forcedAnon);
        classList.toggle('has-spoiler', QR.spoiler);
        classList.toggle('has-sjis', !!config.sjis_tags);
        classList.toggle('has-math', !!config.math_tags);
        classList.toggle('sjis-preview', !!config.sjis_tags && globals_1.Conf['sjisPreview']);
        classList.toggle('show-new-thread-option', globals_1.Conf['Show New Thread Option in Threads']);
        if (parseInt(globals_1.Conf['customCooldown'], 10) > 0) {
            _1.default.addClass(QR.nodes.fileSubmit, 'custom-cooldown');
            _1.default.get('customCooldownEnabled', globals_1.Conf['customCooldownEnabled'], function (_a) {
                var customCooldownEnabled = _a.customCooldownEnabled;
                QR.setCustomCooldown(customCooldownEnabled);
                return _1.default.sync('customCooldownEnabled', QR.setCustomCooldown);
            });
        }
        QR.flagsInput();
        _1.default.on(nodes.autohide, 'change', QR.toggleHide);
        _1.default.on(nodes.close, 'click', QR.close);
        _1.default.on(nodes.status, 'click', QR.submit);
        _1.default.on(nodes.form, 'submit', QR.submit);
        _1.default.on(nodes.sjisToggle, 'click', QR.toggleSJIS);
        _1.default.on(nodes.texButton, 'mousedown', QR.texPreviewShow);
        _1.default.on(nodes.texButton, 'mouseup', QR.texPreviewHide);
        _1.default.on(nodes.addPost, 'click', function () { return new QR.post(true); });
        _1.default.on(nodes.drawButton, 'click', QR.oekaki.draw);
        _1.default.on(nodes.fileButton, 'click', QR.openFileInput);
        _1.default.on(nodes.noFile, 'click', QR.openFileInput);
        _1.default.on(nodes.randomizeButton, 'click', function () { QR.selected.randomizeName(); });
        _1.default.on(nodes.compress, 'click', function () { return __awaiter(_this, void 0, void 0, function () { var _a, _b; return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = (_a = QR).handleFiles;
                    return [4 /*yield*/, QR.convert(QR.selected.file)];
                case 1:
                    _b.apply(_a, [[_c.sent()]]);
                    return [2 /*return*/];
            }
        }); }); });
        _1.default.on(nodes.view, 'click', QR.preview);
        _1.default.on(nodes.restoreNameButton, 'click', function () { QR.selected.restoreName(); });
        _1.default.on(nodes.filename, 'focus', function () { return _1.default.addClass(this.parentNode, 'focus'); });
        _1.default.on(nodes.filename, 'blur', function () { return _1.default.rmClass(this.parentNode, 'focus'); });
        _1.default.on(nodes.spoiler, 'change', function () { return QR.selected.nodes.spoiler.click(); });
        _1.default.on(nodes.oekakiButton, 'click', QR.oekaki.button);
        _1.default.on(nodes.fileRM, 'click', function () { return QR.selected.rmFile(); });
        _1.default.on(nodes.urlButton, 'click', function () { return QR.handleUrl(''); });
        _1.default.on(nodes.customCooldown, 'click', QR.toggleCustomCooldown);
        _1.default.on(nodes.dumpButton, 'click', function () { return nodes.el.classList.toggle('dump'); });
        _1.default.on(nodes.fileInput, 'change', QR.handleFiles);
        _1.default.on(nodes.splitPost, 'click', QR.splitPost);
        window.addEventListener('focus', QR.focus, true);
        window.addEventListener('blur', QR.focus, true);
        // We don't receive blur events from captcha iframe.
        _1.default.on(globals_1.d, 'click', QR.focus);
        // XXX Workaround for image pasting in Firefox, obsolete as of v50.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=906420
        if ((_1.default.engine === 'gecko') && !window.DataTransferItemList) {
            nodes.pasteArea.hidden = false;
        }
        new MutationObserver(QR.pasteFF).observe(nodes.pasteArea, { childList: true });
        // save selected post's data
        var items = ['thread', 'name', 'email', 'sub', 'com', 'filename', 'flag'];
        var i = 0;
        var save = function () { QR.selected.save(this); };
        while ((name = items[i++])) {
            var node;
            if (!(node = nodes[name])) {
                continue;
            }
            event = node.nodeName === 'SELECT' ? 'change' : 'input';
            _1.default.on(nodes[name], event, save);
        }
        if (globals_1.Conf['Remember QR Size']) {
            _1.default.get('QR Size', '', function (item) { return nodes.com.style.cssText = item['QR Size']; });
            _1.default.on(nodes.com, 'mouseup', function (e) {
                if (e.button !== 0) {
                    return;
                }
                _1.default.set('QR Size', this.style.cssText);
            });
        }
        QR.generatePostableThreadsList();
        QR.persona.load();
        new QR.post(true);
        QR.status();
        QR.cooldown.setup();
        QR.captcha.init();
        _1.default.add(globals_1.d.body, dialog);
        QR.captcha.setup();
        QR.oekaki.setup();
        // Create a custom event when the QR dialog is first initialized.
        // Use it to extend the QR's functionalities, or for XTRM RICE.
        _1.default.event('QRDialogCreation', null, dialog);
        icon_1.default.set(nodes.oekakiButton, 'pencil');
        icon_1.default.set(nodes.urlButton, 'link');
        icon_1.default.set(nodes.pasteArea, 'clipboard');
        icon_1.default.set(nodes.customCooldown, 'clock');
        icon_1.default.set(nodes.randomizeButton, 'shuffle');
        icon_1.default.set(nodes.compress, 'shrink');
        icon_1.default.set(nodes.view, 'eye');
        icon_1.default.set(nodes.restoreNameButton, 'undo');
        icon_1.default.set(nodes.splitPost, 'scissors');
        icon_1.default.set(nodes.fileRM, 'xmark');
        icon_1.default.set(nodes.close, 'xmark');
        icon_1.default.set(nodes.dumpButton, 'squarePlus');
        icon_1.default.set(nodes.addPost, 'plus');
    },
    flags: function () {
        var select = _1.default.el('select', {
            name: 'flag',
            className: 'flagSelector'
        });
        var addFlag = function (value, textContent) { return _1.default.add(select, _1.default.el('option', { value: value, textContent: textContent })); };
        addFlag('0', (globals_1.g.BOARD.config.country_flags ? 'Geographic Location' : 'None'));
        for (var value in globals_1.g.BOARD.config.board_flags) {
            var textContent = globals_1.g.BOARD.config.board_flags[value];
            addFlag(value, textContent);
        }
        return select;
    },
    flagsInput: function () {
        var nodes = QR.nodes;
        if (!nodes) {
            return;
        }
        if (nodes.flag) {
            _1.default.rm(nodes.flag);
            delete nodes.flag;
        }
        if (globals_1.g.BOARD.config.board_flags) {
            var flag = QR.flags();
            flag.dataset.name = 'flag';
            flag.dataset.default = '0';
            nodes.flag = flag;
            return _1.default.add(nodes.form, flag);
        }
    },
    submit: function (e) {
        var _a;
        var captcha, err, filetag;
        e === null || e === void 0 ? void 0 : e.preventDefault();
        var force = e === null || e === void 0 ? void 0 : e.shiftKey;
        if (QR.req) {
            QR.abort();
            return;
        }
        _1.default.forceSync('cooldowns');
        if (QR.cooldown.seconds) {
            if (force) {
                QR.cooldown.clear();
            }
            else {
                QR.cooldown.auto = !QR.cooldown.auto;
                QR.status();
                return;
            }
        }
        var post = QR.posts[0];
        delete post.quotedText;
        post.forceSave();
        var threadID = post.thread;
        var thread = globals_1.g.BOARD.threads.get(threadID);
        if ((globals_1.g.BOARD.ID === 'f') && (threadID === 'new')) {
            filetag = QR.nodes.flashTag.value;
        }
        // prevent errors
        if (threadID === 'new') {
            threadID = null;
            if (!!globals_1.g.BOARD.config.require_subject && !post.sub) {
                err = 'New threads require a subject.';
            }
            else if (!!!globals_1.g.BOARD.config.text_only && !post.file) {
                err = 'No file selected.';
            }
        }
        else if (globals_1.g.BOARD.threads.get(threadID).isClosed) {
            err = 'You can\'t reply to this thread anymore.';
        }
        else if (!post.com && !post.file) {
            err = 'No comment or file.';
        }
        else if (post.file && thread.fileLimit) {
            err = 'Max limit of image replies has been reached.';
        }
        if ((globals_1.g.BOARD.ID === 'r9k') && !((_a = post.com) === null || _a === void 0 ? void 0 : _a.match(/[a-z-]/i))) {
            if (!err) {
                err = 'Original comment required.';
            }
        }
        if (QR.captcha.isEnabled && !((QR.captcha === Captcha_1.default.v2) && /\b_ct=/.test(globals_1.d.cookie) && threadID) && !(err && !force)) {
            captcha = QR.captcha.getOne(!!threadID);
            if (QR.captcha === Captcha_1.default.v2) {
                if (!captcha) {
                    captcha = Captcha_1.default.cache.request(!!threadID);
                }
            }
            if (!captcha) {
                err = 'No valid captcha.';
                QR.captcha.setup(!QR.cooldown.auto || (globals_1.d.activeElement === QR.nodes.status));
            }
        }
        QR.cleanNotifications();
        if (err && !force) {
            // stop auto-posting
            QR.cooldown.auto = false;
            QR.status();
            QR.error(err);
            return;
        }
        // Enable auto-posting if we have stuff to post, disable it otherwise.
        QR.cooldown.auto = QR.posts.length > 1;
        post.lock();
        var formData = {
            MAX_FILE_SIZE: QR.max_size,
            mode: 'regist',
            pwd: QR.persona.getPassword(),
            resto: threadID,
            name: (!QR.forcedAnon ? post.name : undefined),
            email: post.email,
            sub: (!QR.forcedAnon && !threadID ? post.sub : undefined),
            com: post.com,
            upfile: post.file,
            filetag: filetag,
            spoiler: post.spoiler,
            flag: post.flag,
        };
        var options = {
            responseType: 'document',
            withCredentials: true,
            onloadend: QR.response,
            form: _1.default.formData(formData)
        };
        if (globals_1.Conf['Show Upload Progress']) {
            options.onprogress = function (e) {
                var _a;
                if (this !== ((_a = QR.req) === null || _a === void 0 ? void 0 : _a.upload)) {
                    return;
                } // aborted
                if (e.loaded < e.total) {
                    // Uploading...
                    QR.req.progress = "".concat(Math.round((e.loaded / e.total) * 100), "%");
                }
                else {
                    // Upload done, waiting for server response.
                    QR.req.isUploadFinished = true;
                    QR.req.progress = '...';
                }
                return QR.status();
            };
        }
        var cb = function (response) {
            if (response != null) {
                QR.currentCaptcha = response;
                if (QR.captcha === Captcha_1.default.v2) {
                    if (response.challenge != null) {
                        options.form.append('recaptcha_challenge_field', response.challenge);
                        options.form.append('recaptcha_response_field', response.response);
                    }
                    else {
                        options.form.append('g-recaptcha-response', response.response);
                    }
                }
                else {
                    for (var key in response) {
                        var val = response[key];
                        options.form.append(key, val);
                    }
                }
            }
            QR.req = _1.default.ajax("https://sys.".concat(location.hostname.split('.')[1], ".org/").concat(globals_1.g.BOARD, "/post"), options);
            QR.req.progress = '...';
        };
        if (typeof captcha === 'function') {
            // Wait for captcha to be verified before submitting post.
            QR.req = {
                progress: '...',
                abort: function () {
                    if (QR.captcha === Captcha_1.default.v2) {
                        Captcha_1.default.cache.abort();
                    }
                    cb = null;
                }
            };
            captcha(function (response) {
                if ((QR.captcha === Captcha_1.default.v2) && Captcha_1.default.cache.haveCookie()) {
                    cb === null || cb === void 0 ? void 0 : cb();
                    if (response) {
                        return Captcha_1.default.cache.save(response);
                    }
                }
                else if (response) {
                    cb === null || cb === void 0 ? void 0 : cb(response);
                }
                else {
                    delete QR.req;
                    post.unlock();
                    QR.cooldown.auto = !!Captcha_1.default.cache.getCount();
                    QR.status();
                }
            });
        }
        else {
            cb(captcha);
        }
        // Starting to upload might take some time.
        // Provide some feedback that we're starting to submit.
        QR.status();
    },
    response: function () {
        var _a, _b, _c;
        var connErr, err;
        if (this !== QR.req) {
            return;
        } // aborted
        delete QR.req;
        var post = QR.posts[0];
        post.unlock();
        if (err = (_a = this.response) === null || _a === void 0 ? void 0 : _a.getElementById('errmsg')) { // error!
            var el = (0, _1.default)('a', err);
            if (el)
                el.target = '_blank'; // duplicate image link
        }
        else if (connErr = (!this.response || (this.response.title !== 'Post successful!'))) {
            err = QR.connectionError();
            if ((QR.captcha === Captcha_1.default.v2) && QR.currentCaptcha) {
                Captcha_1.default.cache.save(QR.currentCaptcha);
            }
        }
        else if (this.status !== 200) {
            err = "Error ".concat(this.statusText, " (").concat(this.status, ")");
        }
        if (!connErr) {
            (_c = (_b = QR.captcha).setUsed) === null || _c === void 0 ? void 0 : _c.call(_b);
        }
        delete QR.currentCaptcha;
        if (err) {
            var m = void 0;
            QR.errorCount = (QR.errorCount || 0) + 1;
            if (/captcha|verification/i.test(err.textContent)) {
                // Remove the obnoxious 4chan Pass ad.
                if (/mistyped/i.test(err.textContent)) {
                    err = 'You mistyped the CAPTCHA, or the CAPTCHA malfunctioned.';
                }
                else if (/expired/i.test(err.textContent)) {
                    err = 'This CAPTCHA is no longer valid because it has expired.';
                }
                // Do not auto post with a wrong captcha.
                QR.cooldown.auto = false;
            }
            else if (connErr) {
                if (QR.errorCount >= 5) {
                    // Too many posting errors can ban you. Stop autoposting after 5 errors.
                    QR.cooldown.auto = false;
                }
                else {
                    // Something must've gone terribly wrong if you get captcha errors without captchas.
                    // Don't auto-post indefinitely in that case.
                    QR.cooldown.auto = QR.captcha.isEnabled || connErr;
                    // Too many frequent mistyped captchas will auto-ban you!
                    // On connection error, the post most likely didn't go through.
                    // If the post did go through, it should be stopped by the duplicate reply cooldown.
                    QR.cooldown.addDelay(post, 2);
                }
            }
            else if (err.textContent && (m = err.textContent.match(/\d+\s+(?:minute|second)/gi)) && !/duplicate|hour/i.test(err.textContent)) {
                QR.cooldown.auto = !/have\s+been\s+muted/i.test(err.textContent);
                var seconds = 0;
                for (var _i = 0, m_1 = m; _i < m_1.length; _i++) {
                    var mi = m_1[_i];
                    seconds += (/minute/i.test(mi) ? 60 : 1) * (+mi.match(/\d+/)[0]);
                }
                if (/muted/i.test(err.textContent)) {
                    QR.cooldown.addMute(seconds);
                }
                else {
                    QR.cooldown.addDelay(post, seconds);
                }
            }
            else { // stop auto-posting
                QR.cooldown.auto = false;
            }
            QR.captcha.setup(QR.cooldown.auto && [QR.nodes.status, globals_1.d.body].includes(globals_1.d.activeElement));
            QR.status();
            QR.error(err);
            return;
        }
        delete QR.errorCount;
        var h1 = (0, _1.default)('h1', this.response);
        var _d = h1.nextSibling.textContent.match(/thread:(\d+),no:(\d+)/), _ = _d[0], threadID = _d[1], postID = _d[2];
        postID = +postID;
        threadID = +threadID || postID;
        var isReply = threadID !== postID;
        // Post/upload confirmed as successful.
        _1.default.event('QRPostSuccessful', {
            boardID: globals_1.g.BOARD.ID,
            threadID: threadID,
            postID: postID
        });
        // XXX deprecated
        _1.default.event('QRPostSuccessful_', { boardID: globals_1.g.BOARD.ID, threadID: threadID, postID: postID });
        // Enable auto-posting if we have stuff left to post, disable it otherwise.
        var postsCount = QR.posts.length - 1;
        QR.cooldown.auto = postsCount && isReply;
        var lastPostToThread = !((function () { for (var _i = 0, _a = QR.posts.slice(1); _i < _a.length; _i++) {
            var p = _a[_i];
            if (p.thread === post.thread) {
                return true;
            }
        } })());
        if (postsCount) {
            post.rm();
            QR.captcha.setup(globals_1.d.activeElement === QR.nodes.status);
        }
        else if (globals_1.Conf['Persistent QR']) {
            post.rm();
            if (globals_1.Conf['Auto Hide QR']) {
                QR.hide();
            }
            else {
                QR.blur();
            }
        }
        else {
            QR.close();
        }
        QR.cleanNotifications();
        if (globals_1.Conf['Posting Success Notifications']) {
            QR.notifications.push(new Notice_1.default('success', h1.textContent, 5));
        }
        QR.cooldown.add(threadID, postID);
        var URL = threadID === postID ? ( // new thread
        "".concat(window.location.origin, "/").concat(globals_1.g.BOARD, "/thread/").concat(threadID)) : (threadID !== globals_1.g.THREADID) && lastPostToThread && globals_1.Conf['Open Post in New Tab'] ? ( // replying from the index or a different thread
        "".concat(window.location.origin, "/").concat(globals_1.g.BOARD, "/thread/").concat(threadID, "#p").concat(postID)) : undefined;
        if (URL) {
            var open_1 = globals_1.Conf['Open Post in New Tab'] || postsCount ?
                function () { return _1.default.open(URL); }
                :
                    function () { return location.href = URL; };
            if (threadID === postID) {
                // XXX 4chan sometimes responds before the thread exists.
                QR.waitForThread(URL, open_1);
            }
            else {
                open_1();
            }
        }
        QR.status();
    },
    waitForThread: function (url, cb) {
        var attempts = 0;
        var check = function () {
            _1.default.ajax(url, {
                onloadend: function () {
                    attempts++;
                    if ((attempts >= 6) || (this.status === 200)) {
                        return cb();
                    }
                    else {
                        return setTimeout(check, attempts * helpers_1.SECOND);
                    }
                },
                responseType: 'text',
                type: 'HEAD'
            });
        };
        check();
    },
    abort: function () {
        var oldReq;
        if ((oldReq = QR.req) && !QR.req.isUploadFinished) {
            delete QR.req;
            oldReq.abort();
            if ((QR.captcha === Captcha_1.default.v2) && QR.currentCaptcha) {
                Captcha_1.default.cache.save(QR.currentCaptcha);
            }
            delete QR.currentCaptcha;
            QR.posts[0].unlock();
            QR.cooldown.auto = false;
            QR.notifications.push(new Notice_1.default('info', 'QR upload aborted.', 5));
        }
        QR.status();
    },
    getMaxSize: function (file) {
        var max = QR.max_size;
        if (file.type.startsWith('video/'))
            max = Math.min(max, QR.max_size_video);
        return max;
    },
    convert: function (file_1) {
        return __awaiter(this, arguments, void 0, function (file, type, options) {
            var maxSize, img, _a, width, height, newName, mime, canvas, toBlob, newFile, quality, _b;
            if (type === void 0) { type = 'jpeg'; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        maxSize = (options === null || options === void 0 ? void 0 : options.maxSize) || this.getMaxSize(file);
                        _a = (options === null || options === void 0 ? void 0 : options.img);
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, createImageBitmap(file)];
                    case 1:
                        _a = (_c.sent());
                        _c.label = 2;
                    case 2:
                        img = _a;
                        width = (options === null || options === void 0 ? void 0 : options.width) || img.width;
                        height = (options === null || options === void 0 ? void 0 : options.height) || img.height;
                        newName = file.name.replace(/\.[a-z]+$/i, '.' + type);
                        mime = 'image/' + type;
                        if (window.OffscreenCanvas && !globals_1.Conf['Avoid OffscreenCanvas']) {
                            canvas = new OffscreenCanvas(width, height);
                            toBlob = function (mime, quality) { return canvas.convertToBlob({ type: mime, quality: quality }); };
                        }
                        else {
                            canvas = _1.default.el('canvas', { width: width, height: height });
                            toBlob = function (mime, quality) { return new Promise(function (resolve) {
                                canvas.toBlob(resolve, mime, quality);
                            }); };
                        }
                        quality = .9;
                        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                        _c.label = 3;
                    case 3:
                        _b = File.bind;
                        return [4 /*yield*/, toBlob(mime, quality)];
                    case 4:
                        newFile = new (_b.apply(File, [void 0, [_c.sent()], newName, { type: mime }]))();
                        quality -= .1;
                        _c.label = 5;
                    case 5:
                        if (type === 'jpeg' && newFile.size > maxSize && quality >= .1) return [3 /*break*/, 3];
                        _c.label = 6;
                    case 6:
                        if (newFile.size >= file.size && newFile.type === file.type) {
                            new Notice_1.default('warning', "New jpeg file isn't smaller than the old one, so it won't be used.", 3);
                            return [2 /*return*/, file];
                        }
                        return [2 /*return*/, newFile];
                }
            });
        });
    },
    previewUrl: undefined,
    preview: function () {
        if (!QR.selected.file)
            return;
        QR.nodes.preview = _1.default.el('div', { id: 'overlay', className: 'media-preview' });
        _1.default.add(globals_1.d.body, QR.nodes.preview);
        QR.previewUrl = URL.createObjectURL(QR.selected.file);
        if (QR.selected.file.type.startsWith('video/')) {
            var video = _1.default.el('video', { controls: true, src: QR.previewUrl, autoplay: true });
            _1.default.add(QR.nodes.preview, video);
            video.focus();
        }
        else {
            _1.default.add(QR.nodes.preview, _1.default.el('img', { src: QR.previewUrl }));
        }
        QR.nodes.preview.addEventListener('click', function (e) {
            if (e.target.tagName !== 'VIDEO')
                QR.closePreview();
        });
    },
    closePreview: function () {
        QR.nodes.preview.remove();
        URL.revokeObjectURL(QR.previewUrl);
    },
    cooldown: {
        seconds: 0,
        delays: {
            deletion: 60
        }, // cooldown for deleting posts/files
        // set in setup
        maxDelay: 0,
        isSetup: false,
        auto: false,
        data: {},
        // Called from Main
        init: function () {
            if (!globals_1.Conf['Quick Reply']) {
                return;
            }
            this.data = globals_1.Conf['cooldowns'];
            this.changes = (0, helpers_1.dict)();
            _1.default.sync('cooldowns', this.sync);
        },
        // Called from QR
        setup: function () {
            // Read cooldown times
            _1.default.extend(QR.cooldown.delays, globals_1.g.BOARD.cooldowns());
            // The longest reply cooldown, for use in pruning old reply data
            QR.cooldown.maxDelay = 0;
            for (var type in QR.cooldown.delays) {
                var delay = QR.cooldown.delays[type];
                if (!['thread', 'thread_global'].includes(type)) {
                    QR.cooldown.maxDelay = Math.max(QR.cooldown.maxDelay, delay);
                }
            }
            QR.cooldown.isSetup = true;
            QR.cooldown.start();
        },
        start: function () {
            var data = QR.cooldown.data;
            if (!globals_1.Conf['Cooldown'] ||
                !QR.cooldown.isSetup ||
                !!QR.cooldown.isCounting ||
                ((Object.keys(data[globals_1.g.BOARD.ID] || {}).length + Object.keys(data.global || {}).length) <= 0)) {
                return;
            }
            QR.cooldown.isCounting = true;
            QR.cooldown.count();
        },
        sync: function (data) {
            QR.cooldown.data = data || (0, helpers_1.dict)();
            QR.cooldown.start();
        },
        add: function (threadID, postID) {
            if (!globals_1.Conf['Cooldown']) {
                return;
            }
            var start = Date.now();
            var boardID = globals_1.g.BOARD.ID;
            QR.cooldown.set(boardID, start, { threadID: threadID, postID: postID });
            if (threadID === postID) {
                QR.cooldown.set('global', start, { boardID: boardID, threadID: threadID, postID: postID });
            }
            QR.cooldown.save();
            QR.cooldown.start();
        },
        addDelay: function (post, delay) {
            if (!globals_1.Conf['Cooldown']) {
                return;
            }
            var cooldown = QR.cooldown.categorize(post);
            cooldown.delay = delay;
            QR.cooldown.set(globals_1.g.BOARD.ID, Date.now(), cooldown);
            QR.cooldown.save();
            QR.cooldown.start();
        },
        addMute: function (delay) {
            if (!globals_1.Conf['Cooldown']) {
                return;
            }
            QR.cooldown.set(globals_1.g.BOARD.ID, Date.now(), { type: 'mute', delay: delay });
            QR.cooldown.save();
            QR.cooldown.start();
        },
        delete: function (post) {
            var cooldown;
            if (!QR.cooldown.data) {
                return;
            }
            var cooldowns = (QR.cooldown.data[post.board.ID] || (QR.cooldown.data[post.board.ID] = (0, helpers_1.dict)()));
            for (var id in cooldowns) {
                cooldown = cooldowns[id];
                if ((cooldown.delay == null) && (cooldown.threadID === post.thread.ID) && (cooldown.postID === post.ID)) {
                    QR.cooldown.set(post.board.ID, id, null);
                }
            }
            QR.cooldown.save();
        },
        secondsDeletion: function (post) {
            if (!QR.cooldown.data || !globals_1.Conf['Cooldown']) {
                return 0;
            }
            var cooldowns = QR.cooldown.data[post.board.ID] || (0, helpers_1.dict)();
            for (var start in cooldowns) {
                var cooldown = cooldowns[start];
                if ((cooldown.delay == null) && (cooldown.threadID === post.thread.ID) && (cooldown.postID === post.ID)) {
                    var seconds = QR.cooldown.delays.deletion - Math.floor((Date.now() - start) / helpers_1.SECOND);
                    return Math.max(seconds, 0);
                }
            }
            return 0;
        },
        categorize: function (post) {
            if (post.thread === 'new') {
                return { type: 'thread' };
            }
            else {
                return {
                    type: !!post.file ? 'image' : 'reply',
                    threadID: +post.thread
                };
            }
        },
        mergeChange: function (data, scope, id, value) {
            if (value) {
                (data[scope] || (data[scope] = (0, helpers_1.dict)()))[id] = value;
            }
            else if (scope in data) {
                delete data[scope][id];
                if (Object.keys(data[scope]).length === 0)
                    delete data[scope];
            }
        },
        set: function (scope, id, value) {
            QR.cooldown.mergeChange(QR.cooldown.data, scope, id, value);
            (QR.cooldown.changes[scope] || (QR.cooldown.changes[scope] = (0, helpers_1.dict)()))[id] = value;
        },
        save: function () {
            var changes = QR.cooldown.changes;
            if (!Object.keys(changes).length) {
                return;
            }
            _1.default.get('cooldowns', (0, helpers_1.dict)(), function (_a) {
                var cooldowns = _a.cooldowns;
                for (var scope in QR.cooldown.changes) {
                    for (var id in QR.cooldown.changes[scope]) {
                        var value = QR.cooldown.changes[scope][id];
                        QR.cooldown.mergeChange(cooldowns, scope, id, value);
                    }
                    QR.cooldown.data = cooldowns;
                }
                _1.default.set('cooldowns', cooldowns, function () { return QR.cooldown.changes = (0, helpers_1.dict)(); });
            });
        },
        clear: function () {
            QR.cooldown.data = (0, helpers_1.dict)();
            QR.cooldown.changes = (0, helpers_1.dict)();
            QR.cooldown.auto = false;
            QR.cooldown.update();
            _1.default.queueTask(_1.default.delete, 'cooldowns');
        },
        update: function () {
            var cooldown;
            if (!QR.cooldown.isCounting) {
                return;
            }
            var save = false;
            var nCooldowns = 0;
            var now = Date.now();
            var _a = QR.cooldown.categorize(QR.posts[0]), type = _a.type, threadID = _a.threadID;
            var seconds = 0;
            if (globals_1.Conf['Cooldown']) {
                for (var _i = 0, _b = [globals_1.g.BOARD.ID, 'global']; _i < _b.length; _i++) {
                    var scope = _b[_i];
                    var cooldowns = (QR.cooldown.data[scope] || (QR.cooldown.data[scope] = (0, helpers_1.dict)()));
                    for (var start in cooldowns) {
                        cooldown = cooldowns[start];
                        start = +start;
                        var elapsed = Math.floor((now - start) / helpers_1.SECOND);
                        if (elapsed < 0) { // clock changed since then?
                            QR.cooldown.set(scope, start, null);
                            save = true;
                            continue;
                        }
                        // Explicit delays from error messages
                        if (cooldown.delay != null) {
                            if (cooldown.delay <= elapsed) {
                                QR.cooldown.set(scope, start, null);
                                save = true;
                            }
                            else if (((cooldown.type === type) && (cooldown.threadID === threadID)) || (cooldown.type === 'mute')) {
                                // Delays only apply to the given post type and thread.
                                seconds = Math.max(seconds, cooldown.delay - elapsed);
                            }
                            continue;
                        }
                        // Clean up expired cooldowns
                        var maxDelay = cooldown.threadID !== cooldown.postID ?
                            QR.cooldown.maxDelay
                            :
                                QR.cooldown.delays[scope === 'global' ? 'thread_global' : 'thread'];
                        if (QR.cooldown.customCooldown) {
                            maxDelay = Math.max(maxDelay, parseInt(globals_1.Conf['customCooldown'], 10));
                        }
                        if (maxDelay <= elapsed) {
                            QR.cooldown.set(scope, start, null);
                            save = true;
                            continue;
                        }
                        if (((type === 'thread') === (cooldown.threadID === cooldown.postID)) && (cooldown.boardID !== globals_1.g.BOARD.ID)) {
                            // Only cooldowns relevant to this post can set the seconds variable:
                            //   reply cooldown with a reply, thread cooldown with a thread.
                            // Inter-board thread cooldowns only apply on boards other than the one they were posted on.
                            var suffix = scope === 'global' ?
                                '_global'
                                :
                                    '';
                            seconds = Math.max(seconds, QR.cooldown.delays[type + suffix] - elapsed);
                            // If additional cooldown is enabled, add the configured seconds to the count.
                            if (QR.cooldown.customCooldown) {
                                seconds = Math.max(seconds, parseInt(globals_1.Conf['customCooldown'], 10) - elapsed);
                            }
                        }
                    }
                    nCooldowns += Object.keys(cooldowns).length;
                }
            }
            if (save) {
                QR.cooldown.save;
            }
            if (nCooldowns) {
                clearTimeout(QR.cooldown.timeout);
                QR.cooldown.timeout = setTimeout(QR.cooldown.count, helpers_1.SECOND);
            }
            else {
                delete QR.cooldown.isCounting;
            }
            // Update the status when we change posting type.
            // Don't get stuck at some random number.
            // Don't interfere with progress status updates.
            var update = seconds !== QR.cooldown.seconds;
            QR.cooldown.seconds = seconds;
            if (update)
                QR.status();
        },
        count: function () {
            QR.cooldown.update();
            if ((QR.cooldown.seconds === 0) && QR.cooldown.auto && !QR.req)
                QR.submit();
        }
    },
    oekaki: {
        menu: {
            init: function () {
                if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Menu'] || !globals_1.Conf['Edit Link'] || !globals_1.Conf['Quick Reply']) {
                    return;
                }
                var a = _1.default.el('a', {
                    className: 'edit-link',
                    href: 'javascript:;',
                    textContent: 'Edit image'
                });
                _1.default.on(a, 'click', this.editFile);
                Menu_1.default.menu.addEntry({
                    el: a,
                    order: 90,
                    open: function (post) {
                        QR.oekaki.menu.post = post;
                        var file = post.file;
                        return QR.postingIsEnabled && !!file && (file.isImage || file.isVideo);
                    }
                });
            },
            editFile: function () {
                var _a;
                var post = QR.oekaki.menu.post;
                QR.quote.call(post.nodes.post);
                var isVideo = post.file.isVideo;
                var currentTime = ((_a = post.file.fullImage) === null || _a === void 0 ? void 0 : _a.currentTime) || 0;
                return CrossOrigin_1.default.file(post.file.url, function (blob) {
                    if (!blob) {
                        QR.error("Can't load file.");
                    }
                    else if (isVideo) {
                        var video_1 = _1.default.el('video');
                        _1.default.on(video_1, 'loadedmetadata', function () {
                            _1.default.on(video_1, 'seeked', function () {
                                var canvas = _1.default.el('canvas', {
                                    width: video_1.videoWidth,
                                    height: video_1.videoHeight
                                });
                                canvas.getContext('2d').drawImage(video_1, 0, 0);
                                canvas.toBlob(function (snapshot) {
                                    snapshot.name = post.file.name.replace(/\.\w+$/, '') + '.png';
                                    QR.handleFiles([snapshot]);
                                    QR.oekaki.edit();
                                });
                            });
                            video_1.currentTime = currentTime;
                        });
                        _1.default.on(video_1, 'error', function () { return QR.openError(); });
                        video_1.src = URL.createObjectURL(blob);
                    }
                    else {
                        blob.name = post.file.name;
                        QR.handleFiles([blob]);
                        QR.oekaki.edit();
                    }
                });
            }
        },
        setup: function () {
            _1.default.global('setupQR');
        },
        load: function (cb) {
            if ((0, _1.default)('script[src^="//s.4cdn.org/js/tegaki"]', globals_1.d.head)) {
                cb();
            }
            else {
                var style = _1.default.el('link', {
                    rel: 'stylesheet',
                    href: "//s.4cdn.org/css/tegaki.".concat(Date.now(), ".css")
                });
                var script = _1.default.el('script', { src: "//s.4cdn.org/js/tegaki.min.".concat(Date.now(), ".js") });
                var n_1 = 0;
                var onload_1 = function () {
                    if (++n_1 === 2)
                        cb();
                };
                _1.default.on(style, 'load', onload_1);
                _1.default.on(script, 'load', onload_1);
                _1.default.add(globals_1.d.head, [style, script]);
            }
        },
        draw: function () {
            return _1.default.global('qrTegakiDraw');
        },
        button: function () {
            if (QR.selected.file) {
                QR.oekaki.edit();
            }
            else {
                QR.oekaki.toggle();
            }
        },
        edit: function () {
            QR.oekaki.load(function () { return _1.default.global('qrTegakiLoad'); });
        },
        toggle: function () {
            QR.oekaki.load(function () { return QR.nodes.oekaki.hidden = !QR.nodes.oekaki.hidden; });
        }
    },
    persona: {
        always: {},
        types: {
            name: [],
            email: [],
            sub: []
        },
        init: function () {
            if (!globals_1.Conf['Quick Reply'] && (!globals_1.Conf['Menu'] || !globals_1.Conf['Delete Link'])) {
                return;
            }
            for (var _i = 0, _a = globals_1.Conf['QR.personas'].split('\n'); _i < _a.length; _i++) {
                var item = _a[_i];
                QR.persona.parseItem(item.trim());
            }
        },
        parseItem: function (item) {
            var _a;
            if (item[0] === '#')
                return;
            var regexMatch = item.match(/(name|options|email|subject|password):"(.*)"/i);
            if (!regexMatch)
                return;
            var needle;
            var match = regexMatch[0], type = regexMatch[1], val = regexMatch[2];
            // Don't mix up item settings with val.
            item = item.replace(match, '');
            var boards = ((_a = item.match(/boards:([^;]+)/i)) === null || _a === void 0 ? void 0 : _a[1].toLowerCase()) || 'global';
            if ((boards !== 'global') && (needle = globals_1.g.BOARD.ID, !boards.split(',').includes(needle))) {
                return;
            }
            if (type === 'password') {
                QR.persona.pwd = val;
                return;
            }
            if (type === 'options') {
                type = 'email';
            }
            if (type === 'subject') {
                type = 'sub';
            }
            if (/always/i.test(item)) {
                QR.persona.always[type] = val;
            }
            if (!QR.persona.types[type].includes(val)) {
                QR.persona.types[type].push(val);
            }
        },
        load: function () {
            for (var type in QR.persona.types) {
                var arr = QR.persona.types[type];
                var list = (0, _1.default)("#list-".concat(type), QR.nodes.el);
                for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                    var val = arr_1[_i];
                    if (val) {
                        _1.default.add(list, _1.default.el('option', { textContent: val }));
                    }
                }
            }
        },
        getPassword: function () {
            var m;
            if (QR.persona.pwd != null) {
                return QR.persona.pwd;
            }
            else if (m = globals_1.d.cookie.match(/4chan_pass=([^;]+)/)) {
                return decodeURIComponent(m[1]);
            }
            else {
                return '';
            }
        },
        get: function (cb) {
            _1.default.get('QR.persona', {}, function (_a) {
                var persona = _a["QR.persona"];
                return cb(persona);
            });
        },
        set: function (post) {
            _1.default.get('QR.persona', {}, function (_a) {
                var persona = _a["QR.persona"];
                persona = {
                    name: post.name,
                    flag: post.flag
                };
                _1.default.set('QR.persona', persona);
            });
        }
    },
};
// moved outside QR for type inference
var post = /** @class */ (function () {
    function post(select) {
        var _this = this;
        this.select = this.select.bind(this);
        var el = _1.default.el('a', {
            className: 'qr-preview',
            draggable: true,
            href: 'javascript:;'
        });
        _1.default.extend(el, {
            innerHTML: "<a href=\"javascript:;\" class=\"remove\" title=\"Remove\">".concat(icon_1.default.get('xmark'), "</a>") +
                '<label class="qr-preview-spoiler"><input type="checkbox"> Spoiler</label>' +
                '<span id="qr-preview-comment"></span><br /><span id="qr-preview-name"></span>'
        });
        var _a = el.childNodes, rm = _a[0], spoiler = _a[1], span = _a[2], spanFileName = _a[4];
        this.nodes = {
            el: el,
            rm: rm,
            spoiler: spoiler.firstChild,
            span: span,
            spanFileName: spanFileName,
        };
        _1.default.on(el, 'click', this.select);
        _1.default.on(this.nodes.rm, 'click', function (e) { e.stopPropagation(); _this.rm(); });
        _1.default.on(this.nodes.spoiler, 'change', function (e) {
            _this.spoiler = e.target.checked;
            if (_this === QR.selected) {
                QR.nodes.spoiler.checked = _this.spoiler;
            }
            return _this.preventAutoPost();
        });
        for (var _i = 0, _b = (0, __1.default)('label', el); _i < _b.length; _i++) {
            var label = _b[_i];
            _1.default.on(label, 'click', function (e) { return e.stopPropagation(); });
        }
        _1.default.add(QR.nodes.dumpList, el);
        for (var _c = 0, _d = ['dragStart', 'dragEnter', 'dragLeave', 'dragOver', 'dragEnd', 'drop']; _c < _d.length; _c++) {
            var event = _d[_c];
            _1.default.on(el, event.toLowerCase(), this[event]);
        }
        this.thread = globals_1.g.VIEW === 'thread' ?
            globals_1.g.THREADID
            :
                'new';
        var prev = QR.posts[QR.posts.length - 1];
        QR.posts.push(this);
        this.nodes.spoiler.checked = (this.spoiler = prev && globals_1.Conf['Remember Spoiler'] ?
            prev.spoiler
            :
                false);
        QR.persona.get(function (persona) {
            _this.name = 'name' in QR.persona.always ?
                QR.persona.always.name
                : prev ?
                    prev.name
                    :
                        persona.name;
            _this.email = 'email' in QR.persona.always ?
                QR.persona.always.email
                :
                    '';
            _this.sub = 'sub' in QR.persona.always ?
                QR.persona.always.sub
                :
                    '';
            if (QR.nodes.flag) {
                _this.flag = (function () {
                    if (prev) {
                        return prev.flag;
                    }
                    else if (persona.flag && persona.flag in globals_1.g.BOARD.config.board_flags) {
                        return persona.flag;
                    }
                })();
            }
            if (QR.selected === _this)
                _this.load();
        }); // load persona
        if (select) {
            this.select();
        }
        this.unlock();
        QR.captcha.moreNeeded();
    }
    post.prototype.rm = function () {
        var _a, _b;
        this.delete();
        var index = QR.posts.indexOf(this);
        if (QR.posts.length === 1) {
            new QR.post(true);
            _1.default.rmClass(QR.nodes.el, 'dump');
        }
        else if (this === QR.selected) {
            (QR.posts[index - 1] || QR.posts[index + 1]).select();
        }
        QR.posts.splice(index, 1);
        QR.status();
        (_b = (_a = QR.captcha).updateThread) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    post.prototype.delete = function () {
        _1.default.rm(this.nodes.el);
        URL.revokeObjectURL(this.URL);
        this.dismissErrors();
    };
    post.prototype.lock = function (lock) {
        if (lock === void 0) { lock = true; }
        this.isLocked = lock;
        if (this !== QR.selected) {
            return;
        }
        for (var _i = 0, _a = ['thread', 'name', 'email', 'sub', 'com', 'fileButton', 'filename', 'spoiler', 'flag']; _i < _a.length; _i++) {
            var name = _a[_i];
            var node;
            if ((node = QR.nodes[name])) {
                node.disabled = lock;
            }
        }
        this.nodes.rm.style.visibility = lock ? 'hidden' : '';
        this.nodes.spoiler.disabled = lock;
        this.nodes.el.draggable = !lock;
    };
    post.prototype.unlock = function () {
        this.lock(false);
    };
    post.prototype.select = function () {
        if (QR.selected) {
            QR.selected.nodes.el.removeAttribute('id');
            QR.selected.forceSave();
        }
        QR.selected = this;
        this.lock(this.isLocked);
        this.nodes.el.id = 'selected';
        // Scroll the list to center the focused post.
        var rectEl = this.nodes.el.getBoundingClientRect();
        var rectList = this.nodes.el.parentNode.getBoundingClientRect();
        this.nodes.el.parentNode.scrollLeft += (rectEl.left + (rectEl.width / 2)) - rectList.left - (rectList.width / 2);
        this.load();
    };
    post.prototype.load = function () {
        // Load this post's values.
        for (var _i = 0, _a = ['thread', 'name', 'email', 'sub', 'com', 'filename', 'flag']; _i < _a.length; _i++) {
            var name = _a[_i];
            var node;
            if (!(node = QR.nodes[name])) {
                continue;
            }
            node.value = this[name] || node.dataset.default || '';
        }
        (this.thread !== 'new' ? _1.default.addClass : _1.default.rmClass)(QR.nodes.el, 'reply-to-thread');
        this.showFileData();
        QR.characterCount();
    };
    post.prototype.save = function (input, forced) {
        var _a, _b;
        if (input.type === 'checkbox') {
            this.spoiler = input.checked;
            return;
        }
        var name = input.dataset.name;
        if (!['thread', 'name', 'email', 'sub', 'com', 'filename', 'flag'].includes(name)) {
            return;
        }
        var prev = this[name] || input.dataset.default || null;
        this[name] = input.value || input.dataset.default || null;
        switch (name) {
            case 'thread':
                (this.thread !== 'new' ? _1.default.addClass : _1.default.rmClass)(QR.nodes.el, 'reply-to-thread');
                QR.status();
                (_b = (_a = QR.captcha).updateThread) === null || _b === void 0 ? void 0 : _b.call(_a);
                break;
            case 'com':
                this.updateComment();
                break;
            case 'filename':
                if (!this.file) {
                    return;
                }
                this.saveFilename();
                this.updateFilename();
                break;
            case 'name':
            case 'flag':
                if (this[name] !== prev) { // only save manual changes, not values filled in by persona settings
                    QR.persona.set(this);
                }
                break;
        }
        if (!forced)
            this.preventAutoPost();
    };
    post.prototype.forceSave = function () {
        if (this !== QR.selected) {
            return;
        }
        // Do this in case people use extensions
        // that do not trigger the `input` event.
        for (var _i = 0, _a = ['thread', 'name', 'email', 'sub', 'com', 'filename', 'spoiler', 'flag']; _i < _a.length; _i++) {
            var name = _a[_i];
            var node;
            if (!(node = QR.nodes[name])) {
                continue;
            }
            this.save(node, true);
        }
    };
    post.prototype.preventAutoPost = function () {
        // Disable auto-posting if you're editing the first post
        // during the last 5 seconds of the cooldown.
        if (QR.cooldown.auto && (this === QR.posts[0])) {
            QR.cooldown.update(); // adding/removing file can change cooldown
            if (QR.cooldown.seconds <= 5)
                QR.cooldown.auto = false;
        }
    };
    post.prototype.setComment = function (com) {
        this.com = com || null;
        if (this === QR.selected) {
            QR.nodes.com.value = this.com;
        }
        return this.updateComment();
    };
    post.prototype.updateComment = function () {
        if (this === QR.selected) {
            QR.characterCount();
        }
        this.nodes.span.textContent = this.com;
        QR.captcha.moreNeeded();
    };
    post.prototype.isOnlyQuotes = function () {
        return (this.com || '').trim() === (this.quotedText || '').trim();
    };
    post.rmErrored = function (e) {
        e.stopPropagation();
        for (var i = QR.posts.length - 1; i >= 0; i--) {
            var errors;
            var post = QR.posts[i];
            if ((errors = post.errors)) {
                for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                    var error = errors_1[_i];
                    if (globals_1.doc.contains(error)) {
                        post.rm();
                        break;
                    }
                }
            }
        }
    };
    post.prototype.error = function (className, message, link) {
        var _this = this;
        var div = _1.default.el('div', { className: className });
        _1.default.extend(div, {
            innerHTML: message + (link ? " [<a href=\"".concat((0, globals_1.E)(link), "\" target=\"_blank\">More info</a>]") : '') +
                "<br>[<a href=\"javascript:;\">delete post</a>] [<a href=\"javascript:;\">delete all</a>]"
        });
        (this.errors || (this.errors = [])).push(div);
        var _a = (0, __1.default)('a', div), rm = _a[0], rmAll = _a[1];
        _1.default.on(div, 'click', function () {
            if (QR.posts.includes(_this))
                _this.select();
        });
        _1.default.on(rm, 'click', function (e) {
            e.stopPropagation();
            if (QR.posts.includes(_this))
                _this.rm();
        });
        _1.default.on(rmAll, 'click', QR.post.rmErrored);
        QR.error(div, true);
    };
    post.prototype.fileError = function (message, link) {
        this.error('file-error', "".concat(this.filename, ": ").concat(message), link);
    };
    post.prototype.dismissErrors = function (test) {
        if (test === void 0) { test = function () { return true; }; }
        if (this.errors) {
            for (var _i = 0, _a = this.errors; _i < _a.length; _i++) {
                var error = _a[_i];
                if (globals_1.doc.contains(error) && test(error)) {
                    error.parentNode.previousElementSibling.click();
                }
            }
        }
    };
    /**
     * Checks if the mime type and file size are valid. For images, it will convert unsupported files to png, shrinks
     * files with a resolution that is too big, and converts to jpeg if the file size is too big.
     * It will not attempt to convert files that aren't images.
     * @param file The old file.
     * @returns A promise with the old file if it was valid, or a new file if it wasn't.
     */
    post.prototype.validateFile = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var strippedFile, msg, maxSize, img, originalW, originalH, width, height, originalSize;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(file.type.startsWith('video/') && BoardConfig_1.default.noAudio(globals_1.g.BOARD.ID))) return [3 /*break*/, 2];
                        return [4 /*yield*/, VideoStripper_1.VideoStripper.stripAudio(file)];
                    case 1:
                        strippedFile = _a.sent();
                        if (strippedFile !== file) {
                            file = strippedFile;
                            new Notice_1.default('info', 'Audio track removed automatically.', 3);
                        }
                        _a.label = 2;
                    case 2:
                        if (!(location.hostname.endsWith('4chan.org') && !QR.mimeTypes.includes(file.type))) return [3 /*break*/, 5];
                        if (!file.type.startsWith('image/')) return [3 /*break*/, 4];
                        msg = "The ".concat(file.type.slice(6), " image was converted to png.");
                        return [4 /*yield*/, QR.convert(file, 'png')];
                    case 3:
                        file = _a.sent();
                        new Notice_1.default('info', msg, 3);
                        return [3 /*break*/, 5];
                    case 4: throw new Error('Unsupported file type.');
                    case 5:
                        maxSize = QR.getMaxSize(file);
                        if (!file.type.startsWith('image/')) return [3 /*break*/, 11];
                        return [4 /*yield*/, createImageBitmap(file)];
                    case 6:
                        img = _a.sent();
                        originalW = img.width, originalH = img.height;
                        width = originalW, height = originalH;
                        if (width > QR.max_width) {
                            height = Math.round(height * (QR.max_width / width));
                            width = QR.max_width;
                        }
                        if (height > QR.max_height) {
                            width = Math.round(width * (QR.max_height / height));
                            height = QR.max_height;
                        }
                        if (!(width !== originalW || height !== originalH)) return [3 /*break*/, 8];
                        return [4 /*yield*/, QR.convert(file, file.type === 'image/jpeg' ? 'jpeg' : 'png', { width: width, height: height, img: img })];
                    case 7:
                        file = _a.sent();
                        img = undefined; // just in case the file size shrinkage also needs to run using the new file
                        new Notice_1.default('warning', "Image was too large got shrunk from ".concat(originalW, " * ").concat(originalH, " to ").concat(width, " * ").concat(height, ".") +
                            'It might have lost animation.');
                        _a.label = 8;
                    case 8:
                        if (!(file.size > maxSize)) return [3 /*break*/, 10];
                        originalSize = file.size;
                        return [4 /*yield*/, QR.convert(file, 'jpeg', { maxSize: maxSize, img: img })];
                    case 9:
                        file = _a.sent();
                        new Notice_1.default('warning', "Image was too large (".concat(_1.default.bytesToString(originalSize), ") and got converted to jpg (") +
                            "".concat(_1.default.bytesToString(file.size), "). It might have lost transparency or animation."));
                        _a.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (file.size > maxSize) {
                            throw new Error("File too large (file: ".concat(_1.default.bytesToString(file.size), ", max: ").concat(_1.default.bytesToString(maxSize), ")."));
                        }
                        _a.label = 12;
                    case 12: return [2 /*return*/, file];
                }
            });
        });
    };
    post.prototype.setFile = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        // Needs to be set before the validation for some error messages.
                        this.file = file;
                        this.filename = file.name;
                        this.originalName = file.name;
                        _a = this;
                        return [4 /*yield*/, this.validateFile(file)];
                    case 1:
                        _a.file = _b.sent();
                        this.originalName = file.name;
                        if (globals_1.Conf['Randomize Filename'] && (globals_1.g.BOARD.ID !== 'f') && (!this.file.name.toLowerCase().includes('[sound='))) {
                            this.randomizeName(false);
                        }
                        else {
                            this.filename = this.file.name;
                        }
                        this.filesize = _1.default.bytesToString(this.file.size);
                        _1.default.addClass(this.nodes.el, 'has-file', 'has-' + this.file.type.split('/')[0]);
                        QR.captcha.moreNeeded();
                        URL.revokeObjectURL(this.URL);
                        this.saveFilename();
                        if (this === QR.selected) {
                            this.showFileData();
                        }
                        else {
                            this.updateFilename();
                        }
                        this.rmMetadata();
                        this.nodes.el.dataset.type = this.file.type;
                        this.nodes.el.style.backgroundImage = '';
                        if (/^(image|video)\//.test(this.file.type)) {
                            this.nodes.spanFileName.textContent = '';
                            this.readFile();
                        }
                        else {
                            this.nodes.spanFileName.textContent = this.file.name.match(/\.([^\.]+)$/)[1];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        console.error(error_1);
                        this.fileError((error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || error_1 || 'unknown error when setting a file');
                        return [3 /*break*/, 3];
                    case 3:
                        this.preventAutoPost();
                        return [2 /*return*/];
                }
            });
        });
    };
    post.prototype.randomizeName = function (set) {
        if (set === void 0) { set = true; }
        this.filename = "".concat(Date.now() * 1000 - Math.floor(Math.random() * 365 * helpers_1.DAY * 1000));
        var ext = this.file.name.match(QR.validExtension);
        if (ext)
            this.filename += ext[0];
        if (set)
            QR.nodes.filename.value = this.filename;
    };
    post.prototype.restoreName = function () {
        QR.nodes.filename.value = this.filename = this.originalName;
    };
    post.prototype.readFile = function () {
        var _this = this;
        var isVideo = /^video\//.test(this.file.type);
        var el = _1.default.el(isVideo ? 'video' : 'img');
        if (isVideo && !el.canPlayType(this.file.type)) {
            return;
        }
        var event = isVideo ? 'loadeddata' : 'load';
        var onload = function () {
            _1.default.off(el, event, onload);
            _1.default.off(el, 'error', onerror);
            _this.checkDimensions(el);
            _this.setThumbnail(el);
            _1.default.event('QRMetadata', null, _this.nodes.el);
        };
        var onerror = function () {
            _1.default.off(el, event, onload);
            _1.default.off(el, 'error', onerror);
            _this.fileError("Corrupt ".concat(isVideo ? 'video' : 'image', " or error reading metadata."), package_json_1.default.upstreamFaq + '#error-reading-metadata');
            URL.revokeObjectURL(el.src);
            // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=1021289
            _this.nodes.el.removeAttribute('data-height');
            _1.default.event('QRMetadata', null, _this.nodes.el);
        };
        this.nodes.el.dataset.height = 'loading';
        _1.default.on(el, event, onload);
        _1.default.on(el, 'error', onerror);
        el.src = URL.createObjectURL(this.file);
    };
    post.prototype.checkDimensions = function (el) {
        var height, width;
        if (el.tagName === 'IMG') {
            (height = el.height, width = el.width);
            this.nodes.el.dataset.height = height;
            this.nodes.el.dataset.width = width;
            if ((height > QR.max_height) || (width > QR.max_width)) {
                this.fileError("Image too large (image: ".concat(height, "x").concat(width, "px, max: ").concat(QR.max_height, "x").concat(QR.max_width, "px)"));
            }
            if ((height < QR.min_height) || (width < QR.min_width)) {
                this.fileError("Image too small (image: ".concat(height, "x").concat(width, "px, min: ").concat(QR.min_height, "x").concat(QR.min_width, "px)"));
            }
        }
        else {
            var videoHeight = el.videoHeight, videoWidth = el.videoWidth, duration = el.duration;
            this.nodes.el.dataset.height = videoHeight;
            this.nodes.el.dataset.width = videoWidth;
            this.nodes.el.dataset.duration = duration;
            var max_height = Math.min(QR.max_height, QR.max_height_video);
            var max_width = Math.min(QR.max_width, QR.max_width_video);
            if ((videoHeight > max_height) || (videoWidth > max_width)) {
                this.fileError("Video too large (video: ".concat(videoHeight, "x").concat(videoWidth, "px, max: ").concat(max_height, "x").concat(max_width, "px)"));
            }
            if ((videoHeight < QR.min_height) || (videoWidth < QR.min_width)) {
                this.fileError("Video too small (video: ".concat(videoHeight, "x").concat(videoWidth, "px, min: ").concat(QR.min_height, "x").concat(QR.min_width, "px)"));
            }
            if (!isFinite(duration)) {
                this.fileError('Video lacks duration metadata (try remuxing)');
            }
            else if (duration > QR.max_duration_video) {
                this.fileError("Video too long (video: ".concat(duration, "s, max: ").concat(QR.max_duration_video, "s)"));
            }
            if (BoardConfig_1.default.noAudio(globals_1.g.BOARD.ID) && _1.default.hasAudio(el)) {
                this.fileError('Audio not allowed');
            }
        }
    };
    post.prototype.setThumbnail = function (el) {
        var _this = this;
        // Create a redimensioned thumbnail.
        var height, width;
        var isVideo = el.tagName === 'VIDEO';
        // Generate thumbnails only if they're really big.
        // Resized pictures through canvases look like ass,
        // so we generate thumbnails `s` times bigger then expected
        // to avoid crappy resized quality.
        var s = 90 * 2 * window.devicePixelRatio;
        if (this.file.type === 'image/gif') {
            s *= 3;
        } // let them animate
        if (isVideo) {
            height = el.videoHeight;
            width = el.videoWidth;
        }
        else {
            (height = el.height, width = el.width);
            if ((height < s) || (width < s)) {
                this.URL = el.src;
                this.nodes.el.style.backgroundImage = "url(".concat(this.URL, ")");
                return;
            }
        }
        if (height <= width) {
            width = (s / height) * width;
            height = s;
        }
        else {
            height = (s / width) * height;
            width = s;
        }
        var cv = _1.default.el('canvas');
        cv.height = height;
        cv.width = width;
        var drawThumbNail = function () {
            cv.getContext('2d').drawImage(el, 0, 0, width, height);
            URL.revokeObjectURL(el.src);
            cv.toBlob(function (blob) {
                _this.URL = URL.createObjectURL(blob);
                _this.nodes.el.style.backgroundImage = "url(".concat(_this.URL, ")");
            });
        };
        if (isVideo) {
            el.currentTime = 0;
            el.addEventListener("seeked", drawThumbNail);
        }
        else {
            drawThumbNail();
        }
    };
    post.prototype.rmFile = function () {
        if (this.isLocked) {
            return;
        }
        delete this.file;
        delete this.filename;
        delete this.filesize;
        this.nodes.el.removeAttribute('title');
        QR.nodes.filename.removeAttribute('title');
        this.rmMetadata();
        this.nodes.el.style.backgroundImage = '';
        _1.default.rmClass(this.nodes.el, 'has-file', 'has-image', 'has-video');
        this.showFileData();
        URL.revokeObjectURL(this.URL);
        this.dismissErrors(function (error) { return _1.default.hasClass(error, 'file-error'); });
        this.preventAutoPost();
    };
    post.prototype.rmMetadata = function () {
        for (var _i = 0, _a = ['type', 'height', 'width', 'duration']; _i < _a.length; _i++) {
            var attr = _a[_i];
            // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=1021289
            this.nodes.el.removeAttribute("data-".concat(attr));
        }
    };
    post.prototype.saveFilename = function () {
        this.file.newName = (this.filename || '').replace(/[/\\]/g, '-');
        if (!QR.validExtension.test(this.filename)) {
            // 4chan will truncate the filename if it has no extension.
            this.file.newName += ".".concat(_1.default.getOwn(QR.extensionFromType, this.file.type) || 'jpg');
        }
    };
    post.prototype.updateFilename = function () {
        var long = "".concat(this.filename, " (").concat(this.filesize, ")");
        this.nodes.el.title = long;
        if (this !== QR.selected) {
            return;
        }
        QR.nodes.filename.title = long;
    };
    post.prototype.showFileData = function () {
        var _a;
        if (this.file) {
            this.updateFilename();
            QR.nodes.filename.value = this.filename;
            _1.default.addClass(QR.nodes.oekaki, 'has-file');
            _1.default.addClass(QR.nodes.fileSubmit, 'has-file', 'has-' + this.file.type.split('/')[0]);
        }
        else {
            _1.default.rmClass(QR.nodes.oekaki, 'has-file');
            _1.default.rmClass(QR.nodes.fileSubmit, 'has-file', 'has-image', 'has-video');
        }
        if (((_a = this.file) === null || _a === void 0 ? void 0 : _a.source) != null) {
            QR.nodes.fileSubmit.dataset.source = this.file.source;
        }
        else {
            QR.nodes.fileSubmit.removeAttribute('data-source');
        }
        QR.nodes.spoiler.checked = this.spoiler;
    };
    post.prototype.pasteText = function (file) {
        var _this = this;
        this.pasting = true;
        this.preventAutoPost();
        var reader = new FileReader();
        reader.onload = function (e) {
            var result = e.target.result;
            _this.setComment((_this.com ? "".concat(_this.com, "\n").concat(result) : result));
            delete _this.pasting;
        };
        reader.readAsText(file);
    };
    post.prototype.dragStart = function (e) {
        var _a = this.getBoundingClientRect(), left = _a.left, top = _a.top;
        e.dataTransfer.setDragImage(this, e.clientX - left, e.clientY - top);
        _1.default.addClass(this, 'drag');
    };
    post.prototype.dragEnd = function () { _1.default.rmClass(this, 'drag'); };
    post.prototype.dragEnter = function () { _1.default.addClass(this, 'over'); };
    post.prototype.dragLeave = function () { _1.default.rmClass(this, 'over'); };
    post.prototype.dragOver = function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    post.prototype.drop = function () {
        var _a, _b;
        _1.default.rmClass(this, 'over');
        if (!this.draggable) {
            return;
        }
        var el = (0, _1.default)('.drag', this.parentNode);
        var index = function (el) {
            for (var i = 0; i < el.parentNode.children.length; i++) {
                if (el.parentNode.children[i] === el)
                    return i;
            }
            return -1;
        };
        var oldIndex = index(el);
        var newIndex = index(this);
        if (QR.posts[oldIndex].isLocked || QR.posts[newIndex].isLocked) {
            return;
        }
        (oldIndex < newIndex ? _1.default.after : _1.default.before)(this, el);
        var post = QR.posts.splice(oldIndex, 1)[0];
        QR.posts.splice(newIndex, 0, post);
        QR.status();
        (_b = (_a = QR.captcha).updateThread) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    return post;
}());
;
QR.post = post;
exports.default = QR;
