# Nexio — Design System

## Purpose

This document defines the **visual design tokens** and **component specifications** for Nexio. All UI implementation must reference these tokens — no hardcoded one-off values in application code.

---

## Color Palette

### Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `background.primary` | `#0A0A0B` | App root background — almost black |
| `background.secondary` | `#141416` | Slightly elevated areas |
| `background.tertiary` | `#1C1C1F` | Input fields, recessed areas |

### Surfaces (Cards)

| Token | Hex | Usage |
|-------|-----|-------|
| `surface.card` | `#1A1A1D` | Default card background |
| `surface.cardHover` | `#222226` | Pressed/hovered card state |
| `surface.sheet` | `#1E1E22` | Bottom sheet background |
| `surface.modal` | `#161618` | Modal overlay content |

### Brand

| Token | Hex | Usage |
|-------|-----|-------|
| `brand.primary` | `#FA2D48` | Primary actions, active tab, links — Apple Music inspired red |
| `brand.primaryMuted` | `#FA2D4820` | Tinted backgrounds, selected chips |
| `brand.accent` | `#FF6B8A` | Soft pink-red accent, highlights |

**Rule:** Never use bright blue (`#007AFF` or similar) as primary branding.

### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `semantic.success` | `#34C759` | Success states, online indicator |
| `semantic.warning` | `#FF9F0A` | Warnings, pending states |
| `semantic.error` | `#FF453A` | Errors, destructive actions |
| `semantic.info` | `#8E8E93` | Neutral informational (not blue-primary) |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `text.primary` | `#FFFFFF` | Headings, body, primary content |
| `text.secondary` | `#8E8E93` | Subtitles, metadata, captions |
| `text.tertiary` | `#636366` | Placeholders, disabled text |
| `text.inverse` | `#0A0A0B` | Text on filled primary buttons |
| `text.link` | `#FA2D48` | Tappable links |

### Borders & Dividers

| Token | Hex | Usage |
|-------|-----|-------|
| `border.subtle` | `#FFFFFF10` | Hairline dividers |
| `border.default` | `#FFFFFF18` | Input borders, card outlines |
| `border.focus` | `#FA2D48` | Focused input ring |

### Overlays

| Token | Value | Usage |
|-------|-------|-------|
| `overlay.scrim` | `#00000080` | Modal/sheet backdrop |
| `overlay.light` | `#FFFFFF08` | Subtle hover on dark |

---

## Typography

### Font Family

```text
Primary:  SF Pro Display, -apple-system, system-ui
Fallback: Inter, sans-serif
```

**Rule:** One font family across the entire application.

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `type.largeTitle` | 34px | 700 | 41px | Hero titles, welcome screens |
| `type.title1` | 28px | 700 | 34px | Page titles |
| `type.title2` | 22px | 600 | 28px | Section headers |
| `type.title3` | 20px | 600 | 25px | Card titles |
| `type.headline` | 17px | 600 | 22px | List row primary text |
| `type.body` | 17px | 400 | 22px | Body copy |
| `type.callout` | 16px | 400 | 21px | Secondary body |
| `type.subheadline` | 15px | 400 | 20px | Subtitles |
| `type.footnote` | 13px | 400 | 18px | Metadata, timestamps |
| `type.caption` | 12px | 400 | 16px | Badges, tiny labels |

### Letter Spacing

- Large titles: `-0.5px`
- Body and below: `0`
- All caps labels: `+0.5px` (use sparingly)

---

## Spacing System

**Base unit: 8pt.** All spacing must be multiples of 4 or 8.

| Token | Value | Usage |
|-------|-------|-------|
| `space.xxs` | 4px | Tight inline gaps |
| `space.xs` | 8px | Icon-to-text, chip padding |
| `space.sm` | 12px | Compact list padding |
| `space.md` | 16px | Standard screen horizontal padding |
| `space.lg` | 24px | Section gaps |
| `space.xl` | 32px | Large section separation |
| `space.xxl` | 48px | Hero spacing |
| `space.xxxl` | 64px | Onboarding vertical rhythm |

### Screen Padding

