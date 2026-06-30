import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  AudioSession,
  LiveKitRoom,
  useParticipants,
  useTracks,
  VideoTrack,
  isTrackReference,
} from "@livekit/react-native";
import { Track } from "livekit-client";
import { Text } from "../../../shared/components";
import { colors, spacing } from "../../../shared/theme";

interface LiveKitCallRoomProps {
  token: string;
  url: string;
  callType: "voice" | "video";
  onConnected?: () => void;
  children?: React.ReactNode;
}

function ParticipantCount() {
  const participants = useParticipants();
  if (participants.length <= 1) return null;
  return (
    <Text variant="footnote" muted style={styles.participantCount}>
      {participants.length} in call
    </Text>
  );
}

function RemoteVideoTiles() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);

  const videoTracks = tracks.filter(
    (t) => isTrackReference(t) && t.publication.source === Track.Source.Camera,
  );

  if (videoTracks.length === 0) {
    return (
      <Text variant="body" muted style={styles.placeholder}>
        Connected — waiting for video…
      </Text>
    );
  }

  return (
    <View style={[styles.videoGrid, videoTracks.length > 2 && styles.videoGridMulti]}>
      {videoTracks.map((trackRef) =>
        isTrackReference(trackRef) ? (
          <VideoTrack
            key={trackRef.publication.trackSid}
            trackRef={trackRef}
            style={videoTracks.length > 2 ? styles.videoTile : styles.video}
          />
        ) : null,
      )}
    </View>
  );
}

export function LiveKitCallRoom({
  token,
  url,
  callType,
  onConnected,
  children,
}: LiveKitCallRoomProps) {
  useEffect(() => {
    AudioSession.startAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect
      audio
      video={callType === "video"}
      onConnected={onConnected}
    >
      <ParticipantCount />
      {callType === "video" ? <RemoteVideoTiles /> : null}
      {children}
    </LiveKitRoom>
  );
}

const styles = StyleSheet.create({
  videoGrid: {
    flex: 1,
    width: "100%",
    padding: spacing.md,
    gap: spacing.sm,
  },
  videoGridMulti: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.background.tertiary,
  },
  videoTile: {
    width: "48%",
    height: 160,
  },
  placeholder: {
    textAlign: "center",
    padding: spacing.lg,
  },
  participantCount: {
    textAlign: "center",
    paddingTop: spacing.sm,
  },
});
