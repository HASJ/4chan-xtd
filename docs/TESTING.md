# Testing

## Setup and commands

Use Node 22 for the same runtime as CI. Install the locked dependency tree with:

```sh
npm ci
```

Run the deterministic unit/jsdom suite with `npm test`. Run `npm run test:coverage` to create a local V8 text report and `coverage/index.html`. Coverage is visible information, not a global pass/fail threshold.

Before opening a pull request, run:

```sh
npm run typecheck
npm test
npm run check:cycles
npm run build:userscript
```

GitHub Actions runs those same commands on pushes and pull requests.

## Browser smoke tests

Install the two supported Playwright browsers once per machine, then run the local browser suite:

```sh
npm run test:browser:install
npm run test:browser
```

`test:browser` builds the userscript, starts the local fixture server, and exercises the bundle in Chromium and Firefox. It never requests a live board: `tests/browser/fixtures/` contains small synthetic thread, catalog, and posting pages; `tests/browser/server.mjs` supplies their deterministic board JSON; and `tests/browser/app.spec.ts` mocks userscript APIs before the bundle loads. Keep fixture changes hand-maintained and add a browser regression only for behavior jsdom cannot cover.

The browser CI job uses Node 22, caches Playwright downloads, and uploads `playwright-report/` plus `test-results/` on failure. For a failure, rerun the named project locally (`npx playwright test --project=chromium` or `--project=firefox`) and inspect the trace in its test-results directory. Release verification includes the unit suite, browser suite, typecheck, cycle check, and userscript build.

## Test boundaries

Unit tests live beside the module they cover as `*.test.ts` and run in jsdom. Prefer observable public behavior: adapters, parsers, collection classes, DOM utilities, filter outcomes, and quote-link transformations. Do not mock a large UI singleton's internal call sequence merely to raise coverage.

`src/test/setup.ts` is the shared boundary for browser/userscript shims and DOM cleanup. Add a shim there only when several tests need the same platform API; local test data should stay in the test that uses it.

Browser smoke coverage uses local pages and mocked extension/userscript APIs, never live boards.

## Fixtures and regressions

Reusable synthetic post fixtures are in `src/test/fixtures/posts.ts`. They cover the smallest useful Yotsuba, Tinyboard, and archived-post shapes. Fixture factories must return fresh objects or DOM nodes, contain no copied live user content, and include only fields needed by the behavior under test.

For a bug fix, first add the smallest deterministic test that fails on the old behavior. Keep network access, current time, and storage state out of the test. If a browser-only regression cannot be represented in jsdom, add it to the future local browser harness rather than reaching out to a real site.

## Test-only build code

`// #region tests_enabled` blocks support the explicit `-test` Rollup build path. Normal userscript and extension builds remove them. Keep test-only imports and assertions inside those regions, and update the Rollup-plugin test if the region syntax changes.
