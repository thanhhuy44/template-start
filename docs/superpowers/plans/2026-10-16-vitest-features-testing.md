# Vitest Setup & Feature Unit Testing Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure Vitest with JSDOM and React Testing Library for high-performance React 19 unit testing, enforce the rule that all UI elements in `src/features/<feature-name>/` must have unit tests in `__test__/`, and create a dedicated unit-test sub-agent and slash command.

**Architecture:** A standalone `vitest.config.ts` isolated from TanStack Start SSR plugins provides rapid test startup. A shared `src/test/utils.tsx` supplies React Query/Router providers. Feature tests mock the single `use<Feature>Context` hook to test UI states in isolation with sub-millisecond overhead.

**Tech Stack:** Vitest, jsdom, @testing-library/react (React 19), @testing-library/jest-dom, @testing-library/user-event, vite-tsconfig-paths, Bun.

---

### Task 1: Install Dependencies & Configure Test Scripts

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install Vitest and testing library packages**

Run:

```bash
bun add -d vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths
```

- [ ] **Step 2: Add test scripts to `package.json`**

In `package.json`, add:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

- [ ] **Step 3: Verify package installation**

Run: `bun pm ls vitest`
Expected: `vitest` listed under devDependencies.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: install vitest and testing-library dependencies"
```

---

### Task 2: Configure Vitest, Test Setup, and Utilities

**Files:**

- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/utils.tsx`
- Create: `src/test/smoke.test.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

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
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
```

- [ ] **Step 2: Create `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Automatically clean up after each test
afterEach(() => {
  cleanup();
});

// Polyfill window.matchMedia if not available in jsdom
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Polyfill ResizeObserver
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
```

- [ ] **Step 3: Create `src/test/utils.tsx`**

```tsx
import type { ReactElement, ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";

export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

export interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: ReactElement,
  options?: CustomRenderOptions,
): RenderResult => {
  const queryClient = options?.queryClient ?? createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }): ReactNode => {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
```

- [ ] **Step 4: Create `src/test/smoke.test.ts`**

```ts
import { describe, expect, it } from "vitest";

describe("Vitest Environment Smoke Test", () => {
  it("runs tests in jsdom environment with DOM globals", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
    const div = document.createElement("div");
    div.textContent = "Vitest is working";
    document.body.appendChild(div);
    expect(document.body).toHaveTextContent("Vitest is working");
  });
});
```

- [ ] **Step 5: Run smoke test to verify Vitest operates cleanly**

Run: `bun run test`
Expected: 1 test file passed, 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/test/setup.ts src/test/utils.tsx src/test/smoke.test.ts
git commit -m "feat: configure vitest, setup file, test utilities, and smoke test"
```

---

### Task 3: Enforce Feature Unit Testing Rules in Project Instructions

**Files:**

- Create: `.claude/rules/testing-rules.md`
- Modify: `.claude/rules/feature-pattern.md`
- Modify: `CLAUDE.md`
- Modify: `.claude/commands/gen-feature.md`

- [ ] **Step 1: Create `.claude/rules/testing-rules.md`**

Define the testing standards, context mocking technique, and assertion conventions:

````markdown
# Feature Unit Testing Rules

All features in `src/features/<feature-name>/` MUST have unit tests under `src/features/<feature-name>/__test__/`.

## Non-Negotiable Testing Rules

1. **Mandatory Tests for Every UI Element**:
   - Whenever any component is created or modified in `src/features/<feature-name>/components/` or `index.tsx`, corresponding unit tests in `src/features/<feature-name>/__test__/` MUST be created or updated.
2. **Context Mocking Pattern for High Performance**:
   - Feature UI components consume state and data strictly via `use<FeatureName>Context()`.
   - Never set up expensive MSW or server mocks for UI unit tests. Mock `use<FeatureName>Context()` directly:
     ```tsx
     import { vi } from 'vitest'
     import * as ContextModule from '../context'

     vi.spyOn(ContextModule, 'use<FeatureName>Context').mockReturnValue({ ... })
     ```
   - This keeps individual test suite execution under 30ms.
3. **Coverage Expectations**:
   - Test default render state (loading, error, empty, data).
   - Test user interactions (button clicks, form inputs) using `userEvent`.
   - Test modal/dialog visibility when `action` changes.
4. **Naming Convention**:
   - `<component-name>.test.tsx` (e.g. `list.test.tsx`, `card.test.tsx`, `delete.test.tsx`, `page.test.tsx`).
````

- [ ] **Step 2: Update `.claude/rules/feature-pattern.md`**

Add the `__test__/` directory to the directory tree and add Rule #9 to "Non-Negotiable Rules":

```markdown
9. **Mandatory Unit Tests in `__test__/`**: Every component must have a corresponding test file in `src/features/<feature_name>/__test__/` covering render and user interaction states using Context mocking.
```

- [ ] **Step 3: Update `CLAUDE.md`**

Add testing commands and the mandatory feature testing rule to `CLAUDE.md`:
In `Commands` section:

```bash
# Testing (Vitest)
bun run test                   # Run all unit tests
bun run test:watch             # Run tests in watch mode
bun run test:coverage          # Run tests with coverage
```

In `Code Rules -> Mandatory`:

```markdown
- **Mandatory Feature Unit Tests**: Whenever creating or updating any UI component in `src/features/<name>/`, corresponding unit tests MUST be created or updated in `src/features/<name>/__test__/`.
```

- [ ] **Step 4: Update `.claude/commands/gen-feature.md`**

Update the scaffolding template to include `__test__/` files with initial render tests:

- `__test__/list.test.tsx`
- `__test__/card.test.tsx`
- `__test__/create-form.test.tsx`
- `__test__/delete.test.tsx`
- `__test__/page.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add .claude/rules/testing-rules.md .claude/rules/feature-pattern.md CLAUDE.md .claude/commands/gen-feature.md
git commit -m "docs: enforce mandatory unit testing rules for feature UI components"
```

---

### Task 4: Create Sample Feature with Unit Tests to Validate Performance

**Files:**

- Create: `src/features/sample/context/index.tsx`
- Create: `src/features/sample/components/list.tsx`
- Create: `src/features/sample/components/card.tsx`
- Create: `src/features/sample/index.tsx`
- Create: `src/features/sample/__test__/list.test.tsx`
- Create: `src/features/sample/__test__/card.test.tsx`
- Create: `src/features/sample/__test__/page.test.tsx`

- [ ] **Step 1: Create `src/features/sample/context/index.tsx`**

```tsx
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
} from "react";

