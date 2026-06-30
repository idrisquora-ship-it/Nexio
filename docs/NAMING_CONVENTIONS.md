# Nexio — Naming Conventions

## Purpose

Consistent naming across files, code, database, API, and UI reduces cognitive load and enables predictable search/navigation. All Nexio code must follow these conventions.

---

## General Rules

- Use **English** for all identifiers
- Be **descriptive** — prefer `conversationId` over `cid`
- Avoid abbreviations except widely known: `id`, `url`, `api`, `ui`, `otp`
- No Hungarian notation: not `strName`, not `IUser`
- Boolean variables prefixed with `is`, `has`, `can`, `should`: `isLoading`, `hasUnread`, `canEdit`

---

## Files & Directories

| Item | Convention | Example |
|------|------------|---------|
| Directories | kebab-case | `message-input/` |
| React components | PascalCase.tsx | `MessageBubble.tsx` |
| Hooks | camelCase.ts | `useMessages.ts` |
| Services / utils | camelCase.ts | `messageRepository.ts` |
| Types | camelCase or `types.ts` | `types.ts`, `messageTypes.ts` |
| Tests | same name + `.test.ts(x)` | `MessageBubble.test.tsx` |
| Expo routes | Expo Router conventions | `[id].tsx`, `(tabs)/` |
| SQL migrations | `{5-digit}_{snake_description}.sql` | `00002_messaging.sql` |
| Edge Functions | kebab-case folder | `generate-livekit-token/` |

---

## TypeScript Code

### Variables & Functions

```typescript
// camelCase
const conversationId = '...';
function sendMessage() { ... }
async function fetchConversations() { ... }
```

### Constants

```typescript
// SCREAMING_SNAKE_CASE for true constants
const MAX_MESSAGE_LENGTH = 5000;
const DEFAULT_PAGE_SIZE = 50;

// Design tokens: dot notation in object keys
const colors = {
  'background.primary': '#0A0A0B',
  'brand.primary': '#FA2D48',
};
```

### Types & Interfaces

```typescript
// PascalCase — no I/T prefix
interface UserProfile { ... }
type MessageStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'read';

// Props
interface ConversationRowProps { ... }

// Enums — PascalCase name, PascalCase members (prefer union types over enum)
type OrderStatus = 'pending' | 'active' | 'delivered' | 'completed' | 'cancelled';
```

### React Components

```typescript
// PascalCase function name matches filename
export function MessageInput() { ... }

// Event handlers: handle + Event
const handleSendPress = () => { ... };
const handleMessageLongPress = (id: string) => { ... };
```

### Hooks

```typescript
// use + PascalCase concept
useMessages(conversationId)
useAuthSession()
useNetworkStatus()
```

---

## Database (PostgreSQL / Supabase)

### Tables

- **snake_case**, plural nouns
- Junction tables: `{table_a}_{table_b}` or descriptive compound

| Table | Name |
|-------|------|
| User profiles | `profiles` |
| Conversations | `conversations` |
| Conversation members | `conversation_participants` |
| Messages | `messages` |
| Gigs | `gigs` |
| Gig packages | `gig_packages` |
| Orders | `orders` |
| Portfolio items | `portfolio_items` |
| Business profiles | `business_profiles` |
| Business posts | `business_posts` |
| Favorites | `favorites` |
| Seller metrics | `seller_metrics` |
| Verification submissions | `verification_submissions` |
| Marketplace config | `marketplace_config` |
| Seller level definitions | `seller_level_definitions` |
| Seller level requirements | `seller_level_requirements` |
| Ranking weights | `ranking_weights` |
| Business follows | `business_follows` |
| Feature flags | `feature_flags` |
| Audit logs | `audit_logs` |
| Reports | `reports` |
| Announcements | `announcements` |
| Communities | `communities` |

### Columns

- **snake_case**
- Foreign keys: `{referenced_table_singular}_id` → `user_id`, `conversation_id`, `gig_id`
- Timestamps: `created_at`, `updated_at` (always UTC)
- Soft delete: `deleted_at` (nullable)
- Booleans: `is_` prefix → `is_verified`, `is_published`

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id),
  sender_id uuid not null references profiles(id),
  content text,
  message_type text not null default 'text',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Indexes

```text
idx_{table}_{columns}
```

Example: `idx_messages_conversation_id_created_at`

### RLS Policies

```text
{table}_{action}_{description}
```

Examples:

- `messages_select_participant`
- `gigs_update_own`
- `profiles_select_public`

### Enums (Postgres)

- snake_case type name: `order_status`
- snake_case values: `pending`, `in_progress`, `completed`

---

## Supabase Storage

### Buckets

- kebab-case, plural: `avatars`, `message-media`, `gig-media`

### Object Paths

```text
{bucket}/{user_id}/{resource_id}/{filename}
```

Example: `message-media/uuid-conv/uuid-msg/photo.jpg`

---

## Realtime Channels

```text
{scope}:{id}
```

| Channel | Pattern |
|---------|---------|
| Conversation | `conversation:{conversation_id}` |
| User presence | `presence:user:{user_id}` |
| Order | `order:{order_id}` |

### Event Names

- snake_case: `new_message`, `message_updated`, `typing_start`, `typing_stop`

---

## Edge Functions

| Item | Convention |
|------|------------|
| Folder name | kebab-case verb-noun: `generate-livekit-token` |
| HTTP routes | `/functions/v1/{function-name}` |
| Request body fields | camelCase in JSON (TypeScript convention) |
| Response fields | camelCase |

---

## API Response Shapes

Prefer consistent envelope where helpful:

```typescript
// Success — return data directly or wrapped
{ data: T }

// Error
{ error: { code: string; message: string } }
```

Error codes: SCREAMING_SNAKE_CASE string

```typescript
'UNAUTHORIZED'
'CONVERSATION_NOT_FOUND'
'MESSAGE_TOO_LONG'
```

---

## Environment Variables

```text
EXPO_PUBLIC_{SERVICE}_{KEY}     # Client-safe
{SERVICE}_{KEY}                 # Server-only
```

Examples:

- `EXPO_PUBLIC_SUPABASE_URL`
- `LIVEKIT_API_SECRET`

---

## Git Branches

```text
{type}/{short-description}
```

| Type | Use |
|------|-----|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation |
| `refactor/` | Code restructure |
| `chore/` | Tooling, deps |

Example: `feat/phase-1-auth-screens`

---

## Git Tags / Releases

```text
v{major}.{minor}.{patch}
```

Pre-release: `v0.1.0-alpha.1`, `v0.1.0-beta.1`

Align with IMPLEMENTATION_PLAN.md milestones.

---

## UI Copy (User-Facing Text)

- **Sentence case** for labels and buttons: "Send inquiry", not "Send Inquiry"
- **Title case** for screen titles only: "Edit Profile"
- Friendly, concise — no "Error 500" or "No Data"
- Product name always **Nexio** (capital N, rest lowercase)

---

## Feature Flags (Future)

```text
ff_{snake_case_description}
```

Example: `ff_group_video_calls`

---

## Analytics Events

```text
{domain}_{action}
```

snake_case, past tense for completed actions:

- `message_sent`
- `gig_published`
- `order_completed`
- `call_started`

---

## Related Documents

- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) — File layout
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) — Code quality
- [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) — Database domains

---

*Last updated: June 2026*
