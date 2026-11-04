import React from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { EvidenceCitation } from '@/types/meeting';

interface EvidenceTagProps {
  evidence?: EvidenceCitation;
  onPressEvidence?: (startTime: number, label: string) => void;
  compact?: boolean;
  isPlaying?: boolean;
}

export function EvidenceTag({
  evidence,
  onPressEvidence,
  compact = false,
  isPlaying = false,
}: EvidenceTagProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  const hasTimestamp = evidence && evidence.startTime !== undefined;

  if (!evidence) return null;

  if (!hasTimestamp) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: 'transparent',
            borderColor: colors.borderStrong,
            borderStyle: 'dashed',
          },
        ]}>
        <Ionicons name="time-outline" size={12} color={colors.textFaint} />
        <Text style={[styles.text, { color: colors.textFaint }]}>No timestamp</Text>
      </View>
    );
  }

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timeLabel = formatSecs(evidence.startTime);

  const handlePress = () => {
    if (onPressEvidence) {
      onPressEvidence(
        evidence.startTime,
        evidence.quote ? `"${evidence.quote.slice(0, 32)}..." at ${timeLabel}` : `Evidence at ${timeLabel}`
      );
    }
  };

  const currentTextColor = isPlaying ? colors.onPrimaryTonal : colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: isPlaying ? colors.primaryTonal : colors.primarySoft,
          borderColor: isPlaying ? colors.primaryTonal : colors.primarySoft,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Listen to audio evidence at ${timeLabel}`}>
      <Ionicons name="volume-medium" size={12} color={currentTextColor} />
      <Text style={[styles.text, { color: currentTextColor }]}>
        {timeLabel}
      </Text>
      <Ionicons name="arrow-forward-circle" size={12} color={currentTextColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500',
    fontFamily: Platform.select({ web: 'Geist Mono, monospace', default: 'GeistMono-Medium' }),
    fontVariant: ['tabular-nums'],
  },
});

