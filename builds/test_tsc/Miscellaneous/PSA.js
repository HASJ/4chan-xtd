"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Notice_1 = require("../classes/Notice");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var PSA = {
    init: function () {
        var el;
        if ((globals_1.g.SITE.software === 'yotsuba') && (globals_1.g.BOARD.ID === 'qa')) {
            var announcement = { innerHTML: "Stay in touch with your <a href=\"https://www.4chan-x.net/qa_friends.html\" target=\"_blank\" rel=\"noopener\">/qa/ friends</a>!" };
            el = _1.default.el('div', { className: 'fcx-announcement' }, announcement);
            _1.default.onExists(globals_1.doc, '.boardBanner', function (banner) { return _1.default.after(banner, el); });
        }
        if ('samachan.org' in globals_1.Conf['siteProperties'] && !globals_1.Conf['PSAseen'].includes('samachan')) {
            el = _1.default.el('span', { innerHTML: "<a href=\"https://sushigirl.us/yakuza/res/776.html\" target=\"_blank\" rel=\"noopener\">Looking for a new home?<br>Some former Samachan users are regrouping on SushiChan.</a><br>(a message from 4chan X)" });
            return _1.default.on(globals_1.d, '4chanXInitFinished', function () {
                new Notice_1.default('info', el);
                globals_1.Conf['PSAseen'].push('samachan');
                return _1.default.set('PSAseen', globals_1.Conf['PSAseen']);
            });
        }
    }
};
exports.default = PSA;
