import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  enviarMensagemUazapi,
  isUazapiConfigured,
  normalizarTelefoneUazapi,
  validarWebhookUazapi,
} from '@/lib/uazapi';
import { pensarEResponderMarcos, BrainContext } from '@/lib/ai/brain';
import { obterOuCriarSessao, logConversation, atualizarSessao } from '@/lib/ai/conversationLog';
import { Appointment, Barber, Customer, Service } from '@/lib/types';
import { MAMUTY_KNOWLEDGE_BASE } from '@/lib/ai/knowledgeBase';
import { processarNovoAgendamento, processarConclusaoAtendimento } from '@/lib/ai/automation';
import { adicionarJobs } from '@/lib/ai/automationQueue';
import { checkBookingRateLimit, checkApiRateLimit } from '@/lib/rateLimit';

// ============================================
// WEBHOOK UAZAPI WHATSAPP (Mamuty Barbearia)
// ============================================

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
  });
}

/**
 * POST /api/webhooks/uazapi
 * Recebe mensagens e eventos do WhatsApp enviados pela Uazapi
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
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
    const rawFrom =
      rawData.from ||
      rawData.phone ||
      rawData.key?.remoteJid ||
      body.phone ||
      body.from ||
      '';

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
    else if (typeof body.message === 'string') messageBody = body.message;

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

    if (!cleanPhone || !messageBody) {
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

    const contextoCliente = clienteContexto.get(cleanPhone) || {
      conversationHistory: [],
      activeDraft: {},
      currentCustomer: cliente,
    };

    if (cliente && !contextoCliente.currentCustomer) {
      contextoCliente.currentCustomer = cliente;
    }

    contextoCliente.conversationHistory.push({
      role: 'user',
      content: messageBody,
    });

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
        role: 'barbeiro',
        avatarUrl: '',
        rating: 0,
        reviewsCount: 0,
        specialties: b.especialidades,
        phone: '',
        bio: '',
        availableDays: [1, 2, 3, 4, 5, 6],
      }));
    }

    try {
      const { data: dbAppointments } = await supabase
        .from('appointments')
        .select('*')
        .in('status', ['confirmed', 'pending'])
        .gte('date', new Date().toISOString().split('T')[0]);

      if (dbAppointments) {
        appointments = dbAppointments.map((a) => ({
          id: a.id,
          customerName: a.customer_name,
          customerPhone: a.customer_phone,
          customerEmail: a.customer_email || '',
          serviceIds: a.service_ids || [],
          serviceNames: a.service_names || [],
          barberId: a.barber_id,
          barberName: a.barber_name,
          date: a.date,
          time: a.time,
          totalPrice: Number(a.total_price),
          totalDurationMinutes: a.total_duration_minutes || 40,
          paymentMethod: a.payment_method || 'pix',
          paymentStatus: a.payment_status || 'pendente',
          status: a.status,
          whatsappNotificationSent: a.whatsapp_notification_sent || false,
          createdAt: a.created_at,
          notes: a.notes || '',
          source: a.source || 'whatsapp',
        }));
      }
    } catch (e) {
      console.warn('[Webhook Uazapi] Erro ao buscar agendamentos:', e);
    }

    // 7. Cérebro do Atendente Marcos
    const brainContext: BrainContext = {
      services,
      barbers,
      appointments,
      currentCustomer: contextoCliente.currentCustomer,
      conversationHistory: contextoCliente.conversationHistory,
      activeDraft: contextoCliente.activeDraft,
    };

    let brainOutput;
    try {
      brainOutput = await pensarEResponderMarcos(messageBody, brainContext);
    } catch (error: any) {
      console.error('[Webhook Uazapi] Erro no Brain:', error);
      brainOutput = {
        reply:
          'Olá! Tive uma oscilação momentânea aqui no sistema, mas você pode agendar diretamente pelo nosso site: https://mamuty.vercel.app/agendar ou falar direto com o Hemerson.',
        intent: 'AI_FALLBACK',
      };
    }

    // 8. Atualizar contexto da conversa
    contextoCliente.conversationHistory.push({
      role: 'assistant',
      content: brainOutput.reply,
    });

    if (brainOutput.newDraftState) {
      contextoCliente.activeDraft = {
        ...contextoCliente.activeDraft,
        ...brainOutput.newDraftState,
      };
    }

    clienteContexto.set(cleanPhone, contextoCliente);

    // 9. Registrar log da resposta
    const responseTime = Date.now() - startTime;
    await logConversation({
      clientPhone: cleanPhone,
      clientName: cliente?.name || pushName,
      direction: 'outgoing',
      message: brainOutput.reply,
      intent: brainOutput.intent,
      toolUsed: brainOutput.toolUsed,
      action: brainOutput.actionToExecute?.type,
      status: 'success',
      responseTimeMs: responseTime,
      metadata: {
        leadStatus: brainOutput.leadStatus,
      },
    });

    atualizarSessao(cleanPhone, {
      intents: [...(sessao.intents || []), brainOutput.intent],
      context: contextoCliente.activeDraft,
    });

    // 10. Executar ações solicitadas pelo cérebro (criar/cancelar)
    if (brainOutput.actionToExecute) {
      try {
        if (brainOutput.actionToExecute.type === 'CREATE_APPOINTMENT') {
          const payload = brainOutput.actionToExecute.payload;
          const { data: newAppointment, error } = await supabase
            .from('appointments')
            .insert({
              customer_name: payload.customerName,
              customer_phone: payload.customerPhone,
              customer_email: payload.customerEmail,
              barber_id: payload.barberId,
              barber_name: payload.barberName,
              service_ids: payload.serviceIds,
              service_names: payload.serviceNames,
              date: payload.date,
              time: payload.time,
              total_price: payload.totalPrice,
              total_duration_minutes: payload.totalDurationMinutes,
              payment_method: payload.paymentMethod,
              payment_status: 'pendente',
              source: 'whatsapp_uazapi',
              status: 'confirmed',
              whatsapp_notification_sent: true,
            })
            .select()
            .single();

          if (!error && newAppointment) {
            const aptForAutomation: Appointment = {
              id: newAppointment.id,
              customerName: newAppointment.customer_name,
              customerPhone: newAppointment.customer_phone,
              customerEmail: newAppointment.customer_email || '',
              serviceIds: newAppointment.service_ids || [],
              serviceNames: newAppointment.service_names || [],
              barberId: newAppointment.barber_id,
              barberName: newAppointment.barber_name,
              date: newAppointment.date,
              time: newAppointment.time,
              totalPrice: Number(newAppointment.total_price),
              totalDurationMinutes: newAppointment.total_duration_minutes,
              paymentMethod: newAppointment.payment_method,
              paymentStatus: newAppointment.payment_status,
              status: 'confirmed',
              whatsappNotificationSent: true,
              createdAt: newAppointment.created_at,
              notes: '',
              source: 'whatsapp_uazapi',
            };
            const jobs = processarNovoAgendamento(aptForAutomation, []);
            if (jobs.length > 0) await adicionarJobs(jobs);
          }
        }
      } catch (actionErr) {
        console.error('[Webhook Uazapi] Erro ao executar ação:', actionErr);
      }
    }

    // 11. Disparar resposta ao cliente via Uazapi
    const sendResult = await enviarMensagemUazapi(brainOutput.reply, cleanPhone);

    return NextResponse.json({
      ok: true,
      sent: sendResult.success,
      replyPreview: brainOutput.reply.substring(0, 50) + '...',
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
