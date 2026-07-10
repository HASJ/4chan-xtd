# 4chan XTd Architecture

4chan XTd is built entirely with TypeScript to ensure strict type safety, modularity, and long-term maintainability. This document provides an overview of the architecture, build system, and core design patterns.

## Code Structure

The source code is organized into logical modules under the `src/` directory:

- **`src/General/`**: Contains core singletons such as `Header`, `UI`, `Settings`, and `Build`. These modules handle extension-wide state and high-level UI components.
- **`src/Posting/`**: Contains the Quick Reply (`QR`) logic, `Captcha` handling, and post submission routines.
- **`src/Images/`**: Houses logic for image expansion, gallery mode, WebM support, and media conversion features.
- **`src/Filtering/`**: Manages post filtering, highlighting, and the filter menu.
- **`src/Archive/`**: Handles fetching, parsing, and redirecting to third-party archives (fuuka/foolfuuka), and restoring deleted posts from them.
- **`src/Miscellaneous/`**: Contains various independent features like thread updating, custom CSS, and keyboard shortcuts.
- **`src/types/` & `src/classes/`**: Defines the TypeScript types and core object structures (`Post`, `Thread`, `Board`, `DataBoard`, `Fetcher`, `SimpleDict`, ...) that are used across different modules to enforce typing.

## Design Patterns

### Startup flow

`src/main/Main.ts` is the entry point. Once the document is ready, `Main.init()` rejects duplicate/frame execution, loads saved configuration into `Conf`, initializes the selected `Site` adapter, creates the board/thread/post collections, and then initializes enabled features. After the DOM is ready it parses the current thread, index, or catalog. Feature initialization errors are routed through Main's error handler so one failed feature does not silently stop the rest of startup.

### Singleton Modules
The vast majority of the extension's features are designed as Singleton objects. Modules like `Header`, `QR`, and `UIState` export a single instance that maintains its own state and methods. 

**Important:** When passing singleton methods as callbacks to DOM events (e.g., `$.on(el, 'click', Header.toggleBarVisibility)`), the function must be bound to the object or explicitly call `Header.foo()` to prevent losing the `this` context. The refactor to TypeScript ensures that these contexts are strictly preserved using the named singleton references (e.g., `Header.boardList`) rather than relying on dynamic `this` evaluation inside callbacks.

### Global and adapter boundaries

`src/globals/globals.ts` owns the narrow mutable globals: `Conf` for persisted configuration and `g` for the selected site, view, boards, threads, and posts. Production code should initialize these through startup; tests may construct only the small state required by the public behavior being exercised.

Site adapters in `src/site/` isolate site-specific URLs, selectors, DOM parsing, and JSON normalization. Shared features should consume the selected adapter through `g.SITE` instead of branching on a hostname or duplicating selector logic. Yotsuba and Tinyboard fixture data belongs in `src/test/fixtures/`, not in production adapters.

### DOM Utility (`$.ts`)
The `src/platform/$.ts` file provides a lightweight wrapper around common DOM manipulation functions, event listeners, and asynchronous helpers (like `$.onExists`). It eliminates the need for heavy external libraries like jQuery while providing a consistent API for DOM interactions.

## Build System

The extension uses a custom build pipeline powered by **Rollup** and the **TypeScript Compiler (tsc)**.

1. **`builds/ts-tools/`**: The build configuration scripts themselves are written in TypeScript and are compiled first.
2. **`npm run build`**: This command triggers the entire pipeline. It builds the toolchain, reads `package.json` for the current version, and compiles all source modules from `src/` into the final userscript files located in `builds/`.
3. **Compilation**: `tsconfig.json` (extending `tsconfig.base.json`) disables `allowJs`/`checkJs`, so no untyped or loosely-typed JavaScript can make its way into the final bundle. `strictNullChecks`/`noImplicitAny` are not globally enabled yet; null/undefined-safety is enforced file-by-file as modules are cleaned up (see below), not project-wide.

### Build and test separation

Vitest runs TypeScript tests in jsdom using `vitest.config.ts`; its shared setup supplies minimal userscript/browser boundary shims. The small fixture set is deliberately synthetic and must return fresh data for each test. Tests exercise public behavior and adapter output, not line-by-line singleton internals.

The Rollup build strips `// #region tests_enabled` blocks by default through `tools/rollup-plugin-remove-test-code.ts`. Passing `-test` retains those blocks for the explicit build-test path. Production builds must not depend on test-only imports or behavior.

## Type Safety & Lint Cleanup

The codebase is being brought up to SonarQube's TypeScript rule set incrementally, module by module (tracked via `git log --grep "resolve SonarQube findings"`). Recurring patterns applied during this cleanup:

- Guard `g.posts`/`g.threads`/`g.BOARD`/etc. (declared optional on the global `g` object) with a non-null assertion (`g.posts!`) or an explicit check at each access site, rather than widening the global's type.
- Give `this` an explicit type on bare `function(){}` callbacks passed to DOM/XHR APIs (`function(this: XMLHttpRequest) {...}`) instead of relying on implicit `any`.
- Replace `this`-captured-as-`that` closures with `const fn = this.method.bind(this);` and call `fn(...)` from the nested callback.
- Flatten functions flagged for high cognitive complexity by extracting one helper per responsibility, using early `return`/`continue` to avoid adding nesting depth back inside the new helper (a straight split into helpers with the same nesting is not sufficient — cognitive complexity is driven by nesting depth, not line count).
- Findings that are false positives for this codebase (e.g. a `static` field SonarQube suggests marking `readonly` that is intentionally lazily mutated) are left as-is with a one-line justification in the fixing commit rather than "fixed" incorrectly.

By adhering to these patterns, 4chan XTd maintains high reliability and developer ergonomics as it continues to evolve.

## Misc notes

- The project aims for zero circular dependencies in the source graph. Run `npm run check:cycles` to verify.
- The `es2020` target was chosen for optional chaining support.
- `@violentmonkey/types` was chosen over `@types/greasemonkey` because the latter only declares the `GM` object, not the `GM_*` functions.
