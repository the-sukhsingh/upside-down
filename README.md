# Meeting Note Taker Application

A clean, abstracted meeting companion and AI note taker application built with React Native and Expo Router, powered by **Groq API** and **Sarvam AI API**.

---

## 🔑 Providing API Keys

API keys are completely abstracted away from the user interface. You can provide your keys in either of two places:

### Option A: `.env.local` (Recommended)
Edit `.env.local` in the project root:
```env
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
EXPO_PUBLIC_SARVAM_API_KEY=your_sarvam_subscription_key_here
```

### Option B: `constants/ApiConfig.ts`
Edit `constants/ApiConfig.ts` directly:
```typescript
export const API_CONFIG = {
  GROQ_API_KEY: 'your_groq_api_key_here',
  SARVAM_API_KEY: 'your_sarvam_subscription_key_here',
};
```

---

## 🎯 Core Philosophy & Abstracted Flow

The application enforces a clean **3-Stage Rhythm**:

```
[ Stage 1: Record ] ──────────────► [ Stage 2: Transcribe ] ──────────────► [ Stage 3: AI Notes ]
• Pure local 16kHz PCM WAV capture  • Groq Whisper Turbo (~400ms)          • Groq Llama 3.3 70B (~500 tok/s)
• ZERO live network requests        • Sarvam AI Saaras (Indian languages)  • Sarvam-105B Reasoning
• Waveform meter & timer            • Speaker & timestamp alignment        • Structured Action Items & Decisions
• 100% conversation privacy         • Fully automatic post-processing      • Markdown & Native Share
```

---

## ⚡ High-Performance Cloud Endpoints

### 1. Groq API Endpoints
- **Speech-to-Text (`https://api.groq.com/openai/v1/audio/transcriptions`)**:
  - `whisper-large-v3-turbo`: Sub-second cloud transcription, highest speed & precision.
  - `whisper-large-v3`: Standard full Whisper v3.
- **AI Reasoning & Notes (`https://api.groq.com/openai/v1/chat/completions`)**:
  - `llama-3.3-70b-versatile`: 70B frontier intelligence, structured JSON output (~300-500 tok/sec).
  - `llama-3.1-8b-instant`: Ultra-low latency task synthesis.

### 2. Sarvam AI Endpoints
- **Speech-to-Text (`https://api.sarvam.ai/speech-to-text`)**:
  - `saaras:v4`: State-of-the-art model for Indian English, Hindi (`hi-IN`), Tamil (`ta-IN`), Telugu (`te-IN`), Bengali (`bn-IN`), Marathi (`mr-IN`), and regional accents.
  - Supports automatic language detection (`unknown`) or specific language code hints.
- **AI Reasoning & Notes (`https://api.sarvam.ai/v1/chat/completions`)**:
  - `sarvam-105b`: Flagship 105B parameter model built for complex reasoning and agentic workflows.
  - `sarvam-105b-conversations`: Post-trained conversational variant tuned for meeting dialogues.

---

## 📱 Navigation & Screens

- **Home (`/`)**: Quick Record hero CTA, pending action item checklists, recent meeting notes, and upcoming schedule.
- **Record (`/record`)**: Primary recording screen with real-time waveform visualizer, elapsed monotonic timer, active engine badge, and two-stage pipeline progress indicator.
- **Notes Library (`/notes`)**: Searchable notes index with filter tabs (All, Tasks, Audio) and tag chips.
- **Note Detail (`/notes/[id]`)**: Full note view with audio player, executive summary, interactive checklist checkboxes, decisions, markdown representation, and transcript.
- **Schedule (`/meetings`)**: Upcoming meeting schedule with one-tap record linking.
- **Meeting Detail (`/meeting/[id]`)**: Meeting metadata, attendees, agenda, and linked recording notes.
- **Settings (`/settings`)**: Simple abstracted engine switcher (Groq Turbo vs Sarvam AI Multilingual), language selection, and data management.

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
