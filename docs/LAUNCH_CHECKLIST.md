# Nexio launch checklist

Use this before submitting to the App Store and Google Play.

## Environment

- [ ] `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set for production
- [ ] `EXPO_PUBLIC_PRIVACY_URL` and `EXPO_PUBLIC_TERMS_URL` point to live legal pages
- [ ] `CRON_SECRET` set in Supabase Edge Function secrets (see [CRON_SETUP.md](./CRON_SETUP.md))
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` set for push notifications
- [ ] Optional: `EXPO_PUBLIC_GIPHY_API_KEY` for in-chat GIF search
- [ ] Optional: `EXPO_PUBLIC_SENTRY_DSN` for crash reporting

## Supabase

- [ ] All migrations applied (through `message_rich_content_types`)
- [ ] Edge functions deployed: `search-gigs`, `on-notification-dispatch`, cron functions
- [ ] Cron jobs scheduled for `evaluate-seller-levels` (daily) and `expire-stories` (hourly)
- [ ] `ff_payments_enabled` remains **false** until Stripe is configured

## EAS build

From `apps/mobile`:

```bash
pnpm install
eas login
eas build:configure   # if first time
eas build --profile preview --platform all
eas build --profile production --platform all
```

Update `eas.json` submit section with your Apple ID, ASC app ID, team ID, and Play service account path.

## App Store (iOS)

- [ ] Bundle ID: `com.nexio.app`
- [ ] App icon and splash use `assets/nexio-icon.png`
- [ ] Privacy Nutrition Labels match data collection (messages, location when shared, etc.)
- [ ] Sign in with Google configured; **Apple Sign In not required** for current scope
- [ ] Screenshots, description, keywords, support URL
- [ ] `eas submit --platform ios --profile production`

## Google Play (Android)

- [ ] Package name: `com.nexio.app`
- [ ] `google-services.json` in `apps/mobile/`
- [ ] Data safety form completed
- [ ] Content rating questionnaire
- [ ] `eas submit --platform android --profile production`

## Pre-submission QA

- [ ] Auth: email + Google sign-in
- [ ] Messaging: text, media, GIF, sticker, location, contact share
- [ ] Marketplace: sections, filters, gig detail, favorites
- [ ] Business profile: QR code opens correct deep link
- [ ] Push notifications on physical device
- [ ] Offline queue: send message while offline, verify sync

## Post-launch

- [ ] Monitor Supabase logs and optional Sentry
- [ ] Review `get_advisors` security/performance recommendations monthly
