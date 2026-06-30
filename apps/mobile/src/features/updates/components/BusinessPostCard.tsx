import { Image, Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";
import type { BusinessPostItem } from "../api/updatesApi";

interface BusinessPostCardProps {
  post: BusinessPostItem;
  onPressBusiness?: (slug: string) => void;
}

export function BusinessPostCard({ post, onPressBusiness }: BusinessPostCardProps) {
  const biz = post.business;
  return (
    <Card style={styles.card}>
      <Pressable
        style={styles.header}
        onPress={() => biz && onPressBusiness?.(biz.slug)}
        disabled={!biz}
      >
        <Avatar uri={biz?.logo_url} name={biz?.business_name ?? "Business"} size={40} />
        <View style={styles.meta}>
          <Text variant="headline">{biz?.business_name ?? "Business"}</Text>
          <Text variant="caption" muted>
            {new Date(post.created_at).toLocaleString()}
          </Text>
        </View>
      </Pressable>
      <Text variant="body" style={styles.body}>
        {post.body}
      </Text>
      {post.media_url && post.media_type === "image" ? (
        <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  header: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginBottom: spacing.sm },
  meta: { flex: 1 },
  body: { marginBottom: spacing.sm },
  media: { width: "100%", height: 200, borderRadius: 8, backgroundColor: colors.background.tertiary },
});
