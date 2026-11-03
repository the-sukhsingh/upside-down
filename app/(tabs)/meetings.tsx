import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useMeetingStore } from '@/store/meetingStore';
import { MeetingCard } from '@/components/MeetingCard';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Meeting } from '@/types/meeting';

export default function MeetingsScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const {
    meetings,
    activeRecording,
    addMeeting,
    startRecordingSession,
  } = useMeetingStore();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('11:00 AM');
  const [newAttendees, setNewAttendees] = useState('');
  const [newAgenda, setNewAgenda] = useState('');

  const handleCreateMeeting = () => {
    if (!newTitle.trim()) return;

    const attendeesList = newAttendees
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const created = addMeeting({
      title: newTitle.trim(),
      date: new Date().toISOString().split('T')[0],
      startTime: newStartTime.trim() || '11:00 AM',
      durationMinutes: 45,
      attendees: attendeesList.length > 0 ? attendeesList : ['Me'],
      agenda: newAgenda.trim() || undefined,
    });

    setNewTitle('');
    setNewAttendees('');
    setNewAgenda('');
    setAddModalOpen(false);
  };

  const handleStartRecord = (meeting: Meeting) => {
    startRecordingSession(meeting.id, meeting.title);
    router.push('/record');
  };

  const handleMeetingPress = (meeting: Meeting) => {
    router.push(`/meeting/${meeting.id}`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Schedule</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {meetings.length} scheduled meetings
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setAddModalOpen(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={18} color={colors.primaryText} />
          <Text style={[styles.addBtnText, { color: colors.primaryText }]}>New Meeting</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}>
        {meetings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Meetings Scheduled</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Schedule a meeting to link your recordings and generated action items.
            </Text>
            <TouchableOpacity
              onPress={() => setAddModalOpen(true)}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.emptyBtnText, { color: colors.primaryText }]}>Add Meeting</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.meetingsList}>
            {meetings.map((m) => {
              const isCurrentlyRecording =
                activeRecording.isRecording && activeRecording.meetingId === m.id;

              return (
                <MeetingCard
                  key={m.id}
                  meeting={m}
                  isCurrentlyRecording={isCurrentlyRecording}
                  onPress={() => handleMeetingPress(m)}
                  onRecordPress={() => handleStartRecord(m)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Meeting Modal */}
      <Modal visible={addModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Meeting</Text>
              <TouchableOpacity onPress={() => setAddModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Meeting Title</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { color: colors.text, backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                ]}
                placeholder="e.g. Sprint Architecture Review"
                placeholderTextColor={colors.textSecondary}
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Start Time</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { color: colors.text, backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                ]}
                placeholder="e.g. 10:30 AM"
                placeholderTextColor={colors.textSecondary}
                value={newStartTime}
                onChangeText={setNewStartTime}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Attendees (comma-separated)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { color: colors.text, backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                ]}
                placeholder="e.g. Alex, Sarah, Connor"
                placeholderTextColor={colors.textSecondary}
                value={newAttendees}
                onChangeText={setNewAttendees}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Agenda / Objectives</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  { color: colors.text, backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                ]}
                placeholder="Key topics to discuss..."
                placeholderTextColor={colors.textSecondary}
                multiline
                value={newAgenda}
                onChangeText={setNewAgenda}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreateMeeting}
              style={[styles.createMeetingBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.createMeetingBtnText, { color: colors.primaryText }]}>
                Create Meeting
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    gap: 3,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  meetingsList: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 6,
  },
  emptyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
    backgroundColor: 'transparent',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  createMeetingBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  createMeetingBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
