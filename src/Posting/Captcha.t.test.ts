import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Conf, g } from '../globals/globals';
import QRState from '../globals/QRState';
import $ from '../platform/$';
import CaptchaT from './Captcha.t';
import PageContextFunctions from '../PageContext/pageContext';

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
    delete CaptchaT.autoReloadsSincePost;
    delete CaptchaT.serverCooldownUntil;
    delete CaptchaT.answerExpiresAt;
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

  // The frame states its own cooldown; that beats both the button-label scrape
  // and the invented retry schedule.
  describe('server-stated cooldown', () => {
    it('does not click while the stated cooldown runs', () => {
      const { click } = buildCaptcha();

      CaptchaT.noteServerCooldown({ cd: 30 });
      CaptchaT.createStrips();
      expect(click).not.toHaveBeenCalled();

      vi.advanceTimersByTime(30 * 1000);
      CaptchaT.createStrips();
      expect(click).toHaveBeenCalledTimes(1);
    });

    it('retries on the stated time instead of the invented schedule', () => {
      buildCaptcha();

      CaptchaT.createStrips();
      CaptchaT.noteServerCooldown({ error: 'wait a while', cd: 15 });
      vi.advanceTimersByTime(5000);

      // 15s from the message, not the 30s first rung.
      expect((CaptchaT.cooldownReloadRetryAt - Date.now()) / 1000).toBe(10);
      // A stated cooldown is an answer, not a fault to escalate on.
      expect(CaptchaT.cooldownReloadFailures).toBeUndefined();
    });

    it('falls back to the invented schedule when nothing was stated', () => {
      buildCaptcha();

      CaptchaT.createStrips();
      vi.advanceTimersByTime(5000);

      expect(CaptchaT.cooldownReloadFailures).toBe(1);
      expect(CaptchaT.cooldownReloadRetryAt).toBeGreaterThan(Date.now());
    });

    it('caps an implausible value so it cannot strand the auto-load', () => {
      buildCaptcha();

      // e.g. a unit change to milliseconds.
      CaptchaT.noteServerCooldown({ cd: 30000 });

      expect((CaptchaT.serverCooldownUntil - Date.now()) / 1000).toBe(300);
    });

    it.each([
      ['a missing payload', undefined],
      ['no cd field', { error: 'nope' }],
      ['a string', { cd: '30' }],
      ['NaN', { cd: Number.NaN }],
      ['a negative', { cd: -5 }],
    ])('ignores %s', (_label, twister) => {
      buildCaptcha();

      CaptchaT.noteServerCooldown(twister);

      expect(CaptchaT.serverCooldownUntil).toBeUndefined();
    });
  });

  // A solved answer sits in #t-resp and nothing clears it on its own, so once
  // it is past the ttl the frame stated it protects a payload 4chan will reject.
  describe('expired answer', () => {
    const CHALLENGE = { challenge: 'abc.def', ttl: 120, cd: 30 };

    it('still protects an answer inside its ttl', () => {
      const { root, click } = buildCaptcha();
      root.querySelector<HTMLInputElement>('#t-resp')!.value = 'answer';

      CaptchaT.noteChallengeExpiry(CHALLENGE);
      vi.advanceTimersByTime(119 * 1000);
      CaptchaT.createStrips();

      expect(click).not.toHaveBeenCalled();
    });

    it('reloads over an answer once its ttl has passed', () => {
      const { root, click } = buildCaptcha();
      root.querySelector<HTMLInputElement>('#t-resp')!.value = 'answer';

      CaptchaT.noteChallengeExpiry(CHALLENGE);
      vi.advanceTimersByTime(120 * 1000);
      CaptchaT.createStrips();

      expect(click).toHaveBeenCalledTimes(1);
    });

    // isCompleted short-circuits hasAnswerInHand(), so it needs the same escape.
    it('reloads over a completed captcha once its ttl has passed', () => {
      const { click } = buildCaptcha();
      CaptchaT.isCompleted = true;

      CaptchaT.noteChallengeExpiry(CHALLENGE);
      vi.advanceTimersByTime(121 * 1000);
      CaptchaT.createStrips();

      expect(click).toHaveBeenCalledTimes(1);
    });

    // No message seen means unknown expiry, which must not read as expired.
    it('keeps protecting an answer when no ttl was ever stated', () => {
      const { root, click } = buildCaptcha();
      root.querySelector<HTMLInputElement>('#t-resp')!.value = 'answer';

      vi.advanceTimersByTime(10 * 60 * 1000);
      CaptchaT.createStrips();

      expect(click).not.toHaveBeenCalled();
    });

    it('does not expire a live challenge mid-solve', () => {
      const { root, click } = buildCaptcha();
      $('#t-task', root)!.style.backgroundImage = 'url("data:image/png;base64,x")';
      $('#t-next', root)!.textContent = 'Next (1/2)';

      CaptchaT.noteChallengeExpiry(CHALLENGE);
      vi.advanceTimersByTime(200 * 1000);
      CaptchaT.createStrips();

      expect(click).not.toHaveBeenCalled();
    });

    it('caps an implausible ttl', () => {
      buildCaptcha();

      CaptchaT.noteChallengeExpiry({ challenge: 'abc', ttl: 120000 });

      expect((CaptchaT.answerExpiresAt - Date.now()) / 1000).toBe(600);
    });

    it.each([
      ['a refusal carrying no challenge', { error: 'nope', cd: 15 }],
      ['a challenge with no ttl', { challenge: 'abc' }],
      ['a non-numeric ttl', { challenge: 'abc', ttl: '120' }],
      ['a zero ttl', { challenge: 'abc', ttl: 0 }],
      ['a negative ttl', { challenge: 'abc', ttl: -1 }],
    ])('ignores %s', (_label, twister) => {
      buildCaptcha();

      CaptchaT.noteChallengeExpiry(twister);

      expect(CaptchaT.answerExpiresAt).toBeUndefined();
    });

    it('is cleared once the captcha is consumed', () => {
      buildCaptcha();

      CaptchaT.noteChallengeExpiry(CHALLENGE);
      CaptchaT.setUsed();

      expect(CaptchaT.answerExpiresAt).toBeUndefined();
    });
  });

  // 4chan stops answering after too many challenges pulled in a row, and an
  // open QR with nothing being posted would keep pulling them until it hit that.
  describe('auto-load budget between posts', () => {
    const clickThrough = (times: number) => {
      for (let i = 0; i < times; i++) {
        CaptchaT.createStrips();
        vi.advanceTimersByTime(5000);
        vi.advanceTimersByTime(4 * 30 * 1000);
      }
    };

    it('stops auto-clicking after three loads with no post', () => {
      const { click } = buildCaptcha();

      clickThrough(5);

      expect(click).toHaveBeenCalledTimes(3);
    });

    it('leaves the button alone for a manual click once the budget is spent', () => {
      const { tLoad, click } = buildCaptcha();

      clickThrough(4);
      expect(click).toHaveBeenCalledTimes(3);
      expect(tLoad.disabled).toBe(false);
    });

    it('earns the budget back once a captcha is consumed by a post', () => {
      const { click } = buildCaptcha();

      clickThrough(4);
      expect(click).toHaveBeenCalledTimes(3);

      CaptchaT.setUsed();
      clickThrough(1);

      expect(click).toHaveBeenCalledTimes(4);
    });

    it('does not spend the budget on a state that never clicks', () => {
      buildExtCaptcha();

      clickThrough(5);

      expect(CaptchaT.autoReloadsSincePost).toBeUndefined();
    });
  });

  // A click that gets no answer leaves 4chan's own button disabled on
  // 'Loading' with nothing left to re-enable it -- not even a manual click.
  it('hands #t-load back to the user when a click gets no answer', () => {
    buildCaptcha();

    CaptchaT.createStrips();
    vi.advanceTimersByTime(5000);

    expect($.global).toHaveBeenCalledWith('unlockStuckTCaptchaReload');
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

// A captcha can complete on its own while the user is still writing, and
// 'Post on Captcha Completion' would send the half-written comment.
describe('CaptchaT auto-post typing delay', () => {
  let outside: HTMLTextAreaElement;

  const type = () => CaptchaT.noteTyping({ target: outside });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn($, 'global').mockResolvedValue({});
    Conf['Auto-load captcha after cooldown'] = false;
    Conf['Post on Captcha Completion'] = true;
    Conf['Auto-post typing delay'] = 5;
    QRState.posts = [];
    QRState.nodes = null;
    QRState.cooldown = { auto: false };
    QRState.submit = vi.fn();
    CaptchaT.isEnabled = true;
    CaptchaT.nodes = {};
    CaptchaT.isCompleted = false;
    delete CaptchaT.autoSubmittedFor;
    delete CaptchaT.lastTypedAt;
    CaptchaT.clearAutoSubmitTimer();
    outside = document.createElement('textarea');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('holds the post while the user is typing', () => {
    buildExtCaptcha();

    type();
    CaptchaT.checkCompletion();

    expect(QRState.submit).not.toHaveBeenCalled();
  });

  it('posts once the typing pause elapses', () => {
    buildExtCaptcha();

    type();
    CaptchaT.checkCompletion();
    vi.advanceTimersByTime(5000);

    expect(QRState.submit).toHaveBeenCalledTimes(1);
  });

  // The deadline moves with the last keystroke; it is not fixed when the
  // captcha completed.
  it('defers again when the user keeps typing', () => {
    buildExtCaptcha();

    type();
    CaptchaT.checkCompletion();

    vi.advanceTimersByTime(4000);
    type();
    vi.advanceTimersByTime(4000);
    expect(QRState.submit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(QRState.submit).toHaveBeenCalledTimes(1);
  });

  it('posts immediately when the delay is zero', () => {
    buildExtCaptcha();
    Conf['Auto-post typing delay'] = 0;

    type();
    CaptchaT.checkCompletion();

    expect(QRState.submit).toHaveBeenCalledTimes(1);
  });

  it('posts immediately when nothing was typed', () => {
    buildExtCaptcha();

    CaptchaT.checkCompletion();

    expect(QRState.submit).toHaveBeenCalledTimes(1);
  });

  // Solving the captcha is what completes it; counting those clicks would
  // delay every single auto-post by the full window.
  it('does not count captcha interaction as typing', () => {
    const { container } = buildExtCaptcha();

    CaptchaT.noteTyping({ target: container });

    expect(CaptchaT.lastTypedAt).toBeUndefined();
  });

  // A deferral must not become a second post: the payload guard still applies.
  it('still posts a given payload only once', () => {
    buildExtCaptcha();

    type();
    CaptchaT.checkCompletion();
    vi.advanceTimersByTime(5000);
    expect(QRState.submit).toHaveBeenCalledTimes(1);

    CaptchaT.isCompleted = false;
    CaptchaT.checkCompletion();
    vi.advanceTimersByTime(5000);

    expect(QRState.submit).toHaveBeenCalledTimes(1);
  });

  // The answer can be consumed or cleared while we wait.
  it('does not post when the answer is gone by the time the wait ends', () => {
    const { root } = buildExtCaptcha();

    type();
    CaptchaT.checkCompletion();
    root.querySelector<HTMLInputElement>('[name="t-challenge"]')!.value = '';
    vi.advanceTimersByTime(5000);

    expect(QRState.submit).not.toHaveBeenCalled();
  });

  it('drops a pending post when the captcha is consumed', () => {
    buildExtCaptcha();

    type();
    CaptchaT.checkCompletion();
    CaptchaT.setUsed();
    vi.advanceTimersByTime(5000);

    expect(QRState.submit).not.toHaveBeenCalled();
  });
});

describe('CaptchaT.loadByHand', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn($, 'global').mockResolvedValue({});
    CaptchaT.isEnabled = true;
    CaptchaT.nodes = {};
    CaptchaT.resetCooldownReload();
    delete CaptchaT.hasRequested;
    delete CaptchaT.autoReloadsSincePost;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clicks an enabled Get Captcha', () => {
    const { click } = buildExtCaptcha();

    expect(CaptchaT.loadByHand()).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
  });

  // A running countdown disables the button; that is 4chan refusing on purpose.
  it('leaves a disabled button alone', () => {
    const { tLoad, click } = buildExtCaptcha();
    tLoad.disabled = true;

    expect(CaptchaT.loadByHand()).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });

  it('does nothing without a captcha in the QR', () => {
    CaptchaT.nodes = {};

    expect(CaptchaT.loadByHand()).toBe(false);
  });

  // Asking by hand is not the poll spending its allowance.
  it('does not spend the auto-load budget', () => {
    buildExtCaptcha();

    CaptchaT.loadByHand();

    expect(CaptchaT.autoReloadsSincePost).toBeUndefined();
  });
});

