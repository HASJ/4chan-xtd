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

**4chan serves the challenge inside `#t-frame` (`?ext=1`). The parent-side module
still reads the pre-iframe DOM.** In `ext` mode the parent's `#t-task`,
`#t-slider` and `#t-resp` are inert leftovers — status text, a disabled slider,
an empty hidden input — and `t-challenge` is the sentinel `noop`.

Everything downstream is computed from those inert nodes:

| Site | Reads | Value in `ext` mode | Consequence |
|---|---|---|---|
| `detectChallengeState` [Captcha.t.ts:245](../src/Posting/Captcha.t.ts) | `#t-task` background, `#t-next` text | no bg, `"Next"` | `isChallenge` permanently false |
| `watchCooldownReload` [Captcha.t.ts:317](../src/Posting/Captcha.t.ts) | same state, 5s after a click | none of challenge/step/cooldown | **every click scored a failure** |
| `checkCompletion` [Captcha.t.ts:677](../src/Posting/Captcha.t.ts) | `#t-resp` value | always `""` | never completes, never auto-posts |
| `load` [Captcha.t.ts:73](../src/Posting/Captcha.t.ts) | `slider.hasAttribute('max')` | always `max="3"` | permanently returns early |

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

**Risk on (5):** if 4chan ever serves a challenge *only* through the iframe, that
rule hides it. `is-challenge` is safe by construction — it is only set when the
parent's own `#t-task` carries the puzzle — but a pure-`ext` challenge would land
in `captcha-idle`. If the captcha ever renders blank, that rule is the first
suspect, and the deferred `ext` work is the real answer.

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
