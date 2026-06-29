# ToDo

## Replace `QRBridge` Proxy With an Explicit QR Captcha Facade

### Goal

Replace `src/Posting/QRBridge.ts` with a small explicit API that exposes only the QR state and operations needed by `Captcha.js` and `Captcha.t.js`, while keeping `npm run check:cycles` clean.

### Current State

- [x] `npm run check:cycles` passes with no circular source dependencies.
- [x] `Captcha.js` imports `QRBridge` instead of `QR.ts`.
- [x] `Captcha.t.js` imports `QRBridge` instead of `QR.ts`.
- [x] `QR.ts` registers the full QR object through `registerQR(QR)`.
- [x] `QRBridge.ts` uses a dynamic `Proxy`, which hides the actual captcha-to-QR contract.

### Desired End State

- [x] No dynamic `Proxy` is used for QR/captcha communication.
- [x] Captcha modules depend on an explicit, named facade API.
- [x] The facade exposes only the QR fields and methods captcha actually needs.
- [x] The QR/captcha source graph remains acyclic.
- [x] `npm run check:cycles`, `npm run build`, `npm run build:userscript`, and `npm run build:crx` pass.
- [x] Generated files under `builds/` are reverted after verification.

### Phase 1: Inventory the Existing Contract

- [x] List every `QR.*` access in `src/Posting/Captcha.js`.
- [x] List every `QR.*` access in `src/Posting/Captcha.t.js`.
- [x] Group accesses into categories:
  - [x] QR lifecycle methods: `focus`, `submit`, `error`.
  - [x] QR captcha implementation reference: `captcha.setup`.
  - [x] QR request/posting state: `req`, `posts`, `cooldown`.
  - [x] QR DOM nodes: `nodes.el`, `nodes.com`, `nodes.status`.
  - [x] QR layout operations: captcha classes, focus checks, position fixes.
- [x] Confirm whether each access is read-only, write-only, or mutating nested state.
- [x] Identify calls that can become semantic methods instead of raw state reads.

### Phase 2: Design the Explicit Facade

- [x] Create a new `src/Posting/QRCaptchaBridge.ts` or replace `QRBridge.ts` with explicit exports.
- [x] Define a registered implementation object with named methods.
- [x] Avoid exporting the full QR object.
- [x] Include fallback no-op behavior for methods called before QR registration only where safe.
- [x] Prefer semantic names over exposing broad state.

Candidate facade methods:

- [x] `registerQRCaptchaBridge(bridge)`.
- [x] `getQRPosts()`.
- [x] `getFirstQRPost()`.
- [x] `hasActiveQRRequest()`.
- [x] `isQRAutoCooldown()`.
- [x] `setQRAutoCooldown(enabled)`.
- [x] `getQRNodes()`.
- [x] `getQRRoot()`.
- [x] `getQRCommentInput()`.
- [x] `getQRStatusInput()`.
- [x] `isQROpen()`.
- [x] `focusQR()`.
- [x] `focusQRComment()`.
- [x] `focusQRStatus()`.
- [x] `showQRError(error, focusOverride)`.
- [x] `submitQR()`.
- [x] `setupCurrentCaptcha(focus)`.
- [x] `addQRClass(...classes)`.
- [x] `removeQRClass(...classes)`.
- [x] `insertCaptchaRoot(root)`.

### Phase 3: Replace `Captcha.js` Call Sites

- [x] Replace `QR.req` with `hasActiveQRRequest()`.
- [x] Replace `QR.posts.length` with `getQRPosts().length` or a semantic helper.
- [x] Replace `QR.posts[0]` with `getFirstQRPost()`.
- [x] Replace `QR.error(...)` with `showQRError(...)`.
- [x] Replace `QR.captcha.setup(...)` with `setupCurrentCaptcha(...)`.
- [x] Replace direct QR DOM class mutations with `addQRClass` and `removeQRClass`.
- [x] Replace direct comment/status focus calls with facade focus methods.
- [x] Replace direct QR node containment checks with small facade helpers if repeated.
- [x] Run `npm run check:cycles` after this phase.

### Phase 4: Replace `Captcha.t.js` Call Sites

