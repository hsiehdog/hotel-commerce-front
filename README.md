# Hotel CommerceCo Frontend

Next.js 16 frontend for hotel commerce demos and a small authenticated operator area. The app currently centers on three demo surfaces:

- `/demo/offers`: run `POST /offers/generate` and inspect the parsed decision output
- `/demo/offers/logs`: browse historical offer decisions and inspect normalized detail payloads
- `/demo/chat`: test a property-scoped chat booking flow with room recommendations

The root route redirects to `/demo/offers`. Authenticated pages still exist under `/dashboard`, `/settings`, `/login`, and `/signup`.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- TanStack Query
- Better Auth client
- Vitest + React Testing Library

## Getting Started

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

No environment variables are required to boot the UI, but remote backend integration depends on them.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | No | Base URL for backend APIs. When unset, `src/lib/api-client.ts` runs in mock mode for dashboard metrics, property lists, dashboard chat, and demo chat session/message APIs. |
| `NEXT_PUBLIC_AUTH_BASE_URL` | No | Preferred Better Auth backend origin. Falls back to `NEXT_PUBLIC_API_BASE_URL`, then `NEXT_PUBLIC_APP_URL`. |
| `NEXT_PUBLIC_AUTH_BASE_PATH` | No | Better Auth route path. Defaults to `/api/auth`. |
| `NEXT_PUBLIC_APP_URL` | No | Frontend origin fallback used by the auth client when no auth or API base URL is set. |

## Runtime Behavior

### Demo navigation

The shared shell header links only to the three demo routes:

- `/demo/offers`
- `/demo/offers/logs`
- `/demo/chat`

### Authenticated requests

- `src/lib/auth/client.ts` creates the Better Auth client with `credentials: "include"`.
- `src/lib/api-client.ts` also sends backend requests with `credentials: "include"`.
- `/dashboard` and `/settings` are wrapped in `ProtectedRoute`, which redirects unauthenticated users to `/login`.

### Mock mode

If `NEXT_PUBLIC_API_BASE_URL` is not set:

- `/dashboard` uses mocked usage, project, activity, and simple AI chat data
- `/demo/chat` uses mocked session creation and mocked assistant responses
- `/demo/offers/logs` can still load a mocked property list
- `/demo/offers/logs/:detail` behavior is not mocked; detail fetches fail in mock mode

Important exception:

- `/demo/offers` does not use `src/lib/api-client.ts`
- it sends `fetch` requests directly to `${NEXT_PUBLIC_API_BASE_URL}/offers/generate`
- if no base URL is configured, it falls back to `/offers/generate` on the current origin

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Redirects to `/demo/offers` |
| `/demo/offers` | Offer decision dashboard |
| `/demo/offers/logs` | Offer log list plus detail inspection |
| `/demo/chat` | Property-scoped chat booking demo |
| `/dashboard` | Protected operator dashboard with metrics, project list, activity, and chat panel |
| `/settings` | Protected profile and password settings |
| `/login` | Better Auth sign-in form |
| `/signup` | Better Auth sign-up form |
| `/demo/landings/v1` | Demo landing page |

## Backend Contracts

### Offer generation

`src/lib/offers-demo.ts` builds the request for:

- `POST /offers/generate`

The request shape is centered on:

- `property_id`
- `channel`
- `check_in`
- `check_out`
- `currency`
- `rooms`
- `adults`
- `children`
- `child_ages`
- `roomOccupancies`
- `debug`

The parser accepts mixed camelCase or snake_case response payloads and expects data such as:

- `propertyId` or `property_id`
- `priceBasisUsed` or `price_basis_used`
- `configVersion` or `config_version`
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

Current UI behavior:

- the logs screen always filters by `propertyId`
- list queries use an all-time range with pagination via `cursor`
- detail fetches request `includeRawPayloads=true` and `payloadCapKb=512`
- the detail screen maps log payloads back into the same decision panels used by `/demo/offers`

### Chat demo

`/demo/chat` depends on:

- `POST /chat/sessions`
- `POST /chat/sessions/:sessionId/messages`
- `GET /properties`

The frontend uses response fields like:

- `data.sessionId`
- `data.assistantMessage`
- `data.status`
- `data.nextAction`
- `data.pendingAction`
- `data.slots`
- `data.responseUi`
- `data.commerce`
- `data.decisionId`
- `data.debug`

The chat UI stores the active demo session and retry buffer in `sessionStorage`, scoped by property.

### Authenticated dashboard and settings

When `NEXT_PUBLIC_API_BASE_URL` is configured:

- `/dashboard` calls `GET /analytics/usage`, `GET /projects`, `GET /activity`, `GET /users/me/sessions`, and `POST /ai/generate`
- `/settings` uses profile endpoints exposed through `updateUserProfile` and `changeUserPassword`

## Feature Notes

### `/demo/offers`

- preset scenarios populate request drafts for several traveler patterns
- advanced JSON overrides merge into the request payload
- the response is normalized into reusable panels such as decision summary, guest profile, candidate analysis, and debug output
- upgrade ladder cards summarize each option with total price, nightly delta, and upgrade rationale

### `/demo/offers/logs`

- the list view is table-first and keeps selection state in URL search params
- opening a decision prefetches detail data
- detail rendering falls back gracefully when only partial log data is available

### `/demo/chat`

- property changes reset the session and URL state
- validation, expiry, retry, and rate-limit states are handled in the UI
- room recommendation rendering prefers `commerce.recommended_room` and falls back to ranked rooms

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/app` | App Router routes |
| `src/components/auth` | Auth form and route guard |
| `src/components/chat` | Chat demo UI and message rendering |
| `src/components/dashboard` | Protected dashboard cards and activity feed |
| `src/components/layout` | Shared shell and header |
| `src/components/offers` | Offer generator, logs dashboard, and decision panels |
| `src/components/ui` | shadcn/ui primitives |
| `src/hooks` | React Query hooks |
| `src/lib/api-client.ts` | Backend client, normalization, and mocks |
| `src/lib/offers-demo.ts` | Offer request builder, presets, validation, and response parsing |
| `src/test/setup.js` | Vitest setup |

## Verification

After changes, run:

```bash
pnpm lint
npx tsc --noEmit
```

If you changed tests or UI behavior, also run:

```bash
pnpm test
```
