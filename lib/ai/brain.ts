import { Appointment, Barber, Customer, PaymentMethod, Service } from '../types';
import { MAMUTY_KNOWLEDGE_BASE } from './knowledgeBase';
import { 
  tool_consultar_servicos, 
  tool_consultar_profissionais, 
  tool_consultar_disponibilidade, 
  tool_buscar_cliente_por_whatsapp,
  tool_encaminhar_para_humano 
} from './tools';

export interface BrainContext {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  currentCustomer: Customer | null;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  activeDraft?: {
    service?: Service;
    barber?: Barber;
    date?: string;
    time?: string;
    paymentMethod?: PaymentMethod;
    customerPhone?: string;
    customerName?: string;
  };
}

export interface BrainOutput {
  reply: string;
  intent: string;
  toolUsed?: string;
  quickReplies?: { label: string; action: string; payload?: any }[];
  component?: 
    | 'services_list'
    | 'barbers_list'
    | 'dates_list'
    | 'slots_list'
    | 'payment_methods'
    | 'summary_card'
    | 'confirmed_card'
    | 'human_handoff'
    | 'cancel_card';
  componentData?: any;
  actionToExecute?: {
    type: 'CREATE_APPOINTMENT' | 'CANCEL_APPOINTMENT';
    payload: any;
  };
  newDraftState?: any;
}

/**
 * CÉREBRO DO FUNCIONÁRIO DIGITAL MARCOS (SPRINT 4)
 * Analisa contexto, gírias não-padronizadas, invoca tools e conduz ativamente à conversão.
 */
