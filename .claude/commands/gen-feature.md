---
description: Generate a minimal base feature module pattern in src/features/<feature-name> with empty Context and skeleton components
---

Generate a minimal base feature module in `src/features/<feature_name>/` following the project's standard feature pattern architecture.

## Non-Negotiable Architecture & Base Guidelines

### 1. Minimal Base Principles
- **No Extra UI / Mock Code**: Build ONLY bare skeleton components. Do NOT add dummy UI elements, CSS styling, mock data, or pre-built handlers/states.
- **Empty Base Context**: `ContextType` must start empty (`interface ContextType {}`). Do NOT create pre-defined states, queries, or functions in Context. Users will add them as needed.
- **Strict Coding Rules**:
  - **ES6 Arrow Functions Only**: Use `export const Component = (): React.ReactNode => ...`. No `function` declarations.
  - **Explicit Type Annotations**: Annotate props, params, and return types explicitly.

### 2. Standard Directory & Minimal Files

```
src/features/<feature_name>/
├── index.tsx                  # Page component — wraps layout in ContextProvider
├── context/
│   └── index.tsx              # Feature Context — empty base ContextProvider & custom hook
└── components/
    ├── list.tsx               # Minimal List component consuming context
    ├── card.tsx               # Minimal Detail Card component consuming context
    ├── create-form.tsx        # Minimal Create Form component consuming context
    └── delete.tsx             # Minimal Delete Dialog component consuming context
```

### 3. Minimal Skeleton Code Templates

#### `src/features/<feature_name>/context/index.tsx`
```tsx
import { createContext, useContext, type ReactNode } from 'react'

export interface ContextType {}

const Context = createContext<ContextType>({} as ContextType)

export const ContextProvider = ({
  children,
}: {
  children: ReactNode
}): React.ReactNode => {
  return <Context.Provider value={{}}>{children}</Context.Provider>
}

export const use<FeatureName>Context = (): ContextType => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('use<FeatureName>Context must be used within ContextProvider')
  }
  return context
}
```

#### `src/features/<feature_name>/index.tsx`
```tsx
import { ContextProvider } from './context'
import { List } from './components/list'
import { DetailCard } from './components/card'
import { CreateForm } from './components/create-form'
import { DeleteModal } from './components/delete'

export const <FeatureName>Page = (): React.ReactNode => {
  return (
    <ContextProvider>
      <div>
        <List />
        <DetailCard />
        <CreateForm />
        <DeleteModal />
      </div>
    </ContextProvider>
  )
}
```

#### `src/features/<feature_name>/components/list.tsx`
```tsx
import { use<FeatureName>Context } from '../context'

export const List = (): React.ReactNode => {
  const {} = use<FeatureName>Context()
  return <div>List</div>
}
```

#### `src/features/<feature_name>/components/card.tsx`
```tsx
import { use<FeatureName>Context } from '../context'

export const DetailCard = (): React.ReactNode => {
  const {} = use<FeatureName>Context()
  return <div>DetailCard</div>
}
```

#### `src/features/<feature_name>/components/create-form.tsx`
```tsx
import { use<FeatureName>Context } from '../context'

export const CreateForm = (): React.ReactNode => {
  const {} = use<FeatureName>Context()
  return <div>CreateForm</div>
}
```

#### `src/features/<feature_name>/components/delete.tsx`
```tsx
import { use<FeatureName>Context } from '../context'

export const DeleteModal = (): React.ReactNode => {
  const {} = use<FeatureName>Context()
  return <div>DeleteModal</div>
}
```
