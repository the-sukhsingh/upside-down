import React, { useState } from 'react';
import { StyleSheet, Pressable, Modal, TouchableOpacity } from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

interface PrivacyBadgeProps {
  compact?: boolean;
}

export function PrivacyBadge({ compact = false }: PrivacyBadgeProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: colors.secondaryContainer,
            borderColor: colors.secondary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}>
        <View style={[styles.pulseDot, { backgroundColor: colors.secondary }]} />
        <Ionicons name="shield-checkmark" size={13} color={colors.secondary} style={{ marginRight: 5 }} />
        <Text style={[styles.label, { color: colors.secondary }]}>
          {compact ? '100% On-Device' : '🔒 100% On-Device / Zero-Cloud'}
        </Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.shieldIconWrap, { backgroundColor: colors.secondaryContainer }]}>
                <Ionicons name="shield-checkmark" size={26} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Local-First Privacy Guarantee</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Your voice and notes never leave this device
                </Text>
              </View>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Ionicons name="mic-off-outline" size={18} color={colors.secondary} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '600' }}>Offline Audio:</Text> Raw audio is recorded directly into 16kHz PCM WAV format and stored in your device&apos;s sandbox.
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="hardware-chip-outline" size={18} color={colors.secondary} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '600' }}>Local Whisper STT:</Text> Audio is transcribed natively via C++ bindings without any remote server transmission.
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="airplane-outline" size={18} color={colors.secondary} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '600' }}>Air-Gap Capable:</Text> Works seamlessly in airplane mode. You hold 100% ownership of your meeting intelligence.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.closeButton, { backgroundColor: colors.primaryTonal }]}>
              <Text style={[styles.closeButtonText, { color: colors.onPrimaryTonal }]}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 11, 15, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  shieldIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  infoList: {
    gap: 14,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
