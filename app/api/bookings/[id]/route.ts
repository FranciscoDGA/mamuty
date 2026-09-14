/**
 * GET    /api/bookings/[id] — Get single booking
 * PATCH  /api/bookings/[id] — Update booking (reschedule, change barber, cancel)
 * DELETE /api/bookings/[id] — Cancel booking
 *
 * All operations verify phone-based authorization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  cancelBooking,
  rescheduleBooking,
  changeBarber,
} from '@/lib/booking/service';

// ─── GET: Fetch single booking ───────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id);

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 },
      );
    }

    // Authorization: phone must match (if provided)
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const aptPhone = data.customer_phone?.replace(/\D/g, '') || '';
      if (cleanPhone !== aptPhone) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 403 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      appointment: data,
    });
  } catch (err) {
    console.error('[GET /api/bookings/:id] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

// ─── PATCH: Update booking ───────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const phone = body.phone || request.headers.get('x-customer-phone');

    // Determine action from body
    const { date, time, barberId, status } = body;

    // Cancel
    if (status === 'cancelled') {
      const result = await cancelBooking(supabaseAdmin, id, phone || undefined);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 },
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Agendamento cancelado',
      });
    }

    // Reschedule (new date/time)
    if (date && time) {
      const result = await rescheduleBooking(
        supabaseAdmin,
        id,
        date,
        time,
        barberId || undefined,
        phone || undefined,
      );

      if (!result.success) {
        const statusCode =
          result.errorCode === 'CONFLICT' ? 409 :
          result.errorCode === 'UNAUTHORIZED' ? 403 :
          400;

        return NextResponse.json(
          { error: result.error, code: result.errorCode },
          { status: statusCode },
        );
      }

      return NextResponse.json({
        success: true,
        appointment: result.appointment,
        message: 'Agendamento remarcado',
      });
    }

    // Change barber only
    if (barberId && !date && !time) {
      const result = await changeBarber(
        supabaseAdmin,
        id,
        barberId,
        phone || undefined,
      );

      if (!result.success) {
        const statusCode =
          result.errorCode === 'BARBER_CONFLICT' ? 409 :
          result.errorCode === 'UNAUTHORIZED' ? 403 :
          400;

        return NextResponse.json(
          { error: result.error, code: result.errorCode },
          { status: statusCode },
        );
      }

      return NextResponse.json({
        success: true,
        appointment: result.appointment,
        message: 'Profissional alterado',
      });
    }

    return NextResponse.json(
      { error: 'Ação não especificada' },
      { status: 400 },
    );
  } catch (err) {
    console.error('[PATCH /api/bookings/:id] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

// ─── DELETE: Cancel booking ──────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    const result = await cancelBooking(supabaseAdmin, id, phone || undefined);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Agendamento cancelado',
    });
  } catch (err) {
    console.error('[DELETE /api/bookings/:id] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
