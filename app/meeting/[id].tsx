import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMeetingStore } from '@/store/meetingStore';
import { BriefingCard } from '@/components/BriefingCard';
import { briefingService } from '@/services/briefingService';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function MeetingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useColorScheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const {
    getMeetingById,
    meetings,
    recordings,
    startRecordingSession,
    setMeetingBriefing,
    deleteMeeting,
  } = useMeetingStore();

  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  const meeting = getMeetingById(id);

  if (!meeting) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.notFoundText, { color: colors.text }]}>Meeting not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.primaryTonal }]}>
          <Text style={[styles.backBtnText, { color: colors.onPrimaryTonal }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const linkedRecordings = recordings.filter((r) => r.meetingId === meeting.id);

  const handleStartRecord = () => {
    startRecordingSession(meeting.id, meeting.title);
    router.push('/record');
  };

  const handleGenerateBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const brief = await briefingService.generateBriefing(
        meeting,
        meetings,
        recordings
      );
      setMeetingBriefing(meeting.id, brief);
    } catch (err) {
      console.warn('Briefing notice:', err);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Meeting?', 'Are you sure you want to delete this meeting entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMeeting(meeting.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]} numberOfLines={1}>
          Meeting Details
        </Text>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Main Details Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{meeting.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{meeting.date}</Text>
            </View>
            <View style={styles.metaCol}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {meeting.startTime} · {meeting.durationMinutes} min
              </Text>
            </View>
          </View>

          {/* Agenda */}
          {meeting.agenda && (
            <View style={[styles.agendaBox, { backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={[styles.agendaHeading, { color: colors.primary }]}>Agenda</Text>
              <Text style={[styles.agendaText, { color: colors.text }]}>{meeting.agenda}</Text>
            </View>
          )}

          {/* Attendees */}
          <View style={styles.attendeesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendees</Text>
            <View style={styles.attendeesRow}>
              {meeting.attendees.map((name, idx) => (
                <View
                  key={idx}
                  style={[styles.attendeePill, { backgroundColor: colors.surfaceContainer }]}>
                  <Ionicons name="person-circle-outline" size={16} color={colors.text} />
                  <Text style={[styles.attendeeName, { color: colors.text }]}>{name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Record CTA */}
          <TouchableOpacity
            onPress={handleStartRecord}
            style={[styles.recordCta, { backgroundColor: colors.primaryTonal }]}>
            <Ionicons name="mic" size={18} color={colors.onPrimaryTonal} />
            <Text style={[styles.recordCtaText, { color: colors.onPrimaryTonal }]}>
              Start Recording This Meeting
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feature 3: Before-You-Meet Briefing */}
        {meeting.briefing ? (
          <BriefingCard
            briefing={meeting.briefing}
            meetingTitle={meeting.title}
            onRegenerate={handleGenerateBriefing}
            isLoading={isGeneratingBriefing}
          />
        ) : (
          <View style={[styles.briefingPromptCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <View style={styles.briefingPromptHeader}>
              <View style={[styles.briefingIconCircle, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="sparkles" size={18} color={colors.primary} />
              </View>
              <View style={styles.briefingPromptTexts}>
                <Text style={[styles.briefingPromptTitle, { color: colors.text }]}>Before-You-Meet Briefing</Text>
                <Text style={[styles.briefingPromptSub, { color: colors.textSecondary }]}>
                  Synthesize previous decisions, pending action items, and attention points before joining.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleGenerateBriefing}
              disabled={isGeneratingBriefing}
              style={[styles.generateBriefingBtn, { backgroundColor: colors.primaryTonal }]}>
              <Ionicons name="sparkles-outline" size={16} color={colors.onPrimaryTonal} />
              <Text style={[styles.generateBriefingBtnText, { color: colors.onPrimaryTonal }]}>
                {isGeneratingBriefing ? 'Compiling Intelligence...' : 'Generate Pre-Meeting Briefing'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Linked Meeting Notes */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Meeting Notes & Recordings ({linkedRecordings.length})
          </Text>

          {linkedRecordings.length === 0 ? (
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              No recordings captured yet for this meeting.
            </Text>
          ) : (
            linkedRecordings.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                onPress={() => router.push(`/notes/${rec.id}`)}
                style={[
                  styles.linkedNoteItem,
                  { backgroundColor: colors.surfaceContainerLow, borderColor: colors.cardBorder },
                ]}>
                <View style={styles.linkedNoteTop}>
                  <Text style={[styles.linkedNoteTitle, { color: colors.text }]}>
                    {rec.meetingTitle}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
                {rec.summary?.executiveSummary && (
                  <Text
                    style={[styles.linkedNoteSummary, { color: colors.textSecondary }]}
                    numberOfLines={2}>
                    {rec.summary.executiveSummary}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  iconBtn: {
    padding: 6,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'transparent',
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  metaText: {
    fontSize: 13,
  },
  agendaBox: {
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  agendaHeading: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  agendaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  attendeesSection: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  attendeesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  attendeePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 999,
  },
  attendeeName: {
    fontSize: 12,
    fontWeight: '500',
  },
  recordCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
    marginTop: 4,
  },
  recordCtaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  briefingPromptCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
  briefingPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  briefingIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingPromptTexts: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  briefingPromptTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  briefingPromptSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  generateBriefingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  generateBriefingBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  linkedNoteItem: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  linkedNoteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  linkedNoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  linkedNoteSummary: {
    fontSize: 12,
    lineHeight: 16,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
