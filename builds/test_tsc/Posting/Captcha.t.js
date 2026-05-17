"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var QR_1 = require("./QR");
var helpers_1 = require("../platform/helpers");
var CaptchaT = {
    init: function () {
        if ((0, helpers_1.isPassEnabled)()) {
            return;
        }
        if (!(this.isEnabled = !!(0, _1.default)('#t-root') || !_1.default.id('postForm'))) {
            return;
        }
        var root = _1.default.el('div', { className: 'captcha-root' });
        this.nodes = { root: root };
        _1.default.addClass(QR_1.default.nodes.el, 'has-captcha', 'captcha-t');
        _1.default.after(QR_1.default.nodes.com.parentNode, root);
    },
    moreNeeded: function () {
    },
    getThread: function () {
        return {
            boardID: globals_1.g.BOARD.ID,
            threadID: QR_1.default.posts[0].thread === 'new' ? '0' : ('' + QR_1.default.posts[0].thread),
        };
    },
    setup: function (focus) {
        if (!this.isEnabled) {
            return;
        }
        if (!this.nodes.container) {
            this.nodes.container = _1.default.el('div', { className: 'captcha-container' });
            _1.default.prepend(this.nodes.root, this.nodes.container);
            CaptchaT.currentThread = CaptchaT.getThread();
            CaptchaT.currentThread.autoLoad = globals_1.Conf['Auto-load captcha'] ? '1' : '0';
            _1.default.global('setupTCaptcha', CaptchaT.currentThread);
        }
        if (focus)
            (0, _1.default)('#t-resp').focus();
    },
    destroy: function () {
        if (!this.isEnabled || !this.nodes.container) {
            return;
        }
        _1.default.global('destroyTCaptcha');
        _1.default.rm(this.nodes.container);
        delete this.nodes.container;
    },
    updateThread: function () {
        if (!this.isEnabled) {
            return;
        }
        var _a = (CaptchaT.currentThread || {}), boardID = _a.boardID, threadID = _a.threadID;
        var newThread = CaptchaT.getThread();
        if ((newThread.boardID !== boardID) || (newThread.threadID !== threadID)) {
            CaptchaT.destroy();
            CaptchaT.setup();
        }
    },
    getOne: function () {
        var el;
        var response = {};
        if (this.nodes.container) {
            for (var _i = 0, _a = ['t-response', 't-challenge']; _i < _a.length; _i++) {
                var key = _a[_i];
                response[key] = (0, _1.default)("[name='".concat(key, "']"), this.nodes.container).value;
            }
        }
        if (!response['t-response'] && !((el = (0, _1.default)('#t-msg, #t-task')) && /Verification not required/i.test(el.textContent))) {
            response = null;
        }
        return response;
    },
    setUsed: function () {
        if (this.isEnabled && this.nodes.container) {
            _1.default.global('TCaptchaClearChallenge');
        }
    },
    occupied: function () {
        return !!this.nodes.container;
    }
};
exports.default = CaptchaT;
