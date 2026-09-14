// =============================================================================
// businessHours.ts — SINGLE SOURCE OF TRUTH (SSoT) for Mamuty business hours
// =============================================================================
// OFFICIAL hours (2026-09-14):
//   Seg-Sáb: Manhã 08:00–12:00 | Almoço 12:00–14:00 (FECHADO) | Tarde 14:00–20:00
//   Domingo: 08:00–12:00 only. 12:00 em diante = FECHADO (não há expediente à tarde)
//
// RULES:
//   - Service must be FULLY CONTAINED within a single working block
//   - Service cannot start before opening or end after closing
//   - Service cannot cross lunch break (12:00–14:00)
//   - Sunday has no afternoon block — no service may start or end after 12:00
//   - Holiday: same price + 10% (system calculates)
//   - Tolerance: 10 minutes after scheduled time, then cancel + release slot
// =============================================================================

export interface TimeWindow {
  start: string // "HH:MM" format
  end: string   // "HH:MM" format
}

export interface DaySchedule {
  isOpen: boolean
  windows: TimeWindow[]
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=Sunday, 1=Monday, ..., 6=Saturday

export const BUSINESS_HOURS: Record<DayOfWeek, DaySchedule> = {
  // Domingo — 08:00–12:00 only, no afternoon
  0: {
    isOpen: true,
    windows: [{ start: '08:00', end: '12:00' }],
  },
  // Segunda — 08:00–12:00, 14:00–20:00
  1: {
    isOpen: true,
    windows: [
      { start: '08:00', end: '12:00' },
      { start: '14:00', end: '20:00' },
    ],
  },
  // Terça — 08:00–12:00, 14:00–20:00
  2: {
    isOpen: true,
    windows: [
      { start: '08:00', end: '12:00' },
      { start: '14:00', end: '20:00' },
    ],
  },
  // Quarta — 08:00–12:00, 14:00–20:00
  3: {
    isOpen: true,
    windows: [
      { start: '08:00', end: '12:00' },
      { start: '14:00', end: '20:00' },
    ],
  },
  // Quinta — 08:00–12:00, 14:00–20:00
  4: {
    isOpen: true,
    windows: [
      { start: '08:00', end: '12:00' },
      { start: '14:00', end: '20:00' },
    ],
  },
  // Sexta — 08:00–12:00, 14:00–20:00
  5: {
    isOpen: true,
    windows: [
      { start: '08:00', end: '12:00' },
      { start: '14:00', end: '20:00' },
    ],
  },
  // Sábado — 08:00–12:00, 14:00–20:00
  6: {
    isOpen: true,
    windows: [
      { start: '08:00', end: '12:00' },
      { start: '14:00', end: '20:00' },
    ],
  },
}

// Map day numbers to Portuguese names
export const DAY_NAMES_PT: Record<DayOfWeek, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
}

// Map day numbers to short abbreviations
export const DAY_ABBREV_PT: Record<DayOfWeek, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
}

// Helper: get the schedule for a specific day of week (0=Sun, 1=Mon, ...)
export function getDaySchedule(dayOfWeek: DayOfWeek): DaySchedule {
  return BUSINESS_HOURS[dayOfWeek]
}

// Helper: check if salon is open on a given day
export function isSalonOpen(dayOfWeek: DayOfWeek): boolean {
  return BUSINESS_HOURS[dayOfWeek].isOpen
}

// Helper: get opening hours summary for a specific day (for display)
export function getDayHoursSummary(dayOfWeek: DayOfWeek): string {
  const schedule = BUSINESS_HOURS[dayOfWeek]
  if (!schedule.isOpen) return 'Fechado'
  return schedule.windows.map((w) => `${w.start}–${w.end}`).join(', ')
}

// Helper: get full weekly hours summary (for Alfred/knowledge base)
export function getWeeklyHoursSummary(): string {
  const lines: string[] = []
  for (let d = 1; d <= 6; d++) {
    // Mon-Sat
    const day = d as DayOfWeek
    lines.push(`${DAY_ABBREV_PT[day]}: ${getDayHoursSummary(day)}`)
  }
  lines.push(`${DAY_ABBREV_PT[0]}: ${getDayHoursSummary(0)}`) // Sunday
  return lines.join('\n')
}

// Helper: get lunch break hours (Mon-Sat only)
export function getLunchBreak(): TimeWindow | null {
  // Lunch only exists on days with 2 windows (Mon-Sat)
  // It's the gap between window[0].end and window[1].start
  return { start: '12:00', end: '14:00' }
}

// Helper: check if a time falls within a specific window
export function isTimeInWindow(time: string, window: TimeWindow): boolean {
  return time >= window.start && time < window.end
}

// Helper: check if a service fits entirely within any window of a given day
export function doesServiceFitInDay(
  dayOfWeek: DayOfWeek,
  serviceStart: string,
  serviceEnd: string,
): boolean {
  const schedule = BUSINESS_HOURS[dayOfWeek]
  if (!schedule.isOpen) return false

  return schedule.windows.some(
    (window) => serviceStart >= window.start && serviceEnd <= window.end,
  )
}

// Helper: get the maximum service duration (in minutes) that can start at a given time on a given day
// Returns 0 if the service cannot start at that time
export function getMaxServiceDuration(dayOfWeek: DayOfWeek, startTime: string): number {
  const schedule = BUSINESS_HOURS[dayOfWeek]
  if (!schedule.isOpen) return 0

  for (const window of schedule.windows) {
    if (startTime >= window.start && startTime < window.end) {
      // Calculate minutes from start to window end
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = window.end.split(':').map(Number)
      return (endH * 60 + endM) - (startH * 60 + startM)
    }
  }
  return 0
}

// Helper: check if a service crosses lunch break (Mon-Sat)
export function crossesLunchBreak(
  dayOfWeek: DayOfWeek,
  serviceStart: string,
  serviceEnd: string,
): boolean {
  // Sunday has no lunch break (only one window)
  if (dayOfWeek === 0) return false

  const lunch = getLunchBreak()
  if (!lunch) return false

  // Service crosses lunch if it starts before lunch ends AND ends after lunch starts
  return serviceStart < lunch.end && serviceEnd > lunch.start
}

// Helper: parse "HH:MM" to minutes since midnight
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Helper: minutes since midnight to "HH:MM"
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Helper: generate all valid start times for a service duration on a given day
// Returns times that allow the service to be fully contained within a single window
export function generateValidStartTimes(
  dayOfWeek: DayOfWeek,
  serviceDurationMinutes: number,
  stepMinutes: number = 15,
): string[] {
  const schedule = BUSINESS_HOURS[dayOfWeek]
  if (!schedule.isOpen) return []

  const validTimes: string[] = []

  for (const window of schedule.windows) {
    const windowStart = timeToMinutes(window.start)
    const windowEnd = timeToMinutes(window.end)

    for (let t = windowStart; t + serviceDurationMinutes <= windowEnd; t += stepMinutes) {
      validTimes.push(minutesToTime(t))
    }
  }

  return validTimes
}
