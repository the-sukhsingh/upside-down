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
import { RecordingPlayer, SeekTarget } from '@/components/RecordingPlayer';
import { EvidenceTag } from '@/components/EvidenceTag';
import { PromiseRadarCard } from '@/components/PromiseRadarCard';
import { AutoFollowUpModal } from '@/components/AutoFollowUpModal';
import { ToastNotification, ToastConfig } from '@/components/ToastNotification';
import { calendarTaskService } from '@/services/calendarTaskService';
import { ActionItem } from '@/types/meeting';
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
    commitments,
    toggleActionItem,
    toggleCommitment,
    updateRecordingNotes,
    deleteRecording,
  } = useMeetingStore();

  const recording = recordings.find((r) => r.id === id);

  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [personalNotes, setPersonalNotes] = useState(recording?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [seekTarget, setSeekTarget] = useState<SeekTarget | null>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

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

  // Retrieve commitments for this recording (or fall back to global commitments matching recording ID)
  const recordingCommitments =
    recording.summary?.commitments && recording.summary.commitments.length > 0
      ? recording.summary.commitments
      : commitments.filter((c) => c.recordingId === recording.id);

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

  // Jump to exact audio timestamp (Conversation Evidence Link)
  const handlePressEvidence = (startTime: number, label: string) => {
    setSeekTarget({
      second: startTime,
      triggerKey: Date.now(),
      label,
    });
    const mins = Math.floor(startTime / 60);
    const secs = startTime % 60;
    setToast({
      type: 'info',
      title: 'Playing Audio Evidence',
      message: `Jumping audio to ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
      duration: 2500,
    });
  };

  // Export single action item to calendar
  const handleExportTaskToCalendar = async (item: ActionItem) => {
    await calendarTaskService.exportActionItemToCalendar(item, recording.meetingTitle);
    setToast({
      type: 'success',
      title: 'Calendar Opened',
      message: `Add "${item.task}" with deadline to your calendar.`,
      duration: 3500,
    });
  };

  // Bulk export action items to iCalendar
  const handleBulkExportCalendar = async () => {
    if (actionItems.length === 0) return;
    const icsData = calendarTaskService.generateIcsContent(
      actionItems.map((a) => ({
        title: a.task,
        description: `Meeting: ${recording.meetingTitle}\nAssignee: ${a.assignee || 'Me'}`,
        deadlinePhrase: a.dueDate,
      }))
    );

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${recording.meetingTitle.replace(/\s+/g, '_')}_tasks.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setToast({
      type: 'success',
      title: 'Tasks Exported',
      message: `${actionItems.length} tasks formatted for Apple/Google Calendar (.ics).`,
      duration: 4000,
    });
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

      {/* Auto Follow-Up Modal */}
      <AutoFollowUpModal
        visible={showFollowUpModal}
        recording={recording}
        onClose={() => setShowFollowUpModal(false)}
        onCopySuccess={() => {
          setShowFollowUpModal(false);
          setToast({
            type: 'success',
            title: 'Copied to Clipboard!',
            message: 'Ready-to-send follow-up draft is copied.',
            duration: 3000,
          });
        }}
      />

      {/* Top Navigation Bar */}
      <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBackBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.navBarTitle, { color: colors.text }]} numberOfLines={1}>
          {recording.meetingTitle}
        </Text>

        <View style={styles.navActions}>
          {/* Feature 4: Auto Follow-Up Draft Trigger Button */}
          <TouchableOpacity
            onPress={() => setShowFollowUpModal(true)}
            style={[styles.followUpNavBtn, { backgroundColor: colors.primaryContainer }]}
            accessibilityLabel="Generate Follow-Up Draft">
            <Ionicons name="paper-plane" size={14} color={colors.primary} />
            <Text style={[styles.followUpNavBtnText, { color: colors.primary }]}>Follow-Up</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.navIconBtn} accessibilityLabel="Share note">
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.navIconBtn} accessibilityLabel="Delete note">
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

          {/* Audio Player with Evidence Jump Capability */}
          {recording.uri ? (
            <RecordingPlayer
              uri={recording.uri}
              durationSeconds={recording.durationSeconds}
              seekTarget={seekTarget}
            />
          ) : null}
        </View>

        {/* Feature 1: Commitment Tracker ("Promise Radar") */}
        {recordingCommitments.length > 0 && (
          <PromiseRadarCard
            commitments={recordingCommitments}
            onToggleCommitment={toggleCommitment}
            onPressEvidence={handlePressEvidence}
            title="Promise Radar"
            subtitle="Spoken commitments detected in this conversation"
          />
        )}

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

        {/* Feature 5 & Action Items Checklist */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBg, { backgroundColor: colors.oliveLight }]}>
              <Ionicons name="checkbox-outline" size={16} color={colors.oliveText} />
            </View>
            <View style={styles.actionHeaderTitleCol}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Action Items Checklist</Text>
              <Text style={[styles.actionCounter, { color: colors.textSecondary }]}>
                {completedCount} of {actionItems.length} completed
              </Text>
            </View>

            {/* Feature 5 Bulk Calendar Export */}
            {actionItems.length > 0 && (
              <TouchableOpacity
                onPress={handleBulkExportCalendar}
                style={[styles.calendarSyncBtn, { backgroundColor: colors.surfaceContainer }]}>
                <Ionicons name="calendar" size={13} color={colors.primary} />
                <Text style={[styles.calendarSyncBtnText, { color: colors.primary }]}>Export All</Text>
              </TouchableOpacity>
            )}
          </View>

          {actionItems.length === 0 ? (
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              No action items detected in this meeting.
            </Text>
          ) : (
            <View style={styles.actionItemsList}>
              {actionItems.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.actionItemRow,
                    {
                      backgroundColor: item.done
                        ? colors.surfaceContainerLow
                        : colors.surfaceContainerLowest,
                      borderColor: colors.cardBorder,
                    },
                  ]}>
                  {/* Complete checkmark */}
                  <TouchableOpacity
                    onPress={() => toggleActionItem(recording.id, item.id)}
                    style={styles.checkboxTouchable}>
                    <Ionicons
                      name={item.done ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={item.done ? colors.secondary : colors.textSecondary}
                    />
                  </TouchableOpacity>

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

                      {item.dueDate && (
                        <View style={[styles.pill, { backgroundColor: colors.surfaceContainer }]}>
                          <Ionicons name="alarm-outline" size={11} color={colors.textSecondary} />
                          <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                            {item.dueDate}
                          </Text>
                        </View>
                      )}

                      {/* Feature 2: Evidence Link Pill */}
                      {item.evidence && (
                        <EvidenceTag
                          evidence={item.evidence}
                          onPressEvidence={handlePressEvidence}
                          compact
                        />
                      )}

                      {/* Feature 5: Add to Calendar One-Tap */}
                      <TouchableOpacity
                        onPress={() => handleExportTaskToCalendar(item)}
                        style={[styles.itemCalendarBtn, { backgroundColor: colors.primaryContainer }]}
                        accessibilityLabel="Add task to Google Calendar">
                        <Ionicons name="calendar-outline" size={11} color={colors.primary} />
                        <Text style={[styles.itemCalendarBtnText, { color: colors.primary }]}>Calendar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Feature 2: Key Decisions with Evidence Links */}
        {recording.summary?.keyDecisions && recording.summary.keyDecisions.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBg, { backgroundColor: colors.tertiaryContainer }]}>
                <Ionicons name="git-commit-outline" size={16} color="#5C4500" />
              </View>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Key Decisions</Text>
            </View>

            <View style={styles.decisionsList}>
              {recording.summary.structuredDecisions && recording.summary.structuredDecisions.length > 0
                ? recording.summary.structuredDecisions.map((item) => (
                    <View key={item.id} style={styles.structuredDecisionCol}>
                      <View style={styles.decisionItemRow}>
                        <View style={[styles.decisionDot, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.decisionText, { color: colors.text }]}>{item.decision}</Text>
                      </View>
                      {item.evidence && (
                        <View style={styles.evidenceIndent}>
                          <EvidenceTag
                            evidence={item.evidence}
                            onPressEvidence={handlePressEvidence}
                            compact
                          />
                        </View>
                      )}
                    </View>
                  ))
                : recording.summary.keyDecisions.map((decision, idx) => (
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  navBackBtn: {
    padding: 6,
    marginRight: 6,
  },
  navBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  followUpNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  followUpNavBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  meetingTitle: {
    fontSize: 20,
    fontWeight: '800',
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
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
  },
  actionHeaderTitleCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  actionCounter: {
    fontSize: 11,
    marginTop: 2,
  },
  calendarSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  calendarSyncBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkboxTouchable: {
    paddingTop: 1,
  },
  actionTextCol: {
    flex: 1,
    backgroundColor: 'transparent',
    gap: 6,
  },
  actionTaskText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionTaskDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  actionPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemCalendarBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  decisionsList: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  structuredDecisionCol: {
    gap: 4,
    backgroundColor: 'transparent',
  },
  evidenceIndent: {
    marginLeft: 16,
    backgroundColor: 'transparent',
  },
  decisionItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'transparent',
  },
  decisionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  decisionText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
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
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  editNotesBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveNotesBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saveNotesBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  markdownText: {
    fontSize: 13,
    lineHeight: 20,
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
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  transcriptText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
