# Hotel CommerceCo Frontend

Next.js 16 frontend for hotel commerce demos plus a small authenticated operator area.

The app currently has four primary demo surfaces:

- `/demo`: checkout-style concierge and offer flow
- `/demo/offers`: raw offer generation and parsed decision inspection
- `/demo/offers/logs`: historical offer decisions with normalized detail payloads
- `/demo/chat`: property-scoped concierge Q&A

The root route redirects to `/demo`. Authenticated pages remain available at `/dashboard`, `/settings`, `/login`, and `/signup`.

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
cp .env.example .env.local
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

The UI can boot without a backend, but remote integration depends on the public env vars below.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | No | Frontend origin, typically `http://localhost:3000`. |
| `NEXT_PUBLIC_AUTH_BASE_URL` | No | Better Auth backend origin. Falls back to `NEXT_PUBLIC_API_BASE_URL`, then `NEXT_PUBLIC_APP_URL`. |
| `NEXT_PUBLIC_AUTH_BASE_PATH` | No | Better Auth route path. `.env.example` uses `/auth`. If unset in code, the client falls back to `/api/auth`. |
| `NEXT_PUBLIC_API_BASE_URL` | No | Base URL for backend APIs. When unset, parts of `src/lib/api-client.ts` switch to mock mode. |

## Runtime Behavior

### Shared shell navigation

The header links to:

- `/demo`
- `/demo/offers`
- `/demo/offers/logs`
- `/demo/chat`

### Authenticated requests

- [src/lib/auth/client.ts](/Users/mikehsieh/Builds/hotel-commerce/front/src/lib/auth/client.ts) creates the Better Auth client with `credentials: "include"`.
- [src/lib/api-client.ts](/Users/mikehsieh/Builds/hotel-commerce/front/src/lib/api-client.ts) also sends backend requests with `credentials: "include"`.
- `/dashboard` and `/settings` are wrapped in `ProtectedRoute` and redirect unauthenticated users to `/login`.

### Mock mode

If `NEXT_PUBLIC_API_BASE_URL` is not set:

- `/dashboard` uses mocked usage, project, activity, session, and simple AI chat data
- `/demo/chat` uses mocked concierge answers
- `/demo/offers/logs` can still load a mocked property list
- `/demo/offers/logs/:decisionId` detail fetches are not mocked and will fail without a backend

Important exception:

- [src/lib/offers-demo.ts](/Users/mikehsieh/Builds/hotel-commerce/front/src/lib/offers-demo.ts) calls `POST /offers/generate` directly
- it uses `${NEXT_PUBLIC_API_BASE_URL}/offers/generate` when a base URL exists
- otherwise it falls back to `/offers/generate` on the current origin

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Redirects to `/demo` |
| `/demo` | Checkout-style concierge and offers demo |
| `/demo/offers` | Offer generation dashboard |
| `/demo/offers/logs` | Offer log list plus detail inspection |
| `/demo/chat` | Property-scoped chat demo |
| `/dashboard` | Protected operator dashboard with metrics, project list, activity, and AI chat panel |
| `/settings` | Protected profile and password settings |
| `/login` | Better Auth sign-in form |
| `/signup` | Better Auth sign-up form |
| `/demo/landings/v1` | Demo landing page |

## Backend Contracts

### Offer generation

[src/lib/offers-demo.ts](/Users/mikehsieh/Builds/hotel-commerce/front/src/lib/offers-demo.ts) builds the request for:

- `POST /offers/generate`

The request is centered on:

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

The parser accepts mixed camelCase and snake_case fields, including:

- `propertyId` or `property_id`
- `priceBasisUsed` or `price_basis_used`
- `configVersion` or `config_version`
- `recommended_room`
- `recommended_offers`
- `ranked_rooms`
- `fallback`
- `debug`

### Offer logs

[src/lib/api-client.ts](/Users/mikehsieh/Builds/hotel-commerce/front/src/lib/api-client.ts) currently calls:

- `GET /properties`
- `GET /offers/logs`
- `GET /offers/logs/:decisionId`

Current UI behavior:

- `/demo`, `/demo/offers`, `/demo/offers/logs`, and `/demo/chat` all rely on property selection
- shared property helpers append `Demo Property` as the final fallback option
- offer log list queries use pagination via `cursor`
- detail fetches request `includeRawPayloads=true` and `payloadCapKb=512`
- log detail is mapped back into the same offer decision panels used by `/demo/offers`

### Concierge endpoints

The concierge demos depend on:

- `GET /properties`
- `POST /properties/:propertyId/concierge/answer`

The frontend consumes fields such as:

- `data.answer`
- `data.confidence`
- `data.sources`
- `data.answer_type`

### Authenticated dashboard and settings

When `NEXT_PUBLIC_API_BASE_URL` is configured:

- `/dashboard` calls `GET /analytics/usage`, `GET /projects`, `GET /activity`, `GET /users/me/sessions`, and `POST /ai/generate`
- `/settings` updates profile and password through `updateUserProfile` and `changeUserPassword`

## Feature Notes

### `/demo`

- combines a checkout-style booking form, concierge thread, and offer presentation
- shares property scope across offer generation and concierge requests
- supports restarting the concierge locally without a page reload

### `/demo/offers`

- preset scenarios populate request drafts for several traveler patterns
- advanced JSON overrides merge into the request payload
- responses are normalized into reusable decision panels

### `/demo/offers/logs`

- table-first log view with local property filtering
- opening a decision loads detailed normalized payloads
- detail rendering degrades gracefully when only partial payload data is available

### `/demo/chat`

- property changes reset local session state and URL state
- validation, retry, expiry, and rate-limit states are handled in the UI
- room recommendation rendering prefers `commerce.recommended_room` and falls back to ranked rooms

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/app` | App Router routes |
| `src/components/auth` | Auth form and route guard |
| `src/components/chat` | Chat demo UI and message rendering |
| `src/components/checkout` | Checkout-style demo flow |
| `src/components/dashboard` | Protected dashboard cards and activity feed |
| `src/components/layout` | Shared shell and header |
| `src/components/offers` | Offer generator, logs dashboard, and decision panels |
| `src/components/ui` | shadcn/ui primitives |
| `src/hooks` | React Query hooks |
| `src/lib/api-client.ts` | Backend client, normalization, and mocks |
| `src/lib/demo-properties.ts` | Shared property-option helpers |
| `src/lib/offers-demo.ts` | Offer request builder, presets, validation, and response parsing |
| `src/test/setup.js` | Vitest setup |

## Verification

After code changes, run:

```bash
pnpm lint
npx tsc --noEmit
```

If you changed tests or UI behavior, also run:

```bash
pnpm test
```
