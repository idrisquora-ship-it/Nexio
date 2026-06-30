import { getSupabase } from "../../../shared/lib/supabase";

export async function createGroupConversation(
  name: string,
  memberIds: string[],
  communityId?: string,
) {
  const { data, error } = await getSupabase().rpc("create_group_conversation", {
    p_name: name,
    p_member_ids: memberIds,
    p_community_id: communityId ?? undefined,
  });

  if (error) throw error;
  return data as string;
}
