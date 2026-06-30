import { create } from "zustand";
import type { ReportReason, ReportTargetType } from "../api/reportsApi";

export type ReportTarget = {
  type: ReportTargetType;
  id: string;
  label?: string;
};

type ReportStore = {
  target: ReportTarget | null;
  open: (target: ReportTarget) => void;
  close: () => void;
};

export const useReportStore = create<ReportStore>((set) => ({
  target: null,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
}));

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam",
  scam: "Scam or fraud",
  harassment: "Harassment",
  copyright: "Copyright violation",
  explicit_content: "Explicit content",
  other: "Other",
};
