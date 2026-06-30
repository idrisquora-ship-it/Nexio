import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Pause, Play } from "lucide-react-native";
import { Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";
import { parseMediaMetadata, type MediaMetadata } from "../api/messagingApi";

const SPEEDS = [0.5, 1, 1.5, 2] as const;

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

interface VoiceNotePlayerProps {
  uri: string;
  metadata?: MediaMetadata | null;
  isOwn: boolean;
}

export function VoiceNotePlayer({ uri, metadata, isOwn }: VoiceNotePlayerProps) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const [speedIndex, setSpeedIndex] = useState(1);

  const waveform = metadata?.waveform ?? Array.from({ length: 20 }, (_, i) => 0.3 + (i % 5) * 0.12);
  const durationMs = status.duration > 0 ? status.duration * 1000 : (metadata?.durationMs ?? 0);
  const currentMs = status.currentTime * 1000;
  const progress = durationMs > 0 ? currentMs / durationMs : 0;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, []);

  useEffect(() => {
    player.playbackRate = SPEEDS[speedIndex];
  }, [player, speedIndex]);

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const cycleSpeed = () => {
    setSpeedIndex((i) => (i + 1) % SPEEDS.length);
  };

  const seekTo = (ratio: number) => {
    if (durationMs <= 0) return;
    player.seekTo((durationMs / 1000) * ratio);
  };

  const accent = isOwn ? colors.text.inverse : colors.brand.primary;
  const barBg = isOwn ? "rgba(255,255,255,0.35)" : colors.background.tertiary;

  return (
    <View style={styles.container}>
      <Pressable onPress={togglePlay} style={styles.playBtn} accessibilityRole="button">
        {status.playing ? (
          <Pause color={accent} size={20} />
        ) : (
          <Play color={accent} size={20} />
        )}
      </Pressable>

      <Pressable style={styles.waveWrap} onPress={(e) => {
        const x = e.nativeEvent.locationX;
        const width = 160;
        seekTo(Math.min(1, Math.max(0, x / width)));
      }}>
        <View style={styles.waveRow}>
          {waveform.map((h, i) => {
            const filled = i / waveform.length <= progress;
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: 6 + h * 22,
                    backgroundColor: filled ? accent : barBg,
                  },
                ]}
              />
            );
          })}
        </View>
      </Pressable>

      <Pressable onPress={cycleSpeed} style={styles.speedBtn}>
        <Text variant="footnote" style={isOwn ? styles.ownText : undefined}>
          {SPEEDS[speedIndex]}x
        </Text>
      </Pressable>

      <Text variant="footnote" style={[styles.time, isOwn ? styles.ownText : undefined]}>
        {formatDuration(currentMs || durationMs)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 220,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  waveWrap: {
    flex: 1,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 32,
    width: 160,
  },
  bar: {
    width: 3,
    borderRadius: radius.sm,
  },
  speedBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  time: {
    minWidth: 36,
    textAlign: "right",
  },
  ownText: {
    color: colors.text.inverse,
  },
});
