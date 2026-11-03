# Meeting Note Taker Application

A privacy-first meeting companion and AI note taker application built with React Native and Expo Router, powered by **Groq API**, **Sarvam AI API**, and on-device offline fallback models.

---

## 🎯 Core Philosophy & Flow

Unlike standard note-taking applications that make constant real-time data fetching calls or streaming transcription requests while you are speaking, this application enforces a clean **3-Stage Post-Processing Rhythm**:

```
[ Stage 1: Record ] ──────────────► [ Stage 2: Transcribe ] ──────────────► [ Stage 3: AI Notes ]
• Pure local 16kHz PCM WAV capture  • Groq Whisper Turbo (~400ms)          • Groq Llama 3.3 70B (~500 tok/s)
• ZERO live network requests        • Sarvam AI Saaras (Indian languages)  • Sarvam-105B Reasoning
• Waveform meter & timer            • On-device Whisper fallback           • Structured Action Items & Decisions
• 100% conversation privacy         • Speaker & timestamp alignment        • Markdown & Native Share
```

---

## ⚡ High-Performance Cloud Endpoints & Models

### 1. Groq API Endpoints
- **Speech-to-Text (`https://api.groq.com/openai/v1/audio/transcriptions`)**:
  - `whisper-large-v3-turbo`: Sub-second cloud transcription, highest speed & precision.
  - `whisper-large-v3`: Standard full Whisper v3.
  - `distil-whisper-large-v3-en`: English-optimized lightweight model.
- **AI Reasoning & Notes (`https://api.groq.com/openai/v1/chat/completions`)**:
  - `llama-3.3-70b-versatile`: 70B frontier intelligence, structured JSON output (~300-500 tok/sec).
  - `llama-3.1-8b-instant`: Ultra-low latency task synthesis.
  - `gemma2-9b-it`: Google Gemma 2 9B hosted on Groq LPU.
- **Connection Testing**: One-click live key validation directly in Settings.

### 2. Sarvam AI Endpoints
- **Speech-to-Text (`https://api.sarvam.ai/speech-to-text`)**:
  - `saaras:v4`: State-of-the-art model for Indian English, Hindi (`hi-IN`), Tamil (`ta-IN`), Telugu (`te-IN`), Bengali (`bn-IN`), Marathi (`mr-IN`), and 22+ regional dialects.
  - `saaras:v3`: Preceding generation model.
  - Supports automatic language detection (`unknown`) or specific language code hints.
- **AI Reasoning & Notes (`https://api.sarvam.ai/v1/chat/completions`)**:
  - `sarvam-105b`: Flagship 105B parameter model built for complex reasoning and agentic workflows.
  - `sarvam-105b-conversations`: Post-trained conversational variant tuned for meeting dialogues.
- **Connection Testing**: One-click subscription key authentication verification.

### 3. Local On-Device Fallbacks
- **Whisper STT**: Tiny (75 MB), Base (142 MB), Small (466 MB).
- **Small Language Models (SLMs)**: Google Gemma 2 (2B Instruct), SmolLM2 (360M Instruct), Meta Llama 3.2 (1B Instruct), Qwen 2.5 (0.5B Instruct).
- Automatically steps in if an API key is not entered or when offline.

---

## 🚀 Key Features

### 1. Zero-Fetch Local Recording
- **16kHz 16-bit Mono PCM WAV**: Industry standard specification required for optimal speech recognition.
- **Cross-Platform**: Leverages `expo-audio` on iOS & Android, and HTML5 `MediaRecorder` on Web.
- **Zero Distractions**: No jerky live text streams or flickering partial transcriptions while conversations are occurring.
- **Full Control**: Pause, resume, discard, or stop & transcribe at any moment.

### 2. Post-Recording Transcription
- Triggers immediately when you tap **Stop & Transcribe**.
- Multi-provider architecture with automatic segment alignment and speaker assignment.
- Dispatches staged acoustic spectrogram and token alignment progress to the UI.

### 3. AI Model Meeting Notes Generation
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
- **Record (`/record`)**: Primary recording screen with real-time waveform visualizer, elapsed monotonic timer, active endpoint badge, stop & transcribe button, and two-stage pipeline progress indicator.
- **Notes Library (`/notes`)**: Searchable notes index with filter tabs (All, Tasks, Audio) and tag chips.
- **Note Detail (`/notes/[id]`)**: Full note view with audio player, summary, interactive checklist checkboxes, decisions, markdown representation, and transcript.
- **Schedule (`/meetings`)**: Upcoming meeting schedule with one-tap record linking.
- **Meeting Detail (`/meeting/[id]`)**: Meeting metadata, attendees, agenda, and linked recording notes.
- **Settings (`/settings`)**: Multi-provider configuration for Groq, Sarvam AI, and On-Device inference, with live API key testing and language selection.

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
