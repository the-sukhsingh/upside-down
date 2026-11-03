import {
  ActionItem,
  MeetingSummary,
  ProcessingEngine,
  Commitment,
  KeyDecisionItem,
  TranscriptSegment,
  EvidenceCitation,
  LiveContextMatch,
} from '@/types/meeting';
import { getGroqApiKey, getSarvamApiKey } from '@/constants/ApiConfig';

export interface AINoteProgressCallback {
  (stage: string, percent: number): void;
}

export interface AINoteResult {
  summary: MeetingSummary;
  notes: string;
  tags: string[];
  commitments: Commitment[];
  modelUsed: string;
  provider: ProcessingEngine;
  inferenceTimeMs: number;
}

const NOTE_GENERATION_JSON_SCHEMA = `Analyze the meeting transcript and return a JSON object with this exact schema:
{
  "executiveSummary": "Concise paragraph synthesizing what occurred, key background, and outcomes",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "keyDecisions": [
    {
      "decision": "Clear statement of decision agreed upon",
      "startTime": 45,
      "endTime": 60,
      "quote": "Short exact sentence said in audio"
    }
  ],
  "actionItems": [
    {
      "task": "Specific actionable task description",
      "assignee": "Person, team, or 'Team'",
      "priority": "high" | "medium" | "low",
      "category": "Engineering" | "Design" | "Product" | "DevOps" | "General",
      "dueDate": "e.g. 2026-11-06 or 'By Friday'",
      "startTime": 90,
      "endTime": 110,
      "quote": "Short exact sentence said in audio"
    }
  ],
  "commitments": [
    {
      "speaker": "Person who made the promise (e.g. Alex, Sarah, Me)",
      "person": "Who the promise was made to (e.g. Connor, Team, Client)",
      "promise": "Exact deliverable promised (e.g. Send the updated architecture deck)",
      "direction": "i_owe" | "they_owe_me",
      "deadlinePhrase": "e.g. by Friday 5 PM, tomorrow morning, next week",
      "dueDate": "YYYY-MM-DD or reasonable date string",
      "startTime": 120,
      "endTime": 135,
      "quote": "Exact spoken promise"
    }
  ],
  "followUps": ["Next step 1", "Next step 2"],
  "tags": ["Tag1", "Tag2", "Meeting"]
}`;

/**
 * AI Note Generation Service
 * Synthesizes meeting transcript into structured notes, executive summaries,
 * key decisions, conversation evidence links, and Promise Radar commitments.
 * Powered directly by Groq and Sarvam AI APIs.
 */
class AINoteService {
  /**
   * Resolves the requested Groq model to a verified active model.
   */
  private resolveGroqModel(modelId: string): string {
    if (!modelId || modelId.includes('llama')) {
      return 'openai/gpt-oss-120b';
    }
    return modelId;
  }

  /**
   * Correlates an item with exact recording timestamp evidence.
   */
  private findEvidence(
    quote?: string,
    startTime?: number,
    endTime?: number,
    segments?: TranscriptSegment[]
  ): EvidenceCitation | undefined {
    if (startTime !== undefined && startTime >= 0) {
      return {
        startTime: Math.floor(startTime),
        endTime: Math.max(Math.floor(startTime) + 4, Math.ceil(endTime || startTime + 4)),
        quote: quote?.trim(),
      };
    }

    if (!quote || !segments || segments.length === 0) {
      return undefined;
    }

    const lowerQuote = quote.toLowerCase().slice(0, 35);
    const matchingSeg = segments.find((s) => s.text.toLowerCase().includes(lowerQuote));
    if (matchingSeg) {
      return {
        startTime: matchingSeg.startTime,
        endTime: matchingSeg.endTime,
        quote: quote.trim(),
      };
    }

    return undefined;
  }

