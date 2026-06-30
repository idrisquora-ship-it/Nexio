# Nexio — Implementation Phases (Detailed)

> **Authoritative phase specifications.** Referenced from [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) Section 28.
> Do not start a phase until the prior phase meets its Definition of Done.

---

## Phase Dependency Graph

```
Phase 0 (Documentation) ✅
    └── Phase 1 (Init, Design System, Auth, Navigation)
            └── Phase 2 (Profiles, Messaging, Realtime, Presence)
                    └── Phase 3 (Calls, Media, Voice Notes, Groups)
                            └── Phase 4 (Marketplace, Business, Gigs, Portfolio)
                                    └── Phase 5 (Orders, Reviews, Verification, Ranking)
                                            └── Phase 6 (Communities, Channels, Stories, Updates)
                                                    └── Phase 7 (Notifications, Offline, Performance, Security)
                                                            └── Phase 8 (Admin, Moderation, Analytics, Polish)
                                                                    └── v1.0 Public Launch
                                                                            └── Phase 9 (Payments — post-v1)
```

---

## Phase 0: Foundation & Documentation ✅

**Status:** Complete — v1.4.0 (Parts 1–4B)

### Goal

Establish complete product and engineering documentation before any application code.

### Definition of Done

- [x] All docs in `/docs` complete and cross-referenced
- [x] IMPLEMENTATION_PLAN.md v1.4+ covers UX, marketplace, architecture, phases
- [x] No application code generated
- [x] Supabase + LiveKit provisioned

---

## Phase 1: Project Initialization, Design System, Navigation, Authentication

**Duration:** 2–3 weeks  
**Dependencies:** Phase 0  
**Release target:** Internal dev builds only

### Goal

Ship a polished authenticated app shell — monorepo, design system, 5-tab navigation, auth with username onboarding.

### Screens

| Screen | Route |
|--------|-------|
| Welcome / Splash | `(auth)/welcome` |
| Login | `(auth)/login` |
| Signup | `(auth)/signup` |
| Username selection | `(auth)/username` |
| Profile setup | `(auth)/profile-setup` |
| Tab placeholders (×5) | `(tabs)/*` |
| Settings skeleton | `(tabs)/profile/settings` |

### Components

Button, Text, TextField, Card, Avatar, ScreenHeader, TabBar, Skeleton, EmptyState, AuthForm

### Backend / Database / Storage / Realtime

| Area | Work |
|------|------|
| **Database** | `profiles`, `privacy_settings`; username unique index; RLS |
| **Auth** | Email/password, Google, Apple via Supabase Auth |
| **Storage** | `avatars` bucket + policies |
| **Edge Functions** | — |
| **Realtime** | — |

### Testing Checklist

- [ ] Auth validator unit tests
- [ ] Username uniqueness integration test
- [ ] RLS: user cannot update another profile
- [ ] Manual: signup flows iOS + Android

### Definition of Done

- [ ] `pnpm dev` runs Expo on iOS + Android simulators
- [ ] Sign up / log in / log out all auth methods
- [ ] Username required; phone NOT required
- [ ] Session persists (SecureStore)
- [ ] 5 tabs navigate; Chats default landing
- [ ] Design tokens only — no raw hex in features
- [ ] CI: lint, typecheck, test pass
- [ ] Sentry test event captured
- [ ] `.env.example` documented; no secrets in bundle

### Dependencies

Phase 0 docs, Supabase project, EAS account

### Risks

| Risk | Mitigation |
|------|------------|
| Apple Sign In config complexity | Document setup in root README |
| OAuth redirect issues | Expo AuthSession tested early |

---

## Phase 2: Profiles, Messaging, Realtime, Presence

**Duration:** 3–4 weeks  
**Dependencies:** Phase 1  
**Release target:** Internal Alpha (messaging)

### Goal

Team can chat daily — 1:1 messaging with realtime, presence, typing, read receipts foundation.

### Screens

| Screen | Route |
|--------|-------|
| Chats home | `(tabs)/chats` |
| Chat thread | `(tabs)/chats/[id]` |
| New chat / user search | `(tabs)/chats/new` |
| Edit profile | `(tabs)/profile/edit` |
| Other user profile | `user/[id]` |
| Privacy settings | `profile/settings/privacy` |

### Components

ConversationRow, MessageBubble, MessageInput, DateDivider, TypingIndicator, OnlineBadge, ReplyBanner, MessageActionsSheet

### Backend / Database / Storage / Realtime

