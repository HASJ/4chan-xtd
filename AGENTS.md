# Repository Guidelines

## Project Structure & Module Organization

4chan XTd is a Node-built userscript and browser-extension project. Edit source files in `src/`; do not edit generated outputs in `builds/`. Static images and UI assets live in `img/`. Build scripts, Rollup plugins, signing helpers, and release utilities live in `tools/`. Top-level metadata such as `package.json`, `version.json`, `README.md`, `CHANGELOG.md`, and `CONTRIBUTING.md` define package behavior and project documentation.

## Build, Test, and Development Commands

Install dependencies with `npm install` on Node 16 or newer.

- `npm run build`: builds the default development output.
- `npm run build:userscript`: builds the userscript target.
- `npm run build:crx`: builds the browser extension target.
- `npm run build:min`: builds a minified userscript.
- `npm run build:all`: builds minified userscript, unminified userscript, and CRX outputs.

After building, load the generated artifact from `builds/` into the relevant userscript manager or browser profile and manually verify the changed behavior.

## Coding Style & Naming Conventions

Use TypeScript for new files. If converting an existing JavaScript file to TypeScript, keep the rename/conversion in a separate commit so file history remains trackable. The project uses ES modules, ES2020 targets, LF newlines, and custom JSX factories (`h` and `hFragment`) from `tsconfig.json`. Match nearby naming and formatting conventions; many modules use PascalCase file names for feature classes, for example `src/classes/Board.ts`.

## Testing Guidelines

There is no dedicated test runner or test directory in the current package scripts. Treat `npm run build` and the relevant platform build as required verification. For behavior changes, test in a fresh browser profile when possible and include browser, extension/userscript manager, and script versions in bug reports or PR notes.

## Commit & Pull Request Guidelines

Recent history uses concise, release-oriented commit subjects such as `Release v2.26.12: Fix captcha capture race condition` and `Build v2.26.9 release artifacts from source`. Use direct, imperative summaries that name the affected behavior. Pull requests should describe the change, list reproduction or verification steps, link related issues, and include screenshots or console output for UI and browser-specific fixes.

## Security & Configuration Tips

Do not commit private browser profiles, exported personal settings, credentials, or signing keys. When sharing exported settings for debugging, remove sensitive values such as personas before attaching them.
