import { type DependencyList, type EffectCallback, useEffect, useRef } from "react";
import { usePathname } from "expo-router";

/**
 * Expo Router-safe alternative to `@react-navigation/native`'s `useFocusEffect`.
 * That hook can throw "Couldn't find a navigation object" during auth redirects
 * before the tab navigator is fully mounted.
 */
export function useScreenFocusEffect(effect: EffectCallback, deps: DependencyList = []) {
  const pathname = usePathname();
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    return effectRef.current();
    // Re-run when this route becomes active again (tab switch, back navigation).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, ...deps]);
}
