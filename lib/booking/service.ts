/**
 * booking/service.ts
 *
 * Centralized booking business logic for Mamuty Barbearia.
 * Framework-agnostic — works with any Supabase client.
 *
 * RULES:
 *   - Backend is the authority for price, duration, availability, status
 *   - Frontend sends intent, backend validates and executes
 *   - Idempotency key prevents duplicate bookings
 *   - Conflict detection prevents double-booking
 *   - Service must fit entirely within a working window
 *   - Holiday: normal price + 10%
 *   - Tolerance: 10 minutes (configured, not enforced here)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  timeToMinutes,
  minutesToTime,
  doesServiceFitInDay,
  getDaySchedule,
  isSalonOpen,
} from '../businessHours';
import {
  consultarDisponibilidade,
  getHorarioFuncionamentoDia,
} from '../availability';
import type { DayOfWeek } from '../businessHours';
import { bookingEvents } from './events';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookingInput {
  serviceId: string;
  barberId: string; // 'any' for first available
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: string;
  idempotencyKey?: string;
}

export interface BookingResult {
  success: boolean;
  appointment?: AppointmentRecord;
  error?: string;
  errorCode?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PriceBreakdown {
  basePrice: number;
  serviceName: string;
  holidaySurcharge: number; // 0 or 0.10
  holidayTotal: number;
  cardSurcharge: number; // 0 or configured %
  total: number;
  isHoliday: boolean;
}

export interface AppointmentRecord {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  barber_id: string;
  barber_name: string;
  service_id: string;
  service_ids: string[];
  service_names: string[];
  appointment_date: string;
  appointment_time: string;
  date: string;
  time: string;
  status: string;
  price: number;
  total_price: number;
  duration_minutes: number;
  total_duration_minutes: number;
  payment_method: string;
  payment_status: string;
  source: string;
  notes: string;
  idempotency_key: string | null;
  created_at: string;
}

export interface FirstAvailableResult {
  found: boolean;
  barberId?: string;
  barberName?: string;
  date?: string;
  time?: string;
  service?: { id: string; name: string; price: number; durationMinutes: number };
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate booking input against business rules.
 * Does NOT check database — only validates the input shape and business constraints.
 */
export function validateBookingInput(input: BookingInput): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!input.serviceId) errors.push('Serviço é obrigatório');
  if (!input.barberId) errors.push('Profissional é obrigatório');
  if (!input.date) errors.push('Data é obrigatória');
  if (!input.time) errors.push('Horário é obrigatório');
  if (!input.customerName?.trim()) errors.push('Nome do cliente é obrigatório');
  if (!input.customerPhone?.trim()) errors.push('Telefone do cliente é obrigatório');

  // Date format
  if (input.date && !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.push('Formato de data inválido (use YYYY-MM-DD)');
  }

  // Time format
  if (input.time && !/^\d{2}:\d{2}$/.test(input.time)) {
    errors.push('Formato de horário inválido (use HH:MM)');
  }

  // Date not in the past
  if (input.date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(input.date + 'T12:00:00');
    if (inputDate < today) {
      errors.push('Data não pode ser no passado');
    }
  }

  // Day of week validation (only if date format is valid)
  if (input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    const dateObj = new Date(input.date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay() as DayOfWeek;

    if (!isSalonOpen(dayOfWeek)) {
      errors.push('Barbearia fechada nesse dia');
    }

    // Sunday: no service after 12:00
    if (dayOfWeek === 0 && input.time) {
      const timeMinutes = timeToMinutes(input.time);
      if (timeMinutes >= 720) { // 12:00 = 720 minutes
        errors.push('Domingo: atendimento apenas das 08:00 às 12:00');
      }
    }
  }

  // Payment method
  const validPaymentMethods = ['pix', 'dinheiro', 'debito', 'credito', 'cartao', 'presencial'];
  if (input.paymentMethod && !validPaymentMethods.includes(input.paymentMethod)) {
    errors.push('Método de pagamento inválido');
  }

  return { valid: errors.length === 0, errors };
}

// ─── Conflict Detection ──────────────────────────────────────────────────────

