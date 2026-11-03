import * as Linking from 'expo-linking';
import { ActionItem, Commitment } from '@/types/meeting';

export interface ParsedEventSchedule {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
}

/**
 * Service to bridge meeting action items & commitments into Calendar events and Tasks.
 * Automatically parses deadline phrases into concrete dates and provides one-tap
 * Google Calendar, iCalendar (.ics), and task sync.
 */
class CalendarTaskService {
  /**
   * Intelligently parses date phrases (e.g. "Tomorrow", "By Friday", "Today", "2026-11-06")
   * into concrete Date ranges for calendar events.
   */
  parseDeadlineToDate(deadlinePhrase?: string, defaultDaysAhead: number = 2): { start: Date; end: Date } {
    const now = new Date();
    const phrase = (deadlinePhrase || '').toLowerCase().trim();

    const start = new Date(now);
    // Standard default work start: 09:00 AM
    start.setHours(9, 0, 0, 0);

    if (phrase.includes('today')) {
      // today at 5 PM
      start.setHours(17, 0, 0, 0);
    } else if (phrase.includes('tomorrow')) {
      start.setDate(now.getDate() + 1);
      start.setHours(10, 0, 0, 0);
    } else if (phrase.includes('friday')) {
      const day = now.getDay();
      const distance = (5 - day + 7) % 7 || 7;
      start.setDate(now.getDate() + distance);
      start.setHours(17, 0, 0, 0);
    } else if (phrase.includes('monday')) {
      const day = now.getDay();
      const distance = (1 - day + 7) % 7 || 7;
      start.setDate(now.getDate() + distance);
      start.setHours(10, 0, 0, 0);
    } else if (phrase.includes('week') || phrase.includes('next sync')) {
      start.setDate(now.getDate() + 7);
      start.setHours(10, 0, 0, 0);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(phrase)) {
      const [y, m, d] = phrase.split('-').map(Number);
      start.setFullYear(y, m - 1, d);
      start.setHours(10, 0, 0, 0);
    } else {
      start.setDate(now.getDate() + defaultDaysAhead);
      start.setHours(11, 0, 0, 0);
    }

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    return { start, end };
  }

  /**
   * Formats a Date into Google Calendar UTC string: YYYYMMDDTHHMMSSZ
   */
  private formatUtcForCalendar(d: Date): string {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  }

  /**
   * Generates a direct Google Calendar event creation URL.
   */
  createGoogleCalendarUrl(
    title: string,
    description: string,
    start: Date,
    end: Date
  ): string {
    const dates = `${this.formatUtcForCalendar(start)}/${this.formatUtcForCalendar(end)}`;
    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const textParam = `&text=${encodeURIComponent(title)}`;
    const datesParam = `&dates=${dates}`;
    const detailsParam = `&details=${encodeURIComponent(description)}`;

    return `${base}${textParam}${datesParam}${detailsParam}`;
  }

  /**
   * Opens the event directly in Google Calendar (web or app).
   */
  async openInGoogleCalendar(
    title: string,
    description: string,
    deadlinePhrase?: string
  ): Promise<boolean> {
    const { start, end } = this.parseDeadlineToDate(deadlinePhrase);
    const url = this.createGoogleCalendarUrl(title, description, start, end);

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
    } catch (err) {
      console.warn('Open calendar notice:', err);
    }

    // Direct browser fallback
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generates standard RFC 5545 iCalendar (.ics) content for an action item or commitment.
   * Universally supported by Apple Calendar, Google Calendar, Outlook, and Android.
   */
  generateIcsContent(
    items: Array<{
      title: string;
      description: string;
      deadlinePhrase?: string;
    }>
  ): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MeetingNoteTaker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    items.forEach((item, idx) => {
      const { start, end } = this.parseDeadlineToDate(item.deadlinePhrase, idx + 1);
      const uid = `task-${Date.now()}-${idx}@meetanotes.ai`;
      const stamp = this.formatUtcForCalendar(new Date());
      const dtStart = this.formatUtcForCalendar(start);
      const dtEnd = this.formatUtcForCalendar(end);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:${item.title.replace(/\n/g, ' ')}`);
      lines.push(`DESCRIPTION:${item.description.replace(/\n/g, '\\n')}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push('DESCRIPTION:Reminder for meeting action item');
      lines.push('TRIGGER:-PT30M');
      lines.push('END:VALARM');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Exports an Action Item to Calendar.
   */
  async exportActionItemToCalendar(item: ActionItem, meetingTitle: string): Promise<boolean> {
    const title = `Task: ${item.task}`;
    const desc = `Meeting: ${meetingTitle}\nAssignee: ${item.assignee || 'Me'}\nPriority: ${item.priority || 'Medium'}\nCategory: ${item.category || 'General'}`;
    return await this.openInGoogleCalendar(title, desc, item.dueDate);
  }

  /**
   * Exports a Commitment to Calendar.
   */
  async exportCommitmentToCalendar(commitment: Commitment): Promise<boolean> {
    const isIOwe = commitment.direction === 'i_owe';
    const title = isIOwe
      ? `Commitment: I owe ${commitment.person}`
      : `Follow-up: ${commitment.speaker} owes me`;
    const desc = `Promise: ${commitment.promise}\nDirection: ${isIOwe ? 'Outgoing Promise' : 'Incoming Promise'}\nDeadline: ${commitment.deadlinePhrase || 'Soon'}\nMeeting: ${commitment.meetingTitle || 'Voice Note'}`;
    return await this.openInGoogleCalendar(title, desc, commitment.deadlinePhrase || commitment.dueDate);
  }
}

export const calendarTaskService = new CalendarTaskService();

