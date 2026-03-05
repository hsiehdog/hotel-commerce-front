# Hotel CommerceCo Frontend

Next.js 16 frontend for hotel commerce demos and authenticated operator workflows. The app is centered on three demo surfaces:

- `/demo/offers`: offer generation dashboard for `POST /offers/generate`
- `/demo/offers/logs`: operational log explorer for historical offer decisions
- `/demo/chat`: conversational booking demo backed by chat sessions

The authenticated account area is still available under `/dashboard`, `/settings`, `/login`, and `/signup`, but the root route currently redirects to `/demo/offers`.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- TanStack Query
- Better Auth client
- Vitest + React Testing Library

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Run the production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest once |
| `pnpm test:watch` | Run Vitest in watch mode |
| `npx tsc --noEmit` | Run a full TypeScript check |

## Environment

Create `.env.local` as needed.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | No | Base URL for backend APIs. When unset, `src/lib/api-client.ts` runs in mock mode for dashboard metrics, property lists, and chat sessions/messages. `src/lib/offers-demo.ts` still posts to `/offers/generate` on the current origin. |
| `NEXT_PUBLIC_AUTH_BASE_URL` | No | Preferred Better Auth backend origin. If unset, auth falls back to `NEXT_PUBLIC_API_BASE_URL`, then `NEXT_PUBLIC_APP_URL`. |
| `NEXT_PUBLIC_AUTH_BASE_PATH` | No | Better Auth route path. Defaults to `/api/auth`. |
| `NEXT_PUBLIC_APP_URL` | No | Frontend origin fallback used by the auth client when no explicit auth or API base URL is set. |

## Auth and API behavior

- `src/lib/auth/client.ts` creates the Better Auth client and always sends cookies with `credentials: "include"`.
- `src/lib/api-client.ts` centralizes authenticated backend requests and also uses `credentials: "include"`.
- If `NEXT_PUBLIC_API_BASE_URL` is not set:
  - dashboard metrics, projects, activity, and basic AI chat use local mock data
  - `/demo/chat` still works with mocked sessions and mocked room recommendations
  - `/demo/offers/logs` can load mocked properties, but detail fetches are unavailable
- `/demo/offers` does not use the mock API client. It sends a real `fetch` request to `${NEXT_PUBLIC_API_BASE_URL}/offers/generate` or `/offers/generate` if no base URL is configured.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Redirects to `/demo/offers` |
| `/demo/offers` | Offer decision dashboard |
| `/demo/offers/logs` | Offer log list + detail drawer |
| `/demo/chat` | Chat demo with property-scoped sessions |
| `/dashboard` | Protected operator dashboard with metrics and chat panel |
| `/settings` | Protected profile + password settings |
| `/login` | Better Auth sign-in form |
| `/signup` | Better Auth sign-up form |

## Backend contracts

### Offer generator

Frontend request is assembled in `src/lib/offers-demo.ts` and sent to:

- `POST /offers/generate`

The UI expects a response centered on:

- `propertyId` or `property_id`
- `channel`
- `currency`
- `priceBasisUsed` or `price_basis_used`
- `configVersion` or `config_version`
- `persona_confidence`
- `recommended_room`
- `recommended_offers`
- `ranked_rooms`
- `fallback`
- `debug`

### Offer logs

`src/lib/api-client.ts` currently calls:

- `GET /properties`
- `GET /offers/logs`
- `GET /offers/logs/:decisionId`

Notes:

- property fetch uses `activeOnly=true` by default
- logs list supports query filters such as `propertyId`, `from`, `to`, `channel`, `decisionStatus`, `requestId`, `decisionId`, `truncated`, `errors`, `fallbackOnly`, `slow`, `dlq`, `limit`, and `cursor`
- detail fetch can send `includeRawPayloads` and `payloadCapKb`
- list responses are normalized from either camelCase or snake_case payloads

### Chat demo

`/demo/chat` currently depends on:

- `POST /chat/sessions`
- `POST /chat/sessions/:sessionId/messages`
- `GET /properties`

The message response used by the frontend is:

- `data.sessionId`
- `data.assistantMessage`
- `data.status`
- `data.nextAction`
- `data.slots`
- `data.commerce`
- `data.decisionId`
- `data.debug`

Offer rendering in chat prefers `data.commerce.recommended_room` and falls back to the first entry in `data.commerce.ranked_rooms`.

### Authenticated dashboard

When `NEXT_PUBLIC_API_BASE_URL` is configured and mock mode is off, `/dashboard` calls:

- `GET /analytics/usage`
- `GET /projects`
- `GET /activity`
- `GET /users/me/sessions`
- `POST /ai/generate`

`/settings` also uses backend profile endpoints exposed through `src/lib/api-client.ts`.

## Demo notes

### `/demo/offers`

- request form supports business presets, occupancy editing, and advanced JSON overrides
- the parser normalizes response data into `DecisionSummary`, `GuestProfile`, `CandidateAnalysis`, and `DebugPanel`
- validation is local before submit

### `/demo/offers/logs`

- list view is table-first and does not require per-row detail fetches
- selecting a row opens a detail drawer
- detail rendering reuses the same offer analysis components used by `/demo/offers`

### `/demo/chat`

- stores the active chat session in `sessionStorage`
- automatically scopes sessions by selected property
- handles validation, expiry, retry, and rate-limit UI states

## Project structure

| Path | Purpose |
| --- | --- |
| `src/app` | Route entrypoints |
| `src/components/auth` | Auth form and route guard |
| `src/components/chat` | Chat demo and reusable chat UI |
| `src/components/dashboard` | Protected dashboard cards and activity feed |
| `src/components/layout` | App shell and shared header |
| `src/components/offers` | Offer generator, logs dashboard, and detail panels |
| `src/components/ui` | shadcn/ui primitives |
| `src/hooks` | React Query hooks |
| `src/lib/api-client.ts` | Backend client, normalization, mock data |
| `src/lib/offers-demo.ts` | Offer request builder and response parser |
| `src/test/setup.js` | Vitest setup |

## Verification

After changes, run:

```bash
pnpm lint
npx tsc --noEmit
```

If you changed tests or behavior, also run:

```bash
pnpm test
```
