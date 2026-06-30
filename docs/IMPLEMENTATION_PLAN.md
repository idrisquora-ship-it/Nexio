# Nexio — Implementation Plan

> **This is the master document for the entire Nexio project.**
> All engineering, design, and product work must align with this plan. When scope, sequencing, or architecture changes, update this document first.

---

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.4.0 |
| Status | **Documentation Complete** — Ready for Phase 1 implementation |
| Last Updated | June 2026 |
| Owner | Product & Engineering Leadership |

### Related Documents

| Document | Role |
|----------|------|
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Product domains and user journeys |
| [VISION_AND_GOALS.md](./VISION_AND_GOALS.md) | Mission, non-goals, success metrics |
| [DESIGN_PHILOSOPHY.md](./DESIGN_PHILOSOPHY.md) | Design principles |
| [UI_UX_GUIDELINES.md](./UI_UX_GUIDELINES.md) | UX patterns and navigation |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Visual tokens and components |
| [TECH_STACK.md](./TECH_STACK.md) | Technology choices |
| [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) | System architecture |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Repository layout |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Code quality |
| [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md) | Naming rules |

---

## 1. Project Overview

**Nexio** is a premium mobile-first platform combining messaging, voice/video calls, marketplace (gigs & orders), communities, and discovery into one cohesive ecosystem. Messaging is the heart; business happens naturally inside conversations.

**Current state:** Documentation complete. Application code not started. Supabase and LiveKit infrastructure accounts provisioned.

**Implementation approach:** Phased delivery — each phase produces a shippable internal milestone before advancing. No phase begins until the prior phase meets its Definition of Done.

---

## 2. Goals

### Product Goals

1. Unified chat + business in one app — no context switching
2. Premium mobile UX from day one (dark mode, skeleton loading, micro-interactions)
3. Chat-native marketplace: discover → inquire → order in-thread
4. Daily engagement for both personal and professional use cases
5. Progressive feature disclosure — simple for new users, powerful over time

### Engineering Goals

1. Offline-capable messaging with auto-sync
2. Security by design: RLS on all tables, secrets server-side only
3. Sub-200ms perceived message send (optimistic UI)
4. 60fps scroll in conversation lists
5. Monorepo with typed shared contracts between mobile, Edge Functions, and database

### Business Goals (Post-Launch)

1. Validate inquiry → order conversion in-app
2. Achieve 40%+ week-2 retention in beta cohort
3. First 1,000 registered users within 30 days of public launch

---

## 3. Account Types & User Capabilities

Nexio has **two account types**. There is no separate business app — everything lives in one ecosystem.

| Account Type | Description |
|--------------|-------------|
| **Personal Account** | Default for all users. Full communication and marketplace browsing. Cannot sell until upgraded. |
| **Business Account** | Personal account **plus** seller capabilities. Never loses personal features. |

**Core rule:** Every Business account is also a Personal account. Business users retain full access to chat, groups, communities, stories, calls, and personal messaging. Business simply **unlocks additional capabilities** — it does not replace or segregate the experience.

### 3.1 Personal Account Capabilities

| Category | Capabilities |
|----------|--------------|
| **Account** | Create account, login, customize profile, optional phone number, required unique username |
| **Messaging** | Chat, voice messages, react, forward, delete, edit, pin, star messages |
| **Calls** | Voice calls, video calls (from conversations) |
| **Groups** | Create groups, join groups, group admin/member roles |
| **Communities** | Join communities, participate in community groups |
| **Channels** | Follow channels, react, share, comment (if enabled) |
| **Stories** | Post stories (photo, video, text), view stories, replies, privacy controls |
| **Discovery** | Search users, businesses, groups, channels; browse marketplace; view gigs |
| **Marketplace (buyer)** | Contact sellers, leave reviews after completed work |
| **Social** | Follow businesses and creators, view Updates feed |
| **Safety** | Block users, report users, privacy controls |
| **Notifications** | Receive all notification categories |

**Locked for Personal only:** Selling — create gigs, seller dashboard, business analytics, seller levels, business verification, order management as seller.

### 3.2 Business Account Capabilities

Includes **everything Personal has**, plus:

| Category | Additional Capabilities |
|----------|------------------------|
| **Business Profile** | Brand identity, cover image, business badge, verification badge |
| **Seller Dashboard** | Orders, inquiries, earnings overview, gig management |
| **Marketplace (seller)** | Create gigs, portfolio, business posts |
| **Analytics** | Business statistics, follower metrics, order metrics |
| **Reputation** | Reviews received, seller levels, response time display |
| **Channels** | Admin/broadcast channels for business announcements |

### 3.3 Becoming a Business (Upgrade Flow)

Personal users upgrade at any time — no account migration, no data loss.

```
Settings → Become Business → Complete business information → Business profile created → Seller dashboard unlocked
```

| What Changes | What Stays the Same |
|--------------|---------------------|
| Business profile and badge appear | All chats and message history |
| Seller dashboard unlocked in Marketplace tab | Friends, groups, communities |
| Can create gigs and receive orders | Stories and personal profile |
| Business analytics available | Username, followers, settings |

**Phase:** Business upgrade flow ships in Phase 4 (Marketplace MVP).

### 3.4 User Role Matrix (Implementation Reference)

| Capability | Personal | Business |
|------------|:--------:|:--------:|
| 1:1 & group chat | ✅ | ✅ |
| Voice/video calls | ✅ | ✅ |
| Stories | ✅ | ✅ |
| Join communities/channels | ✅ | ✅ |
| Browse marketplace | ✅ | ✅ |
| Buy / inquire / review | ✅ | ✅ |
| Create gigs / sell | âŒ | ✅ |
| Seller dashboard | âŒ | ✅ |
| Business analytics | âŒ | ✅ |
| Business verification | âŒ | ✅ |

---

## 4. Architecture Overview

```
Mobile (Expo RN + TypeScript)
    ↕ Supabase Client (Auth, DB, Realtime, Storage)
    ↕ Edge Functions (LiveKit tokens, push, webhooks)
    ↕ LiveKit Cloud (WebRTC calls)
    ↕ PostgreSQL + RLS
```

**Key architectural decisions:**

- React Native + Expo for mobile velocity and premium UX
- Supabase as unified backend (no custom API server for MVP)
- Local SQLite/WatermelonDB for offline message cache
- TanStack Query for server state; Zustand for minimal global UI state
- Feature-based folder structure with shared package for types/validators

Full detail: [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)

---

## 5. Core Product Principle — Messaging-First

**Messaging is the heart of Nexio.** Every feature connects back to messaging.

| Feature | Connection to Messaging |
|---------|-------------------------|
| Marketplace | Inquiries open conversations; orders live in threads; gig cards embed in chat |
| Orders | Status updates as system messages and order cards in thread |
| Voice calls | Initiated from conversation header |
| Video calls | Initiated from conversation header |
| Communities | Community groups are group conversations with extended metadata |
| Channels | Broadcast content surfaces in Updates; comments/replies route to messaging where enabled |
| Business relationships | Client-seller history preserved in conversation threads |
| Stories | Replies open direct conversations |
| Reviews | Prompted post-order; visible on profile linked from chat |

**UX rule:** Users must never feel like they are switching between different applications. Tab changes are context shifts within one ecosystem — not product switches.

---

## 6. Authentication & Identity

Authentication must feel **effortless** — minimal friction, premium polish, clear error recovery.

### 6.1 Supported Auth Methods

| Method | Phase | Required At Signup |
|--------|-------|-------------------|
| Email + password | 1 | Optional path |
| Google OAuth | 1 | Optional path |
| Apple Sign In (iOS) | 1 | Optional path |
| Phone + OTP | 2 | **Never required** |

**Phone number is NOT required at signup.** Phone is optional and added later via Settings.

### 6.2 Signup Flow

```
Welcome → Choose method (Email / Google / Apple) →
  Email path: email + password + confirm →
  OAuth path: provider consent →
Username selection (unique, required) →
Display name + avatar (optional skip avatar) →
Chats tab (home)
```

### 6.3 Login Flow

```
Login screen → Email/password OR Google OR Apple →
Session restored → Chats tab
```

### 6.4 Session Management

- JWT via Supabase Auth; refresh token in SecureStore
- Multi-device sessions tracked (Settings → Devices) — Phase 5+
- Logout clears local cache selectively (keep draft queue prompt if pending messages)

### 6.5 Auth Edge Cases

| Scenario | Behavior |
|----------|----------|
| Email already registered | Friendly error + link to login |
| OAuth email matches existing account | Offer account linking (Phase 2+) |
| Weak password | Inline validation with clear requirements |
| Network failure during signup | Retry button; preserve form state |
| Apple Hide My Email | Support relay emails; username remains primary identity |
| Session expired | Silent refresh; re-login prompt if refresh fails |

---

## 7. Phone Number System

Phone is **optional** throughout the product lifecycle.

### 7.1 Add Phone Flow

```
Settings → Account → Add Phone Number → Enter number → OTP verification → Phone verified badge
```

### 7.2 Discoverability Rules

| Setting | Behavior |
|---------|----------|
| Phone added + discoverability ON | Discoverable by contacts who have number saved |
| Phone added + discoverability OFF | Not discoverable by phone; username search still works |
| No phone | Searchable by **username only** |

### 7.3 Username as Primary Identity

| Property | Rule |
|----------|------|
| Format | `@username` — lowercase alphanumeric + underscore; 3â€“30 chars |
| Uniqueness | Globally unique; enforced at database level |
| Required | Yes — set during onboarding |
| Shareable | Profile link: `nexio.app/@username` (future deep link) |
| Display | Shown on profile, search results, chat headers, mentions |

**Username is the primary identity — not phone number.**

---

## 8. Profiles

Profiles must feel **beautiful, minimal, and premium**.

### 8.1 Profile Data Model

| Field | Personal | Business | Notes |
|-------|:--------:|:--------:|-------|
| Avatar | ✅ | ✅ | Required default initials fallback |
| Cover image | Optional | Optional | Large header visual |
| Display name | ✅ | ✅ | |
| Username | ✅ | ✅ | Unique |
| Bio | Optional | Optional | Max 300 chars |
| Location | Optional | Optional | |
| Website | Optional | Optional | Validated URL |
| Joined date | ✅ | ✅ | Read-only |
| Followers / Following | ✅ | ✅ | Count + list |
| Shared media | ✅ | ✅ | Grid from conversations |
| Mutual connections | ✅ | ✅ | When viewing others |
| Stories ring | ✅ | ✅ | Active story indicator |
| Business badge | — | ✅ | After upgrade |
| Verification badge | — | Optional | Manual verification Phase 5 |
| Gigs / Portfolio | View | Manage | Business seller |
| Reviews | ✅ | ✅ | As buyer and seller |

### 8.2 Profile Layout (Design Spec)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
│      Cover image (optional)  │
│         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”          │
│         │ Avatar  │ (large)  │
│         └──â”€â”€â”€â”€â”€â”€â”€â”˜          │
│      Display Name            │
│      @username Â· badges      │
│      Bio (short)             │
│  [Message] [Follow] [More]   │
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
│  Card: Stats (followers etc) │
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
│  Card: Gigs / About / Reviews│
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
│  Card: Shared Media          │
└──â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Rules:** Large header, large avatar, rounded images, large typography, card-grouped sections, no information overload.

### 8.3 Profile Variants

| Variant | Entry Point | Primary Action |
|---------|---------------|----------------|
| Self (personal) | Profile tab | Edit Profile |
| Self (business) | Profile tab | Edit Profile / Seller Dashboard link |
| Other user | Chat, search, Updates | Message |
| Business seller | Gig detail, search | Message / Send Inquiry |

---

## 9. Privacy & Presence

### 9.1 Online Status & Last Seen

| Setting | Options |
|---------|---------|
| Online status | Show online / Hide online |
| Last seen | Nobody / Contacts / Everyone |

### 9.2 Typing & Read Receipts

| Setting | Options |
|---------|---------|
| Typing indicator | On / Off |
| Read receipts | On / Off |

**Note:** If read receipts off, user also won't see others' read status (reciprocal).

### 9.3 Privacy Controls (Settings → Privacy)

- Last seen visibility
- Online status visibility
- Typing indicator
- Read receipts
- Phone number discoverability
- Profile photo visibility (Everyone / Contacts / Nobody)
- Stories visibility (custom list — Phase 5)
- Group add permission (Everyone / Contacts / Nobody)
- Call permission (Everyone / Contacts / Nobody)
- Blocked users list

---

## 10. Navigation & Information Architecture

### 10.1 Bottom Tab Bar (Exactly Five — Never More)

| Tab | Icon (Lucide) | Purpose | Default |
|-----|---------------|---------|---------|
| **Chats** | `MessageCircle` | Home — conversations, stories row | ✅ Landing tab |
| **Marketplace** | `Store` | Browse gigs, seller dashboard (business), orders | |
| **Updates** | `Rss` | Stories, channels, announcements, business posts | |
| **Calls** | `Phone` | Call history, missed/recent | |
| **Profile** | `User` | Identity, settings, become business | |

**Change from Part 1:** Discover and Gigs tabs consolidated into **Marketplace** (browse + sell) and **Updates** (social/content feed). Search remains globally accessible.

### 10.2 Global Search Entry Points

- Search button on Chats header
- Search bar on Marketplace tab
- Dedicated global search overlay (Phase 4) accessible from Chats + Marketplace

### 10.3 Navigation Map

```
Root
â”œâ”€â”€ (auth)/ login, signup, forgot-password
â”œâ”€â”€ (tabs)/
│   â”œâ”€â”€ chats/          → thread/[id], new-chat, archived
│   â”œâ”€â”€ marketplace/    → gig/[id], create-gig, orders, seller-dashboard
│   â”œâ”€â”€ updates/          → story/[userId], channel/[id], post/[id]
│   â”œâ”€â”€ calls/            → call/[roomId] (active call fullscreen)
│   └── profile/          → edit, settings/*, user/[id] (others)
â”œâ”€â”€ group/[id]/info
â”œâ”€â”€ community/[id]/
└── search (modal)
```

