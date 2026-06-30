# Supabase Edge Function Secrets

Add these in **Supabase Dashboard → Project Settings → Edge Functions → Secrets**.

| Secret | Used by | Value source |
|--------|---------|--------------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | `on-message-created` | Full JSON from `nexio-*-firebase-adminsdk-*.json` (one line) |
| `LIVEKIT_API_KEY` | `generate-livekit-token` | Root `.env` → `LIVEKIT_API_KEY` |
| `LIVEKIT_API_SECRET` | `generate-livekit-token` | Root `.env` → `LIVEKIT_API_SECRET` |
| `LIVEKIT_URL` | `generate-livekit-token` | Root `.env` → `LIVEKIT_URL` |
| `CRON_SECRET` | `evaluate-seller-levels`, `expire-stories` | Random secure string (e.g. `openssl rand -hex 32`) — **not** a function name |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## Cron jobs (scheduled HTTP)

Both cron functions expect:

```http
POST https://<project-ref>.supabase.co/functions/v1/<function-name>
Authorization: Bearer <your-CRON_SECRET-value>
```

| Function | Schedule suggestion | Purpose |
|----------|---------------------|---------|
| `evaluate-seller-levels` | Daily | Recompute seller levels |
| `expire-stories` | Hourly | Delete stories past 24h |

**Common mistake:** `evaluate-seller-levels` is the **URL path** (function slug), not the secret value. The secret name must be `CRON_SECRET` (uppercase) and the value must be your own random token.

## Push notifications (automated)

Push handlers write to `notification_log` and respect `notification_preferences` per category.

A database trigger (`on_message_created_push`) calls `on-message-created` via **pg_net** on every message insert. No manual webhook needed once `FIREBASE_SERVICE_ACCOUNT_JSON` is set.

## Deployed edge functions

| Function | JWT | Purpose |
|----------|-----|---------|
| `on-message-created` | Off | FCM push + in-app log on new message |
| `on-notification-dispatch` | Off | Orders, reviews, verification, stories, followers, community, marketplace, mentions |
| `on-call-created` | Off | FCM push + in-app log on incoming call |
| `on-business-post-created` | Off | FCM push + in-app log to business followers |
| `generate-livekit-token` | On | LiveKit room token + call session |
| `search-gigs` | On | Ranked marketplace search |
| `search-global` | On | Multi-domain search |
| `evaluate-seller-levels` | Off (cron secret) | Seller level progression |
| `expire-stories` | Off (cron secret) | Story TTL cleanup |
| `create-payment-intent` | On | Payment shell — returns 503 until `ff_payments_enabled` and Stripe are configured |
| `stripe-webhook` | Off | Stripe event shell — configure `STRIPE_WEBHOOK_SECRET` when payments go live |
| `on-notification-dispatch` | Off | Orders, reviews, verification, stories, followers, community, marketplace, mentions, **reports** |

## Migrations applied

1. `phase1_profiles`
2. `phase2_messaging_push`
3. `phase2_completion` — push trigger + security hardening
4. `phase3_calls_media_groups` — calls, groups, media buckets, reactions
5. `phase6_updates_social` — stories, communities, channels, business posts/follows
6. `phase6_completion` — community groups, business post push
7. `phase6_remaining` — channel post reactions
8. `phase7_notifications_offline` — notification_log, notification_preferences
9. `phase7_completion` — push triggers (all categories), rate limits, RLS hardening
10. `phase8_9_platform` — reports, announcements, feature flags, payment shell schema (`ff_payments_enabled` default **false**)
11. `phase8_gaps` — admin notification on new reports
12. `message_rich_content_types` — gif, sticker, location, contact message types

## Payments (future)

Real Stripe card capture is **not** enabled. The app ships with:

- `feature_flags.ff_payments_enabled = false`
- `get_payment_shell_config()` RPC and payouts placeholder UI
- `create-payment-intent` edge function (stub — enable flag + set `STRIPE_SECRET_KEY` when ready)
