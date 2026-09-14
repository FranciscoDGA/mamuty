import { describe, it, expect } from 'vitest';
import {
  BUSINESS_HOURS,
  DayOfWeek,
  getDaySchedule,
  isSalonOpen,
  getDayHoursSummary,
  getWeeklyHoursSummary,
  timeToMinutes,
  minutesToTime,
  doesServiceFitInDay,
  crossesLunchBreak,
  generateValidStartTimes,
  getMaxServiceDuration,
} from './businessHours';

// ─── BUSINESS_HOURS structure ────────────────────────────────────────────────

describe('BUSINESS_HOURS', () => {
  it('should have exactly 7 days (0-6)', () => {
    const keys = Object.keys(BUSINESS_HOURS).map(Number);
    expect(keys).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('Sunday (day 0) should have exactly 1 window: 08:00–12:00', () => {
    const sun = BUSINESS_HOURS[0];
    expect(sun.isOpen).toBe(true);
    expect(sun.windows).toHaveLength(1);
    expect(sun.windows[0]).toEqual({ start: '08:00', end: '12:00' });
  });

  it('Monday–Saturday (days 1–6) should each have 2 windows', () => {
    for (let d = 1; d <= 6; d++) {
      const day = BUSINESS_HOURS[d as DayOfWeek];
      expect(day.isOpen).toBe(true);
      expect(day.windows).toHaveLength(2);
      expect(day.windows[0]).toEqual({ start: '08:00', end: '12:00' });
      expect(day.windows[1]).toEqual({ start: '14:00', end: '20:00' });
    }
  });
});

// ─── Helper functions ────────────────────────────────────────────────────────

describe('getDaySchedule', () => {
  it('returns the correct schedule for each day', () => {
    expect(getDaySchedule(0).windows).toHaveLength(1);
    expect(getDaySchedule(1).windows).toHaveLength(2);
    expect(getDaySchedule(6).windows).toHaveLength(2);
  });
});

describe('isSalonOpen', () => {
  it('returns true for all days 0-6', () => {
    for (let d = 0; d <= 6; d++) {
      expect(isSalonOpen(d as DayOfWeek)).toBe(true);
    }
  });
});

describe('getDayHoursSummary', () => {
  it('returns "08:00–12:00" for Sunday', () => {
    expect(getDayHoursSummary(0)).toBe('08:00–12:00');
  });

  it('returns both windows for Monday', () => {
    expect(getDayHoursSummary(1)).toBe('08:00–12:00, 14:00–20:00');
  });
});

describe('getWeeklyHoursSummary', () => {
  it('includes all 7 days', () => {
    const summary = getWeeklyHoursSummary();
    expect(summary).toContain('Seg:');
    expect(summary).toContain('Sáb:');
    expect(summary).toContain('Dom:');
  });
});

describe('timeToMinutes / minutesToTime', () => {
  it('converts "08:00" to 480', () => {
    expect(timeToMinutes('08:00')).toBe(480);
  });

  it('converts "20:00" to 1200', () => {
    expect(timeToMinutes('20:00')).toBe(1200);
  });

  it('converts 480 back to "08:00"', () => {
    expect(minutesToTime(480)).toBe('08:00');
  });

  it('round-trips correctly', () => {
    for (let m = 0; m <= 1440; m += 15) {
      expect(timeToMinutes(minutesToTime(m))).toBe(m);
    }
  });
});

// ─── Service fit validation ──────────────────────────────────────────────────

describe('doesServiceFitInDay', () => {
  it('1h service starting 08:00 on Monday fits', () => {
    expect(doesServiceFitInDay(1, '08:00', '09:00')).toBe(true);
  });

  it('1h service starting 11:30 on Monday does NOT fit (crosses lunch)', () => {
    expect(doesServiceFitInDay(1, '11:30', '12:30')).toBe(false);
  });

  it('1h service starting 14:00 on Monday fits', () => {
    expect(doesServiceFitInDay(1, '14:00', '15:00')).toBe(true);
  });

  it('1h service starting 19:00 on Monday fits', () => {
    expect(doesServiceFitInDay(1, '19:00', '20:00')).toBe(true);
  });

  it('1h service starting 19:30 on Monday does NOT fit (would end 20:30)', () => {
    expect(doesServiceFitInDay(1, '19:30', '20:30')).toBe(false);
  });

  it('1h service starting 11:00 on Sunday fits', () => {
    expect(doesServiceFitInDay(0, '11:00', '12:00')).toBe(true);
  });

  it('1h service starting 11:30 on Sunday does NOT fit (would end 12:30)', () => {
    expect(doesServiceFitInDay(0, '11:30', '12:30')).toBe(false);
  });
});

// ─── Lunch break crossing ────────────────────────────────────────────────────

describe('crossesLunchBreak', () => {
  it('service 11:30–12:30 crosses lunch on Monday', () => {
    expect(crossesLunchBreak(1, '11:30', '12:30')).toBe(true);
  });

  it('service 11:00–12:00 does NOT cross lunch on Monday', () => {
    expect(crossesLunchBreak(1, '11:00', '12:00')).toBe(false);
  });

  it('service 13:30–14:30 crosses lunch on Monday', () => {
    expect(crossesLunchBreak(1, '13:30', '14:30')).toBe(true);
  });

  it('service 14:00–15:00 does NOT cross lunch on Monday', () => {
    expect(crossesLunchBreak(1, '14:00', '15:00')).toBe(false);
  });

  it('Sunday has no lunch break', () => {
    expect(crossesLunchBreak(0, '11:00', '12:00')).toBe(false);
  });
});

// ─── Max service duration ────────────────────────────────────────────────────

describe('getMaxServiceDuration', () => {
  it('returns 240 min (4h) for 08:00 on Monday morning window', () => {
    expect(getMaxServiceDuration(1, '08:00')).toBe(240);
  });

  it('returns 360 min (6h) for 14:00 on Monday afternoon window', () => {
    expect(getMaxServiceDuration(1, '14:00')).toBe(360);
  });

  it('returns 240 min for 08:00 on Sunday', () => {
    expect(getMaxServiceDuration(0, '08:00')).toBe(240);
  });

  it('returns 0 for 13:00 on Monday (lunch)', () => {
    expect(getMaxServiceDuration(1, '13:00')).toBe(0);
  });
});

// ─── Generate valid start times ──────────────────────────────────────────────

describe('generateValidStartTimes', () => {
  it('generates morning slots for a 60min service on Monday (08:00–11:00 step 15)', () => {
    const times = generateValidStartTimes(1, 60, 15);
    // Monday morning window 08:00–12:00: 08:00, 08:15, 08:30, 08:45, 09:00, 09:15, 09:30, 09:45, 10:00, 10:15, 10:30, 10:45, 11:00
    // Monday afternoon window 14:00–20:00: 14:00, ..., 19:00
    // Total: 13 morning + 25 afternoon = 38 slots
    expect(times[0]).toBe('08:00');
    // First window ends at 11:00
    const morningSlots = times.filter(t => timeToMinutes(t) < 720);
    expect(morningSlots[morningSlots.length - 1]).toBe('11:00');
    expect(morningSlots.length).toBe(13);
    // Afternoon slots start at 14:00
    const afternoonSlots = times.filter(t => timeToMinutes(t) >= 840);
    expect(afternoonSlots[0]).toBe('14:00');
  });

  it('generates 5 slots for a 120min service on Sunday', () => {
    // Sunday: 08:00–12:00, 120min service → 08:00, 08:30, 09:00, 09:30, 10:00
    const times = generateValidStartTimes(0, 120, 30);
    expect(times).toEqual(['08:00', '08:30', '09:00', '09:30', '10:00']);
  });

  it('120min service on Monday produces morning and afternoon slots', () => {
    const times = generateValidStartTimes(1, 120, 30);
    // Morning: 08:00, 08:30, 09:00, 09:30, 10:00 (10:00+120=12:00 ✓)
    // Afternoon: 14:00, 14:30, 15:00, 15:30, 16:00, 16:30, 17:00, 17:30, 18:00
    expect(times).toContain('08:00');
    expect(times).toContain('10:00');
    expect(times).not.toContain('10:30'); // 10:30+120=12:30 > 12:00
    expect(times).toContain('14:00');
    expect(times).toContain('18:00');
    expect(times).not.toContain('18:30'); // 18:30+120=20:30 > 20:00
  });
});

// ─── 27 scenario test matrix ─────────────────────────────────────────────────

describe('27-scenario availability matrix', () => {
  const getServiceEnd = (start: string, durationMin: number) => {
    const [h, m] = start.split(':').map(Number);
    const totalMin = h * 60 + m + durationMin;
    return minutesToTime(totalMin);
  };

  const testCases = [
    // [description, dayOfWeek, serviceStart, serviceDuration, expectedFit]
    // Monday tests (dayOfWeek = 1)
    ['60min starting 08:00 Mon', 1, '08:00', 60, true],
    ['60min starting 11:00 Mon', 1, '11:00', 60, true],     // 11:00-12:00 fits
    ['60min starting 11:30 Mon', 1, '11:30', 60, false],    // 11:30-12:30 crosses lunch
    ['60min starting 12:00 Mon', 1, '12:00', 60, false],    // lunch
    ['60min starting 13:00 Mon', 1, '13:00', 60, false],    // lunch
    ['60min starting 14:00 Mon', 1, '14:00', 60, true],
    ['60min starting 19:00 Mon', 1, '19:00', 60, true],     // 19:00-20:00 fits
    ['60min starting 19:30 Mon', 1, '19:30', 60, false],    // 19:30-20:30 > 20:00
    ['60min starting 07:59 Mon', 1, '07:59', 60, false],    // before opening

    // Sunday tests (dayOfWeek = 0)
    ['60min starting 08:00 Sun', 0, '08:00', 60, true],
    ['60min starting 11:00 Sun', 0, '11:00', 60, true],     // 11:00-12:00 fits
    ['60min starting 11:30 Sun', 0, '11:30', 60, false],    // 11:30-12:30 > 12:00
    ['60min starting 12:00 Sun', 0, '12:00', 60, false],    // closed
    ['60min starting 14:00 Sun', 0, '14:00', 60, false],    // closed

    // Saturday tests (dayOfWeek = 6)
    ['60min starting 08:00 Sat', 6, '08:00', 60, true],
    ['60min starting 19:00 Sat', 6, '19:00', 60, true],
    ['60min starting 19:30 Sat', 6, '19:30', 60, false],

    // Combo Completo (60min) edge cases
    ['60min starting 10:00 Mon', 1, '10:00', 60, true],     // 10:00-11:00 fits in morning
    ['60min starting 11:15 Mon', 1, '11:15', 60, false],    // 11:15-12:15 crosses lunch
    ['60min starting 13:45 Mon', 1, '13:45', 60, false],    // 13:45-14:45 crosses lunch start
    ['60min starting 14:15 Mon', 1, '14:15', 60, true],     // fits in afternoon

    // Corte social (30min) edge cases
    ['30min starting 11:30 Mon', 1, '11:30', 30, true],     // 11:30-12:00 fits exactly
    ['30min starting 11:45 Mon', 1, '11:45', 30, false],    // 11:45-12:15 crosses lunch
    ['30min starting 13:45 Mon', 1, '13:45', 30, false],    // 13:45-14:15 crosses lunch end
    ['30min starting 14:00 Mon', 1, '14:00', 30, true],

    // Sunday edge cases
    ['30min starting 11:30 Sun', 0, '11:30', 30, true],     // 11:30-12:00 fits exactly
    ['30min starting 11:45 Sun', 0, '11:45', 30, false],    // 11:45-12:15 > 12:00
  ];

  it.each(testCases)('%s', (_desc, dayOfWeek, start, duration, expected) => {
    const end = getServiceEnd(start as string, duration as number);
    const result = doesServiceFitInDay(dayOfWeek as DayOfWeek, start as string, end);
    expect(result).toBe(expected);
  });
});
