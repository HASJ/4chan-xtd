"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Redirect_1 = require("./Redirect");
var Notice_1 = require("../classes/Notice");
var globals_1 = require("../globals/globals");
var CrossOrigin_1 = require("../platform/CrossOrigin");
var _1 = require("../platform/$");
var Header_1 = require("../General/Header");
var Parse_1 = require("./Parse");
var QuoteThreading_1 = require("../Quotelinks/QuoteThreading");
var Get_1 = require("../General/Get");
var RestoreDeletedFromArchive = {
    restore: function () {
        var url = Redirect_1.default.to('threadJSON', { boardID: globals_1.g.boardID, threadID: globals_1.g.threadID });
        if (!url) {
            new Notice_1.default('warning', 'No archive found', 3);
            return;
        }
        var encryptionOK = url.startsWith('https://');
        if (encryptionOK || globals_1.Conf['Exempt Archives from Encryption']) {
            CrossOrigin_1.default.ajax(url, { onloadend: function () {
                    if (this.status < 200 || this.status >= 400) {
                        var domain = (0, globals_1.E)(new URL(url).origin);
                        new Notice_1.default('error', _1.default.el('div', {
                            innerHTML: 'There was an error while fetching from the archive. See the console for details.<br />' +
                                'Some archive check the browser first before checking content, you might need to open the archive ' +
                                "first to get past the browser check: <a href=\"".concat(domain, "\" target=\"_blank\">").concat(domain, "</a><br />") +
                                'If that doesn\'t work, try a different archive under Settings > Advanced > Archives > Thread fetching.'
                        }));
                        console.error(this);
                        return;
                    }
                    var nrRestored = 0;
                    var archivePosts = this.response[globals_1.g.threadID.toString()].posts;
                    for (var _i = 0, _a = Object.entries(archivePosts); _i < _a.length; _i++) {
                        var _b = _a[_i], postID = _b[0], raw = _b[1];
                        if (RestoreDeletedFromArchive.insert(raw)[1]) {
                            ++nrRestored;
                        }
                    }
                    var msg;
                    if (nrRestored === 0) {
                        msg = 'No removed posts found';
                    }
                    else if (nrRestored === 1) {
                        msg = '1 post restored';
                    }
                    else {
                        msg = "".concat(nrRestored, " posts restored");
                    }
                    new Notice_1.default('info', msg, 3);
                } });
        }
    },
    init: function () {
        if (globals_1.g.VIEW !== 'thread')
            return;
        var menuEntry = _1.default.el('a', {
            href: 'javascript:;',
            textContent: 'Restore from archive',
        });
        _1.default.on(menuEntry, 'click', function () {
            RestoreDeletedFromArchive.restore();
            Header_1.default.menu.close();
        });
        Header_1.default.menu.addEntry({
            el: menuEntry,
            order: 10,
        });
    },
    /**
     * Inserts a post from the archive in the thread. Will automatically skip posts from other threads and posts already
     * in the thread.
     * @param raw The raw data returned from the archive
     * @returns A tuple with as first value the new post, and the second value a boolean whether is was inserted into the
     * page.
     */
    insert: function (raw) {
        var key = "".concat(raw.board.shortname, ".").concat(raw.num);
        if (globals_1.g.posts.keys.includes(key))
            return [undefined, false];
        var inserted = false;
        var post = (0, Parse_1.parseArchivePost)(raw, "");
        post.resurrect();
        post.markAsFromArchive();
        if (post.threadID === globals_1.g.threadID && globals_1.g.VIEW === 'thread') {
            var newPostIndex = globals_1.g.posts.insert(key, post, function (key) { return +(key.split('.')[1]) < post.ID; });
            if (globals_1.Conf['Thread Quotes']) {
                post.thread.nodes.root.insertAdjacentElement('beforeend', post.root);
            }
            else {
                globals_1.g.posts.get(globals_1.g.posts.keys[newPostIndex - 1]).root.insertAdjacentElement('afterend', post.root);
            }
            QuoteThreading_1.default.insert(post);
            inserted = true;
            for (var _i = 0, _a = Get_1.default.allQuotelinksLinkingTo(post); _i < _a.length; _i++) {
                var quotelink = _a[_i];
                quotelink.href = "#p".concat(post.ID);
            }
        }
        return [post, inserted];
    },
};
exports.default = RestoreDeletedFromArchive;
