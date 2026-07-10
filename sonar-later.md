## src/Linkification/Linkify.ts

**`typescript:S5843`** — line 130, `regString` regex, complexity 75 (limit 20).

```
regString: /((https?|mailto|git|magnet|ftp|irc):([a-z\d%/?])|([-a-z\d]+\.)+(aero|asia|biz|...)([:/]|(?![^\s"]))|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[-\w.@]+@[a-z\d.-]+\.[a-z\d])/i
```

Single regex handles 4 link shapes at once (scheme-prefixed URL, bare domain+TLD, IPv4, email) and is used as one property throughout the file via `.test()`, `.search()`, `.exec()` — `node()`, `process()`, `extendAcrossNodes()`, `canBridgeLineBreak()`, `makeLink()`.

To get under 20, it'd need splitting into 4 separate regexes (one per link shape) combined behind a small matcher function, then updating every call site to use the new function instead of the raw regex. That's a structural change across ~6 call sites, worth its own PR with test coverage — not a drive-by fix.

Precedent: `src/Linkification/Embedding.tsx` line 587 has the same class of finding (Twitter/X mirror-domain regex) and was left as-is with `// NOSONAR complex intentionally, matches every known Twitter/X mirror domain`. Same treatment (suppress + comment) is the low-risk option here if a full split isn't wanted.

## What was fixed instead in Linkify.ts / Menu.ts / Embedding.tsx (for contrast)

Everything else in that diagnostics dump was mechanical or a bounded extraction:
- `g.VIEW` undefined guards (Linkify.ts + 6 files under src/Menu/)
- Menu.ts `this` implicit-any (explicit `this: HTMLElement` param)
- `Linkify.process()` cognitive complexity (49) — fixed by extracting `extendAcrossNodes()` / `canBridgeLineBreak()`
- `Linkify.makeLink()` cognitive complexity (18) — fixed by extracting `countTrailingPunctuation()`
- `word.match()` → `regex.exec()`, `[\d]` → `\d`, duplicate `\d` in char class, unnecessary `\[` escape (Linkify.ts)
- `??=` swap, 2x redundant `return;` (Embedding.tsx)

## Images refactors deferred

- `src/Images/Gallery.ts`: `build` (S3776), `open` (S3776).
- `src/Images/ImageLoader.ts`: `prefetch` (S3776).
- `src/Images/Sauce.ts`: `parseLink` (S3776).
- `src/Images/ImageExpand.ts`: `contract` (S3776), `expand` (S3776).
- `src/Images/ImageHover.ts`: `mouseOver`/handler at line 48 (S3776), complexity 16.

These need behavior-preserving extraction work; intentionally excluded from current mechanical lint/type cleanup.

## src/classes/Fetcher.ts

**`typescript:S1444`** — line 14, `static flagCSS: HTMLLinkElement | null;`, "Make this public static property readonly."

False positive: `flagCSS` is lazily populated in `insert()` (`Fetcher.flagCSS || (Fetcher.flagCSS = $('link[...]'))` and the following `Fetcher.flagCSS = $.el('link', {...})`). Marking it `readonly` breaks the lazy-cache assignment with a real compile error (`TS2540: Cannot assign to 'flagCSS' because it is a read-only property.`), confirmed by toggling it and running `npm run typecheck:src`. Left as mutable `static`.

## Captcha refactors deferred

`src/Posting/Captcha.t.ts` contains several intertwined captcha lifecycle and custom-strip UI flows. The following Sonar findings need behavior-preserving extraction work and should be handled together in a dedicated change:

- `createStrips` (line 237, `typescript:S3776`, complexity 59): split challenge-state detection, custom UI reconciliation, strip construction, asynchronous image capture, and keyboard registration into helpers. Preserve slider event order and focus restoration.
- `runCapture` (line 450, `typescript:S3776`, complexity 31): extract slider movement/capture and post-capture restoration paths. Keep the 150 ms wait and the `isCapturing`/`isRestoring` transitions intact.
- `checkCompletion` (line 556, `typescript:S3776`, complexity 18): extract next-challenge availability/remaining-step checks into a predicate before retaining the completion and auto-post behavior.
- `createIframeStrips` (line 637, `typescript:S3776`, complexity 26): share strip selection and keyboard navigation with the main captcha flow where their event semantics match, while retaining iframe-specific UI setup.

Related cleanup that belongs with this work: consolidate the duplicated left/right strip navigation and repeated selection branches (`typescript:S1871`), then make the remaining local mechanical fixes (`Number.parseInt`, optional chaining, unused `keyCode`, and safe guards for optional board/response elements) once the extracted interfaces make their nullability clear.
