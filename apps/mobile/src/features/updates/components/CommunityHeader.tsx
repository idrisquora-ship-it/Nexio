import { Image, StyleSheet, View } from "react-native";
import { Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { Community } from "../api/updatesApi";

interface CommunityHeaderProps {
  community: Community;
  memberCount: number;
}

export function CommunityHeader({ community, memberCount }: CommunityHeaderProps) {
  return (
    <View style={styles.wrap}>
      {community.banner_url ? (
        <Image source={{ uri: community.banner_url }} style={styles.banner} />
      ) : (
        <View style={[styles.banner, styles.bannerPlaceholder]} />
      )}
      <View style={styles.content}>
        <Text variant="title2">{community.name}</Text>
        <Text variant="footnote" muted>
          {memberCount} members · {community.is_public ? "Public" : "Private"}
        </Text>
        {community.description ? (
          <Text variant="body" muted style={styles.description}>
            {community.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  banner: { width: "100%", height: 140 },
  bannerPlaceholder: { backgroundColor: colors.background.tertiary },
  content: { padding: spacing.md, gap: spacing.xs },
  description: { marginTop: spacing.xs },
});
