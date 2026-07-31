import { Conf, d, g } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";
import QRState from "../globals/QRState";
import { isPassEnabled, isTrustedSiteOrigin, SECOND } from "../platform/helpers";

// Ceilings on server-stated durations, in seconds. Only a malformed value can
// exceed these; real ones are tens of seconds to a couple of minutes.
const MAX_SERVER_COOLDOWN = 300;
const MAX_CHALLENGE_TTL = 600;

// 4chan rate-limits how many challenges one client may pull, and an open QR
// with the auto-load on will keep pulling them for as long as the tab is open
// -- none of which get spent, because nothing is being posted. Past the limit
// the service stops answering the frame at all, which strands #t-load on
// "Loading" with no way back. Budget the auto-clicks between posts and let the
// user click the button by hand after that.
const MAX_AUTO_RELOADS_PER_POST = 3;

const CaptchaT: any = {
  init() {
    if (isPassEnabled()) { return; }
    this.isEnabled = !!$('#t-root') || !$.id('postForm');
    if (!this.isEnabled) { return; }

    const root = $.el('div', {className: 'captcha-root'});
    this.nodes = {root};

    $.addClass(QRState.nodes.el, 'has-captcha', 'captcha-t');
    if (Conf['Theme Captcha']) $.addClass(document.documentElement, 'themed-captcha');
    $.after(QRState.nodes.com.parentNode, root);

    $.on(root, 'pointerdown mousedown touchstart click', () => this.cancelCommentFocusRestore());
    $.on(QRState.nodes.com, 'keydown', e => {
      if (e.key === 'Tab') { this.cancelCommentFocusRestore(); }
    });
    // Anywhere in the QR counts as the user working on the post -- comment,
    // name, options, subject, filename. The captcha widget does not: a click
    // there is what completes the challenge, so counting it would delay every
    // auto-post by the full window.
    $.on(QRState.nodes.el, 'input keydown', e => this.noteTyping(e));
    // Give up on the automatic reload when it is our own click that failed;
    // errors from a manual or unrelated request are not ours to react to.
    $.on(d, 'TCaptchaError', () => {
      if (this.cooldownReloadTimer) { this.failCooldownReload(); }
    });
    // The captcha frame posts its own cooldown up to the parent, on both a
    // challenge ({twister:{cd,ttl,...}}) and a refusal ({twister:{error,cd}}).
    // That number is authoritative; everything else here is inference.
    window.addEventListener('message', e => {
      if (!isTrustedSiteOrigin(e.origin)) { return; }
      this.noteServerCooldown(e.data?.twister);
      this.noteChallengeExpiry(e.data?.twister);
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
          if (e.relatedTarget && QRState.nodes.el.contains(e.relatedTarget)) {
            e.relatedTarget.focus();
          } else if (QRState.nodes.el) {
            QRState.nodes.com.focus();
          }
        }
      }
    }, true);
  },

  moreNeeded() {
    const post = QRState.posts[0];
    if (!this.isEnabled || !post) { return; }

    // Match the v2 captcha's lazy-loading behavior: don't fetch a challenge
    // for an empty QR, but fetch one as soon as the queued post needs it.
    if (
      (QRState.posts.length > 1) ||
      Conf['Auto-load captcha'] ||
      !post.isOnlyQuotes() ||
      post.file
    ) {
      this.shouldLoad = true;
      this.load();
    }
  },

  load() {
    if (d.activeElement === QRState.nodes?.com) { this.startCommentFocusRestore(false); }
    if (!this.shouldLoad || !this.isInitialized || !CaptchaT.currentThread || this.hasRequested) { return; }
    if (this.nodes.container) {
      const slider = $('#t-slider', this.nodes.container);
      const response = $('#t-resp', this.nodes.container);
      if (slider?.hasAttribute('max') || response?.value) { return; }
    }

    // Request directly from the native API. The #t-load control is not
    // consistently rendered after a fresh-cookie session.
    this.shouldLoad = false;
    this.hasRequested = true;
    $.global('loadTCaptcha', CaptchaT.currentThread).then(() => this.restoreCommentFocus());
    this.restoreCommentFocus();
  },

  noteTyping(e) {
    const target = e?.target instanceof Node ? e.target : null;
    if (target && this.nodes.root?.contains(target)) { return; }
    this.lastTypedAt = Date.now();
  },

  // Milliseconds still to wait before the QR counts as idle. 0 means the post
  // can go out now -- either nothing was typed or the delay is switched off.
  typingIdleRemaining() {
    const seconds = Number.parseFloat(Conf['Auto-post typing delay']);
    const delay = (Number.isFinite(seconds) && (seconds > 0)) ? (seconds * SECOND) : 0;
    if (!delay || !this.lastTypedAt) { return 0; }
    return Math.max(0, (this.lastTypedAt + delay) - Date.now());
  },

  // 'Post on Captcha Completion' submits the moment an answer lands, which with
  // the auto-load can be while the user is still writing. Hold the submit until
  // they have been quiet -- deferred, never cancelled, so the setting still
  // does what it says once they stop.
  autoSubmitWhenIdle(response) {
    this.clearAutoSubmitTimer();
    const wait = this.typingIdleRemaining();
    if (!wait) {
      this.autoSubmit(response);
      return;
    }
    this.autoSubmitTimer = setTimeout(() => {
      delete this.autoSubmitTimer;
      if (!this.isEnabled || !this.nodes.container) { return; }
      if (!Conf['Post on Captcha Completion'] || QRState.cooldown?.auto) { return; }
      // Re-read instead of reusing the payload captured when the wait started:
      // the answer may have been consumed, cleared or replaced since.
      const current = this.getOne();
      if (!current?.['t-response'] && (current?.['t-challenge'] !== 'noop')) { return; }
      // Still typing? Wait again rather than posting on a stale deadline.
      this.autoSubmitWhenIdle(current);
    }, wait);
  },

  clearAutoSubmitTimer() {
    if (this.autoSubmitTimer) {
      clearTimeout(this.autoSubmitTimer);
      delete this.autoSubmitTimer;
    }
  },

  getThread() {
    return {
      boardID: g.BOARD!.ID,
      threadID: QRState.posts[0].thread === 'new' ? '0' : ('' + QRState.posts[0].thread),
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
    if (focus || (d.activeElement === QRState.nodes?.com)) {
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
    if (!this.keepCommentFocus || !QRState.nodes?.el) { return false; }
    if (Date.now() > this.keepCommentFocusUntil) {
      this.cancelCommentFocusRestore();
      return false;
    }
    return true;
  },

  focusComment() {
    if (!QRState.nodes?.el) { return; }
    try {
      QRState.nodes.com.focus();
    } catch {
      // Ignore: comment node can be detached mid-focus during a QR teardown.
    }
  },

  redirectCommentFocus(e) {
    if (!this.shouldKeepCommentFocus()) { return false; }
    const target = e?.target instanceof Node ? e.target : null;
    if (target === QRState.nodes?.com) { return false; }
    if (target && QRState.nodes?.el?.contains(target) && !this.nodes.root.contains(target)) {
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
      if (active === QRState.nodes?.com) { return; }
      if (active && QRState.nodes?.el?.contains(active) && !this.nodes.root.contains(active)) {
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
    $.rmClass(this.nodes.root, 'is-challenge', 'captcha-status');
    $.addClass(this.nodes.root, 'captcha-idle');
  },

  setStatusMessage(mainDiv) {
    this.clearCustomUi(mainDiv);
    $.rmClass(this.nodes.root, 'is-challenge', 'captcha-idle', 'captcha-status');
    $.addClass(this.nodes.root, 'captcha-status');
  },

  hasVerificationNotRequired(mainDiv) {
    if (!mainDiv) { return false; }
    const el = $('#t-msg, #t-task', mainDiv);
    return !!(el && /Verification not required/i.test(el.textContent));
  },

  detectChallengeState(mainDiv) {
    const slider = $('#t-slider', mainDiv);
    const taskEl = $('#t-task', mainDiv);
    const tLoad = $('#t-load', mainDiv);
    const tLoadText = tLoad ? `${tLoad.value || ''} ${tLoad.textContent || ''}` : '';
    const isOnCooldown = /\(\d+\)/.test(tLoadText);
    const tNext = $('#t-next', mainDiv);
    const tNextText = tNext?.textContent || '';
    const hasActiveChallengeStep = /\(\d+\/\d+\)/.test(tNextText);
    const verificationNotRequired = this.hasVerificationNotRequired(mainDiv);

    const imgEl = taskEl ? $('img', taskEl) : null;
    const taskBg = taskEl ? taskEl.style.backgroundImage || getComputedStyle(taskEl).backgroundImage : '';
    const hasTaskBg = taskBg?.includes('url(');

    // A real puzzle has task image frames. If there is no separate clue image,
    // the challenge is the odd-one-out variant.
    if (!imgEl && (hasTaskBg || hasActiveChallengeStep)) {
      this._isNotLikeOthers = true;
    } else if (imgEl?.src) {
      this._isNotLikeOthers = false;
    }
    const isNotLikeOthers = !!this._isNotLikeOthers;

    let clueUrl = '';
    if (imgEl?.src) {
      clueUrl = `url("${imgEl.src}")`;
    } else if (hasTaskBg) {
      clueUrl = taskBg;
    }

    const isChallenge = hasActiveChallengeStep || (!!hasTaskBg && (!!clueUrl || isNotLikeOthers));

    return { slider, taskEl, tLoad, isOnCooldown, hasActiveChallengeStep, verificationNotRequired, imgEl, isNotLikeOthers, clueUrl, isChallenge };
  },

  // 'cd' is the number of seconds until the service will hand out another
  // challenge, stated by the service that enforces it. Everything else in this
  // area is inference -- scraping the button's label, or an invented retry
  // schedule -- so this takes precedence over both.
  noteServerCooldown(twister) {
    const cd = twister?.cd;
    if ((typeof cd !== 'number') || !Number.isFinite(cd) || (cd < 0)) { return; }
    // A malformed or changed unit (milliseconds, say) must not be able to
    // strand the auto-load for the rest of the session.
    this.serverCooldownUntil = Date.now() + (Math.min(cd, MAX_SERVER_COOLDOWN) * SECOND);
  },

  serverCooldownRemains() {
    return !!this.serverCooldownUntil && (Date.now() < this.serverCooldownUntil);
  },

  // 'ttl' is how long the challenge in this message stays valid -- 120s in
  // practice. Only trust it on a message that actually carries a challenge; a
  // refusal has no challenge to put a lifetime on.
  noteChallengeExpiry(twister) {
    const ttl = twister?.ttl;
    if (!twister?.challenge) { return; }
    if ((typeof ttl !== 'number') || !Number.isFinite(ttl) || (ttl <= 0)) { return; }
    this.answerExpiresAt = Date.now() + (Math.min(ttl, MAX_CHALLENGE_TTL) * SECOND);
  },

  // Unknown expiry is not expiry: with no message seen, this stays false and
  // the answer keeps its protection.
  answerHasExpired() {
    return !!this.answerExpiresAt && (Date.now() >= this.answerExpiresAt);
  },

  // 4chan's #t-load button refuses a new challenge while it counts down
  // ("Get Captcha (28)"). Click it whenever the counter is not running, so a
  // challenge is ready without the user reaching for the button. Deliberately
  // stateless: any latch on having seen a counter strands the feature in every
  // state where the counter already expired, such as after a failed post.
  updateCooldownReload(state) {
    if (!Conf['Auto-load captcha after cooldown']) { return; }
    // Budget spent since the last post. Not a backoff: there is nothing to
    // retry, so this stays off until a post consumes a captcha.
    if (this.autoReloadsSincePost >= MAX_AUTO_RELOADS_PER_POST) { return; }
    // The service already said it will refuse. Asking anyway earns an error and
    // a longer cooldown.
    if (this.serverCooldownRemains()) { return; }
    // 4chan is not asking for a captcha at all (the ext=1 widget parks on a
    // 'noop' challenge). Clicking fetches nothing, and the watchdog would score
    // the empty result as a failure -- which is what used to ratchet the backoff
    // to its ceiling and keep it there for the rest of the session.
    if (state.verificationNotRequired) { return; }
    if (this.cooldownReloadRetryAt && (Date.now() < this.cooldownReloadRetryAt)) { return; }
    // A missing #t-load is not proof the counter cleared: the control is not
    // consistently rendered, so only act on a real, enabled button.
    if (!state.tLoad || state.tLoad.disabled || state.isOnCooldown) { return; }
    // Leave a live challenge alone: a click wipes it mid-solve.
    if (state.isChallenge || state.hasActiveChallengeStep) { return; }
    // Same for an answer already in hand -- clicking would strand 'Post on
    // Captcha Completion' with nothing to send. But a solved answer sits in
    // #t-resp and nothing clears it on its own, so once it is past its ttl it
    // protects a payload 4chan will reject and blocks the reload behind it.
    if (this.hasAnswerInHand() && !this.answerHasExpired()) { return; }
    // A previous click is still in flight while its watchdog is pending.
    if (this.cooldownReloadTimer) { return; }

    this.hasRequested = true;
    this.shouldLoad = false;
    this.autoReloadsSincePost = (this.autoReloadsSincePost || 0) + 1;
    if (d.activeElement === QRState.nodes?.com) { this.startCommentFocusRestore(false); }
    state.tLoad.click();
    this.watchCooldownReload();
    this.restoreCommentFocus();
  },

  // checkCompletion()'s condition, recomputed rather than read off isCompleted:
  // createStrips() runs before checkCompletion() in a poll tick, so the flag
  // trails the DOM by one tick.
  hasAnswerInHand() {
    if (this.isCompleted) { return true; }
    if (!this.getOne()?.['t-response']) { return false; }
    return !this.hasMoreChallengeSteps($('#t-next', this.nodes.container));
  },

  // Score the click 5s on. A challenge, another step, a fresh countdown or a
  // "no verification needed" reply all count as the service having answered;
  // anything else is treated as a failure and backs the reload off rather than
  // clicking again.
  watchCooldownReload() {
    clearTimeout(this.cooldownReloadTimer);
    this.cooldownReloadTimer = setTimeout(() => {
      delete this.cooldownReloadTimer;
      if (!this.nodes.container) { return; }
      const state = this.detectChallengeState(this.nodes.container);
      if (state.isChallenge || state.hasActiveChallengeStep || state.isOnCooldown) {
        delete this.cooldownReloadFailures;
        return;
      }
      // The state flipped to 'no captcha needed' while our click was in flight.
      // The service answered, so that is not a failure -- but nothing loaded,
      // so leave load() unblocked.
      if (state.verificationNotRequired) {
        delete this.cooldownReloadFailures;
        delete this.hasRequested;
        return;
      }
      this.failCooldownReload();
    }, 5 * SECOND);
  },

  // Back off, never latch off. A permanent stop only recovers on a successful
  // post or a page reload, so a failed challenge -- which is neither -- used to
  // strand the reload for the rest of the session.
  //
  // The invented schedule below is only reached when the service said nothing
  // at all: no challenge, no countdown, no stated cooldown. That is an outage,
  // not a hiccup, so it stays slow on purpose -- a faster curve would just send
  // more requests at an endpoint that is not answering.
  failCooldownReload() {
    this.clearCooldownReloadTimer();
    // The request produced nothing, so don't leave load() blocked on it.
    delete this.hasRequested;
    // Our click got no answer, so #t-load is still disabled on 'Loading' and
    // nothing else will ever re-enable it. Hand the button back to the user.
    $.global('unlockStuckTCaptchaReload');

    // The refusal came with the service's own retry time. Use it rather than
    // guessing, and keep the guess unescalated -- a stated cooldown is a normal
    // answer, not a fault to hold against the next attempt.
    if (this.serverCooldownRemains()) {
      delete this.cooldownReloadFailures;
      this.cooldownReloadRetryAt = this.serverCooldownUntil;
      return;
    }

    this.cooldownReloadFailures = Math.min((this.cooldownReloadFailures || 0) + 1, 4);
    this.cooldownReloadRetryAt = Date.now() + (this.cooldownReloadFailures * 30 * SECOND);
  },

  clearCooldownReloadTimer() {
    if (this.cooldownReloadTimer) {
      clearTimeout(this.cooldownReloadTimer);
      delete this.cooldownReloadTimer;
    }
  },

  resetCooldownReload() {
    this.clearCooldownReloadTimer();
    delete this.cooldownReloadRetryAt;
    delete this.cooldownReloadFailures;
  },

  // Check if we have a NEW challenge in a sequence (e.g. Next 2/3); reconciles
  // stale custom UI left over from the previous challenge step.
  reconcileCustomUi(mainDiv, state) {
    const customUi = $('.captcha-custom-ui', mainDiv);
    if (!customUi) return false;

    const oldStep = customUi.dataset.step;
    const tNextNode = $('#t-next', mainDiv);
    const newStep = tNextNode ? tNextNode.textContent : '';

    let isNewChallenge = false;
    if (oldStep && newStep && oldStep !== newStep) {
      isNewChallenge = true;
    } else if (state.imgEl?.src) {
      const existingClueImage = $('.captcha-clue-image', mainDiv);
      if (existingClueImage && existingClueImage.style.backgroundImage !== `url("${state.imgEl.src}")`) {
        isNewChallenge = true;
      }
    }

    if (!isNewChallenge) { return true; }

    $.rm(customUi);
    const existingClueImage = $('.captcha-clue-image', mainDiv);
    if (existingClueImage) $.rm(existingClueImage);
    this.isCapturing = false;
    delete this.selectedChallengeStep;
    return false;
  },

  createClueImage(mainDiv, state) {
    const tCtrl = $('#t-ctrl', mainDiv);
    if (!tCtrl || $('.captcha-clue-image', tCtrl)) return;
    const clueImage = $.el('div', {className: 'captcha-clue-image'});
    if (state.isNotLikeOthers) {
      clueImage.style.display = 'none';
    } else {
      clueImage.style.backgroundImage = state.clueUrl; // The actual clue icon!
    }
    const tNextNode = $('#t-next', tCtrl);
    if (tNextNode) {
      $.before(tNextNode, clueImage);
    } else {
      $.add(tCtrl, clueImage);
    }
  },

  onStripClick(mainDiv, slider, stripsContainer, strip, i) {
    if (this.isCapturing) return;
    slider.value = '' + i;
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    $$('.captcha-strip', stripsContainer).forEach(s => $.rmClass(s, 'selected'));
    $.addClass(strip, 'selected');
    if (!this.isRestoring) {
      const tNext = $('#t-next', mainDiv);
      this.selectedChallengeStep = stripsContainer.dataset.step || tNext?.textContent || '';
    }
    if (Conf['Next challenge on captcha selection'] && !this.isRestoring) {
      const tNext = $('#t-next', mainDiv);
      if (tNext && !tNext.disabled) {
        tNext.click();
      }
    }
  },

  // Create the strips container (acting as the custom UI marker) plus its strip elements.
  createStripElements(mainDiv, slider, state) {
    const stripsContainer = $.el('div', {
      className: `captcha-strips captcha-custom-ui${state.isNotLikeOthers ? ' is-odd-one-out' : ''}`
    });
    const tNextForStep = $('#t-next', mainDiv);
    if (tNextForStep) {
      stripsContainer.dataset.step = tNextForStep.textContent;
    }
    delete this.selectedChallengeStep;
    const minVal = Number.parseInt(slider.getAttribute('min') || '0', 10);
    const maxVal = Number.parseInt(slider.getAttribute('max') || '3', 10);
    const count = maxVal + 1;
    const startIndex = Math.max(1, minVal);

    for (let i = startIndex; i < count; i++) {
      const strip = $.el('div', {className: 'captcha-strip', tabIndex: 0});
      strip.dataset.index = '' + i;
      $.on(strip, 'click', () => this.onStripClick(mainDiv, slider, stripsContainer, strip, i));
      $.add(stripsContainer, strip);
    }

    const tBox = $('#t-box', mainDiv);
    if (tBox) {
      $.add(tBox, stripsContainer);
    } else {
      $.add(mainDiv, stripsContainer);
    }

    return { stripsContainer, startIndex, count };
  },

  restoreSlider(slider, value) {
    slider.value = value;
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  },

  // Capture the puzzle images by programmatically moving the slider across
  // every step, reading back the resulting background image for each strip.
  async captureStripImages(taskEl, slider, stripsContainer, startIndex, count) {
    let capturedImages = 0;
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
        if (bg?.includes('url(')) { capturedImages++; }
        strip.style.backgroundImage = bg;
        strip.style.backgroundPosition = taskEl.style.backgroundPosition || taskStyle.backgroundPosition;
        strip.style.backgroundSize = taskEl.style.backgroundSize || taskStyle.backgroundSize;
        strip.style.backgroundRepeat = taskEl.style.backgroundRepeat || taskStyle.backgroundRepeat;
      }
    }
    return capturedImages;
  },

  async runCapture(mainDiv, taskEl, slider, stripsContainer, startIndex, count, hasActiveChallengeStep) {
    const originalSliderValue = slider.value;
    const capturedImages = await this.captureStripImages(taskEl, slider, stripsContainer, startIndex, count);

    if (!capturedImages) {
      this.isCapturing = false;
      this.isRestoring = true;
      this.restoreSlider(slider, originalSliderValue);
      this.isRestoring = false;
      if (!hasActiveChallengeStep) { this.setIdle(mainDiv); }
      return;
    }

    // Done capturing! Restore slider and visually select the active strip.
    this.isCapturing = false;
    this.isRestoring = true;
    this.restoreSlider(slider, originalSliderValue);

    const targetValue = Number.parseInt(originalSliderValue, 10) || 0;
    const targetStrip = $$('.captcha-strip', stripsContainer).find(s => Number.parseInt(s.dataset.index, 10) === targetValue) || stripsContainer.children[0];
    if (targetStrip) targetStrip.click();
    this.isRestoring = false;
  },

  // Shared strip navigation, used by both the main captcha and iframe keydown handlers.
  selectStripByNumber(e, strips, key) {
    const strip = strips[Number.parseInt(key, 10) - 1];
    if (!strip) return;
    e.preventDefault();
    strip.click();
    strip.focus();
  },

  navigateStrip(e, strips, delta) {
    if (!strips.length) return;
    e.preventDefault();
    const selectedIndex = strips.findIndex(s => $.hasClass(s, 'selected'));
    let newIndex;
    if (delta < 0) {
      newIndex = selectedIndex - 1;
      if (selectedIndex === -1 || newIndex < 0) { newIndex = 0; }
    } else {
      newIndex = selectedIndex + 1;
      if (selectedIndex === -1) { newIndex = 0; }
      else if (newIndex >= strips.length) { newIndex = strips.length - 1; }
    }
    const strip = strips[newIndex];
    if (strip) { strip.click(); strip.focus(); }
  },

  handleCaptchaKeydown(e) {
    if (!this.nodes.container || this.isCapturing) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '') && document.activeElement?.id !== 't-resp') return;
    const key = e.key;
    if (key === ' ') {
      const tNext = $('#t-next', this.nodes.container);
      if (tNext && !tNext.disabled) {
        e.preventDefault();
        tNext.click();
      }
      return;
    }
    const strips = $$('.captcha-strip', this.nodes.root);
    if (key >= '1' && key <= '9') {
      this.selectStripByNumber(e, strips, key);
    } else if (key === 'ArrowLeft') {
      this.navigateStrip(e, strips, -1);
    } else if (key === 'ArrowRight') {
      this.navigateStrip(e, strips, 1);
    }
  },

  registerKeydownListener() {
    if (this.keydownListener) return;
    this.keydownListener = (e) => this.handleCaptchaKeydown(e);
    $.on(document, 'keydown', this.keydownListener);
  },

  createStrips() {
    const mainDiv = this.nodes.container;
    if (!mainDiv) return;

    const state = this.detectChallengeState(mainDiv);
    const { slider, taskEl } = state;

    this.updateCooldownReload(state);

    if (state.verificationNotRequired) {
      this.setStatusMessage(mainDiv);
      return;
    }

    if (state.isOnCooldown && !state.hasActiveChallengeStep) {
      this.setIdle(mainDiv);
      return;
    }

    // If there's no slider or it has no max attribute, it's not a real puzzle
    // (e.g., "Captcha expired" or initializing)
    if (!slider?.hasAttribute('max')) {
      this.setIdle(mainDiv);
      return;
    }

    if (!state.isChallenge) {
      this.setIdle(mainDiv);
      return;
    }
    $.rmClass(this.nodes.root, 'captcha-idle', 'captcha-status');
    $.addClass(this.nodes.root, 'is-challenge');

    const customUiExists = this.reconcileCustomUi(mainDiv, state);

    // If we've already built the custom UI for this challenge, or we're building it, do nothing.
    // The custom UI will naturally be destroyed when TCaptcha wipes the container on reload.
    if (customUiExists || this.isCapturing || !slider || !taskEl) return;

    // We are at the initial challenge state!
    this.isCapturing = true;

    this.createClueImage(mainDiv, state);
    const { stripsContainer, startIndex, count } = this.createStripElements(mainDiv, slider, state);

    // Now capture the puzzle images by programmatically moving the slider.
    this.runCapture(mainDiv, taskEl, slider, stripsContainer, startIndex, count, state.hasActiveChallengeStep);

    this.registerKeydownListener();

    // Apply CSS class to hide native elements
    $.addClass(this.nodes.root, 'is-challenge');
  },

  destroy() {
    this.isCompleted = false;
    delete this.isInitialized;
    delete this.hasRequested;
    delete this.selectedChallengeStep;
    delete this.autoSubmittedFor;
    delete this.answerExpiresAt;
    delete this.autoReloadsSincePost;
    delete this.lastTypedAt;
    this.clearAutoSubmitTimer();
    this.resetCooldownReload();
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
    $.rmClass(this.nodes.root, 'is-challenge', 'captcha-idle', 'captcha-status');
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
    let response: any = {};
    if (this.nodes.container) {
      for (const key of ['t-response', 't-challenge']) {
        response[key] = $(`[name='${key}']`, this.nodes.container)?.value;
      }
    }
    if (!response['t-response'] && !this.hasVerificationNotRequired(this.nodes.container)) {
      response = null;
    }
    return response;
  },

  // True while the challenge still has a step to advance to (another sequence
  // step remains, or the current step hasn't been selected/advanced yet).
  hasMoreChallengeSteps(tNext) {
    const tNextText = tNext?.textContent || '';
    const stepMatch = tNextText.match(/\((\d+)\/(\d+)\)/);
    const hasRemainingChallengeSteps = stepMatch && Number.parseInt(stepMatch[1], 10) < Number.parseInt(stepMatch[2], 10);
    const selectedCurrentStep = stepMatch && this.selectedChallengeStep === tNextText;
    const canAdvanceChallenge = tNext && !tNext.disabled && (tNext.offsetWidth > 0 || tNext.offsetHeight > 0);
    return (stepMatch && (!selectedCurrentStep || hasRemainingChallengeSteps || canAdvanceChallenge)) || (!stepMatch && canAdvanceChallenge);
  },

  checkCompletion() {
    if (!this.isEnabled || !this.nodes.container) return;
    // getOne() is the authority on what counts as a usable payload: an answered
    // challenge, or one where 4chan wants no verification. Reading 't-response'
    // directly disagreed with it, so the no-verification case never completed
    // and never triggered the auto-post.
    //
    // Take the 'noop' sentinel as proof of that second case, not the status
    // text: the message can still be on screen while a real challenge loads, and
    // completing there would auto-post an empty t-response and burn an error.
    const response = this.getOne();
    const noCaptchaNeeded = !response?.['t-response'] && (response?.['t-challenge'] === 'noop');
    if (!response?.['t-response'] && !noCaptchaNeeded) {
      this.isCompleted = false;
      return;
    }
    // Nothing to solve and no steps to advance when no captcha was asked for.
    if (!noCaptchaNeeded && this.hasMoreChallengeSteps($('#t-next', this.nodes.container))) return;
    if (this.isCompleted) return;
    this.isCompleted = true;
    // A solved captcha proves the service is answering again, so cut any
    // backoff short rather than waiting it out.
    this.resetCooldownReload();
    if (Conf['Post on Captcha Completion'] && !QRState.cooldown.auto) {
      this.autoSubmitWhenIdle(response);
    }
  },

  // setup() runs on every failed post and clears isCompleted, so the false->true
  // edge alone does not bound the auto-post: the next poll tick would complete
  // and submit again. That is harmless for a solved challenge, whose answer is
  // single-use, but a 'noop' payload never changes and would resubmit forever.
  // Key the submit to the payload so each distinct captcha posts at most once.
  autoSubmit(response) {
    const post = QRState.posts[0];
    if (post && !((QRState.posts.length > 1) || !post.isOnlyQuotes() || post.file)) { return; }
    const payload = `${response['t-challenge'] || ''}:${response['t-response'] || ''}`;
    if (this.autoSubmittedFor === payload) { return; }
    this.autoSubmittedFor = payload;
    QRState.submit();
  },

  setUsed() {
    this.isCompleted = false;
    delete this.hasRequested;
    delete this.selectedChallengeStep;
    delete this.autoSubmittedFor;
    delete this.answerExpiresAt;
    // A captcha reached 4chan, so the auto-load has earned its budget back.
    delete this.autoReloadsSincePost;
    delete this.lastTypedAt;
    this.clearAutoSubmitTimer();
    this.resetCooldownReload();
    this.shouldLoad = false;
    if (this.isEnabled && this.nodes.container) {
      $.global('TCaptchaClearChallenge');
      this.setIdle(this.nodes.container);
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
      if (e.data?.type === 'select-strip') {
        const index = e.data.index;
        const strips = $$('.captcha-strip', mainDiv);
        if (strips[index]) {
          strips[index].click();
          strips[index].focus();
        }
      }
    });

    this.registerIframeKeydownListener(mainDiv);
  },

  handleIframeKeydown(mainDiv, e) {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '') && document.activeElement?.id !== 't-resp') return;
    const key = e.key;
    const strips = $$('.captcha-strip', mainDiv);
    if (key >= '1' && key <= '9') {
      this.selectStripByNumber(e, strips, key);
    } else if (key === 'ArrowLeft') {
      this.navigateStrip(e, strips, -1);
    } else if (key === 'ArrowRight') {
      this.navigateStrip(e, strips, 1);
    }
  },

  registerIframeKeydownListener(mainDiv) {
    if (this.keydownListener) return;
    this.keydownListener = (e) => this.handleIframeKeydown(mainDiv, e);
    $.on(document, 'keydown', this.keydownListener);
  },

  onIframeStripClick(mainDiv, slider, strips, strip, i) {
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
  },

  buildIframeStripsContainer(mainDiv, slider) {
    const minStr = slider.getAttribute('min');
    const minVal = minStr ? Number.parseInt(minStr, 10) : 0;
    const min = Math.max(1, minVal);
    const maxStr = slider.getAttribute('max');
    const max = maxStr ? Number.parseInt(maxStr, 10) : 3;
    const count = max + 1;

    const strips = $.el('div', {className: 'captcha-strips'});
    for (let i = min; i < count; i++) {
      const strip = $.el('div', {className: 'captcha-strip', tabIndex: 0});
      strip.dataset.index = i;
      strip.style.backgroundPositionY = `calc(-145px * ${i} - 32px)`;
      $.on(strip, 'click', () => this.onIframeStripClick(mainDiv, slider, strips, strip, i));
      $.add(strips, strip);
    }
    $.add(mainDiv, strips);
    return strips;
  },

  updateIframeStripsBackground(strips, taskEl) {
    const bg = taskEl.style.backgroundImage;
    const isChallenge = bg?.includes('url(');
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
  },

  createIframeStrips(mainDiv, slider) {
    const strips = $('.captcha-strips', mainDiv) || this.buildIframeStripsContainer(mainDiv, slider);

    const taskEl = $('#t-task', mainDiv);
    if (!taskEl) return;

    this.updateIframeStripsBackground(strips, taskEl);
  }
};
export default CaptchaT;
