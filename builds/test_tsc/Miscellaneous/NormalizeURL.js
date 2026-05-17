"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var NormalizeURL = {
    init: function () {
        if (!globals_1.Conf['Normalize URL']) {
            return;
        }
        var pathname = location.pathname.split(/\/+/);
        if (globals_1.g.SITE.software === 'yotsuba') {
            switch (globals_1.g.VIEW) {
                case 'thread':
                    pathname[2] = 'thread';
                    pathname = pathname.slice(0, 4);
                    break;
                case 'index':
                    pathname = pathname.slice(0, 3);
                    break;
            }
        }
        pathname = pathname.join('/');
        if (location.pathname !== pathname) {
            return history.replaceState(history.state, '', "".concat(location.protocol, "//").concat(location.host).concat(pathname).concat(location.hash));
        }
    }
};
exports.default = NormalizeURL;
