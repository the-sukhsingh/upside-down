# 🎙️ MeetaNotes — AI Meeting Companion & Note Taker

A fast, privacy-first meeting companion built with **React Native** and **Expo Router**, powered directly by **Groq Cloud API** and **Sarvam AI API**.

Designed around zero-interruption recording: captures local high-fidelity audio without making real-time network requests, transcribing and extracting actionable intelligence only when the meeting concludes.

---

## 🌟 Highlight Features

### 1. 🎯 Commitment Tracker (“Promise Radar”)
- **Spoken Promise Detection**: Scans transcript dialogue for commitment patterns (e.g., *"I'll send the updated mockups by Friday 5 PM"*).
- **Direction Ledger**: Organizes commitments into **"I Owe (📤)"** (your team's commitments to others) and **"They Owe Me (📥)"** (promises made to you).
- **Deadline Radar**: Parses relative deadlines (*"by Friday"*, *"tomorrow morning"*, *"today"*) and flags upcoming or overdue items.
- **Audio Verification**: Every promise links directly to the original audio evidence.

### 2. 🔊 Conversation Evidence Links
- **Zero Blind Trust**: Every AI-generated decision, summary point, and action item is cited with exact recording timestamps.
- **Instant Audio Seek**: Tapping any timestamp pill (e.g., `[🔊 01:25]`) seeks the player to that exact moment and begins playback.
- **Context Preview**: Displays the exact quote spoken in conversation alongside the timestamp.

### 3. 📋 Before-You-Meet Briefing
- **Pre-Meeting Intelligence**: Before entering a scheduled meeting, compiles an executive briefing from prior conversations and notes.
- **Key Sections**:
  - **What Needs Attention Today**: Critical blockers and urgent priorities
  - **Outstanding Tasks Carried Over**: Unresolved action items from prior syncs
  - **Previous Decisions Confirmed**: Baseline agreements already locked in
  - **Unresolved Questions to Ask**: Open questions to bring to the table
  - **Suggested Timed Agenda**: Structured breakdown of the session

### 4. ⚡ Auto Follow-Up Draft
- **One-Tap Recap Dispatch**: Solves the post-meeting chore by generating ready-to-send messages with action items in seconds.
- **4 Tone Profiles**:
  - 👔 **Executive**: Concise, polished, high-level summary for leadership
  - 💬 **Casual**: Friendly, approachable tone for Slack or Teams
  - 🟢 **WhatsApp**: Punchy, emoji-spaced, mobile-optimized format
  - 🎯 **Action-Oriented**: Deliverables categorized strictly by Owner + Deadline
- **One-Click Send**: Open directly in WhatsApp (`wa.me/?text=...`), launch in default Email (`mailto:?...`), or Copy to Clipboard.

### 5. 📅 Action Items to Calendar & Tasks
- **Closed-Loop Execution**: Turns extracted tasks into concrete calendar events with deadlines.
- **One-Tap Google Calendar**: Launches Google Calendar with title, description, and deadline pre-populated.
- **Universal iCalendar (.ics) Export**: Generates standard RFC 5545 `.ics` files with alarm reminders (`VALARM`) for bulk import into Apple Calendar, Outlook, and Google Calendar.

### 6. 🛰️ Real-Time Context Recall (“Live Topic Radar”)
- **Spoken Topic & Entity Extraction**: As the user speaks during an active recording, the radar extracts technical terms, project names, and keywords in near real-time.
- **Instant Historical Knowledge Matching**: Searches the device's entire meeting knowledge base and surfaces related past decisions, open commitments, and action items.
- **Ultra-Fast AI Briefing Flashcards**: Powered by Groq's sub-150ms inference to synthesize a 1-sentence "What you need to know right now" reminder for matching projects.
- **In-Place Note Peeking**: Tap **Peek Full Note** to inspect full decisions and transcripts in a modal without stopping or disrupting the active recording.
- **Context Pinning**: Pin relevant past context directly into the current session; the final generated notes automatically reference and link prior discussions.

### 7. 📸 Whiteboard & Meeting Note Camera Digitalization
- **Floating Camera Button**: Persistent bottom-left floating action button on the Home screen for instant note digitizing.
- **Groq Multimodal Vision**: Powered by Groq LPU Vision (`qwen/qwen3.8-27b`) delivering high-accuracy visual OCR and structured reasoning in ~1-2 seconds.
- **Handwriting & Architecture Interpretation**: Transcribes messy handwriting, bullet points, system architecture diagrams, and sticky notes.
- **Automated Intelligence Extraction**: Converts visual snapshots into complete executive summaries, structured decisions, action items with owners, and Promise Radar commitments.
- **Instant Note Library Integration**: Saves directly to the local knowledge base with immediate navigation to `/notes/[id]`.

### 8. ⚡ Idea Collision Engine
- **Generates New Thinking Beyond Retrieval**: Rather than simply finding old notes, MeetaNotes discovers useful, non-obvious connections between thoughts recorded weeks or months apart to synthesize entirely new ideas.
- **Shared Mechanism & Latent Principle**: Surfaces the deep structural mechanism uniting disparate thoughts (e.g., how game micro-rewards + student motivation scaffolding solve user retention drops in habit tracking).
- **5-Point Breakthrough Card**:
  - 🔗 **Original Source Notes**: Previews date recorded, original meeting title, and excerpt quotes with 1-tap navigation to the source note.
  - 🏷️ **Overlapping Concepts**: Tag chips highlighting the conceptual intersection and structural parallels.
  - 💡 **Why This Is Useful**: Concrete explanation of how marrying the concepts unlocks new value or practical breakthroughs.
  - 🔬 **Small Testable Experiment**: Low-stakes, 48-hour experiment or prototype to validate the resulting idea in the real world with experiment tracking (`Testing`).
  - 🗑️ **1-Tap Weak Connection Dismissal & Bookmarking**: Complete user control to dismiss weak suggestions or save/star high-conviction breakthroughs.
- **Groq LPU Instant Synthesis & Offline Heuristic Fallback**: AI synthesis powered by Groq LPU models (`llama-3.1-8b-instant`) with automatic fallback to high-speed latent relationship mapping when offline.

---

## 🔑 Abstracted API Configuration

API keys are completely abstracted from the user interface. Keys are loaded automatically from `.env.local` or fallback configuration in `constants/ApiConfig.ts`.

### Option A: `.env.local` (Recommended)
Add your keys in `.env.local` in the project root:

```env
# Groq API Key (from https://console.groq.com/keys)
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here

# Sarvam AI Subscription Key (from https://dashboard.sarvam.ai)
EXPO_PUBLIC_SARVAM_API_KEY=your_sarvam_api_key_here
```

### Option B: `constants/ApiConfig.ts`
Edit `constants/ApiConfig.ts` directly:

```typescript
export const API_CONFIG = {
  GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || 'your_groq_key_here',
  SARVAM_API_KEY: process.env.EXPO_PUBLIC_SARVAM_API_KEY || 'your_sarvam_key_here',
};
```

---

## 🔄 Core Architecture & Processing Pipeline

The app follows a strict **3-Stage Workflow**:

```
[ Stage 1: Local Recording ] ──────► [ Stage 2: Cloud Transcription ] ──────► [ Stage 3: AI Synthesis ]
• 16kHz 16-bit Mono PCM WAV capture    • Groq Whisper Large v3 Turbo (~400ms)   • Groq GPT 120B / Qwen 27B
• ZERO live network requests           • Sarvam Saaras v4 (Indian Multilingual) • Sarvam 105B Reasoning
• Real-time waveform & monotonic timer • Segmented timestamps & speaker alignment• Promise Radar extraction
• 100% conversation privacy & offline  • Cross-platform FormData WAV handling   • Evidence timestamp linking
```

---

## ⚡ Active Cloud AI Endpoints

### 1. Groq Cloud Engine
- **Speech-to-Text (`https://api.groq.com/openai/v1/audio/transcriptions`)**:
  - `whisper-large-v3-turbo`: Sub-second cloud speech recognition with word-level accuracy.
  - `whisper-large-v3`: Standard Whisper Large v3 model.
- **Note & Reasoning Synthesis (`https://api.groq.com/openai/v1/chat/completions`)**:
  - `openai/gpt-oss-120b`: Flagship 120B reasoning model on Groq for deep analysis and Promise Radar extraction.
  - `qwen/qwen3.8-27b`: Ultra-fast 27B model (~500 tokens/second).
  - `openai/gpt-oss-20b`: Low-latency 20B utility model.
- **Multimodal Vision (`https://api.groq.com/openai/v1/chat/completions`)**:
  - `qwen/qwen3.8-27b`: Sub-2-second vision model for whiteboards, handwritten notes, architecture diagrams, and slide OCR.

### 2. Sarvam AI Engine
- **Speech-to-Text (`https://api.sarvam.ai/speech-to-text`)**:
  - `saaras:v4`: Speech recognition optimized for Indian English, Hindi (`hi-IN`), Tamil (`ta-IN`), Telugu (`te-IN`), Bengali (`bn-IN`), Marathi (`mr-IN`), and regional accents.
  - Automatic language detection or targeted language hints.
- **Note & Reasoning Synthesis (`https://api.sarvam.ai/v1/chat/completions`)**:
  - `sarvam-105b`: Advanced 105B reasoning model with chain-of-thought support.

---

## 📱 Navigation & App Structure

- **Dashboard (`app/(tabs)/index.tsx`)**: Hero quick record CTA, Promise Radar overview, pending tasks checklist, and upcoming meeting briefings.
- **Live Recording (`app/(tabs)/record.tsx`)**: Distraction-free recording screen with audio metering, elapsed timer, and staged pipeline progress.
- **Notes Library (`app/(tabs)/notes.tsx`)**: Searchable repository of all processed meetings with tag filters and search indexing.
- **Note Detail (`app/notes/[id].tsx`)**:
  - Synchronized audio player with scrub & skip controls
  - Promise Radar commitment ledger ("I Owe" vs. "They Owe Me")
  - Executive summary and key topics
  - Action items checklist with **Google Calendar** and **.ics Export**
  - Key decisions with **Conversation Evidence Links**
  - **Auto Follow-Up Draft** button (Email / WhatsApp generator)
  - Full timestamped transcript view
- **Schedule (`app/(tabs)/meetings.tsx`)**: Upcoming meeting schedule with one-tap briefing badges and recording triggers.
- **Meeting Detail (`app/meeting/[id].tsx`)**: Agenda, attendee list, linked notes, and **Before-You-Meet Briefing Card**.
- **Settings (`app/(tabs)/settings.tsx`)**: Abstracted engine toggle (Groq Turbo vs. Sarvam Multilingual), model profiles, and storage management.

---

## 🛠️ Tech Stack

- **Framework**: React Native 0.86, Expo SDK 57, Expo Router 57
- **Language**: TypeScript 6.0
- **State Management**: Zustand
- **Audio Capture & Playback**: `expo-audio` & Web `MediaRecorder` API
- **Animations & Layout**: `react-native-reanimated`, React Native `Animated`, and Safe Area Context
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Styling**: Material You / Themed Tokens (Terracotta Coral `#E06D53`, Forest Moss Olive `#4D5C3B`, Warm Amber `#F5C242`)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run on Web
```bash
npm run web
```
Opens in browser at `http://localhost:8081`.

### 3. Run on Mobile (Expo Go / Simulator)
```bash
npx expo start
```
Scan the QR code with Expo Go on Android or the Camera app on iOS.

### 4. Build Static Web Distribution
```bash
npx expo export --platform web
```

---

## 📄 License
MIT
