import { create } from 'zustand';
import {
  Meeting,
  Recording,
  UserSettings,
  MeetingSummary,
  ActionItem,
  RecordingLifecycleStatus,
  Commitment,
  PreMeetingBriefing,
  LiveContextMatch,
  IdeaCollision,
} from '@/types/meeting';

export interface ProcessingState {
  isProcessing: boolean;
  currentStage: 'idle' | 'transcribing' | 'summarizing' | 'completed' | 'error';
  stageMessage: string;
  progressPercent: number;
  recordingId?: string;
  errorMessage?: string;
}

interface ActiveRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  meetingId?: string;
  meetingTitle: string;
  audioUri: string | null;
  meterLevel: number;
  liveTopics?: string[];
  pinnedContexts?: LiveContextMatch[];
}

const INITIAL_SETTINGS: UserSettings = {
  userName: 'Product Team',
  userEmail: 'team@meetanotes.ai',
  activeEngine: 'groq',

  // Groq Model Profiles
  groqWhisperModel: 'whisper-large-v3-turbo',
  groqLlmModel: 'openai/gpt-oss-120b',

  // Sarvam Model Profiles
  sarvamSttModel: 'saaras:v4',
  sarvamLanguageCode: 'unknown',
  sarvamLlmModel: 'sarvam-105b',

  autoTranscribe: true,
  autoSummarize: true,
  audioQuality: 'high',
};

