<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Custom Agent Rules for OBRAS_ERP Frontend

When working on this Next.js project, strictly adhere to the following rules:

## 1. Testing & Compilation (CRITICAL)
- **Always verify your code**: Before declaring a task finished or pushing code to the repository, you **must** run `npm run build` locally to verify that there are no TypeScript errors or Next.js build issues.
- **Run all tests**: You **must** also execute the project's test suite (e.g., `npm run test` or equivalent) to ensure no existing tests are broken.
- Test the functionality thoroughly to make sure what you developed actually works as expected.

## 2. UI/UX Patterns (No Modals)
- **Avoid Modals for Complex Interactions**: Do not use modals, dialogs, or popups for viewing details or editing forms.
- **Use Dedicated Pages**: Always prefer opening a new dedicated page (e.g., routing to `/recurso/[id]`) to display information or forms. Use Next.js `<Link>` for navigation instead of managing modal state.

## 3. Strict Design System Adherence
- When using existing UI components (like `Button` or `GlassCard` in `src/components/ui/`), always review their definitions first (`view_file`).
- **Do not invent prop variants**: For example, if a `Button` only supports `primary`, `outlined`, and `text`, do NOT pass `variant="secondary"`. This causes compilation failures.
