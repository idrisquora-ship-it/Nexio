# Nexio — Project Architecture

## Purpose

This document describes the **system architecture** for Nexio: components, data flows, security model, offline strategy, and scalability considerations. It is the technical companion to IMPLEMENTATION_PLAN.md.

---

## Architecture Principles

1. **Production-grade from day one** — No shortcuts; no hardcoded business logic (see IMPLEMENTATION_PLAN.md §25.1).
2. **Mobile-first client** — All UX and performance decisions prioritize the mobile app.
3. **Supabase as backend** — Auth, database, realtime, storage, and serverless functions in one platform.
4. **Security at the data layer** — RLS on **every** table; Edge Functions for secrets and privileged ops.
5. **Offline-capable messaging** — Local cache + outbound queue; sync on reconnect.
6. **Realtime where it matters** — Subscribe on focus; unsubscribe on blur.
7. **Modular database** — Independent domain modules (see Database Modules below).
8. **Configuration over constants** — Seller levels, ranking, feature flags in DB tables.
9. **Eventual consistency tolerance** — Optimistic UI with reconciliation for messages.

---

## High-Level System Diagram

```
                    ┌──────────────┐
                    │   iOS App    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐         ┌─────────────┐
                    │  Android App │         │  LiveKit    │
                    └──────┬───────┘         │  Cloud SFU  │
                           │                 └──────▲──────┘
                           │                        │
                    ┌──────▼────────────────────────┴──┐
                    │         Mobile Client             │
                    │  ┌─────────┐  ┌────────────────┐  │
                    │  │ UI Layer│  │ Local Database │  │
                    │  └────┬────┘  │ (offline cache)│  │
                    │       │       └────────┬───────┘  │
                    │  ┌────▼─────────────────▼───────┐  │
                    │  │   Sync & State Layer        │  │
                    │  │ (Query cache, sync queue)   │  │
                    │  └────────────┬───────────────┘  │
                    └───────────────┼──────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
       ┌──────▼──────┐    ┌─────────▼────────┐   ┌──────▼──────┐
       │ Supabase    │    │ Supabase         │   │ Supabase    │
       │ Auth        │    │ Realtime         │   │ Storage     │
       └──────┬──────┘    └─────────┬────────┘   └──────┬──────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                           ┌────────▼────────┐
                           │   PostgreSQL    │
                           │   (+ RLS)       │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │ Edge Functions  │
                           │ (tokens, push)  │
                           └─────────────────┘
```

---

## Client Architecture (Mobile)

### Layers

| Layer | Responsibility |
|-------|----------------|
| **Presentation** | Screens, components, navigation, animations |
| **Application** | Use cases, hooks, form logic, orchestration |
| **Domain** | Types, validators, business rules (pure functions) |
| **Data** | Supabase client, local DB, sync engine, repositories |
| **Infrastructure** | Config, logging, analytics, push registration |

### Module Boundaries

Features are organized by domain (see FOLDER_STRUCTURE.md):

- `auth` — login, signup, session
- `messaging` — conversations, messages, media
- `calls` — LiveKit integration
- `profiles` — user/business identity
- `marketplace` — gigs, orders, inquiries
- `communities` — groups, channels
- `discovery` — explore, search
- `notifications` — push, in-app
- `shared` — design system, utils, API client

**Rule:** Features may import from `shared` and `domain` but not from sibling features directly — use shared contracts or events.

---

## Database Modules

Independent modules — each with own migrations, RLS, and repository layer. Full table list in IMPLEMENTATION_PLAN.md §25.4.

| Module | Purpose |
|--------|---------|
| Authentication | Supabase Auth + profile linkage |
| Profiles | User identity, username, privacy |
| Business | Business profiles, verification, follows |
| Messaging | Conversations, messages, reactions |
| Calls | Session metadata (media in LiveKit) |
| Marketplace | Gigs, portfolio, favorites |
| Orders | Order lifecycle, events |
| Reviews | Post-completion ratings |
| Communities / Groups / Channels | Social structures |
| Stories | Ephemeral content |
| Notifications | Devices, preferences, log |
| Settings | User and privacy settings |
| Analytics | Aggregated metrics |
| Moderation | Reports, actions |
| Configuration | Business rules, feature flags |
| Administration | Admin users, audit logs |

**Standard columns:** `id` (UUID), `created_at`, `updated_at`; `deleted_at` where soft delete applies.

---

## Backend Architecture (Supabase)

### Database Domains (Conceptual)