// load() (the initial page-open request) and a manual mouse click on #t-load
// both lock the button the same way a failed auto-reload click does, but
// neither goes through watchCooldownReload -- so they never got unstuck.
describe('CaptchaT.watchStuckLoad', () => {
  beforeEach(() => {
    vi.spyOn($, 'global').mockResolvedValue({});
    CaptchaT.isEnabled = true;
    CaptchaT.nodes = {};
    delete CaptchaT.hasRequested;
    delete CaptchaT.stuckLoadTicks;
  });

  const stick = (container: HTMLElement) => {
    const tLoad = container.querySelector<HTMLInputElement>('#t-load')!;
    tLoad.disabled = true;
    tLoad.value = 'Loading';
    return tLoad;
  };

  it('hands the button back once it dwells on Loading for ~5s of polling', () => {
    const { container } = buildCaptcha();
    stick(container);

    for (let i = 0; i < 9; i++) CaptchaT.watchStuckLoad();
    expect($.global).not.toHaveBeenCalledWith('unlockStuckTCaptchaReload');

    CaptchaT.watchStuckLoad();
    expect($.global).toHaveBeenCalledWith('unlockStuckTCaptchaReload');
  });

  it('resets the dwell count once the button leaves Loading', () => {
    const { container } = buildCaptcha();
    const tLoad = stick(container);

    for (let i = 0; i < 9; i++) CaptchaT.watchStuckLoad();
    tLoad.disabled = false;
    tLoad.value = IDLE;
    CaptchaT.watchStuckLoad();
    tLoad.disabled = true;
    tLoad.value = 'Loading';
    for (let i = 0; i < 9; i++) CaptchaT.watchStuckLoad();

    expect($.global).not.toHaveBeenCalledWith('unlockStuckTCaptchaReload');
  });

  it('clears hasRequested so a fresh load is not blocked forever', () => {
    const { container } = buildCaptcha();
    stick(container);
    CaptchaT.hasRequested = true;

    for (let i = 0; i < 10; i++) CaptchaT.watchStuckLoad();

    expect(CaptchaT.hasRequested).toBeUndefined();
  });

  it('leaves an enabled button alone', () => {
    buildCaptcha();

    for (let i = 0; i < 10; i++) CaptchaT.watchStuckLoad();

    expect($.global).not.toHaveBeenCalledWith('unlockStuckTCaptchaReload');
  });
});

