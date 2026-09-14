import { NextResponse } from 'next/server';
import { alfredChat, AlfredMessage } from '@/lib/alfred/service';

export const dynamic = 'force-dynamic';

interface AlfredRequest {
  message: string;
  history?: AlfredMessage[];
  services?: { id: string; name: string; price: number; duration: number }[];
  barbers?: { id: string; name: string; services: string[] }[];
  appointments?: { id: string; barberId: string; date: string; time: string; status: string }[];
  customer?: { id: string; name: string; email?: string } | null;
}

export async function POST(req: Request) {
  const body: AlfredRequest = await req.json();

  if (!body.message || typeof body.message !== 'string') {
    return NextResponse.json({ error: 'Mensagem é obrigatória.' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: 'Olá! Sou o Alfred, assistente da Mamuty Barbearia. No momento estou em modo limitado. Para agendar, acesse: https://mamuty.vercel.app/agendar'
    });
  }

  const response = await alfredChat(body.message, {
    services: (body.services || []) as any,
    barbers: (body.barbers || []) as any,
    appointments: (body.appointments || []) as any,
    currentCustomer: (body.customer || null) as any,
    conversationHistory: body.history || [],
  });

  return NextResponse.json(response);
}