### 10.4 Deep Link Patterns (Future)

| Link | Destination |
|------|-------------|
| `nexio.app/@username` | User profile |
| `nexio.app/gig/:id` | Gig detail → inquiry → chat |
| `nexio.app/group/join/:token` | Group invite |
| `nexio.app/community/:id` | Community preview |

---

## 11. Screen Catalog

Every screen documented with purpose, key elements, and primary action.

### 11.1 Chats Tab (Home Screen)

**Purpose:** Primary daily entry — conversations and stories.

| Element | Detail |
|---------|--------|
| Header | Large title "Chats"; search button; new message button |
| Stories row | Horizontal avatars with rings; tap to view; "+" to add story |
| Pinned section | Pinned conversations (optional collapse) |
| Conversation list | Avatar, name, last message preview, timestamp, unread badge |
| Indicators | Typing indicator in preview; online dot on avatar |
| Swipe actions | Archive, Mute, Pin, Delete |
| Pull to refresh | Sync conversations |
| Empty state | "Start chatting with someone" + CTA |

**Primary action:** Open conversation or new message.

### 11.2 Chat Thread

**Purpose:** Read and send messages — premium native feel.

| Element | Detail |
|---------|--------|
| Header | Avatar, name, online/typing status, call icons, menu |
| Pinned messages | Collapsible bar at top (if any) |
| Message list | Large bubbles, generous spacing, rounded corners, smooth scroll |
| Date dividers | Subtle, centered |
| Reply preview | When replying — banner above input |
| Input bar | Attachment, text field, send / voice note hold |
| Shared media | Accessible via header menu → media grid |

### 11.3 Marketplace Tab

**Purpose:** Discover and hire professionals (buyers) or manage business (sellers).

**Buyer view:**

| Element | Detail |
|---------|--------|
| Header | Large title "Marketplace"; search bar; filter button |
| Categories | Horizontal scroll chips |
| Sections | Featured businesses, trending, recommended, top rated, etc. (max 6â€“8 + See All) |
| Recently viewed | Personal history row |
| Gig cards | Large image, title, seller, from-price, rating — premium spacing |
| Favorites access | Saved gigs/businesses entry |

**Business view (additional):**

| Element | Detail |
|---------|--------|
| Seller dashboard card | Top of tab — metrics + quick actions |
| Create gig FAB | Primary seller action |
| Vacation mode banner | When active |

**Primary action:** Browse gig (buyer) or Create gig / View dashboard (seller).

**Gig detail:** See section 16.8. Sticky **Contact Seller** button always visible.

### 11.4 Updates Tab

**Purpose:** Unified content feed — replaces separate Stories/Channels/Announcements tabs.

| Section | Content |
|---------|---------|
| Stories tray | Full-width horizontal; friends + following + businesses |
| Channels | Followed broadcast channels; latest posts |
| Community announcements | From joined communities |
| Business posts | From followed businesses |
| Trending creators | Suggested follows (Phase 5) |

**Primary action:** View story or channel post; tap through to profile or chat reply.

### 11.5 Calls Tab

**Purpose:** Call history and quick redial.

| Element | Detail |
|---------|--------|
| Segments | All / Missed |
| Row | Avatar, name, direction icon, timestamp, duration |
| Tap | Call back (voice default; long-press video) |
| Empty state | "Calls from conversations appear here" |

### 11.6 Profile Tab

**Purpose:** Self identity and app settings entry.

| Element | Detail |
|---------|--------|
| Profile header | Own profile preview (avatar, name, username) |
| Quick links | Edit profile, Become Business (if personal), Seller dashboard (if business) |
| Menu rows | Settings, Help, About |
| Primary action | Edit Profile |

### 11.7 Settings (Stack from Profile)

**Grouped sections:**

| Section | Items |
|---------|-------|
| **Account** | Profile, username, email, phone (add/verify), Become Business |
| **Privacy** | Last seen, online, typing, read receipts, phone discoverability, blocked users |
| **Chats** | Wallpaper, font size, enter to send, archive behavior |
| **Calls** | Default line, low data mode |
| **Notifications** | Per-category toggles |
| **Appearance** | Theme (dark default; light optional Phase 5) |
| **Storage** | Cache usage, clear cache, download settings |
| **Devices** | Active sessions (Phase 5) |
| **Security** | Password change, 2FA (future) |
| **Marketplace** | Seller preferences, payout settings (Phase 7) |
| **Help** | FAQ, contact support, report bug |
| **About** | Version, terms, privacy policy |
| **Logout** | Confirm bottom sheet |

### 11.8 Call Screen (Fullscreen)

| Element | Detail |
|---------|--------|
| Background | Blurred avatar or video feed |
| Center | Large avatar (voice), name |
| Timer | Call duration |
| Controls | Mute, speaker, Bluetooth, camera toggle, switch camera, end call |
| Animation | Premium connect/disconnect transitions |

### 11.9 Group Info Screen

| Element | Detail |
|---------|--------|
| Header | Group image, name, description |
| Actions | Invite link, QR code, mute, leave |
| Members | Admins, moderators, members lists |
| Shared | Media, files, links tabs |
| Admin | Announcements, polls, events (phased) |

### 11.10 Community Detail Screen

| Element | Detail |
|---------|--------|
| Header | Community banner, name, member count |
| Subgroups | List of groups within community |
| Channels | Announcement channels |
| Resources | Files/links (Phase 5) |
| Events | Community events list (Phase 5) |
| Moderation | Member management (admin only) |

---

## 12. Messaging System (Detailed)

### 12.1 Message Types

| Type | Phase | Max Size / Notes |
|------|-------|------------------|
| Text | 2 | 5,000 chars |
| Images | 3 | JPEG, PNG, WEBP; 20MB |
| Videos | 3 | MP4, MOV; 100MB |
| Voice notes | 3 | AAC/OPUS; waveform UI; 10 min max |
| Audio files | 3 | MP3, M4A |
| Documents | 3 | PDF, DOC, DOCX, XLS, XLSX, ZIP; 50MB |
| Location | 4 | Static map preview + open in maps |
| Contacts | 4 | vCard share |
| GIF | 4 | Tenor/Giphy integration |
| Sticker | 5 | Sticker packs |
| Emoji | 2 | Standard unicode + emoji picker |
| System | 2 | Join/leave, order updates, call logs |
| Gig card | 4 | Embedded marketplace listing |
| Order card | 4 | Embedded order status |

### 12.2 Message Actions (Long Press → Bottom Sheet)

| Action | Phase | Notes |
|--------|-------|-------|
| Reply | 2 | Quote reply with preview |
| Forward | 3 | Select conversation(s) |
| Copy | 2 | Text/media copy |
| Pin | 3 | Pin in conversation; show bar |
| Star | 3 | Add to starred messages |
| Edit | 3 | Text only; "edited" label; time limit 15 min |
| Delete | 2 | Delete for me |
| Delete for everyone | 3 | Within 48 hours; admin override in groups |
| Translate | 6 | Placeholder UI; implementation future |
| Info | 2 | Read receipts, timestamps, delivery status |
| React | 3 | Emoji reactions; quick react on double-tap |

### 12.3 Message Status

| Status | UI Treatment |
|--------|--------------|
| Sending | Clock icon; optimistic bubble at 70% opacity |
| Sent | Single check |
| Delivered | Double check (soft gray) |
| Read | Double check (brand accent) — if read receipts on |
| Failed | Warning icon; tap to retry |

Displayed elegantly inline on sent messages — never intrusive.

### 12.4 Voice Notes (Detailed UX)

| Feature | Spec |
|---------|------|
| Record | Hold mic or tap to lock recording |
| Waveform | Live waveform while recording and playing |
| Pause / Resume | During recording |
| Cancel | Slide away or trash icon |
| Preview | Listen before send |
| Playback speed | 0.5x, 1x, 1.5x, 2x |
| Scrub | Seek along waveform |

### 12.5 Conversation Organization

| Feature | Phase |
|---------|-------|
| Pin chat | 2 |
| Archive chat | 2 |
| Mute chat | 2 |
| Unread filter | 3 |
| Mark as unread | 3 |
| Starred messages view | 3 |

---

## 13. Calls System (LiveKit)

### 13.1 Call Types

| Type | Phase |
|------|-------|
| 1:1 voice | 3 |
| 1:1 video | 3 |
| Group voice | 5 |
| Group video | 5 |

### 13.2 Call Flows

**Outgoing:**
```
Thread → Voice/Video icon → Ringing UI → Connected → In-call → End → Thread (system message)
```

**Incoming:**
```
Push/fullscreen → Accept/Decline → In-call → End
```

**Missed:**
```
Notification → Logged in Calls tab + system message in thread
```

### 13.3 Call History Data

| Field | Stored |
|-------|--------|
| Participants | User IDs |
| Direction | incoming / outgoing / missed |
| Type | voice / video |
| Duration | seconds |
| Timestamp | started_at, ended_at |
| Conversation link | conversation_id |

---

## 14. Groups, Communities & Channels

### 14.1 Groups (Multi-User Chat)

| Capability | Phase |
|------------|-------|
| Create group (name, image, description) | 3 |
| Invite link + QR code | 4 |
| Admins, moderators, members | 3 |
| Announcements (admin-only mode) | 4 |
| Shared media & files | 3 |
| Polls | 5 |
| Events | 5 |
| Voice room | 6+ (placeholder UI Phase 5) |

**Entry:** Always opens as a **group conversation** in Chats.

### 14.2 Communities (Container for Groups)

Designed for schools, companies, organizations, gaming clans.

| Capability | Phase |
|------------|-------|
| Create community | 5 |
| Public / private | 5 |
| Multiple groups inside | 5 |
| Announcement channels | 5 |
| Events | 5 |
| Resources (files/links) | 5 |
| Roles: owner, admin, moderator, member | 5 |
| Member management | 5 |

**Hierarchy:**
```
Community
â”œâ”€â”€ Announcement Channel(s)
â”œâ”€â”€ Group: General
â”œâ”€â”€ Group: Topic A
â”œâ”€â”€ Events
└── Resources
```

### 14.3 Channels (Broadcast)

| Property | Behavior |
|----------|----------|
| Posting | Admins only |
| Following | Users follow; followers receive Updates |
| Reactions | Followers can react |
| Sharing | Forward to conversations |
| Comments | Optional per channel — opens threaded replies or chat |

**Use cases:** Business announcements, creator updates, news.

---

## 15. Stories & Updates Tab

### 15.1 Stories

| Property | Spec |
|----------|------|
| Duration | 24 hours |
| Types | Photo, video, text |
| Music | Placeholder UI Phase 5; integration future |
| Mentions | @username tap → profile |
| Replies | Opens direct conversation with story preview |
| Views | Poster sees viewer list |
| Privacy | Everyone / contacts / custom exclude (Phase 5) |

### 15.2 Updates Tab Composition

| Content Source | Display |
|----------------|---------|
| Stories | Top tray (same as Chats row; synced) |
| Followed channels | Card feed |
| Community announcements | Grouped section |
| Business posts | From followed businesses |
| Trending creators | Suggested (Phase 5) |

**Rationale:** One tab replaces separate social feeds — reduces navigation complexity while keeping content discoverable.

---

## 16. Marketplace & Business Ecosystem (Part 3)

This section is the authoritative specification for the Nexio marketplace. All marketplace and business features must align with the **messaging-first** principle defined in Section 5.

---

### 16.1 Marketplace Philosophy

The Nexio Marketplace is **not** Fiverr, Upwork, or Freelancer rebuilt as a tab.

| What It Is NOT | What It IS |
|----------------|------------|
| Standalone freelance marketplace | Natural extension of Nexio conversations |
| Separate product with its own UX language | Premium, minimal surface inside one app |
| Browse-first, chat-second | **Communication first; business follows naturally** |
| Dashboard-heavy seller ERP | Modern, clean seller dashboard |

**Core truth:** Messaging remains the heart. Marketplace gives users the ability to **discover professionals** and **hire directly from conversations**. Every marketplace action should route to or through chat.

```
Discover → View gig/business → Contact Seller → Chat (workspace) → Order → Delivery → Review → Relationship continues
```

---

### 16.2 Marketplace Goals

| Goal | How Nexio Achieves It |
|------|----------------------|
| Help users discover professionals | Curated home sections, search, ranking, recommendations |
| Allow professionals to showcase work | Business profile, portfolio, gigs, business posts |
| Enable instant contact | **Contact Seller** opens/creates conversation immediately |
| Build trust | Reviews after completed work, verification badge, seller levels |
| Reward quality | Seller levels, ranking boost for high performers |
| Promote excellent communication | Response rate metrics; chat-native order flow |
| Make hiring feel easy | Simple V1 order flow; no complicated dispute system at launch |

---

### 16.3 Marketplace Home (Marketplace Tab — Buyer View)

Must feel **premium, not crowded, minimal**.

#### Header

| Element | Spec |
|---------|------|
| Title | Large title: "Marketplace" |
| Search bar | Full-width below title; tap opens marketplace search |
| Filter button | Icon adjacent to search; opens filter bottom sheet |

#### Content Sections (Vertical Scroll)

Each section shows **maximum 6â€“8 items** before a **"See All"** link. Never overload.

| Section | Content | Phase |
|---------|---------|-------|
| Categories | Horizontal scrolling chips | 4 |
| Featured Businesses | Curated business cards | 5 |
| Trending Services | Popular gigs this week | 4 |
| Recommended Services | Personalized (basic: category match) | 5 |
| Top Rated Sellers | By average rating + min orders | 5 |
| Recently Viewed | Local + synced history | 4 |
| Popular This Week | View/save weighted | 5 |
| New Sellers | Recently joined businesses | 4 |
| Suggested For You | Recommendation engine lite | 5 |

