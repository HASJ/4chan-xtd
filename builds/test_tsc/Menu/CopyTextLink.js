"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var Menu_1 = require("./Menu");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var CopyTextLink = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Menu'] || !globals_1.Conf['Copy Text Link']) {
            return;
        }
        var a = _1.default.el('a', {
            className: 'copy-text-link',
            href: 'javascript:;',
            textContent: 'Copy Text'
        });
        _1.default.on(a, 'click', CopyTextLink.copy);
        return Menu_1.default.menu.addEntry({
            el: a,
            order: 12,
            open: function (post) {
                CopyTextLink.text = (post.origin || post).commentOrig();
                return true;
            }
        });
    },
    copy: function () {
        var el = _1.default.el('textarea', {
            className: 'copy-text-element',
            value: CopyTextLink.text
        });
        _1.default.add(globals_1.d.body, el);
        el.select();
        try {
            globals_1.d.execCommand('copy');
        }
        catch (error) { }
        return _1.default.rm(el);
    }
};
exports.default = CopyTextLink;
