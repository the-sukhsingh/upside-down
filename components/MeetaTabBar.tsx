/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors, { type M3ColorScheme } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export interface MeetaTabBarProps {
  state: {
    index: number;
    routes: {
      key: string;
      name: string;
      params?: any;
    }[];
  };
  descriptors: Record<string, any>;
  navigation: {
    emit: (event: any) => any;
    navigate: (name: string, params?: any) => void;
  };
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

interface TabConfig {
  name: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    name: 'index',
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  meetings: {
    name: 'meetings',
    label: 'Schedule',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  record: {
    name: 'record',
    label: 'Record',
    activeIcon: 'mic',
    inactiveIcon: 'mic-outline',
  },
  notes: {
    name: 'notes',
    label: 'Notes',
    activeIcon: 'document-text',
    inactiveIcon: 'document-text-outline',
  },
  settings: {
    name: 'settings',
    label: 'Settings',
    activeIcon: 'settings',
    inactiveIcon: 'settings-outline',
  },
};

const PADDING_H = 8;

// Snappy, energetic spring physics for fast, clean 60fps tab transition (~180ms)
const SPRING_CONFIG: WithSpringConfig = {
  damping: 32,
  stiffness: 460,
  mass: 0.45,
};

// Snappy micro-interaction spring for button press down/up
const PRESS_SPRING_CONFIG: WithSpringConfig = {
  damping: 18,
  stiffness: 550,
  mass: 0.35,
};

interface MeetaTabItemProps {
  route: {
    key: string;
    name: string;
    params?: any;
  };
  index: number;
  activeIndex: number;
  label: string;
  config: TabConfig;
  colors: M3ColorScheme;
  activeWidth: number;
  inactiveWidth: number;
  shift: number;
  onPress: () => void;
  onLongPress: () => void;
  onActivePress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

const MeetaTabItem = memo(function MeetaTabItem({
  route,
  index,
  activeIndex,
  label,
  config,
  colors,
  activeWidth,
  inactiveWidth,
  shift,
  onPress,
  onLongPress,
  onActivePress,
  accessibilityLabel,
  testID,
}: MeetaTabItemProps) {
  const isFocused = index === activeIndex;

  const targetX =
    index <= activeIndex
      ? index * inactiveWidth
      : index * inactiveWidth + shift;
  const targetWidth = isFocused ? activeWidth : inactiveWidth;

  const translateX = useSharedValue(targetX);
  const width = useSharedValue(targetWidth);
  const progress = useSharedValue(isFocused ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withSpring(targetX, SPRING_CONFIG);
    width.value = withSpring(targetWidth, SPRING_CONFIG);
    progress.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
  }, [targetX, targetWidth, isFocused, translateX, width, progress]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      width: width.value,
      transform: [
        { translateX: translateX.value },
        { scale: pressScale.value },
      ],
    };
  });

  const inactiveIconStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - progress.value,
      transform: [
        {
          scale: interpolate(
            progress.value,
            [0, 1],
            [1, 0.85],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const activeIconStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [
        {
          scale: interpolate(
            progress.value,
            [0, 1],
            [0.85, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const maxLabelWidth = Math.max(activeWidth - 44, 48);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        progress.value,
        [0, 0.2, 1],
        [0, 0.5, 1],
        Extrapolation.CLAMP
      ),
      maxWidth: interpolate(
        progress.value,
        [0, 1],
        [0, maxLabelWidth],
        Extrapolation.CLAMP
      ),
      marginLeft: interpolate(
        progress.value,
        [0, 1],
        [0, 6],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            progress.value,
            [0, 1],
            [0.92, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const handlePressIn = () => {
    pressScale.value = withSpring(0.93, PRESS_SPRING_CONFIG);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, PRESS_SPRING_CONFIG);
  };

  const handlePress = () => {
    if (isFocused) {
      onActivePress();
    }
    onPress();
  };

  return (
    <Animated.View style={[styles.tabItemContainer, animatedContainerStyle]}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={accessibilityLabel || label}
        testID={testID}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={onLongPress}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        style={styles.tabPressable}>
        <View style={styles.tabContentRow}>
          <View style={styles.iconWrapper}>
            <Animated.View style={[styles.iconAbsolute, inactiveIconStyle]}>
              <Ionicons
                name={config.inactiveIcon}
                size={22}
                color={colors.textMuted}
              />
            </Animated.View>
            <Animated.View style={[styles.iconAbsolute, activeIconStyle]}>
              <Ionicons
                name={config.activeIcon}
                size={19}
                color="#FFFFFF"
              />
            </Animated.View>
          </View>

          <Animated.View style={[styles.labelContainer, labelAnimatedStyle]}>
            <Text
              numberOfLines={1}
              ellipsizeMode="clip"
              style={styles.activeCapsuleText}>
              {label}
            </Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

export function MeetaTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: MeetaTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const initialWidth = Math.min(
    Dimensions.get('window').width * 0.92,
    420
  );
  const [containerWidth, setContainerWidth] = useState(initialWidth);

  const numTabs = state.routes.length || 5;
  const innerWidth = Math.max(containerWidth - PADDING_H * 2, 200);

  const activeWidth = Math.min(
    Math.max(Math.round(innerWidth * 0.30), 98),
    114
  );
  const inactiveWidth = (innerWidth - activeWidth) / Math.max(numTabs - 1, 1);
  const shift = activeWidth - inactiveWidth;

  const targetPillX = state.index * inactiveWidth;

  const pillTranslateX = useSharedValue(targetPillX);
  const pillWidth = useSharedValue(activeWidth);
  const pillScale = useSharedValue(1);

  useEffect(() => {
    pillTranslateX.value = withSpring(targetPillX, SPRING_CONFIG);
    pillWidth.value = withSpring(activeWidth, SPRING_CONFIG);
  }, [targetPillX, activeWidth, pillTranslateX, pillWidth]);

  const onActivePress = useCallback(() => {
    pillScale.value = withSequence(
      withTiming(0.95, { duration: 60 }),
      withSpring(1, SPRING_CONFIG)
    );
  }, [pillScale]);

  const onDockLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const width = e.nativeEvent.layout.width;
      if (width > 0 && Math.abs(width - containerWidth) > 1) {
        setContainerWidth(width);
      }
    },
    [containerWidth]
  );

  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      width: pillWidth.value,
      transform: [
        { translateX: pillTranslateX.value },
        { scale: pillScale.value },
      ],
    };
  });

  return (
    <View
      style={[
        styles.dockWrapper,
        {
          bottom: Math.max(insets.bottom, 12),
        },
      ]}>
      <View
        onLayout={onDockLayout}
        style={[
          styles.dockContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: '#000000',
          },
        ]}>
        {/* Animated Sliding Active Background Indicator Pill */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            animatedPillStyle,
            {
              backgroundColor: colors.primary,
            },
          ]}
        />

        {/* Tab Items */}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const options = descriptors[route.key]?.options;
          const config = TAB_CONFIGS[route.name] || {
            name: route.name,
            label: route.name,
            activeIcon: 'apps' as const,
            inactiveIcon: 'apps-outline' as const,
          };

          const rawLabel =
            options?.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options?.title !== undefined
              ? options.title
              : config.label;
          const label = typeof rawLabel === 'string' ? rawLabel : config.label;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <MeetaTabItem
              key={route.key}
              route={route}
              index={index}
              activeIndex={state.index}
              label={label}
              config={config}
              colors={colors}
              activeWidth={activeWidth}
              inactiveWidth={inactiveWidth}
              shift={shift}
              onPress={onPress}
              onLongPress={onLongPress}
              onActivePress={onActivePress}
              accessibilityLabel={options?.tabBarAccessibilityLabel}
              testID={options?.tabBarTestID}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  dockContainer: {
    position: 'relative',
    height: 64,
    borderRadius: 36,
    width: '92%',
    maxWidth: 420,
    borderWidth: 1,
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          userSelect: 'none',
        }
      : {}),
  },
  activePill: {
    position: 'absolute',
    top: 10,
    left: PADDING_H,
    height: 44,
    borderRadius: 22,
    shadowColor: '#E06D53',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1,
  },
  tabItemContainer: {
    position: 'absolute',
    top: 0,
    left: PADDING_H,
    height: 64,
    zIndex: 2,
  },
  tabPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  activeCapsuleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },
});
