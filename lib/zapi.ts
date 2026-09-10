// ============================================
// SPRINT 7 — INTEGRAÇÃO Z-API WHATSAPP
// ============================================

const ZAPI_BASE_URL = process.env.ZAPI_BASE_URL || 'https://api.z-api.io';
const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID || '';
const ZAPI_TOKEN = process.env.ZAPI_TOKEN || '';
const ZAPI_SECURITY_KEY = process.env.ZAPI_SECURITY_KEY || '';

// -------------------------------------------
// 1. TIPOS
// -------------------------------------------

export interface ZApiMessage {
  phone: string;
  message: string;
}

export interface ZApiImageMessage {
  phone: string;
  image: string;      // URL da imagem
  caption?: string;
}

export interface ZApiDocumentMessage {
  phone: string;
  document: string;   // URL do documento
  fileName: string;
  caption?: string;
}

export interface ZApiButtonsMessage {
  phone: string;
  message: string;
  buttons: { id: string; text: string }[];
  header?: string;
  footer?: string;
}

export interface ZApiListMessage {
  phone: string;
  message: string;
  buttonText: string;
  sections: {
    title: string;
    rows: { id: string; title: string; description?: string }[];
  }[];
}

export interface ZApiWebhookEvent {
  event: 'message' | 'message-update' | 'status' | 'ack';
  instanceId: string;
  data: {
    phone: string;
    from: string;
    to: string;
    body: string;
    id: string;
    timestamp: number;
    type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'buttons_response' | 'list_response';
    fromMe: boolean;
    pushName?: string;
    caption?: string;
    fileName?: string;
    // Para botões e listas
    selectedButtonId?: string;
    singleSelectReply?: { selectedRowId: string };
  };
}

export interface ZApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// -------------------------------------------
// 2. ENVIO DE MENSAGENS
// -------------------------------------------

export async function enviarMensagem(texto: string, phone: string): Promise<ZApiResponse> {
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    console.warn('[Z-API] Credenciais não configuradas. Mensagem não enviada.');
    return { success: false, error: 'Z-API não configurada' };
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `${ZAPI_BASE_URL}/${ZAPI_INSTANCE_ID}/send-text`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_TOKEN,
        ...(ZAPI_SECURITY_KEY ? { 'Security-Key': ZAPI_SECURITY_KEY } : {})
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message: texto
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Z-API] Erro ao enviar mensagem:', result);
      return { success: false, error: result.message || 'Erro ao enviar mensagem' };
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('[Z-API] Erro de conexão:', error.message);
    return { success: false, error: error.message };
  }
}

