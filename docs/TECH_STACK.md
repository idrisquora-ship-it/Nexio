# Nexio — Technology Stack

## Purpose

This document defines the **approved technologies** for Nexio. All implementation must align with this stack unless a change is documented in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) Section 25.

---

## Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE CLIENT                         │
│    React Native · Expo · TypeScript · Expo Router        │
│    TanStack Query · Zustand · Zod · Reanimated           │
│    Expo Image · Expo AV · SecureStore · FlashList        │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS / WSS
┌─────────────────────────▼───────────────────────────────┐
│                    SUPABASE                              │
│  Auth · PostgreSQL · Realtime · Storage · Edge Functions │
└─────────────────────────┬───────────────────────────────┘
          ┌───────────────┼───────────────┐
          │               │               │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
   │   LiveKit   │ │  FCM/APNs   │ │   Sentry    │
   │  Voice/Video│ │    Push     │ │   Errors    │
   └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Frontend (Mobile)

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform native UI |
| **Expo** | Build, OTA updates, native modules |
| **TypeScript** | Strict typing (entire monorepo) |
| **Expo Router** | File-based navigation, deep links |
| **React Native Reanimated** | Premium animations |
| **React Native Gesture Handler** | Gestures, swipe actions |
| **React Hook Form** | Form state |
| **Zod** | Validation (shared with Edge Functions) |
| **Expo Image** | Image caching, placeholders |
| **Expo AV** | Voice notes, video record/playback |
| **Expo Notifications** | Push registration and handling |
| **Expo SecureStore** | JWT refresh, sensitive prefs |
| **TanStack Query** | Server state, caching, sync |
| **Zustand** | Global UI state (minimal) |
| **Victory Native** | Business analytics charts (Phase 5) |
| **Lucide React Native** | Icons (design system) |
| **FlashList** | Virtualized lists |
| **WatermelonDB** or **Expo SQLite** | Offline message cache |

### Platform Targets

| Platform | Phase |
|----------|-------|
| iOS 15+ | 1 |
| Android API 26+ | 1 |
| Web (Expo Web) | 7+ |

---

## Backend (Supabase)

| Service | Usage |
|---------|-------|
| **Supabase Auth** | Email/password, Google, Apple; optional phone OTP (Settings) |
| **PostgreSQL** | All application data with RLS |
| **Supabase Realtime** | Messages, typing, presence, order updates |
| **Supabase Storage** | 14 buckets — see PROJECT_ARCHITECTURE.md |
| **Edge Functions** | Tokens, push, search, cron, payments (future) |
| **Row Level Security** | Mandatory on every table |

---

## Voice & Video

| Technology | Scope |
|------------|-------|
| **LiveKit Cloud** | Voice, video, group calls, future screen share |
| **Supabase** | Call history, participants, duration, missed calls |

LiveKit handles **media transport only**.

---

## Push Notifications

| Platform | Service |
|----------|---------|
| Android | Firebase Cloud Messaging (FCM) |
| iOS | Apple Push Notification Service (APNs) |
| Client | Expo Notifications (unified API) |

---

## State & Networking

| Concern | Technology |
|---------|------------|
| Server/async state | TanStack Query |
| Global UI state | Zustand |
| Form state | React Hook Form |
| Validation | Zod |
| Offline queue | SQLite / WatermelonDB |

---

## Development Tooling

| Tool | Purpose |
|------|---------|
| **pnpm** | Monorepo package manager |
| **ESLint + Prettier** | Lint and format |
| **Husky + lint-staged** | Pre-commit gates |
| **Supabase CLI** | Migrations, types, local dev |
| **GitHub Actions** | CI/CD |
| **EAS** | Mobile builds and OTA |
| **Sentry** | Crash and error monitoring |
| **Maestro** | E2E tests (Phase 2+) |

---

## Environment Variables

### Client (public)

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_LIVEKIT_URL
```

### Server-only (Edge Functions)

```text
SUPABASE_SERVICE_ROLE_KEY
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
STRIPE_SECRET_KEY          # Phase 7
CRON_SECRET                # Scheduled functions
```

---

## What We Are NOT Using (Launch)

| Technology | Reason |
|------------|--------|
| Custom Node.js API | Supabase + Edge Functions sufficient |
| Redux | TanStack Query + Zustand sufficient |
| Native Swift/Kotlin apps | Velocity; RN meets premium UX goals |
| GraphQL | Supabase client + RPC simpler for MVP |
| Firebase Firestore | PostgreSQL + RLS preferred |

---

## Related Documents

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) Section 25 — Full technical architecture
- [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) — System design detail
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) — How to use the stack

---

*Last updated: June 2026 — Part 4A*
