// ============================================
// API ROUTE — LEMBRETES WHATSAPP
// ============================================
// Chama a função de lembretes e retorna o resultado
// Pode ser chamado por um cron job externo (ex: cron-job.org)

import { sendReminders } from '@/lib/reminders';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await sendReminders();
  
  return Response.json({
    success: result.errors.length === 0,
    ...result,
    timestamp: new Date().toISOString()
  });
}
