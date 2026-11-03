import { Platform } from 'react-native';
import { useMeetingStore } from '@/store/meetingStore';
import {
  Recording,
  Meeting,
  Commitment,
  ActionItem,
  LiveContextMatch,
} from '@/types/meeting';
import { getGroqApiKey } from '@/constants/ApiConfig';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'also', 'like', 'yeah', 'okay', 'well', 'um', 'uh', 'think', 'going',
  'tell', 'want', 'need', 'know', 'look', 'said', 'talk', 'talking', 'lets', 'right',
]);

export interface SpeechListenerCallbacks {
  onSpeechSnippet?: (text: string) => void;
  onTopicDetected?: (topics: string[]) => void;
  onContextFound?: (matches: LiveContextMatch[]) => void;
  onMatchUpdated?: (updatedMatch: LiveContextMatch) => void;
}

/**
 * Fuzzy word matching: checks equality, word containment, or common stem prefixes
 * (e.g. "architectur" matches "architecture" and "architectural").
 */
function wordsMatch(w1: string, w2: string): boolean {
  if (w1 === w2) return true;
  if (w1.length >= 4 && w2.length >= 4) {
    if (w1.startsWith(w2) || w2.startsWith(w1)) return true;
    // Common pluralization check (e.g. database vs databases)
    if (w1.replace(/s$/, '') === w2.replace(/s$/, '')) return true;
  }
  return false;
}

class ContextRecallService {
  private activeWebRecognition: any = null;
  private isListening = false;
  private matchCache = new Map<string, LiveContextMatch[]>();
  private activeAiRequestKey = '';

  /**
   * Tokenize text into normalized significant keywords (unigrams & bigrams).
   */
  extractKeywords(text: string): string[] {
    if (!text || typeof text !== 'string') return [];

    const clean = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = clean.split(' ').filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    const keywords = new Set<string>(words);

    // Add meaningful 2-word collocations (bigrams)
    for (let i = 0; i < words.length - 1; i++) {
      keywords.add(`${words[i]} ${words[i + 1]}`);
    }

    return Array.from(keywords);
  }

  /**
   * Extract potential project names, camelCase terms, or capitalized entities from speech.
   */
  extractTopicEntities(speechText: string): string[] {
    if (!speechText) return [];

    const foundTopics = new Set<string>();

    // 1. Detect capitalized multi-word sequences (e.g. "Project Titan", "Sprint 24", "Database Migration")
    const capitalizedMatches = speechText.match(/\b[A-Z][a-z0-9]+(?:\s+[A-Z][a-z0-9]+)*\b/g);
    if (capitalizedMatches) {
      capitalizedMatches.forEach((match) => {
        const trimmed = match.trim();
        if (trimmed.length > 2 && !STOP_WORDS.has(trimmed.toLowerCase())) {
          foundTopics.add(trimmed);
        }
      });
    }

    // 2. High-frequency tech, engineering, and meeting buzzwords
    const keyTerms = [
      'database', 'migration', 'architecture', 'gemma', 'groq', 'sarvam',
      'whisper', 'offline', 'privacy', 'pipeline', 'roadmap', 'milestone',
      'checklist', 'frontend', 'backend', 'design', 'auth', 'budget',
      'release', 'api', 'model', 'latency', 'export', 'security', 'sprint',
      'postgres', 'cloud', 'mobile', 'web', 'retro', 'sync', 'testing'
    ];

    const lower = speechText.toLowerCase();
    keyTerms.forEach((term) => {
      if (lower.includes(term)) {
        foundTopics.add(term.charAt(0).toUpperCase() + term.slice(1));
      }
    });

    return Array.from(foundTopics).slice(0, 6);
  }

