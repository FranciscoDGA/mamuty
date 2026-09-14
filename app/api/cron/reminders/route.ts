/**
 * app/api/cron/reminders/route.ts
 *
 * Automated periodic reminder execution endpoint (Sprint 04).
 * Supports both GET and POST for cron jobs (Vercel cron, EasyCron, curl).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { processDueReminders } from '@/lib/notifications/service';

async function handleRemindersCron(request: NextRequest) {
  try {
    // Optional secret check if CRON_SECRET is configured
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow internal/vercel requests, otherwise reject unauthorized
      const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
      if (!isVercelCron) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    }

    const result = await processDueReminders(supabaseAdmin);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[cron/reminders] Error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleRemindersCron(request);
}

export async function POST(request: NextRequest) {
  return handleRemindersCron(request);
}