- Horizontal: `16px` (`space.md`) default; `20px` on large phones optional
- Bottom (above tab bar): safe area + `8px`

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius.sm` | 8px | Chips, small buttons |
| `radius.md` | 12px | Inputs, small cards |
| `radius.lg` | 16px | Standard cards |
| `radius.xl` | 20px | Large cards, message bubbles |
| `radius.xxl` | 24px | Bottom sheet top corners |
| `radius.full` | 9999px | Avatars, pills, FABs |

**Rule:** Images, buttons, cards, bottom sheets, and dialogs are all rounded — no sharp rectangles.

---

## Shadows & Elevation

Dark UI uses subtle luminance, not heavy shadows.

| Token | Value | Usage |
|-------|-------|-------|
| `shadow.sm` | `0 1px 3px rgba(0,0,0,0.4)` | Subtle card lift |
| `shadow.md` | `0 4px 12px rgba(0,0,0,0.5)` | Floating buttons, dropdowns |
| `shadow.lg` | `0 8px 24px rgba(0,0,0,0.6)` | Bottom sheets, modals |
| `shadow.glow` | `0 0 20px rgba(250,45,72,0.15)` | Primary FAB optional glow |

Optional subtle card gradient:

```text
linear-gradient(180deg, #1E1E22 0%, #1A1A1D 100%)
```

---

## Iconography

- **Library:** Lucide Icons
- **Style:** Outline only
- **Stroke width:** 1.5px (consistent)
- **Sizes:** 16px (inline), 20px (list), 24px (tab bar), 28px (header actions)

| Context | Color |
|---------|-------|
| Active / primary | `brand.primary` |
| Default | `text.secondary` |
| Destructive | `semantic.error` |
| On primary button | `text.inverse` |

---

## Components

### Buttons

#### Primary (Filled)

- Background: `brand.primary`
- Text: `text.inverse`
- Height: 52px
- Padding horizontal: `24px`
- Radius: `radius.lg`
- Press: scale 0.97 + darken background

#### Secondary (Outlined)

- Border: `border.default`
- Text: `text.primary`
- Background: transparent
- Same dimensions as primary

#### Tonal

- Background: `brand.primaryMuted`
- Text: `brand.primary`

#### Danger

- Background: `semantic.error`
- Text: `text.primary`

#### Ghost / Text

- No background; text `brand.primary` or `text.secondary`

**Rule:** One primary button per viewport visible area.

---

### Text Fields

- Height: 52px minimum
- Background: `background.tertiary`
- Border: `border.default` (1px); focus → `border.focus`
- Radius: `radius.md`
- Padding: `16px` horizontal
- Placeholder: `text.tertiary`
- Input text: `text.primary` at `type.body`

---

### Cards

- Background: `surface.card`
- Radius: `radius.lg`
- Padding: `16px`
- Shadow: `shadow.sm` optional
- Press state: `surface.cardHover`

---

### Conversation Row

- Height: ~72px
- Avatar: 52px, `radius.full`
- Gap avatar-to-content: `12px`
- Primary text: `type.headline`
- Preview: `type.subheadline`, `text.secondary`, 1 line truncate
- Timestamp: `type.footnote`, `text.tertiary`
- Unread badge: `brand.primary` circle, min 20px

---

### Message Bubbles

| Variant | Background | Alignment |
|---------|------------|-----------|
| Sent | `brand.primary` | Right |
| Received | `surface.card` | Left |
| System | transparent | Center |

- Radius: `radius.xl` with one corner smaller (tail effect optional phase 2)
- Max width: 78% of screen
- Padding: `12px` horizontal, `8px` vertical
- Text: `type.body`; sent text may be `text.primary` on red

---

### Bottom Sheet

- Background: `surface.sheet`
- Top radius: `radius.xxl`
- Drag handle: 36×4px, `text.tertiary`, centered, top `8px`
- Backdrop: `overlay.scrim`

---

### Tab Bar

- Background: `background.primary` with top `border.subtle`
- Height: 49px + safe area
- Icon: 24px; active `brand.primary`, inactive `text.tertiary`
- Label: `type.caption` optional

---

### Avatar

| Size | Dimension | Usage |
|------|-----------|-------|
| xs | 24px | Inline mentions |
| sm | 36px | Compact lists |
| md | 52px | Conversation rows |
| lg | 80px | Profile header |
| xl | 120px | Profile edit |

Fallback: initials on `background.tertiary` background.

---

### Badges & Chips

- Chip height: 32px
- Padding: `8px 12px`
- Radius: `radius.full`
- Selected: `brand.primaryMuted` bg + `brand.primary` text
- Unselected: `background.tertiary` + `text.secondary`

---

### Skeleton Loaders

- Background: `background.tertiary`
- Shimmer: animate `background.secondary` → `background.tertiary` (1.2s loop)
- Match final content geometry (rows, cards, bubbles)

---

## Motion Tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `motion.fast` | 150ms | ease-out | Button press, toggles |
| `motion.normal` | 250ms | ease-in-out | Sheet open, tab switch |
| `motion.slow` | 350ms | spring | Page transitions |
| `motion.stagger` | 50ms | — | List item entrance delay |

**Rules:**

- Subtle, fast, natural
- Respect reduced motion OS setting
- Do not animate everything

---

## Z-Index Scale

| Layer | Value |
|-------|-------|
| Base content | 0 |
| Sticky header | 10 |
| FAB | 20 |
| Bottom sheet | 30 |
| Modal | 40 |
| Toast / banner | 50 |

---

## Implementation Notes

- Tokens will be implemented as a shared theme module (see FOLDER_STRUCTURE.md)
- No raw hex values in feature code — always reference tokens
- Design system version bumps require changelog entry in IMPLEMENTATION_PLAN.md

---

## Related Documents

- [DESIGN_PHILOSOPHY.md](./DESIGN_PHILOSOPHY.md) — Principles
- [UI_UX_GUIDELINES.md](./UI_UX_GUIDELINES.md) — Patterns and flows
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) — How to consume tokens in code

---

*Last updated: June 2026*
