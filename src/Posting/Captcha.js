// @ts-nocheck
import $ from "../platform/$";
import CaptchaReplace from "./Captcha.replace";
import CaptchaT from "./Captcha.t";
import meta from '../../package.json';
import keyCode from "../Miscellaneous/KeyCode";
import $$ from "../platform/$$";
import QR from "./QR";
import { Conf, d, doc } from "../globals/globals";
import { isPassEnabled, MINUTE, SECOND } from "../platform/helpers";

const Captcha = {
  cache: {
    init() {
      $.on(d, 'SaveCaptcha', e => {
        return this.saveAPI(e.detail);
      });
      return $.on(d, 'NoCaptcha', e => {
        return this.noCaptcha(e.detail);
      });
    },

    captchas: [],

    getCount() {
      return this.captchas.length;
    },

    neededRaw() {
      return !(
        this.haveCookie() || this.captchas.length || QR.req || this.submitCB
      ) && (
          (QR.posts.length > 1) || Conf['Auto-load captcha'] || !QR.posts[0].isOnlyQuotes() || QR.posts[0].file
        );
    },

    needed() {
      return this.neededRaw() && $.event('LoadCaptcha');
    },

    haveCookie() {
      const hasCT = /\b_ct=/.test(d.cookie);
      return hasCT && (QR.posts[0].thread !== 'new');
    },

    getOne() {
      let captcha;
      delete this.prerequested;
      this.clear();
      if (captcha = this.captchas.shift()) {
        this.count();
        return captcha;
      } else {
        return null;
      }
    },

    request(isReply) {
      if (!this.submitCB) {
        if ($.event('RequestCaptcha', { isReply })) { return; }
      }
      return cb => {
        this.submitCB = cb;
        return this.updateCount();
      };
    },

    abort() {
      if (this.submitCB) {
        delete this.submitCB;
        $.event('AbortCaptcha');
        return this.updateCount();
      }
    },

    saveAPI(captcha) {
      let cb;
      if (cb = this.submitCB) {
        delete this.submitCB;
        cb(captcha);
        return this.updateCount();
      } else {
        return this.save(captcha);
      }
    },

    noCaptcha(detail) {
      let cb;
      if (cb = this.submitCB) {
        if (!this.haveCookie() || detail?.error) {
          QR.error(detail?.error || 'Failed to retrieve captcha.');
          QR.captcha.setup(d.activeElement === QR.nodes.status);
        }
        delete this.submitCB;
        cb();
        return this.updateCount();
      }
    },

    save(captcha) {
      let cb;
      if (cb = this.submitCB) {
        this.abort();
        cb(captcha);
        return;
      }
      this.captchas.push(captcha);
      this.captchas.sort((a, b) => a.timeout - b.timeout);
      return this.count();
    },

    clear() {
      if (this.captchas.length) {
        let i;
        const now = Date.now();
        for (i = 0; i < this.captchas.length; i++) {
          var captcha = this.captchas[i];
          if (captcha.timeout > now) { break; }
        }
        if (i) {
          this.captchas = this.captchas.slice(i);
          return this.count();
        }
      }
    },

    count() {
      clearTimeout(this.timer);
      if (this.captchas.length) {
        this.timer = setTimeout(this.clear.bind(this), this.captchas[0].timeout - Date.now());
      }
      return this.updateCount();
    },

    updateCount() {
      return $.event('CaptchaCount', this.captchas.length);
    }
  },
  replace: CaptchaReplace,
  t: CaptchaT,
  v2: {
    lifetime: 2 * MINUTE,

    init() {
      if (isPassEnabled()) { return; }
      if (!(this.isEnabled = !!$('#g-recaptcha, #captcha-forced-noscript') || !$.id('postForm'))) { return; }

      if (this.noscript = Conf['Force Noscript Captcha'] || !$.hasClass(doc, 'js-enabled')) {
        $.addClass(QR.nodes.el, 'noscript-captcha');
      }

      Captcha.cache.init();
      $.on(d, 'CaptchaCount', this.count.bind(this));

      const root = $.el('div', { className: 'captcha-root' });
      $.extend(root, {
        innerHTML:
          '<div class="captcha-counter"><a href="javascript:;"></a></div>'
      }
      );
      const counter = $('.captcha-counter > a', root);
      this.nodes = { root, counter };
      $.on(root, 'pointerdown mousedown touchstart click', () => this.cancelCommentFocusRestore());
      $.on(QR.nodes.com, 'keydown', e => {
        if (e.key === 'Tab') { this.cancelCommentFocusRestore(); }
      });
      d.addEventListener('focus', e => this.redirectCommentFocus(e), true);
      d.addEventListener('focusin', e => this.redirectCommentFocus(e), true);
      root.addEventListener('focus', e => { this.redirectCommentFocus(e); }, true);
      this.count();
      $.addClass(QR.nodes.el, 'has-captcha', 'captcha-v2');
      $.after(QR.nodes.com.parentNode, root);

      $.on(counter, 'click', this.toggle.bind(this));
      $.on(counter, 'keydown', e => {
        if (keyCode(e) !== 'Space') { return; }
        this.toggle();
        e.preventDefault();
        return e.stopPropagation();
      });
      return $.on(window, 'captcha:success', () => {
        // XXX Greasemonkey 1.x workaround to gain access to GM_* functions.
        return $.queueTask(() => this.save(false));
      });
    },

    timeouts: {},
    prevNeeded: 0,

    noscriptURL() {
      let lang;
      let url = `https://www.google.com/recaptcha/api/fallback?k=${meta.recaptchaKey}`;
      if (lang = Conf['captchaLanguage'].trim()) {
        url += `&hl=${encodeURIComponent(lang)}`;
      }
      return url;
    },

    moreNeeded() {
      // Post count temporarily off by 1 when called from QR.post.rm, QR.close, or QR.submit
      return $.queueTask(() => {
        const needed = Captcha.cache.needed();
        if (needed && !this.prevNeeded) {
          this.setup(QR.cooldown.auto && (d.activeElement === QR.nodes.status));
        }
        return this.prevNeeded = needed;
      });
    },

    toggle() {
      if (this.nodes.container && !this.timeouts.destroy) {
        return this.destroy();
      } else {
        return this.setup(true, true);
      }
    },

    setup(focus, force) {
      if (!this.isEnabled || (!Captcha.cache.needed() && !force)) { return; }

      this.startCommentFocusRestore(focus);

      if (focus) {
        $.addClass(QR.nodes.el, 'focus');
        this.nodes.counter.focus();
      }

      if (this.timeouts.destroy) {
        clearTimeout(this.timeouts.destroy);
        delete this.timeouts.destroy;
        return this.reload();
      }

      if (this.nodes.container) {
        // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=1226835
        $.queueTask(() => {
          let iframe;
          if (this.nodes.container && (d.activeElement === this.nodes.counter) && (iframe = $('iframe[src^="https://www.google.com/recaptcha/"]', this.nodes.container))) {
            iframe.focus();
            return QR.focus();
          }
        }); // Event handler not fired in Firefox
        return;
      }

      this.nodes.container = $.el('div', { className: 'captcha-container' });
      $.prepend(this.nodes.root, this.nodes.container);
      new MutationObserver(this.afterSetup.bind(this)).observe(this.nodes.container, {
        childList: true,
        subtree: true
      }
      );

      if (this.noscript) {
        return this.setupNoscript();
      } else {
        return this.setupJS();
      }
    },

    setupNoscript() {
      const iframe = $.el('iframe', {
        id: 'qr-captcha-iframe',
        scrolling: 'no',
        src: this.noscriptURL()
      }
      );
      const div = $.el('div');
      const textarea = $.el('textarea');
      $.add(div, textarea);
      return $.add(this.nodes.container, [iframe, div]);
    },

    setupJS() {
      $.global('setupCaptcha', { recaptchaKey: meta.recaptchaKey }).then(() => this.restoreCommentFocus());
    },

    afterSetup(mutations) {
      for (var mutation of mutations) {
        for (var node of mutation.addedNodes) {
          var iframe, textarea;
          if (iframe = $.x('./descendant-or-self::iframe[starts-with(@src, "https://www.google.com/recaptcha/")]', node)) { this.setupIFrame(iframe); }
          if (textarea = $.x('./descendant-or-self::textarea', node)) { this.setupTextArea(textarea); }
        }
      }
    },

    setupIFrame(iframe) {
      let needle;
      if (!doc.contains(iframe)) { return; }
      Captcha.replace.iframe(iframe);
      $.addClass(QR.nodes.el, 'captcha-open');
      this.fixQRPosition();
      $.on(iframe, 'load', this.fixQRPosition);
      if (d.activeElement === this.nodes.counter) { iframe.focus(); }
      this.restoreCommentFocus();
      // XXX Make sure scroll on space prevention (see src/css/style.css) doesn't cause scrolling of div
      if (['blink', 'edge'].includes($.engine) && (needle = iframe.parentNode, $$('#qr .captcha-container > div > div:first-of-type').includes(needle))) {
        return $.on(iframe.parentNode, 'scroll', function () { return this.scrollTop = 0; });
      }
    },

    startCommentFocusRestore(focus) {
      if (focus || (d.activeElement !== QR.nodes.com)) {
        this.cancelCommentFocusRestore();
        return;
      }
      this.keepCommentFocus = true;
      this.keepCommentFocusUntil = Date.now() + 10000;
    },

    cancelCommentFocusRestore() {
      delete this.keepCommentFocus;
      delete this.keepCommentFocusUntil;
    },

    shouldKeepCommentFocus() {
      if (!this.keepCommentFocus || !QR.nodes || QR.nodes.el.hidden) { return false; }
      if (Date.now() > this.keepCommentFocusUntil) {
        this.cancelCommentFocusRestore();
        return false;
      }
      return true;
    },

    focusComment() {
      if (!QR.nodes || QR.nodes.el.hidden) { return; }
      try {
        QR.nodes.com.focus({ preventScroll: true });
      } catch (error) {
        QR.nodes.com.focus();
      }
    },

    redirectCommentFocus(e) {
      if (!this.shouldKeepCommentFocus()) { return false; }
      const target = e?.target instanceof Node ? e.target : null;
      if (target === QR.nodes.com) { return false; }
      if (target && QR.nodes.el.contains(target) && !this.nodes.root.contains(target)) {
        this.cancelCommentFocusRestore();
        return false;
      }
      if (target && !this.nodes.root.contains(target) && target !== d.body) {
        this.cancelCommentFocusRestore();
        return false;
      }
      e?.preventDefault?.();
      this.restoreCommentFocus();
      return true;
    },

    restoreCommentFocus() {
      if (!this.shouldKeepCommentFocus()) { return; }

      const restore = () => {
        if (!this.shouldKeepCommentFocus()) { return; }
        const active = d.activeElement;
        if (active === QR.nodes.com) { return; }
        if (active && QR.nodes.el.contains(active) && !this.nodes.root.contains(active)) {
          this.cancelCommentFocusRestore();
          return;
        }
        if (active && !this.nodes.root.contains(active) && active !== d.body) {
          this.cancelCommentFocusRestore();
          return;
        }
        this.focusComment();
      };

      $.queueTask(restore);
      if (typeof requestAnimationFrame === 'function') { requestAnimationFrame(restore); }
      setTimeout(restore, 0);
      setTimeout(restore, 50);
      setTimeout(restore, 150);
      setTimeout(restore, 300);
    },

    fixQRPosition() {
      if (QR.nodes.el.getBoundingClientRect().bottom > doc.clientHeight) {
        QR.nodes.el.style.top = '';
        return QR.nodes.el.style.bottom = '0px';
      }
    },

    setupTextArea(textarea) {
      return $.one(textarea, 'input', () => this.save(true));
    },

    destroy() {
      if (!this.isEnabled) { return; }
      delete this.timeouts.destroy;
      $.rmClass(QR.nodes.el, 'captcha-open');
      if (this.nodes.container) {
        $.global('resetCaptcha');
        $.rm(this.nodes.container);
        return delete this.nodes.container;
      }
    },

    getOne(isReply) {
      return Captcha.cache.getOne(isReply);
    },

    save(pasted, token) {
      Captcha.cache.save({
        response: token || $('textarea', this.nodes.container).value,
        timeout: Date.now() + this.lifetime
      });

      const focus = (d.activeElement?.nodeName === 'IFRAME') && /https?:\/\/www\.google\.com\/recaptcha\//.test(d.activeElement.src);
      if (Captcha.cache.needed()) {
        if (focus) {
          if (QR.cooldown.auto || Conf['Post on Captcha Completion']) {
            this.nodes.counter.focus();
          } else {
            QR.nodes.status.focus();
          }
        }
        this.reload();
      } else {
        if (pasted) {
          this.destroy();
        } else {
          if (this.timeouts.destroy == null) { this.timeouts.destroy = setTimeout(this.destroy.bind(this), 3 * SECOND); }
        }
        if (focus) { QR.nodes.status.focus(); }
      }

      if (Conf['Post on Captcha Completion'] && !QR.cooldown.auto) { return QR.submit(); }
    },

    count() {
      const count = Captcha.cache.getCount();
      const loading = Captcha.cache.submitCB ? '...' : '';
      this.nodes.counter.textContent = `Captchas: ${count}${loading}`;
      return this.moreNeeded();
    },

    reload() {
      if ($('iframe[src^="https://www.google.com/recaptcha/api/fallback?"]', this.nodes.container)) {
        this.destroy();
        return this.setup(false, true);
      } else {
        $.global('resetCaptcha');
      }
    },

    occupied() {
      return !!this.nodes.container && !this.timeouts.destroy;
    }
  }
};
export default Captcha;
