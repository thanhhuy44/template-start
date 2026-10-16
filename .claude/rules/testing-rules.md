# Feature Unit Testing Rules

All features in `src/features/<feature-name>/` MUST have unit tests under `src/features/<feature-name>/__test__/`.

## Non-Negotiable Testing Rules

1. **Mandatory Tests for Every UI Element**:
   - Whenever any component is created or modified in `src/features/<feature-name>/components/` or `index.tsx`, corresponding unit tests in `src/features/<feature-name>/__test__/` MUST be created or updated.
   - PRs or changes without corresponding tests are considered incomplete.

2. **Directory & File Layout**:

   ```
   src/features/<feature_name>/
   ├── index.tsx                  # Page component
   ├── context/
   │   └── index.tsx              # Feature Context
   ├── components/
   │   ├── list.tsx
   │   ├── card.tsx
   │   ├── create-form.tsx
   │   └── delete.tsx
   └── __test__/
       ├── list.test.tsx          # Tests for components/list.tsx
       ├── card.test.tsx          # Tests for components/card.tsx
       ├── create-form.test.tsx   # Tests for components/create-form.tsx
       ├── delete.test.tsx        # Tests for components/delete.tsx
       └── page.test.tsx          # Tests for index.tsx
   ```

3. **High-Performance Context Mocking Pattern**:
   - Feature UI components consume state and procedures strictly through `use<FeatureName>Context()`.
   - Never set up expensive MSW, server handlers, or network mocks for UI unit tests. Mock `use<FeatureName>Context()` directly:
     ```tsx
     import { vi } from "vitest";

     import * as ContextModule from "../context";

     vi.spyOn(ContextModule, "use<FeatureName>Context").mockReturnValue({
       // test-specific state
     });
     ```
   - This keeps individual test suite execution under 30ms with zero network flakiness.

4. **Coverage Expectations**:
   - **Render states**: Test loading, error, empty, and data-loaded states.
   - **User interactions**: Test click handlers, form inputs, and close actions using `@testing-library/user-event`.
   - **Action triggers**: Test that triggering buttons properly invokes `setAction(...)` or mutation functions.

5. **Test Runners**:
   - `bun run test` - Run full unit test suite.
   - `bun run test <path>` - Run specific test file or directory.
