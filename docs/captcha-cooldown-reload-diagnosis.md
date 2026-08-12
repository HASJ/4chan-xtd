# Captcha auto-load after cooldown — diagnosis

Branch: `feat/captcha-auto-load-after-cooldown`

## Symptoms

1. Auto-load stops clicking *Get Captcha* even though the counter has cleared.
2. At the same time, *Post on Captcha Completion* stops firing.
3. Only a page reload recovers.
4. A white rectangle sits inside the QR and never goes away.

## Ground truth

DOM captured from a live `/gif/` QR while all four symptoms were present:

```html
<div class="captcha-root captcha-status">
  <div style="width:300px; height:145px; background-color:rgb(238,238,238); overflow:hidden">
    <div id="t-ctrl">
      <button id="t-load">Get Captcha</button>
      <button id="t-next" disabled>Next</button>
    </div>
    <iframe id="t-frame" style="width:100%; height:80px"
            src="https://sys.4chan.org/captcha?ext=1&board=gif&thread_id=30970808"></iframe>
    <div id="t-task">Verification not required.</div>
    <input id="t-slider" type="range" min="0" max="3" disabled>
    <input name="t-challenge" type="hidden" value="noop">
    <input id="t-resp" name="t-response" type="hidden" value="">
  </div>
</div>
```

Measured: root 300x213, first child forced to `min-height:170px` by the
`captcha-status` rule, `#t-frame` 80px, `#t-task` 80px, 0 strips, no custom UI.

## Root cause

**4chan parks on a `noop` challenge — "Verification not required." — and nothing
accounted for that state.** Its parent-side nodes are inert leftovers: status
text, a disabled slider that keeps its `max`, an empty hidden response, and
`t-challenge` set to the sentinel `noop`.

Everything downstream is computed from those inert nodes:

| Site | Reads | Value in `noop` state | Consequence |
|---|---|---|---|
| `detectChallengeState` [Captcha.t.ts:245](../src/Posting/Captcha.t.ts) | `#t-task` background, `#t-next` text | no bg, `"Next"` | `isChallenge` false |
| `watchCooldownReload` [Captcha.t.ts:317](../src/Posting/Captcha.t.ts) | same state, 5s after a click | none of challenge/step/cooldown | **every click scored a failure** |
| `checkCompletion` [Captcha.t.ts:677](../src/Posting/Captcha.t.ts) | `#t-resp` value | always `""` | never completes, never auto-posts |
| `load` [Captcha.t.ts:73](../src/Posting/Captcha.t.ts) | `slider.hasAttribute('max')` | always `max="3"` | permanently returns early |

> **Correction.** This section originally claimed 4chan had moved the challenge
> inside `#t-frame` and that the parent nodes were inert *in general*. That was
> wrong — see "How `ext=1` actually works" below. The nodes are inert only in the
> `noop` state, which is what the capture happened to catch. The fixes are
> unaffected: they target the `noop` state, which is real.

### Why it looks like "stops after a post isn't sent"

`watchCooldownReload` only accepts `isChallenge || hasActiveChallengeStep ||
isOnCooldown` as proof a click worked. "Verification not required" is none of
those, so each auto-click is scored a failure and `failCooldownReload` ratchets
the backoff 30s → 60s → 90s → 120s and re-arms on every retry. The feature never
latches off, it just goes quiet for two minutes at a time, forever. Reload is the
only escape because `setup()` re-inits against a fresh challenge.

The auto-post dies from the same state, independently: `t-response` stays empty
in `noop` mode, so `checkCompletion` returns at its first guard and the
false→true edge that triggers `QRState.submit()` never happens.

One gate, two symptoms — as reported.

## How `ext=1` actually works

Captured from the parent tab across a full load → solve → post cycle.

`#t-frame` is a **courier, not a UI surface**. It loads, posts the challenge up
to the parent, and unloads. The whole challenge is in the message, sent from
`sys.<domain>.org`:

```json
{"twister":{"challenge":"KBaac22…","ttl":120,"cd":30,
            "tasks":[{"str":"…not like the others…",
                      "items":["<base64 png>","<base64 png>","<base64 png>"]}]}}
```

4chan's own TCaptcha in the parent consumes that and renders it into the
parent's `#t-task` / `#t-slider` / `#t-resp` — the same nodes this codebase
already reads. Observed transitions, with the frame hidden by our own CSS the
whole time:

```
+0.4s   is-challenge  taskBg=yes  strips=3  resp=empty   frameH=0
+21.9s  <twister challenge payload arrives from sys.4chan.org>
+31.4s  is-challenge  task="Done."          resp=len=1   frameH=0
+32.2s  captcha-root  taskBg=no   strips=0  resp=empty   frameH=absent
```

Two consequences:

1. **The `#t-frame` risk noted below is retired.** `frameH: 0` is our CSS hiding
   it, and the challenge loaded, rendered, was solved and posted regardless.
   Hiding it is correct; no gating is needed.
