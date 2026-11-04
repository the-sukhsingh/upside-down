import React from 'react';
import {
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { View, Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useMeetingStore } from '@/store/meetingStore';
import { LiveContextMatch } from '@/types/meeting';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface NotePeekModalProps {
  visible: boolean;
  contextMatch: LiveContextMatch | null;
  onClose: () => void;
  onPin?: (match: LiveContextMatch) => void;
}

export function NotePeekModal({
  visible,
  contextMatch,
  onClose,
  onPin,
}: NotePeekModalProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  const { recordings } = useMeetingStore();

  if (!contextMatch) return null;

  const fullRecording = recordings.find((r) => r.id === contextMatch.recordingId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="bulb" size={18} color={colors.primary} />
              </View>
              <View style={styles.titleCol}>
                <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={1}>
                  {contextMatch.meetingTitle}
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                  {contextMatch.date} · Topic: {contextMatch.matchedTopic}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content Scroll */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* AI Real-time Briefing */}
            {contextMatch.aiSynthesis && (
              <View
                style={[
                  styles.aiBriefCard,
                  { backgroundColor: colors.surfaceContainerLow, borderColor: colors.primary },
                ]}>
                <View style={styles.aiBriefHeader}>
                  <Ionicons name="flash" size={14} color={colors.primary} />
                  <Text style={[styles.aiBriefLabel, { color: colors.primary }]}>
                    LIVE RECALL BRIEF
                  </Text>
                </View>
                <Text style={[styles.aiBriefText, { color: colors.text }]}>
                  {contextMatch.aiSynthesis}
                </Text>
              </View>
            )}

            {/* Key Decisions */}
            {contextMatch.keyDecisions.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="checkmark-done-circle" size={16} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Previous Key Decisions ({contextMatch.keyDecisions.length})
                  </Text>
                </View>
                {contextMatch.keyDecisions.map((decision, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.decisionItem,
                      { backgroundColor: colors.surfaceContainer, borderColor: colors.cardBorder },
                    ]}>
                    <Text style={[styles.decisionText, { color: colors.text }]}>
                      • {decision}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Open Commitments ("Promise Radar") */}
            {contextMatch.openCommitments.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Pending Commitments ({contextMatch.openCommitments.length})
                  </Text>
                </View>
                {contextMatch.openCommitments.map((com) => {
                  const isTheyOwe = com.direction === 'they_owe_me';
                  const dirColor = isTheyOwe ? colors.secondary : colors.primary;
                  return (
                    <View
                      key={com.id}
                      style={[
                        styles.commitmentItem,
                        {
                          backgroundColor: colors.surfaceContainer,
                          borderColor: colors.border,
                        },
                      ]}>
                      <View style={styles.commitmentHeaderRow}>
                        <Text style={[styles.commitmentDirection, { color: dirColor }]}>
                          {isTheyOwe ? 'THEY OWE ME' : 'I OWE'}
                        </Text>
                        {com.dueDate && (
                          <Text style={[styles.commitmentDue, { color: colors.textSecondary }]}>
                            Due: {com.dueDate}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.commitmentPromise, { color: colors.text }]}>
                        {com.speaker ? `${com.speaker}: ` : ''}"{com.promise}"
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Action Items */}
            {contextMatch.actionItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="checkbox-outline" size={16} color={colors.secondary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Tasks ({contextMatch.actionItems.length})
                  </Text>
                </View>
                {contextMatch.actionItems.map((act) => (
                  <View
                    key={act.id}
                    style={[
                      styles.actionItemRow,
                      { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
                    ]}>
                    <Ionicons
                      name={act.done ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={act.done ? colors.secondary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.actionTaskText,
                        {
                          color: colors.text,
                          textDecorationLine: act.done ? 'line-through' : 'none',
                        },
                      ]}>
                      {act.task} {act.assignee ? `(${act.assignee})` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Executive Summary */}
            {contextMatch.relevantSnippet && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Executive Summary</Text>
                </View>
                <View
                  style={[
                    styles.summaryBox,
                    { backgroundColor: colors.surfaceContainerLow, borderColor: colors.cardBorder },
                  ]}>
                  <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                    {fullRecording?.summary?.executiveSummary || contextMatch.relevantSnippet}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => {
                onPin?.(contextMatch);
                onClose();
              }}
              style={[styles.pinBtn, { backgroundColor: colors.primaryTonal }]}>
              <Ionicons name="pin" size={16} color={colors.onPrimaryTonal} />
              <Text style={[styles.pinBtnText, { color: colors.onPrimaryTonal }]}>
                Pin Context to Current Meeting
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>Close Peek</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 11, 15, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    maxHeight: Dimensions.get('window').height * 0.82,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    backgroundColor: 'transparent',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  aiBriefCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  aiBriefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  aiBriefLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  aiBriefText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  section: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  decisionItem: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  decisionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  commitmentItem: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  commitmentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  commitmentDirection: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  commitmentDue: {
    fontSize: 11,
  },
  commitmentPromise: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionTaskText: {
    fontSize: 13,
    flex: 1,
  },
  summaryBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  pinBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pinBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
