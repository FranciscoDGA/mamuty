import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  enviarMensagemUazapi,
  isUazapiConfigured,
  normalizarTelefoneUazapi,
  validarWebhookUazapi,
} from '@/lib/uazapi';
import { alfredChat } from '@/lib/alfred/service';
import { pensarEResponderAlfred, BrainContext } from '@/lib/ai/brain';
import { obterOuCriarSessao, logConversation, atualizarSessao } from '@/lib/ai/conversationLog';
import { Appointment, Barber, Customer, Service } from '@/lib/types';
import { MAMUTY_KNOWLEDGE_BASE } from '@/lib/ai/knowledgeBase';
import { processarNovoAgendamento, processarConclusaoAtendimento } from '@/lib/ai/automation';
import { adicionarJobs } from '@/lib/ai/automationQueue';
import { checkBookingRateLimit, checkApiRateLimit } from '@/lib/rateLimit';

// ============================================
// WEBHOOK UAZAPI WHATSAPP (Mamuty Barbearia)
// ============================================

const latestPayloads: { time: string; raw: string }[] = [];

const clienteContexto: Map<
  string,
  {
    conversationHistory: { role: 'user' | 'assistant'; content: string }[];
    activeDraft: any;
    currentCustomer: Customer | null;
  }
> = new Map();

