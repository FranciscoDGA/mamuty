// ============================================
// LEMBRETES WHATSAPP — 1h antes do agendamento
// ============================================
// Função para enviar lembretes de agendamentos próximos

import { supabase } from '@/lib/supabase';
import { enviarRespostaFuncionario, isZApiConfigured } from '@/lib/zapi';

export interface ReminderResult {
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Envia lembretes para agendamentos que começam em 1 hora
 * Deve ser chamado a cada 5-10 minutos via cron
 */
export async function sendReminders(): Promise<ReminderResult> {
  const result: ReminderResult = { sent: 0, failed: 0, errors: [] };

  if (!isZApiConfigured()) {
    result.errors.push('Z-API não configurada');
    return result;
  }

  // Buscar agendamentos para as próximas 2 horas (janela de 1h antes)
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Formatar datas para comparação
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const formatTime = (d: Date) => d.toTimeString().substring(0, 5);

  const today = formatDate(now);
  const currentTime = formatTime(now);
  const reminderDeadline = formatTime(twoHoursFromNow);

  try {
    // Buscar agendamentos confirmados para hoje
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        customer_phone,
        customer_name,
        appointment_time,
        service_id,
        barber_id,
        reminder_sent
      `)
      .eq('appointment_date', today)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .gte('appointment_time', currentTime)
      .lte('appointment_time', reminderDeadline);

    if (error) {
      result.errors.push(`Erro ao buscar agendamentos: ${error.message}`);
      return result;
    }

    if (!appointments || appointments.length === 0) {
      return result; // Nenhum lembrete para enviar
    }

    // Buscar nomes dos serviços e barbeiros
    const serviceIds = [...new Set(appointments.map(a => a.service_id).filter(Boolean))];
    const barberIds = [...new Set(appointments.map(a => a.barber_id).filter(Boolean))];

    const { data: services } = await supabase
      .from('services')
      .select('id, name')
      .in('id', serviceIds);

    const { data: barbers } = await supabase
      .from('barbers')
      .select('id, name')
      .in('id', barberIds);

    const serviceMap = new Map(services?.map(s => [s.id, s.name]) || []);
    const barberMap = new Map(barbers?.map(b => [b.id, b.name]) || []);

    // Enviar lembrete para cada agendamento
    for (const apt of appointments) {
      if (!apt.customer_phone) {
        result.failed++;
        result.errors.push(`Agendamento ${apt.id}: telefone não informado`);
        continue;
      }

      const serviceName = serviceMap.get(apt.service_id) || 'Serviço';
      const barberName = barberMap.get(apt.barber_id) || 'Barbeiro';
      const aptTime = apt.appointment_time?.substring(0, 5) || '10:00';

      // Montar mensagem de lembrete
      const message = `理发 Lembrete Mamuty Barbearia\n\n` +
        `Olá ${apt.customer_name || 'Cliente'}! 👋\n\n` +
        `Seu agendamento é *hoje às ${aptTime}*.\n\n` +
        `📋 *Serviço:* ${serviceName}\n` +
        `💈 *Barbeiro:* ${barberName}\n\n` +
        `Te esperamos! Qualquer dúvida, é só chamar. 😊`;

      try {
        await enviarRespostaFuncionario(apt.customer_phone, {
          reply: message,
          intent: 'REMINDER'
        });

        // Marcar como enviado
        await supabase
          .from('appointments')
          .update({ reminder_sent: true })
          .eq('id', apt.id);

        result.sent++;
        console.log(`[Reminder] Enviado com sucesso`);
      } catch (err: any) {
        result.failed++;
        result.errors.push(`Erro ao enviar lembrete`);
        console.error(`[Reminder] Erro ao enviar lembrete`);
      }
    }

    return result;
  } catch (err: any) {
    result.errors.push(`Erro geral: ${err.message}`);
    return result;
  }
}
