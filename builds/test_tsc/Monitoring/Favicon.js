"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var ferongr_unreadDead_png_1 = require("./Favicon/ferongr.unreadDead.png");
var ferongr_unreadDeadY_png_1 = require("./Favicon/ferongr.unreadDeadY.png");
var ferongr_unreadSFW_png_1 = require("./Favicon/ferongr.unreadSFW.png");
var ferongr_unreadSFWY_png_1 = require("./Favicon/ferongr.unreadSFWY.png");
var ferongr_unreadNSFW_png_1 = require("./Favicon/ferongr.unreadNSFW.png");
var ferongr_unreadNSFWY_png_1 = require("./Favicon/ferongr.unreadNSFWY.png");
var xat__unreadDead_png_1 = require("./Favicon/xat-.unreadDead.png");
var xat__unreadDeadY_png_1 = require("./Favicon/xat-.unreadDeadY.png");
var xat__unreadSFW_png_1 = require("./Favicon/xat-.unreadSFW.png");
var xat__unreadSFWY_png_1 = require("./Favicon/xat-.unreadSFWY.png");
var xat__unreadNSFW_png_1 = require("./Favicon/xat-.unreadNSFW.png");
var xat__unreadNSFWY_png_1 = require("./Favicon/xat-.unreadNSFWY.png");
var Mayhem_unreadDead_png_1 = require("./Favicon/Mayhem.unreadDead.png");
var Mayhem_unreadDeadY_png_1 = require("./Favicon/Mayhem.unreadDeadY.png");
var Mayhem_unreadSFW_png_1 = require("./Favicon/Mayhem.unreadSFW.png");
var Mayhem_unreadSFWY_png_1 = require("./Favicon/Mayhem.unreadSFWY.png");
var Mayhem_unreadNSFW_png_1 = require("./Favicon/Mayhem.unreadNSFW.png");
var Mayhem_unreadNSFWY_png_1 = require("./Favicon/Mayhem.unreadNSFWY.png");
var _4chanJS_unreadDead_png_1 = require("./Favicon/4chanJS.unreadDead.png");
var _4chanJS_unreadDeadY_png_1 = require("./Favicon/4chanJS.unreadDeadY.png");
var _4chanJS_unreadSFW_png_1 = require("./Favicon/4chanJS.unreadSFW.png");
var _4chanJS_unreadSFWY_png_1 = require("./Favicon/4chanJS.unreadSFWY.png");
var _4chanJS_unreadNSFW_png_1 = require("./Favicon/4chanJS.unreadNSFW.png");
var _4chanJS_unreadNSFWY_png_1 = require("./Favicon/4chanJS.unreadNSFWY.png");
var Original_unreadDead_png_1 = require("./Favicon/Original.unreadDead.png");
var Original_unreadDeadY_png_1 = require("./Favicon/Original.unreadDeadY.png");
var Original_unreadSFW_png_1 = require("./Favicon/Original.unreadSFW.png");
var Original_unreadSFWY_png_1 = require("./Favicon/Original.unreadSFWY.png");
var Original_unreadNSFW_png_1 = require("./Favicon/Original.unreadNSFW.png");
var Original_unreadNSFWY_png_1 = require("./Favicon/Original.unreadNSFWY.png");
var Metro_unreadDead_png_1 = require("./Favicon/Metro.unreadDead.png");
var Metro_unreadDeadY_png_1 = require("./Favicon/Metro.unreadDeadY.png");
var Metro_unreadSFW_png_1 = require("./Favicon/Metro.unreadSFW.png");
var Metro_unreadSFWY_png_1 = require("./Favicon/Metro.unreadSFWY.png");
var Metro_unreadNSFW_png_1 = require("./Favicon/Metro.unreadNSFW.png");
var Metro_unreadNSFWY_png_1 = require("./Favicon/Metro.unreadNSFWY.png");
var dead_gif_1 = require("./Favicon/dead.gif");
var empty_gif_1 = require("./Favicon/empty.gif");
var _1 = require("../platform/$");
var globals_1 = require("../globals/globals");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Favicon = {
    init: function () {
        return _1.default.asap((function () { return globals_1.d.head && (Favicon.el = (0, _1.default)('link[rel="shortcut icon"]', globals_1.d.head)); }), Favicon.initAsap);
    },
    set: function (status) {
        Favicon.status = status;
        if (Favicon.el) {
            Favicon.el.href = Favicon[status];
            // `favicon.href = href` doesn't work on Firefox.
            return _1.default.add(globals_1.d.head, Favicon.el);
        }
    },
    initAsap: function () {
        Favicon.el.type = 'image/x-icon';
        var href = Favicon.el.href;
        Favicon.isSFW = /ws\.ico$/.test(href);
        Favicon.default = href;
        Favicon.switch();
        if (Favicon.status) {
            return Favicon.set(Favicon.status);
        }
    },
    switch: function () {
        var items = {
            ferongr: [
                ferongr_unreadDead_png_1.default,
                ferongr_unreadDeadY_png_1.default,
                ferongr_unreadSFW_png_1.default,
                ferongr_unreadSFWY_png_1.default,
                ferongr_unreadNSFW_png_1.default,
                ferongr_unreadNSFWY_png_1.default,
            ],
            'xat-': [
                xat__unreadDead_png_1.default,
                xat__unreadDeadY_png_1.default,
                xat__unreadSFW_png_1.default,
                xat__unreadSFWY_png_1.default,
                xat__unreadNSFW_png_1.default,
                xat__unreadNSFWY_png_1.default,
            ],
            Mayhem: [
                Mayhem_unreadDead_png_1.default,
                Mayhem_unreadDeadY_png_1.default,
                Mayhem_unreadSFW_png_1.default,
                Mayhem_unreadSFWY_png_1.default,
                Mayhem_unreadNSFW_png_1.default,
                Mayhem_unreadNSFWY_png_1.default,
            ],
            '4chanJS': [
                _4chanJS_unreadDead_png_1.default,
                _4chanJS_unreadDeadY_png_1.default,
                _4chanJS_unreadSFW_png_1.default,
                _4chanJS_unreadSFWY_png_1.default,
                _4chanJS_unreadNSFW_png_1.default,
                _4chanJS_unreadNSFWY_png_1.default,
            ],
            Original: [
                Original_unreadDead_png_1.default,
                Original_unreadDeadY_png_1.default,
                Original_unreadSFW_png_1.default,
                Original_unreadSFWY_png_1.default,
                Original_unreadNSFW_png_1.default,
                Original_unreadNSFWY_png_1.default,
            ],
            'Metro': [
                Metro_unreadDead_png_1.default,
                Metro_unreadDeadY_png_1.default,
                Metro_unreadSFW_png_1.default,
                Metro_unreadSFWY_png_1.default,
                Metro_unreadNSFW_png_1.default,
                Metro_unreadNSFWY_png_1.default,
            ]
        };
        items = _1.default.getOwn(items, globals_1.Conf['favicon']);
        var f = Favicon;
        var t = 'data:image/png;base64,';
        var i = 0;
        while (items[i]) {
            items[i] = t + items[i++];
        }
        f.unreadDead = items[0], f.unreadDeadY = items[1], f.unreadSFW = items[2], f.unreadSFWY = items[3], f.unreadNSFW = items[4], f.unreadNSFWY = items[5];
        return f.update();
    },
    update: function () {
        if (this.isSFW) {
            this.unread = this.unreadSFW;
            return this.unreadY = this.unreadSFWY;
        }
        else {
            this.unread = this.unreadNSFW;
            return this.unreadY = this.unreadNSFWY;
        }
    },
    SFW: '//s.4cdn.org/image/favicon-ws.ico',
    NSFW: '//s.4cdn.org/image/favicon.ico',
    dead: "data:image/gif;base64,".concat(dead_gif_1.default),
    logo: "data:image/png;base64,".concat(empty_gif_1.default),
};
exports.default = Favicon;
