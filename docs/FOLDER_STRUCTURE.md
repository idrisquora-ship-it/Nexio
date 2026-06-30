# Nexio — Folder Structure

## Purpose

Scalable monorepo layout separating **screens, features, shared code, backend, docs, and tests**. Designed to scale for years. All code must follow this structure.

**Master reference:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) Section 26.1

---

## Repository Root

```text
nexio-app/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, typecheck, test
│       ├── eas-build.yml             # EAS build triggers
│       └── deploy-functions.yml      # Supabase Edge Functions deploy
│
├── apps/
│   └── mobile/                       # Expo React Native application
│
├── packages/
│   ├── shared/                       # Types, validators, constants, utils
│   ├── supabase/                     # Typed client + generated DB types
│   └── ui/                           # Design system (extract Phase 2+ if large)
│
├── supabase/
│   ├── config.toml
│   ├── migrations/                   # SQL: schema, RLS, indexes
│   ├── functions/                    # Edge Functions + _shared/
│   └── seed.sql
│
├── docs/                             # Product + engineering documentation
│   ├── api/                          # Per-endpoint API docs (Phase 1+)
│   ├── IMPLEMENTATION_PLAN.md        # Master plan
│   ├── IMPLEMENTATION_PHASES.md      # Detailed phase specs
│   └── ONBOARDING.md                 # New engineer guide
│
├── e2e/                              # Maestro flows (Phase 2+)
│   └── flows/
│
├── scripts/
│   ├── generate-types.sh
│   ├── setup-dev.sh
│   └── seed-dev-data.ts
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

---

## Mobile App — Layer Separation

```text
apps/mobile/
│
├── app/                              # SCREENS (Expo Router — thin routes only)
│   ├── (auth)/
│   ├── (tabs)/
│   ├── call/
│   ├── user/
│   └── _layout.tsx                   # PROVIDERS root
│
├── src/
│   ├── features/                     # FEATURES (domain modules)
│   │   ├── auth/
│   │   ├── profiles/
│   │   ├── messaging/
│   │   ├── calls/
│   │   ├── marketplace/
│   │   ├── business/
│   │   ├── orders/
│   │   ├── communities/
│   │   ├── updates/
│   │   ├── notifications/
│   │   ├── settings/
│   │   └── admin/                    # Phase 8
│   │
│   ├── shared/
│   │   ├── components/               # COMPONENTS (design system)
│   │   ├── hooks/                    # HOOKS (cross-feature)
│   │   ├── stores/                   # STORES (global Zustand)
│   │   ├── lib/                      # UTILITIES
│   │   ├── constants/                # App constants (non-config)
│   │   ├── theme/                    # Design tokens
│   │   └── navigation/               # NAVIGATION helpers
│   │
│   ├── providers/                    # PROVIDERS
│   │   ├── AuthProvider.tsx
│   │   ├── QueryProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── RealtimeProvider.tsx
│   │   └── NetworkProvider.tsx
│   │
│   └── infrastructure/               # External service clients
│       ├── supabase.ts
│       ├── sentry.ts
│       ├── analytics.ts
│       └── storage.ts
│
├── assets/                           # ASSETS
│   ├── fonts/
│   ├── images/
│   └── animations/
│
├── __tests__/                        # TESTING (app-level)
├── app.json
├── eas.json
└── package.json
```

---

## Feature Module Structure

Every feature follows the same internal layout:

```text
features/{feature}/
├── components/           # Feature-specific COMPONENTS
├── hooks/                # HOOKS
├── services/             # SERVICES (repositories)
├── stores/               # STORES (feature Zustand, if needed)
├── types.ts              # TYPES (feature-local)
├── constants.ts          # Feature constants
├── utils.ts              # Feature UTILITIES
└── index.ts              # Public exports
```

### Feature List → Domain

| Feature Folder | Database Module | Phase |
|----------------|-----------------|-------|
| `auth` | Authentication | 1 |
| `profiles` | Profiles | 1–2 |
| `messaging` | Messaging | 2 |
| `calls` | Calls | 3 |
| `marketplace` | Marketplace | 4 |
| `business` | Business | 4 |
| `orders` | Orders | 5 |
| `communities` | Communities, Groups, Channels | 6 |
| `updates` | Stories, business posts | 6 |
| `notifications` | Notifications | 7 |
| `settings` | Settings | 1+ |
| `admin` | Administration, Moderation | 8 |

---

## Screens vs Components Rule

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Screen** | `app/**/*.tsx` | Route params, layout, compose feature hooks |
| **Feature component** | `features/*/components/` | Domain UI (MessageBubble, GigCard) |
| **Shared component** | `shared/components/` | Generic UI (Button, Card, Sheet) |

**Screens must stay thin** — no direct Supabase calls in `app/` routes.

---

## Packages

### `packages/shared/`

```text
packages/shared/src/
├── types/                # TYPES (cross-cutting)
├── validators/           # Zod schemas (client + Edge Functions)
├── constants/            # CONSTANTS (categories, limits — not business rules)
└── utils/                # UTILITIES (date, currency, format)
```

### `packages/supabase/`

```text
packages/supabase/src/
├── client.ts
├── database.types.ts     # Generated — do not edit manually
└── index.ts
```

---

## Database & Edge Functions

```text
supabase/
├── migrations/
│   ├── 00001_auth_profiles.sql
│   ├── 00002_messaging.sql
│   ├── 00003_calls.sql
│   ├── 00004_marketplace_business.sql
│   ├── 00005_orders_reviews.sql
│   ├── 00006_communities_stories.sql
│   ├── 00007_notifications.sql
│   ├── 00008_admin_moderation.sql
│   └── 00009_configuration.sql
│
└── functions/
    ├── generate-livekit-token/
    ├── send-push-notification/
    ├── search-gigs/
    ├── search-global/
    ├── evaluate-seller-levels/
    ├── aggregate-analytics/
    ├── process-verification/
    ├── cleanup-temp-uploads/
    └── _shared/
        ├── auth.ts
        ├── cors.ts
        ├── rate-limit.ts
        └── errors.ts
```

---

## Testing Layout

```text
# Co-located unit tests
features/messaging/components/MessageBubble.test.tsx

# Integration tests
features/messaging/services/messageRepository.test.ts

# RLS tests
supabase/tests/rls/messaging.test.sql

# E2E
e2e/flows/send-message.yaml
e2e/flows/contact-seller.yaml
```

---

## Import Boundaries

```
app/screens → features → shared → packages/shared
                         ↓
                  packages/supabase

supabase/functions → packages/shared/validators

FORBIDDEN:
  features/A → features/B (use shared types or events)
  packages/shared → apps/mobile
  Edge Functions → apps/mobile
```

---

## Scaling Guidelines

| When | Action |
|------|--------|
| Design system > 20 components | Extract to `packages/ui/` |
| Feature > 15 components | Split subfolders (`messaging/components/thread/`) |
| Shared hook used by 3+ features | Move to `shared/hooks/` |
| New domain (e.g. payments) | New `features/payments/` + migration prefix |

---

## Related Documents

- [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) §26
- [ONBOARDING.md](./ONBOARDING.md)

---

*Last updated: June 2026 — Part 4B*
