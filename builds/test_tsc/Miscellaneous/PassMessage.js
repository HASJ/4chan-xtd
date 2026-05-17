"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var PassMessageHtml_1 = require("./PassMessage/PassMessageHtml");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var PassMessage = {
    init: function () {
        if (globals_1.Conf['passMessageClosed']) {
            return;
        }
        var msg = _1.default.el('div', { className: 'box-outer top-box' }, PassMessageHtml_1.default);
        msg.style.cssText = 'padding-bottom: 0;';
        var close = (0, _1.default)('a', msg);
        _1.default.on(close, 'click', function () {
            _1.default.rm(msg);
            return _1.default.set('passMessageClosed', true);
        });
        return _1.default.ready(function () {
            var hd;
            if (hd = _1.default.id('hd')) {
                return _1.default.after(hd, msg);
            }
            else {
                return _1.default.prepend(globals_1.d.body, msg);
            }
        });
    }
};
exports.default = PassMessage;
