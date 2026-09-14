import {
  Appointment,
  Barber,
  BarberSchedule,
  BlockedSlot,
  ClosedDay,
} from './types';
import {
  BUSINESS_HOURS,
  DayOfWeek,
  TimeWindow,
  getDaySchedule,
  isSalonOpen,
  timeToMinutes,
  minutesToTime,
  doesServiceFitInDay,
  crossesLunchBreak,
} from './businessHours';

// ─── Public types ────────────────────────────────────────────────────────────

export interface DisponibilidadeQuery {
  data: string; // ISO format 'YYYY-MM-DD'
  horarioMinimo?: string; // '17:00'
  barberId?: string; // 'barber-1' ou UUID
  serviceDurationMinutes?: number; // padrão 40
}

export interface SlotDisponibilidade {
  horario: string; // '15:00', '16:00'
  disponivel: boolean;
  motivo?: string;
  barbeirosDisponiveis: { id: string; name: string }[];
}

export interface InfoFuncionamento {
  diaSemana: string;
  windows: TimeWindow[]; // canonical list of open windows
  abertura: string; // first window start (legacy compat)
  fechamento: string; // last window end (legacy compat)
  fechamentoMinutos: number;
  intervaloInicio: string; // '12:00'
  intervaloFim: string; // '14:00'
  temIntervalo: boolean; // true for Mon–Sat, false for Sunday
}

export interface ResultadoDisponibilidade {
  data: string;
  horarioMinimo?: string;
  funcionamento: InfoFuncionamento;
  slots: SlotDisponibilidade[];
  sugestoesFormatadas: { barberName: string; horario: string }[];
  isClosedDay?: boolean;
  closedDayReason?: string;
}

// ─── Core helpers ────────────────────────────────────────────────────────────

const DAY_NAMES = [
  'Domingo', 'Segunda', 'Terça', 'Quarta',
  'Quinta', 'Sexta', 'Sábado',
];

/**
 * Returns the official operating hours for a given date.
 * All data comes from businessHours.ts (SSoT).
 */
export function getHorarioFuncionamentoDia(dataIso: string): InfoFuncionamento {
  const dateObj = new Date(dataIso + 'T12:00:00');
  const dayOfWeek = dateObj.getDay() as DayOfWeek;
  const schedule = getDaySchedule(dayOfWeek);

  const windows = schedule.windows;
  const firstWindow = windows[0];
  const lastWindow = windows[windows.length - 1];

  return {
    diaSemana: DAY_NAMES[dayOfWeek],
    windows,
    abertura: firstWindow.start,
    fechamento: lastWindow.end,
    fechamentoMinutos: timeToMinutes(lastWindow.end),
    intervaloInicio: '12:00',
    intervaloFim: '14:00',
    temIntervalo: dayOfWeek !== 0, // Sunday has no lunch interval
  };
}

/**
 * Checks if a barber is off on a given date.
 */
export function isBarberOnDayOff(
  barberId: string,
  dataIso: string,
  barberSchedules: BarberSchedule[],
): boolean {
  const schedule = barberSchedules.find((s) => s.barberId === barberId);
  if (!schedule) return false;

  const dateObj = new Date(dataIso + 'T12:00:00');
  const dayOfWeek = dateObj.getDay();

  return schedule.dayOff.includes(dayOfWeek);
}

/**
 * Checks if a slot is blocked for a barber.
 */
export function isSlotBlocked(
  barberId: string,
  dataIso: string,
  slotMinutes: number,
  slotEndMinutes: number,
  blockedSlots: BlockedSlot[],
): { blocked: boolean; reason?: string } {
  const relevantBlocks = blockedSlots.filter(
    (b) => b.barberId === barberId && b.date === dataIso,
  );

  for (const block of relevantBlocks) {
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);

    if (slotMinutes < blockEnd && slotEndMinutes > blockStart) {
      return { blocked: true, reason: block.reason || 'Horário bloqueado' };
    }
  }

  return { blocked: false };
}

/**
 * Checks if the shop is closed on a specific date.
 */
