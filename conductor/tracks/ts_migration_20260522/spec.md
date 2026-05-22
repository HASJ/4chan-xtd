# Specification: TypeScript Migration & Circular Dependency Resolution

## Goal
Identify the most critical remaining JavaScript modules in the `src/` directory and convert them to TypeScript. Simultaneously, identify and resolve circular dependencies to improve architectural stability and ensure correct initialization order.

## Scope
- Audit of remaining `.js` files in `src/`.
- Identification of modules involved in circular dependencies.
- Selection of high-priority targets for migration and dependency refactoring.
- Full conversion of selected targets to `.ts`.
- Refactoring to break circular chains (e.g., using dependency injection or shared helper modules).
- Verification of build integrity and functional correctness.

## Success Criteria
- Selected modules are successfully converted to `.ts`.
- Circular dependency chains involving the migrated modules are broken.
- The project builds without errors using `npm run build`.
- Functional tests for the migrated modules pass.
