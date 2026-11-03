import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMeetingStore } from '@/store/meetingStore';
import { audioRecorder } from '@/services/audioRecorder';
import { transcriptionService } from '@/services/transcriptionService';
import { aiNoteService } from '@/services/aiNoteService';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { ToastNotification, ToastConfig } from '@/components/ToastNotification';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Recording } from '@/types/meeting';

export default function RecordScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const {
    meetings,
    activeRecording,
    settings,
    processingState,
    startRecordingSession,
    pauseRecordingSession,
    resumeRecordingSession,
    updateActiveElapsed,
    updateActiveMeter,
    discardRecordingSession,
    createRecordingEntry,
    updateRecording,
    setProcessingState,
    resetProcessingState,
  } = useMeetingStore();

  const [selectedMeetingId, setSelectedMeetingId] = useState<string | undefined>(
    activeRecording.meetingId
  );
  const [meetingPickerOpen, setMeetingPickerOpen] = useState(false);
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [completedRecording, setCompletedRecording] = useState<Recording | null>(null);

  // High-accuracy wall clock refs to prevent timer drift
  const sessionStartTimeRef = useRef<number | null>(null);
  const pausedDurationRef = useRef<number>(0);
  const lastPausedAtRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync selectedMeetingId when active recording changes
  useEffect(() => {
    if (activeRecording.meetingId) {
      setSelectedMeetingId(activeRecording.meetingId);
    }
  }, [activeRecording.meetingId]);

  // Wall clock ticker
  const startTimerTicker = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      if (sessionStartTimeRef.current !== null && !activeRecording.isPaused) {
        const now = Date.now();
        const totalElapsedMs = now - sessionStartTimeRef.current - pausedDurationRef.current;
        const totalSeconds = Math.max(0, Math.floor(totalElapsedMs / 1000));
        updateActiveElapsed(totalSeconds);
      }
    }, 500);
  }, [activeRecording.isPaused, updateActiveElapsed]);

  const stopTimerTicker = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimerTicker();
    };
  }, [stopTimerTicker]);

  // Handle start recording
  const handleStart = async () => {
    setCompletedRecording(null);
    resetProcessingState();

    const chosenMeeting = meetings.find((m) => m.id === selectedMeetingId);
    const meetingTitle = chosenMeeting?.title || 'Meeting Note Session';

    sessionStartTimeRef.current = Date.now();
    pausedDurationRef.current = 0;
    lastPausedAtRef.current = null;

    startRecordingSession(selectedMeetingId, meetingTitle);
    startTimerTicker();

    // Pure local recording - Zero real-time data fetching
    await audioRecorder.startRecording((status) => {
      if (status.metering !== undefined) {
        updateActiveMeter(status.metering);
      }
    });
  };

  // Handle pause recording
  const handlePause = async () => {
    lastPausedAtRef.current = Date.now();
    stopTimerTicker();
    pauseRecordingSession();
    await audioRecorder.pauseRecording();
  };

  // Handle resume recording
  const handleResume = async () => {
    if (lastPausedAtRef.current) {
      pausedDurationRef.current += Date.now() - lastPausedAtRef.current;
      lastPausedAtRef.current = null;
    }
    startTimerTicker();
    resumeRecordingSession();
    await audioRecorder.resumeRecording();
  };

  // Handle stop recording -> enters Transcription & AI Note Generation
  const handleStop = async () => {
    stopTimerTicker();
    sessionStartTimeRef.current = null;
    pausedDurationRef.current = 0;
    lastPausedAtRef.current = null;

    const recordedDuration = activeRecording.elapsedSeconds || 8;
    const meetingTitle = activeRecording.meetingTitle || 'Meeting Note Session';
    const meetingId = activeRecording.meetingId;

    // 1. Stop audio recorder and get file URI
    const audioUri = await audioRecorder.stopRecording();

    // 2. Save base recording entry
    const newRec = createRecordingEntry(audioUri, meetingTitle, meetingId);

    // 3. Initiate post-recording pipeline: Transcribe -> AI Notes
    const isGroq = settings.activeEngine === 'groq';
    const sttLabel = isGroq
      ? `Groq (${settings.groqWhisperModel})`
      : `Sarvam AI (${settings.sarvamSttModel})`;

    setProcessingState({
      isProcessing: true,
      currentStage: 'transcribing',
      stageMessage: `Transcribing audio with ${sttLabel}...`,
      progressPercent: 5,
      recordingId: newRec.id,
    });

    try {
      // Step A: Speech-to-Text Transcription via Groq or Sarvam
      const transcriptionResult = await transcriptionService.transcribeAudio(audioUri, {
        provider: settings.activeEngine,
        meetingTitle,
        durationSeconds: recordedDuration,
        groqWhisperModel: settings.groqWhisperModel,
        sarvamSttModel: settings.sarvamSttModel,
        sarvamLanguageCode: settings.sarvamLanguageCode,
        onProgress: (stage, percent) => {
          setProcessingState({
            currentStage: 'transcribing',
            stageMessage: stage,
            progressPercent: Math.round(percent * 0.5), // First 50% of overall pipeline
          });
        },
      });

      // Update recording with transcript
      updateRecording(newRec.id, {
        status: 'transcribing',
        transcript: transcriptionResult.fullTranscript,
        transcriptSegments: transcriptionResult.segments,
      });

      // Step B: AI Model Note Creation via Groq or Sarvam
      const aiLabel = isGroq
        ? `Groq (${settings.groqLlmModel})`
        : `Sarvam AI (${settings.sarvamLlmModel})`;

      setProcessingState({
        currentStage: 'summarizing',
        stageMessage: `Synthesizing meeting intelligence with ${aiLabel}...`,
        progressPercent: 52,
      });

      const noteResult = await aiNoteService.generateNotes(
        transcriptionResult.fullTranscript,
        {
          provider: settings.activeEngine,
          meetingTitle,
          groqLlmModel: settings.groqLlmModel,
          sarvamLlmModel: settings.sarvamLlmModel,
          onProgress: (stage, percent) => {
            setProcessingState({
              currentStage: 'summarizing',
              stageMessage: stage,
              progressPercent: 50 + Math.round(percent * 0.5), // Second 50% of overall pipeline
            });
          },
        }
      );

      // Finalize recording in store
      const finalRecording: Recording = {
        ...newRec,
        status: 'completed',
        transcript: transcriptionResult.fullTranscript,
        transcriptSegments: transcriptionResult.segments,
        summary: noteResult.summary,
        notes: noteResult.notes,
        tags: noteResult.tags,
      };

      updateRecording(newRec.id, {
        status: 'completed',
        transcript: transcriptionResult.fullTranscript,
        transcriptSegments: transcriptionResult.segments,
        summary: noteResult.summary,
        notes: noteResult.notes,
        tags: noteResult.tags,
      });

      setCompletedRecording(finalRecording);

      setProcessingState({
        isProcessing: false,
        currentStage: 'completed',
        stageMessage: 'Meeting notes generated successfully!',
        progressPercent: 100,
      });

      setToast({
        type: 'success',
        title: 'Notes Generated!',
        message: `Structured notes and action items ready for "${meetingTitle}"`,
        actionLabel: 'View Note',
        onAction: () => {
          router.push(`/notes/${newRec.id}`);
        },
        duration: 5000,
      });
    } catch (err: any) {
      console.warn('Pipeline error:', err);
      setProcessingState({
        isProcessing: false,
        currentStage: 'error',
        stageMessage: 'Failed to complete note generation',
        errorMessage: err?.message || 'Unknown processing error',
      });
      setToast({
        type: 'error',
        title: 'Processing Notice',
        message: 'Could not complete AI note synthesis. Recording was saved safely.',
        duration: 4000,
      });
    }
  };

  // Discard recording
  const handleDiscard = async () => {
    Alert.alert(
      'Discard Recording?',
      'Are you sure you want to discard this recording? The audio will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            stopTimerTicker();
            sessionStartTimeRef.current = null;
            pausedDurationRef.current = 0;
            lastPausedAtRef.current = null;
            await audioRecorder.cancelRecording();
            discardRecordingSession();
          },
        },
      ]
    );
  };

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeMeetingTitle =
    activeRecording.meetingTitle ||
    meetings.find((m) => m.id === selectedMeetingId)?.title ||
    'Quick Voice Note';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Meeting Note Taker</Text>
          <View style={[styles.privacyPill, { backgroundColor: colors.surfaceContainer }]}>
            <Ionicons name="flash" size={13} color={colors.primary} />
            <Text style={[styles.privacyPillText, { color: colors.primary }]}>
              Local Audio · Cloud AI
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>
        {/* State 1: Active Processing (Transcribe -> AI Notes) */}
        {processingState.isProcessing && (
          <View style={[styles.card, styles.processingCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <View style={styles.processingHeader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.processingTitle, { color: colors.text }]}>
                {processingState.currentStage === 'transcribing'
                  ? 'Transcribing Audio'
                  : 'AI Creating Meeting Notes'}
              </Text>
            </View>

            {/* Step Indicators */}
            <View style={styles.stepIndicatorRow}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor:
                        processingState.currentStage === 'transcribing'
                          ? colors.primary
                          : colors.secondary,
                    },
                  ]}>
                  {processingState.currentStage === 'summarizing' ? (
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  ) : (
                    <Text style={styles.stepBadgeText}>1</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, { color: colors.text }]}>Transcribe</Text>
              </View>

              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor:
                      processingState.currentStage === 'summarizing'
                        ? colors.secondary
                        : colors.cardBorder,
                  },
                ]}
              />

              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor:
                        processingState.currentStage === 'summarizing'
                          ? colors.primary
                          : colors.surfaceContainerHigh,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.stepBadgeText,
                      {
                        color:
                          processingState.currentStage === 'summarizing'
                            ? '#fff'
                            : colors.textSecondary,
                      },
                    ]}>
                    2
                  </Text>
                </View>
                <Text style={[styles.stepLabel, { color: colors.text }]}>AI Notes</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainer }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${processingState.progressPercent}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>

            <Text style={[styles.processingMessage, { color: colors.textSecondary }]}>
              {processingState.stageMessage}
            </Text>

            <View style={styles.modelTagRow}>
              <Ionicons name="sparkles" size={12} color={colors.primary} />
              <Text style={[styles.modelTagText, { color: colors.primary }]}>
                {processingState.currentStage === 'transcribing'
                  ? settings.activeEngine === 'groq'
                    ? `Groq Whisper (${settings.groqWhisperModel})`
                    : `Sarvam Saaras (${settings.sarvamSttModel})`
                  : settings.activeEngine === 'groq'
                  ? `Groq Llama (${settings.groqLlmModel})`
                  : `Sarvam AI (${settings.sarvamLlmModel})`}
              </Text>
            </View>
          </View>
        )}

        {/* State 2: Completed Result Preview */}
        {!processingState.isProcessing && completedRecording && (
          <View style={[styles.card, styles.completedCard, { backgroundColor: colors.surface, borderColor: '#10B981' }]}>
            <View style={styles.completedHeader}>
              <View style={styles.completedTitleRow}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={[styles.completedTitle, { color: colors.text }]}>Notes Generated</Text>
              </View>
              <Text style={[styles.completedMeta, { color: colors.textSecondary }]}>
                {formatTimer(completedRecording.durationSeconds)} recorded
              </Text>
            </View>

            {/* Executive Summary Snippet */}
            {completedRecording.summary?.executiveSummary && (
              <View style={[styles.summarySnippetBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[styles.summarySnippetLabel, { color: colors.primary }]}>
                  Executive Summary
                </Text>
                <Text style={[styles.summarySnippetText, { color: colors.text }]} numberOfLines={3}>
                  {completedRecording.summary.executiveSummary}
                </Text>
              </View>
            )}

            {/* Action Items Count */}
            {completedRecording.summary?.actionItems && (
              <View style={styles.actionItemsCountRow}>
                <Ionicons name="checkbox" size={16} color={colors.secondary} />
                <Text style={[styles.actionItemsCountText, { color: colors.text }]}>
                  {completedRecording.summary.actionItems.length} Action Items Identified
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.completedActionsRow}>
              <TouchableOpacity
                onPress={() => router.push(`/notes/${completedRecording.id}`)}
                style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.primaryActionBtnText, { color: colors.primaryText }]}>
                  View Full Note
                </Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCompletedRecording(null);
                  resetProcessingState();
                }}
                style={[styles.secondaryActionBtn, { borderColor: colors.border }]}>
                <Ionicons name="mic-outline" size={16} color={colors.text} />
                <Text style={[styles.secondaryActionBtnText, { color: colors.text }]}>
                  Record Another
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* State 3: Active Recording Session */}
        {activeRecording.isRecording && !processingState.isProcessing && (
          <View style={[styles.card, styles.recordingCard, { backgroundColor: colors.surface, borderColor: colors.coral }]}>
            <View style={styles.recordingHeaderRow}>
              <View style={styles.recordingPill}>
                <View
                  style={[
                    styles.recordingPulseDot,
                    { backgroundColor: activeRecording.isPaused ? '#F5C242' : '#E06D53' },
                  ]}
                />
                <Text
                  style={[
                    styles.recordingPillText,
                    { color: activeRecording.isPaused ? '#B45309' : '#C8533A' },
                  ]}>
                  {activeRecording.isPaused ? 'PAUSED' : 'RECORDING (OFFLINE)'}
                </Text>
              </View>

              <Text style={[styles.recordingTimerText, { color: colors.text }]}>
                {formatTimer(activeRecording.elapsedSeconds)}
              </Text>
            </View>

            <Text style={[styles.meetingTitleDisplay, { color: colors.text }]}>
              {activeMeetingTitle}
            </Text>

            {/* Live Waveform visualizer */}
            <View style={styles.waveformWrapper}>
              <WaveformVisualizer
                isRecording={activeRecording.isRecording}
                isPaused={activeRecording.isPaused}
                meterLevel={activeRecording.meterLevel}
                barCount={26}
              />
            </View>

            <Text style={[styles.recordingHint, { color: colors.textSecondary }]}>
              Audio is captured locally in 16kHz PCM WAV. No streaming data is sent over the network.
            </Text>

            {/* Recording Controls */}
            <View style={styles.controlsRow}>
              <TouchableOpacity
                onPress={handleDiscard}
                style={[styles.iconControlBtn, { backgroundColor: colors.surfaceContainer }]}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={activeRecording.isPaused ? handleResume : handlePause}
                style={[styles.iconControlBtn, { backgroundColor: colors.surfaceContainer }]}>
                <Ionicons
                  name={activeRecording.isPaused ? 'play' : 'pause'}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleStop}
                style={[styles.stopBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="stop" size={20} color={colors.primaryText} />
                <Text style={[styles.stopBtnText, { color: colors.primaryText }]}>
                  Stop & Transcribe
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* State 4: Idle / Ready to Record */}
        {!activeRecording.isRecording && !processingState.isProcessing && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Ready to Record</Text>
            <Text style={[styles.cardSectionSubtitle, { color: colors.textSecondary }]}>
              Select an upcoming meeting or record an ad-hoc voice note. Once recorded, the app transcribes and generates notes automatically.
            </Text>

            {/* Active API Endpoints Card */}
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={[
                styles.apiBadgeCard,
                { backgroundColor: colors.surfaceContainerLow, borderColor: colors.cardBorder },
              ]}>
              <View style={styles.apiBadgeLeft}>
                <View style={[styles.apiBadgeIconBg, { backgroundColor: colors.primaryContainer }]}>
                  <Ionicons name="flash" size={15} color={colors.primary} />
                </View>
                <View style={styles.apiBadgeTextCol}>
                  <Text style={[styles.apiBadgeTitle, { color: colors.text }]}>
                    {settings.activeEngine === 'groq'
                      ? 'Groq Turbo Engine (Whisper + Llama 3.3)'
                      : 'Sarvam AI Engine (Saaras v4 + Sarvam 105B)'}
                  </Text>
                  <Text style={[styles.apiBadgeSub, { color: colors.textSecondary }]}>
                    {settings.activeEngine === 'groq'
                      ? '⚡ Sub-second cloud speech transcription & reasoning'
                      : '🇮🇳 Multilingual Indian languages & regional speech'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Meeting selector */}
            <TouchableOpacity
              onPress={() => setMeetingPickerOpen(true)}
              style={[styles.pickerTrigger, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <View style={styles.pickerTriggerLeft}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={[styles.pickerTriggerText, { color: colors.text }]} numberOfLines={1}>
                  {meetings.find((m) => m.id === selectedMeetingId)?.title || 'Quick Voice Note (Ad-hoc)'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Large Record CTA */}
            <View style={styles.recordCtaContainer}>
              <TouchableOpacity
                onPress={handleStart}
                activeOpacity={0.85}
                style={[styles.bigRecordButton, { backgroundColor: colors.primary }]}>
                <View style={styles.bigRecordInner}>
                  <Ionicons name="mic" size={38} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.recordCtaPrompt, { color: colors.text }]}>Tap to Record</Text>
              <Text style={[styles.recordCtaSubtext, { color: colors.textSecondary }]}>
                Zero real-time data fetching · 100% on-device
              </Text>
            </View>

            {/* Pipeline Flow Guide */}
            <View style={[styles.flowGuideBox, { backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={[styles.flowGuideTitle, { color: colors.textSecondary }]}>
                HOW IT WORKS
              </Text>
              <View style={styles.flowStepRow}>
                <View style={[styles.flowStepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.flowStepNumberText}>1</Text>
                </View>
                <View style={styles.flowStepTextCol}>
                  <Text style={[styles.flowStepHeading, { color: colors.text }]}>Record Audio</Text>
                  <Text style={[styles.flowStepDescription, { color: colors.textSecondary }]}>
                    Captures 16kHz PCM audio strictly to local storage without streaming calls.
                  </Text>
                </View>
              </View>

              <View style={styles.flowStepRow}>
                <View style={[styles.flowStepNumber, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.flowStepNumberText}>2</Text>
                </View>
                <View style={styles.flowStepTextCol}>
                  <Text style={[styles.flowStepHeading, { color: colors.text }]}>Transcribe Audio</Text>
                  <Text style={[styles.flowStepDescription, { color: colors.textSecondary }]}>
                    Converts audio into timestamped segments and speaker boundaries.
                  </Text>
                </View>
              </View>

              <View style={styles.flowStepRow}>
                <View style={[styles.flowStepNumber, { backgroundColor: colors.tertiary }]}>
                  <Text style={[styles.flowStepNumberText, { color: '#3D2E00' }]}>3</Text>
                </View>
                <View style={styles.flowStepTextCol}>
                  <Text style={[styles.flowStepHeading, { color: colors.text }]}>AI Model Creates Notes</Text>
                  <Text style={[styles.flowStepDescription, { color: colors.textSecondary }]}>
                    Synthesizes executive summary, key decisions, and action item checklist.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Meeting Picker Modal */}
      <Modal visible={meetingPickerOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Meeting Context</Text>
              <TouchableOpacity onPress={() => setMeetingPickerOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setSelectedMeetingId(undefined);
                setMeetingPickerOpen(false);
              }}
              style={[
                styles.meetingOption,
                !selectedMeetingId && { backgroundColor: colors.primaryContainer },
              ]}>
              <Ionicons
                name="mic-outline"
                size={18}
                color={!selectedMeetingId ? colors.primary : colors.textSecondary}
              />
              <View style={styles.meetingOptionTextCol}>
                <Text
                  style={[
                    styles.meetingOptionTitle,
                    { color: !selectedMeetingId ? colors.primary : colors.text },
                  ]}>
                  Quick Voice Note
                </Text>
                <Text style={[styles.meetingOptionSub, { color: colors.textSecondary }]}>
                  General standalone recording session
                </Text>
              </View>
            </TouchableOpacity>

            {meetings.map((m) => {
              const isSelected = selectedMeetingId === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => {
                    setSelectedMeetingId(m.id);
                    setMeetingPickerOpen(false);
                  }}
                  style={[
                    styles.meetingOption,
                    isSelected && { backgroundColor: colors.primaryContainer },
                  ]}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <View style={styles.meetingOptionTextCol}>
                    <Text
                      style={[
                        styles.meetingOptionTitle,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}>
                      {m.title}
                    </Text>
                    <Text style={[styles.meetingOptionSub, { color: colors.textSecondary }]}>
                      {m.startTime} · {m.attendees.length} participants
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  privacyPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  apiBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  apiBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    backgroundColor: 'transparent',
  },
  apiBadgeIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiBadgeTextCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  apiBadgeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  apiBadgeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  pickerTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    backgroundColor: 'transparent',
  },
  pickerTriggerText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  recordCtaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  bigRecordButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E06D53',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  bigRecordInner: {
    backgroundColor: 'transparent',
  },
  recordCtaPrompt: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
  },
  recordCtaSubtext: {
    fontSize: 12,
    marginTop: 3,
  },
  flowGuideBox: {
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    gap: 12,
  },
  flowGuideTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  flowStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'transparent',
  },
  flowStepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  flowStepNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  flowStepTextCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flowStepHeading: {
    fontSize: 13,
    fontWeight: '600',
  },
  flowStepDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  recordingCard: {
    borderWidth: 1.5,
  },
  recordingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  recordingPulseDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  recordingPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  recordingTimerText: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  meetingTitleDisplay: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  waveformWrapper: {
    marginVertical: 14,
    backgroundColor: 'transparent',
  },
  recordingHint: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  iconControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  processingCard: {
    borderWidth: 1.5,
    gap: 14,
  },
  processingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepLine: {
    width: 32,
    height: 2,
    borderRadius: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  processingMessage: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  modelTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'transparent',
  },
  modelTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  completedCard: {
    borderWidth: 1.5,
    gap: 12,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  completedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  completedMeta: {
    fontSize: 12,
  },
  summarySnippetBox: {
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  summarySnippetLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summarySnippetText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionItemsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  actionItemsCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  completedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  primaryActionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
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
    maxHeight: '65%',
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  meetingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    backgroundColor: 'transparent',
  },
  meetingOptionTextCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  meetingOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  meetingOptionSub: {
    fontSize: 12,
    marginTop: 2,
  },
});

