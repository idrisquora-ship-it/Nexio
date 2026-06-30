# Nexio — Google Sign-In & Push (Android)

This guide covers **Google OAuth for Supabase Auth** (Android-focused) and **FCM push** setup. Apple Sign-In is intentionally skipped.

---

## Part 1: Google Sign-In

### 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → project **nexio-922c0** (same as Firebase).
2. **APIs & Services → OAuth consent screen**
   - User type: **External** (or Internal for workspace testing)
   - App name: **Nexio**
   - Support email: your email
   - Scopes: `email`, `profile`, `openid`
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**

Create **two** clients:

| Client type | Purpose | Notes |
|-------------|---------|-------|
| **Web application** | Supabase Auth backend | Required — Supabase uses this |
| **Android** | Native app identity | Package: `com.nexio.app`, SHA-1 from your keystore |

#### Web client (for Supabase)

- Authorized redirect URIs — add **exactly**:
  ```
  https://thqhypzcisewftszeuat.supabase.co/auth/v1/callback
  ```
- Copy **Client ID** and **Client secret**.

#### Android client

- Package name: `com.nexio.app`
- SHA-1 certificate fingerprint — get it with:

```powershell
# Requires JDK (e.g. winget install Microsoft.OpenJDK.17)
$keytool = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot\bin\keytool.exe"
$ks = "$env:USERPROFILE\.android\debug.keystore"

# Create debug keystore on first run (passwords: android)
if (-not (Test-Path $ks)) {
  New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.android" | Out-Null
  & $keytool -genkeypair -v -keystore $ks -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
}

& $keytool -list -v -alias androiddebugkey -keystore $ks -storepass android -keypass android
```

Copy the **SHA1** line into Google Cloud → Android OAuth client.

For **EAS builds**, use `eas credentials -p android` instead (different keystore / SHA-1).

> After creating the Android OAuth client, re-download `google-services.json` from Firebase (Project settings → Your apps → Android) so it includes `oauth_client` entries.

### 2. Supabase Dashboard

1. **Authentication → Providers → Google** → Enable
2. Paste **Web client ID** and **Web client secret** (not the Android client secret)
3. **Authentication → URL Configuration**
   - Site URL: `nexio://`
   - Redirect URLs — add:
     ```
     nexio://auth/callback
     exp://127.0.0.1:8081/--/auth/callback
     ```
     (Add your Expo dev URL if using Expo Go)

### 3. Test on device

Google Sign-In requires a **development build** (not Expo Go) once you use native FCM + OAuth reliably:

```bash
cd apps/mobile
npx expo prebuild --platform android
npx expo run:android
```

Or with EAS:

```bash
eas build --profile development --platform android
```

Tap **Continue with Google** on Login or Signup — the in-app browser opens Google, then redirects to `nexio://auth/callback`.

---

## Part 2: FCM Push Notifications (Android)

### 1. Files (already in repo)

| File | Location | Purpose |
|------|----------|---------|
| `google-services.json` | `apps/mobile/google-services.json` | Android FCM client config |
| Firebase Admin SDK JSON | **Project root only — never commit** | Server push via Edge Function |

Add the admin SDK JSON to `.gitignore` (already done). Store its contents as a Supabase secret:

```bash
# Supabase Dashboard → Project Settings → Edge Functions → Secrets
FIREBASE_SERVICE_ACCOUNT_JSON=<paste entire JSON as one line>
PUSH_WEBHOOK_SECRET=<random string you generate>
```

`SUPABASE_SERVICE_ROLE_KEY` is auto-available in Edge Functions.

### 2. Database webhook (one-time in Supabase Dashboard)

1. **Database → Webhooks → Create webhook**
2. Name: `on-message-created`
3. Table: `messages`, Event: **Insert**
4. Type: **Supabase Edge Function** → `on-message-created`
5. HTTP headers (if using secret):
   ```
   x-webhook-secret: <same as PUSH_WEBHOOK_SECRET>
   ```

### 3. Development build required

Expo Go does **not** support native FCM tokens. Use:

```bash
eas build --profile development --platform android
```

The app registers the FCM device token on login and saves it to `device_tokens`. New messages trigger the webhook → Edge Function → FCM.

### 4. Verify push

1. Install dev build on two Android devices/emulators with different accounts
2. Start a chat and send a message
3. Put the recipient app in background — notification should appear

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Google redirect fails | Check redirect URLs in Supabase + Web OAuth client |
| `oauth_client` empty in google-services.json | Add Android OAuth client in Google Cloud, re-download from Firebase |
| No push token registered | Must use dev/production build, not Expo Go |
| Edge function 401 | Match `PUSH_WEBHOOK_SECRET` header in webhook |
| FCM send fails | Verify `FIREBASE_SERVICE_ACCOUNT_JSON` secret and FCM API enabled |

---

## What we skipped

- **Apple Sign-In** — not configured per product decision
- **iOS APNs** — Android-only push for now
