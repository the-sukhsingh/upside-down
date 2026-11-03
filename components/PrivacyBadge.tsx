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
            backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)',
            borderColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
            opacity: pressed ? 0.8 : 1,
          },
        ]}>
        <View style={styles.pulseDot} />
        <Ionicons name="shield-checkmark" size={13} color="#10B981" style={{ marginRight: 5 }} />
        <Text style={styles.label}>
          {compact ? '100% On-Device' : '🔒 100% On-Device / Zero-Cloud'}
        </Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.shieldIconWrap}>
                <Ionicons name="shield-checkmark" size={26} color="#10B981" />
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
                <Ionicons name="mic-off-outline" size={18} color="#10B981" style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '700' }}>Offline Audio:</Text> Raw audio is recorded directly into 16kHz PCM WAV format and stored in your device&apos;s sandbox.
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="hardware-chip-outline" size={18} color="#10B981" style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '700' }}>Local Whisper STT:</Text> Audio is transcribed natively via C++ bindings without any remote server transmission.
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="airplane-outline" size={18} color="#10B981" style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '700' }}>Air-Gap Capable:</Text> Works seamlessly in airplane mode. You hold 100% ownership of your meeting intelligence.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.closeButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.closeButtonText, { color: colors.primaryText }]}>Got it</Text>
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
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
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
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