- [x] Replace `QR.nodes.el` access with `getQRRoot()` or semantic helpers.
- [x] Replace `QR.nodes.com` access with `getQRCommentInput()`.
- [x] Replace `QR.posts[0]` access with `getFirstQRPost()`.
- [x] Replace `QR.posts.length` access with `getQRPosts().length` or a semantic helper.
- [x] Replace `QR.cooldown.auto` reads with `isQRAutoCooldown()`.
- [x] Replace `QR.submit()` with `submitQR()`.
- [x] Replace direct comment focus restoration checks with facade helpers where practical.
- [x] Run `npm run check:cycles` after this phase.

### Phase 5: Register the Facade in `QR.ts`

- [x] Replace `registerQR(QR)` with `registerQRCaptchaBridge({...})`.
- [x] Map each facade method to the smallest QR implementation detail needed.
- [x] Keep all QR implementation logic in `QR.ts`.
- [x] Do not import `Captcha.js` or `Captcha.t.js` from the facade.
- [x] Confirm `QR.ts -> Captcha.js -> Captcha.t.js -> facade` does not create a back edge.

### Phase 6: Tighten Types

- [x] Add TypeScript interfaces for the bridge object.
- [x] Type the required QR node subset.
- [x] Type the required QR post subset.
- [x] Keep JS captcha modules compatible with the typed facade.
- [x] Avoid `any` except where current JS interop makes it unavoidable.
- [x] Run `npm run build` and fix type or Rollup warnings introduced by the facade.

### Phase 7: Verification

- [x] Run `npm run check:cycles`.
- [x] Run `npm run build`.
- [x] Run `npm run build:userscript`.
- [x] Run `npm run build:crx`.
- [x] Confirm Rollup prints no circular dependency warnings.
- [x] Revert generated files under `builds/` after verification.
- [x] Run `rtk git status --short` and confirm only intended source files remain changed.

### Phase 8: Manual QA Targets

- [x] Open QR on a thread page.
- [x] Open QR on an index page.
- [x] Verify v2 captcha setup, focus behavior, reload, and completion.
- [x] Verify TCaptcha setup, focus restoration, strip UI, and completion.
- [x] Verify `Post on Captcha Completion` still submits when expected.
- [x] Verify captcha auto-loading when QR contains text, file, or multiple posts.
- [x] Verify QR close destroys captcha UI.
- [x] Verify changing the selected thread refreshes TCaptcha thread data.
- [x] Verify captcha error paths still display through QR notifications.

### Phase 9: Commit Checklist

- [x] Review `git diff` for accidental generated changes.
- [x] Confirm `npm run check:cycles` passes.
- [x] Confirm the three build commands pass.
- [x] Commit with a subject like `Make QR captcha bridge explicit`.

## Close Documentation and Code Comment Gaps

### Goal

Bring the project documentation and high-value source comments in line with the current codebase so contributors can understand the build pipeline, dependency constraints, migration status, and major runtime boundaries without relying on stale notes or upstream-only documentation.

### Current State

- [x] `README.md` contains old fork/migration notes and a TODO block.
- [x] `CONTRIBUTING.md` points contributors to the upstream 4chan X wiki and says XTd has no own wiki.
- [x] `conductor/tracks/ts_migration_20260522/plan.md` still lists circular dependency work as open.
- [x] `src/Posting/QRBridge.ts` defines the QR captcha facade without a module-level contract note.
- [x] Several large runtime modules begin with imports or migration boilerplate instead of orientation comments.
- [x] Many files still use `@ts-nocheck` without local or central guidance for when that is acceptable.
- [x] Many legacy `decaffeinate suggestions` blocks remain in source files.
- [x] Tooling scripts have limited inline explanation of assumptions and supported behavior.

### Desired End State

- [x] Top-level docs describe the current build outputs and verification commands accurately.
- [x] Current circular dependency status and `npm run check:cycles` expectations are documented.
- [x] XTd-specific contributor guidance exists locally and does not depend only on the upstream wiki.
- [x] The QR captcha facade has a short contract comment explaining registration, dependency direction, and ownership.
- [x] Large singleton/runtime modules have concise orientation comments where they materially help navigation.
- [x] `@ts-nocheck` usage has documented migration rules and removal expectations.
- [x] Stale decaffeinate boilerplate is removed or replaced with useful current-context comments.
- [x] Build and cycle-check tooling assumptions are documented.

### Phase 1: Update Top-Level Project Docs

- [x] Update `README.md` build notes to reflect current userscript and CRX build support.
- [x] Remove or refresh the stale `README.md` TODO checklist.
- [x] Replace stale circular dependency wording in `README.md` with current `npm run check:cycles` guidance.
- [x] Add `npm run check:cycles` to contributor verification guidance.
- [x] Clarify that generated files under `builds/` should not be edited directly.
- [x] Update `CONTRIBUTING.md` with XTd-specific internal documentation links or local guidance.

