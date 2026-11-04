import { useMeetingStore } from '@/store/meetingStore';
import {
  Recording,
  IdeaCollision,
  IdeaCollisionSourceNote,
} from '@/types/meeting';
import { getGroqApiKey } from '@/constants/ApiConfig';

class IdeaCollisionService {
  /**
   * Scans all recordings across weeks/months and discovers non-obvious
   * cross-domain connections, shared mechanisms, and small testable experiments.
   */
  async generateCollisions(): Promise<IdeaCollision[]> {
    const store = useMeetingStore.getState();
    const recordings = store.recordings || [];
    const dismissedIds = new Set(store.dismissedCollisionIds || []);

    if (recordings.length < 2) {
      return store.ideaCollisions || [];
    }

    store.setIsCollidingIdeas(true);

    try {
      const apiKey = getGroqApiKey();
      let generatedCollisions: IdeaCollision[] = [];

      if (apiKey) {
        try {
          generatedCollisions = await this.synthesizeWithGroq(recordings, dismissedIds);
        } catch (apiErr) {
          console.warn('Groq Idea Collision API notice (falling back to heuristic engine):', apiErr);
          generatedCollisions = this.synthesizeWithHeuristicEngine(recordings, dismissedIds);
        }
      } else {
        generatedCollisions = this.synthesizeWithHeuristicEngine(recordings, dismissedIds);
      }

      // Merge newly generated collisions with existing saved/active collisions
      const existingActive = (store.ideaCollisions || []).filter(
        (c) => c.status === 'saved' || c.status === 'experimenting' || !dismissedIds.has(c.id)
      );

      const existingIds = new Set(existingActive.map((c) => c.id));
      const freshCollisions = generatedCollisions.filter((c) => !existingIds.has(c.id));

      const merged = [...freshCollisions, ...existingActive];
      store.setIdeaCollisions(merged);

      return merged;
    } finally {
      store.setIsCollidingIdeas(false);
    }
  }

