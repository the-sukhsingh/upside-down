import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

interface RecordingPlayerProps {
  uri: string;
  durationSeconds: number;
}

export function RecordingPlayer({ uri, durationSeconds }: RecordingPlayerProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  // expo-audio player hook
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);

  const isPlaying = Boolean(status.playing);
  const currentTime = Math.floor(status.currentTime || 0);
  const totalDuration = status.duration ? Math.floor(status.duration) : durationSeconds;

  const togglePlay = () => {
    try {
      if (isPlaying) {
        player.pause();
      } else {
        if (status.currentTime && status.duration && status.currentTime >= status.duration) {
          player.seekTo(0);
        }
        player.play();
      }
    } catch (err) {
      console.warn('Audio playback notice:', err);
    }
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <TouchableOpacity
        onPress={togglePlay}
        style={[styles.playBtn, { backgroundColor: colors.primary }]}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={16}
          color={colors.primaryText}
          style={!isPlaying ? { marginLeft: 2 } : undefined}
        />
      </TouchableOpacity>

      <View style={styles.trackInfo}>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.text }]}>{formatSecs(currentTime)}</Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatSecs(totalDuration)}</Text>
        </View>

        <View style={[styles.progressBarBg, { backgroundColor: colors.cardBorder }]}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.tint }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    gap: 12,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
