"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Notice_1 = require("../classes/Notice");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var QR_1 = require("../Posting/QR");
var Menu_1 = require("./Menu");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var DeleteLink = {
    auto: [(0, helpers_1.dict)(), (0, helpers_1.dict)()],
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Menu'] || !globals_1.Conf['Delete Link']) {
            return;
        }
        var div = _1.default.el('div', {
            className: 'delete-link',
            textContent: 'Delete'
        });
        var postEl = _1.default.el('a', {
            className: 'delete-post',
            href: 'javascript:;'
        });
        var fileEl = _1.default.el('a', {
            className: 'delete-file',
            href: 'javascript:;'
        });
        this.nodes = {
            menu: div.firstChild,
            links: [postEl, fileEl]
        };
        var postEntry = {
            el: postEl,
            open: function () {
                postEl.textContent = DeleteLink.linkText(false);
                _1.default.on(postEl, 'click', DeleteLink.toggle);
                return true;
            }
        };
        var fileEntry = {
            el: fileEl,
            open: function (_a) {
                var file = _a.file;
                if (!file || file.isDead) {
                    return false;
                }
                fileEl.textContent = DeleteLink.linkText(true);
                _1.default.on(fileEl, 'click', DeleteLink.toggle);
                return true;
            }
        };
        return Menu_1.default.menu.addEntry({
            el: div,
            order: 40,
            open: function (post) {
                if (post.isDead) {
                    return false;
                }
                DeleteLink.post = post;
                DeleteLink.nodes.menu.textContent = DeleteLink.menuText();
                DeleteLink.cooldown.start(post);
                return true;
            },
            subEntries: [postEntry, fileEntry]
        });
    },
    menuText: function () {
        var seconds;
        if ((seconds = DeleteLink.cooldown.seconds[DeleteLink.post.fullID])) {
            return "Delete (".concat(seconds, ")");
        }
        else {
            return 'Delete';
        }
    },
    linkText: function (fileOnly) {
        var text = fileOnly ? 'File' : 'Post';
        if (DeleteLink.auto[+fileOnly][DeleteLink.post.fullID]) {
            text = "Deleting ".concat(text.toLowerCase(), "...");
        }
        return text;
    },
    toggle: function () {
        var post = DeleteLink.post;
        var fileOnly = _1.default.hasClass(this, 'delete-file');
        var auto = DeleteLink.auto[+fileOnly];
        if (auto[post.fullID]) {
            delete auto[post.fullID];
        }
        else {
            auto[post.fullID] = true;
        }
        this.textContent = DeleteLink.linkText(fileOnly);
        if (!DeleteLink.cooldown.seconds[post.fullID]) {
            return DeleteLink.delete(post, fileOnly);
        }
    },
    delete: function (post, fileOnly) {
        var link = DeleteLink.nodes.links[+fileOnly];
        delete DeleteLink.auto[+fileOnly][post.fullID];
        if (post.fullID === DeleteLink.post.fullID) {
            _1.default.off(link, 'click', DeleteLink.toggle);
        }
        var form = {
            mode: 'usrdel',
            onlyimgdel: fileOnly,
            pwd: QR_1.default.persona.getPassword()
        };
        form[+post.ID] = 'delete';
        return _1.default.ajax(_1.default.id('delform').action.replace("/".concat(globals_1.g.BOARD, "/"), "/".concat(post.board, "/")), {
            responseType: 'document',
            withCredentials: true,
            onloadend: function () { return DeleteLink.load(link, post, fileOnly, this.response); },
            form: _1.default.formData(form)
        });
    },
    load: function (link, post, fileOnly, resDoc) {
        var msg;
        if (!resDoc) {
            new Notice_1.default('warning', 'Connection error, please retry.', 20);
            if (post.fullID === DeleteLink.post.fullID) {
                _1.default.on(link, 'click', DeleteLink.toggle);
            }
            return;
        }
        link.textContent = DeleteLink.linkText(fileOnly);
        if (resDoc.title === '4chan - Banned') { // Ban/warn check
            var el = _1.default.el('span', { innerHTML: "You can&#039;t delete posts because you are <a href=\"//www.4chan.org/banned\" target=\"_blank\">banned</a>." });
            return new Notice_1.default('warning', el, 20);
        }
        else if (msg = resDoc.getElementById('errmsg')) { // error!
            new Notice_1.default('warning', msg.textContent, 20);
            if (post.fullID === DeleteLink.post.fullID) {
                _1.default.on(link, 'click', DeleteLink.toggle);
            }
            if (QR_1.default.cooldown.data && globals_1.Conf['Cooldown'] && /\bwait\b/i.test(msg.textContent)) {
                DeleteLink.cooldown.start(post, 5);
                DeleteLink.auto[+fileOnly][post.fullID] = true;
                return DeleteLink.nodes.links[+fileOnly].textContent = DeleteLink.linkText(fileOnly);
            }
        }
        else {
            if (!fileOnly) {
                QR_1.default.cooldown.delete(post);
            }
            if (resDoc.title === 'Updating index...') {
                // We're 100% sure.
                (post.origin || post).kill(fileOnly);
            }
            if (post.fullID === DeleteLink.post.fullID) {
                return link.textContent = 'Deleted';
            }
        }
    },
    cooldown: {
        seconds: (0, helpers_1.dict)(),
        start: function (post, seconds) {
            // Already counting.
            if (DeleteLink.cooldown.seconds[post.fullID] != null) {
                return;
            }
            if (seconds == null) {
                seconds = QR_1.default.cooldown.secondsDeletion(post);
            }
            if (seconds > 0) {
                DeleteLink.cooldown.seconds[post.fullID] = seconds;
                return DeleteLink.cooldown.count(post);
            }
        },
        count: function (post) {
            if (post.fullID === DeleteLink.post.fullID) {
                DeleteLink.nodes.menu.textContent = DeleteLink.menuText();
            }
            if ((DeleteLink.cooldown.seconds[post.fullID] > 0) && globals_1.Conf['Cooldown']) {
                DeleteLink.cooldown.seconds[post.fullID]--;
                setTimeout(DeleteLink.cooldown.count, 1000, post);
            }
            else {
                delete DeleteLink.cooldown.seconds[post.fullID];
                for (var _i = 0, _a = [false, true]; _i < _a.length; _i++) {
                    var fileOnly = _a[_i];
                    if (DeleteLink.auto[+fileOnly][post.fullID]) {
                        DeleteLink.delete(post, fileOnly);
                    }
                }
            }
        }
    }
};
exports.default = DeleteLink;