### Phase 2: Reconcile Conductor and Migration Docs

- [x] Review `conductor/tracks/ts_migration_20260522/plan.md` for stale open circular-dependency tasks.
- [x] Mark completed migration/cycle tasks accurately or move them to historical context.
- [x] Update `conductor/tracks/ts_migration_20260522/spec.md` if it still describes outdated dependency status.
- [x] Ensure conductor docs point to the current build and cycle-check commands.
- [x] Decide whether old track docs are active plans or archived records, and label them accordingly.

### Phase 3: Document QR/Captcha Boundary

- [x] Add a module-level comment to `src/Posting/QRBridge.ts` explaining that it is an explicit acyclic facade.
- [x] Document that `QRBridge.ts` must not import `QR.ts`, `Captcha.js`, or `Captcha.t.js`.
- [x] Document that `QR.ts` owns the implementation and registers the bridge via `registerQRCaptchaBridge`.
- [x] Add a short comment near the registration block in `src/Posting/QR.ts` pointing back to the facade contract.
- [x] Verify `npm run check:cycles` still passes after comment-only changes.

### Phase 4: Add Runtime Architecture Orientation

- [x] Add a short orientation comment to `src/main/Main.ts` explaining its role as the feature/module bootstrap registry.
- [x] Add a short orientation comment to `src/Posting/QR.ts` summarizing the Quick Reply singleton responsibilities.
- [x] Review `src/platform/$.ts` and clarify its local jQuery-like helper contract where useful.
- [x] Review `src/Monitoring/ThreadUpdater.ts` and document the update/error/retry flow where current comments are insufficient.
- [x] Review `src/site/SW.yotsuba.tsx` and document the site-adapter responsibilities.
- [x] Review `src/Linkification/Embedding.tsx` and document the embed/title-fetching service registry if needed.
- [x] Keep comments focused on non-obvious ownership, ordering, browser quirks, and external service behavior.

### Phase 5: Document TypeScript Migration State

- [x] Count or list current `@ts-nocheck` files and identify the largest/highest-risk ones.
- [x] Add central guidance for when `@ts-nocheck` is acceptable during migration.
- [x] Document expected steps for removing `@ts-nocheck` from a file.
- [x] Call out known JS interop patterns that make type checking difficult.
- [x] Link this guidance from `CONTRIBUTING.md` or the relevant conductor docs.

### Phase 6: Clean Legacy Comment Noise

- [x] Inventory `decaffeinate suggestions` blocks in `src/`.
- [x] Remove blocks that only repeat generic decaffeinate output and no longer guide maintenance.
- [x] Preserve or replace any block that contains current, actionable migration context.
- [x] Prefer module-level comments that explain current behavior over historical conversion notes.
- [x] Run a grep for `decaffeinate suggestions` and confirm only intentional occurrences remain.

### Phase 7: Document Tooling Assumptions

- [x] Add or update comments in `tools/check-cycles.js` describing supported import syntax and ignored edges.
- [x] Document that type-only imports are skipped by the cycle checker.
- [x] Add or update build-pipeline notes for `tools/rollup.js`, especially `-platform`, `-min`, `-no-format`, and `-test`.
- [x] Cross-check `README.md` build options against actual `package.json` scripts and `tools/rollup.js` flags.
- [x] Confirm docs mention that build verification may change `builds/` artifacts and those should be reverted unless intentionally releasing.

### Phase 8: Verification and Commit Checklist

- [x] Run `npm run check:cycles`.
- [x] Run `npm run build` if source comments or tooling docs touch bundled source files.
- [x] Run `rtk git diff --check` or equivalent whitespace validation.
- [x] Review `git diff` for accidental generated changes.
- [x] Confirm only intended docs/comment files changed.
- [x] Commit with a subject like `Document project maintenance gaps` or split by docs/source-comment scope.

## Comprehensive Code Documentation

### Goal
Document the largest and most complex files in the codebase using sub-agents.

### Tasks
- [x] Document `src/General/Index.js` (Assigned to sub-agent)
- [x] Document `src/Monitoring/ThreadWatcher.ts` (Assigned to sub-agent)
- [x] Document `src/General/Settings.tsx` (Assigned to sub-agent)