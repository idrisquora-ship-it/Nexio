# Nexio

Messaging-first social commerce app — React Native (Expo) + Supabase.

## Android package name (Firebase FCM)

Use this when registering the Android app in Firebase Console:

```
com.nexio.app
```

iOS bundle identifier: `com.nexio.app`

After downloading `google-services.json` from Firebase, place it at `apps/mobile/google-services.json` and uncomment `googleServicesFile` in `apps/mobile/app.config.ts`.

> FCM push delivery is implemented in **Phase 2**. Phase 1 only defines the package name for Firebase project setup.

## Payments

Payments are **not** in scope until Phase 9 (post-v1.0). No payment SDKs are included.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- Expo Go or simulators (iOS / Android)
- Supabase project

## Setup

```bash
pnpm install
cp .env.example apps/mobile/.env
# Fill EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Apply database migrations (Supabase CLI or Dashboard SQL):

```bash
# supabase db push   # when CLI is linked
```

Run the mobile app:

```bash
pnpm dev
```

## Monorepo layout

| Path | Purpose |
|------|---------|
| `apps/mobile` | Expo Router mobile app |
| `packages/shared` | Zod validators, shared constants |
| `packages/supabase` | Supabase client factory + types |
| `supabase/migrations` | PostgreSQL migrations with RLS |
| `docs/` | Product & architecture documentation |

## Environment variables

**Client-safe (bundled):**

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SENTRY_DSN` (optional)

**Server-only (never in mobile bundle):**

- `SUPABASE_SERVICE_ROLE_KEY`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

## Phase 1 status

- [x] Monorepo + Expo Router shell
- [x] Design system tokens + base components
- [x] Email/password auth + onboarding (username required)
- [x] 5-tab navigation (Chats default)
- [x] Profiles migration + RLS
- [ ] Google / Apple OAuth (requires EAS + provider config)
- [ ] Sentry (add `EXPO_PUBLIC_SENTRY_DSN`)

See `docs/IMPLEMENTATION_PHASES.md` for the full roadmap.
