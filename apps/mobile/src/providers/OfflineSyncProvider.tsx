import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppState, InteractionManager } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { getTotalPendingCount, runOfflineSync } from "../shared/lib/offlineSync";
import { markAppInteractive } from "../shared/lib/performance";

type OfflineSyncContextValue = {
  isOnline: boolean;
  syncing: boolean;
  pendingCount: number;
  refreshPending: () => Promise<void>;
  syncNow: () => Promise<void>;
};

const OfflineSyncContext = createContext<OfflineSyncContextValue | null>(null);

export function useOfflineSync() {
  const ctx = useContext(OfflineSyncContext);
  if (!ctx) {
    throw new Error("useOfflineSync must be used within OfflineSyncProvider");
  }
  return ctx;
}

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPending = useCallback(async () => {
    const count = await getTotalPendingCount();
    setPendingCount(count);
  }, []);

  const syncNow = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await runOfflineSync();
      await refreshPending();
    } finally {
      setSyncing(false);
    }
  }, [refreshPending, syncing]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      markAppInteractive();
    });

    refreshPending().catch(() => undefined);

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (online) {
        syncNow().catch(() => undefined);
      }
    });

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshPending().catch(() => undefined);
        syncNow().catch(() => undefined);
      }
    });

    const interval = setInterval(() => {
      if (isOnline) syncNow().catch(() => undefined);
      else refreshPending().catch(() => undefined);
    }, 30_000);

    return () => {
      unsubscribe();
      sub.remove();
      clearInterval(interval);
    };
  }, [isOnline, refreshPending, syncNow]);

  return (
    <OfflineSyncContext.Provider value={{ isOnline, syncing, pendingCount, refreshPending, syncNow }}>
      {children}
    </OfflineSyncContext.Provider>
  );
}
