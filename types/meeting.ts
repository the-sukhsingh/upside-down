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

export interface UserSettings {
  userName: string;
  userEmail: string;
  engineMode: 'local' | 'cloud';
  whisperModel: 'ggml-tiny.en.bin' | 'ggml-base.en.bin' | 'ggml-small.en.bin';
  whisperModelDownloaded: boolean;
  activeSlmModel: string;
  slmModelDownloaded: boolean;
  cloudApiKey?: string;
  autoTranscribe: boolean;
  autoSummarize: boolean;
  audioQuality: 'high' | 'standard';
}
