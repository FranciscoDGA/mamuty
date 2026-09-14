/**
 * GET /api/bookings/first-available — Find first available slot
 *
 * Query params:
 *   serviceId (required) — service UUID
 *   preferredDate (optional) — YYYY-MM-DD, defaults to today
 *   barberId (optional) — barber UUID, defaults to any compatible
 *
 * Returns the first available barber + date + time combination.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findFirstAvailable } from '@/lib/booking/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const preferredDate = searchParams.get('preferredDate') || undefined;
    const barberId = searchParams.get('barberId') || undefined;

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Parâmetro "serviceId" é obrigatório' },
        { status: 400 },
      );
    }

    const result = await findFirstAvailable(
      supabaseAdmin,
      serviceId,
      preferredDate,
      barberId,
    );

    if (!result.found) {
      return NextResponse.json({
        success: true,
        found: false,
        message: 'Nenhum horário disponível encontrado nos próximos 30 dias',
      });
    }

    return NextResponse.json({
      success: true,
      found: true,
      barberId: result.barberId,
      barberName: result.barberName,
      date: result.date,
      time: result.time,
      service: result.service,
    });
  } catch (err) {
    console.error('[GET /api/bookings/first-available] Error:', err);
    return NextResponse.json(
      { error: 'Erro ao buscar primeiro disponível' },
      { status: 500 },
    );
  }
}
