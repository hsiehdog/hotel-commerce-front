## AI Control Center

Starter kit for AI-driven software that ships with:

- Next.js App Router + TypeScript + Tailwind CSS v4
- shadcn/ui primitives for cards, forms, and chat
- Better Auth (email/password) with secure session cookies and a Next.js route handler
- Dashboard with usage, projects, activity timeline, and an AI chat surface

## Quick start

```bash
pnpm install
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) for the marketing page, `/signup` or `/login` for auth, and `/dashboard` for the protected experience.

## Backend integration

This project assumes your backend owns the Better Auth instance (as outlined in [discussion #5578](https://github.com/better-auth/better-auth/discussions/5578)). Point `NEXT_PUBLIC_AUTH_BASE_URL` to that backend, ensure it exposes the Better Auth router at `NEXT_PUBLIC_AUTH_BASE_PATH`, and allow cross-origin credentials if the domains differ. The login/signup forms never touch a local auth route—they call the backend directly, which also has access to the real auth tables.

## Environment variables

Create a `.env.local` from the provided example.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public site URL for this frontend (used in marketing copy and fallbacks). |
| `NEXT_PUBLIC_AUTH_BASE_URL` | Origin of your backend that runs Better Auth (e.g., `http://localhost:4000`). |
| `NEXT_PUBLIC_AUTH_BASE_PATH` | Path segment for the Better Auth route on the backend (defaults to `/api/auth`). |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for your backend/LLM API. When unset, the dashboard/chat use mocked responses. Requests include cookies, so enable CORS w/ credentials if this is a different origin. |

Run the dev server with `pnpm dev`. The frontend talks to your backend-hosted Better Auth instance, which issues secure HTTP-only cookies that the browser sends automatically.

## Architecture notes

- `src/lib/auth/client.ts` points to your backend-hosted Better Auth instance (derived from `NEXT_PUBLIC_AUTH_BASE_URL`/`NEXT_PUBLIC_AUTH_BASE_PATH`) and exposes hooks/actions (`authClient.useSession`, `authClient.signIn.email`, etc.).
- `src/lib/api-client.ts` centralizes backend calls. When `NEXT_PUBLIC_API_BASE_URL` is set the helper automatically includes the Better Auth session cookie (`credentials: "include"`).
- React Query powers data access (`src/components/providers.tsx`) and shares caches between the dashboard and chat.
- UI primitives live in `src/components/ui/*` (shadcn) and higher-level building blocks live under `src/components`.

## Offers demo dashboard (`/demo/offers`)

Use this route to demo `POST /offers/generate` as a business-facing offer decision dashboard.

1. Start the frontend with `pnpm dev`.
2. Ensure your backend serves `POST /offers/generate`.
3. If backend is on another origin, set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` (for example `http://localhost:4000`).
4. Open `http://localhost:3000/demo/offers`.
5. Keep **Basic** mode for day-to-day demos:
   - guest request inputs
   - constraint inputs: `pet_friendly`, `accessible_room`, `needs_two_beds`, `parking_needed`, optional `budget_cap`
   - business-labeled presets (`Family stay`, `Late arrival`, `High-demand weekend`, `Price-sensitive guest`)
   - quick date chips (`Tonight`, `Tomorrow`, `This weekend`, `Next weekend`)
6. Expand **Advanced** only when needed:
   - `Demo scenario (advanced)`
   - `Raw JSON override`
   - `Explainability mode` toggle (defaults to on)
7. Click **Run Offer Decision**.
8. Review top-down:
   - `Offer decision` (primary recommendation, secondary tradeoff, risk/flexibility badges)
   - `Why this was selected` (decision story + grouped reason codes)
   - `Property context` (resolved property/currency/strategy/timezone/policies/capabilities)
   - detailed tabs for `Why Panel`, `Debug Deep Dive`, and `Raw JSON`

### Screenshot notes

Capture these screens for stakeholder walkthroughs:

1. Basic mode request form with preset chips and quick date chips.
2. Offer decision summary showing primary and secondary cards with SAFE/SAVER badges.
3. Why panel and property context panel side-by-side.
4. Debug Deep Dive candidate table with selected-row highlight.
5. Raw JSON tab with request/response and copy bundle action.

## Available scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Create a production build |
| `pnpm start` | Run the built app |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest once (jsdom + React Testing Library setup) |
| `pnpm test:watch` | Run Vitest in watch mode |

## Next steps

- Replace the memory adapter with your database of choice (Prisma, Drizzle, etc.).
- Point `NEXT_PUBLIC_API_BASE_URL` to your backend so the dashboard and chat call real services.
- Extend the chat panel to stream tokens from your LLM provider or trigger workflows via function calling.
