import { Appointment, Barber, Customer, PaymentMethod, Service } from '../types';
import { consultarDisponibilidade, getHorarioFuncionamentoDia, ResultadoDisponibilidade } from '../availability';
import { BookingDraft } from './types';

/**
 * Consulta serviços cadastrados no Supabase para resposta conversacional.
 */
export function consultar_servicos(services: Service[]): { texto: string; services: Service[] } {
  const ativos = services.filter(s => s.id);
  let texto = '💈 *Nossos Serviços Oficiais na Barbearia Mamuty:*\n\n';

  ativos.forEach(s => {
    texto += `✂️ *${s.name}* — R$ ${s.price}\n⏱️ ${s.durationMinutes} min\n\n`;
  });

  texto += '~Mamuty barbearia estilo forte. 👊';

  return { texto, services: ativos };
}

/**
 * Consulta informações oficiais de funcionamento da Mamuty.
 */
export function consultar_funcionamento(dataIso?: string): string {
  const targetDate = dataIso || new Date().toISOString().split('T')[0];
  const info = getHorarioFuncionamentoDia(targetDate);

  let texto = `Sim! Estamos funcionando hoje (${info.diaSemana}). 💈\n\n`;
  texto += `⏰ *Horário de hoje:* 08:00 às ${info.fechamento}\n`;
  if (info.temIntervalo) {
    texto += `🔒 *Intervalo de almoço:* 12:00 às 14:00\n`;
  }
  texto += `\n*Funcionamento semanal:*\n`;
  texto += `• Segunda a Sábado: até 20:00 (Terça até 18:00)\n`;
  texto += `• Domingo: 08:00 às 12:00\n`;
  texto += `• Intervalo: 12h às 14h\n\n`;
  texto += `Posso verificar os horários disponíveis para você agora! 👇`;

  return texto;
}

/**
 * Consulta a disponibilidade real de vagas consultando o motor central.
 */
export function consultar_disponibilidade_acao(
  dataIso: string,
  appointments: Appointment[],
  barbers: Barber[],
  serviceDurationMinutes = 40,
  barberId?: string
): ResultadoDisponibilidade {
  return consultarDisponibilidade(
    {
      data: dataIso,
      barberId,
      serviceDurationMinutes
    },
    appointments,
    barbers
  );
}

/**
 * Formata sugestões de vagas encontradas para o WhatsApp.
 */
export function formatar_vagas_whatsapp(
  res: ResultadoDisponibilidade,
  dataTexto = 'Hoje'
): string {
  const livres = res.slots.filter(s => s.disponivel);

  if (livres.length === 0) {
    return `Poxa, para ${dataTexto} não encontrei horários livres no momento. Quer conferir para amanhã? 💈`;
  }

  let texto = `Encontrei estes horários para ${dataTexto}: 👇\n\n`;
  livres.slice(0, 8).forEach(slot => {
    const barbeiros = slot.barbeirosDisponiveis.map(b => b.name).join(' ou ');
    texto += `🕐 *${slot.horario}* — ${barbeiros || 'Disponível'}\n`;
  });

  return texto;
}

/**
 * Informações de endereço e formas de pagamento.
 */
export function consultar_informacoes_gerais(): string {
  return `📍 *Endereço da Mamuty Barbearia:*\nAv. das Nações, Centro, Cumaru do Norte - PA, CEP 68398-000\n\n💳 *Formas de Pagamento Aceitas:*\n• PIX\n• Dinheiro\n• Cartão de Débito\n• Cartão de Crédito\n\n~Mamuty barbearia estilo forte. 💈`;
}