export interface SampleItem {
  id: number;
  title: string;
}

export interface ContextType {
  items: SampleItem[];
  selectedItem: SampleItem | null;
  setSelectedItem: Dispatch<SetStateAction<SampleItem | null>>;
  isLoading: boolean;
}

export const Context = createContext<ContextType | null>(null);

export const ContextProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value?: ContextType;
}): React.ReactNode => {
  const defaultValue: ContextType = value ?? {
    items: [],
    selectedItem: null,
    setSelectedItem: () => {},
    isLoading: false,
  };
  return <Context.Provider value={defaultValue}>{children}</Context.Provider>;
};

export const useSampleContext = (): ContextType => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useSampleContext must be used within ContextProvider");
  }
  return context;
};
```

- [ ] **Step 2: Create `src/features/sample/components/list.tsx` and `card.tsx`**

`src/features/sample/components/list.tsx`:

```tsx
import { useSampleContext } from "../context";

export const List = (): React.ReactNode => {
  const { items, isLoading, setSelectedItem } = useSampleContext();

  if (isLoading) {
    return <div data-testid="loading-state">Loading items...</div>;
  }

  if (items.length === 0) {
    return <div data-testid="empty-state">No items found.</div>;
  }

  return (
    <ul data-testid="item-list">
      {items.map((item) => (
        <li
          key={item.id}
          onClick={() => setSelectedItem(item)}
          className="cursor-pointer"
        >
          {item.title}
        </li>
      ))}
    </ul>
  );
};
```

`src/features/sample/components/card.tsx`:

```tsx
import { useSampleContext } from "../context";

export const DetailCard = (): React.ReactNode => {
  const { selectedItem, setSelectedItem } = useSampleContext();

  if (!selectedItem) {
    return null;
  }

  return (
    <div data-testid="detail-card">
      <h3>{selectedItem.title}</h3>
      <button onClick={() => setSelectedItem(null)}>Close</button>
    </div>
  );
};
```

- [ ] **Step 3: Create `src/features/sample/index.tsx`**

```tsx
import { DetailCard } from "./components/card";
import { List } from "./components/list";
import { ContextProvider } from "./context";

export const SamplePage = (): React.ReactNode => {
  return (
    <ContextProvider>
      <div className="space-y-4">
        <List />
        <DetailCard />
      </div>
    </ContextProvider>
  );
};
```

- [ ] **Step 4: Create unit tests in `src/features/sample/__test__/`**

`src/features/sample/__test__/list.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { List } from "../components/list";
import * as ContextModule from "../context";