describe('unlockStuckTCaptchaReload', () => {
  const build = (text: string, disabled: boolean) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.disabled = disabled;
    const unlockReloadBtn = vi.fn(() => { button.disabled = false; button.textContent = 'Get Captcha'; });
    (window as any).TCaptcha = { reloadNode: button, unlockReloadBtn };
    return { button, unlockReloadBtn };
  };

  afterEach(() => { delete (window as any).TCaptcha; });

  it('re-enables a button stuck on Loading', () => {
    const { unlockReloadBtn } = build('Loading', true);

    PageContextFunctions.unlockStuckTCaptchaReload();

    expect(unlockReloadBtn).toHaveBeenCalledTimes(1);
  });

  it('leaves a running cooldown alone', () => {
    const { unlockReloadBtn } = build(COUNTING_DOWN, true);

    PageContextFunctions.unlockStuckTCaptchaReload();

    expect(unlockReloadBtn).not.toHaveBeenCalled();
  });

  it('leaves an already-enabled button alone', () => {
    const { unlockReloadBtn } = build(IDLE, false);

    PageContextFunctions.unlockStuckTCaptchaReload();

    expect(unlockReloadBtn).not.toHaveBeenCalled();
  });

  it('does nothing when TCaptcha is not on the page', () => {
    delete (window as any).TCaptcha;

    expect(() => PageContextFunctions.unlockStuckTCaptchaReload()).not.toThrow();
  });

  // A renamed or missing method on 4chan's side must not throw and re-strand
  // the button; it just means this recovery can't help this time.
  it('does not throw when unlockReloadBtn is missing', () => {
    const button = document.createElement('button');
    button.textContent = 'Loading';
    button.disabled = true;
    (window as any).TCaptcha = { reloadNode: button };

    expect(() => PageContextFunctions.unlockStuckTCaptchaReload()).not.toThrow();
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
    delete CaptchaT.autoReloadsSincePost;
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

  it('does not auto-submit when post contains only quotes and no file', () => {
    buildExtCaptcha();
    Conf['Post on Captcha Completion'] = true;
    const post = {
      isOnlyQuotes: () => true,
      file: null,
    };
    QRState.posts = [post];

    CaptchaT.checkCompletion();

    expect(CaptchaT.isCompleted).toBe(true);
    expect(QRState.submit).not.toHaveBeenCalled();
  });

  it('auto-submits when post contains text in addition to quotes', () => {
    buildExtCaptcha();
    Conf['Post on Captcha Completion'] = true;
    const post = {
      isOnlyQuotes: () => false,
      file: null,
    };
    QRState.posts = [post];

    CaptchaT.checkCompletion();

    expect(CaptchaT.isCompleted).toBe(true);
    expect(QRState.submit).toHaveBeenCalledTimes(1);
  });
});

// Reported as issue #24: with 'Auto-load captcha' off, the first QR open asks
// for nothing, but closing it and opening it again arrives with a challenge
// already fetched and its cooldown running.
describe('CaptchaT across a QR close and reopen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn($, 'global').mockResolvedValue({});
    Conf['Auto-load captcha'] = false;
    QRState.posts = [{ thread: 123, isOnlyQuotes: () => true, file: null }];
    QRState.nodes = null;
    (g as any).BOARD = { ID: 'g' };
    CaptchaT.isEnabled = true;
    CaptchaT.nodes = { root: document.createElement('div') };
    delete CaptchaT.hasRequested;
    delete CaptchaT.isInitialized;
    CaptchaT.shouldLoad = false;
  });

  afterEach(() => {
    CaptchaT.destroy();
    vi.useRealTimers();
  });

  const open = async () => {
    CaptchaT.setup();
    await vi.advanceTimersByTimeAsync(0);
  };

  // shouldLoad outlives destroy(), and QR.close() raises it: the replacement
  // post's constructor calls moreNeeded() while QR.posts still holds the old
  // post too, so the count reads as a queue that needs a challenge.
  it('does not inherit a pending load raised while closing', async () => {
    await open();
    CaptchaT.shouldLoad = true;
    CaptchaT.destroy();

    await open();

    expect(CaptchaT.shouldLoad).toBe(false);
    expect($.global).not.toHaveBeenCalledWith('loadTCaptcha', expect.anything());
  });

  // The reset is about stale state only -- a real need still loads.
  it('still loads once the reopened post needs a captcha', async () => {
    await open();

    QRState.posts = [{ thread: 123, isOnlyQuotes: () => false, file: null }];
    CaptchaT.moreNeeded();

    expect($.global).toHaveBeenCalledWith('loadTCaptcha', expect.anything());
  });
});
