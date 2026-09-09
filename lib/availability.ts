import { Appointment, Barber } from './types';

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
  // Garantir timezone neutro ao analisar a data YYYY-MM-DD
  const dateObj = new Date(dataIso + 'T12:00:00');
  const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça, ..., 6 = Sábado

  const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const diaSemana = diasNomes[dayOfWeek];

  if (dayOfWeek === 0) {
    // Domingo
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
    // Terça-feira
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

  // Segunda, Quarta, Quinta, Sexta, Sábado
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
 * Motor central de cálculo de disponibilidade da Barbearia Mamuty.
 * Utilizado pelo Wizard de agendamento e consultado pelo Funcionário Digital Marcos.
 */
export function consultarDisponibilidade(
  query: DisponibilidadeQuery,
  appointments: Appointment[],
  barbers: Barber[]
): ResultadoDisponibilidade {
  const { data, horarioMinimo = '08:00', barberId, serviceDurationMinutes = 40 } = query;
  const funcionamento = getHorarioFuncionamentoDia(data);

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
  const lunchEnd = 14 * 60; // 12h às 14h

  const targetBarbers = barberId && barberId !== 'all' && barberId !== 'any'
    ? barbers.filter(b => b.id === barberId || b.name.toLowerCase() === barberId.toLowerCase())
    : barbers.filter(b => b.id !== 'any');

  const slots: SlotDisponibilidade[] = [];
  const sugestoesFormatadas: { barberName: string; horario: string }[] = [];

  for (const slot of allSlots) {
    const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
    const slotEndMinutes = slotMinutes + serviceDurationMinutes;

    // Se estiver antes do horário mínimo solicitado, apenas para fins de sugestão
    const isBelowMin = slotMinutes < minMinutes;

    // 1. Regra de Fechamento: o atendimento não pode ultrapassar o horário de término do dia
    if (slotEndMinutes > funcionamento.fechamentoMinutos) {
      slots.push({
        horario: slot,
        disponivel: false,
        motivo: `Ultrapassa fechamento (${funcionamento.fechamento})`,
        barbeirosDisponiveis: []
      });
      continue;
    }

    // 2. Regra de Intervalo de Almoço (12h às 14h): nenhum atendimento pode invadir esse período
    // Ex: 11:30 com 50 min terminaria 12:20 -> BLOQUEADO
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
      let isBusy = false;

      for (const apt of appointments) {
        if (
          apt.date === data &&
          (apt.barberId === b.id || apt.barberName.toLowerCase() === b.name.toLowerCase()) &&
          apt.status !== 'cancelled'
        ) {
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

    // Se disponível e atende o horário mínimo, adiciona nas sugestões do Marcos
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