**Business users:** Same tab shows **Seller Dashboard** entry at top (see 16.5) instead of duplicating a separate app.

#### Design Rules (Marketplace Cards)

- Large images, beautiful spacing, rounded corners, soft shadows
- Large typography for titles; minimal metadata (price, rating, seller)
- No overcrowding — one gig per card row on mobile default
- Skeleton loading for all sections

---

### 16.4 Marketplace Search & Filters

#### Search Supports (Phase 4â€“5)

| Dimension | Phase | Notes |
|-----------|-------|-------|
| Gig title | 4 | Full-text |
| Business name | 4 | |
| Username | 4 | `@username` |
| Tags | 4 | Gig tags array |
| Categories / subcategories | 4 | |
| Skills | 5 | From gig + business profile |
| Keywords | 4 | General text match |
| Languages | 5 | Business profile languages |
| Location | Future | Geo filter post-launch |
| Seller level | 5 | Filter by level tier |
| Verified sellers only | 5 | Boolean filter |
| Ratings (minimum) | 4 | e.g. 4+ stars |
| Delivery time (max days) | 4 | |
| Price range | 4 | Min/max |
| Response time | 5 | e.g. under 1 hour |

#### Filter Bottom Sheet

Opens from filter button on Marketplace home or search results.

| Filter | Type |
|--------|------|
| Price | Range slider |
| Rating | Minimum stars |
| Seller Level | Multi-select |
| Verified Only | Toggle |
| Delivery Time | Max days |
| Category | Single select |
| Sub Category | Single select (depends on category) |
| Languages | Multi-select |
| Response Time | Presets |
| Sort: Newest | Sort option |
| Sort: Most Popular | Sort option |
| Sort: Highest Rated | Sort option |
| Sort: Online Sellers | Sort option (presence) |

**UX:** Apply button + clear all; active filter count badge on filter icon.

---

### 16.5 Seller Dashboard (Business Users)

Must **not** feel like accounting software. Modern, clean, minimal — consistent with Nexio premium dark UI.

**Entry:** Marketplace tab → dashboard card at top (business accounts only).

#### Dashboard Widgets

| Widget | Metric / Content | Phase |
|--------|------------------|-------|
| Today's Visitors | Profile + gig views today | 5 |
| Gig Views | Aggregate period views | 5 |
| Messages | Unread inquiry count → opens chats | 4 |
| Orders | Active + pending count | 4 |
| Revenue | Placeholder until Phase 7 payments | 4 (UI shell) |
| Followers | Total follower count | 5 |
| Reviews | Recent average | 4 |
| Completion Rate | % orders completed | 5 |
| Response Rate | % inquiries responded within SLA | 5 |
| Average Rating | Overall + breakdown | 4 |
| Recent Orders | List with status | 4 |
| Recent Reviews | Latest with snippet | 4 |

#### Quick Actions

| Action | Destination |
|--------|-------------|
| Create Gig | 5-step create flow |
| Edit Gig | Gig management list |
| Portfolio | Portfolio manager |
| Verification | Verification submission status |
| Analytics | Full analytics screen |
| Business Posts | Create / manage posts |

---

### 16.6 Business Profile (Premium Storefront)

Extremely important — should feel like a **premium storefront**, not a form dump.

#### Header Section

| Element | Detail |
|---------|--------|
| Cover image | Full-width; optional gradient fallback |
| Business logo | Overlaps cover; large, rounded |
| Business name | Large typography |
| Username | `@username` |
| Verification badge | If verified (separate from seller level) |
| Seller level badge | New Seller → Top Seller hierarchy |
| Followers / Following | Tappable counts |
| Member since | Join date |
| Response time | e.g. "Responds in ~1 hour" |
| Languages | Chips |

#### Body Sections (Card-Grouped)

| Section | Content |
|---------|---------|
| Business description | Short, scannable; bullet-friendly |
| Action buttons | **Contact** (primary), Follow, Share |
| Portfolio | Grid/carousel of best work |
| Services | Active gigs list |
| Reviews | Aggregate + recent |
| Business updates | Recent posts preview → Updates tab |
| Statistics | Public-safe stats (orders completed, rating) |

#### Actions

| Button | Behavior |
|--------|----------|
| **Contact** | Instantly opens/creates conversation with business |
| **Follow** | Follow business; receive posts/gig/announcement notifications |
| **Share** | Share link `@username` or deep link |

---

### 16.7 Create Gig Flow (5 Steps)

Step-by-step — never one long form. Bottom sheet or full-screen steps with progress indicator.

#### Step 1 — Basic Information

| Field | Validation |
|-------|------------|
| Gig title | Short, professional, clear, search-friendly (max 80 chars) |
| Category | Required |
| Sub category | Required |
| Tags | Up to 5 tags |
| Short description | Max 200 chars; preview text |

#### Step 2 — Pricing (Packages)

Three tiers: **Basic**, **Standard**, **Premium**.

| Field (per tier) | Required |
|------------------|----------|
| Price | Basic required; Standard/Premium optional |
| Delivery time | Days |
| Revisions | Count |
| Package description | What's included |
| Included features | Bullet list |

At minimum one package (Basic) must be complete to publish.

#### Step 3 — Media

| Asset | Required |
|-------|----------|
| Cover image | Yes |
| Gallery images | Up to 10 |
| Optional video | No |
| Portfolio attachments | Link existing portfolio items |

**Rule:** Media must look premium — min resolution guidelines in design QA.

#### Step 4 — FAQ & Requirements

| Field | Detail |
|-------|--------|
| FAQ | Multiple Q&A pairs |
| Requirements from buyer | What seller needs to start |

#### Step 5 — Preview & Publish

- Full gig preview as buyers will see it
- Publish / Save draft / Back to edit
- Check active gig limit for seller level before publish (see 16.12)

#### Gig Content Rules

| Element | Rule |
|---------|------|
| Titles | Short, professional, clear, search-friendly |
| Descriptions | Easy to read; organized; bullet points; no giant paragraphs |
| Media | Always premium quality; rounded corners in UI |

---

### 16.8 Gig Details Page

| Section | Spec |
|---------|------|
| Hero image | Full-width cover |
| Business card | Logo, name, verification, seller level — tappable → business profile |
| Title | Large typography |
| Starting price | "From $X" based on lowest package |
| Rating | Stars + count |
| Completed orders | Count |
| Portfolio | Relevant samples |
| Description | Formatted, collapsible if long |
| Packages | Basic / Standard / Premium cards; select highlights tier |
| FAQ | Accordion |
| Reviews | Recent + see all |
| Related services | Same category/seller (max 6) |

**Sticky bottom bar:**

| Button | Phase | Action |
|--------|-------|--------|
| **Contact Seller** | 4 | Primary — opens chat immediately |
| Order | 5+ | Placeholder in V1; full order from chat agreement in V1 |

Everything scrolls naturally; sticky CTA always visible.

---

### 16.9 Portfolio

Every business account has a portfolio. Builds trust.

| Field | Type |
|-------|------|
| Images | Required at least one per item |
| Videos | Optional |
| Project description | Text |
| Project category | Category pick |
| Completion date | Date |
| Client industry | Optional |
| Before / After | Optional image pair |

**Surfaces:** Business profile, gig creation (attach), gig detail (samples).

**Phase 4:** CRUD portfolio items. **Phase 5:** Before/after, portfolio likes (future notification).

---

### 16.10 Business Posts

Business users publish updates. Appear in **Updates tab** for followers.

| Post Type | Example |
|-----------|---------|
| New gig | Linked gig card |
| Discount | Promo text + gig link |
| Behind the scenes | Media |
| Tips | Text/media |
| Achievements | Milestone |
| Portfolio update | Portfolio item link |
| Announcement | General |

**Followers receive:** Push + in-app notification (configurable).

**Phase:** Business posts ship Phase 5; create UI in dashboard Phase 5.

---

### 16.11 Seller Levels

Seller levels increase **visibility** in search and recommendations. Displayed as badge on business profile and gig cards.

#### Level Hierarchy

| Level | Display Name | Phase |
|-------|--------------|-------|
| 0 | New Seller | 4 (default) |
| 1 | Level 1 | 5 |
| 2 | Level 2 | 5 |
| 3 | Top Seller | 5 |
| 4 | Verified Seller | 5 (requires verification — see 16.13) |
| 5 | Premium Business | Future |

**Important:** Verification (16.13) is **NOT** the same as seller level. A user can be verified but still Level 1.

---

### 16.12 Active Gig Limits (Configuration-Driven)

**Never hardcode limits in application code.** Store in `marketplace_config` table or equivalent.

| Seller Level | Default Max Active Gigs |
|--------------|-------------------------|
| New Seller | 7 |
| Level 1 | 10 |
| Level 2 | 20 |
| Top Seller | 35 |
| Verified Seller | 50 |
| Premium Business | 100 |

Admin can update config without app deploy. Client reads limits at gig publish time.

---

### 16.13 Level Requirements (Configuration-Driven)

**Never hardcode thresholds.** Store in `seller_level_requirements` configuration.

#### Metrics Used for Level Progression

| Metric | Description |
|--------|-------------|
| Completed orders | Total successfully completed |
| Average rating | Overall average |
| Completion rate | Completed / accepted orders |
| Response rate | Inquiries answered within SLA |
| Account age | Days since business upgrade |
| Repeat buyers | Unique buyers with 2+ orders |
| No recent warnings | No moderation flags in window |
| Customer satisfaction | Derived from review dimensions |

**Actual thresholds:** TBD by product — architecture must support hot-reload from config. Edge Function or cron evaluates levels periodically (e.g. daily).

#### Level Evaluation Architecture

```
Order completed / Review submitted / Inquiry responded
    → Update seller_metrics aggregate row
    → Nightly job: evaluate seller_level_requirements config
    → If thresholds met → upgrade level + notify seller
```

---

### 16.14 Verification (Separate from Seller Level)

Verification **builds trust**, increases **search ranking**, shows **verification badge**.

#### Verification Flow

```
Business Settings → Verification → Submit:
  - Government ID upload
  - Selfie (liveness check future)
  - Business information
  - Optional business documents
    â†“
Status: Submitted → Under Review
    â†“
Admin review (manual Phase 5; admin dashboard future)
    â†“
Approved → Verified badge OR Rejected → reason + re-submit
```

#### Verified Benefits

| Benefit | Phase |
|---------|-------|
| Verification badge on profile and gigs | 5 |
| Higher search ranking weight | 5 |
| Priority recommendations slot | 5 |
| Higher buyer trust (UI signal) | 5 |
| Priority support | Future |

---

### 16.15 Follow Business

Users follow businesses (not just personal profiles).

| Follower Receives | Notification Type |
|-------------------|-------------------|
| Business posts | Updates tab + push |
| New gigs published | Push + Marketplace |
| Announcements | Push |
| Promotions | Push |
| Milestones | Push (optional) |

Followers count contributes to **ranking score** and business reputation.

---

### 16.16 Reviews & Rating System

Reviews only after **completed work** (order status = completed).

#### Buyer Reviews Seller

| Dimension | Type |
|-----------|------|
| Overall rating | 1â€“5 stars |
| Communication | 1â€“5 |
| Quality | 1â€“5 |
| Professionalism | 1â€“5 |
| Delivery | 1â€“5 |
| Would recommend | Boolean |
| Comment | Text |
| Optional images | Up to 3 |

#### Seller Reviews Buyer

| Dimension | Type |
|-----------|------|
| Communication | 1â€“5 |
| Requirements quality | 1â€“5 |
| Professionalism | 1â€“5 |
| Comment | Text |

#### Display

Show averages beautifully on gig detail, business profile, and search results:

- Overall rating (primary)
- Communication, Quality, Delivery, Professionalism, Value (where applicable)

**Phase 4:** Buyer → seller reviews. **Phase 5:** Seller → buyer reviews.

---

### 16.17 Favorites

Users can save:

| Type | Phase |
|------|-------|
| Businesses | 4 |
| Gigs | 4 |
| Portfolio items | 5 |
| Collections (grouped saves) | Future |

Favorites improve recommendations (Suggested For You, Recently Viewed correlation).

**Notification:** Business notified when gig saved/favorited (Phase 5).

---

### 16.18 Contact Seller (Critical Path)

**Most important marketplace button.**

```
Tap Contact Seller
    → Find existing conversation with seller OR create new 1:1 thread
    → Attach gig context card as first message (optional auto-message)
    → User lands in chat — chat is the workspace
    → All negotiation, agreement, order, delivery happens in thread
```

No external email. No separate inquiry form that doesn't open chat.

---

### 16.19 Order Flow (Version One — Simple)

V1 is intentionally simple. **No complicated dispute system.**

```
Buyer contacts seller (chat)
    â†“
Discuss requirements in thread
    â†“
Seller creates Agreement (in-chat action — order proposal)
    â†“
Buyer accepts agreement
    â†“
Order status: In Progress
    â†“
Seller delivers (message + attachments / delivery action)
    â†“
Buyer accepts delivery
    â†“
Order status: Completed
    â†“
Both parties prompted for review
    â†“
Conversation continues (repeat business natural)
```

**Payments:** Not in V1. Revenue fields show placeholder. Stripe escrow Phase 7.

---

### 16.20 Order Status Lifecycle

| Status | Description | Who Triggers |
|--------|-------------|--------------|
| **Inquiry** | Pre-order conversation; gig interest | Auto on contact from gig |
| **Waiting** | Agreement sent; awaiting buyer accept | Seller |
| **Accepted** | Buyer accepted; not yet started | Buyer |
| **In Progress** | Work actively being done | Seller |
| **Revision Requested** | Buyer requested changes | Buyer |
| **Delivered** | Seller marked delivered | Seller |
| **Completed** | Buyer accepted delivery | Buyer |
| **Cancelled** | Either party cancelled before completion | Either (with rules) |
| **Archived** | Historical; no active actions | System / user |

