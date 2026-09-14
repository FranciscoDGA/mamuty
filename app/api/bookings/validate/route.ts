/**
 * POST /api/bookings/validate — Validate booking intent
 *
 * Body: { serviceId, barberId, date, time }
 *
 * Validates all business rules WITHOUT creating the booking.
 * Useful for frontend to verify before showing "Confirmar" button.
 *
 * Returns: { valid, errors[], suggestions? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateBookingInput, checkConflict, type BookingInput } from '@/lib/booking/service';
import { doesServiceFitInDay, isSalonOpen, timeToMinutes, minutesToTime } from '@/lib/businessHours';
import type { DayOfWeek } from '@/lib/businessHours';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input: BookingInput = {
      serviceId: body.serviceId,
      barberId: body.barberId || 'any',
      date: body.date,
      time: body.time,
      customerName: body.customerName || 'validação',
      customerPhone: body.customerPhone || '00000000000',
      paymentMethod: body.paymentMethod || 'presencial',
    };

    // 1. Basic validation
    const validation = validateBookingInput(input);
    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        errors: validation.errors,
      });
    }

    const errors: string[] = [];

    // 2. Check service exists
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('id, duration_minutes, active')
      .eq('id', input.serviceId)
      .single();

    if (!service) {
      errors.push('Serviço não encontrado');
      return NextResponse.json({ valid: false, errors });
    }

    if (service.active === false) {
      errors.push('Serviço não está disponível');
      return NextResponse.json({ valid: false, errors });
    }

    const duration = service.duration_minutes || 40;

    // 3. Check barber exists (if specific)
    if (input.barberId && input.barberId !== 'any') {
      const { data: barber } = await supabaseAdmin
        .from('barbers')
        .select('id, active')
        .eq('id', input.barberId)
        .single();

      if (!barber) {
        errors.push('Profissional não encontrado');
      } else if (barber.active === false) {
        errors.push('Profissional não está disponível');
      }
    }

    // 4. Check time fits in working window
    const dayOfWeek = new Date(input.date + 'T12:00:00').getDay() as DayOfWeek;
    const serviceEnd = minutesToTime(timeToMinutes(input.time) + duration);

    if (!isSalonOpen(dayOfWeek)) {
      errors.push('Barbearia fechada nesse dia');
    } else if (!doesServiceFitInDay(dayOfWeek, input.time, serviceEnd)) {
      if (dayOfWeek === 0 && timeToMinutes(input.time) >= 720) {
        errors.push('Domingo: atendimento apenas das 08:00 às 12:00');
      } else if (timeToMinutes(input.time) >= 720 && timeToMinutes(input.time) < 840) {
        errors.push('Intervalo de almoço: 12:00 às 14:00');
      } else if (timeToMinutes(serviceEnd) > 1200) {
        errors.push('Horário ultrapassa fechamento (20:00)');
      } else {
        errors.push('Serviço não cabe nessa janela de horário');
      }
    }

    // 5. Check conflict
    if (errors.length === 0) {
      const barberToCheck = input.barberId === 'any' ? null : input.barberId;

      if (barberToCheck) {
        const conflict = await checkConflict(
          supabaseAdmin,
          barberToCheck,
          input.date,
          input.time,
          serviceEnd,
        );

        if (conflict.hasConflict) {
          errors.push('Esse horário acabou de ficar indisponível');
        }
      }
      // For 'any' barber, we'd need to check each compatible barber
      // For simplicity, skip conflict check for 'any' in validate endpoint
    }

    return NextResponse.json({
      valid: errors.length === 0,
      errors,
    });
  } catch (err) {
    console.error('[POST /api/bookings/validate] Error:', err);
    return NextResponse.json(
      { error: 'Erro ao validar agendamento' },
      { status: 500 },
    );
  }
}
