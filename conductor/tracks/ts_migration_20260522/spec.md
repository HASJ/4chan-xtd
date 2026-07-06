# Specification: TypeScript Migration & Circular Dependency Resolution (Archived)

> **Note:** This track has been archived. The primary goal of resolving circular dependencies was achieved, and the source graph is now verified using `npm run check:cycles`. The build process can be run using `npm run build` (or `npm run build:userscript`, `npm run build:crx`).

## Goal
Identify the most critical remaining JavaScript modules in the `src/` directory and convert them to TypeScript. Simultaneously, identify and resolve circular dependencies to improve architectural stability and ensure correct initialization order.

## Scope
- [x] Audit of remaining `.js` files in `src/`.
- [x] Identification of modules involved in circular dependencies.
- [x] Selection of high-priority targets for migration and dependency refactoring.
- [x] Full conversion of selected targets to `.ts`.
- [x] Refactoring to break circular chains (e.g., using dependency injection or shared helper modules).
- [x] Verification of build integrity and functional correctness. (via `npm run build` and `npm run check:cycles`).

## Success Criteria
- [x] Selected modules are successfully converted to `.ts`.
- [x] Circular dependency chains involving the migrated modules are broken. (The entire `src/` graph is now acyclic).
- [x] The project builds without errors using `npm run build`.
- [x] Functional tests for the migrated modules pass.
