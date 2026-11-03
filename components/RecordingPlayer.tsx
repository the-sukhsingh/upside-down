import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

export interface SeekTarget {
  second: number;
  triggerKey: number;
  label?: string;
}

interface RecordingPlayerProps {
  uri: string;
  durationSeconds: number;
  seekTarget?: SeekTarget | null;
  onCurrentTimeChange?: (time: number) => void;
}

export function RecordingPlayer({
  uri,
  durationSeconds,
  seekTarget,
  onCurrentTimeChange,
}: RecordingPlayerProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  // expo-audio player hook
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);

  const isPlaying = Boolean(status.playing);
  const currentTime = Math.floor(status.currentTime || 0);
  const totalDuration = status.duration ? Math.floor(status.duration) : durationSeconds;

  // Sync external seek triggers (e.g. from Evidence links)
  useEffect(() => {
    if (seekTarget && seekTarget.second !== undefined) {
      try {
        player.seekTo(seekTarget.second);
        player.play();
      } catch (err) {
        console.warn('Seek notice:', err);
      }
    }
  }, [seekTarget?.triggerKey, seekTarget?.second]);

  useEffect(() => {
    if (onCurrentTimeChange) {
      onCurrentTimeChange(currentTime);
    }
  }, [currentTime]);

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

  const skipSeconds = (delta: number) => {
    try {
      const nextTime = Math.max(0, Math.min(totalDuration, currentTime + delta));
      player.seekTo(nextTime);
    } catch (err) {
      console.warn('Skip error:', err);
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
      {/* Evidence jumping banner if active */}
      {seekTarget?.label ? (
        <View style={[styles.evidenceBadgeRow, { backgroundColor: colors.surfaceContainerLow }]}>
          <Ionicons name="volume-medium" size={13} color={colors.primary} />
          <Text style={[styles.evidenceBadgeText, { color: colors.textSecondary }]}>
            Playing original audio: <Text style={{ color: colors.primary, fontWeight: '600' }}>{seekTarget.label}</Text>
          </Text>
        </View>
      ) : null}

      <View style={styles.mainPlayerRow}>
        {/* Rewind 5s */}
        <TouchableOpacity
          onPress={() => skipSeconds(-5)}
          style={[styles.skipBtn, { backgroundColor: colors.surfaceContainer }]}
          accessibilityLabel="Rewind 5 seconds">
          <Ionicons name="play-back" size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <TouchableOpacity
          onPress={togglePlay}
          style={[styles.playBtn, { backgroundColor: colors.primary }]}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color={colors.primaryText}
            style={!isPlaying ? { marginLeft: 2 } : undefined}
          />
        </TouchableOpacity>

        {/* Forward 5s */}
        <TouchableOpacity
          onPress={() => skipSeconds(5)}
          style={[styles.skipBtn, { backgroundColor: colors.surfaceContainer }]}
          accessibilityLabel="Fast forward 5 seconds">
          <Ionicons name="play-forward" size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Track & Time */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  evidenceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  evidenceBadgeText: {
    fontSize: 11,
  },
  mainPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  skipBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
    backgroundColor: 'transparent',
    marginLeft: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  progressBarBg: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
});
