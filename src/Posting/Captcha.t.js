// @ts-nocheck
import { Conf, d, g } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";
import QR from "./QR";
import { isPassEnabled } from "../platform/helpers";

const CaptchaT = {
  init() {
    if (isPassEnabled()) { return; }
    if (!(this.isEnabled = !!$('#t-root') || !$.id('postForm'))) { return; }

    const root = $.el('div', {className: 'captcha-root'});
    this.nodes = {root};

    $.addClass(QR.nodes.el, 'has-captcha', 'captcha-t');
    if (Conf['Theme Captcha']) $.addClass(document.documentElement, 'themed-captcha');
    $.after(QR.nodes.com.parentNode, root);
  },

  moreNeeded() {
    const post = QR.posts[0];
    if (!this.isEnabled || !post) { return; }

    // Match the v2 captcha's lazy-loading behavior: don't fetch a challenge
    // for an empty QR, but fetch one as soon as the queued post needs it.
    if (
      (QR.posts.length > 1) ||
      Conf['Auto-load captcha'] ||
      !post.isOnlyQuotes() ||
      post.file
    ) {
      this.shouldLoad = true;
      this.load();
    }
  },

  load() {
    if (!this.shouldLoad || !this.nodes?.container) { return; }

    // TCaptcha exposes its normal on-demand fetch through #t-load. Clicking
    // that control preserves its own request and rate-limit handling.
    const load = $('#t-load', this.nodes.container);
    if (load && !load.disabled) {
      this.shouldLoad = false;
      load.click();
    }
  },

  getThread() {
    return {
      boardID: g.BOARD.ID,
      threadID: QR.posts[0].thread === 'new' ? '0' : ('' + QR.posts[0].thread),
    };
  },

  setup(focus) {
    if (!this.isEnabled) { return; }

    this.isCompleted = false;

    if (!this.nodes.container) {
      // Create a child element for TCaptcha to use. TCaptcha.init() will
      // clear its className and set inline styles on it, but our JS reference
      // (this.nodes.container) remains valid. We observe captcha-root (the
      // parent) since it retains its class and stays stable.
      this.nodes.container = $.el('div', {className: 'captcha-container'});
      $.prepend(this.nodes.root, this.nodes.container);
      CaptchaT.currentThread = CaptchaT.getThread();
      CaptchaT.currentThread.autoLoad = Conf['Auto-load captcha'] ? '1' : '0';

      this.observer = new MutationObserver(() => {
        this.createStrips();
        this.checkCompletion();
        this.load();
      });
      // Observe captcha-root, NOT captcha-container, because TCaptcha clears
      // the container's className making class-based queries fail.
      this.observer.observe(this.nodes.root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

      $.global('setupTCaptcha', CaptchaT.currentThread);

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

  createStrips() {
    const mainDiv = this.nodes.container;
    if (!mainDiv) return;

    const slider = $('#t-slider', mainDiv);
    const taskEl = $('#t-task', mainDiv);
    let customUiExists = !!$('.captcha-custom-ui', mainDiv);
    
    // If there's no slider or it has no max attribute, it's not a real puzzle 
    // (e.g., "Verification not required", "Captcha expired", or initializing)
    if (!slider || !slider.hasAttribute('max')) {
      $.rmClass(this.nodes.root, 'is-challenge');
      this._isNotLikeOthers = false;
      return;
    }

    const imgEl = taskEl ? $('img', taskEl) : null;
    
    // Now we know it's a real puzzle because it has a max attribute.
    // If it has no image clue, it must be the odd one out!
    if (!imgEl) {
      this._isNotLikeOthers = true;
    } else if (imgEl && imgEl.src) {
      this._isNotLikeOthers = false;
    }
    const isNotLikeOthers = !!this._isNotLikeOthers;

    const taskBg = taskEl ? taskEl.style.backgroundImage : '';
    let clueUrl = '';
    if (imgEl && imgEl.src) {
        clueUrl = `url("${imgEl.src}")`;
    } else if (taskBg && taskBg.includes('url(')) {
        clueUrl = taskBg;
    }
    
    // Safety check, though the max attribute check above already guarantees it's a challenge
    const isChallenge = !!clueUrl || isNotLikeOthers;

    if (!customUiExists && !isChallenge) {
      $.rmClass(this.nodes.root, 'is-challenge');
      return;
    }

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
    
    const runCapture = async () => {
      let lastBg = taskEl.style.backgroundImage; // Track the actual style property
      let lastPos = taskEl.style.backgroundPosition;
      for (let i = startIndex; i < count; i++) {
        await new Promise(resolve => {
          let isResolved = false;
          
          const observer = new MutationObserver(() => {
             const currentBg = taskEl.style.backgroundImage;
             const currentPos = taskEl.style.backgroundPosition;
             if (currentBg && currentBg.includes('url(') && (currentBg !== lastBg || currentPos !== lastPos)) {
                 isResolved = true;
                 observer.disconnect();
                 resolve();
             }
          });
          observer.observe(taskEl, { attributes: true, attributeFilter: ['style'] });
          
          slider.value = '' + i;
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));

          // Failsafe timeout
          setTimeout(() => {
             if (!isResolved) {
                 observer.disconnect();
                 resolve();
             }
          }, 1000);
        });

        const stripIndex = i - startIndex;
        const strip = stripsContainer.children[stripIndex];
        if (strip) {
          lastBg = taskEl.style.backgroundImage;
          lastPos = taskEl.style.backgroundPosition;
          strip.style.backgroundImage = lastBg;
          strip.style.backgroundPosition = lastPos;
          strip.style.backgroundSize = taskEl.style.backgroundSize;
          strip.style.backgroundRepeat = taskEl.style.backgroundRepeat;
        }
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
    $.rmClass(this.nodes.root, 'is-challenge');
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
      // Check if there is an active/visible "Next" button for intermediate challenges
      const tNext = $('#t-next', this.nodes.container);
      if (tNext && !tNext.disabled && (tNext.offsetWidth > 0 || tNext.offsetHeight > 0)) {
        return;
      }
      if (this.isCompleted) return;
      this.isCompleted = true;
      if (Conf['Post on Captcha Completion'] && !QR.cooldown.auto) {
        QR.submit();
      }
    } else {
      this.isCompleted = false;
    }
  },

  setUsed() {
    this.isCompleted = false;
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