Each transition posts **system message + order card** update in conversation thread.

#### V1 Scope Cuts

- No automated dispute arbitration
- Cancellation rules: documented in edge cases (16.28)
- Payment hold/release: Phase 7

---

### 16.21 Marketplace Ranking (Configuration-Driven)

Search results must **never be random**. Ranking score computed server-side.

#### Ranking Factors

| Factor | Weight Source |
|--------|---------------|
| Verified seller | Config weight |
| Seller level | Config weight |
| Average rating | Config weight |
| Completed orders | Config weight |
| Repeat buyers | Config weight |
| Response rate | Config weight |
| Completion rate | Config weight |
| Profile completeness | Config weight |
| Recent activity | Config weight |
| Gig quality score | Config / manual signals future |
| Keyword relevance | Search query match |
| Favorites count | Config weight |
| Followers count | Config weight |
| Views / CTR | Config weight |
| Recent sales | Config weight |
| Negative reports | Penalty weight |

**Storage:** `ranking_weights` config JSON in database. Relevance + quality hybrid.

**Implementation:** Postgres function or Edge Function `search-gigs` returns pre-ranked results. Never client-side sort for default relevance.

---

### 16.22 Business Analytics

Beautiful, minimal charts — not spreadsheet UI.

| Metric | Chart Periods |
|--------|---------------|
| Visitors | Daily, weekly, monthly, yearly |
| Gig views | Same |
| Orders | Same |
| Favorites | Same |
| Followers | Same |
| Profile views | Same |
| Conversion rate | Views → inquiries |
| Response rate | Inquiries → responses |
| Completion rate | Accepted → completed |
| Repeat buyers | Count + % |
| Revenue | Placeholder until Phase 7 |

**Phase 5:** Full analytics screen. **Phase 4:** Dashboard summary widgets only.

---

### 16.23 Business Notifications

| Event | Push | In-App |
|-------|:----:|:------:|
| New order | ✅ | ✅ |
| New message (inquiry) | ✅ | ✅ |
| New review | ✅ | ✅ |
| Verification approved | ✅ | ✅ |
| Verification rejected | ✅ | ✅ |
| New follower | ✅ | ✅ |
| Gig saved/favorited | ✅ | ✅ |
| Portfolio like | Future | Future |

Respect Settings → Notifications → Business category toggles.

---

### 16.24 Business Settings

Accessible via Profile → Settings → Marketplace (business accounts).

| Section | Items |
|---------|-------|
| Business information | Name, description, category, logo, cover |
| Availability | Working hours (future) |
| **Vacation mode** | Toggle — see 16.25 |
| Languages | spoken languages |
| Response time | Display target |
| Notifications | Business category preferences |
| Verification | Status + submit |
| Portfolio | Manage portfolio |
| Seller level | Current level + progress to next |
| Gig defaults | Default package templates |

---

### 16.25 Vacation Mode

Business users pause selling without hiding presence entirely.

| State | Behavior |
|-------|----------|
| Vacation OFF | Normal operations |
| Vacation ON | Gigs remain **visible**; **cannot receive new orders**; profile shows "Currently unavailable" banner |

Existing in-progress orders continue. Inquiries can still message but auto-reply optional (future).

---

### 16.26 Business QR Code & Share Profile

#### QR Code

Every business gets a QR code (Profile → Share → QR).

```
Scan QR → Opens business profile (deep link)
```

#### Shareable Link

Format: `nexio.app/@username` (or `@nexiodesign` example)

```
Open link → Business profile → Portfolio, Services, Reviews accessible
```

Works for sharing outside Nexio. Universal links Phase 5+.

---

### 16.27 Future Payments Architecture (Phase 7 — Document Only)

Not implemented until Phase 7. Architecture prepared now to avoid rework.

```
Buyer accepts order with payment
    → Stripe PaymentIntent created (Edge Function)
    → Funds held in platform escrow (Stripe Connect)
    → Seller delivers → Buyer accepts
    → Edge Function releases funds to seller Connect account
    → Platform fee deducted per config
```

| Component | Technology |
|-----------|------------|
| Payment processing | Stripe |
| Seller payouts | Stripe Connect |
| Escrow hold | Stripe separate charges and transfers or manual capture |
| Fee config | `marketplace_config.platform_fee_percent` |
| Revenue dashboard | Replace placeholder widgets |

**V1â€“V6:** All price displays are informational; orders complete without payment capture.

---

### 16.28 Marketplace Permissions (RLS Summary)

| Resource | Buyer | Personal | Business (owner) | Admin |
|----------|-------|----------|------------------|-------|
| View published gigs | ✅ | ✅ | ✅ own + others | ✅ |
| Create/edit gigs | âŒ | âŒ | ✅ own | ✅ |
| Portfolio | View | View | ✅ CRUD own | ✅ |
| Orders | ✅ own | ✅ own | ✅ own seller | ✅ |
| Reviews | ✅ create post-order | ✅ | ✅ | moderate |
| Business profile | View | View | ✅ edit own | ✅ |
| Verification docs | âŒ | âŒ | ✅ submit own | ✅ review |
| Analytics | âŒ | âŒ | ✅ own | ✅ |
| Ranking config | âŒ | âŒ | âŒ | ✅ |
| Seller level config | âŒ | âŒ | âŒ | ✅ |

---

### 16.29 Marketplace Edge Cases

| Scenario | Expected Behavior |
|----------|---------------------|
| Personal user tries to create gig | Prompt: Become Business |
| Publish gig at active limit | Block with upgrade level hint |
| Contact seller while vacation mode | Chat opens; banner shows unavailable; order creation disabled |
| Seller deletes gig with active orders | Block delete; must complete or cancel orders first |
| Buyer cancels after In Progress | Seller confirms; status → Cancelled; review optional |
| Duplicate inquiry same gig | Open existing thread; attach gig card if not present |
| Review without completed order | Block — API returns error |
| Verified rejected | Badge not shown; resubmit allowed after cooldown |
| Search with no results | Friendly empty + broaden filters suggestion |
| Offline favorite | Queue locally; sync when online |
| Agreement modified after accept | V1: not allowed — cancel and create new |
| Both parties review | Independent; either order |
| Business downgrade (future) | Gigs unpublished; orders must complete first |

---

### 16.30 Marketplace Data Architecture (Conceptual)

Configuration tables (no hardcoded business rules):

| Table / Config Key | Purpose |
|--------------------|---------|
| `marketplace_config` | Gig limits, fee %, feature flags |
| `seller_level_definitions` | Level names, display order, max gigs |
| `seller_level_requirements` | Metric thresholds per level |
| `ranking_weights` | Search ranking factor weights |
| `business_profiles` | Extended business identity |
| `gigs` | Listings with packages JSON |
| `gig_packages` | Optional normalized package rows |
| `portfolio_items` | Portfolio media + metadata |
| `business_posts` | Updates feed content |
| `orders` | Order lifecycle + agreement snapshot |
| `reviews` | Buyer/seller review dimensions |
| `favorites` | Saved gigs, businesses, portfolio |
| `seller_metrics` | Aggregated stats for levels + ranking |
| `verification_submissions` | ID/docs + review status |
| `business_follows` | Follower relationships |

See [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) for integration with messaging.

---

### 16.31 Buyer & Seller Journeys (Summary)

#### Buyer Journey

```
Marketplace tab → Browse/search → Gig detail → Contact Seller →
Chat (workspace) → Agreement → Order → Delivery → Review
```

#### Seller Journey

```
Become Business → Complete profile → Portfolio → Create gig (5 steps) →
Publish → Receive inquiry in chat → Agreement → Deliver → Review → Level up
```

**Nothing leaves the app.** Orders and inquiries always link to chat threads.

---

## 17. Global Search

Search is **global** — one search experience across the ecosystem.

### 17.1 Search Entry

- Magnifying glass on Chats header (primary)
- Marketplace search bar (scoped to gigs with "search all" escape hatch)

### 17.2 Result Groups

| Group | Phase | Result Row |
|-------|-------|------------|
| People | 2 | Avatar, name, @username |
| Businesses | 4 | Logo, name, category, badge |
| Groups | 4 | Image, name, member count |
| Communities | 5 | Banner, name, members |
| Channels | 5 | Icon, name, followers |
| Marketplace | 4 | Gig card compact |
| Messages | 4 | Preview with conversation context |
| Media | 5 | Thumbnail grid |

### 17.3 Search UX

| Feature | Detail |
|---------|--------|
| Recent searches | Stored locally; clear option |
| Trending searches | Server-suggested (Phase 5) |
| Empty query | Show recent + trending |
| No results | Friendly empty state with suggestions |

---

## 18. Contacts & Friend Discovery

| Method | Phase |
|--------|-------|
| Username search | 2 |
| Phone number (verified + discoverable) | 3 |
| QR code (profile/group) | 4 |
| Invite links | 3 |
| Suggested users | 4 (mutual connections) |
| Mutual connections | 3 (on profile) |

**Invite flow:** Share app link → recipient installs → signup → optional auto-connect (future).

---

## 19. Notifications

### 19.1 Notification Categories

| Category | Examples |
|----------|----------|
| Message | New message, mention, reaction |
| Story | New story from contact, story reply |
| Marketplace | Inquiry, order update, review |
| Call | Incoming, missed |
| Business | Verification status, seller level |
| Orders | Status change, delivery |
| Mentions | @username in group/community |

### 19.2 In-App Notification Center (Phase 5)

Grouped by time:

- Today
- Yesterday
- This Week
- Older

Tap → deep link to conversation, order, profile, or Updates item.

### 19.3 Push Preferences

Granular toggles per category in Settings → Notifications. Respect system-level notification permission.

---

## 20. Offline Behavior

| Behavior | Spec |
|----------|------|
| Read cached chats | All previously loaded conversations readable offline |
| Queue messages | Outbound text/media metadata queued locally |
| Queue uploads | Media uploads pause and resume on reconnect |
| Auto sync | On reconnect: flush send queue, pull deltas, resume uploads |
| UI indicator | Persistent subtle offline banner |
| Failed state | Retry affordance per message |

