# Gemini CLI Context

This file serves as a persistent context for Gemini CLI interactions within the `hotel-commerce/front` project. It complements `AGENTS.md` with specific tool-related guidance and project state.

## Project Context
- **Domain:** Hotel Commerce / AI-driven Decisioning.
- **Key Route:** `/demo/offers` (Offers Demo Dashboard).
- **Primary Tech:** Next.js 16, Tailwind 4, shadcn/ui, Vitest.

## Development Workflow
- **Linting:** `pnpm lint`
- **Type Checking:** `npx tsc --noEmit`
- **Testing:** `pnpm test` or `pnpm test:watch`
- **Mocking:** The frontend uses mocked responses when `NEXT_PUBLIC_API_BASE_URL` is unset.

## Agent Guidelines (from AGENTS.md)
1. **Simplicity First:** Don't over-engineer.
2. **Standard Components:** Use `src/components/ui` primitives.
3. **Types:** Explicit input/output types for all public services.
4. **Verification:** Always run `tsc` and `vitest` before concluding a task.

## Current Focus
- Initial codebase review and environment setup.
- Maintaining the "Offers Demo" functionality and dashboard integrity.
