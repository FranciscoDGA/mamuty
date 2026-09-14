/**
 * app/api/notifications/push-subscribe/route.ts
 *
 * Web Push Subscription API for PWA (Sprint 04).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, targetIdentifier, subscription } = body;

    if (!targetIdentifier || !subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Dados de inscrição incompletos' }, { status: 400 });
    }

    const cleanIdentifier = targetType === 'customer'
      ? targetIdentifier.replace(/\D/g, '')
      : targetIdentifier;

    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insert or update subscription
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({
        target_type: targetType || 'customer',
        target_identifier: cleanIdentifier,
        subscription,
        user_agent: userAgent,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'target_type,target_identifier,(subscription->>endpoint)',
      });

    if (error) {
      console.error('[push-subscribe] Error inserting subscription:', error);
      return NextResponse.json({ error: 'Erro ao salvar inscrição push' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Inscrição push salva com sucesso' });
  } catch (err) {
    console.error('[push-subscribe] Unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
