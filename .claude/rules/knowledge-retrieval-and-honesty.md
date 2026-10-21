# Knowledge Freshness, Mandatory Retrieval & Strict Honesty

These rules govern how the agent handles knowledge, information retrieval, and verification across the codebase.

## 1. Outdated Training Data Awareness (Nhận thức kiến thức lỗi thời)

- **Assume Parametric Memory is Obsolete**: The agent must always operate under the premise that its pre-trained internal knowledge is outdated, frozen, or incomplete.
- **High-Velocity Ecosystems**: Technologies in this stack (React 19, TanStack Start, TanStack Router, TanStack Query, Tailwind CSS v4, Drizzle ORM, better-auth, oRPC) change rapidly. Never assume an API, prop, signature, or pattern hasn't changed since training.
- **Never Rely on Static Guesswork**: Do not guess imports, configuration options, breaking changes, or CLI flags from memory.

## 2. Mandatory Real-Time Retrieval (Luôn tra cứu thông tin mới nhất)

Before implementing, advising, or refactoring:

- **Proactive Retrieval by Default**: Look up official documentation and live resources using configured MCP tools or internet search BEFORE writing code or answering technical questions.
- **Tool Hierarchy for Knowledge Retrieval**:
  1. **Context7 MCP (`resolve-library-id` -> `query-docs`)**: Primary tool for external libraries, frameworks, SDKs, and APIs (React, Tailwind, better-auth, Drizzle, etc.).
  2. **TanStack CLI (`tanstack search-docs`, `tanstack doc query`)**: Mandatory for all TanStack ecosystem queries (Router, Start, Query, Table). Always use `--json`.
  3. **Domain-Specific MCPs**:
     - `shadcn/ui` MCP for UI components, registries, and examples.
     - `antd` MCP for Ant Design components and design tokens.
     - `figma` MCP for design-to-code contexts.
  4. **WebSearch & WebFetch**: Use to inspect current changelogs, breaking change announcements, recent GitHub issues, and official release notes when MCPs do not cover a specific query.

## 3. Strict Honesty & Anti-Hallucination (Thành thật tuyệt đối, không bịa đặt)

- **Zero Tolerance for Hallucinations**: NEVER fabricate or guess function names, parameters, CSS utility classes, CLI options, or package dependencies.
- **Explicit Uncertainty & Boundary Transparency**: If documentation or information cannot be located after searching, explicitly state:
  - What sources and tools were checked.
  - What is verified vs. what remains unknown.
  - What alternative approaches or manual verifications are recommended.
- **Truthful Tool Reporting**: If an MCP server, CLI command, or search tool fails (e.g. timeout, connection closed, missing endpoint), faithfully report the actual failure. Never synthesize fake responses or pretend an action succeeded when it did not.
- **Evidence-Backed Implementation**: Every code change, architecture suggestion, and dependency addition must be traceable to verified documentation or existing patterns in the codebase.
