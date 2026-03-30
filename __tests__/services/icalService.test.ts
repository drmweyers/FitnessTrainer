/** @jest-environment node */

import {
  generateICS,
  generateSingleICS,
  formatICalDate,
  escapeICalText,
  foldLine,
  ICalAppointment,
} from '@/lib/services/icalService';

const baseAppt: ICalAppointment = {
  id: 'appt-1',
  title: 'Training Session',
  startDatetime: new Date('2026-03-15T10:00:00Z'),
  endDatetime: new Date('2026-03-15T11:00:00Z'),
  status: 'confirmed',
};

describe('generateICS', () => {
  it('generates valid VCALENDAR wrapper', () => {
    const ics = generateICS([baseAppt]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//EvoFit Trainer//Schedule//EN');
    expect(ics).toContain('CALSCALE:GREGORIAN');
    expect(ics).toContain('METHOD:PUBLISH');
  });

  it('generates VEVENT for each appointment', () => {
    const ics = generateICS([baseAppt]);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('UID:appt-1@evofittrainer.app');
    expect(ics).toContain('SUMMARY:Training Session');
  });

  it('maps confirmed status to CONFIRMED', () => {
    const ics = generateICS([{ ...baseAppt, status: 'confirmed' }]);
    expect(ics).toContain('STATUS:CONFIRMED');
  });

  it('maps completed status to CONFIRMED', () => {
    const ics = generateICS([{ ...baseAppt, status: 'completed' }]);
    expect(ics).toContain('STATUS:CONFIRMED');
  });

  it('maps scheduled status to TENTATIVE', () => {
    const ics = generateICS([{ ...baseAppt, status: 'scheduled' }]);
    expect(ics).toContain('STATUS:TENTATIVE');
  });

  it('maps cancelled status to CANCELLED', () => {
    const ics = generateICS([{ ...baseAppt, status: 'cancelled' }]);
    expect(ics).toContain('STATUS:CANCELLED');
  });

  it('maps no_show status to CANCELLED', () => {
    const ics = generateICS([{ ...baseAppt, status: 'no_show' }]);
    expect(ics).toContain('STATUS:CANCELLED');
  });

  it('maps unknown status to TENTATIVE (default)', () => {
    const ics = generateICS([{ ...baseAppt, status: 'unknown_status' }]);
    expect(ics).toContain('STATUS:TENTATIVE');
  });

  it('includes DESCRIPTION when provided', () => {
    const ics = generateICS([{ ...baseAppt, description: 'Leg day workout' }]);
    expect(ics).toContain('DESCRIPTION:Leg day workout');
  });

  it('omits DESCRIPTION when not provided', () => {
    const ics = generateICS([{ ...baseAppt, description: null }]);
    expect(ics).not.toContain('DESCRIPTION:');
  });

  it('includes LOCATION when provided', () => {
    const ics = generateICS([{ ...baseAppt, location: 'Main Gym' }]);
    expect(ics).toContain('LOCATION:Main Gym');
  });

  it('omits LOCATION when not provided', () => {
    const ics = generateICS([{ ...baseAppt, location: null }]);
    expect(ics).not.toContain('LOCATION:');
  });

  it('generates multiple VEVENTs for multiple appointments', () => {
    const appt2: ICalAppointment = {
      id: 'appt-2',
      title: 'Session Two',
      startDatetime: new Date('2026-03-16T09:00:00Z'),
      endDatetime: new Date('2026-03-16T10:00:00Z'),
      status: 'scheduled',
    };
    const ics = generateICS([baseAppt, appt2]);
    const beginCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(beginCount).toBe(2);
    expect(ics).toContain('UID:appt-1@evofittrainer.app');
    expect(ics).toContain('UID:appt-2@evofittrainer.app');
  });

  it('generates empty calendar with no appointments', () => {
    const ics = generateICS([]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('uses CRLF line endings', () => {
    const ics = generateICS([baseAppt]);
    expect(ics).toContain('\r\n');
  });

  it('accepts string dates', () => {
    const appt: ICalAppointment = {
      ...baseAppt,
      startDatetime: '2026-03-15T10:00:00Z',
      endDatetime: '2026-03-15T11:00:00Z',
    };
    const ics = generateICS([appt]);
    expect(ics).toContain('BEGIN:VEVENT');
  });
});

describe('generateSingleICS', () => {
  it('generates ICS for a single appointment', () => {
    const ics = generateSingleICS(baseAppt);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('UID:appt-1@evofittrainer.app');
    const beginCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(beginCount).toBe(1);
  });
});

describe('formatICalDate', () => {
  it('formats a Date object correctly', () => {
    const date = new Date('2026-03-15T10:00:00Z');
    const formatted = formatICalDate(date);
    expect(formatted).toMatch(/^\d{8}T\d{6}Z$/);
    expect(formatted).toContain('20260315T100000Z');
  });

  it('formats a string date correctly', () => {
    const formatted = formatICalDate('2026-03-15T10:00:00Z');
    expect(formatted).toMatch(/^\d{8}T\d{6}Z$/);
  });

  it('removes dashes and colons', () => {
    const formatted = formatICalDate(new Date('2026-06-01T12:30:45Z'));
    expect(formatted).not.toContain('-');
    expect(formatted).not.toContain(':');
  });
});

describe('escapeICalText', () => {
  it('escapes backslashes', () => {
    expect(escapeICalText('foo\\bar')).toBe('foo\\\\bar');
  });

  it('escapes semicolons', () => {
    expect(escapeICalText('a;b')).toBe('a\\;b');
  });

  it('escapes commas', () => {
    expect(escapeICalText('a,b')).toBe('a\\,b');
  });

  it('escapes newlines', () => {
    expect(escapeICalText('line1\nline2')).toBe('line1\\nline2');
  });

  it('handles multiple special chars', () => {
    const text = 'Gym, Main St; Notes:\nBring towel\\mat';
    const escaped = escapeICalText(text);
    expect(escaped).toContain('\\,');
    expect(escaped).toContain('\\;');
    expect(escaped).toContain('\\n');
    expect(escaped).toContain('\\\\');
  });

  it('returns plain text unchanged', () => {
    expect(escapeICalText('Hello World')).toBe('Hello World');
  });
});

describe('foldLine', () => {
  it('returns short lines unchanged', () => {
    const short = 'SUMMARY:Training';
    expect(foldLine(short)).toBe(short);
  });

  it('folds lines longer than 75 characters', () => {
    const longLine = 'DESCRIPTION:' + 'A'.repeat(100);
    const folded = foldLine(longLine);
    // First part is 75 chars, then CRLF + space + continuation
    const parts = folded.split('\r\n');
    expect(parts[0].length).toBe(75);
    expect(parts[1].startsWith(' ')).toBe(true);
  });

  it('handles very long lines with multiple folds', () => {
    const veryLongLine = 'X-PROP:' + 'B'.repeat(300);
    const folded = foldLine(veryLongLine);
    const parts = folded.split('\r\n');
    expect(parts.length).toBeGreaterThan(2);
    // Each continuation line (except the first) starts with a space
    parts.slice(1).forEach(part => {
      expect(part.startsWith(' ')).toBe(true);
    });
  });

  it('returns exactly 75 char line unchanged', () => {
    const line = 'X'.repeat(75);
    expect(foldLine(line)).toBe(line);
  });
});
