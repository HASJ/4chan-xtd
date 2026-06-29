## Reporting bugs

Bug reports and feature requests for 4chan XTd are tracked at **https://github.com/TuxedoTako/4chan-xtd/issues?q=is%3Aopen+sort%3Aupdated-desc**.

You can submit a bug report / feature request via your Github account.

If you're reporting a bug, the more detail you can give, the better. If I can't reproduce your bug, I probably won't be able to fix it. You can help by doing the following:

1. Include precise steps to reproduce the problem, with the expected and actual results.
2. Make sure your browser, 4chan X, and userscript manager (e.g. Greasemonkey, ViolentMoney, or Tampermonkey) are up to date. **Include the versions you're using in bug reports.**
3. Open your console with Shift+Control+J (⇧⌘J on OS X Firefox, ⌘⌥J on OS X Chromium), and **look for error messages**, especially ones that occur at the same time as the bug. Include these in your bug report. If you're using Firefox, be sure to check the browser console (Shift+Control+J), not just the web console (Shift+Control+K) as errors may not show up in the latter. Messages about "Content Security Policy" are expected and can be ignored.
4. If other people (including me) aren't having your problem, **test whether it happens in a fresh profile**. Here are instructions for [Firefox](https://support.mozilla.org/en-US/kb/profile-manager-create-and-remove-firefox-profiles) and [Chromium](https://developer.chrome.com/devtools/docs/clean-testing-environment).
5. **Please mention any other extensions / scripts you are using.** To check if a bug is due to a conflict with another extension, temporarily disable any other extensions and userscripts. If the bug goes away, turn them back on one by one until you find the one causing the problem.
6. To test if the bug occurs under the default settings or only with specific settings, back up your settings and reset them using the **Export** and **Reset Settings** links in the settings panel. If the bug only occurs under specific settings, upload your exported settings to a site like https://paste.installgentoo.com/, and link to it in your bug report. If your settings contains sensitive information (e.g. personas), edit the text file manually.
7. Test if the bug occurs using the **native extension** with 4chan XTd disabled. If it does, it's likely a problem with 4chan or your browser rather than with 4chan X.

## Development & Contribution

### Get started

- Install [git](https://git-scm.com/), [node.js](https://nodejs.org/), and [npm](https://www.npmjs.com/).
- Clone 4chan XTd: `git clone https://github.com/TuxedoTako/4chan-xtd.git`
  - If this is taking too long, you can add `--depth 100` to fetch only recent history.
  - Alternatively, if you already have a local 4chan X repo, you can add XT as a remote:
    `git remote add xt https://github.com/TuxedoTako/4chan-xtd.git`
- Open the directory: `cd 4chan-xtd`
- Fetch needed dependencies with: `npm install`

### Build and Verify

- Build with `npm run build`. Options are in the readme.
- Check for circular dependencies with `npm run check:cycles`.

### Contribute

- Use TypeScript for new files. If you want to convert a .js file to .ts, use a separate commit so the file history is
  tracked past the rename
- Edit the sources in the src/ directory (not the compiled scripts in builds/).
- Fetch needed dependencies with: `npm install`
- Compile the script with: `npm run build`
- Verify that there are no circular dependencies with: `npm run check:cycles`
- Install the compiled script (found in the builds/ directory), and test your changes.
- **Note**: Generated files under `builds/` should not be edited directly. Revert changes to `builds/` before committing unless you are intentionally creating a release.
- Make sure you have set your name and email as you want them, as they will be published in your commit message:<br>`git config user.name yourname`<br>`git config user.email youremail`
- Commit your changes: `git commit -a`
- Open a pull request on GitHub.

Pull requests to archive.json should be sent upstream: https://github.com/4chenz/archives.json
4chan XTd updates from there automatically.

### More info

Further documentation is available at the wiki for the original 4chan X: https://github.com/ccd0/4chan-x/wiki/Developer-Documentation.
At the moment 4chan XTd doesn't have its own wiki yet, but you can find XTd-specific documentation in the project's internal `GEMINI.md` and `AGENTS.md` context files, as well as comments within the source codebase.

## TypeScript Migration

The project is currently migrating from JavaScript (CoffeeScript-compiled) to TypeScript.

### `@ts-nocheck` Usage
Many files currently begin with `// @ts-nocheck` to bypass type errors temporarily while allowing TypeScript to parse them.
- **When is it acceptable?** It is acceptable to leave `@ts-nocheck` in large, legacy modules during intermediate refactoring (e.g., breaking circular dependencies) if converting the types would block the primary goal.
- **High-risk files:** Core singletons like `src/Posting/QR.ts` or large UI orchestrators still rely heavily on loose types and are high-priority for eventual conversion.

### Removing `@ts-nocheck`
To migrate a file fully:
1. Remove `// @ts-nocheck`.
2. Add necessary type annotations and fix strict type errors reported by the TS compiler.
3. Keep the commit focused on typing; do not bundle behavior changes.

### Known JS Interop Patterns
- The project often builds complex DOM structures using `$.el` and `$.extend`, which can confuse TS about the resulting object's shape.
- Legacy JS modules might implicitly mutate global state or rely on late-bound properties (e.g., `QR.nodes`). Use explicit interfaces or null checks to satisfy TypeScript in these cases.
