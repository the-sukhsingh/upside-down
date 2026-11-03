import { getGroqApiKey } from '@/constants/ApiConfig';
import { useMeetingStore } from '@/store/meetingStore';
import {
  Recording,
  MeetingSummary,
  ActionItem,
  Commitment,
  KeyDecisionItem,
} from '@/types/meeting';

export interface VisionDigitizeResult {
  recording: Recording;
  extractedTitle: string;
  summary: MeetingSummary;
  commitments: Commitment[];
  rawNotes: string;
  inferenceTimeMs: number;
}

class VisionNoteService {
  /**
   * Sends base64 image data to Groq's multimodal vision model (qwen/qwen3.8-27b)
   * to transcribe, digitalize, and structure handwritten notes, whiteboard sketches, or slides.
   */
  async digitalizeNoteImage(
    base64Data: string,
    mimeType: string = 'image/jpeg',
    userTitle?: string
  ): Promise<VisionDigitizeResult> {
    const startTime = Date.now();
    const apiKey = getGroqApiKey();

    if (!apiKey) {
      throw new Error('Groq API Key is not configured. Please add your key to .env.local');
    }

    // Ensure base64 string doesn't already contain prefix
    const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

    const systemPrompt = `You are an elite OCR and meeting intelligence AI.
Your task is to analyze this photo of meeting notes, whiteboard diagrams, handwritten notes, or presentation slides.
1. Transcribe all text accurately, deciphering handwriting, bullet points, and tables.
2. Interpret workflow diagrams, arrows, mind maps, or system architectures.
3. Identify all agreed key decisions, action items (with owner and priority), and commitments ("I owe" vs "They owe me").
4. Return a valid, compact JSON object with this EXACT schema:
{
  "title": "Concise, descriptive title for these notes",
  "executiveSummary": "Comprehensive 2-4 sentence executive overview of what was noted, decided, and sketched",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "keyDecisions": [
    "Decision 1 statement",
    "Decision 2 statement"
  ],
  "actionItems": [
    {
      "task": "Actionable task description",
      "assignee": "Name, team, or 'Team'",
      "priority": "high",
      "dueDate": "e.g. By Friday, or specific date"
    }
  ],
  "commitments": [
    {
      "speaker": "Person who made the promise (e.g. Alex, Me)",
      "person": "Who the promise was made to",
      "promise": "What was promised",
      "direction": "i_owe",
      "deadlinePhrase": "Deadline phrase"
    }
  ],
  "rawNotes": "Compact markdown transcription of whiteboard text, diagrams, and bullet points"
}
Respond ONLY with the JSON object. Do not wrap in conversational markdown prose outside the JSON.`;

    const userPrompt = userTitle
      ? `Meeting context/title: "${userTitle}". Digitalize and structure these notes into compact JSON:`
      : 'Digitalize and structure these notes into compact JSON:';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `${systemPrompt}\n\n${userPrompt}` },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 950,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let userFriendlyMsg = `Groq Vision API error (${response.status})`;
      try {
        const parsedErr = JSON.parse(errText);
        if (parsedErr.error?.message) {
          userFriendlyMsg = parsedErr.error.message;
        }
      } catch {
        userFriendlyMsg = errText;
      }
      throw new Error(userFriendlyMsg);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Groq Vision model returned invalid JSON structure.');
      }
    }

    const title = userTitle || parsed.title || 'Digitalized Whiteboard Notes';
    const executiveSummary =
      parsed.executiveSummary ||
      'Digitalized meeting notes and whiteboard diagrams captured via Groq Vision.';
    const keyTopics: string[] = parsed.keyTopics || ['Whiteboard', 'Meeting Notes'];

    const structuredDecisions: KeyDecisionItem[] = (parsed.keyDecisions || []).map(
      (d: any, idx: number) => ({
        id: `dec-vis-${Date.now()}-${idx}`,
        decision: typeof d === 'string' ? d : d.decision || String(d),
      })
    );
    const keyDecisions = structuredDecisions.map((d) => d.decision);

    const actionItems: ActionItem[] = (parsed.actionItems || []).map((a: any, idx: number) => ({
      id: `act-vis-${Date.now()}-${idx}`,
      task: a.task || 'Action item from notes',
      assignee: a.assignee || 'Team',
      done: false,
      priority: (a.priority || 'medium').toLowerCase() as any,
      dueDate: a.dueDate || 'Next sprint',
      category: 'Visual Capture',
    }));

    const commitments: Commitment[] = (parsed.commitments || []).map((c: any, idx: number) => ({
      id: `com-vis-${Date.now()}-${idx}`,
      speaker: c.speaker || 'Team',
      person: c.person || 'Team',
      promise: c.promise || 'Follow up on whiteboard deliverables',
      direction: (c.direction === 'they_owe_me' ? 'they_owe_me' : 'i_owe') as any,
      dueDate: c.dueDate || new Date().toISOString().split('T')[0],
      deadlinePhrase: c.deadlinePhrase || 'Soon',
      status: 'pending',
      completed: false,
      createdAt: new Date().toISOString(),
    }));

    const summary: MeetingSummary = {
      executiveSummary,
      keyTopics,
      keyDecisions,
      structuredDecisions,
      actionItems,
      commitments,
      followUps: ['Review digitized notes with attendees', 'Transfer tasks to issue tracker'],
    };

    const today = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const markdownNotes = `# 📸 ${title}
*Captured: ${today} · Digitalized with Groq Vision (Qwen 3.8 27B)*

## 📋 Executive Summary
${executiveSummary}

## 💡 Key Decisions
${
  keyDecisions.length > 0
    ? keyDecisions.map((d) => `- **Decision:** ${d}`).join('\n')
    : '- *No explicit decisions recorded.*'
}

## ✅ Action Items
${
  actionItems.length > 0
    ? actionItems
        .map(
          (a) =>
            `- [ ] **${a.task}**\n  *Assignee:* ${a.assignee} | *Priority:* ${a.priority?.toUpperCase()} | *Due:* ${a.dueDate}`
        )
        .join('\n')
    : '- *No action items extracted.*'
}

## 🎯 Commitment Tracker ("Promise Radar")
### 📤 I Owe
${
  commitments.filter((c) => c.direction === 'i_owe').length > 0
    ? commitments
        .filter((c) => c.direction === 'i_owe')
        .map((c) => `- [ ] **I owe ${c.person}:** ${c.promise} (${c.deadlinePhrase || 'Soon'})`)
        .join('\n')
    : '- *No outgoing commitments pending.*'
}

### 📥 They Owe Me
${
  commitments.filter((c) => c.direction === 'they_owe_me').length > 0
    ? commitments
        .filter((c) => c.direction === 'they_owe_me')
        .map((c) => `- [ ] **${c.speaker} owes me:** ${c.promise} (${c.deadlinePhrase || 'Soon'})`)
        .join('\n')
    : '- *No incoming commitments pending.*'
}

## 📝 Raw Whiteboard & Note Transcription
${parsed.rawNotes || 'No additional raw notes available.'}
`;

    const newRecording: Recording = {
      id: `rec-vis-${Date.now()}`,
      meetingTitle: title,
      uri: `data:${mimeType};base64,captured_photo`,
      durationSeconds: 0,
      fileSizeBytes: Math.round(cleanBase64.length * 0.75),
      createdAt: new Date().toISOString(),
      status: 'completed',
      transcript: parsed.rawNotes || executiveSummary,
      summary,
      commitments,
      notes: markdownNotes,
      tags: ['Whiteboard', 'Digitalized Notes', 'Groq Vision'],
    };

    // Store in global store
    const store = useMeetingStore.getState();
    useMeetingStore.setState({
      recordings: [newRecording, ...store.recordings],
      commitments: [...commitments, ...store.commitments],
    });

    return {
      recording: newRecording,
      extractedTitle: title,
      summary,
      commitments,
      rawNotes: parsed.rawNotes || '',
      inferenceTimeMs: Date.now() - startTime,
    };
  }
}

export const visionNoteService = new VisionNoteService();

