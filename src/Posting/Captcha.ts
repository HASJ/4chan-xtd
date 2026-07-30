import $ from "../platform/$";
import CaptchaReplace from "./Captcha.replace";
import CaptchaT from "./Captcha.t";
import meta from '../../package.json';
import $$ from "../platform/$$";
import QRState from "../globals/QRState";
import { Conf, d, doc } from "../globals/globals";
import { isPassEnabled, keyCode, MINUTE, SECOND } from "../platform/helpers";
import { getQRCommentInput } from "./QRBridge";

const Captcha: any = {
  cache: <any>{
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
        this.haveCookie() || this.captchas.length || QRState.req || this.submitCB
      ) && (
          (QRState.posts.length > 1) || Conf['Auto-load captcha'] || !QRState.posts[0].isOnlyQuotes() || QRState.posts[0].file
        );
    },

    needed() {
      return this.neededRaw() && $.event('LoadCaptcha');
    },

    haveCookie() {
      const hasCT = /\b_ct=/.test(d.cookie);
      let hasTicket = false;
      try {
        hasTicket = !!(localStorage.getItem('4chan-tc-ticket') || localStorage.getItem('4chan_pass_token'));
      } catch (e_) { // NOSONAR
      }
      return (hasCT || hasTicket) && (QRState.posts[0].thread !== 'new');
    },

    getOne() {
      let captcha;
      delete this.prerequested;
      this.clear();
      captcha = this.captchas.shift();
      if (captcha) {
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
      cb = this.submitCB;
      if (cb) {
        delete this.submitCB;
        cb(captcha);
        return this.updateCount();
      } else {
        return this.save(captcha);
      }
    },

    noCaptcha(detail) {
      let cb;
      cb = this.submitCB;
      if (cb) {
        if (!this.haveCookie() || detail?.error) {
          QRState.error(detail?.error || 'Failed to retrieve captcha.');
          QRState.captcha.setup(d.activeElement === QRState.nodes.status);
        }
        delete this.submitCB;
        cb();
        return this.updateCount();
      }
    },

    save(captcha) {
      let cb;
      cb = this.submitCB;
      if (cb) {
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
          const captcha = this.captchas[i];
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
  v2: <any>{
    lifetime: 2 * MINUTE,

    init() {
      if (isPassEnabled()) { return; }
      this.isEnabled = !!$('#g-recaptcha, #captcha-forced-noscript') || !$.id('postForm');
      if (!this.isEnabled) { return; }
 
      this.noscript = Conf['Force Noscript Captcha'] || !$.hasClass(doc, 'js-enabled');
      if (this.noscript) {
        if (QRState.nodes) {
          $.addClass(QRState.nodes.el, 'noscript-captcha');
        } else {
          $.on(d, 'QRDialogCreation', () => $.addClass(QRState.nodes.el, 'noscript-captcha'));
        }
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
      $.on(getQRCommentInput(), 'keydown', e => {
        if (e.key === 'Tab') { this.cancelCommentFocusRestore(); }
      });

      this.count();
      $.on(root, 'pointerdown mousedown touchstart click', () => this.cancelCommentFocusRestore());
      $.on(QRState.nodes.com, 'keydown', e => {
        if (e.key === 'Tab') { this.cancelCommentFocusRestore(); }
      });

      this.count();
      $.addClass(QRState.nodes.el, 'has-captcha', 'captcha-v2');
      $.after(QRState.nodes.com.parentNode, root);

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
      let url = `https://www.google.com/recaptcha/api/fallback?k=${meta.recaptchaKey}`;
      const lang = Conf['captchaLanguage'].trim();
      if (lang) {
        url += `&hl=${encodeURIComponent(lang)}`;
      }
      return url;
    },

    moreNeeded() {
      // Post count temporarily off by 1 when called from QRState.post.rm, QRState.close, or QRState.submit
      return $.queueTask(() => {
        const needed = Captcha.cache.needed();
        if (needed && !this.prevNeeded) {
          this.setup(QRState.cooldown.auto && (d.activeElement === QRState.nodes.status));
        }
        this.prevNeeded = needed;
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
        $.addClass(QRState.nodes.el, 'focus');
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
            return QRState.focus();
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
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          const iframe = $.x('./descendant-or-self::iframe[starts-with(@src, "https://www.google.com/recaptcha/")]', node);
          if (iframe) { this.setupIFrame(iframe); }
          const textarea = $.x('./descendant-or-self::textarea', node);
          if (textarea) { this.setupTextArea(textarea); }
        }
      }
    },

    setupIFrame(iframe) {
      let needle;
      if (!doc.contains(iframe)) { return; }
      Captcha.replace.iframe(iframe);
      $.addClass(QRState.nodes.el, 'captcha-open');
      this.fixQRPosition();
      $.on(iframe, 'load', this.fixQRPosition);
      if (d.activeElement === this.nodes.counter) { iframe.focus(); }
      this.restoreCommentFocus();
      // XXX Make sure scroll on space prevention (see src/css/style.css) doesn't cause scrolling of div
      if (['blink', 'edge'].includes($.engine) && (needle = iframe.parentNode, $$('#qr .captcha-container > div > div:first-of-type').includes(needle))) {
        return $.on(iframe.parentNode, 'scroll', function (this: HTMLElement) { this.scrollTop = 0; });
      }
    },

    startCommentFocusRestore(focus) {
      if (focus || (d.activeElement === QRState.nodes?.com)) {
        this.cancelCommentFocusRestore();
        return;
      }
      this.restoreCommentFocusOnLoad = true;
      this.restoreCommentFocusUntil = Date.now() + 2000;
    },

    cancelCommentFocusRestore() {
      delete this.restoreCommentFocusOnLoad;
      delete this.restoreCommentFocusUntil;
    },

    shouldRestoreCommentFocus() {
      if (!this.restoreCommentFocusOnLoad || !QRState.nodes?.el) { return false; }
      if (Date.now() > this.restoreCommentFocusUntil) {
        this.cancelCommentFocusRestore();
        return false;
      }
      return true;
    },

    focusComment() {
      if (!QRState.nodes?.el) { return; }
      try {
        QRState.nodes.com.focus();
      } catch (error_) { // NOSONAR
      }
    },

    restoreCommentFocus() {
      if (!this.shouldRestoreCommentFocus()) { return; }

      const restore = () => {
        if (!this.shouldRestoreCommentFocus()) { return; }
        const active = d.activeElement;
        if (active === QRState.nodes.com) { return; }
        if (active && QRState.nodes.el.contains(active) && !this.nodes.root.contains(active)) {
          this.cancelCommentFocusRestore();
          return;
        }
        if (active && !this.nodes.root.contains(active) && active !== d.body) {
          this.cancelCommentFocusRestore();
          return;
        }
        this.focusComment();
        this.cancelCommentFocusRestore();
      };

      $.queueTask(restore);
      if (typeof requestAnimationFrame === 'function') { requestAnimationFrame(restore); }
      setTimeout(restore, 0);
      setTimeout(restore, 50);
      setTimeout(restore, 150);
      setTimeout(restore, 300);
    },

    fixQRPosition() {
      if (QRState.nodes.el.getBoundingClientRect().bottom > doc.clientHeight) {
        QRState.nodes.el.style.top = '';
        QRState.nodes.el.style.bottom = '0px';
      }
    },

    setupTextArea(textarea) {
      return $.one(textarea, 'input', () => this.save(true));
    },

    destroy() {
      if (!this.isEnabled) { return; }
      delete this.timeouts.destroy;
      $.rmClass(QRState.nodes.el, 'captcha-open');
      if (this.nodes.container) {
        $.global('resetCaptcha');
        $.rm(this.nodes.container);
        return delete this.nodes.container;
      }
    },

    getOne(isReply) {
      return Captcha.cache.getOne(isReply);
    },

    saveNeeded(focus) {
      if (focus) {
        if (QRState.cooldown.auto || Conf['Post on Captcha Completion']) {
          this.nodes.counter.focus();
        } else {
          QRState.nodes.status.focus();
        }
      }
      this.reload();
    },

    saveNotNeeded(pasted, focus) {
      if (pasted) {
        this.destroy();
      } else {
        this.timeouts.destroy ??= setTimeout(this.destroy.bind(this), 3 * SECOND);
      }
      if (focus) {
        QRState.nodes.status.focus();
      }
    },

    save(pasted, token) {
      Captcha.cache.save({
        response: token || $('textarea', this.nodes.container).value,
        timeout: Date.now() + this.lifetime
      });

      const focus = (d.activeElement?.nodeName === 'IFRAME') && /https?:\/\/www\.google\.com\/recaptcha\//.test((d.activeElement as HTMLIFrameElement).src);
      if (Captcha.cache.needed()) {
        this.saveNeeded(focus);
      } else {
        this.saveNotNeeded(pasted, focus);
      }

      if (Conf['Post on Captcha Completion'] && !QRState.cooldown.auto) {
        const post = QRState.posts[0];
        if (post && !((QRState.posts.length > 1) || !post.isOnlyQuotes() || post.file)) { return; }
        return QRState.submit();
      }
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
