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
 * Envia mensagem de texto via Uazapi GO v2.1
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
  };

  const primaryUrl = `${UAZAPI_BASE_URL}/send/text`;
  const payload = {
    number: cleanPhone,
    text: texto,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(primaryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
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
 * Envia imagem ou documento via Uazapi GO v2.1
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
  const endpoint = `${UAZAPI_BASE_URL}/send/media`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': UAZAPI_TOKEN,
      },
      body: JSON.stringify({
        number: cleanPhone,
        type: tipo,
        media: mediaUrl,
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
