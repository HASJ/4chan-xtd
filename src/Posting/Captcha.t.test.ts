import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Conf } from '../globals/globals';
import QRState from '../globals/QRState';
import $ from '../platform/$';
import CaptchaT from './Captcha.t';

const COUNTING_DOWN = 'Get Captcha (28)';
const IDLE = 'Get Captcha';

const buildCaptcha = () => {
  const root = document.createElement('div');
  root.className = 'captcha-root';
  root.innerHTML = `
    <div class="captcha-container">
      <input type="button" id="t-load" value="${IDLE}">
      <div id="t-ctrl"><button id="t-next"></button></div>
      <div id="t-task"></div>
      <input id="t-resp" name="t-response">
      <input type="hidden" name="t-challenge">
      <input type="range" id="t-slider">
    </div>`;
  document.body.append(root);
  const container = root.querySelector<HTMLElement>('.captcha-container')!;
  const tLoad = root.querySelector<HTMLInputElement>('#t-load')!;
  CaptchaT.nodes = { root, container };
  return { root, container, tLoad, click: vi.spyOn(tLoad, 'click') };
};

// 4chan's ext=1 captcha: the challenge lives in #t-frame and the parent's own
// nodes are inert -- a status message, a disabled slider that keeps its max, an
// empty hidden response, and a 'noop' challenge.
const buildExtCaptcha = () => {
  const root = document.createElement('div');
  root.className = 'captcha-root';
  root.innerHTML = `
    <div class="captcha-container">
      <div id="t-ctrl">
        <button id="t-load" type="button">${IDLE}</button>
        <button id="t-next" type="button" disabled>Next</button>
      </div>
      <iframe id="t-frame" src="https://sys.4chan.org/captcha?ext=1"></iframe>
      <div id="t-task"><div>Verification not required.</div></div>
      <input id="t-slider" type="range" min="0" max="3" disabled>
      <input name="t-challenge" type="hidden" value="noop">
      <input id="t-resp" name="t-response" type="hidden" value="">
    </div>`;
  document.body.append(root);
  const container = root.querySelector<HTMLElement>('.captcha-container')!;
  const tLoad = root.querySelector<HTMLButtonElement>('#t-load')!;
  CaptchaT.nodes = { root, container };
  return { root, container, tLoad, click: vi.spyOn(tLoad, 'click') };
};

