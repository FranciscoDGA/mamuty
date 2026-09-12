import { Appointment, Barber, BarberSchedule, BlockedSlot, ClosedDay } from './types';

export interface DisponibilidadeQuery {
  data: string; // ISO format 'YYYY-MM-DD'
  horarioMinimo?: string; // '17:00'
  barberId?: string; // 'barber-1' ou UUID
  serviceDurationMinutes?: number; // padrão 40
}

export interface SlotDisponibilidade {
  horario: string; // '15:00', '16:00'
  disponivel: boolean;
  motivo?: string; // 'Ocupado por outro atendimento', 'Intervalo / Almoço (12h às 14h)', etc.
  barbeirosDisponiveis: { id: string; name: string }[];
}

export interface InfoFuncionamento {
  diaSemana: string;
  abertura: string; // '08:00'
  fechamento: string; // '20:00', '18:00', '12:00'
  fechamentoMinutos: number;
  intervaloInicio: string; // '12:00'
  intervaloFim: string; // '14:00'
  temIntervalo: boolean;
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

/**
 * Retorna as regras de funcionamento oficiais da Barbearia Mamuty para um dia específico.
 * Segunda: até 20h
 * Terça: até 18h
 * Quarta a Sábado: até 20h
 * Domingo: até 12h
 * Intervalo de almoço: 12h às 14h (exceto domingo)
 */
export function getHorarioFuncionamentoDia(dataIso: string): InfoFuncionamento {
  const dateObj = new Date(dataIso + 'T12:00:00');
  const dayOfWeek = dateObj.getDay();

  const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const diaSemana = diasNomes[dayOfWeek];

  if (dayOfWeek === 0) {
    return {
      diaSemana,
      abertura: '08:00',
      fechamento: '12:00',
      fechamentoMinutos: 12 * 60,
      intervaloInicio: '12:00',
      intervaloFim: '12:00',
      temIntervalo: false
    };
  }

  if (dayOfWeek === 2) {
    return {
      diaSemana,
      abertura: '08:00',
      fechamento: '18:00',
      fechamentoMinutos: 18 * 60,
      intervaloInicio: '12:00',
      intervaloFim: '14:00',
      temIntervalo: true
    };
  }

  return {
    diaSemana,
    abertura: '08:00',
    fechamento: '20:00',
    fechamentoMinutos: 20 * 60,
    intervaloInicio: '12:00',
    intervaloFim: '14:00',
    temIntervalo: true
  };
}

/**
 * Verifica se um barbeiro está de folga em uma data específica.
 */
export function isBarberOnDayOff(
  barberId: string,
  dataIso: string,
  barberSchedules: BarberSchedule[]
): boolean {
  const schedule = barberSchedules.find(s => s.barberId === barberId);
  if (!schedule) return false;

  const dateObj = new Date(dataIso + 'T12:00:00');
  const dayOfWeek = dateObj.getDay();

  return schedule.dayOff.includes(dayOfWeek);
}

/**
 * Verifica se um slot de tempo está bloqueado para um barbeiro.
 */
export function isSlotBlocked(
  barberId: string,
  dataIso: string,
  slotMinutes: number,
  slotEndMinutes: number,
  blockedSlots: BlockedSlot[]
): { blocked: boolean; reason?: string } {
  const relevantBlocks = blockedSlots.filter(
    b => b.barberId === barberId && b.date === dataIso
  );

  for (const block of relevantBlocks) {
    const blockStartMinutes = parseInt(block.startTime.split(':')[0]) * 60 + parseInt(block.startTime.split(':')[1]);
    const blockEndMinutes = parseInt(block.endTime.split(':')[0]) * 60 + parseInt(block.endTime.split(':')[1]);

    if (slotMinutes < blockEndMinutes && slotEndMinutes > blockStartMinutes) {
      return {
        blocked: true,
        reason: block.reason || 'Horário bloqueado'
      };
    }
  }

  return { blocked: false };
}

/**
 * Verifica se a barbearia está fechada em uma data específica.
 */
export function isShopClosed(dataIso: string, closedDays: ClosedDay[]): { closed: boolean; reason?: string } {
  const closed = closedDays.find(c => c.date === dataIso);
  if (closed) {
    return { closed: true, reason: closed.reason || 'Barbearia fechada' };
  }
  return { closed: false };
}

/**
 * Gera os próximos 30 dias com indicação de disponibilidade.
 */
export function generateCalendarDays(
  barbers: Barber[],
  appointments: Appointment[],
  barberSchedules: BarberSchedule[],
  blockedSlots: BlockedSlot[],
  closedDays: ClosedDay[],
  serviceDurationMinutes: number = 40
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
    const dayOfWeek = d.getDay();

    const isToday = i === 0;
    const dayName = isToday ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });
    const isSunday = dayOfWeek === 0;

    // Check if shop is closed
    const shopClosed = isShopClosed(iso, closedDays);
    if (shopClosed.closed) {
      days.push({
        iso, dayName, dayNum, monthName, isToday, isSunday,
        isOpen: false, hasAvailability: false,
        closedReason: shopClosed.reason
      });
      continue;
    }

    // Check if any barber is available this day
    let hasAnyAvailability = false;
    const activeBarbers = barbers.filter(b => b.active !== false);

    for (const barber of activeBarbers) {
      // Check day off
      if (isBarberOnDayOff(barber.id, iso, barberSchedules)) continue;

      // Check if shop is open this day for this barber
      const funcionamento = getHorarioFuncionamentoDia(iso);
      if (isSunday && !funcionamento.temIntervalo) {
        // Sunday - limited hours
      }

      // Quick check: is there at least one slot available?
      const startMinutes = 8 * 60;
      const endMinutes = funcionamento.fechamentoMinutos;

      for (let m = startMinutes; m < endMinutes; m += 30) {
        const slotEnd = m + serviceDurationMinutes;
        if (slotEnd > endMinutes) break;

        // Skip lunch
        if (funcionamento.temIntervalo && m < 14 * 60 && slotEnd > 12 * 60) continue;

        // Check blocked
        const blockCheck = isSlotBlocked(barber.id, iso, m, slotEnd, blockedSlots);
        if (blockCheck.blocked) continue;

        // Check appointments
        let hasConflict = false;
        for (const apt of appointments) {
          if (apt.date === iso && apt.barberId === barber.id && apt.status !== 'cancelled') {
            const aptStart = parseInt(apt.time.split(':')[0]) * 60 + parseInt(apt.time.split(':')[1]);
            const aptEnd = aptStart + (apt.totalDurationMinutes || 40);
            if (m < aptEnd && slotEnd > aptStart) {
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
      isOpen: true, hasAvailability: hasAnyAvailability
    });
  }

  return days;
}

/**
 * Motor central de cálculo de disponibilidade da Barbearia Mamuty.
 * Utilizado pelo Wizard de agendamento e consultado pelo Funcionário Digital Marcos.
 */
export function consultarDisponibilidade(
  query: DisponibilidadeQuery,
  appointments: Appointment[],
  barbers: Barber[],
  barberSchedules: BarberSchedule[] = [],
  blockedSlots: BlockedSlot[] = [],
  closedDays: ClosedDay[] = []
): ResultadoDisponibilidade {
  const { data, horarioMinimo = '08:00', barberId, serviceDurationMinutes = 40 } = query;
  const funcionamento = getHorarioFuncionamentoDia(data);

  // Check if shop is closed
  const shopClosed = isShopClosed(data, closedDays);
  if (shopClosed.closed) {
    return {
      data,
      horarioMinimo,
      funcionamento,
      slots: [],
      sugestoesFormatadas: [],
      isClosedDay: true,
      closedDayReason: shopClosed.reason
    };
  }

  // Gerar slots de 30 em 30 min desde a abertura até 30 min antes do fechamento
  const allSlots: string[] = [];
  const startHour = 8;
  const maxHour = Math.floor(funcionamento.fechamentoMinutos / 60);

  for (let h = startHour; h < maxHour; h++) {
    const slot1 = `${h.toString().padStart(2, '0')}:00`;
    const slot1Min = h * 60;
    if (slot1Min < funcionamento.fechamentoMinutos) allSlots.push(slot1);

    const slot2 = `${h.toString().padStart(2, '0')}:30`;
    const slot2Min = h * 60 + 30;
    if (slot2Min < funcionamento.fechamentoMinutos) allSlots.push(slot2);
  }

  const minMinutes = parseInt(horarioMinimo.split(':')[0]) * 60 + parseInt(horarioMinimo.split(':')[1]);
  const lunchStart = 12 * 60;
  const lunchEnd = 14 * 60;

  const targetBarbers = barberId && barberId !== 'all' && barberId !== 'any'
    ? barbers.filter(b => b.id === barberId || b.name.toLowerCase() === barberId.toLowerCase())
    : barbers.filter(b => b.id !== 'any');

  const slots: SlotDisponibilidade[] = [];
  const sugestoesFormatadas: { barberName: string; horario: string }[] = [];

  for (const slot of allSlots) {
    const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
    const slotEndMinutes = slotMinutes + serviceDurationMinutes;

    const isBelowMin = slotMinutes < minMinutes;

    // 1. Regra de Fechamento
    if (slotEndMinutes > funcionamento.fechamentoMinutos) {
      slots.push({
        horario: slot,
        disponivel: false,
        motivo: `Ultrapassa fechamento (${funcionamento.fechamento})`,
        barbeirosDisponiveis: []
      });
      continue;
    }

    // 2. Regra de Intervalo de Almoço
    if (funcionamento.temIntervalo && slotMinutes < lunchEnd && slotEndMinutes > lunchStart) {
      slots.push({
        horario: slot,
        disponivel: false,
        motivo: 'Intervalo / Almoço (12h às 14h)',
        barbeirosDisponiveis: []
      });
      continue;
    }

    // 3. Checar barbeiros livres neste slot
    const barbeirosDisponiveis: { id: string; name: string }[] = [];

    for (const b of targetBarbers) {
      // 3a. Verificar se barbeiro está de folga
      if (isBarberOnDayOff(b.id, data, barberSchedules)) continue;

      // 3b. Verificar se slot está bloqueado
      const blockCheck = isSlotBlocked(b.id, data, slotMinutes, slotEndMinutes, blockedSlots);
      if (blockCheck.blocked) continue;

      let isBusy = false;

      // 3c. Verificar conflito com agendamentos
      for (const apt of appointments) {
        if (
          apt.date === data &&
          (apt.barberId === b.id || apt.barberName.toLowerCase() === b.name.toLowerCase()) &&
          apt.status !== 'cancelled'
        ) {
          const aptStartMinutes = parseInt(apt.time.split(':')[0]) * 60 + parseInt(apt.time.split(':')[1]);
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
      barbeirosDisponiveis
    });

    if (disponivel && !isBelowMin) {
      for (const b of barbeirosDisponiveis) {
        sugestoesFormatadas.push({
          barberName: b.name,
          horario: slot
        });
      }
    }
  }

  return {
    data,
    horarioMinimo,
    funcionamento,
    slots,
    sugestoesFormatadas: sugestoesFormatadas.slice(0, 6)
  };
}
