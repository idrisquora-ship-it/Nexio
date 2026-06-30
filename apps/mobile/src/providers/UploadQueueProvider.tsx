import { ReactNode, useEffect } from "react";
import { AppState } from "react-native";
import { processUploadQueue } from "../shared/lib/uploadQueue";

export function UploadQueueProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    processUploadQueue().catch(() => undefined);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        processUploadQueue().catch(() => undefined);
      }
    });

    const interval = setInterval(() => {
      processUploadQueue().catch(() => undefined);
    }, 30_000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);

  return children;
}
