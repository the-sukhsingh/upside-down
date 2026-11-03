import React from 'react';
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
    recordings,
    startRecordingSession,
    deleteMeeting,
  } = useMeetingStore();

  const meeting = getMeetingById(id);

  if (!meeting) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.notFoundText, { color: colors.text }]}>Meeting not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.backBtnText, { color: colors.primaryText }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const linkedRecordings = recordings.filter((r) => r.meetingId === meeting.id);

  const handleStartRecord = () => {
    startRecordingSession(meeting.id, meeting.title);
    router.push('/record');
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
            style={[styles.recordCta, { backgroundColor: colors.primary }]}>
            <Ionicons name="mic" size={18} color={colors.primaryText} />
            <Text style={[styles.recordCtaText, { color: colors.primaryText }]}>
              Start Recording This Meeting
            </Text>
          </TouchableOpacity>
        </View>

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
    gap: 12,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '700',
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  iconBtn: {
    padding: 6,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
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
    fontSize: 12,
    fontWeight: '500',
  },
  agendaBox: {
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  agendaHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    fontSize: 15,
    fontWeight: '700',
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
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
    borderRadius: 22,
    marginTop: 6,
  },
  recordCtaText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyHint: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  linkedNoteItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  linkedNoteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  linkedNoteTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  linkedNoteSummary: {
    fontSize: 12,
    lineHeight: 16,
  },
});