describe("Sample List Component", () => {
  it("renders loading state when isLoading is true", () => {
    vi.spyOn(ContextModule, "useSampleContext").mockReturnValue({
      items: [],
      selectedItem: null,
      setSelectedItem: vi.fn(),
      isLoading: true,
    });

    render(<List />);
    expect(screen.getByTestId("loading-state")).toHaveTextContent(
      "Loading items...",
    );
  });

  it("renders empty state when items is empty", () => {
    vi.spyOn(ContextModule, "useSampleContext").mockReturnValue({
      items: [],
      selectedItem: null,
      setSelectedItem: vi.fn(),
      isLoading: false,
    });

    render(<List />);
    expect(screen.getByTestId("empty-state")).toHaveTextContent(
      "No items found.",
    );
  });

  it("renders list of items and handles click selection", async () => {
    const user = userEvent.setup();
    const setSelectedItem = vi.fn();
    const mockItems = [
      { id: 1, title: "Item 1" },
      { id: 2, title: "Item 2" },
    ];

    vi.spyOn(ContextModule, "useSampleContext").mockReturnValue({
      items: mockItems,
      selectedItem: null,
      setSelectedItem,
      isLoading: false,
    });

    render(<List />);
    const item1 = screen.getByText("Item 1");
    expect(item1).toBeInTheDocument();

    await user.click(item1);
    expect(setSelectedItem).toHaveBeenCalledWith(mockItems[0]);
  });
});
```

`src/features/sample/__test__/card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DetailCard } from "../components/card";
import * as ContextModule from "../context";

describe("Sample DetailCard Component", () => {
  it("renders nothing when selectedItem is null", () => {
    vi.spyOn(ContextModule, "useSampleContext").mockReturnValue({
      items: [],
      selectedItem: null,
      setSelectedItem: vi.fn(),
      isLoading: false,
    });

    const { container } = render(<DetailCard />);
    expect(container.firstChild).toBeNull();
  });

  it("renders item title and triggers close handler", async () => {
    const user = userEvent.setup();
    const setSelectedItem = vi.fn();

    vi.spyOn(ContextModule, "useSampleContext").mockReturnValue({
      items: [],
      selectedItem: { id: 10, title: "Active Post" },
      setSelectedItem,
      isLoading: false,
    });

    render(<DetailCard />);
    expect(screen.getByText("Active Post")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /close/i });
    await user.click(closeBtn);
    expect(setSelectedItem).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 5: Run tests and verify sub-second execution performance**

Run: `bun run test`
Expected: All tests pass with total duration < 1s.

- [ ] **Step 6: Commit**

```bash
git add src/features/sample/
git commit -m "feat(sample): implement sample feature and unit tests validating high-performance testing"
```

---

### Task 5: Create Unit Test Specialist Sub-agent & Slash Command

**Files:**

- Create: `.claude/agents/unit-test-specialist.md`
- Create: `.claude/commands/unit-test.md`

- [ ] **Step 1: Create `.claude/agents/unit-test-specialist.md`**

```markdown
---
name: unit-test-specialist
description: High-performance React 19 and Vitest unit testing specialist for feature modules in src/features/
tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

You are the Unit Test Specialist for this codebase.

## Your Mission

Ensure all UI components in `src/features/<feature-name>/components/` have ultra-fast, robust, non-flaky unit tests in `src/features/<feature-name>/__test__/`.

## Rules & Standards

1. **Directory Structure**: Always place tests in `src/features/<feature-name>/__test__/<component-name>.test.tsx`.
2. **Context Mocking Pattern**: Mock `use<Feature>Context` from `../context` using `vi.spyOn`. Do NOT create external network mocks for UI component unit tests.
3. **High Performance**: Tests must run fast (< 30ms per file). Do not import unnecessary heavy providers unless testing integration at `page.test.tsx`.
4. **Coverage**:
   - Render & branch coverage (loading, error, empty, active).
   - User interactions via `@testing-library/user-event`.
   - Action/dialog triggers.
5. **Always Verify**: Run `bun run test` after creating or editing tests to ensure zero failures.
```

- [ ] **Step 2: Create `.claude/commands/unit-test.md`**

```markdown
---
description: Create, audit, and run high-performance unit tests for UI elements in src/features/<feature-name>/__test__/
---

Audit and generate unit tests for a feature:

1. Identify the target feature path: `src/features/$ARGUMENTS`.
2. Scan all UI components in `src/features/$ARGUMENTS/components/` and `src/features/$ARGUMENTS/index.tsx`.
3. Check for existing tests in `src/features/$ARGUMENTS/__test__/`.
4. Create or update unit test files for missing or updated components using the high-performance Context mocking pattern.
5. Run `bun run test src/features/$ARGUMENTS/__test__/` and verify that all tests pass cleanly.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/unit-test-specialist.md .claude/commands/unit-test.md
git commit -m "feat: add unit-test-specialist agent and /unit-test command"
```
