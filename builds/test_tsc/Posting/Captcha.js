"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var _1 = require("../platform/$");
var Captcha_replace_1 = require("./Captcha.replace");
var Captcha_t_1 = require("./Captcha.t");
var package_json_1 = require("../../package.json");
var Keybinds_1 = require("../Miscellaneous/Keybinds");
var __1 = require("../platform/$$");
var QR_1 = require("./QR");
var globals_1 = require("../globals/globals");
var helpers_1 = require("../platform/helpers");
var Captcha = {
    cache: {
        init: function () {
            var _this = this;
            _1.default.on(globals_1.d, 'SaveCaptcha', function (e) {
                return _this.saveAPI(e.detail);
            });
            return _1.default.on(globals_1.d, 'NoCaptcha', function (e) {
                return _this.noCaptcha(e.detail);
            });
        },
        captchas: [],
        getCount: function () {
            return this.captchas.length;
        },
        neededRaw: function () {
            return !(this.haveCookie() || this.captchas.length || QR_1.default.req || this.submitCB) && ((QR_1.default.posts.length > 1) || globals_1.Conf['Auto-load captcha'] || !QR_1.default.posts[0].isOnlyQuotes() || QR_1.default.posts[0].file);
        },
        needed: function () {
            return this.neededRaw() && _1.default.event('LoadCaptcha');
        },
        haveCookie: function () {
            var hasCT = /\b_ct=/.test(globals_1.d.cookie);
            var hasTicket = false;
            try {
                hasTicket = !!(localStorage.getItem('4chan-tc-ticket') || localStorage.getItem('4chan_pass_token'));
            }
            catch (e) { }
            return (hasCT || hasTicket) && (QR_1.default.posts[0].thread !== 'new');
        },
        getOne: function () {
            var captcha;
            delete this.prerequested;
            this.clear();
            if (captcha = this.captchas.shift()) {
                this.count();
                return captcha;
            }
            else {
                return null;
            }
        },
        request: function (isReply) {
            var _this = this;
            if (!this.submitCB) {
                if (_1.default.event('RequestCaptcha', { isReply: isReply })) {
                    return;
                }
            }
            return function (cb) {
                _this.submitCB = cb;
                return _this.updateCount();
            };
        },
        abort: function () {
            if (this.submitCB) {
                delete this.submitCB;
                _1.default.event('AbortCaptcha');
                return this.updateCount();
            }
        },
        saveAPI: function (captcha) {
            var cb;
            if (cb = this.submitCB) {
                delete this.submitCB;
                cb(captcha);
                return this.updateCount();
            }
            else {
                return this.save(captcha);
            }
        },
        noCaptcha: function (detail) {
            var cb;
            if (cb = this.submitCB) {
                if (!this.haveCookie() || (detail === null || detail === void 0 ? void 0 : detail.error)) {
                    QR_1.default.error((detail === null || detail === void 0 ? void 0 : detail.error) || 'Failed to retrieve captcha.');
                    QR_1.default.captcha.setup(globals_1.d.activeElement === QR_1.default.nodes.status);
                }
                delete this.submitCB;
                cb();
                return this.updateCount();
            }
        },
        save: function (captcha) {
            var cb;
            if (cb = this.submitCB) {
                this.abort();
                cb(captcha);
                return;
            }
            this.captchas.push(captcha);
            this.captchas.sort(function (a, b) { return a.timeout - b.timeout; });
            return this.count();
        },
        clear: function () {
            if (this.captchas.length) {
                var i = void 0;
                var now = Date.now();
                for (i = 0; i < this.captchas.length; i++) {
                    var captcha = this.captchas[i];
                    if (captcha.timeout > now) {
                        break;
                    }
                }
                if (i) {
                    this.captchas = this.captchas.slice(i);
                    return this.count();
                }
            }
        },
        count: function () {
            clearTimeout(this.timer);
            if (this.captchas.length) {
                this.timer = setTimeout(this.clear.bind(this), this.captchas[0].timeout - Date.now());
            }
            return this.updateCount();
        },
        updateCount: function () {
            return _1.default.event('CaptchaCount', this.captchas.length);
        }
    },
    replace: Captcha_replace_1.default,
    t: Captcha_t_1.default,
    v2: {
        lifetime: 2 * helpers_1.MINUTE,
        init: function () {
            var _this = this;
            if ((0, helpers_1.isPassEnabled)()) {
                return;
            }
            if (!(this.isEnabled = !!(0, _1.default)('#g-recaptcha, #captcha-forced-noscript') || !_1.default.id('postForm'))) {
                return;
            }
            if (this.noscript = globals_1.Conf['Force Noscript Captcha'] || !_1.default.hasClass(globals_1.doc, 'js-enabled')) {
                _1.default.addClass(QR_1.default.nodes.el, 'noscript-captcha');
            }
            Captcha.cache.init();
            _1.default.on(globals_1.d, 'CaptchaCount', this.count.bind(this));
            var root = _1.default.el('div', { className: 'captcha-root' });
            _1.default.extend(root, {
                innerHTML: '<div class="captcha-counter"><a href="javascript:;"></a></div>'
            });
            var counter = (0, _1.default)('.captcha-counter > a', root);
            this.nodes = { root: root, counter: counter };
            this.count();
            _1.default.addClass(QR_1.default.nodes.el, 'has-captcha', 'captcha-v2');
            _1.default.after(QR_1.default.nodes.com.parentNode, root);
            _1.default.on(counter, 'click', this.toggle.bind(this));
            _1.default.on(counter, 'keydown', function (e) {
                if (Keybinds_1.default.keyCode(e) !== 'Space') {
                    return;
                }
                _this.toggle();
                e.preventDefault();
                return e.stopPropagation();
            });
            return _1.default.on(window, 'captcha:success', function () {
                // XXX Greasemonkey 1.x workaround to gain access to GM_* functions.
                return _1.default.queueTask(function () { return _this.save(false); });
            });
        },
        timeouts: {},
        prevNeeded: 0,
        noscriptURL: function () {
            var lang;
            var url = "https://www.google.com/recaptcha/api/fallback?k=".concat(package_json_1.default.recaptchaKey);
            if (lang = globals_1.Conf['captchaLanguage'].trim()) {
                url += "&hl=".concat(encodeURIComponent(lang));
            }
            return url;
        },
        moreNeeded: function () {
            var _this = this;
            // Post count temporarily off by 1 when called from QR.post.rm, QR.close, or QR.submit
            return _1.default.queueTask(function () {
                var needed = Captcha.cache.needed();
                if (needed && !_this.prevNeeded) {
                    _this.setup(QR_1.default.cooldown.auto && (globals_1.d.activeElement === QR_1.default.nodes.status));
                }
                return _this.prevNeeded = needed;
            });
        },
        toggle: function () {
            if (this.nodes.container && !this.timeouts.destroy) {
                return this.destroy();
            }
            else {
                return this.setup(true, true);
            }
        },
        setup: function (focus, force) {
            var _this = this;
            if (!this.isEnabled || (!Captcha.cache.needed() && !force)) {
                return;
            }
            if (focus) {
                _1.default.addClass(QR_1.default.nodes.el, 'focus');
                this.nodes.counter.focus();
            }
            if (this.timeouts.destroy) {
                clearTimeout(this.timeouts.destroy);
                delete this.timeouts.destroy;
                return this.reload();
            }
            if (this.nodes.container) {
                // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=1226835
                _1.default.queueTask(function () {
                    var iframe;
                    if (_this.nodes.container && (globals_1.d.activeElement === _this.nodes.counter) && (iframe = (0, _1.default)('iframe[src^="https://www.google.com/recaptcha/"]', _this.nodes.container))) {
                        iframe.focus();
                        return QR_1.default.focus();
                    }
                }); // Event handler not fired in Firefox
                return;
            }
            this.nodes.container = _1.default.el('div', { className: 'captcha-container' });
            _1.default.prepend(this.nodes.root, this.nodes.container);
            new MutationObserver(this.afterSetup.bind(this)).observe(this.nodes.container, {
                childList: true,
                subtree: true
            });
            if (this.noscript) {
                return this.setupNoscript();
            }
            else {
                return this.setupJS();
            }
        },
        setupNoscript: function () {
            var iframe = _1.default.el('iframe', {
                id: 'qr-captcha-iframe',
                scrolling: 'no',
                src: this.noscriptURL()
            });
            var div = _1.default.el('div');
            var textarea = _1.default.el('textarea');
            _1.default.add(div, textarea);
            return _1.default.add(this.nodes.container, [iframe, div]);
        },
        setupJS: function () {
            _1.default.global('setupCaptcha', { recaptchaKey: package_json_1.default.recaptchaKey });
        },
        afterSetup: function (mutations) {
            for (var _i = 0, mutations_1 = mutations; _i < mutations_1.length; _i++) {
                var mutation = mutations_1[_i];
                for (var _a = 0, _b = mutation.addedNodes; _a < _b.length; _a++) {
                    var node = _b[_a];
                    var iframe, textarea;
                    if (iframe = _1.default.x('./descendant-or-self::iframe[starts-with(@src, "https://www.google.com/recaptcha/")]', node)) {
                        this.setupIFrame(iframe);
                    }
                    if (textarea = _1.default.x('./descendant-or-self::textarea', node)) {
                        this.setupTextArea(textarea);
                    }
                }
            }
        },
        setupIFrame: function (iframe) {
            var needle;
            if (!globals_1.doc.contains(iframe)) {
                return;
            }
            Captcha.replace.iframe(iframe);
            _1.default.addClass(QR_1.default.nodes.el, 'captcha-open');
            this.fixQRPosition();
            _1.default.on(iframe, 'load', this.fixQRPosition);
            if (globals_1.d.activeElement === this.nodes.counter) {
                iframe.focus();
            }
            // XXX Make sure scroll on space prevention (see src/css/style.css) doesn't cause scrolling of div
            if (['blink', 'edge'].includes(_1.default.engine) && (needle = iframe.parentNode, (0, __1.default)('#qr .captcha-container > div > div:first-of-type').includes(needle))) {
                return _1.default.on(iframe.parentNode, 'scroll', function () { return this.scrollTop = 0; });
            }
        },
        fixQRPosition: function () {
            if (QR_1.default.nodes.el.getBoundingClientRect().bottom > globals_1.doc.clientHeight) {
                QR_1.default.nodes.el.style.top = '';
                return QR_1.default.nodes.el.style.bottom = '0px';
            }
        },
        setupTextArea: function (textarea) {
            var _this = this;
            return _1.default.one(textarea, 'input', function () { return _this.save(true); });
        },
        destroy: function () {
            if (!this.isEnabled) {
                return;
            }
            delete this.timeouts.destroy;
            _1.default.rmClass(QR_1.default.nodes.el, 'captcha-open');
            if (this.nodes.container) {
                _1.default.global('resetCaptcha');
                _1.default.rm(this.nodes.container);
                return delete this.nodes.container;
            }
        },
        getOne: function (isReply) {
            return Captcha.cache.getOne(isReply);
        },
        save: function (pasted, token) {
            var _a;
            Captcha.cache.save({
                response: token || (0, _1.default)('textarea', this.nodes.container).value,
                timeout: Date.now() + this.lifetime
            });
            var focus = (((_a = globals_1.d.activeElement) === null || _a === void 0 ? void 0 : _a.nodeName) === 'IFRAME') && /https?:\/\/www\.google\.com\/recaptcha\//.test(globals_1.d.activeElement.src);
            if (Captcha.cache.needed()) {
                if (focus) {
                    if (QR_1.default.cooldown.auto || globals_1.Conf['Post on Captcha Completion']) {
                        this.nodes.counter.focus();
                    }
                    else {
                        QR_1.default.nodes.status.focus();
                    }
                }
                this.reload();
            }
            else {
                if (pasted) {
                    this.destroy();
                }
                else {
                    if (this.timeouts.destroy == null) {
                        this.timeouts.destroy = setTimeout(this.destroy.bind(this), 3 * helpers_1.SECOND);
                    }
                }
                if (focus) {
                    QR_1.default.nodes.status.focus();
                }
            }
            if (globals_1.Conf['Post on Captcha Completion'] && !QR_1.default.cooldown.auto) {
                return QR_1.default.submit();
            }
        },
        count: function () {
            var count = Captcha.cache.getCount();
            var loading = Captcha.cache.submitCB ? '...' : '';
            this.nodes.counter.textContent = "Captchas: ".concat(count).concat(loading);
            return this.moreNeeded();
        },
        reload: function () {
            if ((0, _1.default)('iframe[src^="https://www.google.com/recaptcha/api/fallback?"]', this.nodes.container)) {
                this.destroy();
                return this.setup(false, true);
            }
            else {
                _1.default.global('resetCaptcha');
            }
        },
        occupied: function () {
            return !!this.nodes.container && !this.timeouts.destroy;
        }
    }
};
exports.default = Captcha;
