"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var Menu_1 = require("./Menu");
var helpers_1 = require("../platform/helpers");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ReportLink = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Menu'] || !globals_1.Conf['Report Link']) {
            return;
        }
        var a = _1.default.el('a', {
            className: 'report-link',
            href: 'javascript:;',
            textContent: 'Report'
        });
        _1.default.on(a, 'click', ReportLink.report);
        return Menu_1.default.menu.addEntry({
            el: a,
            order: 10,
            open: function (post) {
                ReportLink.url = "//sys.".concat(location.hostname.split('.')[1], ".org/").concat(post.board, "/imgboard.php?mode=report&no=").concat(post);
                if ((0, helpers_1.isPassEnabled)()) {
                    ReportLink.dims = 'width=350,height=275';
                }
                else {
                    ReportLink.dims = 'width=400,height=550';
                }
                return true;
            }
        });
    },
    report: function () {
        var url = ReportLink.url, dims = ReportLink.dims;
        var id = Date.now();
        var set = "toolbar=0,scrollbars=1,location=0,status=1,menubar=0,resizable=1,".concat(dims);
        return window.open(url, id, set);
    }
};
exports.default = ReportLink;
