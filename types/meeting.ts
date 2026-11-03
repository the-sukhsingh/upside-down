export type MeetingStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export interface EvidenceCitation {
  startTime: number; // in seconds
  endTime: number; // in seconds
  quote?: string;
}

export type CommitmentDirection = 'i_owe' | 'they_owe_me';
export type CommitmentStatus = 'pending' | 'completed' | 'overdue';

export interface Commitment {
  id: string;
  recordingId?: string;
  meetingTitle?: string;
  speaker: string; // e.g. "Alex" or "Me"
  person: string; // the other party
  promise: string; // "Send the revised architecture deck by Friday"
  direction: CommitmentDirection; // "i_owe" vs "they_owe_me"
  dueDate?: string; // e.g. "2026-11-06"
  deadlinePhrase?: string; // "by Friday 5 PM"
  status: CommitmentStatus;
  completed: boolean;
  completedAt?: string;
  evidence?: EvidenceCitation;
  reminderSent?: boolean;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  done: boolean;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  deadlineTimestamp?: string;
  category?: string;
  evidence?: EvidenceCitation;
  calendarSynced?: boolean;
}

export interface TranscriptSegment {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  speaker: string;
  text: string;
}

export interface KeyDecisionItem {
  id: string;
  decision: string;
  evidence?: EvidenceCitation;
}

export interface MeetingSummary {
  executiveSummary: string;
  keyTopics?: string[];
  keyDecisions: string[];
  structuredDecisions?: KeyDecisionItem[];
  actionItems: ActionItem[];
  commitments?: Commitment[];
  followUps?: string[];
}

export type RecordingLifecycleStatus =
  | 'idle'
  | 'recording'
  | 'recorded'
  | 'transcribing'
  | 'summarizing'
  | 'completed'
  | 'error';

export interface Recording {
  id: string;
  meetingId?: string;
  meetingTitle: string;
  uri: string;
  durationSeconds: number;
  fileSizeBytes: number;
  createdAt: string;
  audioFormat?: 'wav_16khz_mono' | 'webm' | 'm4a';
  status: RecordingLifecycleStatus;
  transcript?: string;
  transcriptSegments?: TranscriptSegment[];
  summary?: MeetingSummary;
  commitments?: Commitment[];
  notes?: string;
  tags?: string[];
}

export interface PreMeetingBriefing {
  id: string;
  meetingId: string;
  generatedAt: string;
  headline: string;
  attentionItems: string[];
  outstandingTasks: ActionItem[];
  previousDecisions: string[];
  unresolvedQuestions: string[];
  suggestedAgenda: string[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "10:00 AM"
  endTime?: string;
  durationMinutes?: number;
  meetingUrl?: string;
  attendees: string[];
  agenda?: string;
  notes?: string;
  status: MeetingStatus;
  recordingIds: string[];
  briefing?: PreMeetingBriefing;
  createdAt: string;
}

export type ProcessingEngine = 'groq' | 'sarvam';
export type TranscriptionProvider = ProcessingEngine;
export type AIModelProvider = ProcessingEngine;

export type FollowUpTone = 'executive' | 'casual' | 'whatsapp' | 'action_oriented';

export interface FollowUpDraft {
  tone: FollowUpTone;
  subject?: string;
  body: string;
  channel: 'email' | 'whatsapp';
}

export interface UserSettings {
  userName: string;
  userEmail: string;

  // Active Processing Engine ('groq' for ultra-fast, 'sarvam' for multilingual Indian speech)
  activeEngine: ProcessingEngine;

  // Groq Model Profiles
  groqWhisperModel: 'whisper-large-v3-turbo' | 'whisper-large-v3' | 'distil-whisper-large-v3-en';
  groqLlmModel: string;

  // Sarvam Model Profiles
  sarvamSttModel: 'saaras:v4' | 'saaras:v3';
  sarvamLanguageCode: string; // 'unknown' | 'en-IN' | 'hi-IN' | etc.
  sarvamLlmModel: 'sarvam-105b' | 'sarvam-105b-conversations';

  autoTranscribe: boolean;
  autoSummarize: boolean;
  audioQuality: 'high' | 'standard';
}

export interface LiveContextMatch {
  id: string;
  recordingId: string;
  meetingId?: string;
  meetingTitle: string;
  date: string;
  matchedTopic: string;
  relevanceScore: number; // 0.0 - 1.0
  aiSynthesis?: string;
  keyDecisions: string[];
  openCommitments: Commitment[];
  actionItems: ActionItem[];
  relevantSnippet?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface LiveTopicRadarState {
  isActive: boolean;
  isListening: boolean;
  currentSpeechSnippet?: string;
  detectedTopics: string[];
  matchedContexts: LiveContextMatch[];
  pinnedContexts: LiveContextMatch[];
}

export interface IdeaCollisionSourceNote {
  recordingId: string;
  meetingTitle: string;
  date: string;
  excerptSnippet: string;
}

export interface IdeaCollision {
  id: string;
  title: string;
  sharedMechanism: string;
  overlappingConcepts: string[];
  whyUseful: string;
  smallExperiment: string;
  sourceNotes: IdeaCollisionSourceNote[];
  relevanceScore: number; // 0.0 - 1.0
  createdAt: string;
  status: 'active' | 'saved' | 'dismissed' | 'experimenting';
}

