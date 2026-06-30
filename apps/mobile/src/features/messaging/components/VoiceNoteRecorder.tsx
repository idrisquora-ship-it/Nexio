import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Mic, Trash2 } from "lucide-react-native";
import { Button, Text } from "../../../shared/components";
import { colors, radius, spacing } from "../../../shared/theme";

function generateWaveform(length = 24): number[] {
  return Array.from({ length }, () => 0.2 + Math.random() * 0.8);
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

interface VoiceNoteRecorderProps {
  onSend: (uri: string, durationMs: number, waveform: number[]) => void;
  onCancel: () => void;
}

export function VoiceNoteRecorder({ onSend, onCancel }: VoiceNoteRecorderProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>(generateWaveform());
  const [durationMs, setDurationMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => undefined);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) return;

    await recorder.prepareToRecordAsync();
    recorder.record();
    setWaveform(generateWaveform());
    setDurationMs(0);

    intervalRef.current = setInterval(() => {
      setDurationMs((d) => d + 200);
      setWaveform((prev) => {
        const next = [...prev.slice(1), 0.2 + Math.random() * 0.8];
        return next;
      });
    }, 200);
  };

  const stopRecording = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    await recorder.stop();
    const uri = recorder.uri;
    if (uri) {
      setPreviewUri(uri);
      setDurationMs(state.durationMillis || durationMs);
    }
  };

  const handleSend = () => {
    if (previewUri) {
      onSend(previewUri, durationMs || state.durationMillis, waveform);
    }
  };

  const isRecording = state.isRecording;

  return (
    <View style={styles.container}>
      <View style={styles.waveRow}>
        {waveform.map((h, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: 8 + h * 28,
                backgroundColor: isRecording ? colors.brand.primary : colors.text.tertiary,
              },
            ]}
          />
        ))}
      </View>

      <Text variant="footnote" muted style={styles.timer}>
        {formatDuration(isRecording ? state.durationMillis : durationMs)}
      </Text>

      {previewUri ? (
        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={styles.iconBtn}>
            <Trash2 color={colors.semantic.error} size={22} />
          </Pressable>
          <Button label="Send voice note" onPress={handleSend} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={styles.iconBtn}>
            <Trash2 color={colors.text.tertiary} size={22} />
          </Pressable>
          <Pressable
            onPressIn={startRecording}
            onPressOut={stopRecording}
            style={[styles.micBtn, isRecording && styles.micActive]}
            accessibilityRole="button"
          >
            <Mic color={colors.text.inverse} size={24} />
          </Pressable>
          <Text variant="footnote" muted>
            Hold to record
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    height: 40,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  timer: {
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  iconBtn: {
    padding: spacing.sm,
  },
  micBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  micActive: {
    transform: [{ scale: 1.1 }],
  },
});
