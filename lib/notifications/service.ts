/**
 * lib/notifications/service.ts
 *
 * Central Notification & Communication Service for Mamuty Barbearia (Sprint 04).
 *
 * Principles:
 * - Decoupled: Emits and listens to system events.
 * - Source of Truth: Backend database is the authority.
 * - Resilience: Push/external delivery failure never aborts booking operations.
 * - Idempotency: Event deduplication and unique keys prevent spam.
 * - Timezone-safe: America/Sao_Paulo (UTC-3).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../supabase-admin';
import { BookingEvent, registerBookingEventListener } from '../booking/events';
import { formatWhatsAppMessage, WhatsAppMessageType } from '../whatsapp';
import { enviarMensagemUazapi, isUazapiConfigured } from '../uazapi';
import { INITIAL_SALON_CONFIG } from '../data';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type RecipientType = 'customer' | 'store' | 'admin';

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'BOOKING_EXPIRED'
  | 'BOOKING_MISSED'
  | 'PROFESSIONAL_CHANGED'
  | 'REMINDER';

export interface NotificationRecord {
  id: string;
  recipient_type: RecipientType;
  recipient_phone: string | null;
  recipient_user_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  booking_id: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface BookingReminderRecord {
  id: string;
  booking_id: string;
  reminder_type: 'reminder_1' | 'reminder_2' | 'reminder_3';
  scheduled_for: string;
  status: 'pending' | 'sent' | 'cancelled' | 'failed' | 'skipped';
  idempotency_key: string;
  sent_at: string | null;
  attempts: number;
  error_message: string | null;
  created_at: string;
}

export interface RemindersConfig {
  active: boolean;
  reminder_1_minutes: number; // 24h (1440 min)
  reminder_2_minutes: number; // 2h (120 min)
  reminder_3_minutes: number; // 15 min (15 min)
}

export const DEFAULT_REMINDERS_CONFIG: RemindersConfig = {
  active: true,
  reminder_1_minutes: 1440,
  reminder_2_minutes: 120,
  reminder_3_minutes: 15,
};

// ─── TIMEZONE & DATE UTILS ───────────────────────────────────────────────────

/**
 * Parses appointment date (YYYY-MM-DD) and time (HH:MM) in America/Sao_Paulo (UTC-3)
 * into a standard JS Date object.
 */
export function parseAppointmentDateTime(dateStr: string, timeStr: string): Date {
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim().substring(0, 5);
  // America/Sao_Paulo standard offset is -03:00
  return new Date(`${cleanDate}T${cleanTime}:00-03:00`);
}

/**
 * Formats a Date object or YYYY-MM-DD into Brazilian standard DD/MM/YYYY.
 */
