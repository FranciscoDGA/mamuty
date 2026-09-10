import { Appointment, Barber, Customer, PaymentMethod, Service } from '../types';
import { ChatMessage, DialogStep, BookingDraft, QuickReply } from './types';
import { classificarIntencao } from './intents';
import {
  consultar_servicos,
  consultar_funcionamento,
  consultar_disponibilidade_acao,
  formatar_vagas_whatsapp,
  consultar_informacoes_gerais
} from './actions';

export interface EngineContext {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  currentCustomer: Customer | null;
  step: DialogStep;
  draft: BookingDraft;
}

export interface EngineResult {
  reply: ChatMessage;
  nextStep: DialogStep;
  nextDraft: BookingDraft;
  actionToExecute?: {
    type: 'CREATE_APPOINTMENT' | 'CANCEL_APPOINTMENT';
    payload: any;
  };
}

export function processUserMessage(
  userText: string,
  context: EngineContext,
  actionPayload?: any
): EngineResult {
  const { services, barbers, appointments, currentCustomer, step, draft } = context;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const todayIso = now.toISOString().split('T')[0];

  // 1. Verificar se o usuário clicou em uma ação estruturada direta
  if (actionPayload?.action) {
    return handleStructuredAction(actionPayload.action, actionPayload.data, context, timeStr, todayIso);
  }

  // 2. Se o usuário estiver no meio de uma etapa guiada de agendamento
  if (step === 'AWAITING_CUSTOMER_DATA') {
    // Usuário digitou nome ou telefone
    const trimmed = userText.trim();
    const cleanDigits = trimmed.replace(/\D/g, '');

    if (cleanDigits.length >= 8 && !draft.customerPhone) {
      const nextDraft = { ...draft, customerPhone: cleanDigits };
      return {
        reply: {
          id: 'msg-' + Date.now(),
          sender: 'marcos',
          text: `Perfeito! E qual o seu *Nome Completo*? 👤`,
          timestamp: timeStr
        },
        nextStep: 'AWAITING_CUSTOMER_DATA',
        nextDraft
      };
    } else if (!draft.customerName) {
      const nextDraft = { ...draft, customerName: trimmed };
      // Pronto para confirmar
      return buildConfirmationSummary(nextDraft, timeStr);
    }
  }

  // 3. Classificação de Intenção do Texto Livre
  const intent = classificarIntencao(userText);

  // A) FALAR COM HUMANO
  if (intent === 'FALAR_COM_HUMANO') {
    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Claro! 😊 Vou encaminhar você agora mesmo para o atendimento humano com a equipe da Barbearia Mamuty.\n\nToque no botão abaixo para falar direto com o *Hemerson Barber* no WhatsApp pessoal:`,
        timestamp: timeStr,
        intent: 'FALAR_COM_HUMANO',
        component: 'human_handoff',
        quickReplies: [
          { label: 'Voltar ao menu inicial', action: 'MENU_INICIAL' }
        ]
      },
      nextStep: 'IDLE',
      nextDraft: draft
    };
  }

  // B) HORARIO DE FUNCIONAMENTO
  if (intent === 'BUSINESS_HOURS') {
    const texto = consultar_funcionamento(todayIso);
    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: texto,
        timestamp: timeStr,
        intent: 'HORARIO_FUNCIONAMENTO',
        quickReplies: [
          { label: 'Ver horários hoje', action: 'VER_HORARIOS_HOJE' },
          { label: 'Ver serviços e preços', action: 'VER_SERVICOS' },
          { label: 'Agendar agora', action: 'INICIAR_AGENDAMENTO' }
        ]
      },
      nextStep: 'IDLE',
      nextDraft: draft
    };
  }

  // C) CONSULTAR SERVIÇOS E PREÇOS
  if (intent === 'SERVICE_LIST') {
    const { texto, services: ativos } = consultar_servicos(services);
    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: texto,
        timestamp: timeStr,
        intent: 'CONSULTAR_SERVICOS',
        component: 'services_list',
        payload: { services: ativos },
        quickReplies: [
          { label: 'Agendar agora', action: 'INICIAR_AGENDAMENTO' },
          { label: 'Tem vaga hoje?', action: 'VER_HORARIOS_HOJE' }
        ]
      },
      nextStep: 'AWAITING_SERVICE',
      nextDraft: draft
    };
  }

  // D) CONSULTAR DISPONIBILIDADE ("Tem vaga hoje?")
  if (intent === 'CHECK_AVAILABILITY') {
    const res = consultar_disponibilidade_acao(todayIso, appointments, barbers, 40);
    const textoVagas = formatar_vagas_whatsapp(res, 'Hoje');

    const freeSlots = res.slots.filter(s => s.disponivel).slice(0, 6);
    const quickReplies: QuickReply[] = freeSlots.map(s => ({
      label: s.horario,
      action: 'ESCOLHER_HORARIO',
      data: { time: s.horario, date: todayIso }
    }));
    quickReplies.push({ label: 'Escolher outro dia', action: 'ESCOLHER_DATA' });

    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Olá! 👋 Sim, estamos funcionando hoje.\n\n${textoVagas}`,
        timestamp: timeStr,
        intent: 'CONSULTAR_DISPONIBILIDADE',
        quickReplies
      },
      nextStep: 'AWAITING_TIME',
      nextDraft: { ...draft, date: todayIso }
    };
  }

  // E) CANCELAR AGENDAMENTO
  if (intent === 'CANCEL_APPOINTMENT') {
    const userPhone = currentCustomer?.phone || draft.customerPhone || '';
    const cleanPhone = userPhone.replace(/\D/g, '');

    const userApt = cleanPhone
      ? appointments.find(a => a.customerPhone.replace(/\D/g, '').endsWith(cleanPhone.slice(-8)) && a.status === 'confirmed')
      : appointments.find(a => a.status === 'confirmed');

    if (!userApt) {
      return {
        reply: {
          id: 'msg-' + Date.now(),
          sender: 'marcos',
          text: `Para localizar seu agendamento e cancelar, por favor me informe o seu *WhatsApp* com DDD: 👇`,
          timestamp: timeStr,
          quickReplies: [
            { label: 'Falar com Mamuty', action: 'FALAR_COM_HUMANO' }
          ]
        },
        nextStep: 'IDLE',
        nextDraft: draft
      };
    }

    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Claro! Encontrei seu agendamento ativo:\n\n📅 *${userApt.date.split('-').reverse().join('/')} às ${userApt.time}*\n✂️ *${userApt.serviceNames?.[0]}*\n💈 *${userApt.barberName}*\n\nDeseja realmente cancelar este horário?`,
        timestamp: timeStr,
        component: 'cancel_card',
        payload: { appointment: userApt },
        quickReplies: [
          { label: 'Sim, cancelar horário', action: 'CONFIRMAR_CANCELAMENTO', payload: { id: userApt.id } },
          { label: 'Não, manter horário', action: 'MANTER_HORARIO' }
        ]
      },
      nextStep: 'AWAITING_CANCEL_CONFIRMATION',
      nextDraft: { ...draft, rescheduleAppointmentId: userApt.id }
    };
  }

  // F) REAGENDAR
  if (intent === 'RESCHEDULE_APPOINTMENT') {
    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Sem problemas! Vamos remarcar seu atendimento. Para qual dia você prefere? 👇`,
        timestamp: timeStr,
        component: 'dates_list',
        quickReplies: [
          { label: 'Hoje', action: 'ESCOLHER_DATA', payload: { date: todayIso } },
          { label: 'Ver horários livres', action: 'VER_HORARIOS_HOJE' }
        ]
      },
      nextStep: 'AWAITING_DATE',
      nextDraft: draft
    };
  }

  // G) INFORMAÇÕES GERAIS
  if (intent === 'INFORMACOES_GERAIS' || intent === 'ADDRESS') {
    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: consultar_informacoes_gerais(),
        timestamp: timeStr,
        quickReplies: [
          { label: 'Agendar horário', action: 'INICIAR_AGENDAMENTO' },
          { label: 'Ver horários hoje', action: 'VER_HORARIOS_HOJE' }
        ]
      },
      nextStep: 'IDLE',
      nextDraft: draft
    };
  }

  // H) INICIAR AGENDAMENTO / SAUDAÇÃO / OUTROS
  return {
    reply: {
      id: 'msg-' + Date.now(),
      sender: 'marcos',
      text: `Olá! 👋 Sou o *Marcos*, assistente digital da *Barbearia Mamuty*.\n\nComo posso ajudar você hoje?\n\n• Escolha uma opção rápida abaixo ou envie sua dúvida:`,
      timestamp: timeStr,
      intent: 'GREETING',
      quickReplies: [
        { label: 'Quero agendar', action: 'INICIAR_AGENDAMENTO' },
        { label: 'Tem vaga hoje?', action: 'VER_HORARIOS_HOJE' },
        { label: 'Ver preços e serviços', action: 'VER_SERVICOS' },
        { label: 'Qual o horário de funcionamento?', action: 'VER_FUNCIONAMENTO' }
      ]
    },
    nextStep: 'IDLE',
    nextDraft: draft
  };
}