export function isShopClosed(
  dataIso: string,
  closedDays: ClosedDay[],
): { closed: boolean; reason?: string } {
  const closed = closedDays.find((c) => c.date === dataIso);
  if (closed) {
    return { closed: true, reason: closed.reason || 'Barbearia fechada' };
  }
  return { closed: false };
}

// ─── Slot generation using windows ───────────────────────────────────────────

/**
 * Generate candidate time slots that fit entirely within any working window
 * for the given day of week and service duration.
 *
 * Sunday: only one window (08:00–12:00)
 * Mon–Sat: two windows (08:00–12:00, 14:00–20:00)
 */
function generateCandidateSlots(
  dayOfWeek: DayOfWeek,
  serviceDurationMinutes: number,
  stepMinutes: number = 30,
): string[] {
  const schedule = getDaySchedule(dayOfWeek);
  if (!schedule.isOpen) return [];

  const slots: string[] = [];

  for (const window of schedule.windows) {
    const windowStart = timeToMinutes(window.start);
    const windowEnd = timeToMinutes(window.end);

    for (
      let t = windowStart;
      t + serviceDurationMinutes <= windowEnd;
      t += stepMinutes
    ) {
      slots.push(minutesToTime(t));
    }
  }

  return slots;
}

// ─── Calendar generator ──────────────────────────────────────────────────────

/**
 * Generates the next 30 days with availability indicators.
 */
export function generateCalendarDays(
  barbers: Barber[],
  appointments: Appointment[],
  barberSchedules: BarberSchedule[],
  blockedSlots: BlockedSlot[],
  closedDays: ClosedDay[],
  serviceDurationMinutes: number = 40,
): {
  iso: string;
  dayName: string;
  dayNum: number;
  monthName: string;
  isToday: boolean;
  isSunday: boolean;
  isOpen: boolean;
  hasAvailability: boolean;
  closedReason?: string;
}[] {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay() as DayOfWeek;

    const isToday = i === 0;
    const dayName = isToday
      ? 'Hoje'
      : i === 1
        ? 'Amanhã'
        : d.toLocaleDateString('pt-BR', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });
    const isSunday = dayOfWeek === 0;

    // Check if shop is closed
    const shopClosed = isShopClosed(iso, closedDays);
    if (shopClosed.closed) {
      days.push({
        iso, dayName, dayNum, monthName, isToday, isSunday,
        isOpen: false, hasAvailability: false,
        closedReason: shopClosed.reason,
      });
      continue;
    }

    // Check if shop is open this day at all
    if (!isSalonOpen(dayOfWeek)) {
      days.push({
        iso, dayName, dayNum, monthName, isToday, isSunday,
        isOpen: false, hasAvailability: false,
        closedReason: 'Barbearia fechada',
      });
      continue;
    }

    // Check if any barber is available this day
    let hasAnyAvailability = false;
    const activeBarbers = barbers.filter((b) => b.active !== false);
    const candidateSlots = generateCandidateSlots(dayOfWeek, serviceDurationMinutes);

    for (const barber of activeBarbers) {
      if (isBarberOnDayOff(barber.id, iso, barberSchedules)) continue;

      for (const slot of candidateSlots) {
        const slotMinutes = timeToMinutes(slot);
        const slotEndMinutes = slotMinutes + serviceDurationMinutes;

        const blockCheck = isSlotBlocked(barber.id, iso, slotMinutes, slotEndMinutes, blockedSlots);
        if (blockCheck.blocked) continue;

        let hasConflict = false;
        for (const apt of appointments) {
          if (apt.date === iso && apt.barberId === barber.id && apt.status !== 'cancelled') {
            const aptStart = timeToMinutes(apt.time);
            const aptEnd = aptStart + (apt.totalDurationMinutes || 40);
            if (slotMinutes < aptEnd && slotEndMinutes > aptStart) {
              hasConflict = true;
              break;
            }
          }
        }

        if (!hasConflict) {
          hasAnyAvailability = true;
          break;
        }
      }

      if (hasAnyAvailability) break;
    }

    days.push({
      iso, dayName, dayNum, monthName, isToday, isSunday,
      isOpen: true, hasAvailability: hasAnyAvailability,
    });
  }

  return days;
}

