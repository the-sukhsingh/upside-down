import React, { useEffect, useState } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { View } from './Themed';
import { useColorScheme } from './useColorScheme';

interface WaveformVisualizerProps {
  isRecording: boolean;
  isPaused: boolean;
  meterLevel?: number; // 0 to 1
  barCount?: number;
}

export function WaveformVisualizer({
  isRecording,
  isPaused,
  meterLevel = 0.3,
  barCount = 28,
}: WaveformVisualizerProps) {
  const theme = useColorScheme();

  // Create animated values for each bar using stable state initializer
  const [animatedValues] = useState(() =>
    Array.from({ length: barCount }, () => new Animated.Value(6))
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        // Animate each bar to random heights scaled by meterLevel
        animatedValues.forEach((val, idx) => {
          // Create natural sound wave curve (higher in middle, lower at edges)
          const centerFactor = 1 - Math.abs(idx - barCount / 2) / (barCount / 2);
          const baseHeight = 8;
          const variance = Math.random() * 48 * Math.max(0.2, meterLevel) * (0.4 + 0.6 * centerFactor);
          const targetHeight = Math.min(60, Math.max(6, baseHeight + variance));

          Animated.timing(val, {
            toValue: targetHeight,
            duration: 120,
            useNativeDriver: false,
          }).start();
        });
      }, 130);
    } else {
      // Settle down to minimal idle height
      animatedValues.forEach((val) => {
        Animated.timing(val, {
          toValue: 6,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, meterLevel, barCount, animatedValues]);

  return (
    <View style={styles.container}>
      {animatedValues.map((animHeight, index) => {
        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: animHeight,
                backgroundColor: isRecording
                  ? isPaused
                    ? '#F5C242'
                    : '#E06D53'
                  : theme === 'dark'
                  ? '#44474E'
                  : '#E0DCD6',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    gap: 3,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
  },
});
