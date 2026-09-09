import { Appointment, Barber } from './types';

export interface DisponibilidadeQuery {
  data: string; // ISO format 'YYYY-MM-DD'
  horarioMinimo?: string; // '17:00'
  barberId?: string; // 'barber-1' ou 'barber-2'
  serviceDurationMinutes?: number; // padrão 40
}

export interface SlotDisponibilidade {
  horario: string; // '15:00', '16:00'
  disponivel: boolean;
  motivo?: string; // 'Ocupado por outro atendimento', 'Almoço', etc.
  barbeirosDisponiveis: { id: string; name: string }[];
}

export interface ResultadoDisponibilidade {
  data: string;
  horarioMinimo?: string;
  slots: SlotDisponibilidade[];
  sugestoesFormatadas: { barberName: string; horario: string }[];
}

/**
 * Motor central de cálculo de disponibilidade da Barbearia Mamuty.
 * Utilizado pelo Wizard de agendamento e consultado pelo Funcionário Digital Marcos.
 */
export function consultarDisponibilidade(
  query: DisponibilidadeQuery,
  appointments: Appointment[],
  barbers: Barber[]
): ResultadoDisponibilidade {
  const { data, horarioMinimo = '08:00', barberId, serviceDurationMinutes = 40 } = query;

  // Gerar slots de 30 em 30 min das 08:00 às 18:30
  const allSlots: string[] = [];
  for (let h = 8; h <= 18; h++) {
    allSlots.push(`${h.toString().padStart(2, '0')}:00`);
    allSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  const minMinutes = parseInt(horarioMinimo.split(':')[0]) * 60 + parseInt(horarioMinimo.split(':')[1]);
  const lunchStart = 12 * 60;
  const lunchEnd = 13 * 60;

  const targetBarbers = barberId && barberId !== 'all' && barberId !== 'any'
    ? barbers.filter(b => b.id === barberId)
    : barbers.filter(b => b.id !== 'any');

  const slots: SlotDisponibilidade[] = [];
  const sugestoesFormatadas: { barberName: string; horario: string }[] = [];

  for (const slot of allSlots) {
    const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
    const slotEndMinutes = slotMinutes + serviceDurationMinutes;

    // Se estiver antes do horário mínimo solicitado, pula se filtro estrito
    const isBelowMin = slotMinutes < minMinutes;

    // Intervalo de almoço da barbearia (12h às 13h)
    if (slotMinutes < lunchEnd && slotEndMinutes > lunchStart) {
      slots.push({
        horario: slot,
        disponivel: false,
        motivo: 'Horário de intervalo / almoço',
        barbeirosDisponiveis: []
      });
      continue;
    }

    // Checar barbeiros livres neste slot
    const barbeirosDisponiveis: { id: string; name: string }[] = [];

    for (const b of targetBarbers) {
      let isBusy = false;

      for (const apt of appointments) {
        if (apt.date === data && apt.barberId === b.id && apt.status !== 'cancelled') {
          const aptStartMinutes = parseInt(apt.time.split(':')[0]) * 60 + parseInt(apt.time.split(':')[1]);
          const aptEndMinutes = aptStartMinutes + (apt.totalDurationMinutes || 40);

          // Conflito de sobreposição
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

    // Se atende ao horário mínimo e está disponível, adiciona às sugestões
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
    slots,
    sugestoesFormatadas: sugestoesFormatadas.slice(0, 5) // primeiras 5 sugestões
  };
}
