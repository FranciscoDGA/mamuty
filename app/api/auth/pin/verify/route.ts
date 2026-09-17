import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function createPinHash(phone: string, pin: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';
  return crypto.createHmac('sha256', secret).update(`${phone}:${pin}`).digest('hex');
}

export function createSessionHash(phone: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';
  return crypto.createHmac('sha256', secret).update(`${phone}:VERIFIED_SESSION`).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { phone, pin, hash } = await request.json();
    
    if (!phone || !pin || !hash) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const expectedHash = createPinHash(cleanPhone, pin);

    if (expectedHash !== hash) {
      return NextResponse.json({ error: 'Código PIN inválido ou expirado' }, { status: 401 });
    }

    const sessionHash = createSessionHash(cleanPhone);

    return NextResponse.json({ success: true, sessionHash });
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
