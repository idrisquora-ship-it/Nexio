import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Info, Phone, Video, FileText } from "lucide-react-native";
import { requestLiveKitToken } from "../../../src/features/calls/api/callsApi";
import { EditMessageSheet } from "../../../src/features/messaging/components/EditMessageSheet";
import { ForwardMessageSheet } from "../../../src/features/messaging/components/ForwardMessageSheet";
import { MediaPickerSheet, type MediaPickerAction } from "../../../src/features/messaging/components/MediaPickerSheet";
import { GifPickerSheet } from "../../../src/features/messaging/components/GifPickerSheet";
import { StickerPickerSheet } from "../../../src/features/messaging/components/StickerPickerSheet";
import { ContactPickerSheet } from "../../../src/features/messaging/components/ContactPickerSheet";
import { MediaViewerModal } from "../../../src/features/messaging/components/MediaViewerModal";
import { MessageActionsSheet, type MessageAction } from "../../../src/features/messaging/components/MessageActionsSheet";
import { MessageBubble } from "../../../src/features/messaging/components/MessageBubble";
import { MessageInput } from "../../../src/features/messaging/components/MessageInput";
import { PinnedMessagesBar } from "../../../src/features/messaging/components/PinnedMessagesBar";
import { ReplyPreview } from "../../../src/features/messaging/components/ReplyPreview";
import { TypingIndicator } from "../../../src/features/messaging/components/TypingIndicator";
import { VoiceNoteRecorder } from "../../../src/features/messaging/components/VoiceNoteRecorder";
import { fetchPrivacySettings } from "../../../src/features/auth/api/privacyApi";
import {
  broadcastTyping,
  deleteMessage,
  editMessage,
  fetchConversation,
  fetchMessages,
  fetchOtherParticipantReadAt,
  fetchParticipants,
  fetchPinnedMessages,
  fetchReactions,
  fetchStarredMessageIds,
  forwardMessage,
  getConversationTitle,
  markConversationRead,
  pinMessage,
  sendMessage,
  subscribeToMessages,
  subscribeToTyping,
  toggleReaction,
  toggleStarMessage,
  unpinMessage,
  uploadChatMedia,
  parseMediaMetadata,
  type ConversationListItem,
  type MediaMetadata,
  type Message,
  type UploadableContentType,
} from "../../../src/features/messaging/api/messagingApi";
import { AgreementSheet } from "../../../src/features/orders/components/AgreementSheet";
import { ReviewSheet } from "../../../src/features/orders/components/ReviewSheet";
import { useAuthStore } from "../../../src/features/auth/store/authStore";
import { enqueueUpload } from "../../../src/shared/lib/uploadQueue";
import { enqueueMessage } from "../../../src/shared/lib/messageQueue";
import { useOfflineSync } from "../../../src/providers/OfflineSyncProvider";
import { useReportStore } from "../../../src/features/moderation/store/reportStore";
import { ScreenHeader, Text } from "../../../src/shared/components";
import { colors, spacing } from "../../../src/shared/theme";

