# Meeting Note Taker Application

A privacy-first, offline-ready meeting companion and AI note taker application built with React Native and Expo Router.

---

## 🎯 Core Philosophy & Flow

Unlike standard note-taking applications that make constant real-time data fetching calls or streaming transcription requests while you are speaking, this application enforces a clean **3-Stage Rhythm**:

```
[ Stage 1: Record ] ──────────────► [ Stage 2: Transcribe ] ──────────────► [ Stage 3: AI Notes ]
• Pure local 16kHz PCM WAV capture  • Runs AFTER recording stops           • On-device SLM synthesis
• ZERO live network requests        • Whisper STT offline model            • Executive summary
• Waveform meter & timer            • Speaker & timestamp alignment        • Action items checklist
• 100% conversation privacy                                                • Key decisions
```

---

## 🚀 Key Features

### 1. Zero-Fetch Local Recording
- **16kHz 16-bit Mono PCM WAV**: Industry standard specification required for optimal speech recognition.
- **Cross-Platform**: Leverages `expo-audio` on iOS & Android, and HTML5 `MediaRecorder` on Web.
- **Zero Distractions**: No jerky live text streams or flickering partial transcriptions while conversations are occurring.
- **Full Control**: Pause, resume, discard, or stop & transcribe at any moment.

### 2. Post-Recording Transcription
- Triggers immediately when you tap **Stop & Transcribe**.
- Whisper STT model support:
  - **Whisper Tiny (75 MB)**: Ultra-fast post-recording transcription and battery efficiency.
  - **Whisper Base (142 MB)**: High balance of multi-speaker acoustics and precision.
  - **Whisper Small (466 MB)**: Technical vocabulary and accented speech precision.
- Dispatches staged acoustic spectrogram and token alignment progress to the UI.

### 3. AI Model Meeting Notes Generation
- Powered by Small Language Models (SLMs) running locally or Gemini Flash API in cloud mode:
  - **Google Gemma 2 (2B Instruct)**: SOTA open SLM for complex meeting reasoning and decision extraction.
  - **SmolLM2 (360M Instruct)**: Ultra-compact edge model (<300 MB RAM).
  - **Meta Llama 3.2 (1B Instruct)**: Instruction following and deep synthesis.
  - **Qwen 2.5 (0.5B Instruct)**: Rapid action item detection and task tagging.
- **Structured Note Artifacts**:
  - **Executive Summary**: High-level synthesis of discussion.
  - **Key Decisions**: Agreements reached, strategies approved.
  - **Action Items Checklist**: Interactive checkboxes, owner assignments, priorities (`HIGH`, `MEDIUM`, `LOW`), and category tags.
  - **Full Timestamped Transcript**: Full searchable dialogue with speakers.
  - **Editable Personal Observations**: Add observations and sync.
  - **One-Tap Share & Export**: Export to Markdown or native share sheet.

---

## 📱 Navigation & Screens

- **Home (`/`)**: Quick Record hero CTA, pending action item checklists, recent meeting notes, and upcoming schedule.
- **Record (`/record`)**: Primary recording screen with real-time waveform visualizer, elapsed monotonic timer, stop & transcribe button, and two-stage pipeline progress indicator.
- **Notes Library (`/notes`)**: Searchable notes index with filter tabs (All, Tasks, Audio) and tag chips.
- **Note Detail (`/notes/[id]`)**: Full note view with audio player, summary, interactive checklist checkboxes, decisions, markdown representation, and transcript.
- **Schedule (`/meetings`)**: Upcoming meeting schedule with one-tap record linking.
- **Meeting Detail (`/meeting/[id]`)**: Meeting metadata, attendees, agenda, and linked recording notes.
- **Settings (`/settings`)**: Engine mode toggle (100% On-Device vs Cloud), STT model selector, SLM reasoning model selector, Gemini API key, and data management.

---

## 🛠️ Tech Stack

- **Framework**: React Native 0.86, Expo SDK 57, Expo Router 57
- **UI Kit & Design Tokens**: Terracotta Coral (`#E06D53`), Forest Moss Olive (`#4D5C3B`), and Warm Amber (`#F5C242`)
- **State Management**: Zustand
- **Audio Capture**: `expo-audio` & Web `MediaRecorder`
- **Animations**: `react-native-reanimated` & React Native `Animated`
- **Typography & Icons**: `@expo/vector-icons` (Ionicons) and SpaceMono

---

## 📦 How to Run

### Install Dependencies
```bash
npm install
```

### Start Web Preview
```bash
npx expo start --web
```

### Build & Export Static Web
```bash
npx expo export --platform web
```

### Run on Android
```bash
npx expo run:android
```

### Run on iOS
```bash
npx expo run:ios
```
