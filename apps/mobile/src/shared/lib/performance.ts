import * as Sentry from "@sentry/react-native";

let marked = false;

export function markAppInteractive() {
  if (marked) return;
  marked = true;
  Sentry.addBreadcrumb({
    category: "performance",
    message: "app_interactive",
    level: "info",
  });
}
