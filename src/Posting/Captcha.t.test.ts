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
      <input type="button" id="t-load" value="${COUNTING_DOWN}">
      <div id="t-ctrl"><button id="t-next"></button></div>
      <div id="t-task"></div>
      <input id="t-resp">
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
    QRState.posts = [];
    QRState.nodes = null;
    CaptchaT.isEnabled = true;
    CaptchaT.nodes = {};
    CaptchaT.resetCooldownReload();
    delete CaptchaT.hasRequested;
    CaptchaT.shouldLoad = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clicks #t-load once the counter clears', () => {
    const { tLoad, click } = buildCaptcha();

    CaptchaT.createStrips();
    expect(click).not.toHaveBeenCalled();
    expect(CaptchaT.cooldownReloadPending).toBe(true);

    tLoad.value = IDLE;
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);

    // No repeat click on the next poll while the request is in flight.
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);
  });

  // The counter is only ever visible because a captcha was recently in play,
  // so an empty QR still gets a fresh one when the counter clears.
  it('clicks for an empty QR that would not lazy-load a captcha', () => {
    const { tLoad, click } = buildCaptcha();
    QRState.posts = [{ isOnlyQuotes: () => true, file: null }];

    CaptchaT.createStrips();
    tLoad.value = IDLE;
    CaptchaT.createStrips();

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('does not click without having seen a counter', () => {
    const { tLoad, click } = buildCaptcha();
    tLoad.value = IDLE;

    CaptchaT.createStrips();
    CaptchaT.createStrips();

    expect(click).not.toHaveBeenCalled();
  });

  it('waits for a real #t-load instead of treating a missing one as idle', () => {
    const { tLoad, click } = buildCaptcha();

    CaptchaT.createStrips();
    tLoad.remove();
    CaptchaT.createStrips();

    expect(click).not.toHaveBeenCalled();
    expect(CaptchaT.cooldownReloadPending).toBe(true);
  });

  it('stops reloading when a click yields no challenge and no new countdown', () => {
    const { tLoad, click } = buildCaptcha();

    CaptchaT.createStrips();
    tLoad.value = IDLE;
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(CaptchaT.cooldownReloadFailed).toBe(true);

    // A fresh countdown must not re-arm the reload after a failure.
    tLoad.value = COUNTING_DOWN;
    CaptchaT.createStrips();
    tLoad.value = IDLE;
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('keeps reloading when the click did produce a new countdown', () => {
    const { tLoad, click } = buildCaptcha();

    CaptchaT.createStrips();
    tLoad.value = IDLE;
    CaptchaT.createStrips();

    tLoad.value = COUNTING_DOWN;
    vi.advanceTimersByTime(5000);
    expect(CaptchaT.cooldownReloadFailed).toBeUndefined();

    CaptchaT.createStrips();
    tLoad.value = IDLE;
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(2);
  });

  it('does not click over an answered challenge', () => {
    const { root, tLoad, click } = buildCaptcha();

    CaptchaT.createStrips();
    root.querySelector<HTMLInputElement>('#t-resp')!.value = 'answer';
    tLoad.value = IDLE;
    CaptchaT.createStrips();

    expect(click).not.toHaveBeenCalled();
    expect(CaptchaT.cooldownReloadPending).toBeUndefined();
  });

  it('stops reloading when the captcha reports an error for our own click', () => {
    const { tLoad, click } = buildCaptcha();

    CaptchaT.createStrips();
    tLoad.value = IDLE;
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);

    // Arrives while our click is still in flight.
    expect(CaptchaT.cooldownReloadTimer).toBeDefined();
    CaptchaT.failCooldownReload();

    expect(CaptchaT.cooldownReloadFailed).toBe(true);
    expect(CaptchaT.cooldownReloadTimer).toBeUndefined();

    tLoad.value = COUNTING_DOWN;
    CaptchaT.createStrips();
    tLoad.value = IDLE;
    CaptchaT.createStrips();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('setUsed clears a pending reload and the failure latch', () => {
    const { tLoad } = buildCaptcha();
    CaptchaT.createStrips();
    tLoad.value = IDLE;
    CaptchaT.createStrips();
    vi.advanceTimersByTime(5000);
    expect(CaptchaT.cooldownReloadFailed).toBe(true);

    CaptchaT.setUsed();

    expect(CaptchaT.cooldownReloadFailed).toBeUndefined();
    expect(CaptchaT.cooldownReloadPending).toBeUndefined();
  });
});