export async function enviarImagem(imageUrl: string, phone: string, caption?: string): Promise<ZApiResponse> {
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    return { success: false, error: 'Z-API não configurada' };
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `${ZAPI_BASE_URL}/${ZAPI_INSTANCE_ID}/send-image`;

    const body: any = {
      phone: cleanPhone,
      image: imageUrl
    };
    if (caption) body.caption = caption;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_TOKEN,
        ...(ZAPI_SECURITY_KEY ? { 'Security-Key': ZAPI_SECURITY_KEY } : {})
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    return { success: response.ok, data: result, error: response.ok ? undefined : result.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function enviarDocumento(docUrl: string, phone: string, fileName: string, caption?: string): Promise<ZApiResponse> {
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    return { success: false, error: 'Z-API não configurada' };
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `${ZAPI_BASE_URL}/${ZAPI_INSTANCE_ID}/send-document`;

    const body: any = {
      phone: cleanPhone,
      document: docUrl,
      fileName
    };
    if (caption) body.caption = caption;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_TOKEN,
        ...(ZAPI_SECURITY_KEY ? { 'Security-Key': ZAPI_SECURITY_KEY } : {})
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    return { success: response.ok, data: result, error: response.ok ? undefined : result.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function enviarBotoes(
  phone: string,
  message: string,
  buttons: { id: string; text: string }[],
  header?: string,
  footer?: string
): Promise<ZApiResponse> {
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    return { success: false, error: 'Z-API não configurada' };
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `${ZAPI_BASE_URL}/${ZAPI_INSTANCE_ID}/send-buttons`;

    const body: any = {
      phone: cleanPhone,
      message,
      buttons: buttons.slice(0, 3) // Z-API limita a 3 botões
    };
    if (header) body.header = header;
    if (footer) body.footer = footer;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_TOKEN,
        ...(ZAPI_SECURITY_KEY ? { 'Security-Key': ZAPI_SECURITY_KEY } : {})
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    return { success: response.ok, data: result, error: response.ok ? undefined : result.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function enviarLista(
  phone: string,
  message: string,
  buttonText: string,
  sections: {
    title: string;
    rows: { id: string; title: string; description?: string }[];
  }[]
): Promise<ZApiResponse> {
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    return { success: false, error: 'Z-API não configurada' };
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `${ZAPI_BASE_URL}/${ZAPI_INSTANCE_ID}/send-list`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_TOKEN,
        ...(ZAPI_SECURITY_KEY ? { 'Security-Key': ZAPI_SECURITY_KEY } : {})
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message,
        buttonText,
        sections
      })
    });

    const result = await response.json();
    return { success: response.ok, data: result, error: response.ok ? undefined : result.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------
// 3. PROCESSAMENTO DE RESPOSTA DO BRAIN
// -------------------------------------------

export interface BrainResponse {
  reply: string;
  intent: string;
  quickReplies?: { label: string; action: string; payload?: any }[];
  component?: string;
  componentData?: any;
}

/**
 * Envia a resposta do Funcionário Digital via WhatsApp
 * Converte quick replies para o formato apropriado da Z-API
 */
export async function enviarRespostaFuncionario(
  phone: string,
  brainOutput: BrainResponse
): Promise<ZApiResponse> {
  const { reply, quickReplies } = brainOutput;

  // Se tem quick replies, enviar como botões (máximo 3)
  if (quickReplies && quickReplies.length > 0 && quickReplies.length <= 3) {
    const botoes = quickReplies.map(qr => ({
      id: qr.action,
      text: qr.label
    }));

    return enviarBotoes(phone, reply, botoes);
  }

  // Se tem muitos quick replies, enviar como texto com opções numeradas
  if (quickReplies && quickReplies.length > 3) {
    let textoComOpcoes = reply + '\n\n';
    textoComOpcoes += '📋 *Opções:*\n';
    quickReplies.forEach((qr, index) => {
      textoComOpcoes += `${index + 1}. ${qr.label}\n`;
    });
    textoComOpcoes += '\nDigite o número da opção ou envie sua mensagem.';

    return enviarMensagem(textoComOpcoes, phone);
  }

  // Senão, enviar apenas o texto
  return enviarMensagem(reply, phone);
}

// -------------------------------------------
// 4. VALIDAÇÃO DE WEBHOOK
// -------------------------------------------

/**
 * Valida se a requisição vem da Z-API
 * Usa a Security-Key para validar
 */
export function validarWebhook(securityKey?: string): boolean {
  if (!ZAPI_SECURITY_KEY) {
    // Se não tem security key configurada, aceitar (modo desenvolvimento)
    console.warn('[Z-API] Security-Key não configurada. Webhooks não validados.');
    return true;
  }

  return securityKey === ZAPI_SECURITY_KEY;
}

/**
 * Normaliza o número de telefone
 */
export function normalizarPhone(phone: string): string {
  // Remove caracteres não numéricos
  let clean = phone.replace(/\D/g, '');

  // Se começa com 55 (Brasil), manter
  if (clean.startsWith('55')) {
    return clean;
  }

  // Senão, adicionar 55
  return '55' + clean;
}

/**
 * Extrai o número de telefone para busca no banco
 * Remove o código do país para comparação
 */
export function extrairPhoneParaBusca(phone: string): string {
  let clean = phone.replace(/\D/g, '');

  // Remove 55 do início se existir
  if (clean.startsWith('55') && clean.length > 12) {
    clean = clean.substring(2);
  }

  // Remove 0 do início se existir
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }

  return clean;
}

// -------------------------------------------
// 5. CONFIGURAÇÃO E STATUS
// -------------------------------------------

export function isZApiConfigured(): boolean {
  return !!(ZAPI_INSTANCE_ID && ZAPI_TOKEN);
}

export function getZApiConfig(): {
  configured: boolean;
  instanceId: string;
  hasToken: boolean;
  hasSecurityKey: boolean;
} {
  return {
    configured: isZApiConfigured(),
    instanceId: ZAPI_INSTANCE_ID ? '***' + ZAPI_INSTANCE_ID.slice(-4) : 'não configurado',
    hasToken: !!ZAPI_TOKEN,
    hasSecurityKey: !!ZAPI_SECURITY_KEY
  };
}
