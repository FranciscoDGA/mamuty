/**
 * app/api/notifications/route.ts
 *
 * Official In-App Notification Center API (Sprint 04).
 *
 * GET   /api/notifications — Retrieve notifications & unread count
 * PATCH /api/notifications — Mark notification(s) as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const recipientType = searchParams.get('type') || (phone ? 'customer' : 'store');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      query = query
        .eq('recipient_type', 'customer')
        .eq('recipient_phone', cleanPhone);
    } else if (recipientType) {
      query = query.eq('recipient_type', recipientType);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('[GET /api/notifications] Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
    }

    // Count unread
    let unreadCount = 0;
    if (notifications) {
      unreadCount = notifications.filter((n) => !n.read_at).length;
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount,
    });
  } catch (err) {
    console.error('[GET /api/notifications] Error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, all, phone, recipientType } = body;
    const nowIso = new Date().toISOString();

    // Case 1: Mark single notification as read
    if (id) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read_at: nowIso })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Notificação marcada como lida' });
    }

    // Case 2: Mark all as read
    if (all) {
      let query = supabaseAdmin
        .from('notifications')
        .update({ read_at: nowIso })
        .is('read_at', null);

      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        query = query.eq('recipient_phone', cleanPhone);
      } else if (recipientType) {
        query = query.eq('recipient_type', recipientType);
      }

      const { error } = await query;

      if (error) {
        return NextResponse.json({ error: 'Erro ao marcar todas como lidas' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Todas as notificações marcadas como lidas' });
    }

    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  } catch (err) {
    console.error('[PATCH /api/notifications] Error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