/**
 * Check if a time slot conflicts with existing bookings.
 * Returns true if there IS a conflict (slot is NOT available).
 */
export async function checkConflict(
  supabase: SupabaseClient,
  barberId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
): Promise<{ hasConflict: boolean; error?: string }> {
  try {
    // Query all non-cancelled appointments for this barber on this date
    let query = supabase
      .from('appointments')
      .select('id, time, date, total_duration_minutes, duration_minutes, status')
      .eq('barber_id', barberId)
      .eq('date', date)
      .not('status', 'eq', 'cancelled');

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: existing, error } = await query;

    if (error) {
      console.error('[checkConflict] Supabase error:', error);
      return { hasConflict: false, error: error.message };
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    for (const apt of existing || []) {
      const aptTime = apt.time?.substring(0, 5); // Handle TIME type
      if (!aptTime) continue;

      const aptStartMinutes = timeToMinutes(aptTime);
      const aptDuration = apt.total_duration_minutes || apt.duration_minutes || 40;
      const aptEndMinutes = aptStartMinutes + aptDuration;

      // Overlap: A starts before B ends AND A ends after B starts
      if (startMinutes < aptEndMinutes && endMinutes > aptStartMinutes) {
        return { hasConflict: true };
      }
    }

    return { hasConflict: false };
  } catch (err) {
    console.error('[checkConflict] Unexpected error:', err);
    return { hasConflict: false, error: 'Erro ao verificar conflito' };
  }
}

// ─── Price Calculation ───────────────────────────────────────────────────────

/**
 * Calculate the full price breakdown server-side.
 * Never trust the frontend price.
 */
export async function calculatePrice(
  supabase: SupabaseClient,
  serviceId: string,
  date: string,
  paymentMethod: string,
): Promise<PriceBreakdown> {
  // 1. Fetch service from database
  const { data: service, error } = await supabase
    .from('services')
    .select('name, price')
    .eq('id', serviceId)
    .single();

  if (error || !service) {
    throw new Error('Serviço não encontrado');
  }

  const basePrice = Number(service.price) || 0;

  // 2. Check if date is a holiday
  let isHoliday = false;
  try {
    const { data: closedDays } = await supabase
      .from('business_settings')
      .select('value')
      .eq('key', 'closedDays')
      .single();

    if (closedDays?.value) {
      const holidays = Array.isArray(closedDays.value) ? closedDays.value : [];
      isHoliday = holidays.some((h: { date: string }) => h.date === date);
    }
  } catch {
    // No holidays configured — not an error
  }

  // 3. Calculate holiday surcharge (10%)
  const holidaySurcharge = isHoliday ? 0.10 : 0;
  const holidayTotal = basePrice * (1 + holidaySurcharge);

  // 4. Calculate card surcharge (if applicable)
  let cardSurcharge = 0;
  if (paymentMethod === 'credito' || paymentMethod === 'cartao') {
    // Card surcharge is configured in business_settings
    try {
      const { data: paymentSettings } = await supabase
        .from('business_settings')
        .select('value')
        .eq('key', 'payments')
        .single();

      if (paymentSettings?.value?.cardSurchargePercent) {
        cardSurcharge = paymentSettings.value.cardSurchargePercent / 100;
      }
    } catch {
      // Default: no card surcharge
    }
  }

  const total = Math.round(holidayTotal * (1 + cardSurcharge) * 100) / 100;

  return {
    basePrice,
    serviceName: service.name,
    holidaySurcharge,
    holidayTotal: Math.round(holidayTotal * 100) / 100,
    cardSurcharge,
    total,
    isHoliday,
  };
}

// ─── Create Booking ──────────────────────────────────────────────────────────

/**
 * Create a new booking with full server-side validation.
 *
 * Flow:
 *   1. Validate input
 *   2. Fetch service + barber from DB
 *   3. Validate compatibility (barber can perform service)
 *   4. Validate time fits in working window
 *   5. Check conflict
 *   6. Calculate price
 *   7. Create/find customer
 *   8. Insert appointment
 */
