# Bug: ESLint Configuration Error

## Metadata
- **Severity**: Medium
- **Affected Session**: Session 2 (Frontend)
- **Component**: ESLint Configuration
- **Date**: 2026-01-17

## Description
ESLint cannot load the `@typescript-eslint/recommended` configuration. This prevents linting from working and reduces code quality enforcement.

## Reproduction Steps
1. Run lint: `npm run lint`
2. Observe configuration error

## Expected Behavior
ESLint should load successfully and enforce code quality rules.

## Actual Behavior
```bash
npm run lint
> next lint

Failed to load config "@typescript-eslint/recommended" to extend from.
Referenced from: C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer\.eslintrc.json
```

## Environment
- ESLint: 8.57.1
- TypeScript ESLint: 8.15.0
- Node: v22.17.0

## Root Cause Analysis
1. **Missing Package**: `@typescript-eslint/eslint-plugin` or `@typescript-eslint/parser` may not be installed
2. **Incorrect Config**: `.eslintrc.json` may reference config that doesn't exist
3. **Version Mismatch**: ESLint plugin versions may be incompatible

## Assigned To
- [x] Session 2 (Frontend)

## Status
- [ ] Open
- [ ] In Progress
- [ ] Fixed - Awaiting Verification
- [ ] Verified - Closed

## Recommended Fix

### Option 1: Install Missing Dependencies
```bash
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### Option 2: Fix ESLint Config
Update `.eslintrc.json` to use correct configuration:

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_"
    }]
  }
}
```

### Option 3: Use Next.js Built-in ESLint (Simplest)
`.eslintrc.json`:
```json
{
  "extends": ["next/core-web-vitals"]
}
```

Then install Next.js ESLint config:
```bash
npm install --save-dev eslint-config-next
```

## Related Files
- `.eslintrc.json`
- `package.json`

## Additional Notes
This is a **MEDIUM** priority issue because:
- It blocks linting workflow
- Reduces code quality enforcement
- But doesn't prevent the app from running

## Verification
After fix, verify:
```bash
npm run lint
# Should run without config errors
npm run lint:fix
# Should auto-fix lint issues
```
