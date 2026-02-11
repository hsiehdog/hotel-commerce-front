## Coding guidelines

## Prime Directives

1. **Prefer the simplest working solution** that fits existing patterns.
2. **Do not grow files unnecessarily** — refactor when a file starts to feel “heavy”.
3. **Avoid framework churn** (don’t introduce new libs/patterns unless asked).
4. **Keep behavior stable** — avoid breaking existing routes/response shapes.
5. **Leave the codebase cleaner than you found it** (remove dead code and unused imports).

---

## Frontend Architecture Rules (Next.js)

### Use shadcn/ui + Tailwind first

- Prefer composing existing shadcn components (Card, Tabs, Dialog, Drawer, Dropdown, Command, etc.)
- Add minimal custom components; if you do, keep them small and reusable.

### Data fetching + mutations

- Keep API calls in `src/lib/api-client.ts` or equivalent helpers.
- Avoid sprinkling fetch logic across UI components.
- Prefer optimistic updates only when safe and reversible.

### UI patterns

- Mobile-first responsive layout
- Use `Dialog` on desktop and `Drawer` on mobile when appropriate.
- Always show loading + error states for network actions.

---

## Naming + Types

- TypeScript everywhere.
- Public service functions should have explicit input/output types.
- Prefer `type` over `interface` for small shapes.
- Use consistent naming:
  - `createX`, `updateX`, `deleteX`, `getX`, `listX`
  - `buildXCreateInput`, `mapX`, `enrichX`

---

## Refactor Triggers (when Codex should proactively refactor)

Refactor if:

- Duplicate logic appears in >2 places (extract helper/integration/mapper).
- A module imports too many unrelated domains.

Refactor style:

- Prefer adding **1–3 helper files** (not big new folder trees) unless requested.
- Keep exports minimal.
- Avoid “utility dumping grounds”.

---

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm lint`
- `pnpm build`

---

## Security

- Never commit secrets or `.env*`.
- Frontend requests that require cookies must use `credentials: "include"`.

---

## Output Expectations (what Codex should provide)

When implementing a change, always output:

1. **Files changed** (list)
2. **Key behavior changes**
3. **How to run/verify**
4. If schema changed: migration steps + Prisma generate

Prefer small PR-sized changes over massive rewrites.

## Required checks

After any code change, run:

- `npx tsc --noEmit`
  Fix all TS errors before finishing.

## Testing requirements

- Use Vitest + React Testing Library for frontend tests.
- Keep test setup in `vitest.config.mjs` and `src/test/setup.js`.
- Add or update tests for behavior changes when practical.
- Run `pnpm test` after adding or modifying tests.
