# 4chan XTd Project Context

4chan XTd is a userscript and browser extension that enhances anonymous imageboards (primarily 4chan). It is a migration of the original [4chan X](https://github.com/ccd0/4chan-x) from CoffeeScript to TypeScript/JavaScript.

## Project Overview

- **Main Technologies:** TypeScript, JavaScript, Rollup, JSX (custom renderer).
- **Architecture:** The project is structured as a monolithic userscript/extension. It uses a custom build process to bundle various modules into a single userscript file or a Chrome extension (CRX).
- **Entry Point:** `src/main/Main.js`
- **Global Context:** The `src/globals/globals.ts` file defines core global objects used throughout the project:
  - `g`: Global state (versions, boards, threads, posts, sites).
  - `Conf`: Configuration settings.
  - `E`: HTML escaping utility.
  - `d`, `doc`: Shortcuts for `document` and `document.documentElement`.
  - `c`: Shortcut for `console`.

## Key Directories

- `src/`: Core source code.
  - `Archive/`: Archive-related functionality (redirection, restoring deleted posts).
  - `classes/`: Fundamental entities like `Board`, `Thread`, `Post`, and `Notice`.
  - `config/`: Configuration defaults and user CSS.
  - `css/`: Stylesheets for various 4chan themes and internal UI.
  - `Filtering/`: Post and thread hiding logic.
  - `General/`: UI components like Settings, Index, and Header.
  - `globals/`: Shared utilities and constants, including the custom JSX renderer (`jsx.ts`).
  - `Images/`: Image-related features (Gallery, Hover, Expand, Sauce).
  - `Linkification/`: Embedding and linkifying text.
  - `main/`: Initialization and main entry point.
  - `Menu/`: Context menu links and logic.
  - `Miscellaneous/`: Various independent features (Keybinds, Time, CustomCSS, etc.).
  - `Monitoring/`: Background tasks like Thread Updater and Thread Watcher.
  - `platform/`: Platform-specific abstractions (DOM helpers, cross-origin requests).
  - `Posting/`: Quick Reply (QR) and posting logic.
  - `Quotelinks/`: Quotelink processing and previews.
  - `site/`: Site-specific logic (4chan, various "alt-chans").
- `tools/`: Build scripts and custom Rollup plugins.
- `builds/`: Output directory for compiled scripts and extensions.

## Building and Running

The project uses a custom build script located at `tools/rollup.js`.

### Key Commands

- `npm install`: Install dependencies.
- `npm run build`: Standard build (userscript and CRX).
- `npm run build:userscript`: Build only the userscript version.
- `npm run build:crx`: Build only the Chrome extension version.
- `npm run build:min`: Build minified versions.
- `npm run build:all`: Build everything (minified and non-minified).

### Build Options

Arguments can be passed to the build script (e.g., `node ./tools/rollup -min`):
- `-min`: Minify the output.
- `-platform=[userscript|crx]`: Target a specific platform.
- `-no-format`: Skip source formatting (faster build).
- `-test`: Include tests in the build.

## Development Conventions

- **Language:** TypeScript is preferred for all new files.
- **JavaScript to TypeScript Migration:** When converting a `.js` file to `.ts`, use a separate commit for the rename to preserve Git history.
- **JSX:** This project uses a **custom JSX renderer** (`src/globals/jsx.ts`).
  - Import `h` (default) and `hFragment` from `../globals/jsx`.
  - Attributes use HTML naming (e.g., `class` instead of `className`).
  - JSX elements return an `EscapedHtml` object `{ innerHTML: string, [isEscaped]: true }`.
- **Global Objects:** Always refer to `g`, `Conf`, etc., from `src/globals/globals.ts` for state management.
- **Platform Abstraction:** Use the helpers in `src/platform/` (like `$`, `$$`, `$.ajax`) for DOM manipulation and networking to ensure cross-platform compatibility.
- **Coding Style:** Follow existing patterns. The project has a `.jshintrc` for legacy JS, but TypeScript should follow the `tsconfig.json` settings.
- **Tests:** Some files contain `#region tests_enabled` blocks for test-only code. Use the `-test` build flag to include them.

## Contribution Workflow

1. Edit files in `src/`.
2. Run `npm run build`.
3. Install the resulting script from `builds/` into a userscript manager (like Violentmonkey) to test.
4. Verify changes on the target imageboards.
