import { NextResponse } from 'next/server';
import { enviarMensagemUazapi } from '@/lib/uazapi';

export async function GET() {
  const result = await enviarMensagemUazapi('Teste direto da Vercel (Debug) 🚀', '559484439065');
  
  return NextResponse.json({
    debug: true,
    sendResult: result
  });
}
