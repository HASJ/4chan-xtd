import { g, Conf, doc } from "../globals/globals";
import $ from "../platform/$";
import { isPassEnabled } from "../platform/helpers";

const CaptchaReplace = {
  init() {
    if ((g.SITE.software !== 'yotsuba') || isPassEnabled()) { return; }

    if (Conf['Force Noscript Captcha'] && $.hasClass(doc, 'js-enabled')) {
      $.ready(CaptchaReplace.noscript);
      return;
    }

    if (Conf['captchaLanguage'].trim()) {
      if (['boards.4chan.org', 'boards.4channel.org'].includes(location.hostname)) {
        $.onExists(doc, '#captchaFormPart', node => $.onExists(node, 'iframe[src^="https://www.google.com/recaptcha/"]', CaptchaReplace.iframe));
      } else {
        $.onExists(doc, 'iframe[src^="https://www.google.com/recaptcha/"]', CaptchaReplace.iframe);
      }
    }
  },

  noscript() {
    let noscript: HTMLScriptElement | undefined, original: HTMLElement | null, toggle: HTMLElement | null;
    if (!((original = $('#g-recaptcha')) && (noscript = $('noscript', original.parentNode as HTMLElement) as HTMLScriptElement))) { return; }
    const span = $.el('span', {id: 'captcha-forced-noscript'});
    $.replace(noscript, span);
    $.rm(original);
    const insert = () => {
      span.innerHTML = noscript!.textContent || '';
      const iframe = $('iframe[src^="https://www.google.com/recaptcha/"]', span) as HTMLIFrameElement | null;
      if (iframe) {
        CaptchaReplace.iframe(iframe);
      }
    };
    if (toggle = $('#togglePostFormLink a, #form-link')) {
      $.on(toggle, 'click', insert);
    } else {
      insert();
    }
  },

  iframe(iframe: HTMLIFrameElement) {
    let lang: string;
    if (lang = Conf['captchaLanguage'].trim()) {
      const src = /[?&]hl=/.test(iframe.src) ?
        iframe.src.replace(/([?&]hl=)[^&]*/, '$1' + encodeURIComponent(lang))
      :
        iframe.src + `&hl=${encodeURIComponent(lang)}`;
      if (iframe.src !== src) { iframe.src = src; }
    }
  }
};
export default CaptchaReplace;