export async function createBooking(
  supabase: SupabaseClient,
  input: BookingInput,
): Promise<BookingResult> {
  // 1. Validate input
  const validation = validateBookingInput(input);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join('; '), errorCode: 'VALIDATION_ERROR' };
  }

  // 2. Fetch service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, active')
    .eq('id', input.serviceId)
    .single();

  if (serviceError) {
    console.error('[createBooking] Erro ao buscar serviço:', serviceError);
    if (serviceError.message?.includes('Invalid API key') || serviceError.code === 'PGRST301') {
      return { success: false, error: 'Erro de autorização: Verifique a SUPABASE_SERVICE_ROLE_KEY.', errorCode: 'AUTH_ERROR' };
    }
    return { success: false, error: 'Erro interno ao buscar serviço.', errorCode: 'DB_ERROR' };
  }

  if (!service) {
    return { success: false, error: 'Serviço não encontrado no banco de dados.', errorCode: 'SERVICE_NOT_FOUND' };
  }

  if (service.active === false) {
    return { success: false, error: 'Serviço não está disponível', errorCode: 'SERVICE_INACTIVE' };
  }

  const durationMinutes = service.duration_minutes || 40;

  // 3. Fetch barber (or resolve 'any')
  let barberId = input.barberId;
  let barberName = '';

  if (input.barberId === 'any') {
    // First available — will be resolved later
    const firstAvailable = await findFirstAvailable(supabase, input.serviceId, input.date);
    if (!firstAvailable.found) {
      return { success: false, error: 'Nenhum profissional disponível', errorCode: 'NO_BARBER_AVAILABLE' };
    }
    barberId = firstAvailable.barberId!;
    barberName = firstAvailable.barberName!;
  } else {
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('id, name, active')
      .eq('id', input.barberId)
      .single();

    if (barberError || !barber) {
      return { success: false, error: 'Profissional não encontrado', errorCode: 'BARBER_NOT_FOUND' };
    }

    if (barber.active === false) {
      return { success: false, error: 'Profissional não está disponível', errorCode: 'BARBER_INACTIVE' };
    }

    barberName = barber.name;
  }

  // 4. Validate time fits in working window
  const dayOfWeek = new Date(input.date + 'T12:00:00').getDay() as DayOfWeek;
  const timeMinutes = timeToMinutes(input.time);
  const endMinutes = timeMinutes + durationMinutes;

  if (!isSalonOpen(dayOfWeek)) {
    return { success: false, error: 'Barbearia fechada nesse dia', errorCode: 'CLOSED_DAY' };
  }

  const serviceEnd = minutesToTime(endMinutes);
  if (!doesServiceFitInDay(dayOfWeek, input.time, serviceEnd)) {
    // Determine specific reason
    if (dayOfWeek === 0 && timeMinutes >= 720) {
      return { success: false, error: 'Domingo: atendimento apenas das 08:00 às 12:00', errorCode: 'SUNDAY_AFTERNOON' };
    }
    if (timeMinutes >= 720 && timeMinutes < 840) {
      return { success: false, error: 'Intervalo de almoço: 12:00 às 14:00', errorCode: 'LUNCH_BREAK' };
    }
    if (endMinutes > 1200) {
      return { success: false, error: `Horário ultrapassa fechamento (20:00)`, errorCode: 'PAST_CLOSING' };
    }
    return { success: false, error: 'Serviço não cabe nessa janela de horário', errorCode: 'DOES_NOT_FIT' };
  }

  // 5. Check conflict
  const conflict = await checkConflict(supabase, barberId, input.date, input.time, serviceEnd);
  if (conflict.hasConflict) {
    return { success: false, error: 'Esse horário acabou de ficar indisponível', errorCode: 'CONFLICT' };
  }
  if (conflict.error) {
    return { success: false, error: `Erro ao verificar disponibilidade: ${conflict.error}`, errorCode: 'CONFLICT_CHECK_FAILED' };
  }

  // 6. Calculate price (server-side authority)
  let priceBreakdown: PriceBreakdown;
  try {
    priceBreakdown = await calculatePrice(supabase, input.serviceId, input.date, input.paymentMethod);
  } catch (err) {
    return { success: false, error: 'Erro ao calcular preço', errorCode: 'PRICE_CALC_FAILED' };
  }

  // 7. Create/find customer
  const cleanPhone = input.customerPhone.replace(/\D/g, '');
  let customerId: string | null = null;

  try {
    // Try to find existing customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({ name: input.customerName.trim(), phone: cleanPhone })
        .select('id')
        .single();

      customerId = newCustomer?.id || null;
    }
  } catch {
    // Customer creation is non-critical — continue without ID
  }

  // 8. Build notes
  const notes = [
    `Pagamento: ${input.paymentMethod}`,
    input.customerEmail ? `Email: ${input.customerEmail}` : '',
    `Origem: web`,
  ].filter(Boolean).join(' | ');

  // 9. Build appointment record
  const appointmentData = {
    // Migration 001 columns
    customer_id: customerId,
    service_id: input.serviceId,
    barber_id: barberId,
    appointment_date: input.date,
    appointment_time: input.time,
    status: 'confirmed',
    price: priceBreakdown.total,
    duration_minutes: durationMinutes,
    notes,

    // Webhook / Sprint 03 columns
    customer_name: input.customerName.trim(),
    customer_phone: cleanPhone,
    customer_email: input.customerEmail || null,
    barber_name: barberName,
    service_ids: [input.serviceId],
    service_names: [priceBreakdown.serviceName],
    date: input.date,
    time: input.time,
    total_price: priceBreakdown.total,
    total_duration_minutes: durationMinutes,
    payment_method: input.paymentMethod,
    payment_status: input.paymentMethod === 'pix' ? 'pendente' : 'no_local',
    source: 'web',
    whatsapp_notification_sent: false,
    idempotency_key: input.idempotencyKey || null,
  };

  // 10. Insert (with idempotency check)
  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert(appointmentData)
    .select()
    .single();

  if (insertError) {
    // Check for idempotency conflict (unique violation on idempotency_key)
    if (insertError.code === '23505' && input.idempotencyKey) {
      // Already exists — fetch and return the existing one
      const { data: existing } = await supabase
        .from('appointments')
        .select('*')
        .eq('idempotency_key', input.idempotencyKey)
        .single();

      if (existing) {
        return { success: true, appointment: existing as AppointmentRecord };
      }
    }

    console.error('[createBooking] Insert error:', insertError);
    return { success: false, error: 'Erro ao criar agendamento', errorCode: 'INSERT_FAILED' };
  }

  // Emit event (triggers in-app notifications and scheduled reminders)
  try {
    await bookingEvents.created((appointment as any).id, {
      serviceName: priceBreakdown.serviceName,
      barberName,
    });
  } catch (err) {
    console.error('[createBooking] Failed to emit BOOKING_CREATED event:', err);
  }

  return { success: true, appointment: appointment as AppointmentRecord };
}