  /**
   * Normalizes parsed model JSON into strongly typed summary structures.
   */
  private processModelOutput(
    parsed: any,
    meetingTitle: string,
    providerName: string,
    segments?: TranscriptSegment[],
    pinnedContexts?: LiveContextMatch[]
  ): { summary: MeetingSummary; notes: string; tags: string[]; commitments: Commitment[] } {
    const rawDecisions = parsed.keyDecisions || [];
    const structuredDecisions: KeyDecisionItem[] = rawDecisions.map((d: any, idx: number) => {
      const decisionText = typeof d === 'string' ? d : d.decision || String(d);
      const evidence = this.findEvidence(
        typeof d === 'object' ? d.quote : undefined,
        typeof d === 'object' ? d.startTime : undefined,
        typeof d === 'object' ? d.endTime : undefined,
        segments
      );
      return {
        id: `dec-${Date.now()}-${idx}`,
        decision: decisionText,
        evidence,
      };
    });

    const keyDecisions = structuredDecisions.map((d) => d.decision);

    const actionItems: ActionItem[] = (parsed.actionItems || []).map((a: any, idx: number) => {
      const evidence = this.findEvidence(a.quote, a.startTime, a.endTime, segments);
      return {
        id: `act-${Date.now()}-${idx}`,
        task: a.task || 'Action task',
        assignee: a.assignee || 'Team',
        done: false,
        priority: (a.priority || 'medium').toLowerCase() as any,
        dueDate: a.dueDate || 'Next sync',
        category: a.category || 'General',
        evidence,
      };
    });

    const commitments: Commitment[] = (parsed.commitments || []).map((c: any, idx: number) => {
      const evidence = this.findEvidence(c.quote, c.startTime, c.endTime, segments);
      const direction = c.direction === 'they_owe_me' ? 'they_owe_me' : 'i_owe';
      return {
        id: `com-${Date.now()}-${idx}`,
        meetingTitle,
        speaker: c.speaker || (direction === 'i_owe' ? 'Me' : 'Speaker'),
        person: c.person || 'Team',
        promise: c.promise || 'Follow up on promised deliverable',
        direction,
        deadlinePhrase: c.deadlinePhrase || c.dueDate || 'Soon',
        dueDate: c.dueDate || undefined,
        status: 'pending',
        completed: false,
        evidence,
        createdAt: new Date().toISOString(),
      };
    });

    const summary: MeetingSummary = {
      executiveSummary:
        parsed.executiveSummary || `Executive synthesis for "${meetingTitle}" generated via ${providerName}.`,
      keyTopics: parsed.keyTopics || [],
      keyDecisions,
      structuredDecisions,
      actionItems,
      commitments,
      followUps: parsed.followUps || [],
    };

    const notes = this.formatMarkdown(meetingTitle, summary, pinnedContexts);
    const tags = parsed.tags || [providerName, 'AI Notes'];

    return { summary, notes, tags, commitments };
  }

