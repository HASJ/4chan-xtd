import { g, Conf, doc } from "../globals/globals";
import $ from "../platform/$";
import { isPassEnabled } from "../platform/helpers";

const CaptchaReplace: any = {
  init() {
    if ((g.SITE.software !== 'yotsuba') || isPassEnabled()) { return; }

    if (Conf['Force Noscript Captcha'] && $.hasClass(doc, 'js-enabled')) {
      $.ready(this.noscript);
      return;
    }

    if (Conf['captchaLanguage'].trim()) {
      if (['boards.4chan.org', 'boards.4channel.org'].includes(location.hostname)) {
        $.onExists(doc, '#captchaFormPart', node => $.onExists(node, 'iframe[src^="https://www.google.com/recaptcha/"]', this.iframe));
      } else {
        $.onExists(doc, 'iframe[src^="https://www.google.com/recaptcha/"]', this.iframe);
      }
    }
  },

  noscript() {
    const original = $('#g-recaptcha');
    if (!original) { return; }
    const noscript = $('noscript', original.parentNode);
    if (!noscript) { return; }
    const span = $.el('span',
      {id: 'captcha-forced-noscript'});
    $.replace(noscript, span);
    $.rm(original);
    const insert = () => {
      span.innerHTML = noscript.textContent;
      CaptchaReplace.iframe($('iframe[src^="https://www.google.com/recaptcha/"]', span));
    };
    const toggle = $('#togglePostFormLink a, #form-link');
    if (toggle) {
      $.on(toggle, 'click', insert);
    } else {
      insert();
    }
  },

  iframe(iframe) {
    const lang = Conf['captchaLanguage'].trim();
    if (lang) {
      const src = /[?&]hl=/.test(iframe.src) ?
        iframe.src.replace(/([?&]hl=)[^&]*/, '$1' + encodeURIComponent(lang))
      :
        iframe.src + `&hl=${encodeURIComponent(lang)}`;
      if (iframe.src !== src) { iframe.src = src; }
    }
  }
};
export default CaptchaReplace;

