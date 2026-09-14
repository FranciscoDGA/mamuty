import { Appointment, SalonConfig } from './types';

export type WhatsAppMessageType =
  | 'cliente'
  | 'barbearia'
  | 'lembrete'
  | 'lembrete_24h'
  | 'lembrete_2h'
  | 'lembrete_15m';

const GOOGLE_MAPS_LINK = 'https://maps.google.com/?q=-9.2023,-50.7712';
const PONTO_REFERENCIA = 'Posto de Gasolina — Cumaru do Norte - PA';

export function formatWhatsAppMessage(
  appointment: Appointment,
  config: SalonConfig,
  type: WhatsAppMessageType = 'cliente'
): string {
  const dataFormatada = new Date(appointment.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const paymentDesc =
    appointment.paymentMethod === 'pix'
      ? 'PIX (Instantâneo)'
      : appointment.paymentMethod === 'cartao' || appointment.paymentMethod === 'credito' || appointment.paymentMethod === 'debito'
      ? 'Cartão de Crédito/Débito'
      : 'Pagamento Presencial no Local';

  const paymentStatusDesc =
    appointment.paymentStatus === 'pago' ? '✅ Pago' : '⏳ Pagamento no balcão';

  const endereco = config.address || 'Av. das Nações, Centro, Cumaru do Norte - PA';

  // 1. Template de Confirmação do Cliente
  if (type === 'cliente') {
    return (
      `💈 *MAMUTY BARBEARIA & SALÃO MASCULINO* 💈\n\n` +
      `Olá, *${appointment.customerName}*! Seu agendamento foi *CONFIRMADO* no sistema com sucesso!\n\n` +
      `📋 *DETALHES DO ATENDIMENTO:*\n` +
      `✂️ *Serviço:* ${appointment.serviceNames.join(', ')}\n` +
      `👤 *Profissional:* ${appointment.barberName}\n` +
      `📅 *Data:* ${dataFormatada}\n` +
      `⏰ *Horário:* ${appointment.time}\n` +
      `⏱️ *Duração estimada:* ${appointment.totalDurationMinutes} min\n` +
      `💰 *Valor Total:* R$ ${appointment.totalPrice.toFixed(2).replace('.', ',')}\n` +
      `💳 *Forma de Pagamento:* ${paymentDesc} (${paymentStatusDesc})\n\n` +
      `📍 *Localização:* ${endereco}\n` +
      `📌 *Ponto de Referência:* ${PONTO_REFERENCIA}\n` +
      `🗺️ *Google Maps:* ${GOOGLE_MAPS_LINK}\n\n` +
      `⚠️ *REGRAS DE ATENDIMENTO E TOLERÂNCIA:*\n` +
      `• *Tolerância máxima:* Rigorosamente *10 minutos*. Por respeito ao próximo cliente, atrasos superiores a 10 min cancelam o horário automaticamente.\n` +
      `• *Reagendamento ou cancelamento:* Caso precise alterar, avise com antecedência pelo WhatsApp ou app.\n\n` +
      `☕ Cerveja artesanal gelada e café especial por nossa conta enquanto você aguarda!\n\n` +
      `_Agradecemos a preferência e te esperamos na cadeira!_ 👊💈`
    );
  }

  // 2. Bibe 1 — 24 horas antes
  if (type === 'lembrete_24h') {
    return (
      `🔔 *1º BIBE: SEU HORÁRIO É AMANHÃ!* — MAMUTY BARBEARIA 💈\n\n` +
      `Fala, *${appointment.customerName}*! Tudo bem?\n\n` +
      `Passando para lembrar que você tem horário marcado conosco *amanhã*:\n\n` +
      `📅 *Data:* ${dataFormatada}\n` +
      `⏰ *Horário:* ${appointment.time}\n` +
      `✂️ *Profissional:* ${appointment.barberName}\n` +
      `💈 *Serviço:* ${appointment.serviceNames.join(', ')}\n\n` +
      `📍 *Local:* ${endereco} (${PONTO_REFERENCIA})\n` +
      `🗺️ *Mapa:* ${GOOGLE_MAPS_LINK}\n\n` +
      `Lembrando que nossa tolerância é de *10 minutos*. Se precisar reagendar, nos avise com antecedência!`
    );
  }

  // 3. Bibe 2 — 2 horas antes
  if (type === 'lembrete_2h') {
    return (
      `⏰ *2º BIBE: SEU HORÁRIO É DAQUI A POUCO!* — MAMUTY BARBEARIA 💈\n\n` +
      `Fala, *${appointment.customerName}*! Seu atendimento é hoje, daqui a aproximadamente 2 horas!\n\n` +
      `⏰ *Horário Marcado:* ${appointment.time}\n` +
      `✂️ *Com:* ${appointment.barberName}\n` +
      `💈 *Serviço:* ${appointment.serviceNames.join(', ')}\n\n` +
      `📍 *Endereço:* ${endereco}\n` +
      `📌 *Referência:* ${PONTO_REFERENCIA}\n\n` +
      `Cerveja gelada te esperando. Já vai se organizando para não se atrasar!`
    );
  }

  // 4. Bibe 3 — 15 minutos antes (Alerta Crítico com Tolerância de 10 min)
  if (type === 'lembrete_15m' || type === 'lembrete') {
    return (
      `🚨 *3º BIBE: ÚLTIMO AVISO DE HORÁRIO!* — MAMUTY BARBEARIA 🚨\n\n` +
      `*${appointment.customerName}*, seu atendimento começa em *15 minutos*!\n\n` +
      `⏰ *Horário:* às *${appointment.time}*\n` +
      `✂️ *Profissional na cadeira:* ${appointment.barberName}\n` +
      `💈 *Serviço:* ${appointment.serviceNames.join(', ')}\n\n` +
      `⚠️ *ATENÇÃO À TOLERÂNCIA DE 10 MINUTOS:*\n` +
      `Para garantir a pontualidade de toda a agenda, a tolerância de espera é de no máximo *10 minutos* (${appointment.time} + 10 min). Após esse período, o sistema libera a vaga para outro cliente.\n\n` +
      `📍 *Local:* ${endereco}\n` +
      `🗺️ *Como Chegar:* ${GOOGLE_MAPS_LINK}\n\n` +
      `A navalha já está pronta. Estamos te aguardando!`
    );
  }

  // 5. Notificação para o Salão / Barbeiro
  return (
    `🚨 *NOVO AGENDAMENTO NO MAMUTY* 🚨\n\n` +
    `👤 *Cliente:* ${appointment.customerName}\n` +
    `📱 *WhatsApp:* ${appointment.customerPhone}\n` +
    `✂️ *Barbeiro:* ${appointment.barberName}\n` +
    `📅 *Data:* ${dataFormatada} às *${appointment.time}*\n` +
    `💈 *Serviços:* ${appointment.serviceNames.join(', ')}\n` +
    `💰 *Valor:* R$ ${appointment.totalPrice.toFixed(2).replace('.', ',')}\n` +
    `💳 *Status Pgto:* ${paymentStatusDesc}\n` +
    (appointment.notes ? `📝 *Observação:* ${appointment.notes}\n` : '') +
    `\n_Favor conferir na escala do painel administrativo._`
  );
}

export function generateWhatsAppUrl(phone: string, message: string): string {
  // Limpa o telefone para conter apenas dígitos
  const cleanPhone = phone.replace(/\D/g, '');
  // Adiciona o DDI 55 do Brasil se não estiver presente
  const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
}
