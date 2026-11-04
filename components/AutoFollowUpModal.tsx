import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { Recording, FollowUpTone, FollowUpDraft } from '@/types/meeting';
import { followUpService } from '@/services/followUpService';

interface AutoFollowUpModalProps {
  visible: boolean;
  recording: Recording;
  onClose: () => void;
  onCopySuccess: () => void;
}

export function AutoFollowUpModal({
  visible,
  recording,
  onClose,
  onCopySuccess,
}: AutoFollowUpModalProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  const [activeTone, setActiveTone] = useState<FollowUpTone>('executive');
  const [draft, setDraft] = useState<FollowUpDraft | null>(null);
  const [editedBody, setEditedBody] = useState('');
  const [editedSubject, setEditedSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (visible && recording) {
      loadDraft(activeTone);
    }
  }, [visible, activeTone, recording?.id]);

  const loadDraft = async (tone: FollowUpTone) => {
    setIsGenerating(true);
    try {
      const result = await followUpService.generateDraft(recording, tone);
      setDraft(result);
      setEditedSubject(result.subject || `Recap: ${recording.meetingTitle}`);
      setEditedBody(result.body);
    } catch (err) {
      console.warn('Failed to generate follow up draft:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const fullText = draft?.channel === 'email' && editedSubject
      ? `Subject: ${editedSubject}\n\n${editedBody}`
      : editedBody;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
    }
    onCopySuccess();
  };

  const handleOpenEmail = async () => {
    const mailto = `mailto:?subject=${encodeURIComponent(editedSubject)}&body=${encodeURIComponent(editedBody)}`;
    try {
      await Linking.openURL(mailto);
    } catch (e) {
      console.warn('Mail app notice:', e);
    }
  };

  const handleOpenWhatsApp = async () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(editedBody)}`;
    try {
      await Linking.openURL(waUrl);
    } catch (e) {
      console.warn('WhatsApp notice:', e);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="paper-plane-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.headerTexts}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Auto Follow-Up Draft</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  One-tap ready to send recap in your chosen tone
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tone Selector Chips */}
          <View style={styles.toneSelectorRow}>
            {[
              { id: 'executive', label: '👔 Executive', icon: 'briefcase-outline' },
              { id: 'casual', label: '💬 Casual', icon: 'chatbubble-outline' },
              { id: 'whatsapp', label: '🟢 WhatsApp', icon: 'logo-whatsapp' },
              { id: 'action_oriented', label: '🎯 Action-Only', icon: 'checkbox-outline' },
            ].map((t) => {
              const isSelected = activeTone === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setActiveTone(t.id as FollowUpTone)}
                  style={[
                    styles.toneChip,
                    {
                      backgroundColor: isSelected ? colors.primaryTonal : colors.surfaceContainer,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.toneChipText,
                      { color: isSelected ? colors.onPrimaryTonal : colors.text },
                    ]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Email Subject Field (if not whatsapp) */}
          {activeTone !== 'whatsapp' ? (
            <View style={[styles.fieldBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Subject:</Text>
              <TextInput
                value={editedSubject}
                onChangeText={setEditedSubject}
                style={[styles.subjectInput, { color: colors.text }]}
                placeholder="Subject line..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          ) : null}

          {/* Message Body Editor */}
          <ScrollView style={styles.editorScroll} showsVerticalScrollIndicator={false}>
            <TextInput
              value={editedBody}
              onChangeText={setEditedBody}
              multiline
              style={[
                styles.bodyInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.border,
                },
              ]}
              placeholder={isGenerating ? 'Generating follow-up with AI...' : 'Message body...'}
              placeholderTextColor={colors.textSecondary}
            />
          </ScrollView>

          {/* Send / Action Toolbar */}
          <View style={[styles.actionBar, { borderTopColor: colors.border }]}>
            {/* Copy Button */}
            <TouchableOpacity
              onPress={handleCopy}
              style={[styles.actionBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <Ionicons name="copy-outline" size={16} color={colors.text} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>Copy</Text>
            </TouchableOpacity>

            {/* WhatsApp Send Button */}
            <TouchableOpacity
              onPress={handleOpenWhatsApp}
              style={[styles.actionBtn, { backgroundColor: colors.secondaryContainer, borderColor: colors.secondary }]}>
              <Ionicons name="logo-whatsapp" size={16} color={colors.onSecondaryContainer} />
              <Text style={[styles.actionBtnText, { color: colors.onSecondaryContainer }]}>WhatsApp</Text>
            </TouchableOpacity>

            {/* Email Send Button */}
            <TouchableOpacity
              onPress={handleOpenEmail}
              style={[styles.actionBtn, { backgroundColor: colors.primaryTonal, borderColor: colors.primary }]}>
              <Ionicons name="mail" size={16} color={colors.onPrimaryTonal} />
              <Text style={[styles.actionBtnText, { color: colors.onPrimaryTonal }]}>Send Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 11, 15, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  toneSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  toneChip: {
    paddingHorizontal: 12,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
  },
  toneChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    fontWeight: '500',
  },
  editorScroll: {
    maxHeight: 280,
    backgroundColor: 'transparent',
  },
  bodyInput: {
    minHeight: 180,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    fontSize: 13,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  actionBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

