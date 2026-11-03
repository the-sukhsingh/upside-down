import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { EvidenceCitation } from '@/types/meeting';

interface EvidenceTagProps {
  evidence?: EvidenceCitation;
  onPressEvidence?: (startTime: number, label: string) => void;
  compact?: boolean;
}

export function EvidenceTag({ evidence, onPressEvidence, compact = false }: EvidenceTagProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  if (!evidence || evidence.startTime === undefined) return null;

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

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderColor: colors.primary,
        },
        compact && styles.compactContainer,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Listen to audio evidence at ${timeLabel}`}>
      <Ionicons name="volume-medium" size={compact ? 11 : 13} color={colors.primary} />
      <Text style={[styles.text, { color: colors.primary }, compact && styles.compactText]}>
        {timeLabel}
      </Text>
      <Ionicons name="arrow-forward-circle" size={11} color={colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  compactContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  compactText: {
    fontSize: 10,
  },
});

