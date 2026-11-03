import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useMeetingStore } from '@/store/meetingStore';
import { PromiseRadarCard } from '@/components/PromiseRadarCard';
import { DigitalizeNotesModal } from '@/components/DigitalizeNotesModal';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Meeting } from '@/types/meeting';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const [digitalizeModalVisible, setDigitalizeModalVisible] = useState(false);

  const {
    meetings,
    recordings,
    commitments,
    activeRecording,
    startRecordingSession,
    toggleActionItem,
    toggleCommitment,
  } = useMeetingStore();

  // Active or upcoming meeting
  const upcomingMeetings = useMemo(() => {
    return meetings.filter((m) => m.status === 'upcoming').slice(0, 3);
  }, [meetings]);

  // Aggregate pending action items from all recordings
  const pendingActionItems = useMemo(() => {
    const list: { recordingId: string; meetingTitle: string; item: any }[] = [];
    recordings.forEach((rec) => {
      rec.summary?.actionItems?.forEach((item) => {
        if (!item.done) {
          list.push({
            recordingId: rec.id,
            meetingTitle: rec.meetingTitle,
            item,
          });
        }
      });
    });
    return list.slice(0, 4);
  }, [recordings]);

  // Recent recordings
  const recentRecordings = useMemo(() => {
    return recordings.slice(0, 3);
  }, [recordings]);

  const handleStartQuickRecord = () => {
    startRecordingSession(undefined, 'Quick Voice Note');
    router.push('/record');
  };

  const handleStartMeetingRecord = (meeting: Meeting) => {
    startRecordingSession(meeting.id, meeting.title);
    router.push('/record');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  const formatDateLabel = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <View style={styles.topBarLeft}>
          <Text style={[styles.appTitle, { color: colors.text }]}>Meeting Note Taker</Text>
          <View style={[styles.privacyBadge, { backgroundColor: colors.surfaceContainer }]}>
            <Ionicons name="flash" size={11} color={colors.primary} />
            <Text style={[styles.privacyBadgeText, { color: colors.primary }]}>
              Groq & Sarvam AI
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={[styles.settingsBtn, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons name="settings-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}>
        {/* Active Recording Banner if recording is ongoing */}
        {activeRecording.isRecording && (
          <TouchableOpacity
            onPress={() => router.push('/record')}
            style={[styles.ongoingBanner, { backgroundColor: colors.coralLight, borderColor: colors.coral }]}>
            <View style={styles.ongoingBannerLeft}>
              <View style={[styles.pulseDot, { backgroundColor: colors.coral }]} />
              <View style={styles.ongoingTextCol}>
                <Text style={[styles.ongoingTitle, { color: colors.coralDark }]}>
                  Recording Active ({Math.floor(activeRecording.elapsedSeconds / 60)}:
                  {(activeRecording.elapsedSeconds % 60).toString().padStart(2, '0')})
                </Text>
                <Text style={[styles.ongoingSub, { color: colors.coralDark }]} numberOfLines={1}>
                  {activeRecording.meetingTitle} · Tap to view & stop
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.coral} />
          </TouchableOpacity>
        )}

        {/* Hero Quick Record CTA */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroLeft}>
            <Text style={[styles.heroHeading, { color: colors.text }]}>Capture Meeting Audio</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Record conversations with zero live network calls. Transcribe and extract action items once you stop.
            </Text>
            <TouchableOpacity
              onPress={handleStartQuickRecord}
              style={[styles.heroCtaBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="mic" size={18} color={colors.primaryText} />
              <Text style={[styles.heroCtaBtnText, { color: colors.primaryText }]}>Quick Record</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.heroMicIconBg, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="mic-circle" size={48} color={colors.primary} />
          </View>
        </View>

        {/* Feature 1: Commitment Tracker ("Promise Radar") */}
        {commitments.length > 0 && (
          <PromiseRadarCard
            commitments={commitments}
            onToggleCommitment={toggleCommitment}
            onPressEvidence={(startTime, label) => {
              const matched = commitments.find((c) => c.evidence?.startTime === startTime);
              if (matched?.recordingId) {
                router.push(`/notes/${matched.recordingId}`);
              }
            }}
            title="Promise Radar"
            subtitle="I Owe vs They Owe Me commitments across all meetings"
          />
        )}

        {/* Pending Action Items Section */}
        {pendingActionItems.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="checkbox-outline" size={18} color={colors.secondary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Action Items to Do</Text>
              </View>
              <Text style={[styles.sectionBadge, { color: colors.textSecondary }]}>
                {pendingActionItems.length} pending
              </Text>
            </View>

            <View style={styles.tasksList}>
              {pendingActionItems.map(({ recordingId, meetingTitle, item }) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => toggleActionItem(recordingId, item.id)}
                  style={[styles.taskItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.cardBorder }]}>
                  <Ionicons name="square-outline" size={20} color={colors.textSecondary} />
                  <View style={styles.taskTextCol}>
                    <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
                      {item.task}
                    </Text>
                    <View style={styles.taskMetaRow}>
                      <Text style={[styles.taskMeetingName, { color: colors.textSecondary }]} numberOfLines={1}>
                        {meetingTitle}
                      </Text>
                      {item.assignee && (
                        <Text style={[styles.taskAssignee, { color: colors.primary }]}>
                          · {item.assignee}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recent Meeting Notes */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Notes</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/notes')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See all ({recordings.length})</Text>
            </TouchableOpacity>
          </View>

          {recentRecordings.length === 0 ? (
            <Text style={[styles.emptySectionText, { color: colors.textSecondary }]}>
              No notes recorded yet. Tap Quick Record above.
            </Text>
          ) : (
            <View style={styles.recentNotesList}>
              {recentRecordings.map((rec) => (
                <TouchableOpacity
                  key={rec.id}
                  activeOpacity={0.75}
                  onPress={() => router.push(`/notes/${rec.id}`)}
                  style={[styles.recentNoteItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.cardBorder }]}>
                  <View style={styles.recentNoteTop}>
                    <Text style={[styles.recentNoteDate, { color: colors.textSecondary }]}>
                      {formatDateLabel(rec.createdAt)} · {formatDuration(rec.durationSeconds)}
                    </Text>
                    {rec.summary?.actionItems && (
                      <View style={[styles.smallTaskPill, { backgroundColor: colors.surfaceContainer }]}>
                        <Ionicons name="checkbox" size={12} color={colors.secondary} />
                        <Text style={[styles.smallTaskPillText, { color: colors.secondary }]}>
                          {rec.summary.actionItems.length} tasks
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.recentNoteTitle, { color: colors.text }]} numberOfLines={1}>
                    {rec.meetingTitle}
                  </Text>
                  {rec.summary?.executiveSummary && (
                    <Text style={[styles.recentNoteSummary, { color: colors.textSecondary }]} numberOfLines={2}>
                      {rec.summary.executiveSummary}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Upcoming Schedule */}
        {upcomingMeetings.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.text} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Meetings</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/meetings')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Schedule</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.upcomingList}>
              {upcomingMeetings.map((m) => (
                <View
                  key={m.id}
                  style={[styles.upcomingItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.cardBorder }]}>
                  <View style={styles.upcomingTextCol}>
                    <Text style={[styles.upcomingTime, { color: colors.textSecondary }]}>
                      {m.startTime} · {m.durationMinutes}m
                    </Text>
                    <Text style={[styles.upcomingTitle, { color: colors.text }]} numberOfLines={1}>
                      {m.title}
                    </Text>
                    <Text style={[styles.upcomingAttendees, { color: colors.textSecondary }]} numberOfLines={1}>
                      {m.attendees.join(', ')}
                    </Text>
                  </View>

                  <View style={styles.upcomingActionsRow}>
                    <TouchableOpacity
                      onPress={() => router.push(`/meeting/${m.id}`)}
                      style={[styles.briefingPillBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.cardBorder }]}>
                      <Ionicons name="sparkles" size={13} color={colors.primary} />
                      <Text style={[styles.briefingPillBtnText, { color: colors.primary }]}>Briefing</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleStartMeetingRecord(m)}
                      style={[styles.recordMeetingBtn, { backgroundColor: colors.primary }]}>
                      <Ionicons name="mic" size={14} color={colors.primaryText} />
                      <Text style={[styles.recordMeetingBtnText, { color: colors.primaryText }]}>Record</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Camera Button (Bottom-Left) */}
      <TouchableOpacity
        onPress={() => setDigitalizeModalVisible(true)}
        style={[
          styles.floatingCameraFab,
          {
            bottom: insets.bottom + 85,
            backgroundColor: colors.primary,
            shadowColor: '#000',
          },
        ]}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Digitalize Meeting Notes via Camera">
        <Ionicons name="camera" size={24} color={colors.primaryText} />
        <View style={[styles.fabAiBadge, { backgroundColor: colors.olive }]}>
          <Ionicons name="sparkles" size={9} color="#FFF" />
        </View>
      </TouchableOpacity>

      {/* Digitalize Notes Modal */}
      <DigitalizeNotesModal
        visible={digitalizeModalVisible}
        onClose={() => setDigitalizeModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  floatingCameraFab: {
    position: 'absolute',
    left: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 900,
  },
  fabAiBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBarLeft: {
    gap: 4,
    backgroundColor: 'transparent',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  privacyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  ongoingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  ongoingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    backgroundColor: 'transparent',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ongoingTextCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  ongoingTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  ongoingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  heroLeft: {
    flex: 1,
    gap: 6,
    backgroundColor: 'transparent',
  },
  heroHeading: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  heroCtaBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroMicIconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptySectionText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  tasksList: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  taskTextCol: {
    flex: 1,
    gap: 3,
    backgroundColor: 'transparent',
  },
  taskTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  taskMeetingName: {
    fontSize: 11,
    maxWidth: 180,
  },
  taskAssignee: {
    fontSize: 11,
    fontWeight: '600',
  },
  recentNotesList: {
    gap: 10,
    backgroundColor: 'transparent',
  },
  recentNoteItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  recentNoteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  recentNoteDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  smallTaskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  smallTaskPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  recentNoteTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  recentNoteSummary: {
    fontSize: 12,
    lineHeight: 17,
  },
  upcomingList: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  upcomingTextCol: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
  },
  upcomingTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  upcomingAttendees: {
    fontSize: 12,
  },
  upcomingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  briefingPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  briefingPillBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordMeetingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  recordMeetingBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

