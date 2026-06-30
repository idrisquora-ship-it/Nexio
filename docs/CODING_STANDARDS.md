# Nexio — Coding Standards

## Purpose

This document defines **code quality standards** for Nexio. All contributors must follow these rules. Pull requests that violate these standards should not merge.

---

## General Principles

1. **Readability over cleverness** — Code is read more than written.
2. **Consistency over personal preference** — Follow existing patterns in the codebase.
3. **Minimal scope** — Change only what the task requires.
4. **Types everywhere** — No `any` without documented exception.
5. **Security by default** — Never trust client input; always enforce RLS server-side.
6. **Premium UX in code** — Loading skeletons, optimistic updates, error recovery are requirements.
7. **Feature-first architecture** — Domain logic lives in `features/`; screens stay thin.
8. **No duplicated code** — Extract shared logic to `packages/shared` or `shared/`.
9. **Self-documenting code** — Meaningful names; small functions; readable files.
10. **No hardcoded business rules** — Use configuration tables (IMPLEMENTATION_PLAN §25.13).

---

## TypeScript

### Configuration

- `strict: true` in all tsconfig files
- No implicit any
- Prefer `interface` for object shapes; `type` for unions and utilities

### Rules

```typescript
// ✅ Good — explicit return type on exported functions
export function formatMessageTime(date: Date): string { ... }

// ❌ Bad — any
function handleData(data: any) { ... }

// ✅ Good — Zod for runtime validation at boundaries
const result = SendMessageSchema.safeParse(input);

// ✅ Good — discriminated unions for message types
type Message =
  | { type: 'text'; content: string }
  | { type: 'image'; url: string; width: number; height: number };
```

### Null Handling

- Prefer explicit `| null` over optional chaining abuse
- Use early returns for guard clauses
- Avoid non-null assertion (`!`) except in tests or after validated parse

---

## React / React Native

### Components

- **Functional components only** — no class components
- One component per file (except tiny co-located sub-components)
- Props interface named `{ComponentName}Props`
- Default exports for screen components; named exports for shared components

```typescript
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onLongPress?: () => void;
}

export function MessageBubble({ message, isOwn, onLongPress }: MessageBubbleProps) {
  // ...
}
```

### Hooks

- Custom hooks start with `use`
- Data fetching hooks wrap TanStack Query
- No business logic in presentation components — extract to hooks

### State Management

| State Type | Tool |
|------------|------|
| Server/async data | TanStack Query |
| Global UI (auth session, theme) | Zustand or React Context (minimal) |
| Form state | React Hook Form |
| Local UI (modal open, input draft) | `useState` |

**Avoid:** Redux, excessive Context, prop drilling beyond 2 levels (use composition or hooks).

### Performance

- `FlashList` (Shopify) for long message lists — not `FlatList` for chat
- Memoize expensive list items with `React.memo` when profiled
- `useCallback` / `useMemo` only when measured or required for referential stability
- Images via `expo-image` with cache policy and placeholders

### Styling

- Use design tokens from `theme/` — **no magic numbers or hex in feature code**
- StyleSheet.create or styled system — pick one pattern per codebase and stay consistent
- Support safe area insets on all screens

---

## File Organization

- Max ~300 lines per file; split when larger
- Colocate tests: `MessageBubble.test.tsx` next to `MessageBubble.tsx`
- Barrel exports (`index.ts`) only at feature boundaries — avoid deep re-export chains

---

## API & Data Layer

### Supabase Client

- Single initialized client in `infrastructure/supabase.ts`
- All queries through repository/service functions — not raw client in components
- Always handle `{ data, error }` — never ignore error

```typescript
// ✅ Good
const { data, error } = await supabase.from('messages').insert(payload);
if (error) throw new DatabaseError(error.message);

// ❌ Bad — in component
supabase.from('messages').insert(payload).then(...)
```

### RLS

- Every new table must have RLS policies in the same migration
- Test policies with multiple user contexts in integration tests

### Idempotency

- Client-generated UUIDs for messages to prevent duplicates on retry
- Upsert with conflict targets where appropriate

---

## Error Handling

### Client

- User-facing errors: friendly copy + recovery action
- Log to Sentry for unexpected errors
- Never show raw API error strings to users

### Edge Functions

- Return structured JSON errors with appropriate HTTP status
- Log server-side; never leak stack traces to client in production

```typescript
return new Response(JSON.stringify({ error: 'Unauthorized' }), {
  status: 401,
  headers: { 'Content-Type': 'application/json' },
});
```

---

## Security Rules

| Rule | Detail |
|------|--------|
| No secrets in client | Service role, LiveKit secret, Stripe secret — server only |
| Validate all inputs | Zod on client AND Edge Functions |
| Sanitize user content | Escape where rendered as HTML (if ever) |
| Signed URLs | Time-limited for private media |
| Auth check first | Every Edge Function verifies JWT before logic |

---

## Testing Standards

### Required Tests

| Area | Minimum Coverage |
|------|------------------|
| Validators (Zod) | 100% |
| Pure utils | 80%+ |
| Critical hooks (send message, auth) | Integration tests |
| RLS policies | Integration tests per table |

### Test Style

- Arrange-Act-Assert pattern
- Descriptive test names: `it('queues message locally when offline')`
- Mock Supabase at repository boundary, not in every component test

---

## Git & Pull Requests

### Commits

- Conventional commits preferred: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- One logical change per commit when possible
- Reference phase/task from IMPLEMENTATION_PLAN when applicable

### Pull Request Checklist

- [ ] Types pass (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] No design token violations (no raw hex in feature code)
- [ ] Loading and error states implemented
- [ ] Accessibility labels on new interactive elements
- [ ] IMPLEMENTATION_PLAN.md updated if scope/phase changed
- [ ] RLS policies included for new tables
- [ ] Indexes documented in migration comments
- [ ] Zod validators in `packages/shared` for new inputs
- [ ] API documented in `docs/api/` if new endpoint (§25.16)
- [ ] No hardcoded business rules — use configuration tables

---

## Documentation in Code

- **Don't** comment obvious code
- **Do** comment non-obvious business rules, sync edge cases, RLS rationale in migrations
- **Do** JSDoc on exported utilities and complex hooks

---

## Dependencies

- New dependencies require justification in PR description
- Prefer well-maintained packages with active communities
- No dependency for a one-liner utility
- Run `pnpm audit` in CI

---

## Accessibility in Code

```typescript
// ✅ Good
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Send message"
  accessibilityHint="Sends your message to the conversation"
>
```

- All touch targets minimum 44×44
- Test with VoiceOver / TalkBack before shipping major screens

---

## Anti-Patterns (Do Not)

| Anti-Pattern | Why |
|--------------|-----|
| Fetch in `useEffect` without Query | No cache, no retry, no loading state |
| Giant "God components" | Untestable, unreadable |
| Copy-paste validators | Use shared Zod schemas |
| `console.log` in production | Use structured logger / Sentry |
| Ignoring offline state | Core product requirement |
| Spinner in list loading | Use skeletons per design system |
| Feature flags without cleanup plan | Tech debt |

---

## Related Documents

- [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md) — Naming rules
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — UI tokens
- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) — Where code lives
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — Phase DoD includes code quality gates

---

*Last updated: June 2026*
