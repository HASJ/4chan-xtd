"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var CaptchaReplace = {
    init: function () {
        var _this = this;
        if ((globals_1.g.SITE.software !== 'yotsuba') || (0, helpers_1.isPassEnabled)()) {
            return;
        }
        if (globals_1.Conf['Force Noscript Captcha'] && _1.default.hasClass(globals_1.doc, 'js-enabled')) {
            _1.default.ready(this.noscript);
            return;
        }
        if (globals_1.Conf['captchaLanguage'].trim()) {
            if (['boards.4chan.org', 'boards.4channel.org'].includes(location.hostname)) {
                _1.default.onExists(globals_1.doc, '#captchaFormPart', function (node) { return _1.default.onExists(node, 'iframe[src^="https://www.google.com/recaptcha/"]', _this.iframe); });
            }
            else {
                _1.default.onExists(globals_1.doc, 'iframe[src^="https://www.google.com/recaptcha/"]', this.iframe);
            }
        }
    },
    noscript: function () {
        var noscript, original, toggle;
        if (!((original = (0, _1.default)('#g-recaptcha')) && (noscript = (0, _1.default)('noscript', original.parentNode)))) {
            return;
        }
        var span = _1.default.el('span', { id: 'captcha-forced-noscript' });
        _1.default.replace(noscript, span);
        _1.default.rm(original);
        var insert = function () {
            span.innerHTML = noscript.textContent;
            this.iframe((0, _1.default)('iframe[src^="https://www.google.com/recaptcha/"]', span));
        };
        if (toggle = (0, _1.default)('#togglePostFormLink a, #form-link')) {
            _1.default.on(toggle, 'click', insert);
        }
        else {
            insert();
        }
    },
    iframe: function (iframe) {
        var lang;
        if (lang = globals_1.Conf['captchaLanguage'].trim()) {
            var src = /[?&]hl=/.test(iframe.src) ?
                iframe.src.replace(/([?&]hl=)[^&]*/, '$1' + encodeURIComponent(lang))
                :
                    iframe.src + "&hl=".concat(encodeURIComponent(lang));
            if (iframe.src !== src) {
                iframe.src = src;
            }
        }
    }
};
exports.default = CaptchaReplace;
