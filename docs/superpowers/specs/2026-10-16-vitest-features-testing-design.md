# High-Performance Vitest & Feature Unit Testing Architecture

**Date**: 2026-10-16  
**Status**: Approved

---

## 1. Executive Summary

This specification outlines the setup of Vitest for testing React 19 UI components in TanStack Start, the mandatory testing rule enforcing `src/features/<feature-name>/__test__/`, the shared testing utilities layer, and the creation of a specialized sub-agent and slash command/skill to ensure high-performance unit testing.

---

## 2. Vitest Setup & Environment

### 2.1 Dependencies

Install the following as `devDependencies`:

- `vitest`: Vite-native test runner.
- `jsdom`: DOM environment for component testing.
- `@testing-library/react`: React 19 component testing primitives.
- `@testing-library/jest-dom`: Custom Jest/Vitest DOM matchers.
- `@testing-library/user-event`: User interaction simulation.
- `vite-tsconfig-paths`: Resolves `@/*` path aliases seamlessly.

### 2.2 Dedicated Configuration (`vitest.config.ts`)

A standalone `vitest.config.ts` is used instead of merging into `vite.config.ts`. This isolates unit tests from the TanStack Start SSR bundler plugin and devtools, ensuring test execution starts in under 100ms.

```ts
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), viteReact()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/__test__/**/*.{test,spec}.{ts,tsx}"],
    reporters: ["default"],
  },
});
```

### 2.3 Test Setup & Shared Utilities

- **`src/test/setup.ts`**: Imports `@testing-library/jest-dom/vitest`, configures automatic cleanup after each test, and polyfills browser APIs (e.g., `window.matchMedia`, `ResizeObserver`).
- **`src/test/utils.tsx`**: Provides `renderWithProviders` with an isolated TanStack `QueryClient` and mock router context for integration scenarios.

### 2.4 Scripts in `package.json`

- `"test"`: `"vitest run"`
- `"test:watch"`: `"vitest"`
- `"test:coverage"`: `"vitest run --coverage"`

---

## 3. Mandatory Feature Unit Testing Rules

### 3.1 Directory Convention

Every feature created or updated under `src/features/<feature_name>/` must maintain unit tests in `src/features/<feature_name>/__test__/`:

```
src/features/<feature_name>/
├── index.tsx                  # Page assembly
├── context/
│   └── index.tsx              # Feature Context
├── components/
│   ├── list.tsx
│   ├── card.tsx
│   ├── create-form.tsx
│   └── delete.tsx
└── __test__/
    ├── list.test.tsx
    ├── card.test.tsx
    ├── create-form.test.tsx
    ├── delete.test.tsx
    └── page.test.tsx
```

### 3.2 High-Performance Testing Pattern: Context Mocking

- **Strict Isolation**: Because all feature UI components consume state and procedures through `use<FeatureName>Context()`, components must be tested by mocking the feature context hook.
- **Fast Execution**: Context mocking removes the overhead of HTTP/MSW mock layers for UI unit tests, keeping execution times under 30ms per test file.
- **Rule Documentation**:
  - `CLAUDE.md`: Enforce that creating or modifying any UI element in `src/features/` requires creating/updating tests in `src/features/<feature-name>/__test__/`.
  - `.claude/rules/feature-pattern.md`: Add a dedicated section specifying test structure and context mocking patterns.
  - `.claude/rules/testing-rules.md`: Add full specification of test standards, assertions, and mock helpers.
  - `.claude/commands/gen-feature.md`: Automatically generate skeleton tests in `__test__/` when scaffolding features.

---

## 4. Sub-Agent & Skill Design

### 4.1 Unit Test Specialist Sub-agent (`.claude/agents/unit-test-specialist.md`)

- **Role**: Specialized testing engineer for React 19 + Vitest.
- **Workflow**:
  1. Inspect target UI components in `src/features/<feature-name>/components/`.
  2. Generate or update unit tests in `src/features/<feature-name>/__test__/` covering render, user events, loading/error states, and branch logic.
  3. Run `bun test` to guarantee test pass with zero regressions.

### 4.2 Slash Command / Skill (`.claude/commands/unit-test.md`)

- **Invocation**: `/unit-test <feature-name>`
- **Workflow**:
  - Automates test scaffolding and verification for a given feature.
  - Reports execution speed and test results.