2. **`cd` and `ttl` are authoritative.** `cd` is the exact cooldown before *Get
   Captcha* works again; `ttl` is the answer's lifetime.

   `cd` is now consumed — `noteServerCooldown()` records it and both
   `updateCooldownReload()` and `failCooldownReload()` defer to it, so the retry
   time comes from the service that enforces it rather than from an invented
   schedule. The button-label scrape (`/\(\d+\)/`) stays as the render-time
   signal; the two agree, and it still works if no message was seen.

   `ttl` is now consumed too. `updateCooldownReload()` protects an answer in
   hand because clicking would strand *Post on Captcha Completion* with nothing
   to send — but a solved answer sits in `#t-resp` and nothing clears it on its
   own, so past its `ttl` it protected a payload 4chan would reject and blocked
   the reload behind it. `noteChallengeExpiry()` records the deadline and the
   guard now stands down once it passes.

   Deliberately narrow: only the *answer* guard yields to expiry, not the live
   challenge guard. An expired unsolved puzzle resolves itself — 4chan drops the
   task background, `isChallenge` goes false, and the normal idle path takes
   over — whereas wiping a challenge the user is mid-solve on would be a visible
   regression. Unknown expiry never reads as expired, so with no message seen
   the previous behaviour stands.

The frame→parent direction of this channel is live and is what 4chan itself
uses. The `{type:'select-strip'}` listener in `setupIframe()` is the *other*
direction and has no sender.

## White rectangle

`#t-frame` is the 4chan captcha iframe. **The repo contains zero references to
it** — no CSS rule in any of `captcha-idle`, `captcha-status` or `is-challenge`
hides, sizes or themes it, and no TS touches it. It renders as an unstyled 80px
white block, cross-origin so `themed-captcha` cannot reach inside it.

`captcha-status` additionally forces `min-height:170px` on the container
([style.css:1594](../src/css/style.css)), which is what stretches the QR to 213px.

Note the iframe *interior* is already handled: `sys.4chan.org/captcha` is in the
userscript includes, `all_frames: true` is set for the extension, and
`initSysCaptcha` → `Captcha.t.setupIframe()` transforms it from within. Only the
parent's view of the iframe was never accounted for.

## Prior fix attempts on this branch

```
60b9d65 click Get Captcha when the cooldown counter clears
25ae3c8 auto-click after cooldown regardless of lazy-load state
7c46e32 resume the cooldown reload once a captcha is solved
460e91c make the auto-load stateless and put it behind a setting
a190c93 back off the auto-load instead of latching it off
```

Four consecutive fixes, each removing one latch, none of which could work: the
state being latched on was read from nodes that no longer carry the challenge.

## Fix applied

Targeted pass. Full `ext` delegation is deferred until a probe capture exists of
a real challenge in `ext` mode.

1. `updateCooldownReload` returns early on `state.verificationNotRequired`. It
   previously ran one line *before* that check, so it clicked when no captcha
   was on offer. Stops the pointless request and the ratchet that followed it.
2. `watchCooldownReload` scores `verificationNotRequired` as answered rather
   than failed, and clears `hasRequested` so `load()` is not left blocked. Covers
   a click already in flight when the state flips.
3. `checkCompletion` now defers to `getOne()` on what counts as a usable payload
   instead of reading `t-response` directly, so a `noop` challenge completes and
   triggers *Post on Captcha Completion*. It keys off the `t-challenge === 'noop'`
   sentinel rather than the "Verification not required." text — the message can
   linger while a real challenge loads, and completing there would auto-post an
   empty `t-response` and burn a posting error.
4. New `autoSubmit()` keys the submit to `t-challenge:t-response`. `setup()`
   clears `isCompleted` on every failed post, so the false→true edge alone does
   not bound the auto-post — with a `noop` payload, which never changes, the
   poll would otherwise resubmit every 500ms. Cleared by `setUsed`/`destroy`.
5. CSS collapses `#t-frame` under `is-challenge`, `captcha-idle` and
   `captcha-status`, and drops the now-surplus `min-height:170px` on
   `captcha-status` (that height existed to sit alongside the iframe).
6. CSS hides `#t-slider` under `captcha-status`. Same class of gap as `#t-frame`:
   `captcha-idle` and `is-challenge` both hide the slider, but `captcha-status`
   only ever *showed* elements, so the slider kept 4chan's inline
   `display: block` and painted an inert disabled track under the message.

**~~Risk on (5)~~ — retired.** This originally warned that hiding `#t-frame`
could hide a challenge served only through the iframe. The capture above shows
the frame never renders a challenge at all; it couriers the payload to the parent
and unloads. A full solve-and-post cycle ran with `frameH: 0`. No gating needed.

Tests: `src/Posting/Captcha.t.test.ts`, suite *"CaptchaT when 4chan requires no
verification"* (8 cases). Full suite 52/52, typecheck clean.

## Open: is the ratchet actually the reported symptom 1?

`failCooldownReload` caps failures at 4, so the backoff ceiling is 120s and it
re-arms on every retry. **That self-heals every two minutes** — which does not
match "the only way to get it working again is by refreshing the page." The
ratchet is real and worth fixing, but it may not be the whole of symptom 1.