const formatLocalDate = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DEMO_RECORDINGS: Recording[] = [
  {
    id: 'rec-demo-1',
    meetingTitle: 'Sprint 24 Architecture & Note Pipeline Sync',
    uri: 'file:///local/recordings/demo_sprint_sync.wav',
    durationSeconds: 420,
    fileSizeBytes: 13440000,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'completed',
    transcript: `[00:00 - Alex (Tech Lead)]: Welcome everyone to the Sprint 24 architecture review. Today our primary task is locking down the meeting note taker app flow.
    
[00:45 - Sarah (Frontend)]: I have implemented the audio recording screen with zero real-time data fetching during the recording phase. Everything records directly to local storage to guarantee 100% privacy.

[02:10 - Connor (Backend)]: Once the user taps Stop Recording, our post-processing kicks in. Step 1 is offline transcription into timestamped segments. Step 2 is on-device SLM synthesis with Gemma 2B.

[04:20 - Alex (Tech Lead)]: Agreed. We decided to keep speech transcription and note generation as distinct post-recording steps. Action item for Connor: finalize the offline export formats. Sarah will review the action items checklist.

[05:30 - Sarah (Frontend)]: Sounds great, I will finish the checklist component today.`,
    summary: {
      executiveSummary:
        'The team aligned on the meeting note taker pipeline, ensuring strictly offline recording with zero real-time network calls. Post-recording transcription runs first, followed immediately by local SLM note and action item extraction.',
      keyTopics: ['Privacy architecture', 'Post-recording transcription', 'On-device SLM models'],
      keyDecisions: [
        'Enforce 100% zero live data fetching while recording is active.',
        'Adopt staged pipeline: Record -> Transcribe -> AI Notes Generation.',
        'Use Google Gemma 2B and SmolLM2 for local on-device action item parsing.',
      ],
      actionItems: [
        {
          id: 'act-demo-1',
          task: 'Finalize local markdown export formats and sharing options',
          assignee: 'Connor',
          done: true,
          priority: 'high',
          dueDate: 'Today',
          category: 'Backend',
        },
        {
          id: 'act-demo-2',
          task: 'Review interactive action items checklist and dark mode styles',
          assignee: 'Sarah',
          done: false,
          priority: 'high',
          dueDate: 'Today',
          category: 'Frontend',
        },
        {
          id: 'act-demo-3',
          task: 'Verify 16kHz WAV audio recorder consistency across mobile and web',
          assignee: 'Alex',
          done: false,
          priority: 'medium',
          dueDate: 'Tomorrow',
          category: 'QA',
        },
      ],
      followUps: [
        'Perform end-to-end user testing on simulated low-memory devices',
        'Review sprint velocity on Friday',
      ],
    },
    notes: `# Sprint 24 Architecture & Note Pipeline Sync

## Executive Summary
The team aligned on the meeting note taker pipeline, ensuring strictly offline recording with zero real-time network calls. Post-recording transcription runs first, followed immediately by local SLM note and action item extraction.

## Key Decisions
- **Decision:** Enforce 100% zero live data fetching while recording is active.
- **Decision:** Adopt staged pipeline: Record -> Transcribe -> AI Notes Generation.
- **Decision:** Use Google Gemma 2B and SmolLM2 for local on-device action item parsing.

## Action Items
- [x] **Finalize local markdown export formats and sharing options** (Connor)
- [ ] **Review interactive action items checklist and dark mode styles** (Sarah)
- [ ] **Verify 16kHz WAV audio recorder consistency across mobile and web** (Alex)
`,
    tags: ['Architecture', 'Sprint', 'AI Notes'],
  },
  {
    id: 'rec-demo-2',
    meetingTitle: 'Design Critique: Zero-Friction Note Taking Experience',
    uri: 'file:///local/recordings/demo_design_critique.wav',
    durationSeconds: 310,
    fileSizeBytes: 9920000,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'completed',
    transcript: `[00:00 - Emily (Design)]: Let us review the user journey for the meeting note taker. The flow should feel effortless: user taps Record, sees a subtle wave visualizer, stops recording, and watches as the transcript and note appear.

[01:15 - David (Product)]: We decided to eliminate distracting live streaming text while speaking. The user should be able to focus on the meeting without watching transcript glitches on screen.

[03:20 - Emily (Design)]: Action item for Emily: deliver the updated card layouts with prominent action item checkmarks and tag filters.`,
    summary: {
      executiveSummary:
        'The design critique established that the user experience must remain focused and distraction-free during active recording. Transcription and AI note creation are surfaced cleanly once the session finishes.',
      keyTopics: ['User experience rhythm', 'Distraction-free recording', 'Checklist interface'],
      keyDecisions: [
        'Hide live text streaming during audio recording to preserve conversation focus.',
        'Surface distinct progress indicators for Transcription and AI Note Synthesis.',
      ],
      actionItems: [
        {
          id: 'act-demo-4',
          task: 'Deliver updated card layouts with prominent action item checkmarks',
          assignee: 'Emily',
          done: false,
          priority: 'high',
          dueDate: 'By Friday',
          category: 'Design',
        },
      ],
    },
    notes: `# Design Critique: Zero-Friction Note Taking Experience

## Executive Summary
The design critique established that the user experience must remain focused and distraction-free during active recording.

## Key Decisions
- **Decision:** Hide live text streaming during audio recording to preserve conversation focus.
- **Decision:** Surface distinct progress indicators for Transcription and AI Note Synthesis.
`,
    tags: ['Design', 'UX', 'AI Notes'],
  },
  {
    id: 'rec-seed-game',
    meetingTitle: 'Game Mechanics & Micro-Progression Loops',
    uri: 'file:///local/recordings/demo_game_mechanics.wav',
    durationSeconds: 240,
    fileSizeBytes: 7680000,
    createdAt: new Date(Date.now() - 86400000 * 21).toISOString(),
    status: 'completed',
    transcript: `[00:00 - Solo Thought]: I was reflecting on why RPG games keep players hooked for hundreds of hours. They never punish early mistakes with catastrophic loss. Instead, games use micro-milestones and variable ratio rewards. Every minor quest grants a small burst of XP, and difficulty scales dynamically so the player stays in flow without feeling defeated.`,
    summary: {
      executiveSummary:
        'Analyzed core game loop psychology: sustaining long-term engagement through progressive micro-rewards, adaptive challenge scaling, and grace mechanics that convert failure into iterative learning.',
      keyTopics: ['Game progression', 'Variable ratio rewards', 'Flow state psychology', 'Loss aversion'],
      keyDecisions: [
        'Frame progress around cumulative mastery points rather than binary win/loss conditions.',
        'Use unpredictable secondary rewards to reinforce core habit loops.',
      ],
      actionItems: [],
      followUps: ['Explore how RPG quest structures map to non-gaming productivity systems.'],
    },
    notes: `# Game Mechanics & Micro-Progression Loops
*Recorded 3 weeks ago · Solo Voice Reflection*

## Core Principle
Games sustain engagement by shifting from frequent early rewards to unpredictable mastery challenges. Crucially, a failed attempt never wipes out accumulated progression—players keep their earned equipment and insights.
`,
    tags: ['Game Design', 'Psychology', 'Progression Loops'],
  },
  {
    id: 'rec-seed-student',
    meetingTitle: 'Student Motivation & Autonomous Learning',
    uri: 'file:///local/recordings/demo_student_motivation.wav',
    durationSeconds: 310,
    fileSizeBytes: 9920000,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    status: 'completed',
    transcript: `[00:00 - Guest Lecture Notes]: Discussed why conventional grading often destroys intrinsic motivation in learners. When grades are binary pass or fail, students become risk-averse and cheat to protect their GPA. In contrast, scaffolded learning environments reward continuous small steps and offer retake tokens so failure is treated as feedback.`,
    summary: {
      executiveSummary:
        'Observations on education psychology: conventional grading penalizes risk-taking, whereas scaffolded autonomy and retake tokens encourage resilience and self-directed mastery.',
      keyTopics: ['Student autonomy', 'Intrinsic motivation', 'Growth mindset', 'Low-stakes feedback'],
      keyDecisions: [
        'Replace punitive penalties with iterative reflection checkpoints.',
        'Provide low-stakes practice environments where failure carries zero penalty.',
      ],
      actionItems: [],
      followUps: ['Investigate feedback loops in self-guided learning platforms.'],
    },
    notes: `# Student Motivation & Autonomous Learning
*Recorded 2 weeks ago · Education & Learning Notes*

## Core Principle
Students thrive when evaluation is continuous and failure is treated as iteration rather than penalty. Scaffolded milestone tokens keep motivation alive.
`,
    tags: ['Education', 'Learning Psychology', 'Motivation'],
  },
  {
    id: 'rec-seed-habit',
    meetingTitle: 'Habit Tracker Retention Breakdown',
    uri: 'file:///local/recordings/demo_habit_tracker.wav',
    durationSeconds: 195,
    fileSizeBytes: 6240000,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: 'completed',
    transcript: `[00:00 - Product Brainstorm]: Why do 85% of people abandon habit tracking apps by Day 5? The biggest killer is streak anxiety. If you have a 10-day streak and miss Day 11 due to travel, the counter resets to zero. That binary penalty triggers the "what-the-hell" effect where users give up completely.`,
    summary: {
      executiveSummary:
        'Explored the high drop-off rate in personal habit apps: traditional binary streak counters induce catastrophic demotivation upon the first missed day, destroying consistency.',
      keyTopics: ['Habit tracking friction', 'Streak anxiety', 'User retention drop-off', 'Behavioral design'],
      keyDecisions: [
        'Acknowledge that binary streak counters are counter-productive for long-term consistency.',
        'Design a habit architecture that survives imperfect days.',
      ],
      actionItems: [],
      followUps: ['Design an alternative to standard streak counters.'],
    },
    notes: `# Habit Tracker Retention Breakdown
*Recorded 4 days ago · Product Strategy Sync*

## Core Problem
Binary streak counters create immense fragile pressure. When users miss a single day, the loss feels final, leading to app abandonment.
`,
    tags: ['Product Strategy', 'Habits', 'Behavioral Design'],
  },
];