  /**
   * Calls Groq Chat Completions endpoint.
   */
  async generateWithGroqLLM(
    transcript: string,
    meetingTitle: string,
    apiKey: string,
    modelId: string = 'openai/gpt-oss-120b',
    segments?: TranscriptSegment[],
    onProgress?: AINoteProgressCallback,
    pinnedContexts?: LiveContextMatch[]
  ): Promise<{ summary: MeetingSummary; notes: string; tags: string[]; commitments: Commitment[] }> {
    const effectiveModel = this.resolveGroqModel(modelId);
    onProgress?.(`Connecting to Groq AI (${effectiveModel})...`, 25);

    const systemPrompt = `You are an elite executive meeting assistant. Analyze the transcript, extract key decisions, action items, Promise Radar commitments ("I owe" vs "They owe me"), and conversation evidence timestamps. ${NOTE_GENERATION_JSON_SCHEMA}. Respond ONLY with valid JSON.`;
    const userPrompt = `Meeting Title: "${meetingTitle}"\n\nTranscript with timestamps:\n${transcript}\n\nProduce the structured meeting analysis in JSON:`;

    onProgress?.(`Synthesizing meeting intelligence with Groq (${effectiveModel})...`, 55);

    const attemptFetch = async (targetModel: string) => {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq LLM error (${response.status}): ${err}`);
      }

      return response;
    };

    let response: Response;
    try {
      response = await attemptFetch(effectiveModel);
    } catch (primaryErr: any) {
      if (effectiveModel !== 'qwen/qwen3.8-27b') {
        console.warn(`Groq ${effectiveModel} notice, attempting fallback to qwen/qwen3.8-27b...`, primaryErr);
        onProgress?.('Attempting Groq high-speed fallback model (qwen/qwen3.8-27b)...', 65);
        response = await attemptFetch('qwen/qwen3.8-27b');
      } else {
        throw primaryErr;
      }
    }

    onProgress?.('Parsing Groq structured note response...', 85);
    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error(`Invalid JSON received from Groq: ${rawContent.slice(0, 150)}`);
      }
    }

    return this.processModelOutput(parsed, meetingTitle, 'Groq', segments, pinnedContexts);
  }

  /**
   * Calls Sarvam AI Chat Completions endpoint.
   */
  async generateWithSarvamLLM(
    transcript: string,
    meetingTitle: string,
    apiKey: string,
    modelId: string = 'sarvam-105b',
    segments?: TranscriptSegment[],
    onProgress?: AINoteProgressCallback,
    pinnedContexts?: LiveContextMatch[]
  ): Promise<{ summary: MeetingSummary; notes: string; tags: string[]; commitments: Commitment[] }> {
    onProgress?.(`Connecting to Sarvam AI (${modelId})...`, 25);

    const systemPrompt = `You are an expert meeting summarizer. Extract decisions, action items, commitments ("I owe" vs "They owe me"), and evidence timestamps. ${NOTE_GENERATION_JSON_SCHEMA}. Respond ONLY with valid JSON.`;
    const userPrompt = `Meeting Title: "${meetingTitle}"\n\nTranscript:\n${transcript}\n\nProduce the structured JSON analysis:`;

    onProgress?.(`Synthesizing meeting with Sarvam ${modelId}...`, 55);

    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 3500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Sarvam LLM error (${response.status}): ${err}`);
    }

    onProgress?.('Parsing Sarvam structured intelligence...', 85);
    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';

