# SonarLint findings resolved with NOSONAR (false positives / compile-breakers)

These findings from `issues-sonarlint.json` were not fixed by changing logic. Each is suppressed
with an inline `// NOSONAR <reason>` comment at the flagged line. Reasons below expand on why.

## Would break the build if "fixed" literally

### `src/classes/Fetcher.ts:14` — "Make this public static property readonly"
`static flagCSS: HTMLLinkElement | null;` is a lazy-init cache, reassigned inside `insert()`
(a regular instance method, not a static initializer). TypeScript only allows assignment to a
`readonly` static member from the class's static-initializer context. Adding `readonly` here is a
**TS2540 compile error** ("Cannot assign to 'flagCSS' because it is a read-only property"), not a
valid fix.

## Unknown-typed values by design

### `src/globals/jsx.ts:46, 73, 77` — "'X' will use Object's default stringification format"
`h()` is a generic hyperscript-style pragma (see `src/types/jsx.d.ts`:
`interface IntrinsicElements extends Record<string, unknown> {}`), intentionally permissive so any
tag/attribute/child shape can be authored in `.tsx`. Attribute values and children are conventionally
primitives (string/number/boolean) or nested `EscapedHtml` by every call site in this codebase — the
`unknown` typing is deliberate, not an oversight, and narrowing it would require a broader type
change across every JSX usage for no behavioral benefit.

### `src/main/Main.ts:121` — same stringification rule
`return new Error(String(error));` is the last-resort branch in `toError()`, reached only after
`instanceof Error`, `typeof error === 'string'`, and `JSON.stringify(error)` have all been tried and
failed. There is no better alternative for representing an arbitrary thrown value at that point.

## Regex flagged as backtracking-prone, but structurally linear (false positive)

Discriminator: two quantifiers that can match the same characters (overlap), or a nested quantifier,
is a real ReDoS shape. A single quantifier followed by a **disjoint** delimiter class can't backtrack
catastrophically — worst case is still O(n). The following are all the latter:

- `src/Linkification/Embedding.tsx:673` (×3) — `/(\d+)h/`, `/(\d+)m/`, `/(\d+)s/`: digit class is
  disjoint from the trailing letter, single quantifier.
- `src/site/SW.tinyboard.ts:231` and `src/site/SW.yotsuba.tsx:543` — `/<[^>]*>/g`: negated class
  already excludes the closing delimiter.
- `src/site/SW.tinyboard.ts:296` — `/[^/]*$/`: single quantifier anchored to end of string.
- `src/site/SW.tinyboard.ts:298` — `/\d+x\d+/`: digit class disjoint from literal `x`.
- `src/classes/Post.ts:293` and `src/site/SW.yotsuba.tsx:559` — `/\s+$/gm`: single quantifier
  anchored to `$`. These sit in the core comment-rendering path (production, not a dev tool); left
  alone rather than risk changing multi-line trim behavior for no real safety gain.

## Real ambiguity, but trusted/dev-only input

### `tools/check-cycles.ts:43` — import-matching regex
`/\b(import|export)\s+(type\s+)?(?:[^'"]*?\s+from\s*)?['"]([^'"]+)['"]/g` has a structurally
ambiguous optional lazy group (`[^'"]*?` can overlap with the following `\s+`). This is a dev-only
build/lint script that only ever scans this repository's own TypeScript source files — never
external or attacker-controlled input — so the ReDoS risk is not applicable in practice.
