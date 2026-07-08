# 4chan XTd Architecture

4chan XTd is built entirely with TypeScript to ensure strict type safety, modularity, and long-term maintainability. This document provides an overview of the architecture, build system, and core design patterns.

## Code Structure

The source code is organized into logical modules under the `src/` directory:

- **`src/General/`**: Contains core singletons such as `Header`, `UI`, `Settings`, and `Build`. These modules handle extension-wide state and high-level UI components.
- **`src/Posting/`**: Contains the Quick Reply (`QR`) logic, `Captcha` handling, and post submission routines.
- **`src/Images/`**: Houses logic for image expansion, gallery mode, WebM support, and media conversion features.
- **`src/Filtering/`**: Manages post filtering, highlighting, and the filter menu.
- **`src/Miscellaneous/`**: Contains various independent features like thread updating, custom CSS, and keyboard shortcuts.
- **`src/types/` & `src/classes/`**: Defines the TypeScript types and core object structures that are used across different modules to enforce strict typing.

## Design Patterns

### Singleton Modules
The vast majority of the extension's features are designed as Singleton objects. Modules like `Header`, `QR`, and `UIState` export a single instance that maintains its own state and methods. 

**Important:** When passing singleton methods as callbacks to DOM events (e.g., `$.on(el, 'click', Header.toggleBarVisibility)`), the function must be bound to the object or explicitly call `Header.foo()` to prevent losing the `this` context. The refactor to TypeScript ensures that these contexts are strictly preserved using the named singleton references (e.g., `Header.boardList`) rather than relying on dynamic `this` evaluation inside callbacks.

### DOM Utility (`$.ts`)
The `src/platform/$.ts` file provides a lightweight wrapper around common DOM manipulation functions, event listeners, and asynchronous helpers (like `$.onExists`). It eliminates the need for heavy external libraries like jQuery while providing a consistent API for DOM interactions.

## Build System

The extension uses a custom build pipeline powered by **Rollup** and the **TypeScript Compiler (tsc)**.

1. **`builds/ts-tools/`**: The build configuration scripts themselves are written in TypeScript and are compiled first.
2. **`npm run build`**: This command triggers the entire pipeline. It builds the toolchain, reads `package.json` for the current version, and compiles all source modules from `src/` into the final userscript files located in `builds/`.
3. **Strict Compilation**: The `tsconfig.json` enforces `strict: true` and disables `allowJs`, ensuring that no untyped or loosely typed JavaScript can make its way into the final bundle.

By adhering to these patterns, 4chan XTd maintains high reliability and developer ergonomics as it continues to evolve.
