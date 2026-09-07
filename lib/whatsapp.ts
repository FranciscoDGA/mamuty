import { Appointment, SalonConfig } from './types';

export function formatWhatsAppMessage(appointment: Appointment, config: SalonConfig, type: 'cliente' | 'barbearia' | 'lembrete' = 'cliente'): string {
  const dataFormatada = new Date(appointment.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const paymentDesc =
    appointment.paymentMethod === 'pix'
      ? 'PIX (Integrado)'
      : appointment.paymentMethod === 'cartao'
      ? 'Cartão de Crédito/Débito'
      : 'Pagamento no Local';

  const paymentStatusDesc =
    appointment.paymentStatus === 'pago' ? '✅ Pago' : '⏳ Pagamento no balcão';

  if (type === 'cliente') {
    return (
      `*MAMUTY BARBEARIA & SALÃO MASCULINO* 💈\n\n` +
      `Olá, *${appointment.customerName}*! Seu agendamento foi *CONFIRMADO* com sucesso!\n\n` +
      `📅 *Data:* ${dataFormatada}\n` +
      `⏰ *Horário:* ${appointment.time}\n` +
      `✂️ *Profissional:* ${appointment.barberName}\n` +
      `💈 *Serviço(s):* ${appointment.serviceNames.join(', ')}\n` +
      `⏱️ *Duração estimada:* ${appointment.totalDurationMinutes} min\n` +
      `💰 *Valor Total:* R$ ${appointment.totalPrice.toFixed(2).replace('.', ',')}\n` +
      `💳 *Forma de Pagamento:* ${paymentDesc} (${paymentStatusDesc})\n\n` +
      `📍 *Endereço:* ${config.address}\n\n` +
      `☕ Cerveja artesanal gelada e café especial por nossa conta enquanto você aguarda!\n` +
      `Caso precise reagendar ou cancelar, avise-nos com antecedência.\n\n` +
      `_Agradecemos a preferência e até breve!_`
    );
  }

  if (type === 'lembrete') {
    return (
      `*LEMBRETE MAMUTY BARBEARIA* ⏰💈\n\n` +
      `Fala, *${appointment.customerName}*! Lembrando que seu horário no Mamuty está chegando:\n\n` +
      `📅 *Hoje:* ${dataFormatada}\n` +
      `⏰ *Às:* ${appointment.time}\n` +
      `✂️ *Com:* ${appointment.barberName}\n` +
      `💈 *Serviço:* ${appointment.serviceNames.join(', ')}\n\n` +
      `📍 *Local:* ${config.address}\n\n` +
      `Estamos te esperando com a navalha afiada e a cerveja no ponto!`
    );
  }

  // Notificação para o Salão / Barbeiro
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
