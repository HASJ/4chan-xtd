// @ts-nocheck
import { Conf, d, g } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";
import { addQRClass, focusQRComment, getFirstQRPost, getQRCommentInput, getQRPosts, getQRRoot, insertCaptchaRoot, isQRAutoCooldown, isQRCommentActive, isQROpen, submitQR } from "./QRBridge";
import { isPassEnabled } from "../platform/helpers";

const CaptchaT = {
  init() {
    if (isPassEnabled()) { return; }
    if (!(this.isEnabled = !!$('#t-root') || !$.id('postForm'))) { return; }

    const root = $.el('div', {className: 'captcha-root'});
    this.nodes = {root};

    addQRClass('has-captcha', 'captcha-t');
    if (Conf['Theme Captcha']) $.addClass(document.documentElement, 'themed-captcha');
    insertCaptchaRoot(root);

    $.on(root, 'pointerdown mousedown touchstart click', () => this.cancelCommentFocusRestore());
    $.on(getQRCommentInput(), 'keydown', e => {
      if (e.key === 'Tab') { this.cancelCommentFocusRestore(); }
    });
    d.addEventListener('focus', e => this.redirectCommentFocus(e), true);
    d.addEventListener('focusin', e => this.redirectCommentFocus(e), true);
    root.addEventListener('focus', (e) => {
      if (this.redirectCommentFocus(e)) {
        if (this.isInitializing && e.target.id === 't-resp') { this.isInitializing = false; }
        return;
      }
      if (this.isInitializing && e.target.id === 't-resp') {
        this.isInitializing = false;
        if (!this.shouldFocus) {
          e.preventDefault();
          if (e.relatedTarget && getQRRoot().contains(e.relatedTarget)) {
            e.relatedTarget.focus();
          } else if (isQROpen()) {
            focusQRComment();
          }
        }
      }
    }, true);
  },

  moreNeeded() {
    const post = getFirstQRPost();
    if (!this.isEnabled || !post) { return; }

    // Match the v2 captcha's lazy-loading behavior: don't fetch a challenge
    // for an empty QR, but fetch one as soon as the queued post needs it.
    if (
      (getQRPosts().length > 1) ||
      Conf['Auto-load captcha'] ||
      !post.isOnlyQuotes() ||
      post.file
    ) {
      this.shouldLoad = true;
      this.load();
    }
  },

  load() {
    if (isQRCommentActive()) { this.startCommentFocusRestore(false); }
    if (!this.shouldLoad || !this.isInitialized || !CaptchaT.currentThread || this.hasRequested) { return; }
    if (this.nodes.container && ($('#t-slider', this.nodes.container) || $('#t-resp', this.nodes.container))) { return; }

    // Request directly from the native API. The #t-load control is not
    // consistently rendered after a fresh-cookie session.
    this.shouldLoad = false;
    this.hasRequested = true;
    $.global('loadTCaptcha', CaptchaT.currentThread).then(() => this.restoreCommentFocus());
    this.restoreCommentFocus();
  },

  getThread() {
    return {
      boardID: g.BOARD.ID,
      threadID: getFirstQRPost().thread === 'new' ? '0' : ('' + getFirstQRPost().thread),
    };
  },

  setup(focus) {
    if (!this.isEnabled) { return; }

    this.isCompleted = false;
    this.shouldFocus = focus;
    this.startCommentFocusRestore(focus);

    if (!this.nodes.container) {
      this.hasRequested = !!Conf['Auto-load captcha'];
      // Create a child element for TCaptcha to use. TCaptcha.init() will
      // clear its className and set inline styles on it, but our JS reference
      // (this.nodes.container) remains valid. We observe captcha-root (the
      // parent) since it retains its class and stays stable.
      this.nodes.container = $.el('div', {className: 'captcha-container'});
      $.addClass(this.nodes.root, 'captcha-idle');
      $.prepend(this.nodes.root, this.nodes.container);
      CaptchaT.currentThread = CaptchaT.getThread();
      CaptchaT.currentThread.autoLoad = Conf['Auto-load captcha'] ? '1' : '0';

      this.isInitializing = true;
      this.observer = new MutationObserver(() => {
        this.isInitializing = false;
        this.createStrips();
        this.checkCompletion();
        this.load();
        this.restoreCommentFocus();
      });
      // Observe captcha-root, NOT captcha-container, because TCaptcha clears
      // the container's className making class-based queries fail.
      this.observer.observe(this.nodes.root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

      $.global('setupTCaptcha', CaptchaT.currentThread).then(() => {
        this.isInitialized = true;
        this.load();
        this.restoreCommentFocus();
      });

      // Polling fallback for style changes that MutationObserver might miss.
      if (!this.pollInterval) {
        this.pollInterval = setInterval(() => {
          if (!this.nodes.container) {
            clearInterval(this.pollInterval);
            delete this.pollInterval;
            return;
          }
          this.createStrips();
          this.checkCompletion();
          this.load();
        }, 500);
      }
    }

    if (focus) $('#t-resp').focus();
  },

  startCommentFocusRestore(focus) {
    if (focus || (!isQRCommentActive())) {
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
    if (!this.keepCommentFocus || !isQROpen()) { return false; }
    if (Date.now() > this.keepCommentFocusUntil) {
      this.cancelCommentFocusRestore();
      return false;
    }
    return true;
  },

  focusComment() {
    if (!isQROpen()) { return; }
    try {
      focusQRComment(true);
    } catch (error) {
      focusQRComment();
    }
  },

  redirectCommentFocus(e) {
    if (!this.shouldKeepCommentFocus()) { return false; }
    const target = e?.target instanceof Node ? e.target : null;
    if (target === getQRCommentInput()) { return false; }
    if (target && getQRRoot().contains(target) && !this.nodes.root.contains(target)) {
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
      if (active === getQRCommentInput()) { return; }
      if (active && getQRRoot().contains(active) && !this.nodes.root.contains(active)) {
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

  clearCustomUi(mainDiv) {
    $$('.captcha-custom-ui, .captcha-clue-image, .captcha-strip', mainDiv).forEach(el => $.rm(el));
    this._isNotLikeOthers = false;
    this.isCapturing = false;
  },

  setIdle(mainDiv) {
    this.clearCustomUi(mainDiv);
    $.rmClass(this.nodes.root, 'is-challenge');
    $.addClass(this.nodes.root, 'captcha-idle');
  },

  createStrips() {
    const mainDiv = this.nodes.container;
    if (!mainDiv) return;

    const slider = $('#t-slider', mainDiv);
    const taskEl = $('#t-task', mainDiv);
    let customUiExists = !!$('.captcha-custom-ui', mainDiv);
    const tLoad = $('#t-load', mainDiv);
    const tLoadText = tLoad ? `${tLoad.value || ''} ${tLoad.textContent || ''}` : '';
    const isOnCooldown = /\(\d+\)/.test(tLoadText);
    const tNext = $('#t-next', mainDiv);
    const tNextText = tNext ? tNext.textContent || '' : '';
    const hasActiveChallengeStep = /\(\d+\/\d+\)/.test(tNextText);

    if (isOnCooldown && !hasActiveChallengeStep) {
      this.setIdle(mainDiv);
      return;
    }
    
    // If there's no slider or it has no max attribute, it's not a real puzzle 
    // (e.g., "Verification not required", "Captcha expired", or initializing)
    if (!slider || !slider.hasAttribute('max')) {
      this.setIdle(mainDiv);
      return;
    }

    const imgEl = taskEl ? $('img', taskEl) : null;
    const taskBg = taskEl ? taskEl.style.backgroundImage || getComputedStyle(taskEl).backgroundImage : '';
    const hasTaskBg = taskBg && taskBg.includes('url(');
    
    // A real puzzle has task image frames. If there is no separate clue image,
    // the challenge is the odd-one-out variant.
    if (!imgEl && (hasTaskBg || hasActiveChallengeStep)) {
      this._isNotLikeOthers = true;
    } else if (imgEl && imgEl.src) {
      this._isNotLikeOthers = false;
    }
    const isNotLikeOthers = !!this._isNotLikeOthers;

    let clueUrl = '';
    if (imgEl && imgEl.src) {
        clueUrl = `url("${imgEl.src}")`;
    } else if (hasTaskBg) {
        clueUrl = taskBg;
    }
    
    const isChallenge = hasActiveChallengeStep || (!!hasTaskBg && (!!clueUrl || isNotLikeOthers));

    if (!isChallenge) {
      this.setIdle(mainDiv);
      return;
    }
    $.rmClass(this.nodes.root, 'captcha-idle');
    $.addClass(this.nodes.root, 'is-challenge');

    // Check if we have a NEW challenge in a sequence (e.g. Next 2/3)
    if (customUiExists) {
      const customUi = $('.captcha-custom-ui', mainDiv);
      const oldStep = customUi ? customUi.dataset.step : '';
      const tNextNode = $('#t-next', mainDiv);
      const newStep = tNextNode ? tNextNode.textContent : '';
      
      let isNewChallenge = false;
      if (oldStep && newStep && oldStep !== newStep) {
        isNewChallenge = true;
      } else if (imgEl && imgEl.src) {
        const existingClueImage = $('.captcha-clue-image', mainDiv);
        if (existingClueImage && existingClueImage.style.backgroundImage !== `url("${imgEl.src}")`) {
          isNewChallenge = true;
        }
      }

      if (isNewChallenge) {
        if (customUi) $.rm(customUi);
        const existingClueImage = $('.captcha-clue-image', mainDiv);
        if (existingClueImage) $.rm(existingClueImage);
        customUiExists = false;
        this.isCapturing = false;
      }
    }

    // If we've already built the custom UI for this challenge, or we're building it, do nothing.
    // The custom UI will naturally be destroyed when TCaptcha wipes the container on reload.
    if (customUiExists || this.isCapturing || !slider || !taskEl) return;

    // We are at the initial challenge state!
    this.isCapturing = true;

    // Create the clue image and insert it into #t-ctrl
    const tCtrl = $('#t-ctrl', mainDiv);
    if (tCtrl) {
      if (!$('.captcha-clue-image', tCtrl)) {
        const clueImage = $.el('div', {className: 'captcha-clue-image'});
        if (isNotLikeOthers) {
          clueImage.style.display = 'none';
        } else {
          clueImage.style.backgroundImage = clueUrl; // The actual clue icon!
        }
        const tNextNode = $('#t-next', tCtrl);
        if (tNextNode) {
          $.before(tNextNode, clueImage);
        } else {
          $.add(tCtrl, clueImage);
        }
      }
    }

    // Create the strips container (acting as the custom UI marker)
    const stripsContainer = $.el('div', {
      className: `captcha-strips captcha-custom-ui${isNotLikeOthers ? ' is-odd-one-out' : ''}`
    });
    const tNextForStep = $('#t-next', mainDiv);
    if (tNextForStep) {
      stripsContainer.dataset.step = tNextForStep.textContent;
    }
    const minVal = parseInt(slider.getAttribute('min') || '0', 10);
    const maxVal = parseInt(slider.getAttribute('max') || '3', 10);
    const count = maxVal + 1;
    const startIndex = Math.max(1, minVal);

    for (let i = startIndex; i < count; i++) {
      const strip = $.el('div', {className: 'captcha-strip', tabIndex: 0});
      strip.dataset.index = '' + i;
      $.on(strip, 'click', () => {
        if (this.isCapturing) return;
        slider.value = '' + i;
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        $$('.captcha-strip', stripsContainer).forEach(s => $.rmClass(s, 'selected'));
        $.addClass(strip, 'selected');
        if (Conf['Next challenge on captcha selection'] && !this.isRestoring) {
          const tNext = $('#t-next', mainDiv);
          if (tNext && !tNext.disabled) {
            tNext.click();
          }
        }
      });
      $.add(stripsContainer, strip);
    }

    const tBox = $('#t-box', mainDiv);
    if (tBox) {
      $.add(tBox, stripsContainer);
    } else {
      $.add(mainDiv, stripsContainer);
    }

    // Now capture the 4 puzzle images by programmatically moving the slider
    const originalSliderValue = slider.value;
    let capturedImages = 0;
    
    const runCapture = async () => {
      for (let i = startIndex; i < count; i++) {
        if (slider.value !== '' + i) {
          slider.value = '' + i;
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        const stripIndex = i - startIndex;
        const strip = stripsContainer.children[stripIndex];
        if (strip) {
          const taskStyle = getComputedStyle(taskEl);
          const bg = taskEl.style.backgroundImage || taskStyle.backgroundImage;
          if (bg && bg.includes('url(')) { capturedImages++; }
          strip.style.backgroundImage = bg;
          strip.style.backgroundPosition = taskEl.style.backgroundPosition || taskStyle.backgroundPosition;
          strip.style.backgroundSize = taskEl.style.backgroundSize || taskStyle.backgroundSize;
          strip.style.backgroundRepeat = taskEl.style.backgroundRepeat || taskStyle.backgroundRepeat;
        }
      }

      if (!capturedImages) {
        this.isCapturing = false;
        this.isRestoring = true;
        slider.value = originalSliderValue;
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        this.isRestoring = false;
        if (!hasActiveChallengeStep) { this.setIdle(mainDiv); }
        return;
      }

      // Done capturing!
      this.isCapturing = false;
      this.isRestoring = true;
      // Restore slider and visually select the active strip
      slider.value = originalSliderValue;
      slider.dispatchEvent(new Event('change', { bubbles: true }));
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      
      const targetValue = parseInt(originalSliderValue, 10) || 0;
      const targetStrip = $$('.captcha-strip', stripsContainer).find(s => parseInt(s.dataset.index, 10) === targetValue) || stripsContainer.children[0];
      if (targetStrip) targetStrip.click();
      this.isRestoring = false;
    };

    runCapture();

    if (!this.keydownListener) {
      this.keydownListener = (e) => {
        if (!this.nodes.container || this.isCapturing) return;
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && document.activeElement?.id !== 't-resp') return;
        const key = e.key;
        if (key === ' ') {
          const tNext = $('#t-next', this.nodes.container);
          if (tNext && !tNext.disabled) {
            e.preventDefault();
            tNext.click();
          }
        } else if (key >= '1' && key <= '9') {
          const index = parseInt(key, 10) - 1;
          const stripElements = $$('.captcha-strip', this.nodes.root);
          if (stripElements[index]) {
            e.preventDefault();
            stripElements[index].click();
            stripElements[index].focus();
          }
        } else if (key === 'ArrowLeft') {
          const stripElements = $$('.captcha-strip', this.nodes.root);
          if (stripElements.length) {
            e.preventDefault();
            const selectedIndex = stripElements.findIndex(s => $.hasClass(s, 'selected'));
            let newIndex = selectedIndex - 1;
            if (selectedIndex === -1) {
              newIndex = 0;
            } else if (newIndex < 0) {
              newIndex = 0;
            }
            if (stripElements[newIndex]) {
              stripElements[newIndex].click();
              stripElements[newIndex].focus();
            }
          }
        } else if (key === 'ArrowRight') {
          const stripElements = $$('.captcha-strip', this.nodes.root);
          if (stripElements.length) {
            e.preventDefault();
            const selectedIndex = stripElements.findIndex(s => $.hasClass(s, 'selected'));
            let newIndex = selectedIndex + 1;
            if (selectedIndex === -1) {
              newIndex = 0;
            } else if (newIndex >= stripElements.length) {
              newIndex = stripElements.length - 1;
            }
            if (stripElements[newIndex]) {
              stripElements[newIndex].click();
              stripElements[newIndex].focus();
            }
          }
        }
      };
      $.on(document, 'keydown', this.keydownListener);
    }

    // Apply CSS class to hide native elements
    $.addClass(this.nodes.root, 'is-challenge');
  },

  destroy() {
    this.isCompleted = false;
    delete this.isInitialized;
    delete this.hasRequested;
    if (this.observer) {
      this.observer.disconnect();
      delete this.observer;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      delete this.pollInterval;
    }
    if (this.keydownListener) {
      $.off(document, 'keydown', this.keydownListener);
      delete this.keydownListener;
    }
    if (!this.isEnabled || !this.nodes.container) { return; }
    $.global('destroyTCaptcha');
    $.rm(this.nodes.container);
    $.rmClass(this.nodes.root, 'is-challenge', 'captcha-idle');
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

  checkCompletion() {
    if (!this.isEnabled || !this.nodes.container) return;
    const response = this.getOne();
    if (response && response['t-response']) {
      const tNext = $('#t-next', this.nodes.container);
      const tNextText = tNext ? tNext.textContent || '' : '';
      const stepMatch = tNextText.match(/\((\d+)\/(\d+)\)/);
      const hasRemainingChallengeSteps = stepMatch && parseInt(stepMatch[1], 10) < parseInt(stepMatch[2], 10);
      if (hasRemainingChallengeSteps || (!stepMatch && tNext && !tNext.disabled && (tNext.offsetWidth > 0 || tNext.offsetHeight > 0))) {
        return;
      }
      if (this.isCompleted) return;
      this.isCompleted = true;
      if (Conf['Post on Captcha Completion'] && !isQRAutoCooldown()) {
        submitQR();
      }
    } else {
      this.isCompleted = false;
    }
  },

  setUsed() {
    this.isCompleted = false;
    delete this.hasRequested;
    this.shouldLoad = true;
    if (this.isEnabled && this.nodes.container) {
      $.global('TCaptchaClearChallenge');
    }
  },

  occupied() {
    return !!this.nodes.container;
  },

  setupIframe() {
    this.isEnabled = true;
    const mainDiv = $('#t-slider')?.parentNode;
    if (!mainDiv) {
      this.iframeObserver = new MutationObserver(() => {
        const md = $('#t-slider')?.parentNode;
        if (md) {
          this.iframeObserver.disconnect();
          this.initIframeTransformation(md);
        }
      });
      this.iframeObserver.observe(document.body, { childList: true, subtree: true });
    } else {
      this.initIframeTransformation(mainDiv);
    }
  },

  initIframeTransformation(mainDiv) {
    const slider = $('#t-slider', mainDiv);
    if (!slider) return;

    this.observer = new MutationObserver(() => {
      this.createIframeStrips(mainDiv, slider);
    });
    const taskEl = $('#t-task', mainDiv);
    if (taskEl) {
      this.observer.observe(taskEl, { attributes: true, attributeFilter: ['style'] });
    }

    this.createIframeStrips(mainDiv, slider);

    $.on(window, 'message', (e) => {
      if (e.data && e.data.type === 'select-strip') {
        const index = e.data.index;
        const strips = $$('.captcha-strip', mainDiv);
        if (strips[index]) {
          strips[index].click();
          strips[index].focus();
        }
      }
    });

    if (!this.keydownListener) {
      this.keydownListener = (e) => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && document.activeElement?.id !== 't-resp') return;
        const key = e.key;
        if (key >= '1' && key <= '9') {
          const index = parseInt(key, 10) - 1;
          const strips = $$('.captcha-strip', mainDiv);
          if (strips[index]) {
            e.preventDefault();
            strips[index].click();
            strips[index].focus();
          }
        } else if (key === 'ArrowLeft') {
          const strips = $$('.captcha-strip', mainDiv);
          if (strips.length) {
            e.preventDefault();
            const selectedIndex = strips.findIndex(s => $.hasClass(s, 'selected'));
            let newIndex = selectedIndex - 1;
            if (selectedIndex === -1) {
              newIndex = 0;
            } else if (newIndex < 0) {
              newIndex = 0;
            }
            if (strips[newIndex]) {
              strips[newIndex].click();
              strips[newIndex].focus();
            }
          }
        } else if (key === 'ArrowRight') {
          const strips = $$('.captcha-strip', mainDiv);
          if (strips.length) {
            e.preventDefault();
            const selectedIndex = strips.findIndex(s => $.hasClass(s, 'selected'));
            let newIndex = selectedIndex + 1;
            if (selectedIndex === -1) {
              newIndex = 0;
            } else if (newIndex >= strips.length) {
              newIndex = strips.length - 1;
            }
            if (strips[newIndex]) {
              strips[newIndex].click();
              strips[newIndex].focus();
            }
          }
        }
      };
      $.on(document, 'keydown', this.keydownListener);
    }
  },

  createIframeStrips(mainDiv, slider) {

    let strips = $('.captcha-strips', mainDiv);
    if (!strips) {
      const minStr = slider.getAttribute('min');
      const minVal = minStr ? parseInt(minStr, 10) : 0;
      const min = Math.max(1, minVal);
      const maxStr = slider.getAttribute('max');
      const max = maxStr ? parseInt(maxStr, 10) : 3;
      const count = max + 1;

      strips = $.el('div', {className: 'captcha-strips'});
      for (let i = min; i < count; i++) {
        const strip = $.el('div', {className: 'captcha-strip', tabIndex: 0});
        strip.dataset.index = i;
        strip.style.backgroundPositionY = `calc(-145px * ${i} - 32px)`;
        $.on(strip, 'click', () => {
          slider.value = i;
          slider.dispatchEvent(new Event('change', { bubbles: true }));
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          $$('.captcha-strip', strips).forEach(s => $.rmClass(s, 'selected'));
          $.addClass(strip, 'selected');
          if (Conf['Next challenge on captcha selection']) {
            const tNext = $('#t-next', mainDiv);
            if (tNext && !tNext.disabled) {
              tNext.click();
            }
          }
        });
        $.add(strips, strip);
      }
      $.add(mainDiv, strips);
    }

    const taskEl = $('#t-task', mainDiv);
    if (!taskEl) return;

    const bg = taskEl.style.backgroundImage;
    const isChallenge = bg && bg.includes('url(');
    if (isChallenge) {
      $$('.captcha-strip', strips).forEach(strip => {
        strip.style.backgroundImage = bg;
      });
      taskEl.style.setProperty('background-image', 'none', 'important');
      $.addClass(document.documentElement, 'is-challenge');
      strips.style.display = '';
    } else if (bg !== 'none') {
      $.rmClass(document.documentElement, 'is-challenge');
      strips.style.display = 'none';
    }
  }
};
export default CaptchaT;
