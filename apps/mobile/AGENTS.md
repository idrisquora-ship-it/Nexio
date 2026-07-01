# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Navigation (Expo Router)

- Use `useRouter`, `Redirect`, and `usePathname` from `expo-router` — never import hooks from `@react-navigation/native` in app or feature code.
- `@react-navigation/native`'s `useFocusEffect` can crash with **"Couldn't find a navigation object"** right after auth redirects, before the tab navigator mounts.
- For refresh-on-focus behavior, use `useScreenFocusEffect` from `src/shared/hooks/useScreenFocusEffect.ts`.
- After login/signup/onboarding, navigate to `/` and let `app/index.tsx` route the user — do not `router.replace("/(tabs)/...")` directly from auth flows.
