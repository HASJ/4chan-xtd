"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
/**
 * Because of increased security in manifest v3, scripts can no longer just inject a script tag into the main page.
 * Functions to be called in the main context must be predefined. Those functions should be in this file, and they will
 * be loaded in the worker context in the extension version.
 *
 * These are the functions for `$.global`. They will be called by name.
 *
 * They are stringified, so don't use the short `fnName() {` notation.
 */
var PageContextFunctions = {
    stubCloneTopNav: function () { window.cloneTopNav = function () { }; },
    disableNativeExtension: function () {
        try {
            var settings = JSON.parse(localStorage.getItem('4chan-settings')) || {};
            if (settings.disableAll)
                return;
            settings.disableAll = true;
            localStorage.setItem('4chan-settings', JSON.stringify(settings));
        }
        catch (error) {
            Object.defineProperty(window, 'Config', { value: { disableAll: true } });
        }
    },
    disableNativeExtensionNoStorage: function () { Object.defineProperty(window, 'Config', { value: { disableAll: true } }); },
    prettyPrint: function (_a) {
        var _b;
        var id = _a.id;
        // @ts-ignore
        (_b = window.prettyPrint) === null || _b === void 0 ? void 0 : _b.call(window, (function () { }), document.getElementById(id).parentNode);
    },
    exposeVersion: function (_a) {
        var buildDate = _a.buildDate, version = _a.version;
        var date = +buildDate;
        Object.defineProperty(window, 'fourchanXT', {
            value: Object.freeze({
                version: version,
                // Getter to prevent mutations.
                get buildDate() { return new Date(date); },
            }),
            writable: false,
        });
    },
    initMain: function () {
        document.documentElement.classList.add('js-enabled');
        window.FCX = {};
    },
    initFlash: function () {
        if (JSON.parse(localStorage['4chan-settings'] || '{}').disableAll)
            window.SWFEmbed.init();
    },
    initFlashNoStorage: function () { window.SWFEmbed.init(); },
    setThreadId: function () { window.Main.tid = location.pathname.split(/\/+/)[3]; },
    fourChanPrettyPrintListener: function () {
        window.addEventListener('prettyprint', function (e) { return window.dispatchEvent(new CustomEvent('prettyprint:cb', {
            detail: { ID: e.detail.ID, i: e.detail.i, html: window.prettyPrintOne(e.detail.html) }
        })); }, false);
    },
    fourChanMathjaxListener: function () {
        window.addEventListener('mathjax', function (e) {
            if (window.MathJax) {
                window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, e.target]);
            }
            else {
                if (!document.querySelector('script[src^="//cdn.mathjax.org/"]')) { // don't load MathJax if already loading
                    window.loadMathJax();
                    window.loadMathJax = function () { };
                }
                // 4chan only handles post comments on MathJax load; anything else (e.g. the QR preview) must be queued explicitly.
                if (!e.target.classList.contains('postMessage')) {
                    document.querySelector('script[src^="//cdn.mathjax.org/"]').addEventListener('load', function () { return window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, e.target]); }, false);
                }
            }
        }, false);
    },
    disable4chanIdHl: function () {
        window.clickable_ids = false;
        for (var _i = 0, _a = document.querySelectorAll('.posteruid, .capcode'); _i < _a.length; _i++) {
            var node = _a[_i];
            node.removeEventListener('click', window.idClick, false);
        }
    },
    initTinyBoard: function (_a) {
        var _b, _c;
        var boardID = _a.boardID, threadID = _a.threadID;
        threadID = +threadID;
        var form = document.querySelector('form[name="post"]');
        window.$(document).ajaxComplete(function (event, request, settings) {
            var _a;
            var postID;
            if (settings.url !== form.action)
                return;
            if (!(postID = +((_a = request.responseJSON) === null || _a === void 0 ? void 0 : _a.id)))
                return;
            var detail = { boardID: boardID, threadID: threadID, postID: postID };
            try {
                var _b = request.responseJSON, redirect = _b.redirect, noko = _b.noko;
                if (redirect && (originalNoko != null) && !originalNoko && !noko) {
                    detail.redirect = redirect;
                }
            }
            catch (error) { }
            event = new CustomEvent('QRPostSuccessful', { bubbles: true, detail: detail });
            document.dispatchEvent(event);
        });
        var originalNoko = (_c = (_b = window.tb_settings) === null || _b === void 0 ? void 0 : _b.ajax) === null || _c === void 0 ? void 0 : _c.always_noko_replies;
        var base;
        (((base = window.tb_settings || (window.tb_settings = {}))).ajax || (base.ajax = {})).always_noko_replies = true;
    },
    setupCaptcha: function (_a) {
        var recaptchaKey = _a.recaptchaKey;
        var render = function () {
            var classList = document.documentElement.classList;
            var container = document.querySelector('#qr .captcha-container');
            container.dataset.widgetID = window.grecaptcha.render(container, {
                sitekey: recaptchaKey,
                theme: classList.contains('tomorrow') || classList.contains('spooky') || classList.contains('dark-captcha') ? 'dark' : 'light',
                callback: function (response) {
                    window.dispatchEvent(new CustomEvent('captcha:success', { detail: response }));
                }
            });
        };
        if (window.grecaptcha) {
            render();
        }
        else {
            var cbNative_1 = window.onRecaptchaLoaded;
            window.onRecaptchaLoaded = function () {
                render();
                cbNative_1();
            };
            if (!document.head.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]')) {
                var script = document.createElement('script');
                script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit';
                document.head.appendChild(script);
            }
        }
    },
    resetCaptcha: function () {
        window.grecaptcha.reset(document.querySelector('#qr .captcha-container').dataset.widgetID);
    },
    setupTCaptcha: function (_a) {
        var boardID = _a.boardID, threadID = _a.threadID, autoLoad = _a.autoLoad;
        var TCaptcha = window.TCaptcha;
        TCaptcha.init(document.querySelector('#qr .captcha-container'), boardID, +threadID);
        TCaptcha.setErrorCb(function (err) { return window.dispatchEvent(new CustomEvent('CreateNotification', {
            detail: { type: 'warning', content: '' + err }
        })); });
        if (autoLoad === '1')
            TCaptcha.load(boardID, threadID);
    },
    destroyTCaptcha: function () { window.TCaptcha.destroy(); },
    TCaptchaClearChallenge: function () { window.TCaptcha.clearChallenge(); },
    setupQR: function () {
        window.FCX.oekakiCB = function () { return window.Tegaki.flatten().toBlob(function (file) {
            var source = "oekaki-".concat(Date.now());
            window.FCX.oekakiLatest = source;
            document.dispatchEvent(new CustomEvent('QRSetFile', {
                bubbles: true,
                detail: { file: file, name: window.FCX.oekakiName, source: source }
            }));
        }); };
        if (window.Tegaki) {
            document.querySelector('#qr .oekaki').hidden = false;
        }
    },
    qrTegakiDraw: function () {
        var _a = window, Tegaki = _a.Tegaki, FCX = _a.FCX;
        if (Tegaki.bg) {
            Tegaki.destroy();
        }
        FCX.oekakiName = 'tegaki.png';
        Tegaki.open({
            onDone: FCX.oekakiCB,
            onCancel: function () { Tegaki.bgColor = '#ffffff'; },
            width: +document.querySelector('#qr [name=oekaki-width]').value,
            height: +document.querySelector('#qr [name=oekaki-height]').value,
            bgColor: document.querySelector('#qr [name=oekaki-bg]').checked ?
                document.querySelector('#qr [name=oekaki-bgcolor]').value :
                'transparent'
        });
    },
    qrTegakiLoad: function () {
        var _a = window, Tegaki = _a.Tegaki, FCX = _a.FCX;
        var name = document.getElementById('qr-filename').value.replace(/\.\w+$/, '') + '.png';
        var source = document.getElementById('file-n-submit').dataset.source;
        var error = function (content) { return document.dispatchEvent(new CustomEvent('CreateNotification', {
            bubbles: true,
            detail: { type: 'warning', content: content, lifetime: 20 }
        })); };
        var cb = function (e) {
            if (e) {
                this.removeEventListener('QRMetadata', cb, false);
            }
            var selected = document.getElementById('selected');
            if (!(selected === null || selected === void 0 ? void 0 : selected.dataset.type))
                return error('No file to edit.');
            if (!/^(image|video)\//.test(selected.dataset.type)) {
                return error('Not an image.');
            }
            if (!selected.dataset.height)
                return error('Metadata not available.');
            if (selected.dataset.height === 'loading') {
                selected.addEventListener('QRMetadata', cb, false);
                return;
            }
            if (Tegaki.bg) {
                Tegaki.destroy();
            }
            FCX.oekakiName = name;
            Tegaki.open({
                onDone: FCX.oekakiCB,
                onCancel: function () { Tegaki.bgColor = '#ffffff'; },
                width: +selected.dataset.width,
                height: +selected.dataset.height,
                bgColor: 'transparent'
            });
            var canvas = document.createElement('canvas');
            canvas.width = (canvas.naturalWidth = +selected.dataset.width);
            canvas.height = (canvas.naturalHeight = +selected.dataset.height);
            canvas.hidden = true;
            document.body.appendChild(canvas);
            canvas.addEventListener('QRImageDrawn', function () {
                this.remove();
                Tegaki.onOpenImageLoaded.call(this);
            }, false);
            canvas.dispatchEvent(new CustomEvent('QRDrawFile', { bubbles: true }));
        };
        if (Tegaki.bg && (Tegaki.onDoneCb === FCX.oekakiCB) && (source === FCX.oekakiLatest)) {
            FCX.oekakiName = name;
            Tegaki.resume();
        }
        else {
            cb();
        }
    },
    testNativeExtension: function (output) {
        var _a;
        if (output === void 0) { output = {}; }
        if ((_a = window.Parser) === null || _a === void 0 ? void 0 : _a.postMenuIcon)
            output.enabled = 'true';
        return output;
    },
};
exports.default = PageContextFunctions;
