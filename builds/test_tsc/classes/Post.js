"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
exports.PostClone = void 0;
var Get_1 = require("../General/Get");
// #region tests_enabled
var Test_1 = require("../General/Test");
// #endregion
var globals_1 = require("../globals/globals");
var ImageExpand_1 = require("../Images/ImageExpand");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var Callbacks_1 = require("./Callbacks");
;
var Post = /** @class */ (function () {
    function Post(root, thread, board, flags) {
        if (flags === void 0) { flags = {}; }
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        // #region tests_enabled
        if (root)
            this.normalizedOriginal = Test_1.default.normalize(root);
        // #endregion
        // Skip initialization for PostClone
        if (root === undefined && thread === undefined && board === undefined)
            return;
        this.root = root;
        this.thread = thread;
        this.board = board;
        _1.default.extend(this, flags);
        this.ID = +root.id.match(/\d*$/)[0];
        this.postID = this.ID;
        this.threadID = this.thread.ID;
        this.boardID = this.board.ID;
        this.siteID = globals_1.g.SITE.ID;
        this.fullID = "".concat(this.board, ".").concat(this.ID);
        this.context = this;
        this.isReply = (this.ID !== this.threadID);
        root.dataset.fullID = this.fullID;
        this.nodes = this.parseNodes(root);
        if (!this.isReply) {
            this.thread.OP = this;
            for (var _i = 0, _m = ['isSticky', 'isClosed', 'isArchived']; _i < _m.length; _i++) {
                var key = _m[_i];
                var selector;
                if (selector = globals_1.g.SITE.selectors.icons[key]) {
                    this.thread[key] = !!(0, _1.default)(selector, this.nodes.info);
                }
            }
            if (this.thread.isArchived) {
                this.thread.isClosed = true;
                this.thread.kill();
            }
        }
        var name = (_a = this.nodes.name) === null || _a === void 0 ? void 0 : _a.textContent;
        var tripcode = (_b = this.nodes.tripcode) === null || _b === void 0 ? void 0 : _b.textContent;
        this.info = {
            subject: ((_c = this.nodes.subject) === null || _c === void 0 ? void 0 : _c.textContent) || undefined,
            name: name,
            email: this.nodes.email ? decodeURIComponent(this.nodes.email.href.replace(/^mailto:/, '')) : undefined,
            tripcode: tripcode,
            uniqueID: (_d = this.nodes.uniqueID) === null || _d === void 0 ? void 0 : _d.textContent,
            capcode: (_e = this.nodes.capcode) === null || _e === void 0 ? void 0 : _e.textContent.replace('## ', ''),
            pass: (_f = this.nodes.pass) === null || _f === void 0 ? void 0 : _f.title.match(/\d*$/)[0],
            flagCode: (_h = (_g = this.nodes.flag) === null || _g === void 0 ? void 0 : _g.className.match(/flag-(\w+)/)) === null || _h === void 0 ? void 0 : _h[1].toUpperCase(),
            flagCodeTroll: (_k = (_j = this.nodes.flag) === null || _j === void 0 ? void 0 : _j.className.match(/bfl-(\w+)/)) === null || _k === void 0 ? void 0 : _k[1].toUpperCase(),
            flag: (_l = this.nodes.flag) === null || _l === void 0 ? void 0 : _l.title,
            date: this.nodes.date ? globals_1.g.SITE.parseDate(this.nodes.date) : undefined,
            nameBlock: globals_1.Conf['Anonymize'] ? 'Anonymous' : "".concat(name || '', " ").concat(tripcode || '').trim(),
        };
        if (this.info.capcode) {
            this.info.nameBlock += " ## ".concat(this.info.capcode);
        }
        if (this.info.uniqueID) {
            this.info.nameBlock += " (ID: ".concat(this.info.uniqueID, ")");
        }
        this.parseComment();
        this.parseQuotes();
        this.parseFiles();
        this.isDead = false;
        this.isHidden = false;
        this.clones = [];
        // #region tests_enabled
        if (this.forBuildTest)
            return;
        // #endregion
        if (globals_1.g.posts.get(this.fullID)) {
            this.isRebuilt = true;
            this.clones = globals_1.g.posts.get(this.fullID).clones;
            for (var _o = 0, _p = this.clones; _o < _p.length; _o++) {
                var clone = _p[_o];
                clone.origin = this;
            }
        }
        if (!this.isFetchedQuote && (this.ID > this.thread.lastPost)) {
            this.thread.lastPost = this.ID;
        }
        if (this.ID < this.thread.lastPost && globals_1.g.VIEW === 'thread') {
            this.board.posts.insert(this.ID, this);
            this.thread.posts.insert(this.ID, this);
            globals_1.g.posts.insert(this.fullID, this, function (key) { return +(key.split('.')[1]) < _this.ID; });
        }
        else {
            this.board.posts.push(this.ID, this);
            this.thread.posts.push(this.ID, this);
            globals_1.g.posts.push(this.fullID, this);
        }
    }
    Post.prototype.toString = function () { return this.ID; };
    Post.prototype.parseNodes = function (root) {
        var _a, _b;
        var s = globals_1.g.SITE.selectors;
        var post = (0, _1.default)(s.post, root) || root;
        var info = (0, _1.default)(s.infoRoot, post);
        ;
        var nodes = {
            root: root,
            bottom: this.isReply || !globals_1.g.SITE.isOPContainerThread ? root : (0, _1.default)(s.opBottom, root),
            post: post,
            info: info,
            comment: (0, _1.default)(s.comment, post),
            quotelinks: [],
            archivelinks: [],
            embedlinks: [],
            backlinks: post.getElementsByClassName('backlink'),
            uniqueIDRoot: undefined,
            uniqueID: undefined,
        };
        for (var key in s.info) {
            var selector = s.info[key];
            nodes[key] = (0, _1.default)(selector, info);
        }
        (_b = (_a = globals_1.g.SITE).parseNodes) === null || _b === void 0 ? void 0 : _b.call(_a, this, nodes);
        if (!nodes.uniqueIDRoot) {
            nodes.uniqueIDRoot = nodes.uniqueID;
        }
        return nodes;
    };
    Post.prototype.parseComment = function () {
        var _a, _b;
        // Merge text nodes and remove empty ones.
        var bq;
        this.nodes.comment.normalize();
        // Get the comment's text.
        // <br> -> \n
        // Remove:
        //   'Comment too long'...
        //   EXIF data. (/p/)
        this.nodes.commentClean = (bq = this.nodes.comment.cloneNode(true));
        (_b = (_a = globals_1.g.SITE).cleanComment) === null || _b === void 0 ? void 0 : _b.call(_a, bq);
        return this.info.comment = this.nodesToText(bq);
    };
    Post.prototype.commentDisplay = function () {
        var _a, _b;
        // Get the comment's text for display purposes (e.g. notifications, excerpts).
        // In addition to what's done in generating `@info.comment`, remove:
        //   Spoilers. (filter to '[spoiler]')
        //   Rolls. (/tg/, /qst/)
        //   Fortunes. (/s4s/)
        //   Preceding and following new lines.
        //   Trailing spaces.
        var bq = this.nodes.commentClean.cloneNode(true);
        if (!globals_1.Conf['Remove Spoilers'] && !globals_1.Conf['Reveal Spoilers']) {
            this.cleanSpoilers(bq);
        }
        (_b = (_a = globals_1.g.SITE).cleanCommentDisplay) === null || _b === void 0 ? void 0 : _b.call(_a, bq);
        return this.nodesToText(bq).trim().replace(/\s+$/gm, '');
    };
    Post.prototype.commentOrig = function () {
        var _a, _b;
        // Get the comment's text for reposting purposes.
        var bq = this.nodes.commentClean.cloneNode(true);
        (_b = (_a = globals_1.g.SITE).insertTags) === null || _b === void 0 ? void 0 : _b.call(_a, bq);
        return this.nodesToText(bq);
    };
    Post.prototype.nodesToText = function (bq) {
        var node;
        var text = "";
        var nodes = _1.default.X('.//br|.//text()', bq);
        var i = 0;
        while ((node = nodes.snapshotItem(i++))) {
            text += node.data || '\n';
        }
        return text;
    };
    Post.prototype.cleanSpoilers = function (bq) {
        var spoilers = (0, __1.default)(globals_1.g.SITE.selectors.spoiler, bq);
        for (var _i = 0, spoilers_1 = spoilers; _i < spoilers_1.length; _i++) {
            var node = spoilers_1[_i];
            _1.default.replace(node, _1.default.tn('[spoiler]'));
        }
    };
    Post.prototype.parseQuotes = function () {
        this.quotes = [];
        for (var _i = 0, _a = (0, __1.default)(globals_1.g.SITE.selectors.quotelink, this.nodes.comment); _i < _a.length; _i++) {
            var quotelink = _a[_i];
            this.parseQuote(quotelink);
        }
    };
    Post.prototype.parseQuote = function (quotelink) {
        // Only add quotes that link to posts on an imageboard.
        // Don't add:
        //  - board links. (>>>/b/)
        //  - catalog links. (>>>/b/catalog or >>>/b/search)
        //  - rules links. (>>>/a/rules)
        //  - text-board quotelinks. (>>>/img/1234)
        var match = quotelink.href.match(globals_1.g.SITE.regexp.quotelink);
        if (!match && (!this.isClone || !quotelink.dataset.postID)) {
            return;
        } // normal or resurrected quote
        this.nodes.quotelinks.push(quotelink);
        if (this.isClone) {
            return;
        }
        // ES6 Set when?
        var fullID = "".concat(match[1], ".").concat(match[3]);
        if (!this.quotes.includes(fullID))
            this.quotes.push(fullID);
    };
    Post.prototype.parseFiles = function () {
        var file;
        this.files = [];
        var fileRoots = this.fileRoots();
        var index = 0;
        for (var docIndex = 0; docIndex < fileRoots.length; docIndex++) {
            var fileRoot = fileRoots[docIndex];
            if (file = this.parseFile(fileRoot)) {
                file.index = (index++);
                file.docIndex = docIndex;
                this.files.push(file);
            }
        }
        if (this.files.length) {
            return this.file = this.files[0];
        }
    };
    Post.prototype.fileRoots = function () {
        if (globals_1.g.SITE.selectors.multifile) {
            var roots = (0, __1.default)(globals_1.g.SITE.selectors.multifile, this.nodes.root);
            if (roots.length) {
                return roots;
            }
        }
        return [this.nodes.root];
    };
    Post.prototype.parseFile = function (fileRoot) {
        var _a;
        var file = { isDead: false };
        for (var key in globals_1.g.SITE.selectors.file) {
            var selector = globals_1.g.SITE.selectors.file[key];
            file[key] = (0, _1.default)(selector, fileRoot);
        }
        file.thumbLink = (_a = file.thumb) === null || _a === void 0 ? void 0 : _a.parentNode;
        if (!(file.text && file.link)) {
            return;
        }
        if (!globals_1.g.SITE.parseFile(this, file)) {
            return;
        }
        _1.default.extend(file, {
            url: file.link.href,
            isImage: _1.default.isImage(file.link.href),
            isVideo: _1.default.isVideo(file.link.href)
        });
        var size = +file.size.match(/[\d.]+/)[0];
        var unit = ['B', 'KB', 'MB', 'GB'].indexOf(file.size.match(/\w+$/)[0]);
        while (unit-- > 0) {
            size *= 1024;
        }
        file.sizeInBytes = size;
        return file;
    };
    Post.prototype.kill = function (file, index) {
        if (file === void 0) { file = false; }
        if (index === void 0) { index = 0; }
        var strong;
        if (file) {
            if (this.isDead || this.files[index].isDead) {
                return;
            }
            this.files[index].isDead = true;
            _1.default.addClass(this.nodes.root, 'deleted-file');
        }
        else {
            if (this.isDead) {
                return;
            }
            this.isDead = true;
            _1.default.rmClass(this.nodes.root, 'deleted-file');
            _1.default.addClass(this.nodes.root, 'deleted-post');
        }
        if (!(strong = (0, _1.default)('strong.warning', this.nodes.info))) {
            strong = _1.default.el('strong', { className: 'warning' });
            _1.default.after((0, _1.default)('input', this.nodes.info), strong);
        }
        strong.textContent = file ? '[File deleted]' : '[Deleted]';
        if (this.isClone) {
            return;
        }
        for (var _i = 0, _a = this.clones; _i < _a.length; _i++) {
            var clone = _a[_i];
            clone.kill(file, index);
        }
        if (file) {
            return;
        }
        // Get quotelinks/backlinks to this post
        // and paint them (Dead).
        for (var _b = 0, _c = Get_1.default.allQuotelinksLinkingTo(this); _b < _c.length; _b++) {
            var quotelink = _c[_b];
            if (!_1.default.hasClass(quotelink, 'deadlink')) {
                _1.default.add(quotelink, Post.deadMark.cloneNode(true));
                _1.default.addClass(quotelink, 'deadlink');
            }
        }
    };
    Post.prototype.markAsFromArchive = function () {
        var strong = (0, _1.default)('strong.warning', this.nodes.info);
        if (!strong) {
            strong = _1.default.el('strong', { className: 'warning' });
            _1.default.after((0, _1.default)('input', this.nodes.info), strong);
        }
        strong.textContent = '[Deleted, restored from external archive]';
        _1.default.addClass(this.nodes.root, 'from-archive');
        if (this.isClone) {
            return;
        }
        for (var _i = 0, _a = this.clones; _i < _a.length; _i++) {
            var clone = _a[_i];
            clone.markAsFromArchive();
        }
        for (var _b = 0, _c = Get_1.default.allQuotelinksLinkingTo(this); _b < _c.length; _b++) {
            var quotelink = _c[_b];
            _1.default.addClass(quotelink, 'from-archive-link');
        }
    };
    // XXX Workaround for 4chan's racing condition
    // giving us false-positive dead posts.
    Post.prototype.resurrect = function () {
        this.isDead = false;
        _1.default.rmClass(this.nodes.root, 'deleted-post', 'from-archive');
        var strong = (0, _1.default)('strong.warning', this.nodes.info);
        // no false-positive files
        if (this.files.some(function (file) { return file.isDead; })) {
            _1.default.addClass(this.nodes.root, 'deleted-file');
            strong.textContent = '[File deleted]';
        }
        else {
            _1.default.rm(strong);
        }
        if (this.isClone) {
            return;
        }
        for (var _i = 0, _a = this.clones; _i < _a.length; _i++) {
            var clone = _a[_i];
            clone.resurrect();
        }
        for (var _b = 0, _c = Get_1.default.allQuotelinksLinkingTo(this); _b < _c.length; _b++) {
            var quotelink = _c[_b];
            if (_1.default.hasClass(quotelink, 'deadlink')) {
                _1.default.rm((0, _1.default)('.qmark-dead', quotelink));
            }
            _1.default.rmClass(quotelink, 'deadlink', 'from-archive-link');
        }
    };
    Post.prototype.collect = function () {
        globals_1.g.posts.rm(this.fullID);
        this.thread.posts.rm(this);
        this.board.posts.rm(this);
    };
    Post.prototype.addClone = function (context, contractThumb) {
        // Callbacks may not have been run yet due to anti-browser-lock delay in Main.callbackNodesDB.
        Callbacks_1.default.Post.execute(this);
        return new PostClone(this, context, contractThumb);
    };
    Post.prototype.rmClone = function (index) {
        this.clones.splice(index, 1);
        for (var _i = 0, _a = this.clones.slice(index); _i < _a.length; _i++) {
            var clone = _a[_i];
            clone.nodes.root.dataset.clone = index++;
        }
    };
    Post.prototype.setCatalogOP = function (isCatalogOP) {
        this.nodes.root.classList.toggle('catalog-container', isCatalogOP);
        this.nodes.root.classList.toggle('opContainer', !isCatalogOP);
        this.nodes.post.classList.toggle('catalog-post', isCatalogOP);
        this.nodes.post.classList.toggle('op', !isCatalogOP);
        this.nodes.post.style.left = (this.nodes.post.style.right = null);
    };
    // because of a circular dependency $ might not be initialized, so we can't use $.el
    Post.deadMark = (function () {
        var el = document.createElement('span');
        // \u00A0 is nbsp
        el.textContent = '\u00A0(Dead)';
        el.className = 'qmark-dead';
        return el;
    })();
    return Post;
}());
exports.default = Post;
;
var PostClone = /** @class */ (function (_super) {
    __extends(PostClone, _super);
    function PostClone(origin, context, contractThumb) {
        var _a;
        var _this = _super.call(this) || this;
        _this.isClone = true;
        var file, fileRoots, key;
        _this.origin = origin;
        _this.context = context;
        for (var _i = 0, _b = ['ID', 'postID', 'threadID', 'boardID', 'siteID', 'fullID', 'board', 'thread', 'info', 'quotes', 'isReply']; _i < _b.length; _i++) {
            key = _b[_i];
            // Copy or point to the origin's key value.
            _this[key] = _this.origin[key];
        }
        var nodes = _this.origin.nodes;
        var root = contractThumb ? _this.cloneWithoutVideo(nodes.root) : nodes.root.cloneNode(true);
        for (var _c = 0, _d = __spreadArray([root], (0, __1.default)('[id]', root), true); _c < _d.length; _c++) {
            var node = _d[_c];
            node.id += "_".concat(PostClone.suffix);
        }
        PostClone.suffix++;
        // Remove inlined posts inside of this post.
        for (var _e = 0, _f = (0, __1.default)('.inline', root); _e < _f.length; _e++) {
            var inline = _f[_e];
            _1.default.rm(inline);
        }
        for (var _g = 0, _h = (0, __1.default)('.inlined', root); _g < _h.length; _g++) {
            var inlined = _h[_g];
            _1.default.rmClass(inlined, 'inlined');
        }
        _this.nodes = _this.parseNodes(root);
        root.hidden = false; // post hiding
        _1.default.rmClass(root, 'forwarded'); // quote inlining
        _1.default.rmClass(_this.nodes.post, 'highlight'); // keybind navigation, ID highlighting
        // Remove catalog stuff.
        if (!_this.isReply) {
            _this.setCatalogOP(false);
            _1.default.rm((0, _1.default)('.catalog-link', _this.nodes.post));
            _1.default.rm((0, _1.default)('.catalog-stats', _this.nodes.post));
            _1.default.rm((0, _1.default)('.catalog-replies', _this.nodes.post));
        }
        _this.parseQuotes();
        _this.quotes = __spreadArray([], _this.origin.quotes, true);
        _this.files = [];
        if (_this.origin.files.length) {
            fileRoots = _this.fileRoots();
        }
        for (var _j = 0, _k = _this.origin.files; _j < _k.length; _j++) {
            var originFile = _k[_j];
            // Copy values, point to relevant elements.
            file = __assign({}, originFile);
            var fileRoot = fileRoots[file.docIndex];
            for (key in globals_1.g.SITE.selectors.file) {
                var selector = globals_1.g.SITE.selectors.file[key];
                file[key] = (0, _1.default)(selector, fileRoot);
            }
            file.thumbLink = (_a = file.thumb) === null || _a === void 0 ? void 0 : _a.parentNode;
            if (file.thumbLink) {
                file.fullImage = (0, _1.default)('.full-image', file.thumbLink);
            }
            file.videoControls = (0, _1.default)('.video-controls', file.text);
            if (file.videoThumb) {
                file.thumb.muted = true;
            }
            _this.files.push(file);
        }
        if (_this.files.length) {
            _this.file = _this.files[0];
            // Contract thumbnails in quote preview
            if (_this.file.thumb && contractThumb) {
                ImageExpand_1.default.contract(_this);
            }
        }
        if (_this.origin.isDead) {
            _this.isDead = true;
        }
        root.dataset.clone = _this.origin.clones.push(_this) - 1;
        return _this;
    }
    PostClone.prototype.cloneWithoutVideo = function (node) {
        if ((node.tagName === 'VIDEO') && !node.dataset.md5) { // (exception for WebM thumbnails)
            return [];
        }
        else if ((node.nodeType === Node.ELEMENT_NODE) && (0, _1.default)('video', node)) {
            var clone = node.cloneNode(false);
            for (var _i = 0, _a = node.childNodes; _i < _a.length; _i++) {
                var child = _a[_i];
                _1.default.add(clone, this.cloneWithoutVideo(child));
            }
            return clone;
        }
        else {
            return node.cloneNode(true);
        }
    };
    PostClone.suffix = 0;
    return PostClone;
}(Post));
exports.PostClone = PostClone;
;
