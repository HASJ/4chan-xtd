# 4chan XTd Technology Stack

## Core Technologies
- **TypeScript:** The primary language for development, ensuring type safety and maintainability.
- **JavaScript (ES2020+):** Legacy codebase support and modern JS features.
- **JSX:** Utilized for building UI components via a custom renderer.

## Build & Tooling
- **Rollup:** Used for bundling the modular source files into single-file outputs.
- **Custom Build System:** A specialized Rollup configuration and script (`tools/rollup.js`) tailored for Userscript and CRX requirements.
- **NPM:** Dependency management.

## Platforms & Targets
- **Userscript:** Targeted for script managers like Violentmonkey and Tampermonkey.
- **Chrome Extension (CRX):** Targeted for Chromium-based browsers.

## APIs & Data
- **Greasemonkey APIs (GM_*):** Used for cross-origin requests, persistent storage, and opening tabs across different platforms.
- **4chan API:** The primary data source for threads, posts, and board configuration.
- **External Archive APIs:** Used to fetch historical and deleted post data.
