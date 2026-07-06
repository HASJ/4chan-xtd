import { Conf, d, g } from "../globals/globals";
import $ from "../platform/$";
import QR from "./QR";
import { isPassEnabled } from "../platform/helpers";

const CaptchaT = {
  init() {
    if (isPassEnabled()) { return; }
    if (!(this.isEnabled = !!$('#t-root') || !$.id('postForm'))) { return; }

    const root = $.el('div', {className: 'captcha-root'});
    this.nodes = {root};

    $.addClass(QR.nodes.el, 'has-captcha', 'captcha-t');
    $.after(QR.nodes.com.parentNode, root);
  },

  moreNeeded() {
  },

  getThread() {
    return {
      boardID: g.BOARD.ID,
      threadID: QR.posts[0].thread === 'new' ? '0' : ('' + QR.posts[0].thread),
    };
  },

  setup(focus) {
    if (!this.isEnabled) { return; }

    if (!this.nodes.container) {
      this.nodes.container = $.el('div', {className: 'captcha-container'});
      $.prepend(this.nodes.root, this.nodes.container);
      CaptchaT.currentThread = CaptchaT.getThread();
      CaptchaT.currentThread.autoLoad = Conf['Auto-load captcha'] ? '1' : '0';
      $.global('setupTCaptcha', CaptchaT.currentThread);
    }

    if (focus) $('#t-resp').focus();
  },

  destroy() {
    if (!this.isEnabled || !this.nodes.container) { return; }
    $.global('destroyTCaptcha');
    $.rm(this.nodes.container);
    delete this.nodes.container;
  },

  updateThread() {
    if (!this.isEnabled) { return; }
    const {boardID, threadID} = (CaptchaT.currentThread || {});
    const newThread = CaptchaT.getThread();
    if ((newThread.boardID !== boardID) || (newThread.threadID !== threadID)) {
      CaptchaT.destroy();
      CaptchaT.setup();
    }
  },

  getOne() {
    let el;
    let response = {};
    if (this.nodes.container) {
      for (var key of ['t-response', 't-challenge']) {
        response[key] = $(`[name='${key}']`, this.nodes.container).value;
      }
    }
    if (!response['t-response'] && !((el = $('#t-msg, #t-task')) && /Verification not required/i.test(el.textContent))) {
      response = null;
    }
    return response;
  },

  setUsed() {
    if (this.isEnabled && this.nodes.container) {
      $.global('TCaptchaClearChallenge');
    }
  },

  occupied() {
    return !!this.nodes.container;
  }
};
export default CaptchaT;