export async function pensarEResponderMarcos(
  userMessage: string,
  context: BrainContext
): Promise<BrainOutput> {
  const norm = userMessage
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];
  const history = context.conversationHistory || [];
  const lastAssistantMsg = history.filter(m => m.role === 'assistant').slice(-1)[0]?.content.toLowerCase() || '';

  // 1. REGRA FUNDAMENTAL: NUNCA inventar serviços não cadastrados
  const servicosNaoCadastrados = ['infantil', 'kids', 'crianca', 'quimica', 'luzes', 'platinado', 'alisamento', 'relaxamento', 'pigmentacao'];
  const perguntouServicoInexistente = servicosNaoCadastrados.some(tag => norm.includes(tag)) && !norm.includes('social') && !norm.includes('degrade') && !norm.includes('barba');

  if (perguntouServicoInexistente) {
    const handoff = tool_encaminhar_para_humano('Consulta de serviço especial fora da grade');
    return {
      reply: 'Esse serviço não aparece na minha lista oficial no momento. 😊 Posso encaminhar você agora mesmo para a equipe da Mamuty confirmar diretamente no WhatsApp?',
      intent: 'SERVICO_NAO_LISTADO',
      toolUsed: 'encaminhar_para_humano',
      component: 'human_handoff',
      componentData: handoff.data,
      quickReplies: [
        { label: 'Falar com Hemerson (+55 94 98443-9065)', action: 'FALAR_COM_HUMANO' },
        { label: 'Ver serviços disponíveis', action: 'VER_SERVICOS' }
      ]
    };
  }

  // 2. ENCAMINHAMENTO PARA HUMANO
  if (
    norm.includes('falar com alguem') ||
    norm.includes('humano') ||
    norm.includes('atendente') ||
    norm.includes('pessoa') ||
    norm.includes('dono') ||
    norm.includes('falar com o hemerson')
  ) {
    const handoff = tool_encaminhar_para_humano('Solicitação direta de contato humano');
    return {
      reply: 'Com certeza! 😊 Para te atender pessoalmente, vou encaminhar sua conversa agora para a equipe da Mamuty.\n\nToque no botão abaixo para falar direto com o *Hemerson Barber*:',
      intent: 'HUMANO',
      toolUsed: 'encaminhar_para_humano',
      component: 'human_handoff',
      componentData: handoff.data,
      quickReplies: [
        { label: 'Voltar para o agendamento', action: 'INICIAR_AGENDAMENTO' }
      ]
    };
  }

  // 3. CANCELAMENTO DE HORÁRIO
  if (norm.includes('cancelar') || norm.includes('desmarcar') || norm.includes('nao vou poder ir')) {
    const phone = context.currentCustomer?.phone || context.activeDraft?.customerPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');

    const userApt = cleanPhone
      ? context.appointments.find(a => a.customerPhone.replace(/\D/g, '').endsWith(cleanPhone.slice(-8)) && a.status === 'confirmed')
      : context.appointments.find(a => a.status === 'confirmed');

    if (userApt) {
      return {
        reply: `Claro, imprevistos acontecem! Encontrei seu agendamento:\n\n📅 *${userApt.date.split('-').reverse().join('/')} às ${userApt.time}*\n✂️ *${userApt.serviceNames?.[0]}* com *${userApt.barberName}*\n\nDeseja confirmar o cancelamento? O horário voltará a ficar disponível para outros clientes.`,
        intent: 'CANCELAMENTO',
        component: 'cancel_card',
        componentData: { appointment: userApt },
        quickReplies: [
          { label: 'Sim, cancelar horário', action: 'CONFIRMAR_CANCELAMENTO', payload: { id: userApt.id } },
          { label: 'Não, manter agendamento', action: 'MANTER_HORARIO' }
        ]
      };
    }

    return {
      reply: 'Sem problemas! Para eu localizar seu agendamento no sistema e cancelar, por favor digite seu número de WhatsApp com DDD:',
      intent: 'CANCELAMENTO',
      quickReplies: [
        { label: 'Falar com atendente', action: 'FALAR_COM_HUMANO' }
      ]
    };
  }

  // 4. RESTRIÇÃO DE TEMPO ("Só tenho meia hora", "tenho pouco tempo", "algo rápido")
  if (norm.includes('meia hora') || norm.includes('30 min') || norm.includes('pouco tempo') || norm.includes('algo rapido') || norm.includes('apressado')) {
    const servicosRapidos = MAMUTY_KNOWLEDGE_BASE.servicos.filter(s => s.duracaoMinutos <= 30);
    return {
      reply: `Perfeito! Para quem tem até 30 minutos, recomendo nossos atendimentos mais rápidos e objetivos:\n\n• ✂️ *Corte social* — R$ 40 (30 min)\n• 🧔 *Barba simples* — R$ 35 (30 min)\n\nQuer garantir um desses horários para hoje?`,
      intent: 'DURACAO_RESTRITA',
      toolUsed: 'consultar_servicos',
      component: 'services_list',
      componentData: { services: servicosRapidos },
      quickReplies: [
        { label: 'Corte social (30 min)', action: 'ESCOLHER_SERVICO', payload: { serviceId: 'srv-corte-social' } },
        { label: 'Barba simples (30 min)', action: 'ESCOLHER_SERVICO', payload: { serviceId: 'srv-barba-simples' } }
      ]
    };
  }

  // 5. GÍRIA: "dar um tapa no visual"
  if (norm.includes('tapa no visual') || norm.includes('dar um talento') || norm.includes('mudar o visual') || norm.includes('ficar na regua')) {
    return {
      reply: `É pra já! Aqui na Mamuty a gente deixa no estilo forte na régua. 💈👊\n\nVocê está pensando em fazer só o corte, só a barba ou o combo completo de *Cabelo + Barba* (R$ 70)?`,
      intent: 'CONSULTA_ESTILO',
      quickReplies: [
        { label: 'Combo Cabelo + Barba (R$ 70)', action: 'ESCOLHER_SERVICO', payload: { serviceId: 'srv-cabelo-barba' } },
        { label: 'Corte degradê (R$ 40)', action: 'ESCOLHER_SERVICO', payload: { serviceId: 'srv-corte-degrade' } },
        { label: 'Barba alinhada (R$ 35)', action: 'ESCOLHER_SERVICO', payload: { serviceId: 'srv-barba-simples' } }
      ]
    };
  }

  // 6. GÍRIA & HORÁRIO NÃO PADRONIZADO: "depois do trampo", "depois das 17", "depois das 18", "a noite", "fim de tarde"
  const isAposTrampo = norm.includes('depois do trampo') || norm.includes('depois do trabalho') || norm.includes('fim de tarde') || norm.includes('noite') || norm.includes('depois das 17') || norm.includes('depois das 18') || norm.includes('depois das cinco') || norm.includes('depois das seis');

  if (isAposTrampo) {
    const minTime = norm.includes('18') || norm.includes('seis') ? '18:00' : '17:00';
    const duracao = context.activeDraft?.service?.durationMinutes || 40;
    const res = tool_consultar_disponibilidade(todayIso, context.appointments, context.barbers, duracao, undefined, minTime);
    const vagasFimTarde = res.data.vagas.filter((v: any) => v.horario >= minTime);

    if (vagasFimTarde.length > 0) {
      const listaStr = vagasFimTarde.slice(0, 4).map((v: any) => `• 🕐 *${v.horario}* com ${v.barbeiros.join(' ou ')}`).join('\n');
      return {
        reply: `Consigo sim! Hoje no final da tarde temos estas opções disponíveis pós-expediente:\n\n${listaStr}\n\nQual desses horários fica melhor pra você? 😊`,
        intent: 'DISPONIBILIDADE_APOS_TRAMPO',
        toolUsed: 'consultar_disponibilidade',
        component: 'slots_list',
        componentData: { slots: vagasFimTarde },
        quickReplies: vagasFimTarde.slice(0, 4).map((v: any) => ({
          label: v.horario,
          action: 'ESCOLHER_HORARIO',
          payload: { time: v.horario }
        }))
      };
    } else {
      return {
        reply: `Hoje depois das ${minTime} as cadeiras já estão cheias! 💈 Mas amanhã tenho vagas excelentes no final da tarde. Quer que eu reserve para amanhã?`,
        intent: 'DISPONIBILIDADE_LOTADO',
        quickReplies: [
          { label: 'Ver horários de amanhã', action: 'ESCOLHER_DATA', payload: { date: getNextDayIso(1) } },
          { label: 'Ver horários mais cedo hoje', action: 'VER_HORARIOS_HOJE' }
        ]
      };
    }
  }

  // 7. CONSULTA DE PREÇO ESPECÍFICO COM CONDUÇÃO ATIVA
  if (norm.includes('degrade') || norm.includes('quanto custa o degrade') || norm.includes('preco do degrade')) {
    const srv = MAMUTY_KNOWLEDGE_BASE.servicos.find(s => s.nome.toLowerCase().includes('degradê'))!;
    return {
      reply: `O *Corte degradê* fica R$ ${srv.preco} e leva aproximadamente ${srv.duracaoMinutos} minutos. É feito na régua milimétrica com acabamento impecável! 😊\n\nTenho horários disponíveis hoje. Quer que eu verifique uma vaga para você?`,
      intent: 'PRECO_DEGRADE',
      toolUsed: 'consultar_servicos',
      quickReplies: [
        { label: 'Sim, verificar horários', action: 'ESCOLHER_SERVICO', payload: { serviceId: srv.id } },
        { label: 'Ver outros serviços', action: 'VER_SERVICOS' }
      ],
      newDraftState: { service: srv }
    };
  }

  if (norm.includes('cabelo e barba') || norm.includes('cabelo + barba')) {
    const srv = MAMUTY_KNOWLEDGE_BASE.servicos.find(s => s.nome.toLowerCase().includes('+'))!;
    return {
      reply: `O combo *Cabelo + Barba* fica R$ ${srv.preco} e leva cerca de ${srv.duracaoMinutos} minutos. Inclui corte completo + barba alinhada com toalha e navalha no estilo forte Mamuty. 💈\n\nQuer que eu separe uma vaga hoje para você?`,
      intent: 'PRECO_COMBO',
      toolUsed: 'consultar_servicos',
      quickReplies: [
        { label: 'Sim, quero agendar', action: 'ESCOLHER_SERVICO', payload: { serviceId: srv.id } },
        { label: 'Ver horários hoje', action: 'VER_HORARIOS_HOJE' }
      ],
      newDraftState: { service: srv }
    };
  }

  // 8. CONSULTA GERAL DE PREÇOS / SERVIÇOS
  if (norm.includes('quanto custa') || norm.includes('preco') || norm.includes('valores') || norm.includes('tabela') || norm.includes('servicos')) {
    const servs = MAMUTY_KNOWLEDGE_BASE.servicos;
    const servList = servs.map(s => `• ✂️ *${s.nome}* — R$ ${s.preco} (${s.duracaoMinutos} min)`).join('\n');
    return {
      reply: `Esses são os serviços e valores oficiais da *Mamuty Barbearia*:\n\n${servList}\n\nQual desses você gostaria de fazer hoje? 😊`,
      intent: 'CONSULTAR_SERVICOS',
      toolUsed: 'consultar_servicos',
      component: 'services_list',
      componentData: { services: servs },
      quickReplies: [
        { label: 'Corte degradê (R$ 40)', action: 'ESCOLHER_SERVICO', payload: { serviceId: 'srv-corte-degrade' } },
        { label: 'Cabelo + Barba (R$ 70)', action: 'ESCOLHER_SERVICO', payload: { serviceId: 'srv-cabelo-barba' } },
        { label: 'Corte social (R$ 40)', action: 'ESCOLHER_SERVICO', payload: { serviceId: 'srv-corte-social' } }
      ]
    };
  }

  // 9. DISPONIBILIDADE GERAL ("Tem vaga hoje?", "Quais horários livres?")
  if (norm.includes('tem vaga') || norm.includes('vaga hoje') || norm.includes('horario disponivel') || norm.includes('horarios livres') || norm.includes('tem horario')) {
    const duracao = context.activeDraft?.service?.durationMinutes || (lastAssistantMsg.includes('cabelo + barba') ? 50 : 40);
    const res = tool_consultar_disponibilidade(todayIso, context.appointments, context.barbers, duracao);
    const vagas = res.data.vagas.slice(0, 6);

    if (vagas.length > 0) {
      const listaStr = vagas.map((v: any) => `• 🕐 *${v.horario}* — com ${v.barbeiros.join(' ou ')}`).join('\n');
      return {
        reply: `Sim! 😊 Temos horários disponíveis para hoje:\n\n${listaStr}\n\nQual deles você prefere reservar?`,
        intent: 'DISPONIBILIDADE_HOJE',
        toolUsed: 'consultar_disponibilidade',
        component: 'slots_list',
        componentData: { slots: vagas },
        quickReplies: vagas.map((v: any) => ({
          label: v.horario,
          action: 'ESCOLHER_HORARIO',
          payload: { time: v.horario }
        }))
      };
    }
  }

  // 10. HORÁRIO DE FUNCIONAMENTO
  if (norm.includes('aberto') || norm.includes('funcionando') || norm.includes('horario de funcionamento') || norm.includes('que horas abre') || norm.includes('que horas fecha')) {
    return {
      reply: `Sim! Estamos funcionando hoje. 💈\n\n⏰ *Horário de atendimento hoje:* 08:00 às 20:00\n🔒 *Intervalo de almoço:* 12:00 às 14:00\n\nPosso verificar os horários disponíveis para você agora! 👇`,
      intent: 'HORARIO_FUNCIONAMENTO',
      quickReplies: [
        { label: 'Ver horários livres hoje', action: 'VER_HORARIOS_HOJE' },
        { label: 'Agendar horário', action: 'INICIAR_AGENDAMENTO' }
      ]
    };
  }

  // 11. RESPOSTA SIMPLIFICADA ("Sim", "Quero", "Pode ser", "Verifica aí")
  if (norm === 'sim' || norm === 'quero' || norm === 'pode ser' || norm === 'verifica' || norm === 'verifica ai' || norm === 'beleza') {
    return {
      reply: 'Perfeito! 👊 Você prefere ser atendido pelo *mamuty.barber*, pelo *Doglas* ou por *qualquer profissional disponível*?',
      intent: 'ESCOLHA_PROFISSIONAL',
      component: 'barbers_list',
      quickReplies: [
        { label: 'mamuty.barber', action: 'ESCOLHER_BARBEIRO', payload: { barberName: 'mamuty.barber' } },
        { label: 'Doglas', action: 'ESCOLHER_BARBEIRO', payload: { barberName: 'Doglas' } },
        { label: 'Qualquer profissional', action: 'ESCOLHER_BARBEIRO', payload: { barberName: 'Qualquer profissional' } }
      ]
    };
  }

  // 12. PADRÃO COM CONDUÇÃO AMIGÁVEL
  return {
    reply: `Fala, tudo bem? Sou o *Marcos*, assistente digital da *Mamuty Barbearia*! 💈✂️\n\nPosso te ajudar a agendar um horário, consultar preços e serviços ou ver quem está atendendo hoje.\n\nO que você gostaria de fazer?`,
    intent: 'SAUDACAO_PADRAO',
    quickReplies: [
      { label: 'Quero agendar', action: 'INICIAR_AGENDAMENTO' },
      { label: 'Tem vaga hoje?', action: 'VER_HORARIOS_HOJE' },
      { label: 'Quanto custa o corte?', action: 'VER_SERVICOS' },
      { label: 'Vocês estão abertos hoje?', action: 'VER_FUNCIONAMENTO' }
    ]
  };
}

function getNextDayIso(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}
