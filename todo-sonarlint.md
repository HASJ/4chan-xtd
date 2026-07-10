# SonarLint / SonarQube findings — status

Tracking of the findings in `issues-sonarlint.json`. Work lives on branch
`audit/sonarlint`. Verified after every group: `npm run typecheck` → `ok`,
`npm run test` → 12 files / 27 tests pass.

Legend: `[x]` done · `[ ]` deferred/left (with reason).

---

## Completed

### General
- [x] `Get.ts:27` — regex ReDoS → linear `trailingDigits()` scan helper
- [x] `Header.ts:15` — cognitive complexity 16→≤15 (extracted `boardNavTokenEnd`)
- [x] `PostNormalizer.ts:49` — regex ReDoS → linear `rtrimNewlines()`
- [x] `Settings.tsx:520,522` — regex ReDoS simplified
- [x] `Test.ts:172` — regex ReDoS → linear `trailingDigits()`

### Images / Icons
- [x] `Gallery.ts:230` — cognitive complexity → extracted `generateThumbsForPost`
- [x] `Gallery.ts:278` — regex ReDoS → linear `trailingWordChars()`
- [x] `Gallery/Gallery.html:12,17` — anchor content + img alt text added
- [x] `Sauce.ts:56,73,101` — regex ReDoS → `firstDottedSegment()` + scan helpers
- [x] `Icons/icon.ts:72` — exported `var` → `const`

### Miscellaneous
- [x] `AntiAutoplay.ts:6,10,33,36` — `var` → `const`/`let`
- [x] `IDColor.ts:6` — exported `var` → `const`
- [x] `IDColor.ts:20,51` — assignments extracted from expressions
- [x] `IDColor.ts:34` — `parseInt` → `Number.parseInt`
- [x] `IDHighlight.ts:5` — exported `var` → `const`
- [x] `IDPostCount.ts:6` — exported `var` → `const`
- [x] `IDPostCount.ts:11,31` — assignments extracted from expressions
- [x] `ScrollMarkers.ts:67` — `insertAdjacentElement('afterend', …)` → `.after()`
- [x] `Time.ts:18` — regex ReDoS → `trimStart`/`trimEnd` length arithmetic

### Linkification
- [x] `Embedding.tsx:166` — extracted `service.queue` assignment
- [x] `Linkify.ts:45` — cognitive complexity 19→≤15 (extracted `scanTextNode`)
- [x] `Linkify.ts:180` — regex ReDoS simplified (`.+` → `.` before literal)

### Posting
- [x] `QR.ts:206,395,1081,1260,1262` — `g.BOARD` → `g.BOARD.ID` (runtime no-op; `Board.toString()` already returns `.ID`)
- [x] `QR/QuickReply.html:7,15,16,17,20,32,39,63,72` — added ids + associated/aria labels
- [x] `VideoStripper.ts:242` — cognitive complexity → extracted `tryReadEbmlHeader` / `tryProcessSegment`

### classes / Quotelinks
- [x] `Post.ts:116,141,381` — regex ReDoS → linear `trailingDigits` / `trailingWordChars`
- [x] `CatalogThreadNative.ts:32` — regex ReDoS simplified
- [x] `Quotify.ts:72` — regex ReDoS simplified

### core / site
- [x] `globals.ts:6` — removed unused `SWTinyboard` import
- [x] `globals.ts:85` — `for` index loop → `for-of`
- [x] `platform/helpers.ts:20` — removed `this`-to-`that` alias
- [x] `platform/helpers.ts:37` — `instanceof Array` → `Array.isArray`
- [x] `platform/helpers.ts:45,46` — `var` → `const`
- [x] `platform/helpers.ts:66` — `indexOf(...) >= 0` → `.includes()`
- [x] `platform/helpers.ts:72` — extracted `kc` assignment
- [x] `platform/helpers.ts:99,101` — `String.fromCharCode` → `String.fromCodePoint` (inputs bounded to BMP)
- [x] `SW.yotsuba.tsx:406` — pseudorandom flagged as cosmetic (spoiler image variance), `NOSONAR` with rationale

---

## Deferred / left (with reason)

### Needs a decision or design change
- [ ] `Settings/SettingsHtml.tsx:13,14,15,20` — `href="javascript:;"` on action anchors.
      Correct fix is `<a>` → `<button type="button">`, but `style.css:482`
      (`.export, .import, .reset`) has no button-chrome reset, so conversion would
      visually regress the settings dialog. **Needs: buttons + CSS reset + visual QA.**

### False positives (no change needed)
- [ ] `classes/Fetcher.ts:14` — "make readonly": the static `flagCSS` is reassigned
      lazily (`Fetcher.flagCSS = …` at lines 78/80); `readonly` would break compilation.
- [ ] `QR.ts:1184` — `/\d+\s+(?:minute|second)/`: disjoint char classes, already linear.
- [ ] `SW.tinyboard.ts:209,239,275,277` — single-quantifier patterns, already linear.
- [ ] `SW.yotsuba.tsx:281,294,394,512` — linear / atomic-emulated patterns, already safe.
- [ ] `Main.ts:115` — already uses `String(error)`; finding stale.

### Left for behaviour-safety (no provable behaviour-preserving rewrite)
- [ ] `Fetcher.ts:79` — `\d+(?=\.css$)`: bounded CSS-href input, not attacker-scalable.
- [ ] `Post.ts:276` — `/\s+$/gm`: multiline trailing-whitespace; `\s` includes `\n`, no safe rewrite.
- [ ] `Embedding.tsx:438,461,587,672` (incl. complexity 29 @587) — capture values consumed downstream; restructuring risks silently changing which match wins.
- [ ] `Linkify.ts:126` — domain-tail regex whose match content is consumed; equivalence unprovable.
- [ ] `Linkify.ts:132` (regex + complexity 71) — large core regex used everywhere; too risky to rewrite (carries a prior `NOSONAR`).
- [ ] `SW.tinyboard.ts:270` — `/\((.*,\s*)?([\d.]+ ?[KMG]?B).*\)/`: genuinely polynomial but no safe rewrite (filenames may contain `)`); input short and non-scalable.
- [ ] `SW.yotsuba.tsx:528` — `/\s+$/gm`: same multiline constraint as `Post.ts:276`.

### Low value / invasive
- [ ] `globals/jsx.ts:46,73,77` — `[object Object]` stringification in the JSX render core;
      Minor severity, guarded paths, fixing properly means retyping the runtime.

---

## Notes
- Regex fixes were done only where a **provably behaviour-equivalent linear form** exists
  (backward/forward char-code scans that match the original exactly). Where a capture value
  is consumed by later logic and equivalence can't be proven, the regex was left unchanged —
  behaviour preservation over closing the finding.
- The `trailingDigits` / `trailingWordChars` scan helpers are duplicated across a few files.
  Candidate for a future DRY pass into one shared util.
- `issues-sonarlint.json` is the source finding list (kept untracked as a working artifact).
