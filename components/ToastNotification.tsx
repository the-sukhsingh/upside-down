import React, { useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from './Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

export interface ToastConfig {
  id?: string;
  type?: 'processing' | 'success' | 'info' | 'error';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number; // ms, 0 for persistent
}

interface ToastNotificationProps {
  toast: ToastConfig | null;
  onDismiss: () => void;
  topOffset?: number;
}

export function ToastNotification({
  toast,
  onDismiss,
  topOffset = 54,
}: ToastNotificationProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  useEffect(() => {
    if (!toast) return;

    const autoDuration = toast.duration ?? (toast.type === 'processing' ? 0 : 4500);
    if (autoDuration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDuration);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isProcessing = toast.type === 'processing';
  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  const accentColor = isProcessing
    ? colors.coral
    : isSuccess
    ? '#10B981'
    : isError
    ? '#EF4444'
    : colors.tint;

  const iconBg = isProcessing
    ? colors.coralLight
    : isSuccess
    ? '#D1FAE5'
    : isError
    ? '#FEE2E2'
    : colors.surfaceContainer;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16)}
      exiting={FadeOutUp.duration(180)}
      style={[styles.toastWrapper, { top: topOffset }]}
      pointerEvents="box-none">
      <View
        style={[
          styles.toastCard,
          {
            backgroundColor: theme === 'dark' ? '#1E2024' : '#FFFFFF',
            borderColor: colors.border,
            shadowColor: '#000000',
          },
        ]}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Ionicons
              name={
                isSuccess
                  ? 'checkmark-circle'
                  : isError
                  ? 'alert-circle'
                  : 'information-circle'
              }
              size={18}
              color={accentColor}
            />
          )}
        </View>

        <View style={styles.textContent}>
          <Text style={[styles.toastTitle, { color: colors.text }]} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.message && (
            <Text style={[styles.toastMessage, { color: colors.textSecondary }]} numberOfLines={2}>
              {toast.message}
            </Text>
          )}
        </View>

        {toast.actionLabel && toast.onAction ? (
          <TouchableOpacity
            onPress={() => {
              toast.onAction?.();
              onDismiss();
            }}
            style={[styles.actionBtn, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              {toast.actionLabel}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    letterSpacing: -0.1,
  },
  toastMessage: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    fontWeight: '400',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  dismissBtn: {
    padding: 4,
  },
});