The reading that keeps the diagnosis intact: in `noop` mode no captcha is needed,
so "it isn't loading a captcha" is correct behaviour rather than a defect, and
the real user-facing failure is "and then my post never goes out" — which fixes
3 and 4 address. Under that reading symptom 1 is not fixed, it is reclassified.

**Discriminator, one capture:** run the probe while the feature is considered
*working* — real puzzle on screen, auto-load having clicked after the counter
cleared. If `#t-task` reads "Verification not required." in that state too, the
`noop` theory is dead and the parent-DOM diagnosis needs revisiting. If it does
not, `noop` is specific to the broken condition and this direction holds.

**Field result:** all four symptoms reported fixed against the built userscript,
including a manual Get Captcha check (so the `#t-frame` rule is not hiding a live
challenge on this account). The reclassification is what shipped — in `noop`
state the counter runs and nothing is fetched, which is correct. The
discriminator capture was never taken, so the theory is confirmed by behaviour
rather than by DOM evidence; revisit it if symptom 1 returns.

## Recurrence: symptom 1 returned (2026-08-08)

`#t-load` reported stuck on "Loading" again, in the QR, on a fresh thread.

`41067c971` (`fix(captcha): recover #t-load when a click gets no answer`,
2026-07-31) added `unlockStuckTCaptchaReload`, but only wired it into paths that
run *after our own click*: `watchCooldownReload` (armed by
`updateCooldownReload`'s auto-click and by `loadByHand()`, the keybind) and the
`TCaptchaError` listener (gated on `this.cooldownReloadTimer`, i.e. also only
live after our own click).

Two other paths lock the same button the same way and had no watchdog at all:

1. **The initial page-open request.** `load()` [Captcha.t.ts:93](../src/Posting/Captcha.t.ts)
   calls `$.global('loadTCaptcha', ...)`, which calls `TCaptcha.load()`
   directly — not a button click — but 4chan still disables `#t-load` and
   relabels it "Loading" while that request is outstanding. If it never
   answers, `hasRequested` stays `true` forever (nothing clears it outside
   `destroy()`/`setUsed()`/the click-watchdog's noop branch) and `load()`
   keeps returning early on line 95.
2. **A manual mouse click on `#t-load`.** 4chan's own click handler, not
   `loadByHand()`. `updateCooldownReload` even skips a disabled button
   (`state.tLoad.disabled` guard, line 420), so once this locks, the
   auto-reload path can't click either — nothing schedules a watchdog, ever.

Given the `MAX_AUTO_RELOADS_PER_POST` budget exists specifically to hand the
button back to the user by hand once spent (see the comment at
[Captcha.t.ts:12-18](../src/Posting/Captcha.t.ts)), a manual click is the more
likely trigger of this report than the initial load.

### Fix applied

Rather than arming a watchdog at every call site (the prior doc's own
post-mortem: "four consecutive fixes, each removing one latch, none of which
could work"), added one dwell check to the 500ms poll that already runs in
`setup()`: `watchStuckLoad()` [Captcha.t.ts](../src/Posting/Captcha.t.ts)
counts consecutive ticks where `#t-load` is disabled and reads exactly
`'Loading'`; at ~5s it clears `hasRequested` and calls
`unlockStuckTCaptchaReload`, same as the click-watchdog path. Covers all three
triggers (initial load, manual click, failed auto-click) from one place.
Deliberately does not touch the auto-reload backoff/retry-at state — this is a
separate lock-detector, not a rewrite of `watchCooldownReload`.

Also hardened `unlockStuckTCaptchaReload` in
[pageContext.ts](../src/PageContext/pageContext.ts) with a
`typeof tCaptcha.unlockReloadBtn !== 'function'` guard: if 4chan renamed or
removed the method, this now no-ops instead of throwing.

Tests: `Captcha.t.test.ts`, describe *"CaptchaT.watchStuckLoad"* (4 cases) and
one added case under *"unlockStuckTCaptchaReload"*. Full suite 119/119,
typecheck clean.

### Open: `unlockStuckTCaptchaReload` itself is still unverified against real DOM

Both the label match (`(button.textContent || button.value) !== 'Loading'`,
strict equality against a third-party string) and `reloadNode`/`unlockReloadBtn`
existing at all are assumptions from reading 4chan's minified JS, never
confirmed against a live capture. If either is wrong, this fix (and the
2026-07-31 one) silently no-op — the poll counts to 10 and calls a function
that does nothing. The discriminator this doc asked for after the first fix
was never taken; it's needed now more than before. One-liner for the browser
console on a stuck tab:

```js
const b=document.querySelector('#qr #t-load');console.log(JSON.stringify({tag:b?.tagName,text:b?.textContent,value:b?.value,disabled:b?.disabled,isReloadNode:window.TCaptcha?.reloadNode===b,unlock:typeof window.TCaptcha?.unlockReloadBtn}))
```