describe('CaptchaT auto-load after cooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn($, 'global').mockResolvedValue({});
    Conf['Auto-load captcha'] = false;
    Conf['Auto-load captcha after cooldown'] = true;
    Conf['Post on Captcha Completion'] = false;
    QRState.posts = [];
    QRState.nodes = null;
    CaptchaT.isEnabled = true;
    CaptchaT.nodes = {};
    CaptchaT.resetCooldownReload();
    CaptchaT.isCompleted = false;
    delete CaptchaT.hasRequested;
    CaptchaT.shouldLoad = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clicks an idle #t-load without ever having seen a counter', () => {
    const { click } = buildCaptcha();

    CaptchaT.createStrips();

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('clicks once the counter clears', () => {
    const { tLoad, click } = buildCaptcha();
    tLoad.value = COUNTING_DOWN;

    CaptchaT.createStrips();
    expect(click).not.toHaveBeenCalled();

    tLoad.value = IDLE;
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);

    // No repeat click on the next poll while the request is in flight.
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);
  });

  // The failed-post path: setUsed() drops the challenge and the button can be
  // idle straight away, with no countdown for anything to latch onto.
  it('clicks after setUsed leaves the button idle', () => {
    const { click } = buildCaptcha();

    CaptchaT.setUsed();
    CaptchaT.createStrips();

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('does not click when the option is off', () => {
    const { click } = buildCaptcha();
    Conf['Auto-load captcha after cooldown'] = false;

    CaptchaT.createStrips();

    expect(click).not.toHaveBeenCalled();
  });

  it('does not treat a missing #t-load as an idle button', () => {
    const { tLoad, click } = buildCaptcha();
    tLoad.remove();

    CaptchaT.createStrips();

    expect(click).not.toHaveBeenCalled();
  });

  it('does not click over an answered challenge', () => {
    const { root, click } = buildCaptcha();
    root.querySelector<HTMLInputElement>('#t-resp')!.value = 'answer';

    CaptchaT.createStrips();

    expect(click).not.toHaveBeenCalled();
  });

  it('does not click over a solved captcha that has not been used yet', () => {
    const { click } = buildCaptcha();
    CaptchaT.isCompleted = true;

    CaptchaT.createStrips();

    expect(click).not.toHaveBeenCalled();
  });

  it('backs off when a click yields no challenge and no new countdown', () => {
    const { click } = buildCaptcha();

    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(CaptchaT.cooldownReloadFailures).toBe(1);

    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);
  });

  // The failed-challenge path: nothing calls setUsed() and nothing gets solved,
  // so a permanent stop here would only recover on a page reload.
  it('recovers on its own once the backoff elapses', () => {
    const { click } = buildCaptcha();

    CaptchaT.createStrips();
    vi.advanceTimersByTime(5000);
    expect(click).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2000);
    CaptchaT.createStrips();

    expect(click).toHaveBeenCalledTimes(2);
  });

  // Fail once per round and read the gap back off cooldownReloadRetryAt.
  it('doubles the backoff from 2s up to a 120s ceiling', () => {
    buildCaptcha();
    const seen: number[] = [];

    for (let i = 0; i < 8; i++) {
      CaptchaT.failCooldownReload();
      seen.push((CaptchaT.cooldownReloadRetryAt - Date.now()) / 1000);
    }

    expect(seen).toEqual([2, 4, 8, 16, 32, 64, 120, 120]);
  });

  it('holds the gate for the whole backoff, then reopens', () => {
    const { click } = buildCaptcha();

    // First failure: 2s.
    CaptchaT.createStrips();
    vi.advanceTimersByTime(5000);
    expect(CaptchaT.cooldownReloadFailures).toBe(1);

    vi.advanceTimersByTime(2000);
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(2);

    // Second failure: 4s, so 2s is no longer enough.
    vi.advanceTimersByTime(5000);
    expect(CaptchaT.cooldownReloadFailures).toBe(2);

    vi.advanceTimersByTime(2000);
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(2000);
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(3);
  });

  it('restarts the climb at 2s after a captcha loads', () => {
    const { tLoad } = buildCaptcha();

    // Climb to the third rung: 8s.
    for (let i = 0; i < 3; i++) { CaptchaT.failCooldownReload(); }
    expect((CaptchaT.cooldownReloadRetryAt - Date.now()) / 1000).toBe(8);

    // A click that does land a countdown clears the climb...
    CaptchaT.resetCooldownReload();
    CaptchaT.createStrips();
    tLoad.value = COUNTING_DOWN;
    vi.advanceTimersByTime(5000);
    expect(CaptchaT.cooldownReloadFailures).toBeUndefined();
    expect(CaptchaT.cooldownReloadRetryAt).toBeUndefined();

    // ...so the next failure is back to the first rung.
    CaptchaT.failCooldownReload();
    expect((CaptchaT.cooldownReloadRetryAt - Date.now()) / 1000).toBe(2);
  });

  it('backs off when the captcha reports an error for our own click', () => {
    const { click } = buildCaptcha();

    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);
    expect(CaptchaT.cooldownReloadTimer).toBeDefined();

    CaptchaT.failCooldownReload();

    expect(CaptchaT.cooldownReloadRetryAt).toBeGreaterThan(Date.now());
    expect(CaptchaT.cooldownReloadTimer).toBeUndefined();

    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('forgets earlier failures when a click does produce a countdown', () => {
    const { tLoad, click } = buildCaptcha();

    CaptchaT.createStrips();
    vi.advanceTimersByTime(5000);
    expect(CaptchaT.cooldownReloadFailures).toBe(1);

    vi.advanceTimersByTime(2000);
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(2);

    tLoad.value = COUNTING_DOWN;
    vi.advanceTimersByTime(5000);

    expect(CaptchaT.cooldownReloadFailures).toBeUndefined();
  });

  it('leaves load() unblocked after a failed click', () => {
    buildCaptcha();

    CaptchaT.createStrips();
    expect(CaptchaT.hasRequested).toBe(true);

    vi.advanceTimersByTime(5000);

    expect(CaptchaT.hasRequested).toBeUndefined();
  });

  it('cuts the backoff short once a captcha is solved', () => {
    const { root, click } = buildCaptcha();
    const resp = root.querySelector<HTMLInputElement>('#t-resp')!;

    CaptchaT.createStrips();
    vi.advanceTimersByTime(5000);
    expect(CaptchaT.cooldownReloadRetryAt).toBeGreaterThan(Date.now());

    // User loads and solves one by hand.
    resp.value = 'solved';
    CaptchaT.checkCompletion();
    expect(CaptchaT.isCompleted).toBe(true);
    expect(CaptchaT.cooldownReloadRetryAt).toBeUndefined();

    // That captcha gets consumed, then the button goes idle again.
    resp.value = '';
    CaptchaT.checkCompletion();
    CaptchaT.createStrips();

    expect(click).toHaveBeenCalledTimes(2);
  });

  it('setUsed clears the backoff', () => {
    buildCaptcha();

    CaptchaT.createStrips();
    vi.advanceTimersByTime(5000);
    expect(CaptchaT.cooldownReloadRetryAt).toBeGreaterThan(Date.now());

    CaptchaT.setUsed();

    expect(CaptchaT.cooldownReloadRetryAt).toBeUndefined();
    expect(CaptchaT.cooldownReloadFailures).toBeUndefined();
  });
});