| Domain | Core Entities |
|--------|-----------------|
| Identity | users, profiles, settings, blocks |
| Social graph | follows, contacts (optional) |
| Messaging | conversations, participants, messages, reactions, read receipts |
| Media | attachments (metadata in DB, blobs in Storage) |
| Marketplace | gigs, packages, orders, reviews, portfolio, favorites, business_posts |
| Marketplace config | marketplace_config, seller_level_definitions, seller_level_requirements, ranking_weights |
| Business | business_profiles, verification_submissions, seller_metrics, business_follows |
| Communities | communities, members, roles, channels |
| Calls | call_sessions, participants |
| Configuration | marketplace_config, seller_level_*, ranking_weights, feature_flags |
| Admin | admin_users, audit_logs |

### Realtime Channels

| Channel Pattern | Events |
|-----------------|--------|
| `conversation:{id}` | new_message, message_updated, typing, read |
| `presence:user:{id}` | online, offline |
| `order:{id}` | status_changed |
| `community:{id}` | new_post, member_joined |

### Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `generate-livekit-token` | HTTP (auth) | Mint LiveKit JWT for call participants |
| `search-gigs` | HTTP (auth) | Ranked marketplace search with config weights |
| `evaluate-seller-levels` | Cron | Nightly seller level progression |
| `send-push-notification` | DB webhook / HTTP | Dispatch FCM/APNs |
| `on-message-created` | DB insert trigger | Push, unread counts (async) |
| `search-global` | HTTP (auth) | Multi-domain search |
| `aggregate-analytics` | Cron | Hourly metrics rollups |
| `process-verification` | HTTP (admin) | Verification approve/reject |
| `export-user-data` | HTTP (auth) | GDPR data export |
| `delete-account` | HTTP (auth) | Account deletion |
| `cleanup-temp-uploads` | Cron | Purge temporary_uploads bucket |
| `create-payment-intent` | HTTP (auth) | Stripe (Phase 7) |
| `stripe-webhook` | HTTP | Stripe events (Phase 7) |

---

## Data Flow: Send Message

```
1. User taps Send
2. Client validates input (Zod)
3. Client writes message to local DB (status: pending)
4. UI updates optimistically
5. Client inserts row to Supabase messages table
6. RLS validates sender is conversation participant
7. Realtime broadcasts to conversation channel
8. Recipient clients receive event → update local DB
9. Sender client receives ack → update status: sent
10. On failure → status: failed, show retry
11. Edge function optionally triggers push if recipient offline
```

---

## Data Flow: Start Video Call

```
1. User taps Video in thread
2. Client calls Edge Function with conversation_id + callee ids
3. Edge Function verifies membership, creates call_session row
4. Edge Function returns LiveKit token + room name for each participant
5. Clients join LiveKit room
6. Call events update call_session (started, ended, duration)
7. System message inserted in conversation thread
```

---

## Data Flow: Contact Seller (Gig)

```
1. User taps Contact Seller on gig detail
2. Client finds or creates 1:1 conversation with seller
3. Client sends gig context card (message type=gig_inquiry + gig_id)
4. Seller receives push; thread becomes workspace
5. Requirements discussed in standard messaging
6. Seller creates Agreement (order proposal in-chat)
7. Buyer accepts → order row created (status: in_progress)
8. Status updates post as system messages + order cards
9. Seller delivers → buyer accepts → completed → review prompts
```

---

## Data Flow: Ranked Marketplace Search

```
1. User enters query + optional filters (bottom sheet)
2. Client calls Edge Function search-gigs (or RPC)
3. Server loads ranking_weights from marketplace_config
4. Server computes relevance + quality score per gig
5. Results returned pre-sorted (never random)
6. Client renders with skeleton → results fade-in
```

---

## Marketplace Configuration Architecture

Business rules live in **database configuration** — not application constants.

| Config Entity | Purpose | Updated By |
|---------------|---------|------------|
| `marketplace_config` | Global flags, default gig limits, platform fee % | Admin |
| `seller_level_definitions` | Level names, max active gigs | Admin |
| `seller_level_requirements` | Metric thresholds per level | Admin |
| `ranking_weights` | Search ranking factor weights | Admin |

**Level evaluation:** Nightly Edge Function or pg_cron job reads `seller_level_requirements`, compares against `seller_metrics` aggregates, upgrades level if met.

**Gig publish:** Client fetches seller's level → reads max gigs from config → blocks publish if at limit.

See IMPLEMENTATION_PLAN.md Section 16.11–16.13, 16.21, 16.30.

---

## Security Architecture

### Authentication

- Supabase Auth issues JWT access + refresh tokens
- Mobile stores session in secure storage (Expo SecureStore)
- Token refresh handled by Supabase client SDK

### Authorization (RLS)

Every table has RLS enabled. Examples:

| Table | Policy Summary |
|-------|----------------|
| messages | SELECT/INSERT if user is conversation participant |
| profiles | SELECT public fields for all; UPDATE own row only |
| gigs | SELECT published for all; INSERT/UPDATE own seller rows |
| orders | SELECT if buyer or seller on order |

**Rule:** No table without RLS in production. See IMPLEMENTATION_PLAN.md §25.7 for full policy categories.

### Rate Limiting

Edge Functions enforce per-user and per-IP limits (see §25.14). Shared middleware in `_shared/rate-limit.ts`.

### Audit Logging

Admin actions, verification decisions, and payment events write to `audit_logs`.

---

## API Documentation

All endpoints documented using the template in IMPLEMENTATION_PLAN.md §25.16. Implementation creates `docs/api/` with one file per Edge Function and RPC.

---

### Storage Buckets (Part 4A)

| Bucket | Visibility | Notes |
|--------|------------|-------|
| `avatars` | Public | User profile photos |
| `covers` | Public | Profile cover images |
| `business_logos` | Public | Business avatar |
| `business_banners` | Public | Business cover |
| `chat_images` | Private | Signed URLs; participant access |
| `chat_videos` | Private | Signed URLs; participant access |
| `voice_notes` | Private | Signed URLs |
| `documents` | Private | PDF, Office, ZIP in chat |
| `gig_images` | Public | Published gig media |
| `gig_videos` | Public | Published gig video |
| `portfolio` | Public | Business portfolio |
| `stories` | Private* | Privacy-dependent access |
| `status` | Public | Legacy alias — prefer `stories` |
| `temporary_uploads` | Private | 24h TTL; cron cleanup |

Path convention: `{bucket}/{owner_user_id}/{resource_id}/{filename}`

Full permission matrix: IMPLEMENTATION_PLAN.md §25.8.

### LiveKit Security

- API secret only in Edge Functions
- Tokens scoped to room + participant identity + TTL (e.g., 1 hour)
- Room names non-guessable (UUID-based)

---

## Offline Architecture

### Goals

- Previously loaded conversations remain readable offline
- Outbound messages queue and auto-send on reconnect
- Media uploads resume on reconnect

### Local Database

Store locally:

- Conversations list (cached)
- Messages for open/recent conversations
- Pending outbound messages queue
- User profile (self)
- Draft messages

### Sync Strategy

| Direction | Strategy |
|-----------|----------|
| Pull | On app foreground + reconnect: fetch deltas since `last_synced_at` |
| Push | Realtime subscription when online |
| Send queue | FIFO retry with exponential backoff |
| Media upload | Background task; chunk resume via Storage SDK |
| Conflict | Last-write-wins for edits; client-generated UUID for idempotency |

### Offline UX

- Persistent subtle banner when offline
- Failed sends show retry affordance
- Read-only mode for uncached conversations with friendly message

---

## Scalability Considerations

### Near Term (0–10K DAU)

- Supabase Pro tier sufficient
- Realtime channels per conversation — acceptable fanout
- Storage CDN for media delivery
- Connection pooling via Supabase default

### Medium Term (10K–100K DAU)

- Index optimization on messages (conversation_id, created_at)
- Partition messages table by time (monthly) if query latency grows
- Rate limiting on Edge Functions
- Push notification batching
- LiveKit auto-scaling (cloud managed)

### Long Term (100K+ DAU)

- Read replicas for analytics and search
- Dedicated search (Meilisearch / Typesense) for messages and gigs
- Message archive tier (cold storage)
- Regional Supabase or multi-region if global
- CQRS for notification fanout if needed

---

## Observability

| Signal | Tool |
|--------|------|
| Crashes | Sentry |
| Performance | Sentry transactions + React Native perf monitor |
| Product analytics | PostHog / Amplitude |
| Backend logs | Supabase dashboard + Edge Function logs |
| Uptime | External ping on Edge Function health endpoint |

---

## Deployment Architecture

```
Developer → GitHub → GitHub Actions → EAS Build → App Store / Play Store
                    ↓
              Supabase CLI migrations → Hosted PostgreSQL
                    ↓
              Edge Functions deploy → Supabase Functions
```

See IMPLEMENTATION_PLAN.md for release strategy details.

---

## Future Architecture (Not MVP)

- Stripe Connect for marketplace payments
- Full-text search service
- Admin moderation dashboard (web)
- Web client sharing mobile design system tokens
- End-to-end encryption for messages (significant complexity — evaluate post-PMF)

---

## Related Documents

- [TECH_STACK.md](./TECH_STACK.md) — Technology choices
- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) — Code layout
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — Build phases

---

*Last updated: June 2026*
