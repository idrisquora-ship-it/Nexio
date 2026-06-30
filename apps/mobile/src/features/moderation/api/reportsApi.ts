import { getSupabase } from "../../../shared/lib/supabase";
import type { Database } from "@nexio/supabase";

export type ReportTargetType = Database["public"]["Enums"]["report_target_type"];
export type ReportReason = Database["public"]["Enums"]["report_reason"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type ModerationActionType = Database["public"]["Enums"]["moderation_action_type"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

export async function submitReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}) {
  const { data, error } = await getSupabase().rpc("submit_report", {
    p_target_type: input.targetType,
    p_target_id: input.targetId,
    p_reason: input.reason,
    p_details: input.details ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function listPendingReports() {
  const { data, error } = await getSupabase().rpc("list_pending_reports");
  if (error) throw error;
  return (data ?? []) as Report[];
}

export async function processReport(
  reportId: string,
  action: ModerationActionType,
  note?: string,
) {
  const { data, error } = await getSupabase().rpc("process_report", {
    p_report_id: reportId,
    p_action: action,
    p_note: note ?? undefined,
  });
  if (error) throw error;
  return data as Report;
}

export async function fetchActiveAnnouncements() {
  const { data, error } = await getSupabase().rpc("fetch_active_announcements");
  if (error) throw error;
  return (data ?? []) as Announcement[];
}

export async function publishAnnouncement(input: {
  title: string;
  body: string;
  audience?: Database["public"]["Enums"]["announcement_audience"];
  priority?: Database["public"]["Enums"]["announcement_priority"];
  expiresAt?: string;
}) {
  const { data, error } = await getSupabase().rpc("publish_announcement", {
    p_title: input.title,
    p_body: input.body,
    p_audience: input.audience ?? "everyone",
    p_priority: input.priority ?? "normal",
    p_expires_at: input.expiresAt ?? undefined,
  });
  if (error) throw error;
  return data as Announcement;
}
