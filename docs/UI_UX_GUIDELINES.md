# Nexio — UI/UX Guidelines

## Purpose

This document translates design philosophy into **actionable UX patterns**. It defines navigation, screen structure, common flows, and interaction rules for mobile engineering and design.

---

## Navigation Architecture

### Bottom Tab Bar (5 Destinations)

The bottom navigation contains **exactly five** primary destinations. No more.

| Tab | Icon (Lucide) | Purpose |
|-----|---------------|---------|
| **Chats** | `MessageCircle` | Home — conversations, stories row (default landing) |
| **Marketplace** | `Store` | Browse gigs, orders; seller dashboard (business) |
| **Updates** | `Rss` | Stories, channels, announcements, business posts |
| **Calls** | `Phone` | Recent calls, missed calls, call back |
| **Profile** | `User` | Identity, settings, become business |

**Rules:**

- Active tab uses primary brand color; inactive uses soft gray
- Labels recommended for accessibility
- Badge counts on Chats and Marketplace (orders/inquiries) only
- Deep links land on the correct tab + stack
- **Chats is always the default landing tab**

### Secondary Navigation

Everything else is accessed contextually:

| Access Pattern | Examples |
|----------------|----------|
| Push (stack) | Chat thread, gig detail, user profile, settings sub-pages |
| Bottom sheet | Message actions, filters, media picker, share |
| Modal (rare) | Full-screen media viewer, camera, global search |
| Search | Global search from Chats header; scoped search on Marketplace |

### Back Navigation

- iOS: swipe-from-edge + back chevron in header
- Android: system back + optional toolbar back
- Bottom sheets: swipe down to dismiss

---

## Screen Anatomy

### Standard Screen Template

```
┌─────────────────────────────┐
│  Header (large title or compact) │
│  Optional: search, action icon   │
├─────────────────────────────┤
│                             │
│  Content area               │
│  (list, cards, or thread)   │
│                             │
│                             │
├─────────────────────────────┤
│  Optional: input bar / CTA  │
├─────────────────────────────┤
│  Bottom tab bar             │
└─────────────────────────────┘
```

### Header Variants

| Variant | Use Case |
|---------|----------|
| **Large title** | Top-level tabs (Chats, Discover) |
| **Compact** | Detail screens (chat, gig, profile) |
| **Transparent** | Media-heavy screens (image viewer) |
| **Hidden** | Immersive chat (header collapses on scroll) |

### One Primary Action Rule

Each screen exposes **one** filled primary button maximum in the visible viewport. Examples:

- Gig detail → "Send Inquiry"
- Empty conversations → "Start Chat"
- Create gig flow → "Publish" (final step only)

---

## Core Screen Specifications

### Conversations List (Chats Tab)

**Purpose:** See all conversations and open one.

**Elements:**

- Search bar (collapsible or pinned below title)
- Pinned conversations section (optional, phase 2)
- Conversation rows: avatar, name, preview, timestamp, unread badge
- Floating action or header action: new chat
- Pull to refresh
- Skeleton rows on load

**Row interaction:**

- Tap → open thread
- Long press → bottom sheet (pin, mute, archive, delete)

**Empty state:** Illustration + "Start chatting with someone" + CTA

---

### Chat Thread

**Purpose:** Read and send messages.

**Elements:**

- Compact header: avatar, name, status/subtitle, call + menu icons
- Message list (inverted scroll)
- Date dividers (subtle)
- Input bar: attachment, text field, send/voice
- Typing indicator above input
- Reply banner when replying to specific message

**Message types:**

- Text
- Image / video (rounded, tap to expand)
- Voice note (inline player)
- File (icon + name + size)
- System messages (order updates, member joined — centered, muted)
- Gig card (embedded listing preview)
- Order card (status, actions)

**Interactions:**

- Long press message → bottom sheet (reply, react, copy, forward, delete)
- Swipe reply (optional gesture)
- Double-tap react (heart default, phase 2)
- Tap avatar → profile

---

### Marketplace Tab

**Purpose:** Discover professionals (buyers) or manage business (sellers). See IMPLEMENTATION_PLAN.md Section 16.

**Buyer structure:**

- Large title "Marketplace" + search bar + filter button
- Horizontal category chips
- Curated sections (max 6–8 items + "See All"): Featured Businesses, Trending Services, Top Rated, etc.
- Premium gig cards: large image, rounded corners, minimal metadata

**Seller structure:**

- Dashboard card at top (metrics + quick actions)
- Create gig FAB
- Vacation mode banner when active

**Filter UX:** Bottom sheet — never full-screen filters.

---

### Business Profile

**Purpose:** Premium storefront for business accounts.

- Cover image + overlapping logo avatar
- Business name, @username, verification badge, seller level badge
- Stats row: followers, response time, member since
- Primary actions: **Contact** (filled), Follow, Share
- Card sections: Portfolio, Services (gigs), Reviews, Business updates
- QR share via bottom sheet

---

### Seller Dashboard

**Purpose:** Business command center — modern, not spreadsheet-like.

- Metric cards grid: visitors, orders, messages, revenue (placeholder)
- Recent orders + recent reviews lists
- Quick actions row: Create Gig, Portfolio, Verification, Analytics
- Tap metric → analytics detail (Phase 5)

---

