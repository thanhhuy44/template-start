# Code Style & TypeScript Rules

These rules apply to all TypeScript and React code in this codebase.

## Type Safety & Schema Inference

- **Explicit Type Annotations**: Annotate function parameters, return types, component props, and custom states. Never use `any`; prefer `unknown` when a type is genuinely unknown.
- **Infer from Schemas**: Use `z.infer<typeof schema>` and Drizzle's `typeof table.$inferSelect` / `typeof table.$inferInsert` instead of duplicating types manually.
- **Narrow Literals**: Use `satisfies` for type-checking object literals while preserving their narrow type, and `as const` for non-widening literal objects/tuples.

## ES6 Arrow Functions Only

- **No `function` Declarations**: Always use ES6 arrow functions for components, handlers, callbacks, server functions, and helper functions.
  ```tsx
  export const MyComponent = ({
    title,
  }: {
    title: string
  }): React.ReactNode => {
    return <div>{title}</div>
  }

  export const calculateTotal = (items: Item[]): number => {
    return items.reduce((acc, item) => acc + item.price, 0)
  }
  ```

## Memoization (React Compiler First)

- **Rely on React 19 Compiler**: Do NOT add `useMemo`, `useCallback`, or `React.memo` by default.
- **Measure Before Adding**: Only add manual memoization if React DevTools profiling identifies a verified bottleneck. Document the rationale with a code comment explaining why.

## Clean Code & Workflow Efficiency

- **Clean Code First (No Redundant Typechecks/Builds)**: Do NOT run `typecheck` (e.g. `tsc`), `bun run build`, or build scripts after completing every small code snippet or incremental modification. Focus first on writing clean, well-structured, readable, and maintainable code. Run typecheck or build commands only at major feature milestones or when explicitly requested.