| Area | Work |
|------|------|
| **Database** | `conversations`, `conversation_participants`, `messages`, `read_receipts` |
| **RLS** | Participant-only message access |
| **Storage** | — (text only this phase) |
| **Realtime** | `conversation:{id}` postgres_changes + typing broadcast |
| **Edge Functions** | `send-push-notification`, `on-message-created` |
| **Offline** | SQLite cache + send queue v1 |

### Testing Checklist

- [ ] Message repository integration tests
- [ ] RLS multi-user tests
- [ ] E2E: send message between two devices
- [ ] Offline queue flush test

### Definition of Done

- [ ] Real-time 1:1 messaging with optimistic send
- [ ] Message status: sending, sent, delivered, read, failed
- [ ] Conversation list: preview, unread, typing indicator
- [ ] Swipe: archive, mute, pin, delete
- [ ] Presence + typing (privacy-respecting)
- [ ] Optional phone add in Settings + OTP
- [ ] Push notification on new message (background)
- [ ] Offline read + queued send
- [ ] FlashList 60fps on 500+ messages

### Dependencies

Phase 1, FCM/APNs credentials

### Risks

| Risk | Mitigation |
|------|------------|
| Realtime connection drops | Reconnect + catch-up sync |
| Offline sync conflicts | Client UUID idempotency |

---

## Phase 3: Calls, Voice Notes, Media, Groups

**Duration:** 4–5 weeks  
**Dependencies:** Phase 2  
**Release target:** Internal Alpha complete

### Goal

Full communication — rich media, voice notes, groups, 1:1 voice/video calls.

### Screens

| Screen | Route |
|--------|-------|
| Active call | `call/[roomId]` |
| Calls tab | `(tabs)/calls` |
| Group info | `group/[id]/info` |
| Create group | `chats/new-group` |
| Media viewer | modal |

### Components

VoiceNoteRecorder, VoiceNotePlayer, MediaPickerSheet, ImageMessage, VideoMessage, FileMessage, CallControls, GroupMemberList, ReactionPicker

### Backend / Database / Storage / Realtime

| Area | Work |
|------|------|
| **Database** | Group conversation types, `call_sessions`, `call_participants`, reactions |
| **Storage** | `chat_images`, `chat_videos`, `voice_notes`, `documents` |
| **Realtime** | Group conversation channels |
| **Edge Functions** | `generate-livekit-token` |
| **LiveKit** | 1:1 voice + video |

### Testing Checklist

- [ ] Media upload integration tests
- [ ] LiveKit token generation tests
- [ ] E2E: group chat 3+ users
- [ ] E2E: voice call two devices

### Definition of Done

- [ ] Image, video, voice note, document messages
- [ ] Voice note UX per §12.4 (waveform, speeds)
- [ ] Groups: create, roles, 3+ member realtime
- [ ] 1:1 voice + video calls; call history tab
- [ ] Message actions: reply, forward, react, pin, star, edit, delete
- [ ] Upload resume on reconnect
- [ ] LiveKit secrets server-side only

### Dependencies

Phase 2, LiveKit provisioned

### Risks

| Risk | Mitigation |
|------|------------|
| Call quality on poor network | Adaptive bitrate; voice fallback |
| Large media uploads | Compression + resume |

---

## Phase 4: Marketplace, Business, Gigs, Portfolio

**Duration:** 5–6 weeks  
**Dependencies:** Phase 3  
**Release target:** Closed Beta (marketplace)

### Goal

Business upgrade, gig publishing, marketplace browse, portfolio, Contact Seller → chat.

### Screens

| Screen | Route |
|--------|-------|
| Marketplace home | `(tabs)/marketplace` |
| Gig detail | `marketplace/gig/[id]` |
| Create gig (5 steps) | `marketplace/create/*` |
| Business profile | `business/[username]` |
| Become Business | `settings/become-business` |
| Seller dashboard (core) | `(tabs)/marketplace` (business view) |
| Portfolio manager | `marketplace/portfolio` |

### Components

GigCard, CategoryChips, PackageTierCard, BusinessProfileHeader, PortfolioGrid, ContactSellerBar, SellerDashboardCard, GigCreateWizard

### Backend / Database / Storage / Realtime

| Area | Work |
|------|------|
| **Database** | `business_profiles`, `gigs`, `gig_packages`, `portfolio_items`, `favorites`, `marketplace_config` seed |
| **Storage** | `business_logos`, `business_banners`, `gig_images`, `gig_videos`, `portfolio` |
| **Edge Functions** | `search-gigs` v1 |
| **Realtime** | — |

### Testing Checklist