const DEMO_COLLISIONS: IdeaCollision[] = [
  {
    id: 'collision-progressive-rewards',
    title: 'Adaptive Progressive Rewards in Habit Building',
    sharedMechanism:
      'Progressive Micro-Rewards & Low-Stakes Calibration (replacing binary pass/fail streaks with game-like incremental mastery tiers).',
    overlappingConcepts: [
      'Variable reward schedules',
      'Low-stakes feedback',
      'Extrinsic-to-intrinsic transition',
      'Streak resilience',
    ],
    whyUseful:
      'Directly bridges game design psychology and educational scaffolding into personal productivity. Instead of destroying habit streaks when a day is missed, habits borrow the gaming concept of "shield tokens" and student mastery tiers, keeping the user motivated long-term.',
    smallExperiment:
      'Create a 5-day habit test where missing day 3 grants a "Grace Token" and asks for a 30-second reflection instead of resetting the streak count to zero. Track if 80%+ continue to Day 7.',
    sourceNotes: [
      {
        recordingId: 'rec-seed-game',
        meetingTitle: 'Game Mechanics & Micro-Progression Loops',
        date: '3 weeks ago',
        excerptSnippet:
          'Games sustain engagement by shifting from frequent early rewards to unpredictable mastery challenges without catastrophic loss.',
      },
      {
        recordingId: 'rec-seed-student',
        meetingTitle: 'Student Motivation & Autonomous Learning',
        date: '2 weeks ago',
        excerptSnippet:
          'Students thrive when evaluation is continuous and failure is treated as iteration rather than penalty.',
      },
      {
        recordingId: 'rec-seed-habit',
        meetingTitle: 'Habit Tracker Retention Breakdown',
        date: '4 days ago',
        excerptSnippet:
          'Binary streak counters induce catastrophic demotivation on the first missed day, leading to total abandonment.',
      },
    ],
    relevanceScore: 0.94,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'active',
  },
  {
    id: 'collision-cognitive-decoupling',
    title: 'Zero-Friction Cognitive Scaffolding in Note Creation',
    sharedMechanism:
      'Non-Blocking Cognitive Decoupling (decoupling active live capture from background synthesis so users stay immersed in the moment).',
    overlappingConcepts: [
      'Cognitive load reduction',
      'Asynchronous processing',
      'Distraction-free focus',
      'Offline-first reliability',
    ],
    whyUseful:
      'Combines offline-first recording architecture with distraction-free UI so the meeting participant stays 100% engaged in dialogue without watching live transcription artifacts.',
    smallExperiment:
      'Compare user sentiment when transcript text is hidden during meetings vs streamed live; measure conversation distraction frequency across 5 test recordings.',
    sourceNotes: [
      {
        recordingId: 'rec-demo-1',
        meetingTitle: 'Sprint 24 Architecture & Note Pipeline Sync',
        date: 'Today',
        excerptSnippet:
          'Enforce 100% zero live data fetching while recording is active; record locally to guarantee privacy and flow.',
      },
      {
        recordingId: 'rec-demo-2',
        meetingTitle: 'Design Critique: Zero-Friction Note Taking Experience',
        date: 'Yesterday',
        excerptSnippet:
          'Hide live text streaming during audio recording to preserve conversation focus and eliminate distraction.',
      },
    ],
    relevanceScore: 0.89,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'active',
  },
];

