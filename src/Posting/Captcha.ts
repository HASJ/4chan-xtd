import $ from "../platform/$";
import CaptchaReplace from "./Captcha.replace";
import CaptchaT from "./Captcha.t";
import meta from '../../package.json';
import Keybinds from "../Miscellaneous/Keybinds";
import $$ from "../platform/$$";
import QR from "./QR";
import { Conf, d, doc } from "../globals/globals";
import { isPassEnabled, MINUTE, SECOND } from "../platform/helpers";

interface CachingCaptcha {
  response: string;
  timeout: number;
}

const Captcha = {
  cache: {
    timer: null as any,
    submitCB: undefined as ((captcha?: any) => void) | undefined,
    prerequested: undefined as boolean | undefined,
    captchas: [] as CachingCaptcha[],

    init() {
      $.on(d, 'SaveCaptcha', (e: Event) => {
        return this.saveAPI((e as CustomEvent).detail);
      });
      $.on(d, 'NoCaptcha', (e: Event) => {
        return this.noCaptcha((e as CustomEvent).detail);
      });
    },

    getCount(): number {
      return this.captchas.length;
    },

    neededRaw(): boolean {
      return !(
        this.haveCookie() || this.captchas.length || QR.req || this.submitCB
      ) && (
        (QR.posts.length > 1) || Conf['Auto-load captcha'] || !QR.posts[0].isOnlyQuotes() || QR.posts[0].file
      );
    },

    needed(): boolean {
      return this.neededRaw() && $.event('LoadCaptcha', undefined);
    },

    haveCookie(): boolean {
      const hasCT = /\b_ct=/.test(d.cookie);
      let hasTicket = false;
      try {
        hasTicket = !!(localStorage.getItem('4chan-tc-ticket') || localStorage.getItem('4chan_pass_token'));
      } catch (e) {}
      return (hasCT || hasTicket) && (QR.posts[0].thread !== 'new');
    },

    getOne(): CachingCaptcha | null {
      let captcha: CachingCaptcha | undefined;
      delete this.prerequested;
      this.clear();
      if (captcha = this.captchas.shift()) {
        this.count();
        return captcha;
      } else {
        return null;
      }
    },

    request(isReply: boolean) {
      if (!this.submitCB) {
        if ($.event('RequestCaptcha', { isReply })) { return; }
      }
      return (cb: (captcha?: any) => void) => {
        this.submitCB = cb;
        return this.updateCount();
      };
    },

    abort() {
      if (this.submitCB) {
        delete this.submitCB;
        $.event('AbortCaptcha', undefined);
        return this.updateCount();
      }
    },

    saveAPI(captcha: CachingCaptcha) {
      let cb: ((captcha?: any) => void) | undefined;
      if (cb = this.submitCB) {
        delete this.submitCB;
        cb(captcha);
        return this.updateCount();
      } else {
        return this.save(captcha);
      }
    },

    noCaptcha(detail?: { error?: string }) {
      let cb: ((captcha?: any) => void) | undefined;
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

    save(captcha: CachingCaptcha) {
      let cb: ((captcha?: any) => void) | undefined;
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
        let i: number;
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

    updateCount(): boolean {
      return $.event('CaptchaCount', this.captchas.length);
    }
  },
  replace: CaptchaReplace,
  t: CaptchaT,
  v2: {
    lifetime: 2 * MINUTE,
    isEnabled: false,
    noscript: false,
    prevNeeded: false,
    timeouts: {} as { destroy?: any },
    nodes: {} as {
      root: HTMLElement;
      counter: HTMLAnchorElement;
      container?: HTMLElement;
    },

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
      });
      const counter = $('.captcha-counter > a', root) as HTMLAnchorElement;
      this.nodes = { root, counter };
      this.count();
      $.addClass(QR.nodes.el, 'has-captcha', 'captcha-v2');
      $.after(QR.nodes.com.parentNode as HTMLElement, root);

      $.on(counter, 'click', this.toggle.bind(this));
      $.on(counter, 'keydown', (e: Event) => {
        if (Keybinds.keyCode(e as KeyboardEvent) !== 'Space') { return; }
        this.toggle();
        e.preventDefault();
        return e.stopPropagation();
      });
      return $.on(window, 'captcha:success', () => {
        // XXX Greasemonkey 1.x workaround to gain access to GM_* functions.
        return $.queueTask(() => this.save(false));
      });
    },

    noscriptURL(): string {
      let lang: string;
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

    setup(focus?: boolean, force?: boolean) {
      if (!this.isEnabled || (!Captcha.cache.needed() && !force)) { return; }

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
          let iframe: HTMLIFrameElement | null;
          if (this.nodes.container && (d.activeElement === this.nodes.counter) && (iframe = $('iframe[src^="https://www.google.com/recaptcha/"]', this.nodes.container) as HTMLIFrameElement | null)) {
            iframe.focus();
            return QR.focus();
          }
        }); // Event handler not fired in Firefox
        return;
      }

      this.nodes.container = $.el('div', { className: 'captcha-container' });
      $.prepend(this.nodes.root, this.nodes.container);
      new MutationObserver(mutations => this.afterSetup(mutations)).observe(this.nodes.container, {
        childList: true,
        subtree: true
      });

      if (this.noscript) {
        return this.noscriptCaptchaSetup();
      } else {
        return this.setupJS();
      }
    },

    noscriptCaptchaSetup() {
      const iframe = $.el('iframe', {
        id: 'qr-captcha-iframe',
        scrolling: 'no',
        src: this.noscriptURL()
      });
      const div = $.el('div');
      const textarea = $.el('textarea');
      $.add(div, textarea);
      return $.add(this.nodes.container!, [iframe, div]);
    },

    setupJS() {
      $.global('setupCaptcha', { recaptchaKey: meta.recaptchaKey });
    },

    afterSetup(mutations: MutationRecord[]) {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes as any as HTMLElement[]) {
          let iframe: HTMLIFrameElement | null, textarea: HTMLTextAreaElement | null;
          if (iframe = $.x('./descendant-or-self::iframe[starts-with(@src, "https://www.google.com/recaptcha/")]', node) as HTMLIFrameElement | null) { this.setupIFrame(iframe); }
          if (textarea = $.x('./descendant-or-self::textarea', node) as HTMLTextAreaElement | null) { this.setupTextArea(textarea); }
        }
      }
    },

    setupIFrame(iframe: HTMLIFrameElement) {
      let needle: HTMLElement;
      if (!doc.contains(iframe)) { return; }
      Captcha.replace.iframe(iframe);
      $.addClass(QR.nodes.el, 'captcha-open');
      this.fixQRPosition();
      $.on(iframe, 'load', this.fixQRPosition.bind(this));
      if (d.activeElement === this.nodes.counter) { iframe.focus(); }
      // XXX Make sure scroll on space prevention (see src/css/style.css) doesn't cause scrolling of div
      if (['blink', 'edge'].includes($.engine) && (needle = iframe.parentNode as HTMLElement, $$('#qr .captcha-container > div > div:first-of-type').includes(needle))) {
        return $.on(iframe.parentNode as HTMLElement, 'scroll', function (this: HTMLElement) { return this.scrollTop = 0; });
      }
    },

    fixQRPosition() {
      if (QR.nodes.el.getBoundingClientRect().bottom > doc.clientHeight) {
        QR.nodes.el.style.top = '';
        return QR.nodes.el.style.bottom = '0px';
      }
    },

    setupTextArea(textarea: HTMLTextAreaElement) {
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

    getOne(isReply?: boolean) {
      return Captcha.cache.getOne();
    },

    save(pasted: boolean, token?: string) {
      const textarea = $('textarea', this.nodes.container) as HTMLTextAreaElement | null;
      Captcha.cache.save({
        response: token || (textarea ? textarea.value : ''),
        timeout: Date.now() + this.lifetime
      });

      const focus = (d.activeElement?.nodeName === 'IFRAME') && /https?:\/\/www\.google\.com\/recaptcha\//.test((d.activeElement as HTMLIFrameElement).src);
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

      if (Conf['Post on Captcha Completion'] && !QR.cooldown.auto) { return QR.submit(undefined); }
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

    occupied(): boolean {
      return !!this.nodes.container && !this.timeouts.destroy;
    }
  }
};
export default Captcha;