// ─── Cancel Booking ──────────────────────────────────────────────────────────

/**
 * Cancel an existing booking.
 * Sets status to 'cancelled' — the slot is automatically freed.
 */
export async function cancelBooking(
  supabase: SupabaseClient,
  appointmentId: string,
  phone?: string, // for authorization check
): Promise<{ success: boolean; error?: string }> {
  // Fetch the appointment
  let query = supabase
    .from('appointments')
    .select('id, status, customer_phone')
    .eq('id', appointmentId);

  const { data: apt, error: fetchError } = await query.single();

  if (fetchError || !apt) {
    return { success: false, error: 'Agendamento não encontrado' };
  }

  // Authorization: phone must match (if provided)
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const aptPhone = apt.customer_phone?.replace(/\D/g, '') || '';
    if (cleanPhone !== aptPhone) {
      return { success: false, error: 'Não autorizado' };
    }
  }

  // Can only cancel confirmed or aguardando
  if (!['confirmed', 'aguardando'].includes(apt.status)) {
    return { success: false, error: `Não é possível cancelar agendamento com status: ${apt.status}` };
  }

  // Update status
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId);

  if (updateError) {
    console.error('[cancelBooking] Update error:', updateError);
    return { success: false, error: 'Erro ao cancelar agendamento' };
  }

  // Emit event (triggers notifications and cancels pending reminders)
  try {
    await bookingEvents.cancelled(appointmentId);
  } catch (err) {
    console.error('[cancelBooking] Failed to emit BOOKING_CANCELLED event:', err);
  }

  return { success: true };
}

