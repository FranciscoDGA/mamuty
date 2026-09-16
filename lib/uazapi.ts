// ============================================
// INTEGRAÇÃO UAZAPI WHATSAPP (Mamuty Barbearia)
// ============================================

const UAZAPI_BASE_URL = (process.env.UAZAPI_BASE_URL || 'https://api.uazapi.com').replace(/\/+$/, '');
const UAZAPI_SESSION = process.env.UAZAPI_SESSION || process.env.UAZAPI_INSTANCE || '';
const UAZAPI_TOKEN = process.env.UAZAPI_TOKEN || process.env.UAZAPI_SESSIONKEY || '';
const UAZAPI_SECRET = process.env.UAZAPI_SECRET || '';
const UAZAPI_WEBHOOK_SECRET = process.env.UAZAPI_WEBHOOK_SECRET || '';

// -------------------------------------------
// 1. TIPOS
// -------------------------------------------

export interface UazapiResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}

export interface UazapiConfig {
  configured: boolean;
  baseUrl: string;
  session: string;
  hasToken: boolean;
  hasWebhookSecret: boolean;
}

// -------------------------------------------
// 2. UTILITÁRIOS
// -------------------------------------------

export function isUazapiConfigured(): boolean {
  return Boolean(UAZAPI_BASE_URL && UAZAPI_TOKEN && UAZAPI_SESSION);
}

export function getUazapiConfig(): UazapiConfig {
  return {
    configured: isUazapiConfigured(),
    baseUrl: UAZAPI_BASE_URL,
    session: UAZAPI_SESSION,
    hasToken: Boolean(UAZAPI_TOKEN),
    hasWebhookSecret: Boolean(UAZAPI_WEBHOOK_SECRET),
  };
}

/**
 * Normaliza o telefone para o padrão do WhatsApp (55 + DDD + Número)
 */
export function normalizarTelefoneUazapi(phone: string): string {
  let clean = phone.replace(/\D/g, '');

  // Se vier com sufixo @c.us ou @s.whatsapp.net já tratado
  if (clean.length === 10 || clean.length === 11) {
    // Número brasileiro sem DDI 55
    clean = '55' + clean;
  }

  return clean;
}

/**
 * Valida a chave secreta enviada pelo Webhook da Uazapi
 */
export function validarWebhookUazapi(receivedSecret?: string): boolean {
  if (!UAZAPI_WEBHOOK_SECRET) {
    return true; // Se não configurou secret de webhook, aceita requisição
  }
  return receivedSecret === UAZAPI_WEBHOOK_SECRET;
}

// -------------------------------------------
// 3. ENVIO DE MENSAGENS
// -------------------------------------------

/**
 * Envia mensagem de texto via Uazapi
 * Suporta formatos padrão Uazapi / uazapiGO
 */
export async function enviarMensagemUazapi(texto: string, phone: string): Promise<UazapiResponse> {
  if (!isUazapiConfigured()) {
    console.warn('[Uazapi] Credenciais não configuradas. Mensagem não enviada.');
    return { success: false, error: 'Uazapi não configurada' };
  }

  const cleanPhone = normalizarTelefoneUazapi(phone);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'token': UAZAPI_TOKEN,
    'sessionkey': UAZAPI_TOKEN,
    'Client-Token': UAZAPI_TOKEN,
    'Authorization': `Bearer ${UAZAPI_TOKEN}`,
  };

  if (UAZAPI_SECRET) {
    headers['secret'] = UAZAPI_SECRET;
  }

  // Tenta o endpoint principal /sendText da Uazapi
  const primaryUrl = `${UAZAPI_BASE_URL}/sendText`;
  const payload = {
    session: UAZAPI_SESSION,
    instance: UAZAPI_SESSION,
    number: cleanPhone,
    phone: cleanPhone,
    text: texto,
    message: texto,
  };

  try {
    const response = await fetch(primaryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Fallback para endpoint alternativo /message/sendText ou instanciado
      const fallbackUrl = `${UAZAPI_BASE_URL}/message/sendText`;
      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json().catch(() => ({}));
        return { success: true, data: fallbackData };
      }

      console.error('[Uazapi] Falha no envio:', data);
      return {
        success: false,
        statusCode: response.status,
        error: data.message || data.error || 'Erro ao enviar via Uazapi',
        data,
      };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[Uazapi] Erro na requisição HTTP:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Envia imagem ou documento via Uazapi
 */
export async function enviarMidiaUazapi(
  phone: string,
  mediaUrl: string,
  caption?: string,
  tipo: 'image' | 'document' = 'image'
): Promise<UazapiResponse> {
  if (!isUazapiConfigured()) {
    return { success: false, error: 'Uazapi não configurada' };
  }

  const cleanPhone = normalizarTelefoneUazapi(phone);
  const endpoint = tipo === 'document' ? `${UAZAPI_BASE_URL}/sendFile` : `${UAZAPI_BASE_URL}/sendMedia`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': UAZAPI_TOKEN,
        'sessionkey': UAZAPI_TOKEN,
        'Authorization': `Bearer ${UAZAPI_TOKEN}`,
      },
      body: JSON.stringify({
        session: UAZAPI_SESSION,
        number: cleanPhone,
        media: mediaUrl,
        url: mediaUrl,
        caption: caption || '',
      }),
    });

    const data = await response.json().catch(() => ({}));
    return { success: response.ok, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Verifica o status da conexão da instância/sessão na Uazapi
 */
export async function verificarStatusUazapi(): Promise<{ online: boolean; state: string; details?: any }> {
  if (!isUazapiConfigured()) {
    return { online: false, state: 'not_configured' };
  }

  try {
    const url = `${UAZAPI_BASE_URL}/status?session=${encodeURIComponent(UAZAPI_SESSION)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'token': UAZAPI_TOKEN,
        'sessionkey': UAZAPI_TOKEN,
        'Authorization': `Bearer ${UAZAPI_TOKEN}`,
      },
    });

    if (!response.ok) {
      return { online: false, state: `http_${response.status}` };
    }

    const data = await response.json().catch(() => ({}));
    const state = data.state || data.status || (data.connected ? 'CONNECTED' : 'DISCONNECTED');
    const isOnline = state === 'CONNECTED' || state === 'open' || state === 'online' || data.connected === true;

    return {
      online: isOnline,
      state: String(state).toLowerCase(),
      details: data,
    };
  } catch (e: any) {
    return { online: false, state: 'error', details: e.message };
  }
}

/**
 * Wrapper de resposta do Funcionário Digital Alfred compatível com Uazapi
 */
export async function enviarRespostaFuncionarioUazapi(
  phone: string,
  resposta: { reply: string; intent?: string }
): Promise<UazapiResponse> {
  return enviarMensagemUazapi(resposta.reply, phone);
}
