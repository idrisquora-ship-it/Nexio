# Nexio — Developer Onboarding

Welcome to Nexio. This guide gets you productive without needing to talk to the founders.

---

## What Is Nexio?

Nexio is a **premium mobile-first** platform that combines messaging and business in one app. Messaging is the heart; marketplace, calls, and communities extend naturally from conversations.

**Not:** WhatsApp + Fiverr bolted together. **Is:** One ecosystem where hiring happens inside chat.

---

## Read These First (In Order)

| # | Document | Time | Why |
|---|----------|------|-----|
| 1 | [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | 15 min | Product domains and user journeys |
| 2 | [VISION_AND_GOALS.md](./VISION_AND_GOALS.md) | 10 min | Mission, non-goals, success metrics |
| 3 | [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) §1–5 | 20 min | Core principles, account types |
| 4 | [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md) | 15 min | **What to build now** — current phase |
| 5 | [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | 10 min | Where code lives |
| 6 | [TECH_STACK.md](./TECH_STACK.md) | 10 min | Approved technologies |
| 7 | [CODING_STANDARDS.md](./CODING_STANDARDS.md) | 10 min | How we write code |

**When building UI:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) + [UI_UX_GUIDELINES.md](./UI_UX_GUIDELINES.md)

**When building backend:** [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) + IMPLEMENTATION_PLAN §25

**When building marketplace:** IMPLEMENTATION_PLAN §16

---

## Key Rules (Non-Negotiable)

1. **Messaging-first** — Every feature connects to chat (§5).
2. **No hardcoded business logic** — Use configuration tables (§25.13).
3. **RLS on every table** — No exceptions (§25.7).
4. **Contact Seller opens chat** — Never a separate inquiry form (§16.18).
5. **Admin does not approve signups, gigs, or stories** — Only verification + moderation (§26.5).
6. **Username required; phone optional** (§6–7).
7. **Design tokens only** — No raw hex in feature code (DESIGN_SYSTEM.md).
8. **Docs lead code** — Update docs when scope changes.

---

## Repository Layout (Quick Reference)

```text
nexio-app/
├── apps/mobile/          # Expo React Native app
├── packages/shared/      # Types, validators, constants
├── packages/supabase/    # Typed Supabase client
├── supabase/             # Migrations, Edge Functions
└── docs/                 # You are here
```

Screens = `app/` (Expo Router). Logic = `src/features/`. Shared UI = `src/shared/`.

---

## Current Project Status

| Item | Status |
|------|--------|
| Documentation | **Complete** (v1.4.0) |
| Application code | **Not started** — await explicit approval |
| Infrastructure | Supabase + LiveKit provisioned |

**Do not write application code until Phase 1 is explicitly approved.**

---

## Implementation Phases (Summary)

| Phase | Focus |
|-------|-------|
| 0 ✅ | Documentation |
| 1 | Init, design system, auth, navigation |
| 2 | Profiles, messaging, realtime |
| 3 | Calls, media, groups |
| 4 | Marketplace, business, gigs |
| 5 | Orders, reviews, verification |
| 6 | Communities, stories, updates |
| 7 | Notifications, offline, performance |
| 8 | Admin, polish, **v1.0** |
| 9 | Payments (post-v1.0) |

Full specs: [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md)

---

## Getting Help

- Product questions → IMPLEMENTATION_PLAN.md + PROJECT_OVERVIEW.md
- Architecture questions → PROJECT_ARCHITECTURE.md §25
- Naming questions → NAMING_CONVENTIONS.md
- UX questions → UI_UX_GUIDELINES.md

---

*Last updated: June 2026*
