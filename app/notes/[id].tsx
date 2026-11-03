import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useMeetingStore } from '@/store/meetingStore';
import { RecordingPlayer } from '@/components/RecordingPlayer';
import { ToastNotification, ToastConfig } from '@/components/ToastNotification';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useColorScheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const {
    recordings,
    toggleActionItem,
    updateRecordingNotes,
    deleteRecording,
  } = useMeetingStore();

  const recording = recordings.find((r) => r.id === id);

  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [personalNotes, setPersonalNotes] = useState(recording?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  if (!recording) {
    return (
      <View
        style={[
          styles.screen,
          styles.centerScreen,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}>
        <Ionicons name="document-text-outline" size={54} color={colors.textMuted} />
        <Text style={[styles.notFoundTitle, { color: colors.text }]}>Note Not Found</Text>
        <Text style={[styles.notFoundSubtitle, { color: colors.textSecondary }]}>
          This note may have been deleted or does not exist.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backActionBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="arrow-back" size={16} color={colors.primaryText} />
          <Text style={[styles.backActionBtnText, { color: colors.primaryText }]}>Back to Notes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const actionItems = recording.summary?.actionItems || [];
  const completedCount = actionItems.filter((a) => a.done).length;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  const formatDateLabel = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  const handleShare = async () => {
    const summaryText = recording.summary?.executiveSummary
      ? `\n\nExecutive Summary:\n${recording.summary.executiveSummary}`
      : '';
    const decisionsText =
      recording.summary?.keyDecisions && recording.summary.keyDecisions.length > 0
        ? `\n\nKey Decisions:\n${recording.summary.keyDecisions.map((d) => `• ${d}`).join('\n')}`
        : '';
    const actionItemsText =
      actionItems.length > 0
        ? `\n\nAction Items:\n${actionItems
            .map((a) => `[${a.done ? 'x' : ' '}] ${a.task} (${a.assignee || 'Unassigned'})`)
            .join('\n')}`
        : '';

    const shareContent = `Meeting Notes: ${recording.meetingTitle}\nDate: ${formatDateLabel(
      recording.createdAt
    )}${summaryText}${decisionsText}${actionItemsText}`;

    try {
      await Share.share({
        title: recording.meetingTitle,
        message: shareContent,
      });
    } catch (err) {
      console.warn('Share notice:', err);
    }
  };

  const handleSaveNotes = () => {
    updateRecordingNotes(recording.id, personalNotes);
    setIsEditingNotes(false);
    setToast({
      type: 'success',
      title: 'Notes Saved',
      message: 'Your personal observations have been updated.',
      duration: 3000,
    });
  };

  const handleDelete = () => {
    Alert.alert('Delete Note?', 'Are you sure you want to permanently delete this note and audio?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRecording(recording.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />

      {/* Top Navigation Bar */}
      <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBackBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.navBarTitle, { color: colors.text }]} numberOfLines={1}>
          {recording.meetingTitle}
        </Text>

        <View style={styles.navActions}>
          <TouchableOpacity onPress={handleShare} style={styles.navIconBtn}>
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.navIconBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}>
        {/* Title & Metadata Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.meetingTitle, { color: colors.text }]}>{recording.meetingTitle}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {formatDateLabel(recording.createdAt)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {formatDuration(recording.durationSeconds)}
              </Text>
            </View>
          </View>

          {/* Tags */}
          {recording.tags && recording.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {recording.tags.map((tag, idx) => (
                <View
                  key={idx}
                  style={[styles.tagBadge, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[styles.tagBadgeText, { color: colors.textSecondary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Audio Player */}
          {recording.uri ? (
            <RecordingPlayer uri={recording.uri} durationSeconds={recording.durationSeconds} />
          ) : null}
        </View>

        {/* Executive Summary Card */}
        {recording.summary?.executiveSummary && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBg, { backgroundColor: colors.coralLight }]}>
                <Ionicons name="bulb-outline" size={16} color={colors.coral} />
              </View>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Executive Summary</Text>
            </View>
            <Text style={[styles.summaryText, { color: colors.text }]}>
              {recording.summary.executiveSummary}
            </Text>
          </View>
        )}

        {/* Action Items Checklist */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBg, { backgroundColor: colors.oliveLight }]}>
              <Ionicons name="checkbox-outline" size={16} color={colors.oliveText} />
            </View>
            <View style={styles.actionHeaderTitleCol}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Action Items</Text>
              <Text style={[styles.actionCounter, { color: colors.textSecondary }]}>
                {completedCount} of {actionItems.length} completed
              </Text>
            </View>
          </View>

          {actionItems.length === 0 ? (
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              No action items detected in this meeting.
            </Text>
          ) : (
            <View style={styles.actionItemsList}>
              {actionItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => toggleActionItem(recording.id, item.id)}
                  style={[
                    styles.actionItemRow,
                    {
                      backgroundColor: item.done
                        ? colors.surfaceContainerLow
                        : colors.surfaceContainerLowest,
                      borderColor: colors.cardBorder,
                    },
                  ]}>
                  <Ionicons
                    name={item.done ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={item.done ? colors.secondary : colors.textSecondary}
                    style={styles.checkboxIcon}
                  />

                  <View style={styles.actionTextCol}>
                    <Text
                      style={[
                        styles.actionTaskText,
                        { color: colors.text },
                        item.done && styles.actionTaskDone,
                      ]}>
                      {item.task}
                    </Text>

                    <View style={styles.actionPillsRow}>
                      {item.assignee && (
                        <View style={[styles.pill, { backgroundColor: colors.surfaceContainer }]}>
                          <Ionicons name="person-outline" size={11} color={colors.textSecondary} />
                          <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                            {item.assignee}
                          </Text>
                        </View>
                      )}

                      {item.priority && (
                        <View
                          style={[
                            styles.pill,
                            {
                              backgroundColor:
                                item.priority === 'high'
                                  ? colors.coralLight
                                  : item.priority === 'medium'
                                  ? colors.tertiaryContainer
                                  : colors.surfaceContainer,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.pillText,
                              {
                                color:
                                  item.priority === 'high'
                                    ? colors.coral
                                    : item.priority === 'medium'
                                    ? '#5C4500'
                                    : colors.textSecondary,
                                fontWeight: '700',
                              },
                            ]}>
                            {item.priority.toUpperCase()}
                          </Text>
                        </View>
                      )}

                      {item.category && (
                        <View style={[styles.pill, { backgroundColor: colors.surfaceContainer }]}>
                          <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                            {item.category}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Key Decisions */}
        {recording.summary?.keyDecisions && recording.summary.keyDecisions.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBg, { backgroundColor: colors.tertiaryContainer }]}>
                <Ionicons name="git-commit-outline" size={16} color="#5C4500" />
              </View>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Key Decisions</Text>
            </View>

            <View style={styles.decisionsList}>
              {recording.summary.keyDecisions.map((decision, idx) => (
                <View key={idx} style={styles.decisionItemRow}>
                  <View style={[styles.decisionDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.decisionText, { color: colors.text }]}>{decision}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Personal Notes / Observations */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBg, { backgroundColor: colors.surfaceContainer }]}>
              <Ionicons name="create-outline" size={16} color={colors.text} />
            </View>
            <View style={styles.notesHeaderCol}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Meeting Notes</Text>
            </View>

            {!isEditingNotes ? (
              <TouchableOpacity
                onPress={() => setIsEditingNotes(true)}
                style={[styles.editNotesBtn, { borderColor: colors.border }]}>
                <Ionicons name="pencil" size={13} color={colors.primary} />
                <Text style={[styles.editNotesBtnText, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSaveNotes}
                style={[styles.saveNotesBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.saveNotesBtnText, { color: colors.primaryText }]}>Save</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditingNotes ? (
            <TextInput
              style={[
                styles.notesInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.border,
                },
              ]}
              multiline
              value={personalNotes}
              onChangeText={setPersonalNotes}
              placeholder="Add your personal notes or takeaways..."
              placeholderTextColor={colors.textSecondary}
            />
          ) : (
            <Text style={[styles.markdownText, { color: colors.text }]}>
              {recording.notes || 'No notes added yet. Tap Edit to write observations.'}
            </Text>
          )}
        </View>

        {/* Full Timestamped Transcript */}
        {recording.transcript ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setShowFullTranscript(!showFullTranscript)}
              style={styles.transcriptToggleRow}>
              <View style={styles.transcriptToggleLeft}>
                <Ionicons name="chatbubbles-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Full Transcript</Text>
              </View>
              <Ionicons
                name={showFullTranscript ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showFullTranscript && (
              <View style={[styles.transcriptContainer, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[styles.transcriptText, { color: colors.text }]}>
                  {recording.transcript}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centerScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  notFoundSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  backActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backActionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navBackBtn: {
    padding: 6,
  },
  navBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  navIconBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  meetingTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'transparent',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'transparent',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionHeaderTitleCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  actionCounter: {
    fontSize: 12,
    marginTop: 1,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
  },
  emptyHint: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionItemsList: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  checkboxIcon: {
    marginTop: 1,
  },
  actionTextCol: {
    flex: 1,
    gap: 6,
    backgroundColor: 'transparent',
  },
  actionTaskText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  actionTaskDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  actionPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'transparent',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  pillText: {
    fontSize: 11,
  },
  decisionsList: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  decisionItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'transparent',
  },
  decisionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  decisionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  notesHeaderCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  editNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  editNotesBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveNotesBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  saveNotesBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesInput: {
    minHeight: 120,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  markdownText: {
    fontSize: 13,
    lineHeight: 21,
  },
  transcriptToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  transcriptToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  transcriptContainer: {
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  transcriptText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