export function formatDateBR(dateInput: string | Date): string {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-');
    return `${day}/${month}/${year}`;
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

// ─── CONFIGURATION FETCHING ──────────────────────────────────────────────────

export async function getRemindersConfig(supabase: SupabaseClient = supabaseAdmin): Promise<RemindersConfig> {
  try {
    const { data } = await supabase
      .from('business_settings')
      .select('value')
      .eq('key', 'reminders_config')
      .single();

    if (data?.value) {
      return {
        active: data.value.active ?? DEFAULT_REMINDERS_CONFIG.active,
        reminder_1_minutes: Number(data.value.reminder_1_minutes ?? DEFAULT_REMINDERS_CONFIG.reminder_1_minutes),
        reminder_2_minutes: Number(data.value.reminder_2_minutes ?? DEFAULT_REMINDERS_CONFIG.reminder_2_minutes),
        reminder_3_minutes: Number(data.value.reminder_3_minutes ?? DEFAULT_REMINDERS_CONFIG.reminder_3_minutes),
      };
    }
  } catch {
    // Return fallback defaults on error
  }
  return DEFAULT_REMINDERS_CONFIG;
}

// ─── IN-APP NOTIFICATION INSERTION ───────────────────────────────────────────

export interface CreateNotificationParams {
  recipientType: RecipientType;
  recipientPhone?: string | null;
  recipientUserId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createNotification(
  supabase: SupabaseClient,
  params: CreateNotificationParams,
): Promise<{ success: boolean; notification?: NotificationRecord; error?: string }> {
  try {
    const cleanPhone = params.recipientPhone ? params.recipientPhone.replace(/\D/g, '') : null;

    // Idempotency check: don't insert duplicate notification for the same booking, recipient and type
    if (params.bookingId) {
      let query = supabase
        .from('notifications')
        .select('id')
        .eq('booking_id', params.bookingId)
        .eq('type', params.type)
        .eq('recipient_type', params.recipientType);

      if (cleanPhone) {
        query = query.eq('recipient_phone', cleanPhone);
      }

      const { data: existing } = await query.maybeSingle();
      if (existing) {
        return { success: true }; // Already created, idempotent
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_type: params.recipientType,
        recipient_phone: cleanPhone,
        recipient_user_id: params.recipientUserId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        booking_id: params.bookingId || null,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[createNotification] Insert error:', error);
      return { success: false, error: error.message };
    }

    // Try to trigger Push in background (non-blocking)
    dispatchPushNotification(supabase, {
      recipientType: params.recipientType,
      recipientIdentifier: cleanPhone || 'store_main',
      title: params.title,
      body: params.message,
      bookingId: params.bookingId || undefined,
    }).catch((err) => {
      console.warn('[createNotification] Push delivery failed gracefully:', err);
    });

    return { success: true, notification: data as NotificationRecord };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[createNotification] Unexpected error:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// ─── PUSH NOTIFICATION DISPATCH (PWA) ────────────────────────────────────────

export interface PushPayload {
  recipientType: RecipientType;
  recipientIdentifier: string; // phone or 'store_main'
  title: string;
  body: string;
  bookingId?: string;
}

export async function dispatchPushNotification(
  supabase: SupabaseClient,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };
  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('target_identifier', payload.recipientIdentifier);

    if (error || !subscriptions || subscriptions.length === 0) {
      return result;
    }

    // In a production server with web-push and VAPID keys:
    // webpush.sendNotification(sub, JSON.stringify(payload))
    // Here we gracefully log and register delivery capability
    result.sent = subscriptions.length;
  } catch {
    result.failed++;
  }
  return result;
}

// ─── 3 LEMBRETES AUTOMÁTICOS (SCHEDULING & LIFECYCLE) ─────────────────────────

export async function scheduleBookingReminders(
  supabase: SupabaseClient,
  booking: {
    id: string;
    date: string;
    time: string;
    customerPhone: string;
    customerName: string;
    serviceName: string;
    barberName: string;
  },
): Promise<{ scheduled: number; skipped: number }> {
  let scheduled = 0;
  let skipped = 0;

  try {
    const config = await getRemindersConfig(supabase);
    if (!config.active) return { scheduled: 0, skipped: 0 };

    const aptDateTime = parseAppointmentDateTime(booking.date, booking.time);
    const now = new Date();

    const reminderDefs: Array<{ type: 'reminder_1' | 'reminder_2' | 'reminder_3'; minutes: number }> = [
      { type: 'reminder_1', minutes: config.reminder_1_minutes },
      { type: 'reminder_2', minutes: config.reminder_2_minutes },
      { type: 'reminder_3', minutes: config.reminder_3_minutes },
    ];

    for (const def of reminderDefs) {
      const scheduledTime = new Date(aptDateTime.getTime() - def.minutes * 60 * 1000);
      const idempotencyKey = `${booking.id}_${def.type}`;

      // Rule 13: If scheduled reminder time is in the past, skip it
      if (scheduledTime.getTime() <= now.getTime()) {
        await supabase
          .from('booking_reminders')
          .upsert({
            booking_id: booking.id,
            reminder_type: def.type,
            scheduled_for: scheduledTime.toISOString(),
            status: 'skipped',
            idempotency_key: idempotencyKey,
            error_message: 'Horário do lembrete já passou no momento do agendamento',
          }, { onConflict: 'idempotency_key' });
        skipped++;
        continue;
      }

      // Upsert pending reminder
      const { error } = await supabase
        .from('booking_reminders')
        .upsert({
          booking_id: booking.id,
          reminder_type: def.type,
          scheduled_for: scheduledTime.toISOString(),
          status: 'pending',
          idempotency_key: idempotencyKey,
        }, { onConflict: 'idempotency_key' });

      if (!error) {
        scheduled++;
      }
    }
  } catch (err) {
    console.error('[scheduleBookingReminders] Error:', err);
  }

  return { scheduled, skipped };
}

/**
 * Cancel pending reminders for a booking (e.g. when booking is cancelled).
 */
export async function cancelBookingReminders(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<{ count: number }> {
  try {
    const { data, error } = await supabase
      .from('booking_reminders')
      .update({ status: 'cancelled' })
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .select('id');

    if (error) {
      console.error('[cancelBookingReminders] Error:', error);
      return { count: 0 };
    }
    return { count: data?.length || 0 };
  } catch (err) {
    console.error('[cancelBookingReminders] Unexpected error:', err);
    return { count: 0 };
  }
}

/**
 * Process pending reminders due now.
 * Called periodically via /api/cron/reminders.
 */
export async function processDueReminders(
  supabase: SupabaseClient = supabaseAdmin,
): Promise<{ processed: number; sent: number; failed: number }> {
  const result = { processed: 0, sent: 0, failed: 0 };
  const nowIso = new Date().toISOString();

  try {
    // Fetch pending reminders due <= now
    const { data: reminders, error } = await supabase
      .from('booking_reminders')
      .select(`
        id,
        booking_id,
        reminder_type,
        scheduled_for,
        status,
        appointments (
          id,
          date,
          time,
          appointment_date,
          appointment_time,
          customer_name,
          customer_phone,
          barber_name,
          service_names,
          status,
          total_price,
          price
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', nowIso)
      .limit(50);

    if (error || !reminders || reminders.length === 0) {
      return result;
    }

    for (const item of reminders) {
      result.processed++;
      const apt = item.appointments as any;

      // If booking was cancelled or does not exist, mark cancelled
      if (!apt || apt.status === 'cancelled') {
        await supabase
          .from('booking_reminders')
          .update({ status: 'cancelled', error_message: 'Agendamento cancelado' })
          .eq('id', item.id);
        continue;
      }

      const dateStr = apt.date || apt.appointment_date;
      const timeStr = apt.time || apt.appointment_time;
      const customerName = apt.customer_name || 'Cliente';
      const barberName = apt.barber_name || 'Profissional';
      const serviceName = Array.isArray(apt.service_names) ? apt.service_names.join(', ') : 'Serviço';

      // Mapeia o tipo de lembrete para o template correto dos 3 bibes
      let bibeType: WhatsAppMessageType = 'lembrete_15m';
      let reminderTitle = '🚨 3º BIBE: Horário em 15 minutos! (Tolerância 10 min)';

      if (item.reminder_type === 'reminder_1') {
        bibeType = 'lembrete_24h';
        reminderTitle = '🔔 1º BIBE: Seu horário é amanhã — Mamuty';
      } else if (item.reminder_type === 'reminder_2') {
        bibeType = 'lembrete_2h';
        reminderTitle = '⏰ 2º BIBE: Seu horário é em 2 horas — Mamuty';
      }

      const reminderMsg = formatWhatsAppMessage(
        {
          id: apt.id,
          customerName,
          customerPhone: apt.customer_phone || '',
          barberId: apt.barber_id || '',
          barberName,
          serviceIds: Array.isArray(apt.service_ids) ? apt.service_ids : [],
          serviceNames: Array.isArray(apt.service_names) ? apt.service_names : [serviceName],
          date: dateStr,
          time: timeStr,
          totalPrice: Number(apt.total_price || apt.price || 0),
          totalDurationMinutes: apt.total_duration_minutes || apt.duration_minutes || 30,
          paymentMethod: apt.payment_method || 'pix',
          paymentStatus: apt.status === 'completed' ? 'pago' : 'pendente',
          status: apt.status || 'confirmed',
          whatsappNotificationSent: false,
          createdAt: apt.created_at || new Date().toISOString(),
        },
        INITIAL_SALON_CONFIG,
        bibeType
      );

      // Dispara no WhatsApp via Uazapi se configurado
      if (apt.customer_phone && isUazapiConfigured()) {
        try {
          await enviarMensagemUazapi(reminderMsg, apt.customer_phone);
        } catch (uazapiErr) {
          console.warn('[processDueReminders] Erro ao enviar WhatsApp via Uazapi:', uazapiErr);
        }
      }

      // Create in-app notification for the customer
      const notifResult = await createNotification(supabase, {
        recipientType: 'customer',
        recipientPhone: apt.customer_phone,
        type: 'REMINDER',
        title: reminderTitle,
        message: reminderMsg,
        bookingId: apt.id,
        metadata: { reminderType: item.reminder_type },
      });

      if (notifResult.success) {
        await supabase
          .from('booking_reminders')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            attempts: 1,
          })
          .eq('id', item.id);
        result.sent++;
      } else {
        await supabase
          .from('booking_reminders')
          .update({
            status: 'failed',
            attempts: 1,
            error_message: notifResult.error || 'Falha ao criar notificação',
          })
          .eq('id', item.id);
        result.failed++;
      }
    }
  } catch (err) {
    console.error('[processDueReminders] Error:', err);
  }

  return result;
}

// ─── MASTER EVENT PROCESSOR ──────────────────────────────────────────────────

/**
 * Handles all official booking events from Sprint 03 / Sprint 04.
 */
export async function processBookingEvent(
  event: BookingEvent,
  supabase: SupabaseClient = supabaseAdmin,
): Promise<void> {
  const { type, appointmentId, metadata } = event;

  try {
    // 1. Fetch appointment details
    const { data: apt, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (error || !apt) {
      console.warn(`[processBookingEvent] Appointment not found: ${appointmentId}`);
      return;
    }

    const dateStr = apt.date || apt.appointment_date;
    const timeStr = apt.time || apt.appointment_time;
    const customerName = apt.customer_name || 'Cliente';
    const customerPhone = apt.customer_phone || '';
    const barberName = apt.barber_name || 'Profissional';
    const serviceName = Array.isArray(apt.service_names) && apt.service_names.length > 0
      ? apt.service_names.join(', ')
      : 'Serviço Mamuty';
    const totalPrice = apt.total_price ?? apt.price ?? 0;
    const duration = apt.total_duration_minutes ?? apt.duration_minutes ?? 30;
    const paymentMethod = apt.payment_method || 'no local';

    switch (type) {
      // ─── 1. BOOKING_CREATED ───
      case 'BOOKING_CREATED': {
        // Customer confirmation message using the official template with 10-min tolerance & location
        const clientMsg = formatWhatsAppMessage(
          {
            id: apt.id,
            customerName,
            customerPhone,
            barberId: apt.barber_id || '',
            barberName,
            serviceIds: Array.isArray(apt.service_ids) ? apt.service_ids : [],
            serviceNames: Array.isArray(apt.service_names) ? apt.service_names : [serviceName],
            date: dateStr,
            time: timeStr,
            totalPrice: Number(totalPrice),
            totalDurationMinutes: duration,
            paymentMethod: paymentMethod as any,
            paymentStatus: apt.status === 'completed' ? 'pago' : 'pendente',
            status: apt.status || 'confirmed',
            whatsappNotificationSent: false,
            createdAt: apt.created_at || new Date().toISOString(),
          },
          INITIAL_SALON_CONFIG,
          'cliente'
        );

        // Dispara no WhatsApp do cliente via Uazapi imediatamente
        if (customerPhone && isUazapiConfigured()) {
          try {
            await enviarMensagemUazapi(clientMsg, customerPhone);
          } catch (uazErr) {
            console.warn('[BOOKING_CREATED] Falha ao enviar WhatsApp confirmação:', uazErr);
          }
        }

        await createNotification(supabase, {
          recipientType: 'customer',
          recipientPhone: customerPhone,
          type: 'BOOKING_CREATED',
          title: 'Agendamento Confirmado! ✂️',
          message: clientMsg,
          bookingId: apt.id,
          metadata: { serviceName, barberName, date: dateStr, time: timeStr, totalPrice },
        });

        // Store alert message
        const storeTitle = 'Novo Agendamento 🔔';
        const storeMsg = formatWhatsAppMessage(
          {
            id: apt.id,
            customerName,
            customerPhone,
            barberId: apt.barber_id || '',
            barberName,
            serviceIds: Array.isArray(apt.service_ids) ? apt.service_ids : [],
            serviceNames: Array.isArray(apt.service_names) ? apt.service_names : [serviceName],
            date: dateStr,
            time: timeStr,
            totalPrice: Number(totalPrice),
            totalDurationMinutes: duration,
            paymentMethod: paymentMethod as any,
            paymentStatus: apt.status === 'completed' ? 'pago' : 'pendente',
            status: apt.status || 'confirmed',
            whatsappNotificationSent: false,
            createdAt: apt.created_at || new Date().toISOString(),
          },
          INITIAL_SALON_CONFIG,
          'barbearia'
        );

        // Notifica o WhatsApp do Salão via Uazapi se configurado
        if (INITIAL_SALON_CONFIG.whatsappNumber && isUazapiConfigured()) {
          try {
            await enviarMensagemUazapi(storeMsg, INITIAL_SALON_CONFIG.whatsappNumber);
          } catch (storeUazErr) {
            console.warn('[BOOKING_CREATED] Falha ao enviar WhatsApp para salão:', storeUazErr);
          }
        }

        await createNotification(supabase, {
          recipientType: 'store',
          type: 'BOOKING_CREATED',
          title: storeTitle,
          message: storeMsg,
          bookingId: apt.id,
          metadata: { serviceName, barberName, date: dateStr, time: timeStr },
        });

        // Schedule the 3 automatic reminders
        await scheduleBookingReminders(supabase, {
          id: apt.id,
          date: dateStr,
          time: timeStr,
          customerPhone,
          customerName,
          serviceName,
          barberName,
        });
        break;
      }

      // ─── 2. BOOKING_CANCELLED ───
      case 'BOOKING_CANCELLED': {
        // Customer cancellation message
        const clientTitle = 'Agendamento Cancelado';
        const clientMsg =
          `Olá, ${customerName}!\n\n` +
          `Seu agendamento foi cancelado.\n\n` +
          `• Serviço: ${serviceName}\n` +
          `• Profissional: ${barberName}\n` +
          `• Data: ${formatDateBR(dateStr)}\n` +
          `• Horário: ${timeStr}\n\n` +
          `Se desejar marcar um novo horário, estamos à disposição!`;

        await createNotification(supabase, {
          recipientType: 'customer',
          recipientPhone: customerPhone,
          type: 'BOOKING_CANCELLED',
          title: clientTitle,
          message: clientMsg,
          bookingId: apt.id,
        });

        // Store alert
        const storeTitle = 'Agendamento Cancelado ⚠️';
        const storeMsg =
          `AGENDAMENTO CANCELADO\n\n` +
          `Cliente: ${customerName}\n` +
          `Serviço: ${serviceName}\n` +
          `Profissional: ${barberName}\n` +
          `Data: ${formatDateBR(dateStr)} às ${timeStr}\n` +
          (metadata?.reason ? `Motivo: ${metadata.reason}` : '');

        await createNotification(supabase, {
          recipientType: 'store',
          type: 'BOOKING_CANCELLED',
          title: storeTitle,
          message: storeMsg,
          bookingId: apt.id,
        });

        // Cancel all pending reminders
        await cancelBookingReminders(supabase, apt.id);
        break;
      }

      // ─── 3. BOOKING_RESCHEDULED ───
      case 'BOOKING_RESCHEDULED': {
        const newDate = (metadata?.newDate as string) || dateStr;
        const newTime = (metadata?.newTime as string) || timeStr;

        const clientTitle = 'Agendamento Remarcado 🔄';
        const clientMsg =
          `Olá, ${customerName}!\n\n` +
          `Seu horário foi atualizado.\n\n` +
          `• Serviço: ${serviceName}\n` +
          `• Profissional: ${barberName}\n` +
          `• Nova data: ${formatDateBR(newDate)}\n` +
          `• Novo horário: ${newTime}\n\n` +
          `Esperamos você!`;

        await createNotification(supabase, {
          recipientType: 'customer',
          recipientPhone: customerPhone,
          type: 'BOOKING_RESCHEDULED',
          title: clientTitle,
          message: clientMsg,
          bookingId: apt.id,
          metadata: { newDate, newTime },
        });

        const storeTitle = 'Agendamento Remarcado 🔄';
        const storeMsg =
          `AGENDAMENTO REMARCADO\n\n` +
          `Cliente: ${customerName}\n` +
          `Serviço: ${serviceName}\n` +
          `Profissional: ${barberName}\n` +
          `Novo horário: ${formatDateBR(newDate)} às ${newTime}`;

        await createNotification(supabase, {
          recipientType: 'store',
          type: 'BOOKING_RESCHEDULED',
          title: storeTitle,
          message: storeMsg,
          bookingId: apt.id,
        });

        // Cancel old reminders and re-schedule new ones
        await cancelBookingReminders(supabase, apt.id);
        await scheduleBookingReminders(supabase, {
          id: apt.id,
          date: newDate,
          time: newTime,
          customerPhone,
          customerName,
          serviceName,
          barberName,
        });
        break;
      }

      // ─── 4. PROFESSIONAL_CHANGED ───
      case 'PROFESSIONAL_CHANGED': {
        const clientTitle = 'Profissional Alterado 💈';
        const clientMsg =
          `Olá, ${customerName}!\n\n` +
          `Seu agendamento foi atualizado.\n\n` +
          `• Serviço: ${serviceName}\n` +
          `• Novo profissional: ${barberName}\n` +
          `• Data: ${formatDateBR(dateStr)}\n` +
          `• Horário: ${timeStr}`;

        await createNotification(supabase, {
          recipientType: 'customer',
          recipientPhone: customerPhone,
          type: 'PROFESSIONAL_CHANGED',
          title: clientTitle,
          message: clientMsg,
          bookingId: apt.id,
        });

        const storeTitle = 'Profissional Alterado 💈';
        const storeMsg =
          `TROCA DE PROFISSIONAL\n\n` +
          `Cliente: ${customerName}\n` +
          `Serviço: ${serviceName}\n` +
          `Novo profissional: ${barberName}\n` +
          `Data: ${formatDateBR(dateStr)} às ${timeStr}`;

        await createNotification(supabase, {
          recipientType: 'store',
          type: 'PROFESSIONAL_CHANGED',
          title: storeTitle,
          message: storeMsg,
          bookingId: apt.id,
        });
        break;
      }

      // ─── 5. BOOKING_MISSED / BOOKING_EXPIRED ───
      case 'BOOKING_MISSED':
      case 'BOOKING_EXPIRED': {
        const clientTitle = 'Agendamento Encerrado';
        const clientMsg =
          `O período de tolerância de 10 minutos foi ultrapassado.\n\n` +
          `Para ser atendido, será necessário realizar um novo agendamento.`;

        await createNotification(supabase, {
          recipientType: 'customer',
          recipientPhone: customerPhone,
          type: 'BOOKING_MISSED',
          title: clientTitle,
          message: clientMsg,
          bookingId: apt.id,
        });

        const storeTitle = 'Agendamento Encerrado por Atraso/Falta';
        const storeMsg =
          `AGENDAMENTO ENCERRADO\n\n` +
          `Cliente: ${customerName} não compareceu dentro da tolerância de 10 minutos.\n` +
          `Horário liberado na agenda.`;

        await createNotification(supabase, {
          recipientType: 'store',
          type: 'BOOKING_MISSED',
          title: storeTitle,
          message: storeMsg,
          bookingId: apt.id,
        });

        await cancelBookingReminders(supabase, apt.id);
        break;
      }
    }
  } catch (err) {
    console.error(`[processBookingEvent] Error processing event ${type}:`, err);
  }
}

// Auto-register listener on server startup
registerBookingEventListener(async (event) => {
  await processBookingEvent(event);
});
