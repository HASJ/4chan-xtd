"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var _1 = require("../platform/$");
var Redirect_1 = require("../Archive/Redirect");
var Filter_1 = require("../Filtering/Filter");
var globals_1 = require("../globals/globals");
var Menu_1 = require("./Menu");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ArchiveLink = {
    init: function () {
        if ((globals_1.g.SITE.software !== 'yotsuba') || !['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Menu'] || !globals_1.Conf['Archive Link']) {
            return;
        }
        var div = _1.default.el('div', { textContent: 'Archive' });
        var entry = {
            el: div,
            order: 60,
            open: function (_a) {
                var ID = _a.ID, thread = _a.thread, board = _a.board;
                return !!Redirect_1.default.to('thread', { postID: ID, threadID: thread.ID, boardID: board.ID });
            },
            subEntries: []
        };
        for (var _i = 0, _a = [
            ['Post', 'post'],
            ['Name', 'name'],
            ['Tripcode', 'tripcode'],
            ['Capcode', 'capcode'],
            ['Subject', 'subject'],
            ['Flag', 'country'],
            ['Filename', 'filename'],
            ['Image MD5', 'MD5']
        ]; _i < _a.length; _i++) {
            var type = _a[_i];
            // Add a sub entry for each type.
            entry.subEntries.push(this.createSubEntry(type[0], type[1]));
        }
        return Menu_1.default.menu.addEntry(entry);
    },
    createSubEntry: function (text, type) {
        var el = _1.default.el('a', {
            textContent: text,
            target: '_blank'
        });
        var open = type === 'post' ?
            function (_a) {
                var ID = _a.ID, thread = _a.thread, board = _a.board;
                el.href = Redirect_1.default.to('thread', { postID: ID, threadID: thread.ID, boardID: board.ID });
                return true;
            }
            :
                function (post) {
                    var _a;
                    var typeParam = (type === 'country') && post.info.flagCodeTroll ?
                        'troll_country'
                        :
                            type;
                    var value = type === 'country' ?
                        post.info.flagCode || ((_a = post.info.flagCodeTroll) === null || _a === void 0 ? void 0 : _a.toLowerCase())
                        :
                            Filter_1.default.values(type, post)[0];
                    // We want to parse the exact same stuff as the filter does already.
                    if (!value) {
                        return false;
                    }
                    el.href = Redirect_1.default.to('search', {
                        boardID: post.board.ID,
                        type: typeParam,
                        value: value,
                        isSearch: true
                    });
                    return true;
                };
        return {
            el: el,
            open: open
        };
    }
};
exports.default = ArchiveLink;
