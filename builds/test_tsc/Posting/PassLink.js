"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var PassLink = {
    init: function () {
        if ((globals_1.g.SITE.software !== 'yotsuba') || !globals_1.Conf['Pass Link']) {
            return;
        }
        return _1.default.on(globals_1.d, '4chanXInitFinished', this.ready);
    },
    ready: function () {
        var styleSelector;
        if (!(styleSelector = _1.default.id('styleSelector'))) {
            return;
        }
        var passLink = _1.default.el('span', { className: 'brackets-wrap pass-link-container' });
        _1.default.extend(passLink, { innerHTML: "<a href=\"javascript:;\">4chan Pass</a>" });
        _1.default.on(passLink.firstElementChild, 'click', function () { return window.open("//sys.".concat(location.hostname.split('.')[1], ".org/auth"), Date.now(), 'width=500,height=280,toolbar=0'); });
        return _1.default.before(styleSelector.previousSibling, [passLink, _1.default.tn('\u00A0\u00A0')]);
    }
};
exports.default = PassLink;
