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

    vi.advanceTimersByTime(30000);
    CaptchaT.createStrips();

    expect(click).toHaveBeenCalledTimes(2);
  });

  it('lengthens the backoff on repeated failures', () => {
    const { click } = buildCaptcha();

    CaptchaT.createStrips();
    vi.advanceTimersByTime(5000);
    vi.advanceTimersByTime(30000);
    CaptchaT.createStrips();
    vi.advanceTimersByTime(5000);
    expect(CaptchaT.cooldownReloadFailures).toBe(2);

    // 30s was enough the first time, not the second.
    vi.advanceTimersByTime(30000);
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(30000);
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(3);
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

    vi.advanceTimersByTime(30000);
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
