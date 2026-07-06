# Engineering Principles Codebase Audit

## Overview
This document contains an audit of the repository based on core engineering principles.

## 🔴 Critical — Stores, Hooks, API Layer

### 1. Single Responsibility Principle (SRP)
- **Violation:** Many files are extremely large and appear to handle multiple domain concerns (e.g., `src/Posting/QR.ts` with 2400+ lines, `src/main/Main.ts` with ~1000 lines). These monolithic files act as "God Components" dealing with UI presentation, local storage, API requests, and event handling simultaneously.

### 2. Dependency Inversion Principle (DIP)
- **Violation:** Direct access to `localStorage` without a storage driver abstraction. Found multiple instances:
  - `src/Filtering/ThreadHiding.js` directly interacts with `localStorage`.
  - `src/Images/DownloadAll.ts` directly interacts with `localStorage.getItem()`.

### 3. Resilience & Graceful Degradation
- **Violation:** Unguarded `JSON.parse()` usage on local storage contents which could throw an exception if the data is corrupted, crashing the application component.
  - `src/Images/DownloadAll.ts:21`
  - `src/Filtering/ThreadHiding.js:42, 53`

### 4. Immutability in State Updates
- **Violation:** Widespread mutation of arrays and objects. Over 250 instances of `.push()` exist throughout the codebase. While some may be local to functional scopes, many mutate shared state.
  - Usage of `Object.assign(Conf, defaults);` in `src/General/Settings.tsx:944` directly mutates the configuration object instead of returning a new reference.

### 5. Verification & Quality Principles
- *Note:* This audit doesn't dynamically execute tests, but the current state indicates several tight couplings that make unit testing deterministic logic difficult. Test coverage metrics should be verified.

## 🟡 Important — Components, Utilities

### 6. Open-Closed Principle (OCP)
- **Observation:** There are several `switch` statements (around 26 instances) used across the codebase that may violate OCP if they are used to handle varying types (e.g., in UI handlers) rather than strategy patterns.

### 7. Interface Segregation Principle (ISP)
- **Observation:** Due to the large nature of components like `QR` (Quick Reply) and `Settings`, they likely consume huge globally scoped settings instead of specific subsets.

### 8. Liskov Substitution Principle (LSP)
- *Note:* Further dynamic analysis would be required to find definitive LSP violations in the TypeScript types, though the reliance on `any` (or lack of strict types in JS files) makes guarantees weak.

### 9. Don't Repeat Yourself (DRY)
- **Observation:** There appear to be overlapping concerns in `src/Posting/Captcha.js` and `src/Posting/Captcha.t.js`, which seem to duplicate focus restoration and DOM handling logic.

### 10. Law of Demeter (LoD)
- **Violation:** Extensive deep property traversal detected across the codebase (e.g., `QR.selected.nodes.spoiler.click()`, `this.nodes.el.parentNode.getBoundingClientRect()`), heavily coupling components to the internal DOM structure of others.
  - `src/Posting/QR.ts` contains multiple examples of deep property access.
  - `src/main/Main.ts` traverses `SW.yotsuba.regexp.pass.test`.

## 🟢 Advisory — New Feature Design

### 11. Keep It Simple, Stupid (KISS)
- **Violation:** The sheer size of several files indicates over-complexity.
  - `src/Posting/QR.ts` (2474 lines)
  - `src/General/Index.js` (1301 lines)
  - `src/config/Config.ts` (1247 lines)
  - `src/Monitoring/ThreadWatcher.ts` (1107 lines)

### 12. You Ain't Gonna Need It (YAGNI) & Convention over Configuration (CoC)
- *Note:* Further feature-specific product review is needed to assess YAGNI and CoC fully. However, the `Config.ts` file being over 1200 lines long suggests a heavy reliance on configuration rather than sensible defaults.
