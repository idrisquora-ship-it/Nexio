import { ReactNode, useEffect } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabase } from "../shared/lib/supabase";
import { useAuthStore } from "../features/auth/store/authStore";
import { fetchProfile } from "../features/auth/api/authApi";
import { registerPushToken, unregisterPushToken } from "../shared/lib/pushNotifications";

async function hydrateSession(session: Session | null) {
  if (!session?.user) return null;
  try {
    return await fetchProfile(session.user.id);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSession, setProfile, setLoading, reset } = useAuthStore();

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        registerPushToken(session.user.id).catch(() => undefined);
        hydrateSession(session).then(setProfile).catch(() => setProfile(null));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        registerPushToken(session.user.id).catch(() => undefined);
        hydrateSession(session).then(setProfile).catch(() => setProfile(null));
      } else {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [reset, setLoading, setProfile, setSession]);

  return children;
}
