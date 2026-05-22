# Specification: TypeScript Migration: Identify and Convert Urgent Modules

## Goal
Identify the most critical remaining JavaScript modules in the `src/` directory and convert them to TypeScript. This improves type safety, maintainability, and aligns with the project's core objective of a full TS migration.

## Scope
- Audit of remaining `.js` files in `src/`.
- Selection of at least 2 high-priority targets.
- Full conversion of selected targets to `.ts`.
- Verification of build integrity and basic functionality.

## Success Criteria
- Selected modules are successfully converted to `.ts`.
- The project builds without errors using `npm run build`.
- Functional tests (if applicable) for the migrated modules pass.
