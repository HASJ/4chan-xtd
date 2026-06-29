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

- [ ] No dynamic `Proxy` is used for QR/captcha communication.
- [ ] Captcha modules depend on an explicit, named facade API.
- [ ] The facade exposes only the QR fields and methods captcha actually needs.
- [ ] The QR/captcha source graph remains acyclic.
- [ ] `npm run check:cycles`, `npm run build`, `npm run build:userscript`, and `npm run build:crx` pass.
- [ ] Generated files under `builds/` are reverted after verification.

### Phase 1: Inventory the Existing Contract

- [ ] List every `QR.*` access in `src/Posting/Captcha.js`.
- [ ] List every `QR.*` access in `src/Posting/Captcha.t.js`.
- [ ] Group accesses into categories:
  - [ ] QR lifecycle methods: `focus`, `submit`, `error`.
  - [ ] QR captcha implementation reference: `captcha.setup`.
  - [ ] QR request/posting state: `req`, `posts`, `cooldown`.
  - [ ] QR DOM nodes: `nodes.el`, `nodes.com`, `nodes.status`.
  - [ ] QR layout operations: captcha classes, focus checks, position fixes.
- [ ] Confirm whether each access is read-only, write-only, or mutating nested state.
- [ ] Identify calls that can become semantic methods instead of raw state reads.

### Phase 2: Design the Explicit Facade

- [ ] Create a new `src/Posting/QRCaptchaBridge.ts` or replace `QRBridge.ts` with explicit exports.
- [ ] Define a registered implementation object with named methods.
- [ ] Avoid exporting the full QR object.
- [ ] Include fallback no-op behavior for methods called before QR registration only where safe.
- [ ] Prefer semantic names over exposing broad state.

Candidate facade methods:

- [ ] `registerQRCaptchaBridge(bridge)`.
- [ ] `getQRPosts()`.
- [ ] `getFirstQRPost()`.
- [ ] `hasActiveQRRequest()`.
- [ ] `isQRAutoCooldown()`.
- [ ] `setQRAutoCooldown(enabled)`.
- [ ] `getQRNodes()`.
- [ ] `getQRRoot()`.
- [ ] `getQRCommentInput()`.
- [ ] `getQRStatusInput()`.
- [ ] `isQROpen()`.
- [ ] `focusQR()`.
- [ ] `focusQRComment()`.
- [ ] `focusQRStatus()`.
- [ ] `showQRError(error, focusOverride)`.
- [ ] `submitQR()`.
- [ ] `setupCurrentCaptcha(focus)`.
- [ ] `addQRClass(...classes)`.
- [ ] `removeQRClass(...classes)`.
- [ ] `insertCaptchaRoot(root)`.

### Phase 3: Replace `Captcha.js` Call Sites

- [ ] Replace `QR.req` with `hasActiveQRRequest()`.
- [ ] Replace `QR.posts.length` with `getQRPosts().length` or a semantic helper.
- [ ] Replace `QR.posts[0]` with `getFirstQRPost()`.
- [ ] Replace `QR.error(...)` with `showQRError(...)`.
- [ ] Replace `QR.captcha.setup(...)` with `setupCurrentCaptcha(...)`.
- [ ] Replace direct QR DOM class mutations with `addQRClass` and `removeQRClass`.
- [ ] Replace direct comment/status focus calls with facade focus methods.
- [ ] Replace direct QR node containment checks with small facade helpers if repeated.
- [ ] Run `npm run check:cycles` after this phase.

### Phase 4: Replace `Captcha.t.js` Call Sites

- [ ] Replace `QR.nodes.el` access with `getQRRoot()` or semantic helpers.
- [ ] Replace `QR.nodes.com` access with `getQRCommentInput()`.
- [ ] Replace `QR.posts[0]` access with `getFirstQRPost()`.
- [ ] Replace `QR.posts.length` access with `getQRPosts().length` or a semantic helper.
- [ ] Replace `QR.cooldown.auto` reads with `isQRAutoCooldown()`.
- [ ] Replace `QR.submit()` with `submitQR()`.
- [ ] Replace direct comment focus restoration checks with facade helpers where practical.
- [ ] Run `npm run check:cycles` after this phase.

### Phase 5: Register the Facade in `QR.ts`

- [ ] Replace `registerQR(QR)` with `registerQRCaptchaBridge({...})`.
- [ ] Map each facade method to the smallest QR implementation detail needed.
- [ ] Keep all QR implementation logic in `QR.ts`.
- [ ] Do not import `Captcha.js` or `Captcha.t.js` from the facade.
- [ ] Confirm `QR.ts -> Captcha.js -> Captcha.t.js -> facade` does not create a back edge.

### Phase 6: Tighten Types

- [ ] Add TypeScript interfaces for the bridge object.
- [ ] Type the required QR node subset.
- [ ] Type the required QR post subset.
- [ ] Keep JS captcha modules compatible with the typed facade.
- [ ] Avoid `any` except where current JS interop makes it unavoidable.
- [ ] Run `npm run build` and fix type or Rollup warnings introduced by the facade.

### Phase 7: Verification

- [ ] Run `npm run check:cycles`.
- [ ] Run `npm run build`.
- [ ] Run `npm run build:userscript`.
- [ ] Run `npm run build:crx`.
- [ ] Confirm Rollup prints no circular dependency warnings.
- [ ] Revert generated files under `builds/` after verification.
- [ ] Run `rtk git status --short` and confirm only intended source files remain changed.

### Phase 8: Manual QA Targets

- [ ] Open QR on a thread page.
- [ ] Open QR on an index page.
- [ ] Verify v2 captcha setup, focus behavior, reload, and completion.
- [ ] Verify TCaptcha setup, focus restoration, strip UI, and completion.
- [ ] Verify `Post on Captcha Completion` still submits when expected.
- [ ] Verify captcha auto-loading when QR contains text, file, or multiple posts.
- [ ] Verify QR close destroys captcha UI.
- [ ] Verify changing the selected thread refreshes TCaptcha thread data.
- [ ] Verify captcha error paths still display through QR notifications.

### Phase 9: Commit Checklist

- [ ] Review `git diff` for accidental generated changes.
- [ ] Confirm `npm run check:cycles` passes.
- [ ] Confirm the three build commands pass.
- [ ] Commit with a subject like `Make QR captcha bridge explicit`.
