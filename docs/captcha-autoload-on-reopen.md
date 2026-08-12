# Captcha auto-loads on the second QR open — issue #24

Reported: *"Keeps auto-loading captcha despite option being turned off."* First
reply click behaves ("Get Captcha", idle). Close the QR, click reply again, and
the widget arrives with a challenge already fetched — countdown running,
"Verification not required." on screen.

## Root cause

`QR.close()` [QR.ts:242](../src/Posting/QR.ts) built the replacement post
*before* tearing the captcha down:

```
QR.nodes.el.hidden = true;
...
new QR.post(true);           // <- constructor ends in QR.captcha.moreNeeded()
QR.posts.splice(0, QR.posts.length - 1);   // old post removed only here
...
QR.captcha.destroy();
```

The `Post` constructor pushes itself onto `QR.posts` and its last statement is
`QR.captcha.moreNeeded()` [QR.ts:1960](../src/Posting/QR.ts). For that one
moment `QR.posts` holds **both** the outgoing post and the new blank one, so
`moreNeeded`'s first condition — `QRState.posts.length > 1`
[Captcha.t.ts:83](../src/Posting/Captcha.t.ts) — reads the QR as a dump queue
that needs a challenge. It sets `shouldLoad = true` and calls `load()`, which at
that point still has `isInitialized` and `currentThread` from the session being
closed, and `hasRequested` false (the setting is off). The request goes out.

The v2 captcha already knew about this window — see the comment on
`Captcha.moreNeeded` [Captcha.ts:218](../src/Posting/Captcha.ts): *"Post count
temporarily off by 1 when called from QRState.post.rm, QRState.close, or
QRState.submit"*, which is why it defers through `$.queueTask`. `Captcha.t`
never carried that guard.

Two consequences, either of which alone reproduces the report:

1. The challenge is fetched at close time. `TCaptcha`'s cooldown lives in the
   page, not in our widget, so reopening renders the leftover countdown.
2. `shouldLoad` survives `destroy()` — it is cleared only by `load()`,
   `loadByHand()` and `setUsed()`. So even with (1) blocked, the next `setup()`
   inherits the flag and fires as soon as `setupTCaptcha` resolves.

Why the first open is clean: `QR.posts.length === 1` and the post is quotes-only,
so nothing ever sets `shouldLoad`.

## Fix

1. `QR.close()` calls `QR.captcha.destroy()` before `new QR.post(true)`. After
   destroy, `isInitialized` is gone, so the constructor's `moreNeeded()` cannot
   reach the network. (`updateThread` is not on the constructor/`select()` path,
   so nothing rebuilds the widget behind this.)
2. `CaptchaT.setup()` resets `shouldLoad = false` when it creates a fresh
   container, next to the existing `hasRequested` re-derivation. A new widget
   inherits no pending request; a real need is re-asserted by the next
   `moreNeeded()` (comment edit, file added, queued post).

**Neither half is redundant.** With fix 2 alone, `moreNeeded()` at close still
sees `isInitialized` and `currentThread` from the closing session with
`hasRequested` false, so the request goes out *at close time* and the cooldown is
already running before `setup()` gets to reset anything. With fix 1 alone,
`load()` early-returns but `shouldLoad` stays true and fires when
`setupTCaptcha` resolves on reopen. Don't delete either.

Checked before reordering: nothing between `destroy()` and the end of `close()`
rebuilds the widget. The constructor's path is `select()` → `lock()`/`load()` →
`showFileData()`/`characterCount()`, plus the async `QR.persona.get` callback
into the same `load()`; none call `captcha.setup()` or `updateThread()`. The
`QR.captcha.setup()` at [QR.ts:885](../src/Posting/QR.ts) is in `dialog()`,
which runs once. `QR.status()` reads `QR.nodes`, `QR.posts[0]`, `QR.req` and the
cooldown — no captcha state — so running it after the teardown is safe.

Deliberately not changed: `moreNeeded` stays synchronous. `$.queueTask`
deferral like v2's would also cover `post.rm()`, which has the same off-by-one
window, but that is a different symptom and worth its own change.

Tests: `Captcha.t.test.ts`, describe *"CaptchaT across a QR close and reopen"* —
one case asserting no `loadTCaptcha` survives close→reopen (fails without fix 2),
one asserting a genuinely needed captcha still loads. Full suite 121/121,
typecheck clean.