- [ ] Gig CRUD + RLS tests
- [ ] Active gig limit from config test
- [ ] E2E: publish gig → visible in marketplace
- [ ] E2E: Contact Seller opens chat

### Definition of Done

- [ ] Become Business without losing personal data
- [ ] 5-step gig create with Basic/Standard/Premium packages
- [ ] Marketplace home: sections max 6–8 + See All
- [ ] Search + filter bottom sheet
- [ ] Contact Seller instant chat with gig card
- [ ] Portfolio CRUD on business profile
- [ ] Favorites (gigs, businesses)
- [ ] Business QR + share link
- [ ] Gig limits from config not hardcoded

### Dependencies

Phase 3 messaging for Contact Seller flow

### Risks

| Risk | Mitigation |
|------|------------|
| Scope creep vs Fiverr | §16.1 philosophy gate |
| Marketplace UX crowded | Design review per §16.3 |

---

## Phase 5: Orders, Reviews, Verification, Ranking

**Duration:** 5–6 weeks  
**Dependencies:** Phase 4  
**Release target:** Closed Beta (transactions)

### Goal

Complete hire-to-review loop in chat; verification; config-driven seller levels and search ranking.

### Screens

| Screen | Route |
|--------|-------|
| Order agreement (in-chat) | message action |
| Order detail | `marketplace/orders/[id]` |
| Review flow | bottom sheet |
| Verification submit | `settings/verification` |
| Analytics (summary) | `marketplace/analytics` |

### Components

OrderCard, AgreementSheet, ReviewForm, VerificationUpload, SellerLevelBadge, RatingBreakdown

### Backend / Database / Storage / Realtime

| Area | Work |
|------|------|
| **Database** | `orders`, `order_events`, `reviews`, `verification_submissions`, `seller_metrics`, config tables |
| **Storage** | `verification` docs (private bucket or encrypted path) |
| **Edge Functions** | `evaluate-seller-levels`, `search-gigs` ranked, `process-verification` |
| **Realtime** | `order:{id}` status events |

### Testing Checklist

- [ ] Order lifecycle integration tests (all statuses §16.20)
- [ ] Review blocked without completed order
- [ ] Ranking deterministic test with mock weights
- [ ] E2E: inquiry → agreement → complete → review

### Definition of Done

- [ ] Order flow V1 entirely in chat (§16.19)
- [ ] All order statuses with system messages
- [ ] Buyer → seller reviews (multi-dimension)
- [ ] Seller → buyer reviews
- [ ] Verification submit → admin approve/reject
- [ ] Seller levels from config; nightly evaluation job
- [ ] Search ranked server-side never random
- [ ] Vacation mode blocks new orders
- [ ] 10 end-to-end test orders by beta group

### Dependencies

Phase 4 marketplace + messaging

### Risks

| Risk | Mitigation |
|------|------------|
| Order disputes | V1: no dispute system; clear UX |
| Verification backlog | Manual admin queue Phase 5; dashboard Phase 8 |

---

## Phase 6: Communities, Channels, Stories, Updates

**Duration:** 5–6 weeks  
**Dependencies:** Phase 5  
**Release target:** Open Beta

### Goal

Social layer — communities, broadcast channels, stories, unified Updates tab; business posts.

### Screens

| Screen | Route |
|--------|-------|
| Updates feed | `(tabs)/updates` |
| Story viewer / creator | `updates/story/*` |
| Channel view | `updates/channel/[id]` |
| Community detail | `community/[id]` |
| Create community | `community/create` |
| Business post create | `marketplace/posts/create` |

### Components

StoryRing, StoryViewer, ChannelPostCard, CommunityHeader, BusinessPostCard, UpdatesFeedSection

### Backend / Database / Storage / Realtime

| Area | Work |
|------|------|
| **Database** | `communities`, `channels`, `channel_posts`, `stories`, `story_views`, `business_posts`, `business_follows` |
| **Storage** | `stories` bucket |
| **Realtime** | `community:{id}`, channel fanout |
| **Edge Functions** | `search-global` v1 |

### Testing Checklist

- [ ] Community RLS tests
- [ ] Story 24h expiry job test
- [ ] E2E: join community → receive message
- [ ] E2E: follow business → post in Updates

### Definition of Done

- [ ] Communities with multi-group hierarchy
- [ ] Channels: admin post, follower read/react
- [ ] Stories: post, view, reply → chat, 24h expiry
- [ ] Updates tab: stories + channels + business posts + announcements slot
- [ ] Business posts with follower notifications
- [ ] Group voice/video calls (3+ participants)
- [ ] Global search grouped results

### Dependencies

Phase 3 groups infrastructure, Phase 4 business accounts