describe('CaptchaT when 4chan requires no verification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn($, 'global').mockResolvedValue({});
    Conf['Auto-load captcha'] = false;
    Conf['Auto-load captcha after cooldown'] = true;
    Conf['Post on Captcha Completion'] = false;
    QRState.posts = [];
    QRState.nodes = null;
    QRState.cooldown = { auto: false };
    QRState.submit = vi.fn();
    CaptchaT.isEnabled = true;
    CaptchaT.nodes = {};
    CaptchaT.resetCooldownReload();
    CaptchaT.isCompleted = false;
    delete CaptchaT.hasRequested;
    delete CaptchaT.autoSubmittedFor;
    CaptchaT.shouldLoad = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // There is no captcha to fetch, so the click asks for nothing.
  it('does not click Get Captcha', () => {
    const { click } = buildExtCaptcha();

    CaptchaT.createStrips();

    expect(click).not.toHaveBeenCalled();
  });

  // The ratchet is the actual reported bug: every pointless click was scored a
  // failure, so the backoff climbed to its 120s ceiling and stayed there.
  it('does not ratchet the backoff', () => {
    buildExtCaptcha();

    for (let i = 0; i < 5; i++) {
      CaptchaT.createStrips();
      vi.advanceTimersByTime(5000);
    }

    expect(CaptchaT.cooldownReloadFailures).toBeUndefined();
    expect(CaptchaT.cooldownReloadRetryAt).toBeUndefined();
  });

  // A click already in flight when the state flips to noop: the service did
  // answer, so that is not a failure, but nothing loaded so load() must reopen.
  it('scores an in-flight click as answered, not failed', () => {
    const { root } = buildCaptcha();

    CaptchaT.createStrips();
    expect(CaptchaT.hasRequested).toBe(true);

    $('#t-task', root)!.textContent = 'Verification not required.';
    vi.advanceTimersByTime(5000);

    expect(CaptchaT.cooldownReloadFailures).toBeUndefined();
    expect(CaptchaT.cooldownReloadRetryAt).toBeUndefined();
    expect(CaptchaT.hasRequested).toBeUndefined();
  });

  // getOne() already treats this as a valid payload; checkCompletion did not.
  it('counts as a completed captcha', () => {
    buildExtCaptcha();

    CaptchaT.checkCompletion();

    expect(CaptchaT.isCompleted).toBe(true);
  });

  it('submits once when Post on Captcha Completion is on', () => {
    buildExtCaptcha();
    Conf['Post on Captcha Completion'] = true;

    CaptchaT.checkCompletion();
    CaptchaT.checkCompletion();

    expect(QRState.submit).toHaveBeenCalledTimes(1);
  });

  // setup() runs on every failed post and clears isCompleted. Without a guard
  // keyed to the payload, the poll would resubmit on the next tick and keep
  // resubmitting -- a post loop against 4chan.
  it('does not resubmit the same noop payload after a failed post', () => {
    buildExtCaptcha();
    Conf['Post on Captcha Completion'] = true;

    CaptchaT.checkCompletion();
    expect(QRState.submit).toHaveBeenCalledTimes(1);

    CaptchaT.setup(false);
    CaptchaT.checkCompletion();

    expect(QRState.submit).toHaveBeenCalledTimes(1);
  });

  // The status text can linger while a real challenge loads. Completing on the
  // text alone would auto-post an empty t-response and burn a posting error.
  it('waits for the noop sentinel, not just the status text', () => {
    const { root } = buildExtCaptcha();
    Conf['Post on Captcha Completion'] = true;
    root.querySelector<HTMLInputElement>('[name="t-challenge"]')!.value = 'real-challenge-id';

    CaptchaT.checkCompletion();

    expect(CaptchaT.isCompleted).toBe(false);
    expect(QRState.submit).not.toHaveBeenCalled();
  });

  it('submits again once the captcha is actually consumed', () => {
    buildExtCaptcha();
    Conf['Post on Captcha Completion'] = true;

    CaptchaT.checkCompletion();
    expect(QRState.submit).toHaveBeenCalledTimes(1);

    CaptchaT.setUsed();
    CaptchaT.checkCompletion();

    expect(QRState.submit).toHaveBeenCalledTimes(2);
  });
});