/**
 * GET /api/webhooks/uazapi
 * Endpoint para teste de conectividade e validação da Uazapi
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Mamuty WhatsApp Webhook (Uazapi)',
    configured: isUazapiConfigured(),
    timestamp: new Date().toISOString(),
    recentPayloads: latestPayloads,
  });
}

/**
 * POST /api/webhooks/uazapi
 * Recebe mensagens e eventos do WhatsApp enviados pela Uazapi
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // LOG RAW para diagnóstico
    const rawBody = await request.clone().text();
    console.log('[Webhook Uazapi] RAW BODY:', rawBody.substring(0, 2000));

    // Salvar payload para diagnóstico via GET /api/webhooks/uazapi
    latestPayloads.unshift({ time: new Date().toISOString(), raw: rawBody.substring(0, 3000) });
    if (latestPayloads.length > 5) latestPayloads.pop();

    // 1. Validação do Secret (se configurado)
    const secretHeader =
      request.headers.get('secret') ||
      request.headers.get('x-webhook-secret') ||
      request.headers.get('security-key') ||
      request.headers.get('token') ||
      undefined;

    const url = new URL(request.url);
    const secretQuery = url.searchParams.get('secret') || undefined;
    const providedSecret = secretHeader || secretQuery;

    if (!validarWebhookUazapi(providedSecret)) {
      console.warn('[Webhook Uazapi] Secret inválido. Requisição rejeitada.');
      return NextResponse.json({ ok: false, error: 'Unauthorized secret' }, { status: 401 });
    }

    // 2. Parse do payload da Uazapi
    const body = await request.json();

    // Uazapi pode enviar eventos em múltiplos formatos (uazapiGO, standard webhook, etc.)
    // Exemplos:
    // A) { session: '...', phone: '5594...', text: '...', fromMe: false }
    // B) { event: 'onmessage', data: { from: '5594...@c.us', body: '...', fromMe: false } }
    // C) { event: 'messages.upsert', data: { key: { remoteJid: '...', fromMe: false }, message: { conversation: '...' } } }

    const rawData = body.data || body.message || body;

    // Verificar se a mensagem foi enviada pelo próprio bot/número (evitar loop)
    const fromMe =
      body.fromMe === true ||
      rawData.fromMe === true ||
      rawData.key?.fromMe === true ||
      body.event === 'messages.update' ||
      body.event === 'ack';

    if (fromMe) {
      return NextResponse.json({ ok: true, ignored: 'fromMe' });
    }

    // Extrair identificador de telefone / remetente
    let rawFrom =
      rawData.sender_pn ||       // ← PRIORIDADE: telefone real do remetente
      rawData.from ||
      rawData.phone ||
      rawData.sender ||
      rawData.chatid ||
      rawData.key?.remoteJid ||
      rawData.message?.key?.remoteJid ||
      body.data?.message?.key?.remoteJid ||
      body.phone ||
      body.from ||
      body.sender ||
      body.chatid ||
      '';

    // Fallback: buscar o primeiro remoteJid na string do json se nada der certo
    if (!rawFrom) {
      const match = JSON.stringify(body).match(/"remoteJid":"([^"]+)"/);
      if (match) rawFrom = match[1];
    }
    if (!rawFrom) {
      const match2 = JSON.stringify(body).match(/"sender":"([^"]+)"/);
      if (match2) rawFrom = match2[1];
    }

    // Log the raw extraction for debugging
    console.log(`[Webhook Uazapi] rawFrom="${rawFrom}", from="${rawData.from || ''}", phone="${rawData.phone || ''}", sender="${JSON.stringify(rawData.sender || '')}", remoteJid="${rawData.key?.remoteJid || ''}"`);
    console.log(`[Webhook Uazapi] RAW DATA keys: ${Object.keys(rawData).join(', ')}`);
    console.log(`[Webhook Uazapi] RAW DATA full: ${JSON.stringify(rawData).substring(0, 800)}`);

    // If rawFrom is a LID format (no @c.us/@s.whatsapp.net), try to find actual phone
    if (rawFrom && (rawFrom.includes('@lid') || rawFrom.replace(/\D/g, '').length >= 14)) {
      console.warn(`[Webhook Uazapi] Detected possible LID format: ${rawFrom} — searching for actual phone number`);
      // Try alternative fields aggressively
      const candidates = [
        rawData.sender?.phone,
        rawData.sender?.phoneNumber,
        rawData.sender,
        rawData.pushPhone,
        rawData.phone,
        rawData.contact?.phone,
        rawData.notify,
        rawData.verifiedName,
        rawData.participant,
      ].filter(Boolean);
      
      console.log(`[Webhook Uazapi] Phone candidates: ${JSON.stringify(candidates)}`);
      
      for (const candidate of candidates) {
        if (typeof candidate === 'string') {
          const stripped = candidate.replace(/@.*$/, '').replace(/\D/g, '');
          if (stripped.length >= 10 && stripped.length <= 13) {
            rawFrom = candidate;
            console.log(`[Webhook Uazapi] Found valid phone from candidates: ${rawFrom}`);
            break;
          }
        }
      }
    }

    // Ignorar grupos do WhatsApp
    if (typeof rawFrom === 'string' && (rawFrom.includes('@g.us') || rawFrom.includes('-'))) {
      return NextResponse.json({ ok: true, ignored: 'group_message' });
    }

    // Extrair texto da mensagem
    let messageBody = '';
    if (typeof body.text === 'string') messageBody = body.text;
    else if (typeof rawData.body === 'string') messageBody = rawData.body;
    else if (typeof rawData.text === 'string') messageBody = rawData.text;
    else if (typeof rawData.message?.conversation === 'string') messageBody = rawData.message.conversation;
    else if (typeof rawData.message?.extendedTextMessage?.text === 'string') messageBody = rawData.message.extendedTextMessage.text;
    else if (typeof body.data?.message?.message?.conversation === 'string') messageBody = body.data.message.message.conversation;
    else if (typeof body.data?.message?.message?.extendedTextMessage?.text === 'string') messageBody = body.data.message.message.extendedTextMessage.text;
    else if (typeof body.message === 'string') messageBody = body.message;

    // Fallback agressivo para o texto
    if (!messageBody) {
      const textMatch = JSON.stringify(body).match(/"conversation":"([^"]+)"/);
      if (textMatch) messageBody = textMatch[1];
    }
    if (!messageBody) {
      const textMatch2 = JSON.stringify(body).match(/"text":"([^"]+)"/);
      if (textMatch2) messageBody = textMatch2[1];
    }


    messageBody = messageBody.trim();

    // Extrair nome do remetente
    const pushName =
      rawData.pushName ||
      rawData.sender?.name ||
      rawData.name ||
      body.pushName ||
      'Cliente';

    // Normalizar telefone
    const cleanPhone = normalizarTelefoneUazapi(String(rawFrom));

    if (!cleanPhone || cleanPhone.length < 10) {
      console.warn(`[Webhook Uazapi] Telefone inválido após normalização: rawFrom="${rawFrom}" -> cleanPhone="${cleanPhone}". Ignorando.`);
      return NextResponse.json({ ok: true, ignored: 'invalid_phone', rawFrom });
    }

    if (!messageBody) {
      return NextResponse.json({ ok: true, ignored: 'empty_payload_or_no_text' });
    }

    // 3. Rate limiting de segurança
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const apiRateLimit = checkApiRateLimit(ip);
    if (!apiRateLimit.allowed) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const bookingRateLimit = checkBookingRateLimit(cleanPhone);
    if (!bookingRateLimit.allowed) {
      return NextResponse.json({ ok: false, error: 'Too many requests from this number' }, { status: 429 });
    }

    console.log(`[Webhook Uazapi] Mensagem recebida de ${cleanPhone}: "${messageBody}"`);

    // 4. Buscar cliente existente no banco Supabase
    let cliente: Customer | null = null;
    const phoneDDD = cleanPhone.replace(/^55/, '');

    try {
      const { data: clientes } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.eq.${cleanPhone},phone.eq.${phoneDDD},phone.like.%${phoneDDD}`)
        .limit(1);

      if (clientes && clientes.length > 0) {
        cliente = {
          id: clientes[0].id,
          name: clientes[0].name,
          phone: clientes[0].phone,
          email: clientes[0].email || '',
          totalVisits: clientes[0].total_visits || 0,
          totalSpent: clientes[0].total_spent || 0,
          loyaltyStamps: clientes[0].loyalty_stamps || 0,
          loyaltyPoints: clientes[0].loyalty_points || 0,
          tier: clientes[0].tier || 'Bronze',
          createdAt: clientes[0].created_at,
        };
      }
    } catch (e) {
      console.warn('[Webhook Uazapi] Aviso ao buscar cliente:', e);
    }

    // 5. Sessão e Histórico
    const sessao = await obterOuCriarSessao(cleanPhone, cliente?.name || pushName);

    await logConversation({
      clientPhone: cleanPhone,
      clientName: cliente?.name || pushName,
      direction: 'incoming',
      message: messageBody,
      status: 'success',
    });

    const contextoCliente = sessao.context || {
      conversationHistory: [],
      activeDraft: {},
      currentCustomer: cliente,
    };

    if (cliente && !contextoCliente.currentCustomer) {
      contextoCliente.currentCustomer = cliente;
    }

    // Limitar histórico de conversas para não estourar payload
    if (!contextoCliente.conversationHistory) contextoCliente.conversationHistory = [];
    contextoCliente.conversationHistory.push({
      role: 'user',
      content: messageBody,
    });
    if (contextoCliente.conversationHistory.length > 20) {
      contextoCliente.conversationHistory = contextoCliente.conversationHistory.slice(-20);
    }

    // 6. Preparar catálogo de serviços, barbeiros e agendamentos
    let services: Service[] = [];
    let barbers: Barber[] = [];
    let appointments: Appointment[] = [];

    try {
      const { data: dbServices } = await supabase.from('services').select('*').eq('active', true);
      if (dbServices && dbServices.length > 0) {
        services = dbServices.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category || 'cabelo',
          description: s.description || '',
          price: Number(s.price),
          durationMinutes: s.duration_minutes || 30,
          pointsReward: s.points_reward || 0,
          active: s.active,
        }));
      }
    } catch {
      services = MAMUTY_KNOWLEDGE_BASE.servicos.map((s) => ({
        id: s.id,
        name: s.nome,
        category: 'cabelo',
        description: s.descricao,
        price: s.preco,
        durationMinutes: s.duracaoMinutos,
        pointsReward: 0,
        active: true,
      }));
    }

    try {
      const { data: dbBarbers } = await supabase.from('barbers').select('*').eq('active', true);
      if (dbBarbers && dbBarbers.length > 0) {
        barbers = dbBarbers.map((b) => ({
          id: b.id,
          name: b.name,
          role: b.role || 'barbeiro',
          avatarUrl: b.avatar_url || '',
          rating: b.rating || 0,
          reviewsCount: b.reviews_count || 0,
          specialties: b.specialties || [],
          phone: b.phone || '',
          bio: b.bio || '',
          availableDays: b.available_days || [1, 2, 3, 4, 5, 6],
        }));
      }
    } catch {
      barbers = MAMUTY_KNOWLEDGE_BASE.barbeiros.map((b) => ({
        id: b.id,
        name: b.nome,
        role: b.especialidades?.[0] || 'Barbeiro',
        avatarUrl: '/logo.png',
        rating: 5,
        reviewsCount: 100,
        specialties: b.especialidades || [],
        phone: '',
        bio: '',
        availableDays: [1, 2, 3, 4, 5, 6],
      }));
    }

    try {
      const { data: dbAppointments } = await supabase
        .from('appointments')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0]);
      if (dbAppointments) {
        appointments = dbAppointments.map((a) => ({
          id: a.id,
          customerName: a.customer_name,
          customerPhone: a.customer_phone,
          barberId: a.barber_id,
          barberName: a.barber_name,
          serviceIds: a.service_ids || [],
          serviceNames: a.service_names || [],
          date: a.date,
          time: a.time,
          totalPrice: Number(a.total_price),
          totalDurationMinutes: a.total_duration_minutes,
          paymentMethod: a.payment_method,
          paymentStatus: a.payment_status,
          status: a.status,
          whatsappNotificationSent: a.whatsapp_notification_sent,
          createdAt: a.created_at,
        }));
      }
    } catch (e) {
      console.warn('[Webhook Uazapi] Erro ao buscar appointments', e);
    }

    // 7. Cérebro do Atendente Alfred (Gemini AI com ferramentas)
    let replyText = '';
    let intentDetected = 'AI_CHAT';

    try {
      if (process.env.GEMINI_API_KEY) {
        const alfredResult = await alfredChat(messageBody, {
          services,
          barbers,
          appointments,
          currentCustomer: contextoCliente.currentCustomer,
          conversationHistory: contextoCliente.conversationHistory.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
        });

        if (alfredResult?.reply) {
          replyText = alfredResult.reply;
          intentDetected = alfredResult.toolUsed || 'GEMINI_ALFRED';
        }
      }
    } catch (geminiErr) {
      console.warn('[Webhook Uazapi] Erro ao chamar Alfred Gemini:', geminiErr);
    }

    // Fallback inteligente
    if (!replyText) {
      const brainContext: BrainContext = {
        services,
        barbers,
        appointments,
        currentCustomer: contextoCliente.currentCustomer,
        conversationHistory: contextoCliente.conversationHistory,
        activeDraft: contextoCliente.activeDraft,
      };

      try {
        const brainOutput = await pensarEResponderAlfred(messageBody, brainContext);
        replyText = brainOutput.reply;
        intentDetected = brainOutput.intent;
        if (brainOutput.newDraftState) {
          contextoCliente.activeDraft = {
            ...contextoCliente.activeDraft,
            ...brainOutput.newDraftState,
          };
        }
      } catch {
        replyText =
          'Olá! Sou o Alfred da Barbearia Mamuty. Você pode tirar dúvidas sobre serviços ou agendar diretamente pelo link: https://mamuty.vercel.app/agendar';
      }
    }

    // 8. Atualizar contexto da conversa
    contextoCliente.conversationHistory.push({
      role: 'assistant',
      content: replyText,
    });

    // 9. Registrar log da resposta
    const responseTime = Date.now() - startTime;
    await logConversation({
      clientPhone: cleanPhone,
      clientName: cliente?.name || pushName,
      direction: 'outgoing',
      message: replyText,
      intent: intentDetected,
      toolUsed: intentDetected,
      status: 'success',
      responseTimeMs: responseTime,
    });

    await atualizarSessao(cleanPhone, {
      intents: [...(sessao.intents || []), intentDetected],
      context: contextoCliente,
    });

    // 10. Disparar resposta ao cliente via Uazapi
    const sendResult = await enviarMensagemUazapi(replyText, cleanPhone);

    return NextResponse.json({
      ok: true,
      sent: sendResult.success,
      replyPreview: replyText.substring(0, 50) + '...',
      responseTimeMs: responseTime,
    });
  } catch (err: any) {
    console.error('[Webhook Uazapi] Erro inesperado:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Erro interno no webhook' },
      { status: 500 }
    );
  }
}