### Risks

| Risk | Mitigation |
|------|------------|
| Updates tab complexity | Strict section limits; skeleton loading |
| Story storage costs | TTL cleanup job |

---

## Phase 7: Notifications, Offline, Performance, Security

**Duration:** 3–4 weeks  
**Dependencies:** Phase 6  
**Release target:** Open Beta hardening

### Goal

Production-grade reliability — full notification center, offline completeness, performance budgets, security audit.

### Screens

| Screen | Route |
|--------|-------|
| Notification center | `profile/notifications` |
| Notification preferences | `settings/notifications` |
| Storage management | `settings/storage` |

### Components

NotificationGroupList, NotificationRow, OfflineBanner, SyncStatusIndicator

### Backend / Database / Storage / Realtime

| Area | Work |
|------|------|
| **Database** | `notification_log`, expanded `notification_preferences` |
| **Edge Functions** | Push routing all categories §26.11 |
| **Offline** | Full queue: messages, uploads, drafts, stories |
| **Security** | RLS audit, rate limits, penetration checklist |

### Testing Checklist

- [ ] Offline E2E: send queued → reconnect → delivered
- [ ] Performance: cold launch < 2s, 60fps scroll
- [ ] Security: RLS test suite all tables
- [ ] Load test: 100 concurrent realtime connections (staging)

### Definition of Done

- [ ] Notification center grouped: Today, Yesterday, This Week, Older
- [ ] All notification categories configurable
- [ ] Offline queues: messages, media, gig drafts, stories, business edits
- [ ] Auto-sync on reconnect
- [ ] Performance budgets met (§25.21)
- [ ] Security audit complete; no critical open findings
- [ ] Crash-free > 99.5% over 7 days (staging)

### Dependencies

All prior phases

### Risks

| Risk | Mitigation |
|------|------------|
| Performance regressions | Benchmark CI gate |
| Notification overload | Granular prefs + smart grouping |

---

## Phase 8: Admin, Moderation, Analytics, Final Polish

**Duration:** 4–5 weeks  
**Dependencies:** Phase 7  
**Release target:** **Version 1.0**

### Goal

Admin tooling, report/moderation flows, business analytics charts, bug bash, App Store launch.

### Screens

| Screen | Route |
|--------|-------|
| Report sheet | bottom sheet (all reportable types) |
| Admin dashboard (web) | `admin.nexio.app` (future) / Supabase manual |
| Business analytics full | `marketplace/analytics` |
| Announcement cards | in Updates feed |

### Components

ReportSheet, AnnouncementCard, AnalyticsChart (Victory Native), ModerationStatusBadge

### Backend / Database / Storage / Realtime

| Area | Work |
|------|------|
| **Database** | `reports`, `moderation_actions`, `announcements`, `audit_logs`, `admin_users` |
| **Edge Functions** | Admin verification, announcement publish, analytics aggregation |
| **Analytics** | Victory Native charts; pre-aggregated tables |

### Testing Checklist

- [ ] Report flow E2E
- [ ] Admin verification workflow
- [ ] Full regression suite
- [ ] Manual QA checklist §34 complete
- [ ] App Store / Play Store submission

### Definition of Done

- [ ] Report system: all types + reasons (§26.6)
- [ ] Admin can: review reports, warn, suspend, ban, remove content, approve verification
- [ ] Admin does NOT gate signup, business, gigs, stories, groups (§26.5)
- [ ] Announcements in Updates with audience targeting
- [ ] Business analytics charts (daily/weekly/monthly/yearly)
- [ ] Feature flags operational
- [ ] All P0/P1 bugs resolved
- [ ] **v1.0 submitted and approved** both stores
- [ ] Privacy policy + terms live
- [ ] Post-launch monitoring active

### Dependencies

Phase 7 security/performance baseline

### Risks

| Risk | Mitigation |
|------|------------|
| App Store rejection | Pre-review guidelines check Phase 7 |
| Admin scope creep | §26.5 explicit non-responsibilities |

---

## Phase 9: Payments & Monetization (Post-v1.0)

**Duration:** 6–8 weeks  
**Dependencies:** Phase 8, business validation  
**Release target:** Version 1.1+

### Goal

Stripe Connect payments, escrow, live revenue dashboard.

### Definition of Done

- [ ] In-app payment for orders
- [ ] Escrow hold/release
- [ ] Seller payouts via Connect
- [ ] `ff_payments_enabled` flag enabled
- [ ] 100 successful paid orders
- [ ] PCI scope documented (Stripe handles cards)

---

*Last updated: June 2026 — Part 4B*
