# Auto-post typing guard and a captcha reload keybind

## Problem

`Post on Captcha Completion` submits the moment the captcha is answered. With
`Auto-load captcha after cooldown` also on, a challenge can complete on its own
while the user is still writing, and the post goes out mid-sentence.

Separately, there is no way to ask for a fresh captcha from the keyboard. The
only control is 4chan's own `Get Captcha` button.

## Design

### Typing guard

`CaptchaT` records when the user last touched the Quick Reply.

- A delegated `input` + `keydown` listener on `QRState.nodes.el` stamps
  `lastTypedAt`. Events originating inside `this.nodes.root` are ignored, so
  clicking or keying through the captcha widget is not "typing" — that is the
  action that completes the challenge, and counting it would delay every
  auto-post by the full window.
- Everything else in the QR counts: comment, name, options, subject, filename.

`checkCompletion()` is unchanged up to the point of submitting: it still sets
`isCompleted` and still cuts the auto-load backoff short. Only the
`autoSubmit(response)` call is gated.

The post is **deferred, not cancelled**. If the user typed within the window, a
single `setTimeout` is armed for the remaining time. On fire it re-reads
`getOne()` and re-runs the same gate, so continued typing defers again and an
answer that went stale in the meantime submits nothing. The existing
`autoSubmittedFor` payload key still bounds this to one submit per captcha, so a
deferral cannot double-post.

Per-post state, cleared in `setUsed()` and `destroy()` with the rest.

### Delay setting

`'Auto-post typing delay'` in `Config.main['Posting and Captchas']`, declared as
`[5, '<description>', 2]` — a sub-option of `Post on Captcha Completion`.
`0` disables the guard.

`Config.main` sections currently render checkboxes only, so
`Settings.addCheckboxes` gains numeric support: when a section entry's default is
a number, render `<input type="number">` instead of a checkbox, and load it
through `value` rather than `checked`. A new `$.cb.number` handler stores the
value as a Number so the stored type stays honest; read sites still coerce
defensively, because an imported settings file may carry a string.

This is the only shared-renderer change. It is preferred over hand-wiring the
input into the Advanced page, which is where numeric settings live today
(`Interval`), because a captcha knob belongs next to the captcha options.

### Keybind

`'Load new captcha': ['Alt+r', '...']` in `Config.hotkeys`, which makes it
rebindable from the Keybinds settings section like every other binding. `Alt+r`
is currently free.

Handled in `Keybinds.handleQR` beside `Submit QR`, active only while the QR is
open. It calls `CaptchaT.loadByHand()`, which clicks `#t-load` when that button
is enabled — the same path the auto-load uses, so 4chan's cooldown counter and
the per-post request budget both still apply. It is a no-op when the button is
disabled or the `t` captcha is not in use.

## Testing

Unit tests in `Captcha.t.test.ts`:

- typing inside the window defers the submit; the submit lands once the window
  elapses
- continued typing defers again rather than firing on the original deadline
- a delay of `0` submits immediately
- captcha-widget interaction does not count as typing
- a deferred submit still respects `autoSubmittedFor` (no double post)
- `loadByHand` clicks an enabled button and leaves a disabled one alone

## Out of scope

The guard does not touch manual submits, `Ctrl+Enter`, or the auto-load budget.