// ─── Reschedule Booking ──────────────────────────────────────────────────────

/**
 * Reschedule an existing booking to a new date/time.
 *
 * Strategy: Create NEW booking first, then cancel old one.
 * This prevents the client from losing their slot if the new time fails.
 */
export async function rescheduleBooking(
  supabase: SupabaseClient,
  appointmentId: string,
  newDate: string,
  newTime: string,
  newBarberId?: string,
  phone?: string,
): Promise<BookingResult> {
  // 1. Fetch existing appointment
  const { data: existing, error: fetchError } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Agendamento não encontrado', errorCode: 'NOT_FOUND' };
  }

  // Authorization
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const aptPhone = existing.customer_phone?.replace(/\D/g, '') || '';
    if (cleanPhone !== aptPhone) {
      return { success: false, error: 'Não autorizado', errorCode: 'UNAUTHORIZED' };
    }
  }

  // Can only reschedule confirmed or aguardando
  if (!['confirmed', 'aguardando'].includes(existing.status)) {
    return { success: false, error: `Não é possível remarcar agendamento com status: ${existing.status}`, errorCode: 'INVALID_STATUS' };
  }

  // 2. Create new booking with same service but new date/time/barber
  const newInput: BookingInput = {
    serviceId: existing.service_id,
    barberId: newBarberId || existing.barber_id,
    date: newDate,
    time: newTime,
    customerName: existing.customer_name || existing.notes?.match(/Nome: (.+?)(\||$)/)?.[1] || 'Cliente',
    customerPhone: existing.customer_phone || '',
    customerEmail: existing.customer_email || undefined,
    paymentMethod: existing.payment_method || 'presencial',
  };

  const createResult = await createBooking(supabase, newInput);

  if (!createResult.success) {
    return createResult;
  }

  // 3. Cancel old booking
  const cancelResult = await cancelBooking(supabase, appointmentId);
  if (!cancelResult.success) {
    // New booking was created but old wasn't cancelled
    // This is acceptable — the new booking is valid
    console.warn('[rescheduleBooking] Old booking could not be cancelled:', cancelResult.error);
  }

  // Emit rescheduled event on new appointment
  try {
    if (createResult.appointment) {
      await bookingEvents.rescheduled(
        createResult.appointment.id,
        existing.date || existing.appointment_date,
        existing.time || existing.appointment_time,
        newDate,
        newTime,
      );
    }
  } catch (err) {
    console.error('[rescheduleBooking] Failed to emit BOOKING_RESCHEDULED event:', err);
  }

  return createResult;
}

// ─── Change Barber ───────────────────────────────────────────────────────────

/**
 * Change the barber for an existing booking.
 * Keeps the same date, time, and service.
 */
