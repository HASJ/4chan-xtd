"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var ImageCommon_1 = require("../Images/ImageCommon");
var _1 = require("../platform/$");
var Menu_1 = require("./Menu");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var DownloadLink = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Menu'] || !globals_1.Conf['Download Link']) {
            return;
        }
        var a = _1.default.el('a', {
            className: 'download-link',
            textContent: 'Download file'
        });
        // Specifying the filename with the download attribute only works for same-origin links.
        _1.default.on(a, 'click', ImageCommon_1.default.download);
        return Menu_1.default.menu.addEntry({
            el: a,
            order: 100,
            open: function (_a) {
                var file = _a.file;
                if (!file) {
                    return false;
                }
                a.href = file.url;
                a.download = file.name;
                return true;
            }
        });
    }
};
exports.default = DownloadLink;