  /**
   * Instant Near Real-Time Recall Engine:
   * 1. Evaluates all recordings, decisions, and tasks in-memory in < 2ms.
   * 2. Immediately populates instant structured fallback synthesis.
   * 3. Returns matching cards to UI with ZERO blocking delay.
   * 4. Asynchronously enhances with Groq 1-sentence synthesis in the background.
   */
  async findRelevantContext(
    spokenChunk: string,
    currentRecordingId?: string,
    callbacks?: SpeechListenerCallbacks
  ): Promise<LiveContextMatch[]> {
    if (!spokenChunk || spokenChunk.trim().length < 2) {
      return [];
    }

    const cacheKey = spokenChunk.trim().toLowerCase();
    if (this.matchCache.has(cacheKey)) {
      return this.matchCache.get(cacheKey)!;
    }

    const store = useMeetingStore.getState();
    const allRecordings = store.recordings || [];
    const allCommitments = store.commitments || [];

    const spokenKeywords = this.extractKeywords(spokenChunk);
    const spokenTopics = this.extractTopicEntities(spokenChunk);

    if (spokenKeywords.length === 0 && spokenTopics.length === 0) {
      return [];
    }

    const matches: LiveContextMatch[] = [];

    for (const rec of allRecordings) {
      // Don't match the current active recording session with itself
      if (rec.id === currentRecordingId) continue;

      let score = 0;
      let matchedTopic = '';

      const titleLower = rec.meetingTitle.toLowerCase();
      const titleWords = titleLower.split(/[^a-z0-9]+/);
      const summaryLower = (rec.summary?.executiveSummary || '').toLowerCase();
      const tags = (rec.tags || []).map((t) => t.toLowerCase());
      const keyTopics = (rec.summary?.keyTopics || []).map((t) => t.toLowerCase());
      const decisions = rec.summary?.keyDecisions || [];
      const actionItems = rec.summary?.actionItems || [];

      // Associated commitments for this recording
      const relatedCommitments = allCommitments.filter(
        (c) => c.recordingId === rec.id || c.meetingTitle === rec.meetingTitle
      );
      const openCommitments = relatedCommitments.filter((c) => !c.completed);

      // 1. Direct Topic Entity Match (weight: 0.50)
      for (const topic of spokenTopics) {
        const topLower = topic.toLowerCase();
        if (titleLower.includes(topLower) || titleWords.some((w) => wordsMatch(w, topLower))) {
          score += 0.50;
          matchedTopic = topic;
        } else if (tags.some((t) => wordsMatch(t, topLower))) {
          score += 0.40;
          if (!matchedTopic) matchedTopic = topic;
        } else if (keyTopics.some((t) => wordsMatch(t, topLower))) {
          score += 0.40;
          if (!matchedTopic) matchedTopic = topic;
        }
      }

      // 2. Keyword overlap with Title words (weight: 0.45)
      for (const kw of spokenKeywords) {
        if (titleWords.some((w) => wordsMatch(w, kw))) {
          score += 0.45;
          if (!matchedTopic) matchedTopic = kw.charAt(0).toUpperCase() + kw.slice(1);
        }
      }

      // 3. Keyword overlap with Tags & Key Topics (weight: 0.35)
      for (const kw of spokenKeywords) {
        if (tags.some((t) => wordsMatch(t, kw)) || keyTopics.some((t) => wordsMatch(t, kw))) {
          score += 0.35;
          if (!matchedTopic) matchedTopic = kw.charAt(0).toUpperCase() + kw.slice(1);
        }
      }

      // 4. Keyword overlap with Key Decisions & Action Items (weight: 0.30)
      for (const kw of spokenKeywords) {
        if (decisions.some((d) => d.toLowerCase().includes(kw))) {
          score += 0.30;
          if (!matchedTopic) matchedTopic = kw.charAt(0).toUpperCase() + kw.slice(1);
        }
        if (actionItems.some((a) => a.task.toLowerCase().includes(kw))) {
          score += 0.25;
          if (!matchedTopic) matchedTopic = kw.charAt(0).toUpperCase() + kw.slice(1);
        }
      }

      // 5. Keyword overlap with Summary (weight: 0.15)
      for (const kw of spokenKeywords) {
        if (summaryLower.includes(kw)) {
          score += 0.15;
        }
      }

      // 6. Open commitment bonus
      if (openCommitments.length > 0 && score > 0.2) {
        score += 0.15;
      }

      // Cap score to 1.0
      score = Math.min(1.0, Math.round(score * 100) / 100);

      // Threshold: 0.28 ensures any single strong title or tag match surfaces instantly
      if (score >= 0.28) {
        const defaultTopic =
          matchedTopic ||
          rec.tags?.[0] ||
          rec.summary?.keyTopics?.[0] ||
          rec.meetingTitle.split(' ')[0] ||
          'Discussion';

        const matchItem: LiveContextMatch = {
          id: `match-${rec.id}`,
          recordingId: rec.id,
          meetingId: rec.meetingId,
          meetingTitle: rec.meetingTitle,
          date: rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : 'Previous Sync',
          matchedTopic: defaultTopic,
          relevanceScore: score,
          keyDecisions: decisions.slice(0, 3),
          openCommitments: openCommitments.slice(0, 3),
          actionItems: actionItems.slice(0, 3),
          relevantSnippet: rec.summary?.executiveSummary?.slice(0, 180) || undefined,
          tags: (rec.tags || []).slice(0, 4),
        };

        // Immediate 0ms local heuristic synthesis so the card is rich and ready instantly
        this.generateFallbackSynthesis(matchItem);

        matches.push(matchItem);
      }
    }

    // Sort by relevance score descending
    matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topMatches = matches.slice(0, 3);

    // Cache the fast result
    this.matchCache.set(cacheKey, topMatches);

    // Asynchronously trigger Groq AI refinement for top match in the background
    // (DO NOT AWAIT - return immediately to guarantee sub-10ms UI display!)
    if (topMatches.length > 0 && callbacks?.onMatchUpdated) {
      const topMatch = topMatches[0];
      const requestKey = `${spokenChunk}_${topMatch.recordingId}`;
      this.activeAiRequestKey = requestKey;

      this.enrichMatchWithAiSynthesis(spokenChunk, topMatch)
        .then((aiBriefing) => {
          if (aiBriefing && this.activeAiRequestKey === requestKey) {
            topMatch.aiSynthesis = aiBriefing;
            callbacks.onMatchUpdated?.(topMatch);
          }
        })
        .catch(() => {
          // Gracefully keep instant fallback synthesis
        });
    }

    return topMatches;
  }

