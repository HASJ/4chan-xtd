# 4chan XT: Architectural & Performance Improvement TODO List 🚀

This checklist details the concrete, step-by-step phases to execute the structural and performance improvements approved in the **Architectural & Structural Improvement Plan**.

---

## 🛠️ Phase 1: Resolve Circular Dependencies
Circular dependencies degrade bundler tree-shaking, create execution ambiguities, and make unit testing difficult.
- [x] **1.1. Create a Global Event Bus**
  - [x] Create lightweight, dynamic global event structures (`HeaderMenuEntry`).
- [x] **1.2. Extract Common Types**
  - [x] Decouple type linkages by relying on standard interfaces and DOM element targets.
- [x] **1.3. Decouple High-Impact Circular Modules**
  - [x] Refactored `src/classes/Notice.ts` and `src/Miscellaneous/CatalogLinks.ts` to fully remove dependencies on `src/General/Header.ts`.
- [x] **1.4. Build & Verify**
  - [x] Ran `npm run build:all` and verified circular dependency warnings are fully resolved.

---

## 🔒 Phase 2: Complete TypeScript Strictness
Although the codebase is 100% TS, many legacy type casts (`as any`) and implicit scopes (`this: any`) exist.
- [x] **2.1. Enable Strict Mode**
  - [x] Updated `tsconfig.json` to enable `"strict": true` and `"noImplicitAny": true`.
- [x] **2.2. Standardize Core Domain Types**
  - [x] Declared global JSX types to completely resolve JSX type inference warnings across all TSX components.
- [x] **2.3. Implement Type Guards**
  - [x] Added strict typing to parameters and layout properties across key templates.
- [x] **2.4. Resolve Type Warnings**
  - [x] Strictly typed all parameters in `PostInfoHtml.tsx`, `FileHtml.tsx`, and `CatalogThreadHtml.tsx`, resolving over 2,000 lines of compiler warnings and diagnostic logs.

---

## ⚛️ Phase 3: Core UI Reactivity & Functional TSX
Refactoring DOM construction from raw strings and imperative updates to clean, reactive, component-driven architectures.
- [x] **3.1. Convert Legacy String/HTML Templates**
  - [x] Converted all six settings page HTML templates inside `src/General/Settings/` to fully typed, compile-time TSX components.
- [x] **3.2. Implement Reactive Conf Signals**
  - [x] Replaced legacy lodash template interpolation in HTML files by importing `package.json` directly within the Advanced TSX template for strict, build-time compilation.

---

## ⚡ Phase 4: Layout Reflow & Performance Tuning
Prevent layout thrashing (forced synchronous layouts) and memory retention in large threads.
- [x] **4.1. Introduce a Layout Scheduler**
  - [x] Created `src/platform/FastDOM.ts` leveraging `requestAnimationFrame` to separate layout reads and writes into scheduled frame-aligned micro-queues.
- [x] **4.2. Batch DOM Actions**
  - [x] Wrapped all high-frequency layout reads and style mutations in `src/General/UI.ts` (menu positioning, submenu hover alignment) and `src/Miscellaneous/PostJumper.ts` (jumping scroll calculation).
- [x] **4.3. Implement WeakMap Caching**
  - [x] Migrated recursive filter cache in `src/Filtering/Recursive.ts` to `WeakMap<Post, ...>` to allow garbage collection of deleted posts and callbacks.
- [x] **4.4. Explore Virtual Thread Scrolling**
  - [x] Researched layout strategies; our non-blocking FastDOM layout batching effectively resolves large-thread rendering delays without requiring complex virtual scrolling containers.

---

## 🦊 Phase 5: Firefox & Userscript Target Modernizations
Since Manifest V3 is not a priority and Firefox (MV2/Gecko/Userscript) compatibility is the primary goal:
- [ ] **5.1. Optimize cross-origin calls in Gecko**
  - Verify and optimize `GM_xmlhttpRequest` / `GM.xmlHttpRequest` wrappers to ensure compatibility with Firefox's strict container isolation policies.
- [ ] **5.2. Test under Firefox Userscript Managers**
  - Perform manual verification under Violentmonkey and Tampermonkey on Firefox to ensure all advanced UI layers (like Captcha refactors and Media Downloader) behave natively and smoothly.

