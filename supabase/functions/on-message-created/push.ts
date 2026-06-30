import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { JWT } from "npm:google-auth-library@9";

export type NotificationCategory =
  | "message"
  | "call"
  | "story"
  | "business_update"
  | "marketplace"
  | "order"
  | "review"
  | "verification"
  | "mention"
  | "follower"
  | "community"
  | "system";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

export type NotifyUserInput = {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, string>;
  androidChannelId?: string;
  alwaysPush?: boolean;
};

let cachedServiceAccount: ServiceAccount | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function getServiceAccount(): ServiceAccount {
  if (cachedServiceAccount) return cachedServiceAccount;
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  cachedServiceAccount = JSON.parse(raw) as ServiceAccount;
  return cachedServiceAccount;
}

async function getFcmAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const client = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const tokens = await client.authorize();
  if (!tokens.access_token) throw new Error("Failed to obtain FCM access token");
  return tokens.access_token;
}

async function sendFcmMessage(
  serviceAccount: ServiceAccount,
  token: string,
  title: string,
  body: string,
  data: Record<string, string>,
  androidChannelId?: string,
) {
  const accessToken = await getFcmAccessToken(serviceAccount);
  const android: Record<string, unknown> = { priority: "HIGH" };
  if (androidChannelId) {
    android.notification = { channel_id: androidChannelId, sound: "default" };
  }

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data,
          android,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`FCM error: ${await response.text()}`);
  }
}

async function getUserPrefs(
  supabase: SupabaseClient,
  userId: string,
  category: NotificationCategory,
) {
  const { data } = await supabase
    .from("notification_preferences")
    .select("push_enabled, in_app_enabled")
    .eq("user_id", userId)
    .eq("category", category)
    .maybeSingle();

  return {
    pushEnabled: data?.push_enabled ?? true,
    inAppEnabled: data?.in_app_enabled ?? true,
  };
}

export async function notifyUser(supabase: SupabaseClient, input: NotifyUserInput) {
  const prefs = await getUserPrefs(supabase, input.userId, input.category);
  let pushSent = false;
  const errors: string[] = [];

  if (prefs.inAppEnabled) {
    await supabase.from("notification_log").insert({
      user_id: input.userId,
      category: input.category,
      title: input.title,
      body: input.body,
      data: input.data ?? {},
    });
  }

  const shouldPush = input.alwaysPush || prefs.pushEnabled;
  if (!shouldPush) {
    return { pushSent, errors };
  }

  const { data: tokens } = await supabase
    .from("device_tokens")
    .select("token")
    .eq("user_id", input.userId)
    .eq("platform", "android");

  if (!tokens?.length) {
    return { pushSent, errors };
  }

  const serviceAccount = getServiceAccount();
  const data = { type: input.category, ...(input.data ?? {}) };

  for (const row of tokens) {
    try {
      await sendFcmMessage(
        serviceAccount,
        row.token,
        input.title,
        input.body,
        data,
        input.androidChannelId,
      );
      pushSent = true;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown FCM error");
    }
  }

  return { pushSent, errors };
}

export async function notifyUsers(
  supabase: SupabaseClient,
  userIds: string[],
  base: Omit<NotifyUserInput, "userId">,
) {
  let sent = 0;
  const errors: string[] = [];

  for (const userId of userIds) {
    const result = await notifyUser(supabase, { ...base, userId });
    if (result.pushSent) sent += 1;
    errors.push(...result.errors);
  }

  return { sent, errors };
}
