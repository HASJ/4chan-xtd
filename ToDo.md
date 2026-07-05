# ToDo

## Ponytail Audit Cleanup

### Goal
Remove the audit-confirmed repo bloat without changing runtime behavior. Each worker owns a small isolated diff; the supervisor coordinates ordering, reviews results, and runs final verification.

### Shared Rules
- [ ] Do not edit builds/. It is generated and ignored.
- [ ] Keep each worker diff scoped to assigned files.
- [ ] Before deleting any file, grep for its filename and exported symbols.
- [ ] Record files changed, commands run, and any skipped items.
- [ ] Use rtk for shell commands.
- [ ] Prefer deletion over replacement unless docs need a live pointer.

### Supervisor / Orchestrator
Model: GPT 5.5 high.

Responsibilities:
- [x] Create task branch ponytail-audit-cleanup.
- [x] Save this delegation plan in ToDo.md.
- [x] Start sub-agents on GPT 5.4 medium where tooling allows.
- [ ] Keep workers scoped; prevent overlapping edits.
- [ ] Review each worker result before integration.
- [ ] Run final verification after worker diffs land.
- [ ] Summarize net line, dependency, and asset reduction.

### Worker A: Historical Docs And Assets
Scope: original 4chan X CHANGELOG.md, img/, CHANGELOG.md.

Checklist:
- [ ] Confirm CHANGELOG.md only links to original 4chan X CHANGELOG.md for upstream history.
- [ ] Replace the local upstream changelog link with an external upstream link if useful.
- [ ] Delete original 4chan X CHANGELOG.md.
- [ ] Search all repo files for img references.
- [ ] Delete old screenshot/history-only files from img/.
- [ ] Keep any image with a live non-history reference.
- [ ] Run a grep for original 4chan X CHANGELOG and img references.
- [ ] Record line and byte reduction.

Expected result: large historical docs/assets deletion, no build impact.

### Worker B: Stale Planning Scaffolding
Scope: ToDo.md, conductor/tracks.md, conductor/tracks/ts_migration_20260522/.

Checklist:
- [ ] Preserve this active cleanup plan in ToDo.md.
- [ ] Confirm old completed checklist content is not needed elsewhere.
- [ ] Confirm the conductor migration track is stale or archived.
- [ ] Delete conductor/tracks/ts_migration_20260522/ if no active process depends on it.
- [ ] Update conductor/tracks.md to remove or mark the track archived.
- [ ] Run a grep for ts_migration_20260522 and ToDo.md references.

Expected result: stale process state removed while this active plan remains.

### Worker C: Dead Build Tooling
Scope: tools/rollup-plugin-remove-decaffeinate-comments.js, tools/rollup.js, README.md.

Checklist:
- [ ] Grep for decaffeinate suggestions and decaffeinate across src, tools, README, CHANGELOG, ToDo, and conductor.
- [ ] Confirm no source files contain decaffeinate suggestion blocks.
- [ ] Remove removeDecaffeinateComments import from tools/rollup.js.
- [ ] Remove its plugin entry from the Rollup plugin list.
- [ ] Delete tools/rollup-plugin-remove-decaffeinate-comments.js.
- [ ] Update README text for -no-format so it no longer mentions decaffeinate stripping.
- [ ] Run rtk npm run build.
- [ ] Run rtk npm run build:min.

Expected result: build behavior unchanged because there are no comments left to strip.

### Worker D: Dead Source And Helpers
Scope: src/classes/Connection.ts, src/meta/fbegin.js, src/meta/fend.js, src/meta/newline.js, src/platform/$.ts.

Checklist:
- [ ] Grep for Connection, fbegin, fend, newline, and debounce across src, tools, and README.
- [ ] Confirm Connection has no imports or callers.
- [ ] Delete src/classes/Connection.ts.
- [ ] Confirm Rollup does not use fbegin.js, fend.js, or newline.js.
- [ ] Delete the three obsolete meta wrapper files.
- [ ] Confirm $.debounce has zero callers.
- [ ] Remove the unused $.debounce function block from src/platform/$.ts.
- [ ] Keep helpers.debounce; it is used.
- [ ] Run rtk npm run check:cycles.
- [ ] Run rtk npm run build.

Expected result: dead runtime source removed only.

### Worker E: Dependency Cleanup
Scope: package.json, package-lock.json.

Checklist:
- [ ] Grep for chrome-webstore-upload, webstore, and upload in package files, tools, and src.
- [ ] Confirm no scripts or imports use chrome-webstore-upload.
- [ ] Remove it with rtk npm uninstall chrome-webstore-upload.
- [ ] Confirm lockfile updates only remove that package and unused transitives.
- [ ] Run rtk npm ls chrome-webstore-upload.
- [ ] Run rtk npm run build.

Expected result: one direct dev dependency removed, plus transitive install weight.

### Worker F: Stale Release Helpers
Scope: tools/sign.sh, tools/stats.js, docs if they mention either.

Checklist:
- [ ] Grep for sign.sh, stats.js, testbuilds, tmp-crx, and pack-extension.
- [ ] Confirm tools/sign.sh targets nonexistent testbuilds/.
- [ ] Delete tools/sign.sh.
- [ ] Confirm tools/stats.js is not documented or scripted.
- [ ] Delete tools/stats.js.
- [ ] If release docs mention either, remove or replace with current release steps.

Expected result: unmaintained ad hoc release helpers removed.

### Integration Checklist
Run after worker diffs land.

- [ ] Run rtk git status --short.
- [ ] Grep for removed symbols and files: Connection, fbegin, fend, newline, removeDecaffeinateComments, chrome-webstore-upload, sign.sh, stats.js, original 4chan X CHANGELOG.
- [ ] Run rtk npm run check:cycles.
- [ ] Run rtk npm run build.
- [ ] Run rtk npm run build:userscript.
- [ ] Run rtk npm run build:crx.
- [ ] Run rtk git diff --check.
- [ ] Review deleted files for accidental live asset loss.
- [ ] Summarize final line, dependency, and asset reduction.

### Suggested Order
- [ ] Start Workers A, B, and F immediately.
- [ ] Start Workers C, D, and E immediately if they can work in isolated worktrees or patch bundles.
- [ ] Integrate source, tooling, and dependency changes before final builds.
- [ ] If a build fails, isolate the smallest worker diff that caused it.