// ─── Main availability engine ────────────────────────────────────────────────

/**
 * Central availability engine for Barbearia Mamuty.
 * Used by the Booking Wizard and queried by the Digital Employee Alfred.
 */
export function consultarDisponibilidade(
  query: DisponibilidadeQuery,
  appointments: Appointment[],
  barbers: Barber[],
  barberSchedules: BarberSchedule[] = [],
  blockedSlots: BlockedSlot[] = [],
  closedDays: ClosedDay[] = [],
): ResultadoDisponibilidade {
  const { data, horarioMinimo = '08:00', barberId, serviceDurationMinutes = 40 } = query;
  const funcionamento = getHorarioFuncionamentoDia(data);
  const dayOfWeek = new Date(data + 'T12:00:00').getDay() as DayOfWeek;

  // Check if shop is closed on this date
  const shopClosed = isShopClosed(data, closedDays);
  if (shopClosed.closed) {
    return {
      data,
      horarioMinimo,
      funcionamento,
      slots: [],
      sugestoesFormatadas: [],
      isClosedDay: true,
      closedDayReason: shopClosed.reason,
    };
  }

  // Check if salon is open on this day of week
  if (!isSalonOpen(dayOfWeek)) {
    return {
      data,
      horarioMinimo,
      funcionamento,
      slots: [],
      sugestoesFormatadas: [],
      isClosedDay: true,
      closedDayReason: 'Barbearia fechada',
    };
  }

  // Generate candidate slots using the SSoT windows
  const candidateSlots = generateCandidateSlots(dayOfWeek, serviceDurationMinutes);
  const minMinutes = timeToMinutes(horarioMinimo);

  const targetBarbers =
    barberId && barberId !== 'all' && barberId !== 'any'
      ? barbers.filter(
          (b) => b.id === barberId || b.name.toLowerCase() === barberId.toLowerCase(),
        )
      : barbers.filter((b) => b.id !== 'any');

  const slots: SlotDisponibilidade[] = [];
  const sugestoesFormatadas: { barberName: string; horario: string }[] = [];

  for (const slot of candidateSlots) {
    const slotMinutes = timeToMinutes(slot);
    const slotEndMinutes = slotMinutes + serviceDurationMinutes;
    const isBelowMin = slotMinutes < minMinutes;

    // Check barbers for this slot
    const barbeirosDisponiveis: { id: string; name: string }[] = [];

    for (const b of targetBarbers) {
      if (isBarberOnDayOff(b.id, data, barberSchedules)) continue;

      const blockCheck = isSlotBlocked(b.id, data, slotMinutes, slotEndMinutes, blockedSlots);
      if (blockCheck.blocked) continue;

      let isBusy = false;
      for (const apt of appointments) {
        if (
          apt.date === data &&
          (apt.barberId === b.id || apt.barberName.toLowerCase() === b.name.toLowerCase()) &&
          apt.status !== 'cancelled'
        ) {
          const aptStartMinutes = timeToMinutes(apt.time);
          const aptEndMinutes = aptStartMinutes + (apt.totalDurationMinutes || 40);

          if (slotMinutes < aptEndMinutes && slotEndMinutes > aptStartMinutes) {
            isBusy = true;
            break;
          }
        }
      }

      if (!isBusy) {
        barbeirosDisponiveis.push({ id: b.id, name: b.name });
      }
    }

    const disponivel = barbeirosDisponiveis.length > 0;

    slots.push({
      horario: slot,
      disponivel,
      motivo: !disponivel ? 'Ocupado por outro atendimento' : undefined,
      barbeirosDisponiveis,
    });

    if (disponivel && !isBelowMin) {
      for (const b of barbeirosDisponiveis) {
        sugestoesFormatadas.push({ barberName: b.name, horario: slot });
      }
    }
  }

  return {
    data,
    horarioMinimo,
    funcionamento,
    slots,
    sugestoesFormatadas: sugestoesFormatadas.slice(0, 6),
  };
}
