import { ReactNode, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchFeatureFlags,
  isFeatureEnabled,
  type FeatureFlags,
} from "../features/config/api/featureFlagsApi";

type FeatureFlagsContextValue = {
  flags: FeatureFlags | null;
  loading: boolean;
  isEnabled: (key: string, defaultValue?: boolean) => boolean;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  return ctx;
}

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: fetchFeatureFlags,
    staleTime: 5 * 60_000,
  });

  const value: FeatureFlagsContextValue = {
    flags: data ?? null,
    loading: isLoading,
    isEnabled: (key, defaultValue) => isFeatureEnabled(data ?? null, key, defaultValue),
  };

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}