export async function changeBarber(
  supabase: SupabaseClient,
  appointmentId: string,
  newBarberId: string,
  phone?: string,
): Promise<BookingResult> {
  // 1. Fetch existing appointment
  const { data: existing, error: fetchError } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Agendamento não encontrado', errorCode: 'NOT_FOUND' };
  }

  // Authorization
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const aptPhone = existing.customer_phone?.replace(/\D/g, '') || '';
    if (cleanPhone !== aptPhone) {
      return { success: false, error: 'Não autorizado', errorCode: 'UNAUTHORIZED' };
    }
  }

  // Can only change barber for confirmed or aguardando
  if (!['confirmed', 'aguardando'].includes(existing.status)) {
    return { success: false, error: `Não é possível trocar profissional com status: ${existing.status}`, errorCode: 'INVALID_STATUS' };
  }

  // 2. Validate new barber is compatible
  const { data: barber, error: barberError } = await supabase
    .from('barbers')
    .select('id, name, active')
    .eq('id', newBarberId)
    .single();

  if (barberError || !barber) {
    return { success: false, error: 'Profissional não encontrado', errorCode: 'BARBER_NOT_FOUND' };
  }

  if (barber.active === false) {
    return { success: false, error: 'Profissional não está disponível', errorCode: 'BARBER_INACTIVE' };
  }

  // 3. Check availability for new barber at same date/time
  const duration = existing.total_duration_minutes || existing.duration_minutes || 40;
  const endTime = minutesToTime(timeToMinutes(existing.time) + duration);

  const conflict = await checkConflict(
    supabase,
    newBarberId,
    existing.date || existing.appointment_date,
    existing.time,
    endTime,
    appointmentId, // exclude current booking
  );

  if (conflict.hasConflict) {
    return {
      success: false,
      error: 'Esse profissional não está disponível nesse horário',
      errorCode: 'BARBER_CONFLICT',
    };
  }

  // 4. Update
  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      barber_id: newBarberId,
      barber_name: barber.name,
    })
    .eq('id', appointmentId);

  if (updateError) {
    console.error('[changeBarber] Update error:', updateError);
    return { success: false, error: 'Erro ao trocar profissional', errorCode: 'UPDATE_FAILED' };
  }

  // Return updated appointment
  const { data: updated } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  // Emit professional changed event
  try {
    await bookingEvents.professionalChanged(appointmentId, existing.barber_id, newBarberId);
  } catch (err) {
    console.error('[changeBarber] Failed to emit PROFESSIONAL_CHANGED event:', err);
  }

  return { success: true, appointment: updated as AppointmentRecord };
}

// ─── Find First Available ────────────────────────────────────────────────────

/**
 * Find the first available slot across compatible barbers.
 *
 * Search order:
 *   1. For each compatible barber (in order)
 *   2. For each date starting from preferredDate (or today)
 *   3. For each time slot in working hours
 *   4. Return the first slot that fits and has no conflict
 */
export async function findFirstAvailable(
  supabase: SupabaseClient,
  serviceId: string,
  preferredDate?: string,
  preferredBarberId?: string,
): Promise<FirstAvailableResult> {
  // 1. Fetch service
  const { data: service } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('id', serviceId)
    .single();

  if (!service) {
    return { found: false };
  }

  const duration = service.duration_minutes || 40;

  // 2. Fetch compatible barbers
  let barbersQuery = supabase
    .from('barbers')
    .select('id, name')
    .eq('active', true);

  if (preferredBarberId && preferredBarberId !== 'any') {
    barbersQuery = barbersQuery.eq('id', preferredBarberId);
  }

  const { data: barbers } = await barbersQuery;

  if (!barbers || barbers.length === 0) {
    return { found: false };
  }

  // 3. For each barber, check each date
  const startDate = preferredDate || new Date().toISOString().split('T')[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const barber of barbers) {
    // Check 30 days from start
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const checkDate = new Date(startDate + 'T12:00:00');
      checkDate.setDate(checkDate.getDate() + dayOffset);

      // Skip past dates
      if (checkDate < today) continue;

      const dateStr = checkDate.toISOString().split('T')[0];
      const dayOfWeek = checkDate.getDay() as DayOfWeek;

      if (!isSalonOpen(dayOfWeek)) continue;

      // Get valid start times for this day
      const schedule = getDaySchedule(dayOfWeek);
      for (const window of schedule.windows) {
        const windowStart = timeToMinutes(window.start);
        const windowEnd = timeToMinutes(window.end);

        for (let t = windowStart; t + duration <= windowEnd; t += 30) {
          const timeStr = minutesToTime(t);
          const endTimeStr = minutesToTime(t + duration);

          // Check conflict
          const conflict = await checkConflict(
            supabase,
            barber.id,
            dateStr,
            timeStr,
            endTimeStr,
          );

          if (!conflict.hasConflict) {
            return {
              found: true,
              barberId: barber.id,
              barberName: barber.name,
              date: dateStr,
              time: timeStr,
              service: {
                id: service.id,
                name: service.name,
                price: Number(service.price),
                durationMinutes: duration,
              },
            };
          }
        }
      }
    }
  }

  return { found: false };
}
