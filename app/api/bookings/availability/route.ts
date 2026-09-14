/**
 * GET /api/bookings/availability — Check available time slots
 *
 * Query params:
 *   date (required) — YYYY-MM-DD
 *   serviceId (required) — service UUID
 *   barberId (optional) — barber UUID or 'any'
 *   duration (optional) — override service duration (minutes)
 *
 * Uses the Sprint 02 availability engine as authority.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { consultarDisponibilidade } from '@/lib/availability';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');
    const barberId = searchParams.get('barberId');
    const duration = searchParams.get('duration');

    // Validate required params
    if (!date) {
      return NextResponse.json(
        { error: 'Parâmetro "date" é obrigatório' },
        { status: 400 },
      );
    }

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Parâmetro "serviceId" é obrigatório' },
        { status: 400 },
      );
    }

    // Fetch service to get duration
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single();

    const serviceDuration = duration
      ? parseInt(duration)
      : service?.duration_minutes || 40;

    // Fetch all barbers
    const { data: barbers } = await supabaseAdmin
      .from('barbers')
      .select('id, name, active')
      .eq('active', true);

    // Fetch appointments for this date
    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('id, barber_id, date, time, total_duration_minutes, duration_minutes, status')
      .eq('date', date)
      .not('status', 'eq', 'cancelled');

    // Fetch barber schedules, blocked slots, closed days
    // These are in localStorage on the client, but we need them server-side
    // For now, use empty arrays — these will be added to Supabase in future sprints
    const barberSchedules: any[] = [];
    const blockedSlots: any[] = [];
    const closedDays: any[] = [];

    // Format appointments for the availability engine
    const formattedAppointments = (appointments || []).map((apt: any) => ({
      id: apt.id,
      barberId: apt.barber_id,
      date: apt.date,
      time: apt.time?.substring(0, 5) || '',
      totalDurationMinutes: apt.total_duration_minutes || apt.duration_minutes || 40,
      status: apt.status,
    }));

    // Format barbers for the engine
    const formattedBarbers = (barbers || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      active: b.active,
      availableDays: [0, 1, 2, 3, 4, 5, 6],
    }));

    // Run availability engine
    const result = consultarDisponibilidade(
      {
        data: date,
        barberId: barberId || undefined,
        serviceDurationMinutes: serviceDuration,
      },
      formattedAppointments as any,
      formattedBarbers as any,
      barberSchedules as any,
      blockedSlots as any,
      closedDays as any,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[GET /api/bookings/availability] Error:', err);
    return NextResponse.json(
      { error: 'Erro ao consultar disponibilidade' },
      { status: 500 },
    );
  }
}
