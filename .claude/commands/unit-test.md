---
description: Create, audit, and run high-performance unit tests for UI elements in src/features/<feature-name>/__test__/
---

Audit and generate unit tests for a feature:

1. Identify the target feature path: `src/features/$ARGUMENTS`.
2. Scan all UI components in `src/features/$ARGUMENTS/components/` and `src/features/$ARGUMENTS/index.tsx`.
3. Check for existing tests in `src/features/$ARGUMENTS/__test__/`.
4. Create or update unit test files for missing or updated components using the high-performance Context mocking pattern:
   ```tsx
   import { render, screen } from "@testing-library/react";
   import { describe, expect, it, vi } from "vitest";

   import { ComponentName } from "../components/<component-name>";
   import * as ContextModule from "../context";

   describe("ComponentName", () => {
     it("renders successfully with mocked context", () => {
       vi.spyOn(ContextModule, "use<FeatureName>Context").mockReturnValue({
         // mock minimal states needed
       });
       render(<ComponentName />);
     });
   });
   ```
5. Run `bun run test src/features/$ARGUMENTS/__test__/` and verify that all tests pass cleanly.
