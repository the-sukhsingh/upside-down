export type MeetingStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  done: boolean;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  category?: string;
}

export interface TranscriptSegment {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  speaker: string;
  text: string;
}

export interface MeetingSummary {
  executiveSummary: string;
  keyTopics?: string[];
  keyDecisions: string[];
  actionItems: ActionItem[];
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
  notes?: string;
  tags?: string[];
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
  createdAt: string;
}

export type ProcessingEngine = 'groq' | 'sarvam';
export type TranscriptionProvider = ProcessingEngine;
export type AIModelProvider = ProcessingEngine;

export interface UserSettings {
  userName: string;
  userEmail: string;

  // Active Processing Engine ('groq' for ultra-fast, 'sarvam' for multilingual Indian speech)
  activeEngine: ProcessingEngine;

  // Groq Model Profiles
  groqWhisperModel: 'whisper-large-v3-turbo' | 'whisper-large-v3' | 'distil-whisper-large-v3-en';
  groqLlmModel: 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant' | 'gemma2-9b-it' | 'mixtral-8x7b-32768';

  // Sarvam Model Profiles
  sarvamSttModel: 'saaras:v4' | 'saaras:v3';
  sarvamLanguageCode: string; // 'unknown' | 'en-IN' | 'hi-IN' | etc.
  sarvamLlmModel: 'sarvam-105b' | 'sarvam-105b-conversations';

  autoTranscribe: boolean;
  autoSummarize: boolean;
  audioQuality: 'high' | 'standard';
}
