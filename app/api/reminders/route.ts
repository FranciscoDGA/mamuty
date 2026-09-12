import { NextRequest, NextResponse } from 'next/server';
import { sendReminders } from '@/lib/reminders';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Proteger endpoint: só aceitar chamadas do próprio servidor ou com chave de API
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn(`[Reminders] Acesso não autorizado de IP: ${ip}`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendReminders();

  return Response.json({
    success: result.errors.length === 0,
    ...result,
    timestamp: new Date().toISOString()
  });
}