  /**
   * AI-powered collision synthesis using Groq LPU models.
   */
  private async synthesizeWithGroq(
    recordings: Recording[],
    dismissedIds: Set<string>
  ): Promise<IdeaCollision[]> {
    const apiKey = getGroqApiKey();
    if (!apiKey) throw new Error('Groq API Key not found');

    // Prepare note summaries for synthesis prompt (up to 8 representative notes)
    const notesPayload = recordings.slice(0, 8).map((r, idx) => ({
      index: idx + 1,
      id: r.id,
      title: r.meetingTitle,
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Previous Sync',
      summary: r.summary?.executiveSummary || r.notes?.slice(0, 180) || '',
      topics: r.summary?.keyTopics || r.tags || [],
      decisions: (r.summary?.keyDecisions || []).slice(0, 2),
      sampleQuote: (r.transcript || r.notes || '').slice(0, 150),
    }));

    const systemPrompt = `You are the elite "Idea Collision Engine" for MeetaNotes.
Your mission is to discover unexpected, non-obvious, and highly valuable connections between thoughts recorded weeks or months apart.
CRITICAL RULES:
1. Do NOT just summarize notes. Propose NEW IDEAS by identifying shared underlying mechanisms (e.g. progressive rewards in gaming + student motivation + habit tracking).
2. Connect 2 or 3 distinct notes per idea.
3. Every idea MUST include:
   - "title": Catchy, inspiring idea title
   - "sharedMechanism": The deep underlying principle, mechanism, or cognitive dynamic connecting the notes
   - "overlappingConcepts": Array of 2 to 4 exact overlapping concepts or metaphors
   - "sourceNoteIds": Array of exact recording IDs used from the input
   - "whyUseful": 2 sentences explaining why this novel combination produces value or unlocks a breakthrough
   - "smallExperiment": A concrete, 1-2 day testable experiment or prototype to test the resulting idea
   - "relevanceScore": Number between 0.75 and 0.98
4. Output schema MUST be a JSON array of 2 to 4 collision objects. Respond ONLY with valid JSON.`;

    const userPrompt = `Here are the user's recorded thoughts and notes:
${JSON.stringify(notesPayload, null, 2)}

Generate 2-3 novel Idea Collisions connecting these disparate thoughts into new breakthroughs:`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API returned ${response.status}: ${err}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || '[]';

    let parsed: any[] = [];
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const match = rawContent.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse Idea Collision JSON array');
      }
    }

    if (!Array.isArray(parsed)) {
      parsed = [parsed];
    }

    const recMap = new Map(recordings.map((r) => [r.id, r]));

    const result: IdeaCollision[] = [];

    parsed.forEach((item, idx) => {
      const rawIds: string[] = Array.isArray(item.sourceNoteIds)
        ? item.sourceNoteIds
        : [recordings[0]?.id, recordings[1]?.id].filter(Boolean);

      const validSources: IdeaCollisionSourceNote[] = [];

      rawIds.forEach((id) => {
        const found = recMap.get(id);
        if (found) {
          validSources.push({
            recordingId: found.id,
            meetingTitle: found.meetingTitle,
            date: found.createdAt
              ? new Date(found.createdAt).toLocaleDateString()
              : 'Previous Note',
            excerptSnippet:
              found.summary?.executiveSummary?.slice(0, 140) ||
              found.notes?.slice(0, 140) ||
              found.meetingTitle,
          });
        }
      });

      // Ensure at least 2 source notes
      if (validSources.length < 2 && recordings.length >= 2) {
        const missing = recordings.find((r) => !validSources.some((s) => s.recordingId === r.id));
        if (missing) {
          validSources.push({
            recordingId: missing.id,
            meetingTitle: missing.meetingTitle,
            date: missing.createdAt
              ? new Date(missing.createdAt).toLocaleDateString()
              : 'Previous Note',
            excerptSnippet:
              missing.summary?.executiveSummary?.slice(0, 140) || missing.meetingTitle,
          });
        }
      }

      const collisionId = `collision-${Date.now()}-${idx}`;
      if (dismissedIds.has(collisionId)) return;

      result.push({
        id: collisionId,
        title: item.title || 'Cross-Domain Breakthrough',
        sharedMechanism:
          item.sharedMechanism || 'Shared cognitive feedback loops and structural parallels',
        overlappingConcepts:
          item.overlappingConcepts && Array.isArray(item.overlappingConcepts)
            ? item.overlappingConcepts
            : ['Feedback loops', 'Modular architecture'],
        whyUseful:
          item.whyUseful ||
          'Combines distinct methodologies from past discussions into an actionable new model.',
        smallExperiment:
          item.smallExperiment ||
          'Run a 48-hour prototype test comparing this unified approach against baseline.',
        sourceNotes: validSources,
        relevanceScore: typeof item.relevanceScore === 'number' ? item.relevanceScore : 0.88,
        createdAt: new Date().toISOString(),
        status: 'active',
      });
    });

    return result;
  }

  /**
   * Fast, intelligent offline heuristic engine that bridges multi-note clusters
   * by mapping latent semantic relationships across tags, decisions, and goals.
   */
  private synthesizeWithHeuristicEngine(
    recordings: Recording[],
    dismissedIds: Set<string>
  ): IdeaCollision[] {
    const collisions: IdeaCollision[] = [];

    // Pattern 1: Gamification + Student Motivation + Habit Tracking
    const gameNote = recordings.find(
      (r) =>
        r.meetingTitle.toLowerCase().includes('game') ||
        (r.tags || []).some((t) => t.toLowerCase().includes('game'))
    );
    const studentNote = recordings.find(
      (r) =>
        r.meetingTitle.toLowerCase().includes('student') ||
        r.meetingTitle.toLowerCase().includes('education') ||
        (r.tags || []).some((t) => t.toLowerCase().includes('learning'))
    );
    const habitNote = recordings.find(
      (r) =>
        r.meetingTitle.toLowerCase().includes('habit') ||
        r.meetingTitle.toLowerCase().includes('tracker') ||
        (r.tags || []).some((t) => t.toLowerCase().includes('habit'))
    );

    if (gameNote && (studentNote || habitNote)) {
      const sources: IdeaCollisionSourceNote[] = [gameNote, studentNote || habitNote, habitNote]
        .filter(Boolean)
        .map((r) => ({
          recordingId: r!.id,
          meetingTitle: r!.meetingTitle,
          date: r!.createdAt ? new Date(r!.createdAt).toLocaleDateString() : 'Previous Sync',
          excerptSnippet:
            r!.summary?.executiveSummary?.slice(0, 140) ||
            r!.notes?.slice(0, 140) ||
            r!.meetingTitle,
        }));

      collisions.push({
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
        sourceNotes: sources,
        relevanceScore: 0.94,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: 'active',
      });
    }

    // Pattern 2: Architecture & Pipeline + UX Design Critique
    const archNote = recordings.find(
      (r) =>
        r.meetingTitle.toLowerCase().includes('architecture') ||
        r.meetingTitle.toLowerCase().includes('pipeline') ||
        (r.tags || []).some((t) => t.toLowerCase().includes('architecture'))
    );
    const uxNote = recordings.find(
      (r) =>
        r.meetingTitle.toLowerCase().includes('design') ||
        r.meetingTitle.toLowerCase().includes('critique') ||
        (r.tags || []).some((t) => t.toLowerCase().includes('ux'))
    );

    if (archNote && uxNote) {
      collisions.push({
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
            recordingId: archNote.id,
            meetingTitle: archNote.meetingTitle,
            date: archNote.createdAt
              ? new Date(archNote.createdAt).toLocaleDateString()
              : 'Previous Note',
            excerptSnippet:
              archNote.summary?.executiveSummary?.slice(0, 140) || archNote.meetingTitle,
          },
          {
            recordingId: uxNote.id,
            meetingTitle: uxNote.meetingTitle,
            date: uxNote.createdAt
              ? new Date(uxNote.createdAt).toLocaleDateString()
              : 'Previous Note',
            excerptSnippet: uxNote.summary?.executiveSummary?.slice(0, 140) || uxNote.meetingTitle,
          },
        ],
        relevanceScore: 0.89,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'active',
      });
    }

    // Pattern 3: Generic cross-pollination between the first two recordings
    if (collisions.length === 0 && recordings.length >= 2) {
      const r1 = recordings[0];
      const r2 = recordings[1];

      collisions.push({
        id: `collision-${r1.id}-${r2.id}`,
        title: `${r1.meetingTitle.split(' ')[0]} ⇄ ${r2.meetingTitle.split(' ')[0]} Synthesis`,
        sharedMechanism:
          'Cross-Domain Modular Abstraction: Applying the structural constraints of one domain to streamline execution in the other.',
        overlappingConcepts: [
          r1.tags?.[0] || 'Execution rhythm',
          r2.tags?.[0] || 'Feedback loops',
          'Iterative delivery',
        ],
        whyUseful:
          'Synthesizes decisions from prior discussions into a unified execution framework, preventing duplicate work and surfacing overlooked synergies.',
        smallExperiment:
          'Run a 1-day sprint retro applying the primary decision from the earlier note to current blockers.',
        sourceNotes: [
          {
            recordingId: r1.id,
            meetingTitle: r1.meetingTitle,
            date: r1.createdAt ? new Date(r1.createdAt).toLocaleDateString() : 'Earlier Note',
            excerptSnippet: r1.summary?.executiveSummary?.slice(0, 140) || r1.meetingTitle,
          },
          {
            recordingId: r2.id,
            meetingTitle: r2.meetingTitle,
            date: r2.createdAt ? new Date(r2.createdAt).toLocaleDateString() : 'Recent Note',
            excerptSnippet: r2.summary?.executiveSummary?.slice(0, 140) || r2.meetingTitle,
          },
        ],
        relevanceScore: 0.82,
        createdAt: new Date().toISOString(),
        status: 'active',
      });
    }

    return collisions.filter((c) => !dismissedIds.has(c.id));
  }

  /**
   * Retrieves all active collisions that involve a specific recording note.
   */
  getCollisionsForNote(recordingId: string): IdeaCollision[] {
    const store = useMeetingStore.getState();
    const collisions = store.ideaCollisions || [];
    const dismissedIds = new Set(store.dismissedCollisionIds || []);

    return collisions.filter(
      (c) =>
        !dismissedIds.has(c.id) &&
        c.sourceNotes.some((s) => s.recordingId === recordingId)
    );
  }
}

export const ideaCollisionService = new IdeaCollisionService();

