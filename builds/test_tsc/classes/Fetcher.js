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
var Board_1 = require("./Board");
var Post_1 = require("./Post");
var Thread_1 = require("./Thread");
var _1 = require("../platform/$");
var Callbacks_1 = require("./Callbacks");
var Index_1 = require("../General/Index");
var globals_1 = require("../globals/globals");
var CrossOrigin_1 = require("../platform/CrossOrigin");
var Get_1 = require("../General/Get");
var RestoreDeletedFromArchive_1 = require("../Archive/RestoreDeletedFromArchive");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Fetcher = /** @class */ (function () {
    function Fetcher(boardID, threadID, postID, root, quoter) {
        var _a;
        var post, thread;
        this.boardID = boardID;
        this.threadID = threadID;
        this.postID = postID;
        this.root = root;
        this.quoter = quoter;
        if (post = globals_1.g.posts.get("".concat(this.boardID, ".").concat(this.postID))) {
            this.insert(post);
            return;
        }
        // 4chan X catalog data
        if ((post = (_a = Index_1.default.replyData) === null || _a === void 0 ? void 0 : _a["".concat(this.boardID, ".").concat(this.postID)]) && (thread = globals_1.g.threads.get("".concat(this.boardID, ".").concat(this.threadID)))) {
            var board = globals_1.g.boards[this.boardID];
            post = new Post_1.default(globals_1.g.SITE.Build.postFromObject(post, this.boardID), thread, board, { isFetchedQuote: true });
            Callbacks_1.default.Post.execute(post);
            this.insert(post);
            return;
        }
        this.root.textContent = "Loading post No.".concat(this.postID, "...");
        if (this.threadID) {
            var that_1 = this;
            _1.default.cache(globals_1.g.SITE.urls.threadJSON({ siteID: globals_1.g.SITE.ID, boardID: this.boardID, threadID: this.threadID }), function (_a) {
                var isCached = _a.isCached;
                return that_1.fetchedPost(this, isCached);
            });
        }
        else {
            this.archivedPost();
        }
    }
    Fetcher.prototype.insert = function (post) {
        var _a;
        // Stop here if the container has been removed while loading.
        if (!this.root.parentNode) {
            return;
        }
        if (!this.quoter) {
            this.quoter = post;
        }
        var clone = post.addClone(this.quoter.context, (_1.default.hasClass(this.root, 'dialog')));
        Callbacks_1.default.Post.execute(clone);
        // Get rid of the side arrows/stubs.
        var nodes = clone.nodes;
        _1.default.rmAll(nodes.root);
        _1.default.add(nodes.root, nodes.post);
        // Indicate links to the containing post.
        var quotes = __spreadArray(__spreadArray([], clone.nodes.quotelinks, true), clone.nodes.backlinks, true);
        for (var _i = 0, quotes_1 = quotes; _i < quotes_1.length; _i++) {
            var quote = quotes_1[_i];
            var _b = Get_1.default.postDataFromLink(quote), boardID = _b.boardID, postID = _b.postID;
            if ((postID === this.quoter.ID) && (boardID === this.quoter.board.ID)) {
                _1.default.addClass(quote, 'forwardlink');
            }
        }
        // Set up flag CSS for cross-board links to boards with flags
        if (clone.nodes.flag && !(Fetcher.flagCSS || (Fetcher.flagCSS = (0, _1.default)('link[href^="//s.4cdn.org/css/flags."]')))) {
            var cssVersion = ((_a = (0, _1.default)('link[href^="//s.4cdn.org/css/"]')) === null || _a === void 0 ? void 0 : _a.href.match(/\d+(?=\.css$)|$/)[0]) || Date.now();
            Fetcher.flagCSS = _1.default.el('link', {
                rel: 'stylesheet',
                href: "//s.4cdn.org/css/flags.".concat(cssVersion, ".css")
            });
            _1.default.add(globals_1.d.head, Fetcher.flagCSS);
        }
        _1.default.rmAll(this.root);
        _1.default.add(this.root, nodes.root);
        return _1.default.event('PostsInserted', null, this.root);
    };
    Fetcher.prototype.fetchedPost = function (req, isCached) {
        // In case of multiple callbacks for the same request,
        // don't parse the same original post more than once.
        var post;
        if (post = globals_1.g.posts.get("".concat(this.boardID, ".").concat(this.postID))) {
            this.insert(post);
            return;
        }
        var status = req.status;
        if (status !== 200) {
            // The thread can die by the time we check a quote.
            if (status && this.archivedPost()) {
                return;
            }
            _1.default.addClass(this.root, 'warning');
            this.root.textContent =
                status === 404 ?
                    "Thread No.".concat(this.threadID, " 404'd.")
                    : !status ?
                        'Connection Error'
                        :
                            "Error ".concat(req.statusText, " (").concat(req.status, ").");
            return;
        }
        var posts = req.response.posts;
        globals_1.g.SITE.Build.spoilerRange[this.boardID] = posts[0].custom_spoiler;
        for (var _i = 0, posts_1 = posts; _i < posts_1.length; _i++) {
            post = posts_1[_i];
            if (post.no === this.postID) {
                break;
            }
        } // we found it!
        if (post.no !== this.postID) {
            // Cached requests can be stale and must be rechecked.
            if (isCached) {
                var api_1 = globals_1.g.SITE.urls.threadJSON({ siteID: globals_1.g.SITE.ID, boardID: this.boardID, threadID: this.threadID });
                _1.default.cleanCache(function (url) { return url === api_1; });
                var that_2 = this;
                _1.default.cache(api_1, function () {
                    return that_2.fetchedPost(this, false);
                });
                return;
            }
            // The post can be deleted by the time we check a quote.
            if (this.archivedPost()) {
                return;
            }
            _1.default.addClass(this.root, 'warning');
            this.root.textContent = "Post No.".concat(this.postID, " was not found.");
            return;
        }
        var board = globals_1.g.boards[this.boardID] ||
            new Board_1.default(this.boardID);
        var thread = globals_1.g.threads.get("".concat(this.boardID, ".").concat(this.threadID)) ||
            new Thread_1.default(this.threadID, board);
        post = new Post_1.default(globals_1.g.SITE.Build.postFromObject(post, this.boardID), thread, board, { isFetchedQuote: true });
        Callbacks_1.default.Post.execute(post);
        return this.insert(post);
    };
    Fetcher.prototype.archivedPost = function () {
        var url;
        if (!globals_1.Conf['Resurrect Quotes']) {
            return false;
        }
        if (!(url = Redirect_1.default.to('post', { boardID: this.boardID, postID: this.postID }))) {
            return false;
        }
        var archive = Redirect_1.default.data.post[this.boardID];
        var encryptionOK = /^https:\/\//.test(url) || (location.protocol === 'http:');
        if (encryptionOK || globals_1.Conf['Exempt Archives from Encryption']) {
            var that_3 = this;
            CrossOrigin_1.default.cache(url, function () {
                var _a, _b;
                if (!encryptionOK && ((_a = this.response) === null || _a === void 0 ? void 0 : _a.media)) {
                    var media = this.response.media;
                    for (var key in media) {
                        // Image/thumbnail URLs loaded over HTTP can be modified in transit.
                        // Require them to be from an HTTP host so that no referrer is sent to them from an HTTPS page.
                        if (/_link$/.test(key)) {
                            if (!((_b = _1.default.getOwn(media, key)) === null || _b === void 0 ? void 0 : _b.match(/^http:\/\//))) {
                                delete media[key];
                            }
                        }
                    }
                }
                return that_3.parseArchivedPost(this.response, url, archive);
            });
            return true;
        }
        return false;
    };
    Fetcher.prototype.parseArchivedPost = function (data, url, archive) {
        // In case of multiple callbacks for the same request,
        // don't parse the same original post more than once.
        var post;
        if (post = globals_1.g.posts.get("".concat(this.boardID, ".").concat(this.postID))) {
            this.insert(post);
            return;
        }
        if (data == null) {
            _1.default.addClass(this.root, 'warning');
            this.root.textContent = "Error fetching Post No.".concat(this.postID, " from ").concat(archive.name, ".");
            return;
        }
        if (data.error) {
            _1.default.addClass(this.root, 'warning');
            this.root.textContent = data.error;
            return;
        }
        return this.insert(RestoreDeletedFromArchive_1.default.insert(data)[0]);
    };
    Fetcher.archiveTags = {
        '\n': { innerHTML: "<br>" },
        '[b]': { innerHTML: "<b>" },
        '[/b]': { innerHTML: "</b>" },
        '[spoiler]': { innerHTML: "<s>" },
        '[/spoiler]': { innerHTML: "</s>" },
        '[code]': { innerHTML: "<pre class=\"prettyprint\">" },
        '[/code]': { innerHTML: "</pre>" },
        '[moot]': { innerHTML: "<div style=\"padding:5px;margin-left:.5em;border-color:#faa;border:2px dashed rgba(255,0,0,.1);border-radius:2px\">" },
        '[/moot]': { innerHTML: "</div>" },
        '[banned]': { innerHTML: "<strong style=\"color: red;\">" },
        '[/banned]': { innerHTML: "</strong>" },
        '[fortune]': function (text) { return { innerHTML: "<span class=\"fortune\" style=\"color:" + (0, globals_1.E)(text.match(/#\w+|$/)[0]) + "\"><b>" }; },
        '[/fortune]': { innerHTML: "</b></span>" },
        '[i]': { innerHTML: "<span class=\"mu-i\">" },
        '[/i]': { innerHTML: "</span>" },
        '[red]': { innerHTML: "<span class=\"mu-r\">" },
        '[/red]': { innerHTML: "</span>" },
        '[green]': { innerHTML: "<span class=\"mu-g\">" },
        '[/green]': { innerHTML: "</span>" },
        '[blue]': { innerHTML: "<span class=\"mu-b\">" },
        '[/blue]': { innerHTML: "</span>" }
    };
    return Fetcher;
}());
exports.default = Fetcher;
