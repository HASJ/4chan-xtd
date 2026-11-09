# CAPTCHA exemption research

Checked 2026-10-27 against public site assets and checkout `8438f64d1`.

## Result

No working, permanent, free CAPTCHA bypass was verified. The public client
accepts a server-granted exemption, but exposes no switch that grants one.
This is a source-inspection result, not proof that bypasses cannot exist.

## What the current site does

The [live board](https://boards.4chan.org/g/) referenced these assets:

- [tcaptcha.min.7.js](https://s.4cdn.org/js/tcaptcha.min.7.js)
- [core.min.1128.js](https://s.4cdn.org/js/core.min.1128.js)
- [extension.min.1191.js](https://s.4cdn.org/js/extension.min.1191.js)

Downloaded CAPTCHA script SHA256:
`D38F23084BA30C5D48669F6E8F30E9FF13EC0541E01DC5CC87E74DDF4612401E`.

In the CAPTCHA script:

- `getTicket()` reads `4chan-tc-ticket` from localStorage. `saveTicket()` stores
  a server-provided ticket or removes it when the response says `ticket: false`.
- `load()` sends the stored ticket with board/thread context to `/captcha`.
  The effective override adds `ext=1`; it still processes the server response.
- `buildFromJson()` separates a waiting period (`pcd`), hCaptcha (`mpcd`),
  errors, and normal challenges.
- `setChallenge()` copies the server's challenge identifier. When the response
  has no `tasks`, it calls `setNoop()`, which renders "Verification not required."
- The code does not reveal the server's exemption criteria or ticket-validation
  rules. Ticket persistence alone is not proof of CAPTCHA exemption.

The core script's `initPass()` derives a UI flag from cookies. The native
extension handles server-side Pass errors by restoring the CAPTCHA widget in
`QR.onPassError()`. Consequently, hiding the widget or changing its UI flag is
not evidence of a usable posting exemption. No forged-cookie or forged-`noop`
posting experiment was performed.

## What 4chan-xtd already does

- `src/PageContext/pageContext.ts:setupTCaptcha` and `loadTCaptcha` delegate
  requests to the site's `TCaptcha`; its ticket handling remains in effect.
- `src/Posting/Captcha.t.ts:getOne` reads the challenge/answer fields, and
  `checkCompletion` recognizes a `noop` challenge for automatic submission.
- `src/Posting/QR.ts:sendPost` forwards those fields to the site's posting
  endpoint. Local completion does not establish server acceptance.
- The `_ct` shortcut in `acquireCaptcha` is explicitly limited to legacy
  reCAPTCHA replies. It is not a demonstrated bypass for current TCaptcha.

No product code was changed because no missing, supported exemption path was
established.

## Official alternatives and documentation limits

The [FAQ](https://4chan.org/faq) describes email verification as bypassing the
initial 15-minute wait and some other filters/blocks. It does not promise
CAPTCHA-free posting through email verification. Its CAPTCHA section names
4chan Pass as the way to post and report without entering a CAPTCHA.

The [Pass page](https://4chan.org/pass) explicitly offers CAPTCHA bypass and says
post timers still apply, with reduced cooldowns. Its wording is inconsistent:
some passages describe CAPTCHA bypass as the only privilege, while others also
list reduced cooldowns and IP-range/country-block exemptions. No documentation
found promises a CAPTCHA-only option with otherwise identical normal timers.

## Verification limits and next useful check

The public HTML and all three public scripts were retrieved. Two ordinary GETs
in a fresh HTTP context, `/captcha?ext=1&board=g` and `/signin`, returned HTTP 403.
No browser was available through the browser connector, so the user's current
cookies, stored ticket, and personalized CAPTCHA responses were not inspected.
No posts, authentication changes, CAPTCHA solves, or repeated endpoint probes
were performed.

The next useful check requires a connected browser session: compare native
posting and 4chan-xtd on the same board/thread, recording only whether a ticket
is present and whether the server returns tasks. Keep ticket/cookie values
private. That can establish whether the extension loses a real exemption;
public source inspection alone cannot establish why the server grants one.

## Follow-up: posting cookie evidence

The user reports that `4chan_pass` changes after posting. Its reported attributes
are domain `.4chan.org`, HttpOnly, and approximately one year of validity. No
cookie values were supplied. This is user-observed evidence, not a captured
request/response trace.

The other reported cookies are documented by
[Cloudflare](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/):
`__cf_bm` supports bot scoring, `_cfuvid` distinguishes visitors sharing an IP for
rate limiting, and `cf_clearance` stores Cloudflare clearance. These roles do not
establish control over 4chan's own posting CAPTCHA difficulty.

There is supporting client-source evidence for investigating `4chan_pass`:

- Kuroba-Experimental's
  [Chan4ReplyCall.kt](https://github.com/K1rakishou/Kuroba-Experimental/blob/bf3723ac7416055595471bb4f679c7e6953da676/Kuroba/app/src/main/java/com/github/k1rakishou/chan/core/site/sites/chan4/Chan4ReplyCall.kt)
  reads a posting cookie from response `Set-Cookie` headers and saves it when
  `rememberCaptchaCookies` is enabled. Its cookie-reading code sends it on
  subsequent posts.
- [Chan4.kt](https://github.com/K1rakishou/Kuroba-Experimental/blob/bf3723ac7416055595471bb4f679c7e6953da676/Kuroba/app/src/main/java/com/github/k1rakishou/chan/core/site/sites/chan4/Chan4.kt)
  defines that posting cookie as `4chan_pass`.
- Its [English strings](https://github.com/K1rakishou/Kuroba-Experimental/blob/bf3723ac7416055595471bb4f679c7e6953da676/Kuroba/app/src/main/res/values/strings.xml)
  label the setting "Remember captcha cookies for easy captcha".

This establishes how another client treats the cookie, not the current server's
algorithm or a way to force permanent exemption. A changing value could reflect
token renewal; it does not by itself prove an increasing trust counter.

In this checkout, `QR.persona.getPassword()` still attempts to read a
JavaScript-visible `4chan_pass` as a password fallback. That cannot read the
HttpOnly cookie reported here. It must not be taken as proof of this cookie's
current server-side purpose. `QR.submit` uses `withCredentials: true`, and the
XHR helper forwards that option, so the source already enables browser-managed
cookies on posting requests.

The user subsequently checked Firefox Network details and reports that
`4chan_pass` is sent on both `/post` and `/captcha`, with `Set-Cookie` appearing
only on `/post`. This supports a flow where posting refreshes the cookie and
CAPTCHA requests consume it. It rules out an absent cookie in those observed
requests, but does not establish how the server uses it or whether the new value
represents more trust, renewal, or another state change.

Kuroba's
[Chan4SiteRequestModifier.kt](https://github.com/K1rakishou/Kuroba-Experimental/blob/bf3723ac7416055595471bb4f679c7e6953da676/Kuroba/app/src/main/java/com/github/k1rakishou/chan/core/site/sites/chan4/Chan4SiteRequestModifier.kt)
also sends its stored posting cookie on generic requests and WebView cookie
setup. It treats paid-Pass `pass_id` separately from `4chan_pass`.

The next useful comparison is the server's CAPTCHA response on either side of a
normal successful post: whether the challenge is `noop`, how many tasks it
contains, and whether a ticket is returned. Only those facts and numeric
cooldown/TTL fields are needed; do not share cookie values, challenge identifiers,
ticket values, or complete network exports.

## Follow-up: user-supplied CAPTCHA frame

The user supplied one `/captcha` HTML response. No challenge identifier or image
data is reproduced here. Its `twister` payload contains one task with three
candidate images, `ttl: 120`, and `cd: 30`. The challenge is not `noop`; no
`ticket` property is present. This confirms a real one-step challenge at that
moment, not a CAPTCHA exemption. An absent `ticket` property does not establish
that the browser lacks a stored ticket: the public client's `saveTicket`
preserves storage when passed `undefined`.

A preceding inline script sets `_tcs` with domain `sys.4chan.org` and path `/`.
Its value combines browser time in seconds, the browser's IANA timezone, a
server-provided numeric literal, the length of `window.eval.toString()`, the
number of elements in `document.head` at execution time, and empty segments.
The shown cookie assignment specifies no expiry, HttpOnly, or Secure attribute.
Its domain explains why a cookie list for `boards.4chan.org` alone would not
show it.

These fields resemble client-environment/fingerprint signals; that purpose is
an inference. The snippet does not reveal validation or scoring rules. The
current challenge is already embedded in the server response before this
script executes, so this newly assigned cookie can only accompany subsequent
matching requests. A previously existing `_tcs` could have accompanied the
request that produced this response; that was not captured.

There is still no exposed trust level, remaining exemption count, or supported
client setting that requests a permanent no-task response. The new evidence
identifies another possible server input, not a verified bypass.

The user subsequently confirmed `_tcs` is present on both `/captcha` and `/post`.
Its reported segments match the inline script: client time six seconds after
the server-provided timestamp, timezone `America/Sao_Paulo`, eval-string length
37, head-element count 3, and empty reserved-looking segments. The full cookie
value is not retained here. These observations establish that the assignment was
accepted and the cookie was transmitted in the inspected requests. No explicit
post count, trust score, or CAPTCHA-free allowance appears in the visible fields.
That does not rule out the server using them as inputs or identifying state
through another cookie, such as `4chan_pass`.

Both relevant observed cookies now reach both endpoints. Further checks of their
mere presence would not resolve the exemption algorithm. Server-side use and any
causal effect on difficulty remain unverified; no permanent bypass was found.

## Follow-up: local posting-token format inspection

The user supplied a posting-cookie value. It was inspected locally, without
network requests or an external decoder. The value is not reproduced here.
It contains 102 base64url-alphabet characters, no dots, and decodes to 76 binary
bytes that are not valid UTF-8. It therefore does not expose a readable JSON
payload or the dotted structure of a compact JWT. This sample alone cannot
distinguish encryption, an authenticated binary format, or an opaque server
identifier, and reveals no editable verification-credit field. No attempt was
made to modify or replay it.
