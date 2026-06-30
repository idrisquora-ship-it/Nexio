import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { fetchUserStories } from "../../../src/features/updates/api/updatesApi";
import { StoryViewer } from "../../../src/features/updates/components/StoryViewer";
import { getSupabase } from "../../../src/shared/lib/supabase";

export default function StoryViewerScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("Story");
  const [stories, setStories] = useState<Awaited<ReturnType<typeof fetchUserStories>>>([]);

  useEffect(() => {
    if (!userId) return;
    fetchUserStories(userId).then(setStories);
    getSupabase()
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setOwnerName(data.display_name);
      });
  }, [userId]);

  return (
    <View style={{ flex: 1 }}>
      <StoryViewer
        stories={stories}
        ownerName={ownerName}
        ownerId={userId}
        onClose={() => router.back()}
      />
    </View>
  );
}