const DEMO_MEETINGS: Meeting[] = [
  {
    id: 'm-1',
    title: 'Product Roadmap & Q4 Milestone Planning',
    date: formatLocalDate(new Date()),
    startTime: '10:00 AM',
    durationMinutes: 45,
    attendees: ['Alex', 'Sarah', 'Connor', 'David'],
    agenda: 'Review core milestones, discuss offline note taking flow, assign tasks.',
    status: 'upcoming',
    recordingIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm-2',
    title: 'Engineering Deep Dive: On-Device Speech Models',
    date: formatLocalDate(new Date()),
    startTime: '02:30 PM',
    durationMinutes: 30,
    attendees: ['Alex', 'Connor'],
    agenda: 'Evaluate Whisper Tiny vs Base latency on mobile hardware.',
    status: 'upcoming',
    recordingIds: [],
    createdAt: new Date().toISOString(),
  },
];

const DEMO_COMMITMENTS: Commitment[] = [
  {
    id: 'com-demo-1',
    recordingId: 'rec-demo-1',
    meetingTitle: 'Sprint 24 Architecture & Note Pipeline Sync',
    speaker: 'Sarah',
    person: 'Alex & Team',
    promise: 'Finish the checklist component and dark mode styles today',
    direction: 'they_owe_me',
    dueDate: formatLocalDate(new Date()),
    deadlinePhrase: 'today',
    status: 'pending',
    completed: false,
    evidence: {
      startTime: 330,
      endTime: 345,
      quote: 'I will finish the checklist component today.',
    },
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'com-demo-2',
    recordingId: 'rec-demo-1',
    meetingTitle: 'Sprint 24 Architecture & Note Pipeline Sync',
    speaker: 'Me',
    person: 'Connor',
    promise: 'Send the Groq Whisper Turbo benchmarking metrics by Friday 5 PM',
    direction: 'i_owe',
    dueDate: formatLocalDate(new Date(Date.now() + 86400000 * 3)),
    deadlinePhrase: 'by Friday 5 PM',
    status: 'pending',
    completed: false,
    evidence: {
      startTime: 260,
      endTime: 275,
      quote: 'I will send the Groq benchmark results by Friday.',
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'com-demo-3',
    recordingId: 'rec-demo-2',
    meetingTitle: 'Design Critique: Zero-Friction Note Taking Experience',
    speaker: 'Emily',
    person: 'Me',
    promise: 'Deliver updated card layouts with prominent action item checkmarks',
    direction: 'they_owe_me',
    dueDate: formatLocalDate(new Date(Date.now() + 86400000 * 2)),
    deadlinePhrase: 'by Friday',
    status: 'pending',
    completed: false,
    evidence: {
      startTime: 200,
      endTime: 215,
      quote: 'Action item for Emily: deliver updated card layouts by Friday.',
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

interface MeetingStoreState {
  meetings: Meeting[];
  recordings: Recording[];
  commitments: Commitment[];
  settings: UserSettings;
  activeRecording: ActiveRecordingState;
  processingState: ProcessingState;

  // Idea Collision Engine
  ideaCollisions: IdeaCollision[];
  dismissedCollisionIds: string[];
  isCollidingIdeas: boolean;

  // Recording actions
  startRecordingSession: (meetingId?: string, meetingTitle?: string) => void;
  pauseRecordingSession: () => void;
  resumeRecordingSession: () => void;
  updateActiveElapsed: (seconds: number) => void;
  updateActiveMeter: (level: number) => void;
  discardRecordingSession: () => void;

  // Persistence & updates
  createRecordingEntry: (audioUri: string, title?: string, meetingId?: string) => Recording;
  updateRecording: (recordingId: string, updates: Partial<Recording>) => void;
  deleteRecording: (recordingId: string) => void;
  toggleActionItem: (recordingId: string, actionItemId: string) => void;
  updateActionItem: (recordingId: string, actionItemId: string, updates: Partial<ActionItem>) => void;
  updateRecordingNotes: (recordingId: string, notes: string) => void;

  // Commitment Tracker ("Promise Radar")
  addCommitment: (commitment: Omit<Commitment, 'id' | 'createdAt'>) => Commitment;
  toggleCommitment: (id: string) => void;
  deleteCommitment: (id: string) => void;
  updateCommitment: (id: string, updates: Partial<Commitment>) => void;

  // Pre-Meeting Briefing
  setMeetingBriefing: (meetingId: string, briefing: PreMeetingBriefing) => void;

  // Live Topic & Context Radar
  addLiveTopic: (topic: string) => void;
  pinLiveContext: (context: LiveContextMatch) => void;
  unpinLiveContext: (contextId: string) => void;
  clearLiveTopics: () => void;

  // Idea Collision Engine actions
  dismissIdeaCollision: (collisionId: string) => void;
  saveIdeaCollision: (collisionId: string) => void;
  setIdeaCollisionExperimenting: (collisionId: string) => void;
  addIdeaCollision: (collision: IdeaCollision) => void;
  setIdeaCollisions: (collisions: IdeaCollision[]) => void;
  setIsCollidingIdeas: (isColliding: boolean) => void;

  // Processing state
  setProcessingState: (updates: Partial<ProcessingState>) => void;
  resetProcessingState: () => void;

  // Meetings
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'recordingIds' | 'status'>) => Meeting;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  getMeetingById: (id: string) => Meeting | undefined;

  // Settings
  updateSettings: (updates: Partial<UserSettings>) => void;
  clearAllData: () => void;
  loadDemoData: () => void;
}

export const useMeetingStore = create<MeetingStoreState>((set, get) => ({
  meetings: DEMO_MEETINGS,
  recordings: DEMO_RECORDINGS,
  commitments: DEMO_COMMITMENTS,
  settings: INITIAL_SETTINGS,

  ideaCollisions: DEMO_COLLISIONS,
  dismissedCollisionIds: [],
  isCollidingIdeas: false,

  activeRecording: {
    isRecording: false,
    isPaused: false,
    elapsedSeconds: 0,
    meetingId: undefined,
    meetingTitle: 'Meeting Note Session',
    audioUri: null,
    meterLevel: 0,
    liveTopics: [],
    pinnedContexts: [],
  },

  processingState: {
    isProcessing: false,
    currentStage: 'idle',
    stageMessage: '',
    progressPercent: 0,
    recordingId: undefined,
  },

  startRecordingSession: (meetingId, meetingTitle) => {
    const targetTitle =
      meetingTitle ||
      (meetingId ? get().getMeetingById(meetingId)?.title : 'Ad-hoc Voice Note') ||
      'Meeting Note Session';

    if (meetingId) {
      get().updateMeeting(meetingId, { status: 'in_progress' });
    }

    set({
      activeRecording: {
        isRecording: true,
        isPaused: false,
        elapsedSeconds: 0,
        meetingId,
        meetingTitle: targetTitle,
        audioUri: null,
        meterLevel: 0.25,
        liveTopics: [],
        pinnedContexts: [],
      },
    });
  },

  pauseRecordingSession: () => {
    set((state) => ({
      activeRecording: { ...state.activeRecording, isPaused: true, meterLevel: 0 },
    }));
  },

  resumeRecordingSession: () => {
    set((state) => ({
      activeRecording: { ...state.activeRecording, isPaused: false, meterLevel: 0.3 },
    }));
  },

  updateActiveElapsed: (seconds) => {
    set((state) => ({
      activeRecording: { ...state.activeRecording, elapsedSeconds: seconds },
    }));
  },

  updateActiveMeter: (level) => {
    set((state) => ({
      activeRecording: { ...state.activeRecording, meterLevel: level },
    }));
  },

  addLiveTopic: (topic) => {
    if (!topic || typeof topic !== 'string') return;
    const cleanTopic = topic.trim();
    if (!cleanTopic) return;
    const current = get().activeRecording.liveTopics || [];
    if (!current.some((t) => t.toLowerCase() === cleanTopic.toLowerCase())) {
      set((state) => ({
        activeRecording: {
          ...state.activeRecording,
          liveTopics: [cleanTopic, ...current].slice(0, 15),
        },
      }));
    }
  },

  pinLiveContext: (context) => {
    const current = get().activeRecording.pinnedContexts || [];
    if (!current.some((c) => c.id === context.id)) {
      set((state) => ({
        activeRecording: {
          ...state.activeRecording,
          pinnedContexts: [...current, { ...context, isPinned: true }],
        },
      }));
    }
  },

  unpinLiveContext: (contextId) => {
    set((state) => ({
      activeRecording: {
        ...state.activeRecording,
        pinnedContexts: (state.activeRecording.pinnedContexts || []).filter((c) => c.id !== contextId),
      },
    }));
  },

  clearLiveTopics: () => {
    set((state) => ({
      activeRecording: {
        ...state.activeRecording,
        liveTopics: [],
        pinnedContexts: [],
      },
    }));
  },

  dismissIdeaCollision: (collisionId) => {
    set((state) => ({
      dismissedCollisionIds: [...state.dismissedCollisionIds, collisionId],
      ideaCollisions: state.ideaCollisions.filter((c) => c.id !== collisionId),
    }));
  },

  saveIdeaCollision: (collisionId) => {
    set((state) => ({
      ideaCollisions: state.ideaCollisions.map((c) =>
        c.id === collisionId ? { ...c, status: 'saved' as const } : c
      ),
    }));
  },

  setIdeaCollisionExperimenting: (collisionId) => {
    set((state) => ({
      ideaCollisions: state.ideaCollisions.map((c) =>
        c.id === collisionId ? { ...c, status: 'experimenting' as const } : c
      ),
    }));
  },

  addIdeaCollision: (collision) => {
    set((state) => ({
      ideaCollisions: [collision, ...state.ideaCollisions.filter((c) => c.id !== collision.id)],
    }));
  },

  setIdeaCollisions: (collisions) => {
    set({ ideaCollisions: collisions });
  },

  setIsCollidingIdeas: (isColliding) => {
    set({ isCollidingIdeas: isColliding });
  },

  discardRecordingSession: () => {
    const active = get().activeRecording;
    if (active.meetingId) {
      get().updateMeeting(active.meetingId, { status: 'upcoming' });
    }

    set({
      activeRecording: {
        isRecording: false,
        isPaused: false,
        elapsedSeconds: 0,
        meetingId: undefined,
        meetingTitle: 'Meeting Note Session',
        audioUri: null,
        meterLevel: 0,
        liveTopics: [],
        pinnedContexts: [],
      },
    });
  },

  createRecordingEntry: (audioUri, title, meetingId) => {
    const active = get().activeRecording;
    const duration = active.elapsedSeconds || 5;
    const estimatedSizeBytes = duration * 32000; // 16kHz 16-bit Mono = 32kB/s

    const newRecording: Recording = {
      id: `rec-${Date.now()}`,
      meetingId: meetingId || active.meetingId,
      meetingTitle: title || active.meetingTitle || 'Meeting Note Session',
      uri: audioUri,
      durationSeconds: duration,
      fileSizeBytes: estimatedSizeBytes,
      createdAt: new Date().toISOString(),
      audioFormat: 'wav_16khz_mono',
      status: 'recorded',
    };

    set((state) => ({
      recordings: [newRecording, ...state.recordings],
      activeRecording: {
        isRecording: false,
        isPaused: false,
        elapsedSeconds: 0,
        meetingId: undefined,
        meetingTitle: 'Meeting Note Session',
        audioUri: null,
        meterLevel: 0,
        liveTopics: [],
        pinnedContexts: [],
      },
    }));

    if (newRecording.meetingId) {
      const targetM = get().getMeetingById(newRecording.meetingId);
      if (targetM) {
        get().updateMeeting(targetM.id, {
          status: 'completed',
          recordingIds: [...targetM.recordingIds, newRecording.id],
        });
      }
    }

    return newRecording;
  },

  updateRecording: (recordingId, updates) => {
    set((state) => {
      const nextRecordings = state.recordings.map((r) =>
        r.id === recordingId ? { ...r, ...updates } : r
      );

      // If new commitments are included in this recording, merge them into the global tracker
      let nextCommitments = state.commitments;
      const incomingCommitments = updates.summary?.commitments || updates.commitments;
      if (incomingCommitments && incomingCommitments.length > 0) {
        const existingIds = new Set(nextCommitments.map((c) => c.id));
        const newOnes = incomingCommitments.filter((c) => !existingIds.has(c.id));
        if (newOnes.length > 0) {
          nextCommitments = [...newOnes, ...nextCommitments];
        }
      }

      return {
        recordings: nextRecordings,
        commitments: nextCommitments,
      };
    });
  },

  deleteRecording: (recordingId) => {
    set((state) => ({
      recordings: state.recordings.filter((r) => r.id !== recordingId),
      commitments: state.commitments.filter((c) => c.recordingId !== recordingId),
    }));
  },

  toggleActionItem: (recordingId, actionItemId) => {
    set((state) => ({
      recordings: state.recordings.map((rec) => {
        if (rec.id !== recordingId || !rec.summary) return rec;

        const updatedActionItems = (rec.summary.actionItems || []).map((item) =>
          item.id === actionItemId ? { ...item, done: !item.done } : item
        );

        return {
          ...rec,
          summary: {
            ...rec.summary,
            actionItems: updatedActionItems,
          },
        };
      }),
    }));
  },

  updateActionItem: (recordingId, actionItemId, updates) => {
    set((state) => ({
      recordings: state.recordings.map((rec) => {
        if (rec.id !== recordingId || !rec.summary) return rec;

        const updatedActionItems = (rec.summary.actionItems || []).map((item) =>
          item.id === actionItemId ? { ...item, ...updates } : item
        );

        return {
          ...rec,
          summary: {
            ...rec.summary,
            actionItems: updatedActionItems,
          },
        };
      }),
    }));
  },

  // Commitment Tracker ("Promise Radar")
  addCommitment: (data) => {
    const newCommitment: Commitment = {
      ...data,
      id: `com-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      commitments: [newCommitment, ...state.commitments],
    }));

    return newCommitment;
  },

  toggleCommitment: (id) => {
    set((state) => ({
      commitments: state.commitments.map((c) => {
        if (c.id !== id) return c;
        const willBeDone = !c.completed;
        return {
          ...c,
          completed: willBeDone,
          status: willBeDone ? 'completed' : 'pending',
          completedAt: willBeDone ? new Date().toISOString() : undefined,
        };
      }),
    }));
  },

  deleteCommitment: (id) => {
    set((state) => ({
      commitments: state.commitments.filter((c) => c.id !== id),
    }));
  },

  updateCommitment: (id, updates) => {
    set((state) => ({
      commitments: state.commitments.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  // Pre-Meeting Briefing
  setMeetingBriefing: (meetingId, briefing) => {
    set((state) => ({
      meetings: state.meetings.map((m) =>
        m.id === meetingId ? { ...m, briefing } : m
      ),
    }));
  },

  updateRecordingNotes: (recordingId, notes) => {
    set((state) => ({
      recordings: state.recordings.map((r) => (r.id === recordingId ? { ...r, notes } : r)),
    }));
  },

  setProcessingState: (updates) => {
    set((state) => ({
      processingState: { ...state.processingState, ...updates },
    }));
  },

  resetProcessingState: () => {
    set({
      processingState: {
        isProcessing: false,
        currentStage: 'idle',
        stageMessage: '',
        progressPercent: 0,
        recordingId: undefined,
      },
    });
  },

  addMeeting: (meetingData) => {
    const newMeeting: Meeting = {
      ...meetingData,
      id: `m-${Date.now()}`,
      status: 'upcoming',
      recordingIds: [],
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      meetings: [newMeeting, ...state.meetings],
    }));

    return newMeeting;
  },

  updateMeeting: (id, updates) => {
    set((state) => ({
      meetings: state.meetings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  deleteMeeting: (id) => {
    set((state) => ({
      meetings: state.meetings.filter((m) => m.id !== id),
    }));
  },

  getMeetingById: (id) => {
    return get().meetings.find((m) => m.id === id);
  },

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
  },

  clearAllData: () => {
    set({
      recordings: [],
      meetings: [],
      commitments: [],
      ideaCollisions: [],
      dismissedCollisionIds: [],
    });
  },

  loadDemoData: () => {
    set({
      recordings: DEMO_RECORDINGS,
      meetings: DEMO_MEETINGS,
      commitments: DEMO_COMMITMENTS,
      ideaCollisions: DEMO_COLLISIONS,
      dismissedCollisionIds: [],
    });
  },
}));