    let parsed: any = {};
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawContent);
    } catch {
      throw new Error(`Invalid JSON received from Sarvam: ${rawContent.slice(0, 150)}`);
    }

    return this.processModelOutput(parsed, meetingTitle, 'Sarvam AI', segments, pinnedContexts);
  }

  /**
   * Main Note Generation Orchestrator
   */
  async generateNotes(
    transcript: string,
    options: {
      provider?: ProcessingEngine;
      meetingTitle?: string;
      groqLlmModel?: string;
      sarvamLlmModel?: string;
      segments?: TranscriptSegment[];
      onProgress?: AINoteProgressCallback;
      pinnedContexts?: LiveContextMatch[];
    } = {}
  ): Promise<AINoteResult> {
    const startTime = Date.now();
    const {
      provider = 'groq',
      meetingTitle = 'Recorded Meeting',
      groqLlmModel = 'openai/gpt-oss-120b',
      sarvamLlmModel = 'sarvam-105b',
      segments,
      onProgress,
      pinnedContexts,
    } = options;

    const groqKey = getGroqApiKey();
    const sarvamKey = getSarvamApiKey();

    // 1. Groq LLM Route
    if (provider === 'groq') {
      if (!groqKey) {
        throw new Error('Groq API Key is not configured. Please check constants/ApiConfig.ts');
      }
      const effectiveGroqModel = this.resolveGroqModel(groqLlmModel);
      const groqResult = await this.generateWithGroqLLM(
        transcript,
        meetingTitle,
        groqKey,
        effectiveGroqModel,
        segments,
        onProgress,
        pinnedContexts
      );
      onProgress?.('Complete.', 100);
      return {
        ...groqResult,
        modelUsed: `Groq (${effectiveGroqModel})`,
        provider: 'groq',
        inferenceTimeMs: Date.now() - startTime,
      };
    }

    // 2. Sarvam AI LLM Route
    if (provider === 'sarvam') {
      if (!sarvamKey) {
        throw new Error('Sarvam API Key is not configured. Please check constants/ApiConfig.ts');
      }
      const sarvamResult = await this.generateWithSarvamLLM(
        transcript,
        meetingTitle,
        sarvamKey,
        sarvamLlmModel,
        segments,
        onProgress,
        pinnedContexts
      );
      onProgress?.('Complete.', 100);
      return {
        ...sarvamResult,
        modelUsed: `Sarvam AI (${sarvamLlmModel})`,
        provider: 'sarvam',
        inferenceTimeMs: Date.now() - startTime,
      };
    }

    throw new Error(`Unsupported AI note provider: ${provider}`);
  }

  private formatTime(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  private formatMarkdown(
    title: string,
    summary: MeetingSummary,
    pinnedContexts?: LiveContextMatch[]
  ): string {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const structuredDecs = summary.structuredDecisions || [];
    const decisionsText =
      structuredDecs.length > 0
        ? structuredDecs
            .map((d) => {
              const evidenceTag = d.evidence ? ` *[🔊 ${this.formatTime(d.evidence.startTime)}]*` : '';
              return `- **Decision:** ${d.decision}${evidenceTag}`;
            })
            .join('\n')
        : (summary.keyDecisions || []).length > 0
        ? summary.keyDecisions.map((d) => `- **Decision:** ${d}`).join('\n')
        : '- *No explicit decisions recorded.*';

    const actionItemsText =
      (summary.actionItems || []).length > 0
        ? summary.actionItems
            .map((a) => {
              const evidenceTag = a.evidence ? ` *[🔊 ${this.formatTime(a.evidence.startTime)}]*` : '';
              return `- [ ] **${a.task}**${evidenceTag}\n  *Assignee:* ${a.assignee || 'Unassigned'} | *Priority:* ${a.priority?.toUpperCase()} | *Category:* ${a.category || 'General'} | *Due:* ${a.dueDate || 'Next sync'}`;
            })
            .join('\n')
        : '- *No pending action items.*';

    // Commitments / Promise Radar
    const commitments = summary.commitments || [];
    const iOwe = commitments.filter((c) => c.direction === 'i_owe');
    const theyOweMe = commitments.filter((c) => c.direction === 'they_owe_me');

    const iOweText =
      iOwe.length > 0
        ? iOwe
            .map((c) => {
              const evidenceTag = c.evidence ? ` *[🔊 ${this.formatTime(c.evidence.startTime)}]*` : '';
              return `- [ ] **I owe ${c.person}:** ${c.promise} (${c.deadlinePhrase || 'Soon'})${evidenceTag}`;
            })
            .join('\n')
        : '- *No outgoing commitments pending.*';

    const theyOweText =
      theyOweMe.length > 0
        ? theyOweMe
            .map((c) => {
              const evidenceTag = c.evidence ? ` *[🔊 ${this.formatTime(c.evidence.startTime)}]*` : '';
              return `- [ ] **${c.speaker} owes me:** ${c.promise} (${c.deadlinePhrase || 'Soon'})${evidenceTag}`;
            })
            .join('\n')
        : '- *No incoming commitments pending.*';

    const followUpsList = summary.followUps || [];
    const followUpsText =
      followUpsList.length > 0
        ? followUpsList.map((f) => `- ${f}`).join('\n')
        : '- *Review during next sync.*';

    const pinnedSection =
      pinnedContexts && pinnedContexts.length > 0
        ? `\n## 💡 Referenced Historical Context ("Live Topic Radar")\n` +
          pinnedContexts
            .map(
              (p) =>
                `- **${p.meetingTitle}** (${p.date})\n  *Matched Topic:* #${p.matchedTopic}\n  *Prior Decision:* ${p.keyDecisions[0] || 'Prior alignment'}` +
                (p.openCommitments[0] ? `\n  *Prior Commitment:* "${p.openCommitments[0].promise}"` : '')
            )
            .join('\n\n') +
          '\n'
        : '';

    return `# ${title}
*Date: ${today}*

## Executive Summary
${summary.executiveSummary}

## Key Decisions
${decisionsText}

## Action Items
${actionItemsText}

## Commitment Tracker ("Promise Radar")
### 📤 I Owe (My Commitments)
${iOweText}

### 📥 They Owe Me (Incoming Commitments)
${theyOweText}
${pinnedSection}
## Next Steps
${followUpsText}
`;
  }
}

export const aiNoteService = new AINoteService();