Documented in [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md#offline-architecture).

---

## 21. Error States (Universal)

Every feature must implement all applicable states:

| State | UX Pattern |
|-------|------------|
| **Loading** | Skeleton placeholders — never bare spinners in lists |
| **Success** | Content with subtle entrance animation |
| **Failure** | Friendly message + retry button |
| **Retry** | Tap retry re-attempts failed operation |
| **Offline** | Banner + queued behavior |
| **Permission denied** | Explain why + link to OS settings |
| **Timeout** | "Taking longer than expected" + retry |
| **Empty** | Illustration + message + primary action |

---

## 22. Permissions Model

### 22.1 OS Permissions

| Permission | When Requested | Required |
|------------|----------------|----------|
| Notifications | After first login | Recommended |
| Camera | First photo/call/video | Feature-gated |
| Microphone | First voice note/call | Feature-gated |
| Photo library | First media send | Feature-gated |
| Contacts | Find friends (optional) | Optional |

**Rule:** Just-in-time permission requests with pre-permission explainer screen.

### 22.2 In-App Authorization (RLS)

| Resource | Rule |
|----------|------|
| Messages | Participants only |
| Profiles | Public read; self write |
| Groups | Members read; admin write settings |
| Communities | Members read; role-based write |
| Channels | Followers read; admins post |
| Orders | Buyer + seller only |
| Stories | Visibility per privacy setting |
| Phone number | Self read; others via discoverability flag |

---

## 23. Multi-Device (Future Plan)

| Platform | Phase | Sync Via |
|----------|-------|----------|
| Mobile (iOS/Android) | 1â€“6 | Supabase realtime + local cache |
| Tablet | 6+ | Responsive mobile layout |
| Web | 7+ | Supabase client; shared session |
| Desktop | Future | Electron/Tauri companion |

All devices share one account identity (username). Messages sync across active sessions. Device list in Settings → Devices with remote logout.

---

## 24. User Flows (Complete Reference)

### 24.1 Onboarding

```
Install → Welcome → Auth method → Username → Profile setup → Notification permission → Chats (home)
```

### 24.2 Start Conversation

```
Chats → New message → Search @username → Select → Thread → Type → Send
```

### 24.3 Upgrade to Business

```
Profile → Settings → Become Business → Business name, category, description → Submit → Business badge live → Marketplace seller tools unlocked
```

### 24.4 Post Story

```
Chats (stories row +) OR Updates → Capture/select media → Edit → Privacy → Post → Visible 24h
```

### 24.5 Reply to Story

```
Updates/Stories viewer → Reply → Direct thread opens with story context
```

### 24.6 Create Group

```
Chats → New message → New group → Select members → Name + image → Create → Group thread
```

### 24.7 Join Community

```
Search OR Updates → Community preview → Join → Community detail → Select group → Participate
```

### 24.8 Follow Channel

```
Updates OR Search → Channel preview → Follow → Posts appear in Updates
```

### 24.9 Buy Service (Full)

```
Marketplace → Gig → Send Inquiry → Chat → Agree → Place Order → Track in thread → Review
```

### 24.10 Block & Report

```
Profile OR Message long-press → Block/Report → Bottom sheet confirm → Blocked list in Privacy settings
```

---

## 25. Technical Architecture & Engineering Foundation (Part 4A)

This section defines how Nexio is **built** — engineering philosophy, stack, backend architecture, security, APIs, and scalability. It is the technical companion to Sections 4â€“16. Detailed reference copies live in [TECH_STACK.md](./TECH_STACK.md) and [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md).

---

### 25.1 Engineering Philosophy

Nexio must be built like a **production application** from day one.

| Principle | In Practice |
|-----------|-------------|
| **No shortcuts** | No "temporary" hacks merged to main; no skipped RLS "for now" |
| **No hardcoded business logic** | Seller levels, gig limits, ranking, fees → configuration tables |
| **Scalable by design** | Pagination, indexes, virtualized lists, optimized realtime |
| **Modular** | Feature modules with clear boundaries; shared contracts in `packages/shared` |
| **Reusable** | Design system, repositories, validators, Edge Function helpers |
| **Documented** | Every table, API, bucket, and policy documented before implementation |
| **Self-explanatory** | Future developers understand architecture from docs + folder structure |

**Rule:** If a decision cannot be explained in documentation, it is not ready to implement.

---

### 25.2 Technology Stack (Authoritative)

#### Frontend (Mobile)

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform native UI |
| **Expo** | Build pipeline, OTA, native modules |
| **TypeScript** | Strict typing across monorepo |
| **Expo Router** | File-based navigation, deep links |
| **React Native Reanimated** | 60fps animations |
| **React Native Gesture Handler** | Swipes, long-press, sheets |
| **React Hook Form** | Form state management |
| **Zod** | Runtime validation (client + Edge Functions) |
| **Expo Image** | Cached images, placeholders |
| **Expo AV** | Voice notes, video playback, recording |
| **Expo Notifications** | Push registration + handlers |
| **Expo SecureStore** | Session tokens, sensitive prefs |
| **TanStack Query** | Server state, cache, sync |
| **Zustand** | Minimal global UI state |
| **Victory Native** | Business analytics charts (Phase 5) |
| **Lucide React Native** | Icon system |
| **FlashList** | Virtualized long lists (messages, marketplace) |
| **WatermelonDB** or **Expo SQLite** | Offline message cache + send queue |

#### Backend

| Technology | Purpose |
|------------|---------|
| **Supabase Auth** | Email/password, Google, Apple; optional phone OTP |
| **PostgreSQL** | Primary relational database |
| **Supabase Realtime** | Messages, presence, typing, live updates |
| **Supabase Storage** | All media assets (see 25.8) |
| **Supabase Edge Functions** | Secrets, push, search, cron, payments (future) |

#### Voice & Video

| Technology | Purpose |
|------------|---------|
| **LiveKit Cloud** | WebRTC SFU — voice/video/group calls only |

#### Push Notifications

| Technology | Purpose |
|------------|---------|
| **Firebase Cloud Messaging (FCM)** | Android push delivery |
| **Apple Push Notification Service (APNs)** | iOS push delivery |
| **Expo Notifications** | Unified client API; token registration |

LiveKit handles **media only**. Supabase stores call history, participants, duration, missed calls.

---

### 25.3 Database Philosophy

| Rule | Detail |
|------|--------|
| **One purpose per table** | No god tables; split by domain module |
| **Avoid duplication** | Single source of truth; derive aggregates into `seller_metrics` etc. |
| **Normalize by default** | FK relationships documented |
| **Denormalize selectively** | Only for read performance (e.g. cached counts, search vectors) |
| **Document everything** | Relationships, FKs, indexes in migration comments + docs |
| **Standard columns** | `id` (UUID), `created_at`, `updated_at` on all core tables |
| **Soft delete** | `deleted_at` where recoverability matters (messages, gigs, profiles) |

#### Index Documentation Rule

Every migration creating a table must include commented index rationale:

```sql
-- idx_messages_conversation_id_created_at: thread pagination
CREATE INDEX idx_messages_conversation_id_created_at ON messages (conversation_id, created_at DESC);
```

---

### 25.4 Database Modules

Each module is **independent** — own migrations folder prefix, RLS policies, and repository layer. Cross-module references via FK only.

| Module | Core Tables (Conceptual) | Depends On |
|--------|--------------------------|------------|
| **Authentication** | `auth.users` (Supabase), `profiles` | — |
| **Profiles** | `profiles`, `profile_settings`, `blocks` | Auth |
| **Business** | `business_profiles`, `business_follows`, `verification_submissions` | Profiles |
| **Messaging** | `conversations`, `conversation_participants`, `messages`, `message_reactions`, `read_receipts` | Profiles |
| **Calls** | `call_sessions`, `call_participants` | Profiles, Messaging |
| **Marketplace** | `gigs`, `gig_packages`, `portfolio_items`, `favorites` | Business |
| **Orders** | `orders`, `order_events` | Marketplace, Messaging |
| **Reviews** | `reviews`, `review_dimensions` | Orders |
| **Communities** | `communities`, `community_members` | Profiles |
| **Groups** | Extends `conversations` (type=group) + `group_settings` | Messaging |
| **Channels** | `channels`, `channel_posts`, `channel_followers` | Communities/Business |
| **Stories** | `stories`, `story_views` | Profiles |
| **Notifications** | `device_tokens`, `notification_preferences`, `notification_log` | Profiles |
| **Settings** | `user_settings`, `privacy_settings` | Profiles |
| **Analytics** | `seller_metrics`, `profile_views`, `gig_views` (aggregates) | Business, Marketplace |
| **Moderation** | `reports`, `moderation_actions` | All user content |
| **Configuration** | `marketplace_config`, `seller_level_definitions`, `seller_level_requirements`, `ranking_weights`, `feature_flags` | — |
| **Administration** | `admin_users`, `audit_logs` | Auth |

**Module independence rule:** `features/messaging` must not import `features/marketplace` directly. Shared types in `packages/shared`.

---

### 25.5 Supabase Responsibilities

Supabase is the **primary backend**. All services integrate through one project.

| Service | Responsibilities |
|---------|------------------|
| **Auth** | Signup, login, OAuth, JWT, session refresh, optional phone OTP |
| **Database** | All application data, RLS, triggers, RPC functions |
| **Realtime** | Postgres changes + broadcast channels for live UX |
| **Storage** | Media buckets with RLS-aligned policies |
| **Edge Functions** | Privileged logic, webhooks, cron, third-party secrets |
| **Presence** | Online/offline via Realtime presence (Phase 2+) |

Everything integrates naturally — one anon key on client, service role only on server.

---

### 25.6 Authentication (Technical)

| Method | Provider | Phase |
|--------|----------|-------|
| Email + password | Supabase Auth | 1 |
| Google OAuth | Supabase Auth | 1 |
| Apple Sign In | Supabase Auth | 1 |
| Phone OTP | Supabase Auth + Twilio (optional) | 2 (Settings only) |

**Rules:**

- Never require phone number at signup
- JWT access token in memory; refresh via SecureStore
- `profiles.id` = `auth.users.id` (1:1 FK)
- Username uniqueness enforced at DB level (`profiles.username` unique index)
- Edge Functions validate JWT via `supabase.auth.getUser(token)`

---

### 25.7 Row Level Security (RLS)

**Every table must have RLS enabled.** No exceptions in production.

#### Policy Categories

| Data Type | Access Model |
|-----------|--------------|
| **Public marketplace** | Published gigs, public business profiles, portfolio — SELECT for all authenticated users |
| **Private messaging** | Messages, conversations — participants only |
| **Private user data** | Settings, phone, email prefs — owner only |
| **Business analytics** | `seller_metrics`, dashboard aggregates — business owner only |
| **Orders / reviews** | Buyer + seller on that order only |
| **Verification docs** | Submitter + admin only |
| **Configuration** | Read: authenticated where needed; Write: admin/service role only |
| **Admin** | Service role + `admin_users` check |

#### RLS Policy Naming

`{table}_{operation}_{description}` — e.g. `messages_select_participant`

#### Sensitive Data Rules

- Never expose phone numbers unless discoverability enabled + requester authorized
- Never expose verification document URLs to non-admin
- Never expose draft/unpublished gigs publicly
- Conversation list derived from `conversation_participants` — not open message SELECT

#### Admin Permissions (Future Dashboard)

| Action | Role |
|--------|------|
| Review verification | `admin` |
| Moderate reports | `admin`, `moderator` |
| Edit configuration | `admin` |
| View audit logs | `admin` |
| Impersonate user | **Never** |

---

### 25.8 Storage Architecture

#### Buckets

| Bucket | Visibility | Upload | Read | Delete |
|--------|------------|--------|------|--------|
| `avatars` | Public | Owner | Public | Owner |
| `covers` | Public | Owner | Public | Owner |
| `business_logos` | Public | Business owner | Public | Business owner |
| `business_banners` | Public | Business owner | Public | Business owner |
| `chat_images` | Private | Conversation participant | Participant (signed URL) | Owner / admin |
| `chat_videos` | Private | Conversation participant | Participant (signed URL) | Owner / admin |
| `voice_notes` | Private | Conversation participant | Participant (signed URL) | Owner |
| `documents` | Private | Conversation participant | Participant (signed URL) | Owner |
| `gig_images` | Public | Business owner | Public (published gigs) | Business owner |
| `gig_videos` | Public | Business owner | Public (published gigs) | Business owner |
| `portfolio` | Public | Business owner | Public | Business owner |
| `stories` | Private* | Owner | Authorized viewers* | Owner |
| `status` | Public | Owner | Public (legacy naming — use stories) | Owner |
| `temporary_uploads` | Private | Authenticated | Owner only | Owner + TTL cleanup |

*Stories: signed URLs for non-public privacy settings; public stories may use CDN URLs.

#### Storage Path Convention

```text
{bucket}/{owner_user_id}/{resource_id}/{filename}
```

#### Upload Security

- Max file size enforced client (Zod) + Storage policy + Edge Function validation
- MIME type validation on Edge Function for sensitive buckets
- Virus scan: future (Phase 6+)
- `temporary_uploads` auto-delete after 24h via scheduled Edge Function

---

### 25.9 Realtime Architecture

#### Realtime Powers

| Feature | Mechanism |
|---------|-----------|
| Messaging | Postgres changes on `messages` + broadcast channel |
| Typing indicators | Broadcast `conversation:{id}` — ephemeral, not persisted |
| Online presence | Realtime Presence on `presence:user:{id}` |
| Message delivery | INSERT on `messages` → Realtime → client |
| Read receipts | UPDATE on `read_receipts` |
| Calls | Signaling via Supabase; media via LiveKit |
| Notifications | DB insert → Edge Function → push (not Realtime to client for push) |
| Group updates | `conversation:{id}` for member changes |
| Community updates | `community:{id}` channel |
| Business notifications | Postgres triggers → Edge Function |
| Marketplace activity | Order status changes → Realtime on `order:{id}` |

#### Subscription Optimization

| Rule | Detail |
|------|--------|
| Subscribe on focus | Open conversation → subscribe; leave → unsubscribe |
| Debounce typing | 300ms client debounce before broadcast |
| Batch presence | Single presence channel per user |
| Limit channels | Max ~5 concurrent subscriptions per client typical |
| Filter Realtime | Use `filter` on postgres_changes where possible |

---

### 25.10 LiveKit Architecture

**LiveKit is responsible only for real-time media transport.**

| LiveKit Handles | Supabase Handles |
|-----------------|------------------|
| Voice streams | `call_sessions` record |
| Video streams | `call_participants` |
| Group call SFU | Duration, started_at, ended_at |
| Adaptive bitrate | Missed call status |
| Future: screen share | Call linked to `conversation_id` |

#### Token Flow

```
Client → Edge Function generate-livekit-token (JWT auth)
    → Validates participants
    → Creates/updates call_session
    → Returns LiveKit JWT (short TTL, room-scoped)
Client → LiveKit SDK join room
On disconnect → Update call_session → System message in thread
```

**Secrets:** `LIVEKIT_API_SECRET` only in Edge Functions.

---

### 25.11 Push Notification Architecture

| Category | Trigger | Configurable |
|----------|---------|--------------|
| Messages | New message INSERT | Per-conversation mute + global |
| Calls | Incoming call | Always (unless DND future) |
| Stories | Contact posts story | Settings |
| Business updates | Business post, new gig | Follow settings |
| Marketplace | Inquiry, order update | Business settings |
| Orders | Status change | Buyer + seller prefs |
| Reviews | New review received | On |
| Verification | Approved / rejected | On |
| Mentions | @username in group | On |
| Followers | New follower | On |
| Community | Announcement | Community mute |

**Pipeline:**

```
DB event → Edge Function send-push-notification
    → Load device_tokens + preferences
    → FCM (Android) / APNs (iOS) via Expo push API or direct
    → Log to notification_log
```

---

### 25.12 Search Architecture

#### Search Domains

| Domain | Phase | Index Strategy |
|--------|-------|----------------|
| People (profiles) | 2 | `username`, `display_name` — GIN/trigram |
| Businesses | 4 | `business_profiles` + joined profile fields |
| Marketplace (gigs) | 4 | Full-text on title, description, tags; ranked via Edge Function |
| Messages | 4 | Scoped to user's conversations; pg_trgm or external index Phase 6+ |
| Communities | 5 | Name, description |
| Groups | 4 | Conversation name |
| Channels | 5 | Channel name |
| Stories | Future | Not searchable (ephemeral) |

#### Indexing Rules

- All searchable columns documented in migrations
- Marketplace search **never random** — server-side ranking (Section 16.21)
- Phase 6+: evaluate **Meilisearch** or **Typesense** for global search at scale
- Recent + trending searches cached client-side; server trends in `search_trends` (Phase 5)

#### Future Global Search

Single overlay querying all domains in parallel → grouped results (Section 17).

---

### 25.13 Configuration System

**Never hardcode business rules.** All managed via configuration tables + admin tooling (future).

| Config Table | Manages |
|--------------|---------|
| `marketplace_config` | Gig limits default, platform fee %, maintenance mode |
| `seller_level_definitions` | Level names, max active gigs, display order |
| `seller_level_requirements` | Metric thresholds per level |
| `ranking_weights` | Marketplace search ranking factors |
| `feature_flags` | Toggle features per user segment or globally |
| `announcement_settings` | In-app banners, forced update version |
| `notification_defaults` | Default ON/OFF for new users per category |
| `business_rules` | Order timeouts, review windows, vacation behavior |
| `monetization_config` | Stripe fee, payout delay (Phase 7) |

**Client reads:** Public config via RPC or cached TanStack Query (5min stale).

**Client writes:** Never — admin Edge Function or dashboard only.

---

### 25.14 Security Architecture

Security begins **day one**.

| Area | Implementation |
|------|----------------|
| **Password security** | Supabase Auth policies (min length, breach check) |
| **JWT validation** | All Edge Functions; RLS on all tables |
| **Rate limiting** | Edge Function middleware: per-IP + per-user limits |
| **Spam prevention** | Message rate limits; new account throttles; report threshold |
| **Abuse detection** | Report aggregation; auto-flag via Edge Function (Phase 5) |
| **Secure uploads** | MIME validation, size limits, signed URLs |
| **Secure downloads** | Short TTL signed URLs for private media |
| **Audit logs** | `audit_logs` for admin actions, verification decisions |
| **Permission checks** | RLS primary; Edge Function secondary for complex logic |

#### Rate Limit Guidelines (Initial)

| Endpoint | Limit |
|----------|-------|
| Auth signup | 5 / hour / IP |
| Send message | 60 / min / user |
| Create gig | 10 / day / user |
| Search | 30 / min / user |
| LiveKit token | 10 / min / user |

---

### 25.15 Privacy Architecture (Technical)

Users own their data.

| Capability | Implementation | Phase |
|------------|----------------|-------|
| Export personal data | Edge Function generates JSON/ZIP of user data | 6 |
| Delete account | Soft delete + 30-day purge job; anonymize messages optional | 6 |
| Hide phone number | RLS + discoverability flag | 2 |
| Hide online status | Presence not broadcast; last_seen null | 2 |
| Control discoverability | `privacy_settings` table | 2 |

**GDPR-oriented:** Export and delete documented in privacy policy; implement before EU marketing.

---

### 25.16 API Design Standards

Every API must be documented before implementation. Use this template in `docs/api/` (create at Phase 1).

#### Endpoint Documentation Template

```markdown
## {METHOD} {path}

**Purpose:** One sentence.

**Authentication:** Required | Optional | Service role

**Permissions:** RLS policy / role required

**Rate limit:** N requests / window

### Input
| Field | Type | Required | Validation |

### Output
| Field | Type | Description |

### Errors
| Code | HTTP | Meaning |

### Future improvements
- ...
```

#### API Catalog (Planned)

##### Supabase Client (Direct — RLS Protected)

| Operation | Table/RPC | Auth | Phase |
|-----------|-----------|------|-------|
| Get profile | `profiles` SELECT | JWT | 1 |
| Update profile | `profiles` UPDATE | JWT (own) | 1 |
| List conversations | `conversations` + participants | JWT | 2 |
| Send message | `messages` INSERT | JWT (participant) | 2 |
| List gigs | `gigs` SELECT | JWT | 4 |
| Create order | `orders` INSERT | JWT (buyer/seller) | 4 |

##### Edge Functions (HTTP)

| Function | Method | Auth | Purpose | Phase |
|----------|--------|------|---------|-------|
| `generate-livekit-token` | POST | JWT | LiveKit room token | 3 |
| `send-push-notification` | POST | Service / trigger | Dispatch push | 2 |
| `search-gigs` | POST | JWT | Ranked marketplace search | 4 |
| `search-global` | POST | JWT | Multi-domain search | 5 |
| `evaluate-seller-levels` | POST | Cron secret | Nightly level job | 5 |
| `aggregate-analytics` | POST | Cron secret | Roll up metrics | 5 |
| `process-verification` | POST | Admin JWT | Approve/reject verification | 5 |
| `export-user-data` | POST | JWT (own) | GDPR export | 6 |
| `delete-account` | POST | JWT (own) | Account deletion | 6 |
| `create-payment-intent` | POST | JWT | Stripe payment (future) | 7 |
| `cleanup-temp-uploads` | POST | Cron secret | Delete stale uploads | 4 |

##### Realtime Subscriptions

| Channel | Auth | Events |
|---------|------|--------|
| `conversation:{id}` | Participant | messages, typing |
| `presence:user:{id}` | Authenticated | online/offline |
| `order:{id}` | Buyer/seller | status_changed |

---

### 25.17 Edge Functions

| Function | Trigger | Responsibility |
|----------|---------|----------------|
| **generate-livekit-token** | HTTP | Call media access |
| **send-push-notification** | DB webhook / HTTP | FCM + APNs dispatch |
| **on-message-created** | DB INSERT trigger | Push if recipient offline |
| **search-gigs** | HTTP | Ranked search with config weights |
| **search-global** | HTTP | Cross-domain search |
| **evaluate-seller-levels** | Cron (daily) | Level progression |
| **aggregate-analytics** | Cron (hourly) | Dashboard metrics rollups |
| **process-verification** | HTTP (admin) | Verification workflow |
| **cleanup-temp-uploads** | Cron (daily) | Storage hygiene |
| **rate-limit-check** | Middleware | Shared limit helper |
| **create-payment-intent** | HTTP | Stripe (Phase 7) |
| **stripe-webhook** | HTTP | Payment events (Phase 7) |

**Shared:** `supabase/functions/_shared/` — CORS, auth helper, rate limit, Zod validators from `packages/shared`.

---

### 25.18 Error Handling (Technical)

Every feature implements the UX states from Section 21 plus technical recovery:

| State | Technical Response |
|-------|-------------------|
| **Loading** | TanStack Query `isLoading`; skeleton components |
| **Empty** | Zero rows; show empty state component |
| **Error** | Map Supabase error codes to user-friendly copy |
| **Retry** | Query `refetch()`; message send queue retry with backoff |
| **Offline** | Network listener; queue writes to local DB |
| **Permission denied** | RLS 403 → explain + settings link |
| **Unexpected** | Log to Sentry; generic user message |

#### Error Code Mapping (Examples)

| Supabase/Postgres | User Message |
|-------------------|--------------|
| `42501` RLS violation | "You don't have access to this" |
| `23505` unique violation | "Username already taken" |
| Network timeout | "Connection timed out — tap to retry" |

---

### 25.19 Logging & Observability

| Log Type | Tool | Retention |
|----------|------|-----------|
| **Application logs** | Sentry breadcrumbs | 90 days |
| **Error logs** | Sentry issues | 90 days |
| **Server logs** | Supabase Edge Function logs | 30 days |
| **Audit logs** | `audit_logs` table | 2 years |
| **Admin actions** | `audit_logs` (admin_id, action, target) | 2 years |
| **Security events** | Sentry + `audit_logs` (failed auth spikes) | 90 days |

#### What to Log

| Event | Level |
|-------|-------|
| Auth failure | Warn |
| RLS denial (repeated) | Warn |
| Order state change | Info (audit) |
| Verification decision | Info (audit) |
| Payment event | Info (audit) — Phase 7 |
| Crash | Error (Sentry) |

**Never log:** Passwords, tokens, verification document contents, message body in production logs.

---

### 25.20 Scalability Design

Design for growth without premature optimization.

| Scale Target | Architecture Response |
|--------------|----------------------|
| **Millions of users** | Connection pooling; read replicas; CDN |
| **Millions of messages** | Partition `messages` by month; archive cold storage |
| **Thousands of businesses** | Indexed marketplace search; aggregated metrics |
| **Large media libraries** | Storage CDN; lazy load; thumbnail generation |
| **Future web app** | Shared `packages/shared`, `packages/supabase` |
| **Future desktop** | Same backend; native shell |
| **Future API integrations** | Public API via Edge Functions + API keys (post-PMF) |

Avoid assumptions that limit scale (unbounded SELECT, no pagination, subscribe-all realtime).

---

### 25.21 Performance Optimization

| Area | Strategy |
|------|----------|
| **Queries** | Indexes on all FK + filter columns; EXPLAIN on slow queries |
| **Realtime** | Subscribe only active screens; unsubscribe on blur |
| **Images** | Expo Image cache; WebP; blurhash placeholders; max upload dimensions |
| **Pagination** | Cursor-based (created_at + id); 50 items default page |
| **Lazy loading** | Tab screens lazy mount; images below fold |
| **Caching** | TanStack Query staleTime per domain; offline SQLite for messages |
| **Virtualized lists** | FlashList everywhere for 50+ rows |
| **Compression** | Voice notes Opus/AAC; image resize before upload |
| **Analytics charts** | Pre-aggregated tables; don't compute from raw events on client |

#### Performance Budgets

| Metric | Target |
|--------|--------|
| Cold launch to interactive | < 2s |
| Message send perceived | < 200ms (optimistic) |
| Marketplace search p95 | < 800ms |
| Image thumb load | < 300ms (cached) |
| Scroll FPS | 60fps |

---

### 25.22 Engineering Definition of Done (Cross-Cutting)

Every implemented feature must satisfy:

- [ ] RLS policies written and integration-tested
- [ ] Zod validator in `packages/shared`
- [ ] API documented per Section 25.16 template
- [ ] Loading, empty, error, offline states (Section 21)
- [ ] No hardcoded business constants
- [ ] Indexes documented in migration
- [ ] Accessibility labels on interactive elements
- [ ] Sentry error boundary where appropriate

---

## 26. Project Structure & Engineering Standards (Part 4B)

Part 4B completes the engineering documentation: folder structure, state architecture, offline strategy, admin/moderation, and the **authoritative 8-phase implementation roadmap** (Section 28).

Full folder layout: [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md). Coding rules: [CODING_STANDARDS.md](./CODING_STANDARDS.md).

---

### 26.1 Project Structure Principles

The monorepo must **scale for years**. Clear separation of concerns:

| Layer | Location | Contains |
|-------|----------|----------|
| **Screens** | `apps/mobile/app/` | Expo Router routes only — thin, compose features |
| **Features** | `apps/mobile/src/features/` | Domain logic per module |
| **Components** | `features/*/components/` + `shared/components/` | Feature-specific vs design system |
| **Hooks** | `features/*/hooks/` + `shared/hooks/` | Data + UI orchestration |
| **Services** | `features/*/services/` | Supabase repositories, API calls |
| **Stores** | `features/*/stores/` + `shared/stores/` | Zustand slices |
| **Utilities** | `packages/shared/src/utils/` + `shared/lib/` | Pure functions |
| **Constants** | `packages/shared/src/constants/` | App-wide constants (not business rules) |
| **Types** | `packages/shared/src/types/` + `features/*/types.ts` | Shared vs feature types |
| **Assets** | `apps/mobile/assets/` | Fonts, images, animations |
| **Navigation** | `app/` layouts + `shared/navigation/` | Expo Router, deep link helpers |
| **Providers** | `apps/mobile/src/providers/` | Auth, Query, Theme, Realtime |
| **Database** | `supabase/migrations/` | SQL schema, RLS, indexes |
| **Edge Functions** | `supabase/functions/` | Server-side logic |
| **Documentation** | `docs/` + `docs/api/` | Product + API docs |
| **Testing** | `**/*.test.ts(x)`, `e2e/` | Unit, integration, E2E |

**Rule:** Screens import from features; features import from shared/packages — never the reverse.

---

### 26.2 Coding Standards Summary

| Standard | Requirement |
|----------|-------------|
| TypeScript everywhere | Strict mode; no `any` without exception |
| Reusable components | Design system in `shared/components/` |
| No duplication | Shared validators, utils, types in packages |
| Feature-first architecture | One folder per domain module |
| Meaningful naming | See NAMING_CONVENTIONS.md |
| Small functions | Single responsibility; max ~40 lines preferred |
| Readable files | Max ~300 lines; split when larger |
| Self-documenting code | Clear names; comments only for non-obvious logic |

---

### 26.3 State Management Architecture

| Domain | Tool | Storage | Sync |
|--------|------|---------|------|
| **Authentication** | Zustand (`authStore`) + Supabase session | SecureStore (refresh token) | Supabase Auth listener |
| **User / Profile** | TanStack Query (`['profile', id]`) | Query cache | On mount + after edits |
| **Messaging** | TanStack Query + local SQLite | WatermelonDB/SQLite | Realtime + sync engine |
| **Marketplace** | TanStack Query | Query cache | Stale 5min; invalidate on publish |
| **Business** | TanStack Query | Query cache | Dashboard refetch on focus |
| **Notifications** | TanStack Query + Zustand (unread badge) | Query cache | Realtime + push |
| **Calls** | Zustand (active call state) | Memory only | LiveKit SDK |
| **Settings** | TanStack Query | Query cache | Optimistic update |
| **Realtime** | Supabase Realtime subscriptions | In-memory per channel | Subscribe/unsubscribe lifecycle |
| **Offline queue** | Zustand + SQLite | Persistent queue table | Flush on reconnect |

#### Provider Tree (Root `_layout.tsx`)

```
ThemeProvider
  QueryClientProvider
    AuthProvider (session, profile bootstrap)
      RealtimeProvider (connection manager)
        NetworkProvider (offline banner)
          Stack / Tabs
```

**Rule:** Server state in TanStack Query. UI-only global state in Zustand. Never duplicate server data in Zustand.

---

### 26.4 Offline Support Architecture

**Offline-first where possible** — messaging is the priority.

| Queue Type | Stored In | Sync Trigger |
|------------|-----------|--------------|
| **Messages** | SQLite `pending_messages` | Connectivity restore + app foreground |
| **Media uploads** | SQLite `pending_uploads` + file URI | Resume multipart upload |
| **Marketplace gig drafts** | SQLite `draft_gigs` | Manual save; sync on publish |
| **Story uploads** | SQLite `pending_stories` | Queue + retry |
| **Business profile edits** | TanStack Query mutation queue | Retry on reconnect |

#### Sync Engine Responsibilities

1. Detect online/offline (NetInfo)
2. Flush message queue FIFO with exponential backoff
3. Resume interrupted Storage uploads
4. Pull deltas since `last_synced_at` per conversation
5. Reconcile optimistic UI with server ack

See Section 20 and Section 25.18 for UX during offline.

---

### 26.5 Admin System

**Admin is NOT involved in normal user activity.**

#### Admin Does NOT Approve

| User Action | Flow |
|-------------|------|
| User signup | Automatic |
| Business creation (Become Business) | Automatic |
| Gig publishing | Automatic (subject to gig limits + RLS) |
| Stories | Automatic |
| Groups / Communities / Channels | Automatic (creator owns) |

#### Admin Responsibilities

| Responsibility | Tool |
|----------------|------|
| Review reports | Admin dashboard (Phase 8) / Supabase manual Phase 8- |
| Warn users | `moderation_actions` table |
| Suspend users | Auth ban + profile flag |
| Ban users | Permanent auth ban |
| Remove harmful content | Soft delete + storage purge |
| **Approve verification requests** | Only manual admin gate |
| Create announcements | `announcements` table |
| Manage feature flags | `feature_flags` config |
| Manage configuration | Config tables (Section 25.13) |
| View platform analytics | Admin analytics (aggregated, no private chats) |

**Access:** `admin_users` table; service role for Edge Functions; admin JWT claim future.

---

### 26.6 Report System

Users can report content. Reports create `reports` row → admin queue.

| Reportable | Phase |
|------------|-------|
| Messages | 8 |
| Profiles | 8 |
| Businesses | 8 |
| Gigs | 8 |
| Communities | 8 |
| Stories | 8 |
| Comments (channel/community) | 8 |

#### Report Reasons (Enum)

`spam` Â· `scam` Â· `harassment` Â· `copyright` Â· `explicit_content` Â· `other`

#### Flow

```
User → Report bottom sheet → Select reason + optional details → Submit
    → reports INSERT → Admin notification → Admin reviews (Phase 8)
```

**RLS:** User can INSERT own reports; only admin SELECT all.

---

### 26.7 Announcements (Admin)

Admins create announcements visible in **Updates tab**.

| Field | Options |
|-------|---------|
| Title | Text |
| Body | Markdown-lite |
| Audience | `everyone` Â· `businesses` Â· `personal` Â· `specific_group` (group_id) |
| Starts at / Expires at | Timestamps |
| Priority | Normal Â· Important (pinned) |

**Not** a replacement for push marketing — in-app Updates card + optional push.

---

### 26.8 Feature Flags

Every major feature toggleable via `feature_flags` table.

| Flag Key (Examples) | Default | Phase |
|---------------------|---------|-------|
| `ff_marketplace_enabled` | true | 4 |
| `ff_stories_enabled` | true | 6 |
| `ff_group_calls_enabled` | true | 3 |
| `ff_payments_enabled` | false | 9 |
| `ff_ai_assistant` | false | Future |
| `ff_desktop_companion` | false | Future |
| `ff_premium_tier` | false | Future |

**Client:** Fetch flags on app launch; cache 5min; respect flag before rendering feature entry points.

**Never** ship half-built features visible — gate with flags during development.

---

## 27. Feature Roadmap

### MVP (Phases 1â€“3) — Internal Alpha → Beta

| Feature | Phase |
|---------|-------|
| Email + password auth | 1 |
| Google OAuth | 1 |
| Apple Sign In (iOS) | 1 |
| Required unique username | 1 |
| User profiles (personal) | 1 |
| Privacy settings (basic) | 1 |
| Tab shell: Chats, Marketplace, Updates, Calls, Profile | 1 |
| 1:1 text messaging | 2 |
| Realtime delivery + message status | 2 |
| Pin, archive, mute conversations | 2 |
| Swipe actions on conversation rows | 2 |
| Push notifications (basic) | 2 |
| Optional phone + OTP (Settings) | 2 |
| User search by username | 2 |
| Message actions: reply, copy, delete, info | 2 |
| Image & video sharing | 3 |
| Voice notes (full recorder UX) | 3 |
| Documents (PDF, Office, ZIP) | 3 |
| Group conversations | 3 |
| Message edit, pin, star, reactions, forward | 3 |
| Typing indicators & read receipts | 3 |
| 1:1 voice/video calls (LiveKit) | 3 |
| Offline message read + send queue | 3 |
| Stories (photo, video, text) | 3 |

### Beta → Public Launch (Phases 4â€“5)

| Feature | Phase |
|---------|-------|
| Become Business upgrade flow | 4 |
| Business profile (premium storefront) | 4 |
| Seller dashboard (core widgets) | 4 |
| Marketplace home (sections, categories) | 4 |
| Marketplace search + filter bottom sheet | 4 |
| Create gig (5-step flow + packages) | 4 |
| Gig details page + Contact Seller | 4 |
| Portfolio CRUD | 4 |
| Order flow V1 (agreement in chat) | 4 |
| Order status lifecycle | 4 |
| Buyer → seller reviews | 4 |
| Favorites (gigs, businesses) | 4 |
| Business QR + share profile | 4 |
| Vacation mode | 5 |
| Verification submission + admin review | 5 |
| Seller levels (config-driven) | 5 |
| Active gig limits (config-driven) | 5 |
| Marketplace ranking (config-driven) | 5 |
| Business posts → Updates tab | 5 |
| Business analytics (full charts) | 5 |
| Seller → buyer reviews | 5 |
| Follow business + notifications | 5 |
| Featured sections + recommendations | 5 |
| Location & contact messages | 4 |
| Group invite links + QR | 4 |
| GIF messages | 4 |
| Communities (multi-group) | 5 |
| Broadcast channels | 5 |
| Updates tab (full feed) | 5 |
| Group voice/video calls | 5 |
| Notification center (grouped) | 5 |
| Stickers | 5 |
| App Store / Play Store release | 5 |

### Post-Launch (Phases 6â€“7)

| Feature | Phase |
|---------|-------|
| Launch hardening & v1.0 | 6 |
| Message translate placeholder → integration | 6+ |
| Stripe payments & escrow | 7 |
| Revenue dashboard (live) | 7 |
| Portfolio likes | Future |
| Premium Business seller level | Future |
| Location-based marketplace search | Future |
| Admin moderation dashboard | Future |
| Multi-device web companion | 7 |
| Voice rooms (groups) | 7+ |
| End-to-end message encryption (evaluate) | Future |
| Desktop app | Future |
| AI-assisted matching & replies | Future |
| Music in stories | Future |

---

## 28. Implementation Phases (Part 4B)

**Authoritative detailed specs:** [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md) — each phase includes goal, screens, components, backend, database, storage, realtime, testing, DoD, dependencies, and risks.

### Phase Summary

| Phase | Focus | Duration | Milestone |
|-------|-------|----------|-----------|
| **0** ✅ | Documentation (Parts 1â€“4B) | 3 wks | Docs complete |
| **1** | Init, design system, navigation, auth | 2â€“3 wks | Authenticated app shell |
| **2** | Profiles, messaging, realtime, presence | 3â€“4 wks | Internal Alpha (chat) |
| **3** | Calls, voice notes, media, groups | 4â€“5 wks | Internal Alpha complete |
| **4** | Marketplace, business, gigs, portfolio | 5â€“6 wks | Closed Beta (marketplace) |
| **5** | Orders, reviews, verification, ranking | 5â€“6 wks | Closed Beta (transactions) |
| **6** | Communities, channels, stories, updates | 5â€“6 wks | Open Beta |
| **7** | Notifications, offline, performance, security | 3â€“4 wks | Production hardening |
| **8** | Admin, moderation, analytics, polish | 4â€“5 wks | **v1.0 launch** |
| **9** | Payments (Stripe) | 6â€“8 wks | v1.1 monetization |

### Phase 0: Foundation & Documentation ✅

**Status:** Complete — v1.4.0 documentation suite.

All deliverables in [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md#phase-0-foundation--documentation-).

### Phases 1â€“9

See [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md) for full specifications. **Do not skip phase gates.**

---

## 29. Dependencies

### Phase Dependency Graph

```
Phase 0 (Docs) ✅
    └── Phase 1 (Init, Auth, Navigation)
            └── Phase 2 (Messaging, Realtime)
                    └── Phase 3 (Calls, Media, Groups)
                            └── Phase 4 (Marketplace, Gigs)
                                    └── Phase 5 (Orders, Reviews, Ranking)
                                            └── Phase 6 (Communities, Stories, Updates)
                                                    └── Phase 7 (Offline, Performance, Security)
                                                            └── Phase 8 (Admin, Polish)
                                                                    └── v1.0
                                                                            └── Phase 9 (Payments)
```

### External Dependencies

| Dependency | Required By | Status |
|------------|-------------|--------|
| Supabase project | Phase 1 | ✅ Provisioned |
| LiveKit Cloud | Phase 3 | ✅ Provisioned |
| Apple Developer Account | Phase 5 | ⬜ Required |
| Google Play Developer Account | Phase 5 | ⬜ Required |
| Expo EAS account | Phase 1 | ⬜ Required |
| Domain + privacy policy hosting | Phase 5 | ⬜ Required |
| Stripe account | Phase 7 | ⬜ Future |
| Push notification certs (APNs/FCM) | Phase 2 | ⬜ Required in Phase 2 |

### Internal Dependencies

| Component | Depends On |
|-----------|------------|
| Chat thread | Auth, profiles, conversations schema |
| Media messages | Storage buckets, messaging |
| Calls | Messaging (conversation context), LiveKit Edge Function |
| Gig inquiry | Messaging, gigs schema |
| Orders | Messaging, gigs, profiles |
| Communities | Group messaging infrastructure |
| Push notifications | Edge Functions, device registration |

---

## 30. Milestones Summary

| Milestone | Phase | Target | Success Signal |
|-----------|-------|--------|----------------|
| M0: Documentation complete | 0 | Done | v1.4.0 docs suite |
| M1: Authenticated app shell | 1 | Week 3-4 | Login, 5 tabs, design system |
| M2: Internal Alpha (chat) | 2 | Week 7-8 | Team chats daily |
| M3: Internal Alpha (comms) | 3 | Week 12-14 | Media, groups, calls |
| M4: Closed Beta (marketplace) | 4 | Week 18-21 | Gigs, Contact Seller, portfolio |
| M5: Closed Beta (transactions) | 5 | Week 24-27 | Orders, reviews, verification |
| M6: Open Beta | 6 | Week 28-32 | Communities, stories, Updates |
| M7: Production hardening | 7 | Week 33-35 | Offline, security, performance |
| M8: v1.0 launch | 8 | Week 36-40 | App Store + Play Store |
| M9: Monetization | 9 | Week 46+ | Stripe payments |

*Timelines are estimates for a small focused team (2-4 engineers + 1 designer). Adjust based on team size.*

---

## 31. Deliverables by Phase (Checklist)

| Phase | Key Deliverables |
|-------|------------------|
| 0 | Full documentation (Parts 1-4B), ONBOARDING, IMPLEMENTATION_PHASES |
| 1 | Monorepo, design system, auth, navigation, CI |
| 2 | Profiles, messaging, realtime, presence, push |
| 3 | Calls, voice notes, media, groups |
| 4 | Marketplace, business, gigs, portfolio |
| 5 | Orders, reviews, verification, ranking |
| 6 | Communities, channels, stories, Updates |
| 7 | Notifications, offline, performance, security |
| 8 | Admin, moderation, analytics, v1.0 launch |
| 9 | Stripe payments, live revenue |

---

## 32. Potential Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Realtime scaling issues at high message volume | High | Medium | Index optimization; pagination; archive strategy documented in architecture |
| Offline sync conflicts | Medium | Medium | Client UUID idempotency; last-write-wins; thorough integration tests |
| LiveKit call quality on poor networks | Medium | Medium | Adaptive bitrate; fallback to voice-only; clear UX for connection issues |
| App Store rejection | High | Low | Follow Apple guidelines; no payment bypass before IAP review if needed |
| RLS policy gaps | Critical | Medium | Mandatory RLS review in PR checklist; integration tests per table |
| Scope creep (WhatsApp feature parity) | High | High | Enforce non-goals in VISION_AND_GOALS.md; phase gates |
| Supabase vendor lock-in | Medium | Low | Standard PostgreSQL; migration path documented for future |
| Small team bandwidth | High | Medium | Strict phase sequencing; MVP cuts listed per phase |
| Premium UX takes longer than expected | Medium | High | Design system first in Phase 1; component reuse enforced |
| Account type confusion (personal vs business) | Medium | Medium | Clear upgrade UX; business badge; no feature lockout for personal chat |
| Stories + messaging storage growth | Medium | Medium | 24h TTL; aggressive media cleanup job |
| Global search complexity | Medium | Medium | Phased rollout by result type; Meilisearch at scale |
| Marketplace trust (fraud, disputes) | Medium | Medium | V1 no dispute system; verification; reviews post-completion only |
| Config complexity (levels, ranking) | Medium | Medium | Dedicated config tables; admin tooling Phase 6+ |
| Scope creep (Fiverr parity) | High | High | Section 16.1 philosophy; phase gates; messaging-first |

---

## 33. Scalability Considerations

### Application Layer

- FlashList for all long lists
- Message pagination (cursor-based, 50 per page)
- Image CDN via Supabase Storage CDN
- Lazy load tabs and heavy screens

### Database Layer

- Composite index on `messages(conversation_id, created_at DESC)`
- Connection pooling via Supabase Supavisor
- Consider table partitioning at 10M+ messages
- Separate search index (Meilisearch) at scale — Phase 7

### Realtime Layer

- One channel per active conversation (subscribe on open, unsubscribe on close)
- Presence channel per user (single)
- Rate limit typing events (debounce 300ms client-side)

### Infrastructure Layer

- EAS for managed builds — no local machine dependency
- Edge Functions stateless — horizontal scale automatic
- LiveKit Cloud handles SFU scaling

Full detail: [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md#scalability-considerations)

---

## 34. Future Improvements

| Area | Improvement | Priority |
|------|-------------|----------|
| Messaging | Message translate (placeholder in UI) | Phase 6 |
| Stories | Music integration | Future |
| Groups | Voice rooms | Phase 7+ |
| Platform | Multi-device sync (tablet, web, desktop) | Phase 7+ |
| Messaging | End-to-end encryption | Evaluate post-PMF |
| Calls | Group video calls | Phase 5 |
| Marketplace | AI gig description generator | Low |
| Marketplace | Dispute resolution workflow | High (with payments) |
| Discovery | Personalized recommendations ML | Medium |
| Platform | iPad-optimized layout | Low |
| Business | Team inboxes, assigned conversations | Medium |
| Business | API for third-party integrations | Low |
| Admin | Web moderation dashboard | Medium |
| Localization | Multi-language support | Medium (post-launch) |
| Search | Trending searches | Phase 5 |

---

## 35. Testing Strategy

### Testing Pyramid

```
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        │   E2E   │  Maestro — critical user journeys
        â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
        │ Integr. │  Hooks, repositories, RLS policies
        â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
        │  Unit   │  Validators, utils, pure functions
        └──â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Per-Phase Testing Requirements

| Phase | Required Tests |
|-------|----------------|
| 1 | Auth validator unit tests; auth hook integration tests |
| 2 | Message repository tests; RLS integration tests; E2E: send message |
| 3 | Media upload tests; E2E: group chat; call token generation tests |
| 4 | Gig CRUD RLS; Contact Seller E2E |
| 5 | Order lifecycle; ranking; verification |
| 6 | Community RLS; stories expiry |
| 7 | Full regression; performance; security audit |
| 8 | Report flow; admin verification; store QA |

### Manual QA Checklist (Every Release)

- [ ] Auth flows on iOS and Android
- [ ] Send/receive message on two physical devices
- [ ] Offline → online sync
- [ ] Push notification delivery
- [ ] Voice/video call between two devices
- [ ] Create gig → inquiry → order flow
- [ ] Accessibility: VoiceOver walkthrough of main tabs
- [ ] Dark mode visual review against DESIGN_SYSTEM.md

### CI Pipeline

```yaml
on: [pull_request, push to main]
jobs:
  - lint (ESLint)
  - typecheck (tsc)
  - test (Jest)
  - # E2E on release branches only (Maestro cloud)
```

---

## 36. Release Strategy

### Versioning

- **Semantic versioning:** `MAJOR.MINOR.PATCH`
- Pre-1.0: `0.x.y` during beta
- v1.0.0 at Phase 8 public launch

### Release Channels

| Channel | Audience | Distribution |
|---------|----------|--------------|
| Development | Engineers | Expo Go / dev client |
| Staging | Internal QA | EAS internal distribution |
| Beta | External testers | TestFlight + Play Internal Testing |
| Production | Public | App Store + Google Play |

### Release Cadence

| Period | Cadence |
|--------|---------|
| Phase 1â€“4 (internal) | Weekly internal builds |
| Phase 5 (beta) | Bi-weekly beta releases |
| Post-v1.0 | Bi-weekly releases; hotfix as needed |

### Over-the-Air (OTA) Updates

- Expo Updates for JS-only changes (no native module changes)
- Native changes require full store build
- OTA disabled for auth-critical changes without review

### Rollback Plan

- Keep previous store version approved and ready
- OTA rollback via Expo Updates channel promotion
- Database migrations must be backward-compatible or have rollback scripts

---

## 37. Deployment Strategy

### Environments

| Environment | Supabase | Mobile | Purpose |
|-------------|----------|--------|---------|
| **Development** | Local CLI / dev project | Expo dev client | Daily engineering |
| **Staging** | Staging project | EAS internal | QA, beta |
| **Production** | Production project | Store builds | Live users |

**Rule:** Never test against production database.

### Environment Variables

| Variable | Dev | Staging | Prod | Client-safe |
|----------|:---:|:-------:|:----:|:-----------:|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ | Yes |
| `EXPO_PUBLIC_LIVEKIT_URL` | ✅ | ✅ | ✅ | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ | **Never** |
| `LIVEKIT_API_SECRET` | ✅ | ✅ | ✅ | **Never** |
| `CRON_SECRET` | ✅ | ✅ | ✅ | **Never** |
| `STRIPE_SECRET_KEY` | — | ✅ | ✅ | **Never** |

Template: `.env.example` at repo root. Secrets in CI/EAS secrets manager only.

### CI/CD Pipeline

```
PR → lint + typecheck + test
Merge to main → staging EAS build + migrate staging + deploy Edge Functions
Tag v* → production EAS build + migrate prod (with backup) + deploy functions
Store submit → manual approval gate
```

**Recommendations:** GitHub Actions, EAS Build, Supabase CLI in CI, branch protection on `main`.

### Backup Strategy

| Asset | Method | Frequency |
|-------|--------|-----------|
| PostgreSQL | Supabase automated backups (Pro) | Daily |
| Storage | Supabase bucket replication | Continuous |
| Migrations | Git version control | Every change |
| Edge Functions | Git version control | Every deploy |

### Recovery Strategy

| Scenario | Action |
|----------|--------|
| Bad migration | Roll forward with fix migration; never edit applied migrations |
| Data corruption | Restore Supabase backup to staging first; validate; then prod |
| Bad app release | Roll back store version; OTA rollback for JS-only |
| Edge Function failure | Redeploy previous git tag |

### Deployment Pipeline (Step-by-Step)

1. Developer opens PR → CI passes
2. Merge to `main` → staging build auto
3. Apply migrations to staging → deploy Edge Functions
4. QA on staging
5. Tag release → production build
6. Backup production DB → apply migrations → deploy functions
7. Submit to stores (if native changes)
8. Publish OTA (if JS-only)
9. Monitor Sentry + Supabase logs for 24h

### Database Migrations

- All migrations in `supabase/migrations/` — version controlled
- Never edit applied migrations — create new migration to fix
- RLS policies in same migration as table creation
- Seed data for staging only

### Edge Function Deployment

```bash
supabase functions deploy generate-livekit-token --project-ref {ref}
supabase functions deploy send-push-notification --project-ref {ref}
```

### Monitoring Post-Deploy

| Signal | Tool | Alert Threshold |
|--------|------|-----------------|
| Crash rate | Sentry | > 1% sessions |
| API errors | Supabase logs | Error rate spike |
| Realtime disconnects | Custom analytics | > 5% of sessions |
| Call failure rate | LiveKit dashboard | > 10% |
| Message delivery latency | Custom metric | p95 > 2s |

---

## 38. Monitoring & Observability

| Signal | Tool | Purpose |
|--------|------|---------|
| **Crash reporting** | Sentry | Crashes, ANRs, native errors |
| **Error tracking** | Sentry | JS exceptions, Edge Function errors |
| **Performance monitoring** | Sentry transactions | Slow screens, API latency |
| **Analytics** | PostHog / Amplitude (Phase 7+) | Product funnels, DAU, retention |
| **Backend logs** | Supabase dashboard | SQL errors, auth failures |
| **Edge Function logs** | Supabase Functions tab | Push failures, search errors |
| **LiveKit metrics** | LiveKit Cloud dashboard | Call quality, connection failures |
| **Uptime** | Health check Edge Function | Synthetic monitoring |

### Alert Thresholds

| Signal | Threshold | Action |
|--------|-----------|--------|
| Crash-free sessions | < 99.5% | P0 investigate |
| API error rate spike | > 2x baseline | Check Supabase logs |
| Realtime disconnect rate | > 5% sessions | Check Realtime config |
| Call failure rate | > 10% | LiveKit + token function review |
| Message delivery p95 | > 2s | Index + Realtime audit |

### Future Observability

- OpenTelemetry for Edge Functions
- Custom dashboards (Grafana + Supabase metrics)
- Real-user monitoring (RUM) for scroll FPS
- Admin analytics dashboard (platform-level, Phase 8+)

---

## 39. Team & Responsibilities (Recommended)

| Role | Responsibilities |
|------|------------------|
| Product Manager | Scope, priorities, phase gates, beta feedback |
| Mobile Engineer(s) | Expo app, offline sync, UI implementation |
| Backend Engineer | Supabase migrations, RLS, Edge Functions |
| Designer | Design system, screen designs, QA visual review |
| DevOps | CI/CD, EAS, environment management, monitoring |

*A solo founder can cover multiple roles but should not skip phase DoD gates.*

---

## 40. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Jun 2026 | React Native + Expo | Mobile velocity, OTA, single codebase |
| Jun 2026 | Supabase backend | Integrated auth/DB/realtime/storage for startup speed |
| Jun 2026 | LiveKit for calls | Already provisioned; WebRTC SFU without self-hosting |
| Jun 2026 | Dark mode default | Premium brand identity per design brief |
| Jun 2026 | No code before docs | Ensure aligned implementation from day one |
| Jun 2026 | 5 bottom tabs: Chats, Marketplace, Updates, Calls, Profile | Part 2 UX spec; Updates consolidates stories/channels |
| Jun 2026 | Two account types: Personal + Business | Business extends personal; no separate app |
| Jun 2026 | Username required; phone optional | Username as primary identity |
| Jun 2026 | Auth: email, Google, Apple — not phone at signup | Effortless auth per Part 2 |
| Jun 2026 | Messaging-first architecture | All features connect to chat |
| Jun 2026 | Config-driven seller levels, gig limits, ranking | Never hardcode; admin-configurable tables |
| Jun 2026 | Order flow V1 via in-chat agreement | Simple hiring; no dispute system at launch |
| Jun 2026 | Verification separate from seller level | Trust badge vs progression tier |
| Jun 2026 | Contact Seller opens chat instantly | Chat is the workspace for all business |
| Jun 2026 | Gig packages: Basic, Standard, Premium | 5-step create flow; not single-price only |
| Jun 2026 | Payments deferred to Phase 9 | Stripe after v1.0 launch |
| Jun 2026 | 8-phase implementation roadmap | Part 4B; see IMPLEMENTATION_PHASES.md |
| Jun 2026 | Admin does not gate user content | Only verification + moderation |
| Jun 2026 | Feature flags for all major features | Toggle payments, AI, desktop, premium |
| Jun 2026 | Every table requires RLS | No exceptions; authorization at data layer |
| Jun 2026 | Configuration tables for all business rules | feature_flags, ranking_weights, seller levels, etc. |
| Jun 2026 | LiveKit media-only; Supabase call metadata | Clear separation of concerns |
| Jun 2026 | 14 storage buckets with documented permissions | Per Part 4A bucket spec |
| Jun 2026 | API catalog + documentation template | Every endpoint documented before build |
| Jun 2026 | Victory Native for analytics charts | Phase 5 business dashboard |

---

## 41. Documentation Consistency Review

**Status:** Complete — June 2026 (v1.4.0)

### Cross-Document Alignment Verified

| Topic | Primary Doc | Consistent With |
|-------|-------------|-----------------|
| Messaging-first | §5, §16.1 | PROJECT_OVERVIEW, VISION_AND_GOALS |
| 5-tab navigation | §10 | UI_UX_GUIDELINES |
| Personal + Business accounts | §3 | PROJECT_OVERVIEW §2 |
| Username required; phone optional | §6–7 | TECH_STACK, §25.6 |
| Contact Seller → chat | §16.18 | UI_UX_GUIDELINES, PROJECT_ARCHITECTURE |
| Config-driven business rules | §16.11–13, §25.13 | PROJECT_ARCHITECTURE, NAMING_CONVENTIONS |
| RLS on all tables | §25.7 | CODING_STANDARDS, PROJECT_ARCHITECTURE |
| 14 storage buckets | §25.8 | PROJECT_ARCHITECTURE |
| 8 implementation phases | §28, IMPLEMENTATION_PHASES.md | Feature Roadmap §27 |
| Admin scope | §26.5 | IMPLEMENTATION_PHASES Phase 8 |
| No code until docs approved | §40 Next Steps | README status |

### Resolved Contradictions

| Item | Resolution |
|------|------------|
| Old 7-phase vs new 8-phase plan | **8-phase plan authoritative** (Part 4B); payments = Phase 9 post-v1.0 |
| Discover/Gigs tabs vs Marketplace/Updates | **Marketplace + Updates** (Part 2 supersedes Part 1) |
| Gig packages in Phase 4 vs Phase 7 | **Packages in Phase 4** create flow; payments Phase 9 |
| Verification timing | Phase 5 submit; admin approve; Phase 8 full admin tools |

### Implementation Order Logic

1. Auth + shell before messaging
2. Messaging before marketplace (Contact Seller depends on chat)
3. Marketplace + gigs before orders/reviews
4. Orders before communities (beta needs core loop)
5. Offline/performance/security before public launch
6. Admin/moderation before v1.0
7. Payments after v1.0 validation

### New Engineer Onboarding Path

1. [ONBOARDING.md](./ONBOARDING.md) — start here
2. PROJECT_OVERVIEW.md → VISION_AND_GOALS.md
3. IMPLEMENTATION_PLAN.md §1–5 (product principles)
4. IMPLEMENTATION_PHASES.md (current build phase)
5. FOLDER_STRUCTURE.md + CODING_STANDARDS.md
6. DESIGN_SYSTEM.md + UI_UX_GUIDELINES.md (when building UI)
7. PROJECT_ARCHITECTURE.md + TECH_STACK.md (when building backend)

---

## 42. Next Steps

**Documentation is complete.** Application code must not begin until explicitly instructed.

When approved to implement:

1. Begin **Phase 1** per [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md)
2. Initialize monorepo per [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)
3. Implement design system and auth
4. Set up CI, Sentry, Supabase migrations

---

## 43. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.4.0 | June 2026 | Part 4B: project structure, state mgmt, admin, 8-phase roadmap, testing/release/deploy/monitoring; docs complete |
| 1.3.0 | June 2026 | Part 4A: technical architecture |
| 1.2.0 | June 2026 | Part 3: marketplace & business ecosystem |
| 1.1.0 | June 2026 | Part 2: UX, accounts, navigation |
| 1.0.0 | June 2026 | Initial documentation suite |

---

*This document is the source of truth for the Nexio project. All work must reference and update it.*