/**
 * Tratador de cliques e fluxos interativos no simulador do WhatsApp
 */
function handleStructuredAction(
  action: string,
  data: any,
  context: EngineContext,
  timeStr: string,
  todayIso: string
): EngineResult {
  const { services, barbers, appointments, currentCustomer, draft } = context;

  // 1. MENU INICIAL
  if (action === 'MENU_INICIAL') {
    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Olá! Sou o *Marcos*, assistente da *Barbearia Mamuty*. Como posso ajudar você agora? 💈`,
        timestamp: timeStr,
        quickReplies: [
          { label: 'Quero agendar', action: 'INICIAR_AGENDAMENTO' },
          { label: 'Tem vaga hoje?', action: 'VER_HORARIOS_HOJE' },
          { label: 'Ver serviços', action: 'VER_SERVICOS' },
          { label: 'Falar com atendente', action: 'FALAR_COM_HUMANO' }
        ]
      },
      nextStep: 'IDLE',
      nextDraft: {}
    };
  }

  // 2. INICIAR AGENDAMENTO -> PASSO 1: SERVIÇO
  if (action === 'INICIAR_AGENDAMENTO') {
    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Show de bola! 💈 Vamos agendar seu atendimento na Mamuty.\n\nQual serviço você gostaria de fazer? 👇`,
        timestamp: timeStr,
        component: 'services_list',
        payload: { services: services.filter(s => s.id) },
        quickReplies: services.slice(0, 4).map(s => ({
          label: `${s.name} (R$ ${s.price})`,
          action: 'ESCOLHER_SERVICO',
          payload: { serviceId: s.id }
        }))
      },
      nextStep: 'AWAITING_SERVICE',
      nextDraft: {}
    };
  }

  // 3. ESCOLHER SERVIÇO -> PASSO 2: PROFISSIONAL
  if (action === 'ESCOLHER_SERVICO') {
    const srv = services.find(s => s.id === data?.serviceId) || services[0];
    const nextDraft = { ...draft, service: srv };

    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Excelente escolha: *${srv.name}* (R$ ${srv.price} — ${srv.durationMinutes} min).\n\nCom quem você gostaria de ser atendido? 💈`,
        timestamp: timeStr,
        component: 'barbers_list',
        payload: { barbers },
        quickReplies: [
          { label: 'mamuty.barber', action: 'ESCOLHER_BARBEIRO', payload: { barberName: 'mamuty.barber' } },
          { label: 'Douglas', action: 'ESCOLHER_BARBEIRO', payload: { barberName: 'Douglas' } },
          { label: 'Qualquer profissional', action: 'ESCOLHER_BARBEIRO', payload: { barberName: 'Qualquer profissional' } }
        ]
      },
      nextStep: 'AWAITING_BARBER',
      nextDraft
    };
  }

  // 4. ESCOLHER PROFISSIONAL -> PASSO 3: DATA
  if (action === 'ESCOLHER_BARBEIRO') {
    const bName = data?.barberName || 'mamuty.barber';
    const foundBarber = barbers.find(b => b.name === bName) || barbers[0];
    const nextDraft = { ...draft, barber: foundBarber };

    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Perfeito, com *${foundBarber.name}*! 👊\n\nPara qual dia você prefere o atendimento? 👇`,
        timestamp: timeStr,
        component: 'dates_list',
        quickReplies: [
          { label: 'Hoje', action: 'ESCOLHER_DATA', payload: { date: todayIso } },
          { label: 'Amanhã', action: 'ESCOLHER_DATA', payload: { date: getNextDayIso(1) } },
          { label: 'Depois de amanhã', action: 'ESCOLHER_DATA', payload: { date: getNextDayIso(2) } }
        ]
      },
      nextStep: 'AWAITING_DATE',
      nextDraft
    };
  }

  // 5. ESCOLHER DATA -> PASSO 4: HORÁRIO
  if (action === 'ESCOLHER_DATA' || action === 'VER_HORARIOS_HOJE') {
    const targetDate = data?.date || todayIso;
    const dur = draft.service?.durationMinutes || 40;
    const res = consultar_disponibilidade_acao(targetDate, appointments, barbers, dur, draft.barber?.id);
    const freeSlots = res.slots.filter(s => s.disponivel);

    const nextDraft = { ...draft, date: targetDate };

    if (freeSlots.length === 0) {
      return {
        reply: {
          id: 'msg-' + Date.now(),
          sender: 'marcos',
          text: `Para esta data não encontramos horários livres disponíveis com os critérios selecionados.\n\nDeseja verificar outro dia?`,
          timestamp: timeStr,
          quickReplies: [
            { label: 'Hoje', action: 'ESCOLHER_DATA', payload: { date: todayIso } },
            { label: 'Amanhã', action: 'ESCOLHER_DATA', payload: { date: getNextDayIso(1) } }
          ]
        },
        nextStep: 'AWAITING_DATE',
        nextDraft
      };
    }

    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Encontrei estes horários disponíveis para *${targetDate.split('-').reverse().join('/')}*: 👇\n(Lembrando que das 12h às 14h fazemos intervalo)`,
        timestamp: timeStr,
        component: 'slots_list',
        payload: { slots: freeSlots },
        quickReplies: freeSlots.slice(0, 6).map(s => ({
          label: s.horario,
          action: 'ESCOLHER_HORARIO',
          payload: { time: s.horario }
        }))
      },
      nextStep: 'AWAITING_TIME',
      nextDraft
    };
  }

  // 6. ESCOLHER HORÁRIO -> PASSO 5: FORMA DE PAGAMENTO
  if (action === 'ESCOLHER_HORARIO') {
    const time = data?.time || '14:00';
    const nextDraft = { ...draft, time };

    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Horário selecionado: *${time}*!\n\nComo você prefere realizar o pagamento? 💳\n*(O acerto é feito no balcão no momento do corte)*`,
        timestamp: timeStr,
        component: 'payment_methods',
        quickReplies: [
          { label: 'PIX', action: 'ESCOLHER_PAGAMENTO', payload: { method: 'pix' } },
          { label: 'Dinheiro', action: 'ESCOLHER_PAGAMENTO', payload: { method: 'dinheiro' } },
          { label: 'Débito', action: 'ESCOLHER_PAGAMENTO', payload: { method: 'debito' } },
          { label: 'Crédito', action: 'ESCOLHER_PAGAMENTO', payload: { method: 'credito' } }
        ]
      },
      nextStep: 'AWAITING_PAYMENT',
      nextDraft
    };
  }

  // 7. ESCOLHER PAGAMENTO -> PASSO 6: IDENTIFICAÇÃO DO CLIENTE
  if (action === 'ESCOLHER_PAGAMENTO') {
    const method: PaymentMethod = data?.method || 'pix';
    const nextDraft = { ...draft, paymentMethod: method };

    // Se já temos cliente identificado no contexto
    if (currentCustomer || draft.existingCustomer) {
      const cust = currentCustomer || draft.existingCustomer!;
      const finalDraft = {
        ...nextDraft,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerEmail: cust.email
      };

      return {
        reply: {
          id: 'msg-' + Date.now(),
          sender: 'marcos',
          text: `Encontramos seu cadastro! 👋\nOlá de volta, *${cust.name}* (${cust.phone}).\n\nVamos conferir os dados para finalizar? 👇`,
          timestamp: timeStr,
          quickReplies: [
            { label: 'Confirmar agendamento', action: 'CONFIRMAR_FINAL' },
            { label: 'Alterar dados', action: 'INICIAR_AGENDAMENTO' }
          ]
        },
        nextStep: 'AWAITING_CONFIRMATION',
        nextDraft: finalDraft
      };
    }

    // Cliente novo: pedir dados
    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Quase pronto! Para finalizar, por favor me informe o seu *WhatsApp* com DDD (ex: 94984439065): 👇`,
        timestamp: timeStr
      },
      nextStep: 'AWAITING_CUSTOMER_DATA',
      nextDraft
    };
  }

  // 8. CONFIRMAÇÃO FINAL -> EXECUÇÃO
  if (action === 'CONFIRMAR_FINAL') {
    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `🎉 *Horário reservado com sucesso!*\n\n${draft.customerName}, seu atendimento está confirmado no sistema:\n\n💈 *${draft.service?.name}*\n👤 *${draft.barber?.name}*\n📅 *${draft.date?.split('-').reverse().join('/')}*\n🕐 *${draft.time}*\n💰 *R$ ${draft.service?.price}*\n💳 *${draft.paymentMethod?.toUpperCase()}*\n📍 *Av. das Nações, Centro, Cumaru do Norte - PA*\n\nEsperamos você! *~Mamuty barbearia estilo forte.* 👊`,
        timestamp: timeStr,
        component: 'confirmed_card',
        payload: { draft },
        quickReplies: [
          { label: 'Fazer novo agendamento', action: 'INICIAR_AGENDAMENTO' },
          { label: 'Falar com Mamuty', action: 'FALAR_COM_HUMANO' }
        ]
      },
      nextStep: 'IDLE',
      nextDraft: {},
      actionToExecute: {
        type: 'CREATE_APPOINTMENT',
        payload: {
          customerName: draft.customerName || 'Cliente WhatsApp',
          customerPhone: draft.customerPhone || '94984439065',
          customerEmail: draft.customerEmail,
          barberId: draft.barber?.id,
          barberName: draft.barber?.name,
          serviceIds: draft.service ? [draft.service.id] : [],
          serviceNames: draft.service ? [draft.service.name] : [],
          date: draft.date || todayIso,
          time: draft.time || '14:00',
          totalPrice: draft.service?.price || 40,
          totalDurationMinutes: draft.service?.durationMinutes || 40,
          paymentMethod: draft.paymentMethod || 'pix',
          source: 'whatsapp'
        }
      }
    };
  }

  // 9. CONFIRMAR CANCELAMENTO
  if (action === 'CONFIRMAR_CANCELAMENTO') {
    const aptId = data?.id || draft.rescheduleAppointmentId;
    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Agendamento cancelado com sucesso. ✅\n\nO horário foi liberado no sistema e o histórico mantido. Quando quiser agendar novamente, só me chamar! 💈`,
        timestamp: timeStr,
        quickReplies: [
          { label: 'Agendar novo horário', action: 'INICIAR_AGENDAMENTO' },
          { label: 'Ver serviços', action: 'VER_SERVICOS' }
        ]
      },
      nextStep: 'IDLE',
      nextDraft: {},
      actionToExecute: {
        type: 'CANCEL_APPOINTMENT',
        payload: { id: aptId }
      }
    };
  }

  if (action === 'MANTER_HORARIO') {
    return {
      reply: {
        id: 'msg-' + Date.now(),
        sender: 'marcos',
        text: `Perfeito! Seu agendamento foi mantido normalmente. Esperamos você na Barbearia Mamuty! 💈👊`,
        timestamp: timeStr,
        quickReplies: [
          { label: 'Menu inicial', action: 'MENU_INICIAL' }
        ]
      },
      nextStep: 'IDLE',
      nextDraft: {}
    };
  }

  // FALLBACK
  return {
    reply: {
      id: 'msg-' + Date.now(),
      sender: 'marcos',
      text: `Entendido! Como posso ajudar você agora?`,
      timestamp: timeStr,
      quickReplies: [
        { label: 'Quero agendar', action: 'INICIAR_AGENDAMENTO' },
        { label: 'Ver horários', action: 'VER_HORARIOS_HOJE' }
      ]
    },
    nextStep: 'IDLE',
    nextDraft: draft
  };
}

function buildConfirmationSummary(draft: BookingDraft, timeStr: string): EngineResult {
  return {
    reply: {
      id: 'msg-' + Date.now(),
      sender: 'marcos',
      text: `Confira os detalhes do seu agendamento antes de confirmar:\n\n✂️ *Serviço:* ${draft.service?.name}\n💈 *Profissional:* ${draft.barber?.name}\n📅 *Data:* ${draft.date?.split('-').reverse().join('/')}\n🕐 *Horário:* ${draft.time}\n💰 *Valor:* R$ ${draft.service?.price}\n💳 *Pagamento:* ${draft.paymentMethod?.toUpperCase()}\n👤 *Cliente:* ${draft.customerName} (${draft.customerPhone})\n\nEstá tudo certo?`,
      timestamp: timeStr,
      component: 'summary_card',
      payload: { draft },
      quickReplies: [
        { label: '✅ Confirmar agendamento', action: 'CONFIRMAR_FINAL' },
        { label: '← Alterar', action: 'INICIAR_AGENDAMENTO' }
      ]
    },
    nextStep: 'AWAITING_CONFIRMATION',
    nextDraft: draft
  };
}

function getNextDayIso(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}
