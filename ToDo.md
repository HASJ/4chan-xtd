# Testing and documentation roadmap

This checklist tracks the staged reliability work. Check an item only after its named command or review is complete.

## Short term: core + filters

### 1. Establish the test baseline

- [x] Inspect the existing Vitest configuration, test files, test-only Rollup regions, and package scripts.
- [x] Confirm Node 22 supports the current lockfile and development dependencies.
- [x] Add a single shared test setup only for globally repeated browser shims or cleanup.
- [x] Configure Vitest to load that setup without changing the default jsdom environment.
- [x] Add a `test:coverage` script using Vitest's V8 provider and a text/HTML report.
- [x] Keep coverage informational: do not configure global percentage thresholds.
- [x] Run `npm test` and `npm run test:coverage`; record any baseline limitations in `docs/TESTING.md`.

### 2. Add reusable fixtures

- [x] Create a test-fixture directory under `src/test/` (or reuse the nearest existing convention).
- [x] Add a minimal Yotsuba thread JSON fixture with OP, reply, file, quotes, and poster ID data.
- [x] Add a minimal Tinyboard thread JSON fixture with equivalent post data.
- [x] Add HTML fixture helpers only where a public behavior requires a real DOM node.
- [x] Export fixture factories that return fresh data/DOM for each test; no shared mutable fixture state.
- [x] Keep fixtures deliberately small and hand-maintained; do not copy live user content.
- [x] Add one test proving each fixture parses through the relevant public adapter/parser.

### 3. Cover core platform and domain behavior

- [x] Identify public, deterministic platform utility functions with no singleton startup dependency.
- [x] Test DOM creation, selector, event, and URL helpers through observable behavior.
- [x] Identify collection/domain classes with stable public APIs (for example board, thread, post, and dictionary helpers).
- [x] Test construction, lookup, insertion/removal, ordering, and edge-case behavior of the selected classes.
- [x] Test archive configuration parsing for supported archive response shapes.
- [x] Test archive redirect selection, including no-compatible-archive and malformed-data cases.
- [x] Test link parsing for post links, cross-board links, fragments, and non-post URLs.
- [x] Keep each test independent of network access, browser extensions, current time, and live boards.
- [x] Run the focused tests first, then the whole Vitest suite.

### 4. Cover filtering, hiding, and quote workflows

- [x] Trace the filtering entry point and every caller before selecting the test seam.
- [x] Test matching/non-matching filters and the visible post/stub result.
- [x] Test explicit hide/unhide behavior and persisted metadata only through public APIs.
- [x] Test quote-link parsing and generated quote targets in a jsdom fixture.
- [x] Test quoted-post navigation/highlight behavior only where it is independently observable.
- [x] Add a regression case for each production bug fixed in these covered paths.
- [x] Avoid line-by-line tests of UI singleton internals and mocked DOM side-effect chains.

### 5. Protect build/test separation

- [x] Locate all `tests_enabled` source regions and confirm their purpose.
- [x] Add or extend a test for the Rollup plugin that removes every test-only region.
- [x] Verify comments outside test-only regions are left intact.
- [x] Run a userscript build and confirm production output does not contain test-only markers.
- [x] Keep generated output uncommitted unless a release specifically requires it.

### 6. Add continuous verification

- [x] Add `.github/workflows/verify.yml` for pushes and pull requests.
- [x] Configure the workflow with Node 22 and `npm ci`.
- [x] Run `npm run typecheck` in its own named step.
- [x] Run `npm test` in its own named step.
- [x] Run `npm run check:cycles` in its own named step.
- [x] Run `npm run build:userscript` in its own named step.
- [x] Use no credentials, publishing, releases, or generated-file commits in the verification workflow.
- [x] Confirm the YAML triggers and command names match `package.json` exactly.

### 7. Document the baseline

- [x] Add `docs/TESTING.md` with prerequisites, install command, test commands, and expected outputs.
- [x] Document when to use unit/jsdom tests versus future browser tests.
- [x] Document fixture location, structure, freshness requirements, and no-live-data rule.
- [x] Document how to add a focused regression test for a bug fix.
- [x] Update README with the core verification commands and a link to testing guidance.
- [x] Update CONTRIBUTING with `npm ci`, test/coverage commands, and the PR verification checklist.
- [x] Update architecture docs with startup flow, global/singleton boundaries, site adapters, and build/test separation.
- [x] Add inline comments only for actual invariants, browser quirks, or legacy constraints encountered during implementation.
- [x] Review documentation command names and paths against the final repository state.

### 8. Short-term acceptance checks

- [x] `npm run typecheck` passes.
- [x] `npm test` passes.
- [x] `npm run test:coverage` produces an informational V8 report.
- [x] `npm run check:cycles` passes.
- [x] `npm run build:userscript` passes.
- [x] `git diff --check` passes.
- [x] CI runs the same required commands on Node 22.

## Mid term: browser and maintainer coverage

### 9. Add browser-test infrastructure

- [ ] Select Playwright only after the unit/jsdom baseline is stable.
- [ ] Add a local fixture server/page set; do not browse or modify live boards.
- [ ] Mock userscript and extension APIs at the harness boundary.
- [ ] Provide deterministic seed data for thread, catalog, and posting pages.
- [ ] Add Chromium smoke coverage for thread display and catalog display.
- [ ] Add Chromium smoke coverage for filtering, quote interactions, and Quick Reply.
- [ ] Repeat the smoke suite in Firefox.
- [ ] Document local browser installation, CI browser caching, failure artifacts, and fixture updates.

### 10. Maintain the coverage program

- [ ] Publish per-area coverage baselines for selected core modules.
- [ ] Raise a per-area target only after its tests are stable and meaningful.
- [ ] Keep browser failures reproducible with a local fixture and a regression test.
- [ ] Document release verification and debug steps for maintainers.
- [ ] Record architectural decisions that change adapter, global, or build boundaries.

## Long term: broad coverage and user docs

### 11. Expand safely into orchestration modules

- [ ] Identify large modules whose decisions can be extracted without changing behavior.
- [ ] Extract only pure decision logic with a clearly useful public seam.
- [ ] Add direct tests for that pure logic before adding broad DOM mocks.
- [ ] Add browser regression coverage for user-visible orchestration defects.
- [ ] Avoid a repository-wide coverage threshold unless every major test layer is reliable.

### 12. Maintain user documentation

- [ ] Keep user feature/troubleshooting documentation separate from developer testing notes.
- [ ] Add user-facing examples only when a shipped feature needs them.
- [ ] Link bug reports to reproducible test cases where practical.
- [ ] Review documentation at each release for obsolete browser or manager guidance.
