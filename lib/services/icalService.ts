export interface ICalAppointment {
  id: string
  title: string
  description?: string | null
  location?: string | null
  startDatetime: Date | string
  endDatetime: Date | string
  status: string
}

export function generateICS(appointments: ICalAppointment[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EvoFit Trainer//Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:EvoFit Training Schedule',
  ]

  for (const appt of appointments) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${appt.id}@evofittrainer.app`)
    lines.push(`DTSTART:${formatICalDate(appt.startDatetime)}`)
    lines.push(`DTEND:${formatICalDate(appt.endDatetime)}`)
    lines.push(`SUMMARY:${escapeICalText(appt.title)}`)
    if (appt.description) lines.push(`DESCRIPTION:${escapeICalText(appt.description)}`)
    if (appt.location) lines.push(`LOCATION:${escapeICalText(appt.location)}`)
    lines.push(`STATUS:${mapStatus(appt.status)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n')
}

export function generateSingleICS(appointment: ICalAppointment): string {
  return generateICS([appointment])
}

export function formatICalDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function escapeICalText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'TENTATIVE',
    confirmed: 'CONFIRMED',
    completed: 'CONFIRMED',
    cancelled: 'CANCELLED',
    no_show: 'CANCELLED',
  }
  return map[status] || 'TENTATIVE'
}

export function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts = [line.slice(0, 75)]
  let i = 75
  while (i < line.length) {
    parts.push(' ' + line.slice(i, i + 74))
    i += 74
  }
  return parts.join('\r\n')
}
