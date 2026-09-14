/**
 * POST /api/bookings — Create a new booking
 * GET  /api/bookings — List bookings (by phone or all for admin)
 *
 * Backend is the authority. Frontend sends intent only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createBooking, type BookingInput } from '@/lib/booking/service';
import { checkApiRateLimit } from '@/lib/rateLimit';

// ─── POST: Create Booking ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkApiRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em instantes.' },
        { status: 429 },
      );
    }

    const body = await request.json();

    // Extract booking input
    const input: BookingInput = {
      serviceId: body.serviceId,
      barberId: body.barberId,
      date: body.date,
      time: body.time,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      paymentMethod: body.paymentMethod || 'presencial',
      idempotencyKey: body.idempotencyKey,
    };

    // Execute booking through service layer
    const result = await createBooking(supabaseAdmin, input);

    if (!result.success) {
      const statusCode =
        result.errorCode === 'CONFLICT' ? 409 :
        result.errorCode === 'VALIDATION_ERROR' ? 422 :
        result.errorCode === 'SERVICE_NOT_FOUND' ? 404 :
        result.errorCode === 'BARBER_NOT_FOUND' ? 404 :
        400;

      return NextResponse.json(
        { error: result.error, code: result.errorCode },
        { status: statusCode },
      );
    }

    return NextResponse.json(
      {
        success: true,
        appointment: result.appointment,
        message: 'Agendamento confirmado!',
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/bookings] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

// ─── GET: List Bookings ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(limit);

    // Filter by phone (required for non-admin)
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      query = query.eq('customer_phone', cleanPhone);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by date range
    if (from) {
      query = query.gte('date', from);
    }
    if (to) {
      query = query.lte('date', to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/bookings] Supabase error:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar agendamentos' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      appointments: data || [],
      total: data?.length || 0,
    });
  } catch (err) {
    console.error('[GET /api/bookings] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