### Create Gig Flow

**Purpose:** 5-step wizard — one step per screen or bottom sheet step.

1. Basic info (title, category, tags)
2. Pricing (Basic / Standard / Premium packages)
3. Media (cover, gallery, video optional)
4. FAQ + buyer requirements
5. Preview → Publish

Progress indicator at top. Save draft anytime.

---

### Gig Detail

**Purpose:** Understand a service and contact seller immediately.

**Elements:**

- Hero cover image
- Business card (logo, name, verification, seller level)
- Title, from-price, rating, completed orders
- Description (collapsible), package cards, FAQ accordion
- Reviews + related services (max 6)
- Sticky bottom: **Contact Seller** (primary); Order placeholder

**Contact flow:** Instantly opens chat with gig context card — no separate inquiry form.

---

### Profile (Self and Others)

**Purpose:** Identity, trust, and entry to gigs/communities.

**Sections:**

- Avatar, name, username, bio
- Verification badge (future)
- Stats: reviews, orders, response time (professional)
- Tabs or sections: Gigs, About, Reviews
- Action button: Message / Follow / Edit Profile (contextual)

---

### Gigs Tab

**Purpose:** Seller dashboard-lite / buyer order tracking.

**Seller view:**

- My listings
- Active orders
- Create gig FAB or header action

**Buyer view:**

- Active orders
- Saved gigs
- Order history

Adaptive: show seller tools only if user has published gigs.

---

## Bottom Sheet Patterns

### Standard Sheet Anatomy

```
┌─────────────────────────────┐
│        drag handle            │
│  Title                        │
│  ─────────────────────────    │
│  Action rows or form          │
│  ─────────────────────────    │
│  [ Primary CTA ]              │
└─────────────────────────────┘
```

### Sheet Types

| Type | Height | Example |
|------|--------|---------|
| **Quick actions** | 30–40% | Message long-press menu |
| **Form** | 50–70% | Report user, filter gigs |
| **Full choices** | 90% | Media picker |

**Animation:** Spring up, fade backdrop, swipe to dismiss.

---

## Forms & Input UX

- One question per step for complex flows (onboarding, create gig)
- Large text fields with comfortable padding
- Inline validation after blur, not on every keystroke
- Clear error messages below field in error color
- Keyboard-aware scroll — focused field never hidden

---

## Onboarding Flow (First Launch)

```
Splash → Welcome (value prop) → Sign up / Log in →
Verify email/phone → Create profile (name, avatar) →
Optional: "Are you here to hire or sell?" → Chats tab (empty state)
```

**Rules:**

- Skip option on optional steps
- No feature tour carousel — learn by doing
- Progressive professional setup prompts later (not blocking)

---

## Key User Flows

### Flow: Send First Message

```
Chats → New chat → Search user → Select → Thread → Type → Send
```

Optimistic: message appears immediately; retry on failure.

### Flow: Publish a Gig

```
Gigs → Create → Title → Category → Description → Price → Images → Review → Publish
```

Use stepped bottom sheet or full-screen steps — not one long form.

### Flow: Hire via Gig

```
Marketplace → Gig detail → Contact Seller → Thread (gig card) →
Discuss requirements → Seller sends Agreement → Buyer accepts →
In Progress → Delivered → Completed → Review
```

### Flow: Start a Call

```
Thread → Call icon → Choose voice/video → Call UI → End → Return to thread
```

### Flow: Join Community

```
Discover → Community card → Preview → Join → Community chat
```

---

## Gestures

| Gesture | Context | Action |
|---------|---------|--------|
| Pull down | Lists | Refresh |
| Swipe left (careful) | Conversation row | Archive / mute (configurable) |
| Long press | Message, row | Context menu sheet |
| Swipe down | Bottom sheet | Dismiss |
| Pinch | Image viewer | Zoom |

Avoid hidden gestures without alternative tap paths.

---

## Notifications UX

### Push Categories

- New message
- Mention (community)
- Order update
- Inquiry received
- Call missed

### In-App

- Banner for foreground messages (subtle, tappable)
- Notification center accessible from profile or header bell (phase 2)

### Preferences

Granular: per-conversation mute, global category toggles.

---

## Error & Edge States

| State | UX |
|-------|-----|
| No network | Banner: "You're offline — messages will send when connected" |
| Send failed | Message with retry icon + tap to retry |
| Load failed | Full-screen friendly error + retry button |
| Permission denied | Explain why + link to settings |
| Blocked user | Clear message in thread; no send |

---

## Accessibility Checklist (Per Screen)

- [ ] All icons have accessibility labels
- [ ] Touch targets ≥ 44pt
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader order matches visual order
- [ ] Dynamic type doesn't break layouts (test at largest size)
- [ ] Reduced motion: disable non-essential animations

---

## Platform Notes

### iOS

- SF Pro Display when available
- Safe area respected
- Native haptics on send, success, error
- Large navigation titles where appropriate

### Android

- Inter font fallback
- Edge-to-edge with proper insets
- Material ripple **not** used — use Nexio press states instead

---

## Related Documents

- [DESIGN_PHILOSOPHY.md](./DESIGN_PHILOSOPHY.md) — Principles and anti-patterns
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — Visual tokens and components
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — Feature domains

---

*Last updated: June 2026*
