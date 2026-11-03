import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, Animated } from 'react-native';
import { View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

interface AudioRecordButtonProps {
  isRecording: boolean;
  isPaused: boolean;
  onPressRecord: () => void;
  onPressPause?: () => void;
  onPressStop?: () => void;
  size?: number;
}

export function AudioRecordButton({
  isRecording,
  isPaused,
  onPressRecord,
  onPressPause,
  onPressStop,
  size = 76,
}: AudioRecordButtonProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isRecording && !isPaused) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isRecording, isPaused, pulseAnim]);

  if (!isRecording) {
    // Idle state: Google Recorder M3 Large Record Button
    return (
      <View style={styles.idleContainer}>
        <Pressable
          onPress={onPressRecord}
          style={({ pressed }) => [
            styles.m3RecordCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.primaryContainer,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}>
          <View
            style={[
              styles.m3InnerDot,
              {
                backgroundColor: colors.primary,
              },
            ]}
          />
        </Pressable>
      </View>
    );
  }

  // Active recording deck: Stop & Pause
  return (
    <View style={styles.activeDeck}>
      {/* Pause/Resume M3 Filled Tonal button */}
      {onPressPause ? (
        <Pressable
          onPress={onPressPause}
          style={({ pressed }) => [
            styles.m3ControlBtn,
            {
              width: size * 0.72,
              height: size * 0.72,
              borderRadius: (size * 0.72) / 2,
              backgroundColor: isPaused ? colors.secondaryContainer : colors.surfaceContainerHighest,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}>
          <Ionicons
            name={isPaused ? 'play' : 'pause'}
            size={22}
            color={isPaused ? colors.onSecondaryContainer : colors.onSurface}
          />
        </Pressable>
      ) : null}

      {/* Main Stop & Save button with M3 animated pulse ring */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size * 1.3,
              height: size * 1.3,
              borderRadius: (size * 1.3) / 2,
              backgroundColor: colors.errorContainer,
              transform: [{ scale: pulseAnim }],
              opacity: isPaused ? 0 : 0.45,
            },
          ]}
        />
        <Pressable
          onPress={onPressStop}
          style={({ pressed }) => [
            styles.m3StopCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.error,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}>
          <View style={[styles.m3StopInnerSquare, { backgroundColor: colors.onError }]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  idleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  m3RecordCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  m3InnerDot: {
    width: '44%',
    height: '44%',
    borderRadius: 999,
  },
  activeDeck: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    backgroundColor: 'transparent',
  },
  m3ControlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pulseRing: {
    position: 'absolute',
  },
  m3StopCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  m3StopInnerSquare: {
    width: '36%',
    height: '36%',
    borderRadius: 6,
  },
});
