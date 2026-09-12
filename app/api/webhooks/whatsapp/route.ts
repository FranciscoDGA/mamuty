import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { normalizarPhone, extrairPhoneParaBusca, enviarRespostaFuncionario, isZApiConfigured, validarWebhook } from '@/lib/zapi';
import { pensarEResponderMarcos, BrainContext } from '@/lib/ai/brain';
import { obterOuCriarSessao, logConversation, atualizarSessao } from '@/lib/ai/conversationLog';
import { Appointment, Barber, Customer, Service } from '@/lib/types';
import { MAMUTY_KNOWLEDGE_BASE } from '@/lib/ai/knowledgeBase';
import { processarNovoAgendamento, processarConclusaoAtendimento } from '@/lib/ai/automation';
import { adicionarJobs } from '@/lib/ai/automationQueue';
import { checkBookingRateLimit, checkApiRateLimit } from '@/lib/rateLimit';

// ============================================
// SPRINT 7 — WEBHOOK WHATSAPP (Z-API)
// ============================================

// Armazenamento de contexto por cliente (futuramente Supabase)
const clienteContexto: Map<string, {
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  activeDraft: any;
  currentCustomer: Customer | null;
}> = new Map();

/**
 * POST /api/webhooks/whatsapp
 * Recebe mensagens do WhatsApp via Z-API
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Validar webhook via Security-Key
    const securityKey = request.headers.get('security-key') || undefined;
    if (!validarWebhook(securityKey)) {
      console.warn('[Webhook] Security-Key inválida. Requisição rejeitada.');
      return NextResponse.json({ ok: false, error: 'Invalid security key' }, { status: 401 });
    }

    // 2. Parse do body
    const body = await request.json();

    // Z-API pode enviar diferentes tipos de evento
    const event = body.event || 'message';
    const data = body.data || body;

    // Ignorar mensagens enviadas pelo bot (fromMe)
    if (data.fromMe) {
      return NextResponse.json({ ok: true, ignored: 'fromMe' });
    }

    // 3. Extrair dados da mensagem
    const phone = data.phone || data.from || '';
    const messageBody = data.body || data.message || '';
    const pushName = data.pushName || '';
    const messageType = data.type || 'text';

    if (!phone || !messageBody) {
      return NextResponse.json({ ok: false, error: 'Missing phone or message' }, { status: 400 });
    }

    // 4. Normalizar telefone
    const normalizedPhone = normalizarPhone(phone);
    const phoneParaBusca = extrairPhoneParaBusca(normalizedPhone);

    // Sanitizar: só números para consultas
    const safePhoneQuery = normalizedPhone.replace(/\D/g, '');
    const safePhoneSearch = phoneParaBusca.replace(/\D/g, '');

    // 4.1 Rate limiting por telefone
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const apiRateLimit = checkApiRateLimit(ip);
    if (!apiRateLimit.allowed) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const bookingRateLimit = checkBookingRateLimit(safePhoneQuery);
    if (!bookingRateLimit.allowed) {
      return NextResponse.json({ ok: false, error: 'Too many requests from this number' }, { status: 429 });
    }

    console.log(`[Webhook] Mensagem recebida: ${messageType}`);

    // 5. Processar apenas mensagens de texto
    if (messageType !== 'text' && messageType !== 'buttons_response' && messageType !== 'list_response') {
      // Para tipos não suportados, enviar mensagem amigável
      if (isZApiConfigured()) {
        await enviarRespostaFuncionario(normalizedPhone, {
          reply: 'Desculpe, no momento consigo processar apenas mensagens de texto. Por favor, digite sua mensagem. 😊',
          intent: 'UNSUPPORTED_TYPE'
        });
      }
      return NextResponse.json({ ok: true, ignored: 'unsupported_type' });
    }

    // 6. Identificar cliente
    let cliente: Customer | null = null;
    try {
      const { data: clientes } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.eq.${safePhoneQuery},phone.eq.${safePhoneSearch},phone.like.%${safePhoneSearch}`)
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
          createdAt: clientes[0].created_at
        };
      }
    } catch (e) {
      console.warn('[Webhook] Erro ao buscar cliente:', e);
    }

    // 7. Criar/obter sessão
    const sessao = await obterOuCriarSessao(normalizedPhone, cliente?.name || pushName);

    // 8. Log da mensagem recebida
    await logConversation({
      clientPhone: normalizedPhone,
      clientName: cliente?.name || pushName,
      direction: 'incoming',
      message: messageBody,
      status: 'success'
    });

    // 9. Recuperar contexto da conversa
    const contextoCliente = clienteContexto.get(normalizedPhone) || {
      conversationHistory: [],
      activeDraft: {},
      currentCustomer: cliente
    };

    if (cliente && !contextoCliente.currentCustomer) {
      contextoCliente.currentCustomer = cliente;
    }

    // Adicionar mensagem do usuário ao histórico
    contextoCliente.conversationHistory.push({
      role: 'user',
      content: messageBody
    });

    // 10. Preparar dados para o Brain
    let services: Service[] = [];
    let barbers: Barber[] = [];
    let appointments: Appointment[] = [];

    try {
      // Buscar serviços
      const { data: dbServices } = await supabase.from('services').select('*').eq('active', true);
      if (dbServices && dbServices.length > 0) {
        services = dbServices.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category || 'cabelo',
          description: s.description || '',
          price: Number(s.price),
          durationMinutes: s.duration_minutes || 30,
          pointsReward: s.points_reward || 0,
          active: s.active
        }));
      }
    } catch (e) {
      services = MAMUTY_KNOWLEDGE_BASE.servicos.map(s => ({
        id: s.id,
        name: s.nome,
        category: 'cabelo',
        description: s.descricao,
        price: s.preco,
        durationMinutes: s.duracaoMinutos,
        pointsReward: 0,
        active: true
      }));
    }

    try {
      // Buscar barbeiros
      const { data: dbBarbers } = await supabase.from('barbers').select('*').eq('active', true);
      if (dbBarbers && dbBarbers.length > 0) {
        barbers = dbBarbers.map(b => ({
          id: b.id,
          name: b.name,
          role: b.role || 'barbeiro',
          avatarUrl: b.avatar_url || '',
          rating: b.rating || 0,
          reviewsCount: b.reviews_count || 0,
          specialties: b.specialties || [],
          phone: b.phone || '',
          bio: b.bio || '',
          availableDays: b.available_days || [1, 2, 3, 4, 5, 6]
        }));
      }
    } catch (e) {
      barbers = MAMUTY_KNOWLEDGE_BASE.barbeiros.map(b => ({
        id: b.id,
        name: b.nome,
        role: 'barbeiro',
        avatarUrl: '',
        rating: 0,
        reviewsCount: 0,
        specialties: b.especialidades,
        phone: '',
        bio: '',
        availableDays: [1, 2, 3, 4, 5, 6]
      }));
    }

    try {
      // Buscar agendamentos
      const { data: dbAppointments } = await supabase
        .from('appointments')
        .select('*')
        .in('status', ['confirmed', 'pending'])
        .gte('date', new Date().toISOString().split('T')[0]);

      if (dbAppointments) {
        appointments = dbAppointments.map(a => ({
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
          source: a.source || 'whatsapp'
        }));
      }
    } catch (e) {
      console.warn('[Webhook] Erro ao buscar agendamentos:', e);
    }

    // 11. Chamar o Brain
    const brainContext: BrainContext = {
      services,
      barbers,
      appointments,
      currentCustomer: contextoCliente.currentCustomer,
      conversationHistory: contextoCliente.conversationHistory,
      activeDraft: contextoCliente.activeDraft
    };

    let brainOutput;
    try {
      brainOutput = await pensarEResponderMarcos(messageBody, brainContext);
    } catch (error: any) {
      console.error('[Webhook] Erro no Brain:', error);

      // Fallback de segurança
      brainOutput = {
        reply: 'Desculpe, tive uma dificuldade momentânea. Por favor, tente novamente ou fale diretamente com o Hemerson no WhatsApp.',
        intent: 'AI_FALLBACK',
        quickReplies: [
          { label: 'Tentar novamente', action: 'RETRY' },
          { label: 'Falar com Hemerson', action: 'HUMAN_HANDOFF' }
        ]
      };
    }

    // 12. Atualizar contexto
    contextoCliente.conversationHistory.push({
      role: 'assistant',
      content: brainOutput.reply
    });

    if (brainOutput.newDraftState) {
      contextoCliente.activeDraft = {
        ...contextoCliente.activeDraft,
        ...brainOutput.newDraftState
      };
    }

    clienteContexto.set(normalizedPhone, contextoCliente);

    // 13. Log da resposta
    const responseTime = Date.now() - startTime;
    await logConversation({
      clientPhone: normalizedPhone,
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
        hasQuickReplies: !!brainOutput.quickReplies?.length
      }
    });

    // 14. Atualizar sessão
    atualizarSessao(normalizedPhone, {
      intents: [...(sessao.intents || []), brainOutput.intent],
      context: contextoCliente.activeDraft
    });

    // 15. Executar ações (criar/cancelar agendamento)
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
              source: 'whatsapp',
              status: 'confirmed',
              whatsapp_notification_sent: false
            })
            .select()
            .single();

          if (!error && newAppointment) {
            console.log(`[Webhook] Agendamento criado com sucesso`);

            // Processar automações para o novo agendamento
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
              totalDurationMinutes: newAppointment.total_duration_minutes || 40,
              paymentMethod: newAppointment.payment_method || 'pix',
              paymentStatus: 'pendente',
              status: 'confirmed',
              whatsappNotificationSent: false,
              createdAt: newAppointment.created_at
            };
            const automationJobs = processarNovoAgendamento(aptForAutomation, []);
            if (automationJobs.length > 0) {
              adicionarJobs(automationJobs);
            }
          }
        }

        if (brainOutput.actionToExecute.type === 'CANCEL_APPOINTMENT') {
          const aptId = brainOutput.actionToExecute.payload.id;
          if (aptId) {
            await supabase
              .from('appointments')
              .update({ status: 'cancelled' })
              .eq('id', aptId);
          }
        }
      } catch (e) {
        console.error('[Webhook] Erro ao executar ação:', e);
      }
    }

    // 16. Enviar resposta via Z-API
    if (isZApiConfigured()) {
      const sendResult = await enviarRespostaFuncionario(normalizedPhone, brainOutput);
      if (!sendResult.success) {
        console.error('[Webhook] Erro ao enviar resposta:', sendResult.error);
      }
    } else {
      console.log('[Webhook] Z-API não configurada. Resposta registrada em log.');
    }

    // 17. Responder ao webhook
    return NextResponse.json({
      ok: true,
      messageId: `msg-${Date.now()}`,
      intent: brainOutput.intent,
      responseTimeMs: responseTime
    });

  } catch (error: any) {
    console.error('[Webhook] Erro geral:', error);

    // Fallback de segurança: sempre responder
    return NextResponse.json({
      ok: false,
      error: 'Internal server error',
      fallback: 'Sistema momentaneamente indisponível'
    }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/whatsapp
 * Endpoint de verificação de saúde
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Mamuty Digital Employee - WhatsApp Webhook',
    zapiConfigured: isZApiConfigured(),
    timestamp: new Date().toISOString()
  });
}
