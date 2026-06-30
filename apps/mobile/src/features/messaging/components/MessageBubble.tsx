import { useEffect, useState } from "react";
import { Image, Linking, Pressable, View, StyleSheet } from "react-native";
import { FileText, MapPin, Play, User } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Text, Avatar } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import {
  getSignedMediaUrl,
  parseMediaMetadata,
  type Message,
} from "../api/messagingApi";
import { VoiceNotePlayer } from "./VoiceNotePlayer";
import { ChatGigCard } from "../../marketplace/components/ChatGigCard";
import { ChatOrderCard } from "../../orders/components/ChatOrderCard";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  reactions?: string[];
  replyTo?: Message | null;
  showReactionPicker?: boolean;
  onLongPress?: () => void;
  onReact?: (emoji: string) => void;
  onMediaPress?: (type: "image" | "video", uri: string) => void;
  onOrderAction?: () => void;
  onOrderReview?: (orderId: string, role: "buyer" | "seller") => void;
  currentUserId?: string;
  statusLabel?: string;
}

export function MessageBubble({
  message,
  isOwn,
  reactions = [],
  replyTo,
  showReactionPicker = false,
  onLongPress,
  onReact,
  onMediaPress,
  onOrderAction,
  onOrderReview,
  currentUserId,
  statusLabel,
}: MessageBubbleProps) {
  const router = useRouter();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const metadata = parseMediaMetadata(message.media_metadata);

  useEffect(() => {
    if (message.content_type === "sticker") {
      if (message.media_url?.startsWith("http://") || message.media_url?.startsWith("https://")) {
        setMediaUrl(message.media_url);
      } else {
        setMediaUrl(null);
      }
      return;
    }
    if (!message.media_url) {
      setMediaUrl(null);
      return;
    }
    if (message.content_type === "text" || message.content_type === "location" || message.content_type === "contact") {
      setMediaUrl(null);
      return;
    }
    if (message.media_url.startsWith("http://") || message.media_url.startsWith("https://")) {
      setMediaUrl(message.media_url);
      return;
    }
    getSignedMediaUrl(message.content_type, message.media_url)
      .then(setMediaUrl)
      .catch(() => setMediaUrl(null));
  }, [message.content_type, message.media_url]);

  const handleLongPress = () => {
    onLongPress?.();
  };

  const handleReact = (emoji: string) => {
    onReact?.(emoji);
  };

  const uniqueReactions = [...new Set(reactions)];

  const replyPreview = replyTo ? (
    <View style={[styles.replyBox, isOwn ? styles.ownReply : styles.otherReply]}>
      <Text variant="footnote" style={isOwn ? styles.ownText : undefined} muted={!isOwn}>
        {replyTo.body || contentLabel(replyTo.content_type)}
      </Text>
    </View>
  ) : null;

  return (
    <View style={[styles.wrapper, isOwn ? styles.ownWrapper : styles.otherWrapper]}>
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
      >
        {replyPreview}

        {message.content_type === "gig_inquiry" && metadata?.gigId ? (
          <ChatGigCard metadata={metadata} isOwn={isOwn} />
        ) : null}

        {message.content_type === "order_card" ? (
          <ChatOrderCard
            message={message}
            userId={currentUserId}
            onActionComplete={onOrderAction}
            onReview={onOrderReview}
          />
        ) : null}

        {message.content_type === "gif" && mediaUrl ? (
          <Pressable onPress={() => onMediaPress?.("image", mediaUrl)}>
            <Image source={{ uri: mediaUrl }} style={styles.gif} resizeMode="cover" />
          </Pressable>
        ) : null}

        {message.content_type === "sticker" ? (
          mediaUrl ? (
            <Image source={{ uri: mediaUrl }} style={styles.stickerImage} resizeMode="contain" />
          ) : message.body ? (
            <Text style={styles.sticker}>{message.body}</Text>
          ) : null
        ) : null}

        {message.content_type === "location" && metadata?.latitude != null && metadata?.longitude != null ? (
          <Pressable
            style={styles.locationCard}
            onPress={() =>
              Linking.openURL(
                `https://maps.google.com/?q=${metadata.latitude},${metadata.longitude}`,
              ).catch(() => undefined)
            }
          >
            <MapPin color={isOwn ? colors.text.inverse : colors.brand.primary} size={22} />
            <Text variant="body" style={isOwn ? styles.ownText : undefined} numberOfLines={2}>
              {message.body || metadata.locationLabel || "Shared location"}
            </Text>
          </Pressable>
        ) : null}

        {message.content_type === "contact" && metadata?.contactUserId ? (
          <Pressable
            style={styles.contactCard}
            onPress={() => router.push(`/user/${metadata.contactUserId}`)}
          >
            <Avatar
              name={metadata.contactDisplayName ?? metadata.contactUsername ?? "User"}
              uri={metadata.contactAvatarUrl}
              size={40}
            />
            <View style={styles.contactMeta}>
              <Text variant="body" style={isOwn ? styles.ownText : undefined}>
                {metadata.contactDisplayName ?? "Contact"}
              </Text>
              {metadata.contactUsername ? (
                <Text variant="footnote" style={isOwn ? styles.ownText : undefined} muted={!isOwn}>
                  @{metadata.contactUsername}
                </Text>
              ) : null}
            </View>
            <User color={isOwn ? colors.text.inverse : colors.text.secondary} size={18} />
          </Pressable>
        ) : null}

        {message.content_type === "image" && mediaUrl ? (
          <Pressable onPress={() => onMediaPress?.("image", mediaUrl)}>
            <Image source={{ uri: mediaUrl }} style={styles.image} resizeMode="cover" />
          </Pressable>
        ) : null}

        {message.content_type === "video" && mediaUrl ? (
          <Pressable style={styles.videoThumb} onPress={() => onMediaPress?.("video", mediaUrl)}>
            <Play color={colors.text.inverse} size={32} />
            <Text variant="footnote" style={styles.videoLabel}>
              Video
            </Text>
          </Pressable>
        ) : null}

        {message.content_type === "voice" && mediaUrl ? (
          <VoiceNotePlayer uri={mediaUrl} metadata={metadata} isOwn={isOwn} />
        ) : null}

        {message.content_type === "document" && mediaUrl ? (
          <Pressable
            style={styles.document}
            onPress={() => Linking.openURL(mediaUrl).catch(() => undefined)}
          >
            <FileText color={isOwn ? colors.text.inverse : colors.brand.primary} size={22} />
            <Text variant="body" style={isOwn ? styles.ownText : undefined} numberOfLines={1}>
              {metadata?.fileName ?? message.body ?? "Document"}
            </Text>
          </Pressable>
        ) : null}

        {message.body &&
        message.content_type !== "document" &&
        message.content_type !== "order_card" &&
        message.content_type !== "sticker" &&
        message.content_type !== "location" &&
        message.content_type !== "contact" ? (
          <Text variant="body" style={isOwn ? styles.ownText : undefined}>
            {message.body}
          </Text>
        ) : null}
        {"edited_at" in message && message.edited_at ? (
          <Text variant="footnote" style={[styles.edited, isOwn ? styles.ownText : undefined]} muted={!isOwn}>
            edited
          </Text>
        ) : null}
        {isOwn && statusLabel ? (
          <Text variant="caption" style={[styles.status, styles.ownText]}>
            {statusLabel}
          </Text>
        ) : null}
      </Pressable>

      {uniqueReactions.length > 0 ? (
        <View style={[styles.reactionRow, isOwn ? styles.ownReactionRow : styles.otherReactionRow]}>
          {uniqueReactions.map((emoji) => (
            <Text key={emoji} variant="footnote">
              {emoji}
            </Text>
          ))}
        </View>
      ) : null}

      {showReactionPicker ? (
        <View style={[styles.reactionPicker, isOwn ? styles.ownReactionRow : styles.otherReactionRow]}>
          {REACTION_EMOJIS.map((emoji) => (
            <Pressable key={emoji} onPress={() => handleReact(emoji)} style={styles.reactionBtn}>
              <Text variant="headline">{emoji}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function contentLabel(type: Message["content_type"]) {
  switch (type) {
    case "image":
      return "Photo";
    case "video":
      return "Video";
    case "voice":
      return "Voice note";
    case "document":
      return "Document";
    case "gif":
      return "GIF";
    case "sticker":
      return "Sticker";
    case "location":
      return "Location";
    case "contact":
      return "Contact";
    case "gig_inquiry":
      return "Gig inquiry";
    case "order_card":
      return "Order update";
    default:
      return "Message";
  }
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
  ownWrapper: {
    alignItems: "flex-end",
  },
  otherWrapper: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: "hidden",
  },
  ownBubble: {
    backgroundColor: colors.brand.primary,
  },
  otherBubble: {
    backgroundColor: colors.surface.card,
  },
  ownText: {
    color: colors.text.inverse,
  },
  replyBox: {
    borderLeftWidth: 2,
    paddingLeft: spacing.sm,
    marginBottom: spacing.xs,
    opacity: 0.85,
  },
  ownReply: {
    borderLeftColor: colors.text.inverse,
  },
  otherReply: {
    borderLeftColor: colors.brand.primary,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: radius.md,
    marginBottom: spacing.xxs,
  },
  gif: {
    width: 200,
    height: 200,
    borderRadius: radius.md,
    marginBottom: spacing.xxs,
  },
  sticker: {
    fontSize: 64,
    lineHeight: 72,
    textAlign: "center",
    paddingVertical: spacing.xs,
  },
  stickerImage: {
    width: 160,
    height: 160,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    maxWidth: 240,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    maxWidth: 260,
    paddingVertical: spacing.xxs,
  },
  contactMeta: {
    flex: 1,
    gap: spacing.xxs,
  },
  videoThumb: {
    width: 220,
    height: 140,
    borderRadius: radius.md,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxs,
    gap: spacing.xs,
  },
  videoLabel: {
    color: colors.text.secondary,
  },
  document: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    maxWidth: 220,
  },
  reactionRow: {
    flexDirection: "row",
    gap: spacing.xxs,
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  ownReactionRow: {
    alignSelf: "flex-end",
  },
  otherReactionRow: {
    alignSelf: "flex-start",
  },
  reactionPicker: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xxs,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  reactionBtn: {
    padding: spacing.xxs,
  },
  edited: {
    marginTop: spacing.xxs,
    fontStyle: "italic",
  },
  status: {
    marginTop: spacing.xxs,
    alignSelf: "flex-end",
    opacity: 0.85,
  },
});
