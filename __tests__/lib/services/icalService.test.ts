/**
 * @jest-environment node
 */

import {
  generateICS,
  generateSingleICS,
  formatICalDate,
  escapeICalText,
  foldLine,
  ICalAppointment,
} from '@/lib/services/icalService'

describe('iCalService', () => {
  const sampleAppointment: ICalAppointment = {
    id: 'appt-123',
    title: 'Training Session',
    description: 'Leg day workout',
    location: 'Main Gym',
    startDatetime: new Date('2026-03-15T10:00:00Z'),
    endDatetime: new Date('2026-03-15T11:00:00Z'),
    status: 'scheduled',
  }

  describe('generateICS', () => {
    it('generates valid VCALENDAR with VEVENT for single appointment', () => {
      const ics = generateICS([sampleAppointment])
      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('END:VCALENDAR')
      expect(ics).toContain('BEGIN:VEVENT')
      expect(ics).toContain('END:VEVENT')
    })

    it('generates multiple VEVENTs for multiple appointments', () => {
      const appt2: ICalAppointment = {
        ...sampleAppointment,
        id: 'appt-456',
        title: 'Cardio Session',
      }
      const ics = generateICS([sampleAppointment, appt2])
      const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length
      expect(veventCount).toBe(2)
    })

    it('contains correct PRODID', () => {
      const ics = generateICS([sampleAppointment])
      expect(ics).toContain('PRODID:-//EvoFit Trainer//Schedule//EN')
    })

    it('contains UID with appointment ID', () => {
      const ics = generateICS([sampleAppointment])
      expect(ics).toContain('UID:appt-123@evofittrainer.app')
    })

    it('maps status correctly', () => {
      const statuses: Record<string, string> = {
        scheduled: 'TENTATIVE',
        confirmed: 'CONFIRMED',
        completed: 'CONFIRMED',
        cancelled: 'CANCELLED',
        no_show: 'CANCELLED',
      }

      for (const [input, expected] of Object.entries(statuses)) {
        const appt = { ...sampleAppointment, status: input }
        const ics = generateICS([appt])
        expect(ics).toContain(`STATUS:${expected}`)
      }
    })

    it('defaults unknown status to TENTATIVE', () => {
      const appt = { ...sampleAppointment, status: 'unknown_status' }
      const ics = generateICS([appt])
      expect(ics).toContain('STATUS:TENTATIVE')
    })

    it('returns valid empty VCALENDAR for empty array', () => {
      const ics = generateICS([])
      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('END:VCALENDAR')
      expect(ics).not.toContain('BEGIN:VEVENT')
    })

    it('handles null description gracefully', () => {
      const appt = { ...sampleAppointment, description: null }
      const ics = generateICS([appt])
      expect(ics).not.toContain('DESCRIPTION:')
    })

    it('handles null location gracefully', () => {
      const appt = { ...sampleAppointment, location: null }
      const ics = generateICS([appt])
      expect(ics).not.toContain('LOCATION:')
    })

    it('uses CRLF line endings', () => {
      const ics = generateICS([sampleAppointment])
      expect(ics).toContain('\r\n')
    })
  })

  describe('generateSingleICS', () => {
    it('wraps single appointment in VCALENDAR', () => {
      const ics = generateSingleICS(sampleAppointment)
      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('END:VCALENDAR')
      expect(ics).toContain('BEGIN:VEVENT')
      expect(ics).toContain('SUMMARY:Training Session')
    })
  })

  describe('formatICalDate', () => {
    it('formats Date object as YYYYMMDDTHHMMSSZ', () => {
      const date = new Date('2026-03-15T10:30:00Z')
      const result = formatICalDate(date)
      expect(result).toBe('20260315T103000Z')
    })

    it('formats string date as YYYYMMDDTHHMMSSZ', () => {
      const result = formatICalDate('2026-03-15T10:30:00Z')
      expect(result).toBe('20260315T103000Z')
    })
  })

  describe('escapeICalText', () => {
    it('escapes commas', () => {
      expect(escapeICalText('Hello, World')).toBe('Hello\\, World')
    })

    it('escapes semicolons', () => {
      expect(escapeICalText('A;B')).toBe('A\\;B')
    })

    it('escapes backslashes', () => {
      expect(escapeICalText('path\\to')).toBe('path\\\\to')
    })

    it('escapes newlines', () => {
      expect(escapeICalText('line1\nline2')).toBe('line1\\nline2')
    })

    it('escapes multiple special characters together', () => {
      expect(escapeICalText('A,B;C\\D\nE')).toBe('A\\,B\\;C\\\\D\\nE')
    })
  })

  describe('foldLine', () => {
    it('returns short lines unchanged', () => {
      const line = 'SHORT LINE'
      expect(foldLine(line)).toBe('SHORT LINE')
    })

    it('folds lines longer than 75 characters', () => {
      const line = 'A'.repeat(100)
      const result = foldLine(line)
      const parts = result.split('\r\n')
      expect(parts[0].length).toBe(75)
      expect(parts[1]).toMatch(/^ /) // continuation lines start with space
    })

    it('does not fold line of exactly 75 characters', () => {
      const line = 'A'.repeat(75)
      expect(foldLine(line)).toBe(line)
    })
  })
})
