import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { enviarMensagemUazapi, isUazapiConfigured } from '@/lib/uazapi';

function createPinHash(phone: string, pin: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';
  return crypto.createHmac('sha256', secret).update(`${phone}:${pin}`).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });

    const cleanPhone = phone.replace(/\D/g, '');
    
    // Generate 4 digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const hash = createPinHash(cleanPhone, pin);

    // Send via Uazapi
    if (isUazapiConfigured()) {
      const msg = `🔒 *Código de Acesso Mamuty*\n\nSeu código PIN para acessar seus agendamentos é: *${pin}*\n\nNão compartilhe este código com ninguém.`;
      await enviarMensagemUazapi(msg, cleanPhone);
    } else {
      console.warn(`[AUTH] Uazapi not configured. Generated PIN for ${cleanPhone}: ${pin}`);
      // Em dev, retornar o pin pra facilitar testes se uazapi falhar, em prod só manda se der.
      // Para evitar que bloqueie se não tiver uazapi configurado, vamos retornar uma flag.
    }

    return NextResponse.json({ 
      success: true, 
      hash,
      requiresUazapi: isUazapiConfigured(),
      debugPin: isUazapiConfigured() ? undefined : pin // Remove in strict prod
    });

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
