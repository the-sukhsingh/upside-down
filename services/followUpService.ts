import { Recording, FollowUpTone, FollowUpDraft } from '@/types/meeting';
import { getGroqApiKey } from '@/constants/ApiConfig';

/**
 * Service to generate ready-to-send follow-up recap messages.
 * Supports Email and WhatsApp channels with customizable tone styles:
 * Executive, Casual, WhatsApp, and Action-Oriented.
 */
class FollowUpService {
  /**
   * Generates a follow-up draft based on meeting recording intelligence.
   */
  async generateDraft(
    recording: Recording,
    tone: FollowUpTone = 'executive'
  ): Promise<FollowUpDraft> {
    const summary = recording.summary;
    const title = recording.meetingTitle;
    const actions = summary?.actionItems || [];
    const decisions = summary?.keyDecisions || [];
    const executiveSummary = summary?.executiveSummary || 'Key agreements and next steps established.';

    const groqKey = getGroqApiKey();
    if (groqKey) {
      try {
        const prompt = `Write a ready-to-send post-meeting recap follow-up message.
Meeting Title: "${title}"
Tone requested: ${tone} (Options: executive, casual, whatsapp, action_oriented)
Executive Summary: "${executiveSummary}"
Key Decisions: ${decisions.map((d) => `- ${d}`).join('\n') || 'None'}
Action Items: ${actions.map((a) => `- [${a.priority || 'medium'}] ${a.task} (${a.assignee || 'Team'}, due: ${a.dueDate || 'Soon'})`).join('\n') || 'None'}

Return ONLY a JSON object:
{
  "subject": "Clear email subject line (or short WhatsApp header)",
  "body": "The complete ready-to-send recap message matching the tone requested",
  "channel": "${tone === 'whatsapp' ? 'whatsapp' : 'email'}"
}`;

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: 'You are an executive scribe. Return ONLY valid JSON.' },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return {
              tone,
              subject: parsed.subject || `Recap & Action Items: ${title}`,
              body: parsed.body || '',
              channel: tone === 'whatsapp' ? 'whatsapp' : 'email',
            };
          }
        }
      } catch (err) {
        console.warn('Groq follow-up generation notice:', err);
      }
    }

    // Deterministic fallback templates
    return this.createTemplateDraft(recording, tone);
  }

  private createTemplateDraft(recording: Recording, tone: FollowUpTone): FollowUpDraft {
    const title = recording.meetingTitle;
    const summary = recording.summary;
    const actions = summary?.actionItems || [];
    const decisions = summary?.keyDecisions || [];

    const actionsListText =
      actions.length > 0
        ? actions.map((a) => `• ${a.task} — @${a.assignee || 'Team'} (${a.dueDate || 'Next sync'})`).join('\n')
        : '• No pending action items';

    const decisionsListText =
      decisions.length > 0
        ? decisions.map((d) => `• ${d}`).join('\n')
        : '• Decisions documented in notes';

    if (tone === 'whatsapp') {
      const body = `*Recap: ${title}* 🚀\n\n*Quick Summary:* ${summary?.executiveSummary || 'Good alignment today.'}\n\n*Key Decisions:* \n${decisionsListText}\n\n*Action Items Checklist:* \n${actionsListText}\n\nLet me know if anything needs adjustment!`;
      return {
        tone: 'whatsapp',
        subject: `Recap: ${title}`,
        body,
        channel: 'whatsapp',
      };
    }

    if (tone === 'casual') {
      const body = `Hey team,\n\nThanks everyone for the great sync on "${title}"! Here is the quick recap so we stay aligned:\n\n${summary?.executiveSummary}\n\nKey Decisions:\n${decisionsListText}\n\nAction Items:\n${actionsListText}\n\nShout if I missed anything. Let's make it happen!\n\nBest,\nYour Note Assistant`;
      return {
        tone: 'casual',
        subject: `Quick recap & next steps: ${title}`,
        body,
        channel: 'email',
      };
    }

    if (tone === 'action_oriented') {
      const body = `Team,\n\nPlease review the committed deliverables and ownership from our discussion on "${title}":\n\nACTION ITEMS:\n${actionsListText}\n\nDECISIONS CONFIRMED:\n${decisionsListText}\n\nPlease update your progress before the next scheduled sync.\n\nRegards,\nTeam Lead`;
      return {
        tone: 'action_oriented',
        subject: `[Action Required] Deliverables & Commitments: ${title}`,
        body,
        channel: 'email',
      };
    }

    // Executive default
    const body = `Hi everyone,\n\nThank you for your time today. Below is the executive recap and action item distribution for "${title}":\n\nExecutive Overview:\n${summary?.executiveSummary || 'The team aligned on primary objectives and timelines.'}\n\nKey Strategic Decisions:\n${decisionsListText}\n\nAssigned Action Items:\n${actionsListText}\n\nNext Steps:\nProgress will be reviewed at our next milestone sync.\n\nBest regards,\nExecutive Office`;

    return {
      tone: 'executive',
      subject: `Executive Summary & Action Items: ${title}`,
      body,
      channel: 'email',
    };
  }
}

export const followUpService = new FollowUpService();