function createClientId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationListItem | null>(null);
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [reactingToId, setReactingToId] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [viewer, setViewer] = useState<{ type: "image" | "video"; uri: string } | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showAgreement, setShowAgreement] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewRole, setReviewRole] = useState<"buyer" | "seller">("buyer");
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null);
  const [typingFrom, setTypingFrom] = useState<string | null>(null);
  const [typingEnabled, setTypingEnabled] = useState(true);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { refreshPending } = useOfflineSync();
  const openReport = useReportStore((s) => s.open);
  const listRef = useRef<FlatList<Message>>(null);

  const inquiryGigId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const meta = parseMediaMetadata(messages[i].media_metadata);
      if (messages[i].content_type === "gig_inquiry" && meta?.gigId) return meta.gigId;
    }
    return null;
  }, [messages]);

  const messageMap = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  const load = useCallback(async () => {
    if (!id || !user) return;
    const [data, conv, pinned, stars] = await Promise.all([
      fetchMessages(id),
      fetchConversation(id),
      fetchPinnedMessages(id),
      user ? fetchStarredMessageIds(user.id) : Promise.resolve(new Set<string>()),
    ]);
    setMessages(data);
    setPinnedMessages(pinned);
    setStarredIds(stars);
    if (conv) {
      setConversation({ ...conv, other_user: null });
      if (conv.type === "direct") {
        const participants = await fetchParticipants(id);
        const other = participants.find((p) => p.user_id !== user.id);
        if (other?.profiles) {
          setConversation({
            ...conv,
            other_user: {
              id: other.profiles.id,
              username: other.profiles.username,
              display_name: other.profiles.display_name,
              avatar_url: other.profiles.avatar_url,
            },
          });
        }
      }
    }
    const reactionMap = await fetchReactions(data.map((m) => m.id));
    setReactions(reactionMap);
    if (conv?.type === "direct") {
      const readAt = await fetchOtherParticipantReadAt(id, user.id);
      setOtherReadAt(readAt);
    }
  }, [id, user]);

  useEffect(() => {
    if (!user) return;
    fetchPrivacySettings(user.id)
      .then((s) => setTypingEnabled(s?.show_typing ?? true))
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!id || !user) return;
    return subscribeToTyping(id, user.id, () => {
      setTypingFrom("Someone");
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setTypingFrom(null), 3000);
    });
  }, [id, user]);

  useEffect(() => {
    if (!id) return;
    markConversationRead(id).catch(() => undefined);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!id) return;
    return subscribeToMessages(id, (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id || (message.client_id && m.client_id === message.client_id))) {
          return prev;
        }
        return [...prev, message];
      });
    });
  }, [id]);

  const sendChatMessage = async (input: {
    body: string;
    contentType?: Message["content_type"];
    mediaUrl?: string;
    mediaMetadata?: MediaMetadata | null;
    replyToId?: string | null;
  }) => {
    if (!user || !id) return;
    setSending(true);
    const clientId = createClientId();
    const contentType = input.contentType ?? "text";
    const optimistic: Message = {
      id: clientId,
      conversation_id: id,
      sender_id: user.id,
      body: input.body,
      content_type: contentType,
      media_url: input.mediaUrl ?? null,
      media_metadata: (input.mediaMetadata ?? null) as Message["media_metadata"],
      reply_to_id: input.replyToId ?? replyTo?.id ?? null,
      status: "sending",
      client_id: clientId,
      created_at: new Date().toISOString(),
      deleted_at: null,
      edited_at: null,
      pinned_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const saved = await sendMessage({
        conversationId: id,
        senderId: user.id,
        body: input.body,
        clientId,
        contentType,
        mediaUrl: input.mediaUrl,
        mediaMetadata: input.mediaMetadata,
        replyToId: input.replyToId ?? replyTo?.id,
      });
      setMessages((prev) => prev.map((m) => (m.client_id === clientId ? saved : m)));
      setReplyTo(null);
    } catch {
      if (contentType === "text" && !input.mediaUrl) {
        await enqueueMessage({
          conversationId: id,
          senderId: user.id,
          body: input.body,
          clientId,
          contentType,
          replyToId: input.replyToId ?? replyTo?.id,
        });
        await refreshPending();
        setMessages((prev) => prev.map((m) => (m.client_id === clientId ? { ...m, status: "sent" } : m)));
        Alert.alert("Queued", "Message will send when you're back online.");
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.client_id === clientId ? { ...m, status: "failed" } : m)),
        );
      }
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  };

  const handleSend = (body: string) => sendChatMessage({ body });

  const queueFailedUpload = async (input: {
    localUri: string;
    contentType: UploadableContentType;
    body: string;
    clientId: string;
    mimeType?: string;
    extension?: string;
    mediaMetadata?: MediaMetadata | null;
  }) => {
    if (!user || !id) return;
    await enqueueUpload({
      conversationId: id,
      senderId: user.id,
      localUri: input.localUri,
      contentType: input.contentType,
      body: input.body,
      clientId: input.clientId,
      mimeType: input.mimeType,
      extension: input.extension,
      mediaMetadata: input.mediaMetadata,
      replyToId: replyTo?.id,
    });
    Alert.alert("Queued", "Upload will resume when you're back online.");
  };

  const handleMediaAction = async (action: MediaPickerAction) => {
    if (!user || !id) return;

    if (action === "voice") {
      setRecordingVoice(true);
      return;
    }

    if (action === "gif") {
      setShowGifPicker(true);
      return;
    }

    if (action === "sticker") {
      setShowStickerPicker(true);
      return;
    }

    if (action === "contact") {
      setShowContactPicker(true);
      return;
    }

    if (action === "location") {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Location", "Allow location access to share where you are.");
        return;
      }
      setSending(true);
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = position.coords;
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        const place = places[0];
        const label = [place?.name, place?.city, place?.region].filter(Boolean).join(", ");
        await sendChatMessage({
          body: label || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          contentType: "location",
          mediaMetadata: { latitude, longitude, locationLabel: label || undefined },
        });
      } catch {
        Alert.alert("Location", "Could not get your current location.");
      } finally {
        setSending(false);
      }
      return;
    }

    if (action === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera", "Allow camera access to take photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      if (result.canceled || !result.assets[0]) return;
      setSending(true);
      try {
        const path = await uploadChatMedia(id, user.id, result.assets[0].uri, "image", {
          extension: "jpg",
          mimeType: "image/jpeg",
        });
        await sendChatMessage({ body: "", contentType: "image", mediaUrl: path });
      } catch {
        await queueFailedUpload({
          localUri: result.assets[0].uri,
          contentType: "image",
          body: "",
          clientId: createClientId(),
          extension: "jpg",
          mimeType: "image/jpeg",
        });
      } finally {
        setSending(false);
      }
      return;
    }

    if (action === "image") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Photos", "Allow photo access to send images.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
      if (result.canceled || !result.assets[0]) return;
      setSending(true);
      try {
        const path = await uploadChatMedia(id, user.id, result.assets[0].uri, "image", {
          extension: "jpg",
          mimeType: "image/jpeg",
        });
        await sendChatMessage({ body: "", contentType: "image", mediaUrl: path });
      } catch {
        await queueFailedUpload({
          localUri: result.assets[0].uri,
          contentType: "image",
          body: "",
          clientId: createClientId(),
          extension: "jpg",
          mimeType: "image/jpeg",
        });
      } finally {
        setSending(false);
      }
      return;
    }

    if (action === "video") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Videos", "Allow media access to send videos.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setSending(true);
      try {
        const path = await uploadChatMedia(id, user.id, asset.uri, "video", {
          extension: "mp4",
          mimeType: "video/mp4",
        });
        await sendChatMessage({
          body: "",
          contentType: "video",
          mediaUrl: path,
          mediaMetadata: { durationMs: asset.duration ? asset.duration * 1000 : undefined },
        });
      } catch {
        await queueFailedUpload({
          localUri: asset.uri,
          contentType: "video",
          body: "",
          clientId: createClientId(),
          extension: "mp4",
          mimeType: "video/mp4",
          mediaMetadata: { durationMs: asset.duration ? asset.duration * 1000 : undefined },
        });
      } finally {
        setSending(false);
      }
      return;
    }

    if (action === "document") {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const ext = asset.name.split(".").pop() ?? "bin";
      setSending(true);
      try {
        const path = await uploadChatMedia(id, user.id, asset.uri, "document", {
          extension: ext,
          mimeType: asset.mimeType ?? "application/octet-stream",
        });
        await sendChatMessage({
          body: asset.name,
          contentType: "document",
          mediaUrl: path,
          mediaMetadata: { fileName: asset.name, mimeType: asset.mimeType ?? undefined },
        });
      } catch {
        await queueFailedUpload({
          localUri: asset.uri,
          contentType: "document",
          body: asset.name,
          clientId: createClientId(),
          extension: ext,
          mimeType: asset.mimeType ?? "application/octet-stream",
          mediaMetadata: { fileName: asset.name, mimeType: asset.mimeType ?? undefined },
        });
      } finally {
        setSending(false);
      }
    }
  };

  const handleVoiceSend = async (uri: string, durationMs: number, waveform: number[]) => {
    if (!user || !id) return;
    setRecordingVoice(false);
    setSending(true);
    try {
      const path = await uploadChatMedia(id, user.id, uri, "voice", {
        extension: "m4a",
        mimeType: "audio/mp4",
      });
      await sendChatMessage({
        body: "",
        contentType: "voice",
        mediaUrl: path,
        mediaMetadata: { durationMs, waveform },
      });
    } catch {
      await queueFailedUpload({
        localUri: uri,
        contentType: "voice",
        body: "",
        clientId: createClientId(),
        extension: "m4a",
        mimeType: "audio/mp4",
        mediaMetadata: { durationMs, waveform },
      });
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!user) return;
    await toggleReaction(messageId, user.id, emoji);
    setReactions((prev) => {
      const current = prev[messageId] ?? [];
      const has = current.includes(emoji);
      return {
        ...prev,
        [messageId]: has ? current.filter((e) => e !== emoji) : [...current, emoji],
      };
    });
  };

  const messageStatusLabel = (msg: Message) => {
    if (msg.status === "sending") return "Sending…";
    if (msg.status === "failed") return "Failed";
    if (!otherReadAt) return "Sent";
    if (new Date(otherReadAt) >= new Date(msg.created_at)) return "Read";
    return "Delivered";
  };

  const handleTyping = (text: string) => {
    if (!id || !user || !typingEnabled || !text.trim()) return;
    if (typingTimerRef.current) return;
    broadcastTyping(id, user.id);
    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
    }, 1200);
  };

  const handleMessageAction = async (action: MessageAction) => {
    if (!actionMessage) return;
    const msg = actionMessage;
    if (action === "reply") {
      setReplyTo(msg);
    } else if (action === "forward") {
      setShowForward(true);
      return;
    } else if (action === "react") {
      setReactingToId(msg.id);
    } else if (action === "edit") {
      setEditingMessage(msg);
    } else if (action === "pin") {
      try {
        const updated = await pinMessage(msg.id);
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
        setPinnedMessages((prev) => [updated, ...prev.filter((p) => p.id !== updated.id)]);
      } catch (e) {
        Alert.alert("Pin failed", e instanceof Error ? e.message : "Try again");
      }
    } else if (action === "unpin") {
      try {
        const updated = await unpinMessage(msg.id);
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
        setPinnedMessages((prev) => prev.filter((p) => p.id !== msg.id));
      } catch (e) {
        Alert.alert("Unpin failed", e instanceof Error ? e.message : "Try again");
      }
    } else if (action === "star") {
      try {
        const starred = await toggleStarMessage(msg.id);
        setStarredIds((prev) => {
          const next = new Set(prev);
          if (starred) next.add(msg.id);
          else next.delete(msg.id);
          return next;
        });
      } catch (e) {
        Alert.alert("Star failed", e instanceof Error ? e.message : "Try again");
      }
    } else if (action === "delete") {
      await deleteMessage(msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } else if (action === "report") {
      openReport({
        type: "message",
        id: msg.id,
        label: msg.body?.slice(0, 80) ?? "Message",
      });
    } else if (action === "translate") {
      Alert.alert("Translate", "Message translation will be available in a future update.");
    }
    setActionMessage(null);
  };

  const handleEditSave = async (body: string) => {
    if (!editingMessage) return;
    try {
      const updated = await editMessage(editingMessage.id, body);
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingMessage(null);
    } catch (e) {
      Alert.alert("Edit failed", e instanceof Error ? e.message : "Try again");
    }
  };

  const handleForward = async (targetConversationId: string) => {
    if (!user || !actionMessage) return;
    setShowForward(false);
    try {
      await forwardMessage(actionMessage, targetConversationId, user.id);
      setActionMessage(null);
      Alert.alert("Forwarded", "Message sent to the selected chat.");
    } catch (e) {
      Alert.alert("Forward failed", e instanceof Error ? e.message : "Try again");
    }
  };

  const startCall = async (callType: "voice" | "video") => {
    if (!id) return;
    try {
      const result = await requestLiveKitToken(id, callType);
      let participantCount = "2";
      if (conversation?.type === "group") {
        const members = await fetchParticipants(id);
        participantCount = String(members.length);
      }
      router.push({
        pathname: "/call/[roomId]",
        params: {
          roomId: result.room_name,
          callId: result.call_id,
          callType,
          token: result.token,
          url: result.url,
          participantCount,
        },
      });
    } catch (e) {
      Alert.alert("Call failed", e instanceof Error ? e.message : "Try again");
    }
  };

  if (!id) {
    router.back();
    return null;
  }

  const title = conversation ? getConversationTitle(conversation) : "Chat";
  const isGroup = conversation?.type === "group";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.header}>
        <ScreenHeader title={title} />
        <View style={styles.callActions}>
          {isGroup ? (
            <Pressable
              onPress={() => router.push({ pathname: "/group/[id]/info", params: { id } })}
              style={styles.callBtn}
            >
              <Info color={colors.brand.primary} size={22} />
            </Pressable>
          ) : profile?.is_business && inquiryGigId ? (
            <Pressable onPress={() => setShowAgreement(true)} style={styles.callBtn}>
              <FileText color={colors.brand.primary} size={22} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => startCall("voice")} style={styles.callBtn}>
            <Phone color={colors.brand.primary} size={22} />
          </Pressable>
          <Pressable onPress={() => startCall("video")} style={styles.callBtn}>
            <Video color={colors.brand.primary} size={22} />
          </Pressable>
        </View>
      </View>

      <PinnedMessagesBar
        messages={pinnedMessages}
        onPressMessage={(msg) => {
          const index = messages.findIndex((m) => m.id === msg.id);
          if (index >= 0) listRef.current?.scrollToIndex({ index, animated: true });
        }}
        onUnpin={async (messageId) => {
          const updated = await unpinMessage(messageId);
          setPinnedMessages((prev) => prev.filter((p) => p.id !== messageId));
          setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
        }}
      />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwn={item.sender_id === user?.id}
            reactions={reactions[item.id]}
            replyTo={item.reply_to_id ? messageMap.get(item.reply_to_id) ?? null : null}
            showReactionPicker={reactingToId === item.id}
            onLongPress={() => setActionMessage(item)}
            onReact={(emoji) => {
              handleReact(item.id, emoji);
              setReactingToId(null);
            }}
            onMediaPress={(type, uri) => setViewer({ type, uri })}
            onOrderAction={load}
            onOrderReview={(orderId, role) => {
              setReviewOrderId(orderId);
              setReviewRole(role);
            }}
            currentUserId={user?.id}
            statusLabel={item.sender_id === user?.id ? messageStatusLabel(item) : undefined}
          />
        )}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListFooterComponent={typingFrom ? <TypingIndicator label={`${typingFrom} is typing…`} /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body" muted>
              No messages yet. Say hello.
            </Text>
          </View>
        }
      />

      {replyTo ? (
        <ReplyPreview
          message={replyTo}
          previewText={replyTo.body || "Media"}
          onCancel={() => setReplyTo(null)}
        />
      ) : null}

      {recordingVoice ? (
        <VoiceNoteRecorder
          onSend={handleVoiceSend}
          onCancel={() => setRecordingVoice(false)}
        />
      ) : (
        <MessageInput
          onSend={handleSend}
          onAttach={() => setShowMediaPicker(true)}
          onVoiceNote={() => setRecordingVoice(true)}
          onChangeText={handleTyping}
          disabled={sending}
        />
      )}

      <MediaPickerSheet
        visible={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaAction}
      />

      <GifPickerSheet
        visible={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={(gif) =>
          sendChatMessage({
            body: gif.title,
            contentType: "gif",
            mediaUrl: gif.url,
            mediaMetadata: { mimeType: "image/gif" },
          })
        }
      />

      <StickerPickerSheet
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelect={(sticker) =>
          sendChatMessage({
            body: sticker.label,
            contentType: "sticker",
            mediaUrl: sticker.url,
            mediaMetadata: { stickerId: sticker.id, mimeType: "image/gif" },
          })
        }
      />

      <ContactPickerSheet
        visible={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        onSelect={(contact) =>
          sendChatMessage({
            body: contact.displayName,
            contentType: "contact",
            mediaMetadata: {
              contactUserId: contact.userId,
              contactUsername: contact.username,
              contactDisplayName: contact.displayName,
              contactAvatarUrl: contact.avatarUrl,
            },
          })
        }
      />

      <MessageActionsSheet
        visible={!!actionMessage && !showForward}
        onClose={() => setActionMessage(null)}
        onAction={handleMessageAction}
        isOwn={actionMessage?.sender_id === user?.id}
        isText={actionMessage?.content_type === "text"}
        isPinned={!!actionMessage?.pinned_at}
        isStarred={actionMessage ? starredIds.has(actionMessage.id) : false}
      />

      <EditMessageSheet
        visible={!!editingMessage}
        initialBody={editingMessage?.body ?? ""}
        onClose={() => setEditingMessage(null)}
        onSave={handleEditSave}
      />

      <ForwardMessageSheet
        visible={showForward}
        userId={user?.id ?? ""}
        onClose={() => {
          setShowForward(false);
          setActionMessage(null);
        }}
        onSelect={handleForward}
      />

      <MediaViewerModal
        visible={!!viewer}
        type={viewer?.type ?? "image"}
        uri={viewer?.uri ?? null}
        onClose={() => setViewer(null)}
      />

      {id ? (
        <AgreementSheet
          visible={showAgreement}
          conversationId={id}
          gigId={inquiryGigId}
          onClose={() => setShowAgreement(false)}
          onCreated={load}
        />
      ) : null}

      <ReviewSheet
        visible={!!reviewOrderId}
        orderId={reviewOrderId}
        role={reviewRole}
        onClose={() => setReviewOrderId(null)}
        onSubmitted={load}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: spacing.md,
  },
  callActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  callBtn: {
    padding: spacing.xs,
  },
  list: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
});