  /**
   * Uses Groq Llama 3.1 8B Instant (sub-150ms) to synthesize a 1-sentence executive reminder.
   */
  private async enrichMatchWithAiSynthesis(
    speechSnippet: string,
    match: LiveContextMatch
  ): Promise<string | null> {
    const apiKey = getGroqApiKey();
    if (!apiKey) return null;

    try {
      const topDecision = match.keyDecisions[0] || 'Previous agreement established';
      const topCommitment = match.openCommitments[0]?.promise || match.actionItems[0]?.task || '';

      const prompt = `A user in an active meeting said: "${speechSnippet}".
From previous meeting "${match.meetingTitle}":
- Decision: ${topDecision}
- Task/Promise: ${topCommitment}

Write a 1-sentence ultra-compact context briefing for the user on screen right now (max 18 words). Direct, factual, no intro prose.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          return text.replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // Return null on network error to keep local synthesis
    }

    return null;
  }

  /**
   * Fast offline heuristic synthesis generated in 0ms.
   */
  private generateFallbackSynthesis(match: LiveContextMatch): void {
    const decision = match.keyDecisions[0];
    const commitment = match.openCommitments[0];

    if (decision && commitment) {
      match.aiSynthesis = `Agreed: "${decision.slice(0, 60)}". Open: ${commitment.speaker || 'Team'} owes "${commitment.promise.slice(0, 60)}".`;
    } else if (decision) {
      match.aiSynthesis = `Previous Decision: "${decision.slice(0, 90)}".`;
    } else if (commitment) {
      match.aiSynthesis = `Pending: ${commitment.speaker || 'Team'} promised "${commitment.promise.slice(0, 90)}".`;
    } else if (match.relevantSnippet) {
      match.aiSynthesis = match.relevantSnippet.slice(0, 110) + '...';
    }
  }

  /**
   * Starts near-realtime speech recognition with ultra-low latency:
   * - Immediately streams live spoken words to UI (0ms).
   * - Instantly triggers retrieval upon speech finalization (0ms).
   * - Uses a swift 200ms debounce during interim speech.
   */
  startLiveSpeechListener(callbacks: SpeechListenerCallbacks): void {
    this.isListening = true;

    // Web Speech API
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          let debounceTimer: any = null;
          let lastProcessedQuery = '';

          recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            const isFinal = finalTranscript.trim().length > 0;
            const spoken = (finalTranscript || interimTranscript).trim();

            if (!spoken || spoken.length < 3) return;

            // 1. Immediately stream heard words to UI banner for zero-latency feedback
            callbacks.onSpeechSnippet?.(spoken);

            // 2. Instant entity & topic extraction
            const topics = this.extractTopicEntities(spoken);
            if (topics.length > 0) {
              callbacks.onTopicDetected?.(topics);
              topics.forEach((t) => useMeetingStore.getState().addLiveTopic(t));
            }

            // 3. Normalized query check to prevent duplicate requests
            const normalizedQuery = spoken.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
            if (normalizedQuery === lastProcessedQuery) return;

            const executeRecall = async () => {
              lastProcessedQuery = normalizedQuery;
              const matches = await this.findRelevantContext(spoken, undefined, callbacks);
              if (matches.length > 0) {
                callbacks.onContextFound?.(matches);
              }
            };

            // 4. If speech finalized a phrase, execute IMMEDIATELY (0ms delay)!
            if (isFinal) {
              if (debounceTimer) clearTimeout(debounceTimer);
              executeRecall();
            } else {
              // Interim active speech: nimble 200ms debounce
              if (debounceTimer) clearTimeout(debounceTimer);
              debounceTimer = setTimeout(executeRecall, 200);
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('Web Speech Recognition event:', e.error);
          };

          recognition.onend = () => {
            if (this.isListening) {
              try {
                recognition.start();
              } catch {}
            }
          };

          recognition.start();
          this.activeWebRecognition = recognition;
        } catch (err) {
          console.warn('Web Speech API initialization notice:', err);
        }
      }
    }
  }

  /**
   * Stop the live speech listener.
   */
  stopLiveSpeechListener(): void {
    this.isListening = false;
    if (this.activeWebRecognition) {
      try {
        this.activeWebRecognition.stop();
      } catch {}
      this.activeWebRecognition = null;
    }
    this.matchCache.clear();
    this.activeAiRequestKey = '';
  }

  /**
   * Manual context search trigger: runs in < 2ms without delay.
   */
  async triggerTopicSearch(
    topicOrQuery: string,
    currentRecordingId?: string,
    callbacks?: SpeechListenerCallbacks
  ): Promise<LiveContextMatch[]> {
    useMeetingStore.getState().addLiveTopic(topicOrQuery);
    return await this.findRelevantContext(topicOrQuery, currentRecordingId, callbacks);
  }
}

export const contextRecallService = new ContextRecallService();
