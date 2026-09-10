import { Appointment, Barber, Customer, PaymentMethod, Service } from '../types';
import { MAMUTY_KNOWLEDGE_BASE } from './knowledgeBase';
import {
  tool_consultar_lista_servicos,
  tool_consultar_preco_servico,
  tool_consultar_lista_profissionais,
  tool_consultar_disponibilidade,
  tool_buscar_cliente_inteligente,
  tool_criar_cliente,
  tool_criar_agendamento,
  tool_cancelar_agendamento,
  tool_buscar_agendamentos_cliente,
  tool_verificar_status_negocio,
  tool_consultar_horario_funcionamento,
  tool_consultar_endereco,
  tool_consultar_formas_pagamento,
  tool_encaminhar_para_humano
} from './tools';
import {
  detectarIntencaoCompra,
  classificarLead,
  buscarObjecao,
  sugerirUpsell,
  sugerirCrossSell,
  gerarFraseFechamento,
  registrarOportunidade,
  LeadStatus,
  IntencaoCompra
} from './sales';
import {
  processarNovoAgendamento,
  processarConclusaoAtendimento,
  gerarMensagemRecuperacaoCliente,
  gerarMensagemRecuperacaoOportunidade,
  calcularSegmentoCliente,
  calcularIntervaloMedio,
  analisarAgenda,
  AutomationMetrics
} from './automation';
import {
  adicionarJobs,
  obterJobsProntos,
  obterJobsPorCliente,
  contarJobsPorStatus,
  obterEstatisticas
} from './automationQueue';

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
    | 'cancel_card'
    | 'rating_card'
    | 'automation_panel';
  componentData?: any;
  actionToExecute?: {
    type: 'CREATE_APPOINTMENT' | 'CANCEL_APPOINTMENT';
    payload: any;
  };
  newDraftState?: any;
  // Sprint 5: Dados comerciais
  leadStatus?: LeadStatus;
  intencao?: IntencaoCompra;
  oportunidade?: {
    servicoInteresse?: string;
    servicoId?: string;
    sugestaoUpsell?: string;
    sugestaoCrossSell?: string;
  };
  // Sprint 6: Dados de automação
  automationJobs?: { tipo: string; mensagem: string; agendadoPara: string }[];
  automationMetrics?: AutomationMetrics;
}

/**
 * CÉREBRO DO FUNCIONÁRIO DIGITAL MARCOS — SPRINT 4
 * 
 * Arquitetura:
 * - IA interpreta linguagem e contexto
 * - Sistema executa via tools
 * - Resposta é formulada de forma natural e orientada à venda
 * 
 * Regras fundamentais:
 * 1. NUNCA inventar preço ou horário
 * 2. Sempre consultar o sistema antes de responder
 * 3. Respostas curtas e naturais (WhatsApp style)
 * 4. Conduzir para agendamento quando possível
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

  // ============================================
  // 1. REGRAS FUNDAMENTAIS — NUNCA INVENTAR
  // ============================================

  // Serviços não cadastrados
  const servicosNaoCadastrados = ['infantil', 'kids', 'crianca', 'quimica', 'luzes', 'platinado', 'alisamento', 'relaxamento', 'pigmentacao', 'tatuagem', 'piercing'];
  const perguntouServicoInexistente = servicosNaoCadastrados.some(tag => norm.includes(tag)) && !norm.includes('social') && !norm.includes('degrade') && !norm.includes('barba');

  if (perguntouServicoInexistente) {
    const handoff = tool_encaminhar_para_humano('Serviço especial fora da grade');
    return {
      reply: 'Esse serviço não consta no nosso catálogo oficial no momento. 😊 Posso encaminhar você para a equipe da Mamury confirmar diretamente no WhatsApp?',
      intent: 'HUMAN_HANDOFF',
      toolUsed: 'encaminhar_para_humano',
      component: 'human_handoff',
      componentData: handoff.data,
      quickReplies: [
        { label: 'Falar com Hemerson', action: 'FALAR_COM_HUMANO' },
        { label: 'Ver serviços disponíveis', action: 'SERVICE_LIST' }
      ]
    };
  }

  // ============================================
  // 2. ENCAMINHAMENTO PARA HUMANO
  // ============================================
  if (
    norm.includes('falar com alguem') ||
    norm.includes('humano') ||
    norm.includes('atendente') ||
    norm.includes('pessoa') ||
    norm.includes('dono') ||
    norm.includes('falar com o hemerson') ||
    norm.includes('reclamacao') ||
    norm.includes('reclamação')
  ) {
    const handoff = tool_encaminhar_para_humano('Solicitação direta de contato humano');
    return {
      reply: 'Com certeza! 😊 Vou encaminhar você agora para a equipe da Mamuty.\n\nToque no botão abaixo para falar direto com o *Hemerson Barber*:',
      intent: 'HUMAN_HANDOFF',
      toolUsed: 'encaminhar_para_humano',
      component: 'human_handoff',
      componentData: handoff.data,
      leadStatus: 'PRECISA_DE_HUMANO',
      quickReplies: [
        { label: 'Voltar ao menu', action: 'GREETING' }
      ]
    };
  }

  // ============================================
  // 2.5 SPRINT 5: TRATAMENTO DE OBJEÇÕES
  // ============================================
  const objecaoDetectada = buscarObjecao(norm);
  if (objecaoDetectada) {
    return {
      reply: `${objecaoDetectada.resposta}\n\n${objecaoDetectada.conducao}`,
      intent: 'OBJECTION_HANDLING',
      leadStatus: 'INTERESSADO',
      quickReplies: [
        { label: 'Ver horários disponíveis', action: 'CHECK_AVAILABILITY' },
        { label: 'Agendar agora', action: 'START_BOOKING' },
        { label: 'Ver outros serviços', action: 'SERVICE_LIST' }
      ]
    };
  }

  // ============================================
  // 3. INTENÇÕES INFORMATIVAS
  // ============================================

  // BUSINESS_STATUS — Está aberto?
  if (
    norm.includes('aberto') ||
    norm.includes('funcionando') ||
    norm.includes('estao abertos') ||
    norm.includes('esta aberto') ||
    norm.includes('estao funcionando') ||
    norm.includes('esta funcionando')
  ) {
    const status = tool_verificar_status_negocio();
    const { aberta, diaSemana, horarioAbertura, horarioFechamento, temIntervalo, intervalo } = status.data;

    const statusTexto = aberta ? 'Sim, estamos abertos agora! ✅' : 'Ainda não abrimos hoje. 😅';
    const horariosTexto = `⏰ Hoje (${diaSemana}): ${horarioAbertura} às ${horarioFechamento}${temIntervalo ? `\n🔒 Intervalo: ${intervalo}` : ''}`;

    return {
      reply: `${statusTexto}\n\n${horariosTexto}\n\nPosso verificar os horários disponíveis para você? 👇`,
      intent: 'BUSINESS_STATUS',
      toolUsed: 'verificar_status_negocio',
      quickReplies: [
        { label: 'Ver horários disponíveis', action: 'CHECK_AVAILABILITY' },
        { label: 'Agendar horário', action: 'START_BOOKING' }
      ]
    };
  }

  // BUSINESS_HOURS — Horário de funcionamento detalhado
  if (
    norm.includes('horario de funcionamento') ||
    norm.includes('que horas abre') ||
    norm.includes('que horas fecha') ||
    norm.includes('funcionamento') ||
    norm.includes('horarios')
  ) {
    const horario = tool_consultar_horario_funcionamento(todayIso);
    const { diaSemana, abertura, fechamento, temIntervalo, intervalo, horariosSemanais } = horario.data;

    let texto = `📋 *Horário de funcionamento da Mamuty:*\n\n`;
    horariosSemanais.forEach((h: any) => {
      texto += `• ${h.dias}: ${h.horario}\n  ↳ Intervalo: ${h.intervalo}\n\n`;
    });
    texto += `Hoje (${diaSemana}): ${abertura} às ${fechamento}${temIntervalo ? `\n🔒 Intervalo: ${intervalo}` : ''}`;

    return {
      reply: texto,
      intent: 'BUSINESS_HOURS',
      toolUsed: 'consultar_horario_funcionamento',
      quickReplies: [
        { label: 'Ver horários livres', action: 'CHECK_AVAILABILITY' },
        { label: 'Agendar agora', action: 'START_BOOKING' }
      ]
    };
  }

  // SERVICE_LIST — Lista de serviços
  if (
    norm.includes('quais servicos') ||
    norm.includes('quais serviços') ||
    norm.includes('lista de servicos') ||
    norm.includes('lista de serviços') ||
    norm.includes('o que voces fazem') ||
    norm.includes('o que vocês fazem') ||
    norm.includes('servicos')
  ) {
    const servicos = await tool_consultar_lista_servicos();
    const listaFormatada = servicos.data.map((s: any) =>
      `• ✂️ *${s.nome}* — R$ ${s.preco} (${s.duracaoMinutos} min)`
    ).join('\n');

    return {
      reply: `💈 *Nossos serviços oficiais:*\n\n${listaFormatada}\n\nQual deles você gostaria de fazer? 😊`,
      intent: 'SERVICE_LIST',
      toolUsed: 'consultar_lista_servicos',
      component: 'services_list',
      componentData: { services: servicos.data },
      quickReplies: servicos.data.slice(0, 4).map((s: any) => ({
        label: `${s.nome} (R$ ${s.preco})`,
        action: 'SELECT_SERVICE',
        payload: { serviceId: s.id, serviceName: s.nome }
      }))
    };
  }

  // SERVICE_PRICE — Preço de serviço específico
  if (
    norm.includes('quanto custa') ||
    norm.includes('qual o preco') ||
    norm.includes('qual o preço') ||
    norm.includes('valor do') ||
    norm.includes('quanto é') ||
    norm.includes('quanto e')
  ) {
    // Detectar intenção de compra (Sprint 5)
    const intencao = detectarIntencaoCompra(userMessage, history.map(h => h.content));
    
    // Tentar extrair nome do serviço da mensagem
    let servicoBusca = '';
    if (norm.includes('degrade') || norm.includes('degradê')) servicoBusca = 'degradê';
    else if (norm.includes('social')) servicoBusca = 'social';
    else if (norm.includes('barba')) servicoBusca = 'barba';
    else if (norm.includes('cabelo e barba') || norm.includes('cabelo + barba') || norm.includes('combo')) servicoBusca = 'cabelo + barba';
    else if (norm.includes('sobrancelha')) servicoBusca = 'sobrancelha';
    else if (norm.includes('completo')) servicoBusca = 'completo';
    else {
      // Listar todos
      const servicos = await tool_consultar_lista_servicos();
      const listaFormatada = servicos.data.map((s: any) =>
        `• ✂️ *${s.nome}* — R$ ${s.preco} (${s.duracaoMinutos} min)`
      ).join('\n');

      return {
        reply: `Esses são os nossos serviços e valores:\n\n${listaFormatada}\n\nQual deles te interessa? 😊`,
        intent: 'SERVICE_PRICE',
        toolUsed: 'consultar_lista_servicos',
        component: 'services_list',
        componentData: { services: servicos.data },
        leadStatus: intencao.temIntencao ? 'INTERESSADO' : 'CURIOSO',
        intencao
      };
    }

    const preco = await tool_consultar_preco_servico(servicoBusca);
    if (preco.success && preco.data) {
      // Verificar upsell e cross-sell (Sprint 5)
      const upsell = sugerirUpsell(preco.data, MAMUTY_KNOWLEDGE_BASE.servicos);
      const crossSell = sugerirCrossSell(preco.data, MAMUTY_KNOWLEDGE_BASE.servicos);
      
      let respostaUpsell = '';
      if (upsell) {
        respostaUpsell = `\n\n💡 *Dica:* ${upsell.frase}`;
      }

      return {
        reply: `O *${preco.data.nome}* fica R$ ${preco.data.preco} e leva aproximadamente ${preco.data.duracaoMinutos} minutos. 😊${respostaUpsell}\n\nQuer que eu verifique os horários disponíveis para hoje?`,
        intent: 'SERVICE_PRICE',
        toolUsed: 'consultar_preco_servico',
        leadStatus: intencao.temIntencao ? 'INTERESSADO' : 'CURIOSO',
        intencao,
        oportunidade: {
          servicoInteresse: preco.data.nome,
          servicoId: preco.data.id,
          sugestaoUpsell: upsell?.servico.nome,
          sugestaoCrossSell: crossSell?.servico.nome
        },
        quickReplies: [
          { label: 'Sim, verificar horários', action: 'CHECK_AVAILABILITY' },
          { label: 'Agendar agora', action: 'START_BOOKING' }
        ],
        newDraftState: { service: preco.data }
      };
    }
  }

  // BARBER_LIST — Lista de profissionais
  if (
    norm.includes('quem atende') ||
    norm.includes('quem esta atendendo') ||
    norm.includes('quem está atendendo') ||
    norm.includes('quais barbeiros') ||
    norm.includes('profissionais') ||
    norm.includes('barbeiros') ||
    norm.includes('quem corta')
  ) {
    const barbeiros = await tool_consultar_lista_profissionais();
    const listaFormatada = barbeiros.data.map((b: any) =>
      `• 💈 *${b.nome}* — ${b.titulo}`
    ).join('\n');

    return {
      reply: `Nossos profissionais ativos:\n\n${listaFormatada}\n\nCom quem você prefere ser atendido?`,
      intent: 'BARBER_LIST',
      toolUsed: 'consultar_lista_profissionais',
      component: 'barbers_list',
      componentData: { barbers: barbeiros.data },
      quickReplies: barbeiros.data.map((b: any) => ({
        label: b.nome,
        action: 'SELECT_BARBER',
        payload: { barberId: b.id, barberName: b.nome }
      }))
    };
  }

  // ADDRESS — Endereço
  if (
    norm.includes('onde fica') ||
    norm.includes('endereco') ||
    norm.includes('endereço') ||
    norm.includes('localizacao') ||
    norm.includes('localização') ||
    norm.includes('como chegar') ||
    norm.includes('mapa')
  ) {
    const endereco = tool_consultar_endereco();
    return {
      reply: `📍 *Endereço da Mamuty Barbearia:*\n\n${endereco.data.enderecoCompleto}\n\n📲 WhatsApp: ${endereco.data.whatsapp}`,
      intent: 'ADDRESS',
      toolUsed: 'consultar_endereco',
      quickReplies: [
        { label: 'Agendar horário', action: 'START_BOOKING' },
        { label: 'Ver serviços', action: 'SERVICE_LIST' }
      ]
    };
  }

  // PAYMENT_METHODS — Formas de pagamento
  if (
    norm.includes('aceita pix') ||
    norm.includes('aceita cartao') ||
    norm.includes('aceita cartão') ||
    norm.includes('forma de pagamento') ||
    norm.includes('formas de pagamento') ||
    norm.includes('como posso pagar') ||
    norm.includes('pagamento')
  ) {
    const pagamentos = tool_consultar_formas_pagamento();
    return {
      reply: `💳 *Formas de pagamento aceitas:*\n\n• PIX\n• Dinheiro\n• Cartão de Débito\n• Cartão de Crédito\n\n${pagamentos.data.observacao}`,
      intent: 'PAYMENT_METHODS',
      toolUsed: 'consultar_formas_pagamento',
      quickReplies: [
        { label: 'Agendar horário', action: 'START_BOOKING' }
      ]
    };
  }

  // ============================================
  // 4. INTENÇÕES DE AGENDAMENTO
  // ============================================

  // CHECK_AVAILABILITY — Consultar disponibilidade
  if (
    norm.includes('tem vaga') ||
    norm.includes('vaga hoje') ||
    norm.includes('horario disponivel') ||
    norm.includes('horarios livres') ||
    norm.includes('tem horario') ||
    norm.includes('tem vaga hoje') ||
    norm.includes('vagas') ||
    norm.includes('consigo cortar') ||
    norm.includes('quero cortar') ||
    norm.includes('quero marcar') ||
    norm.includes('quero agendar')
  ) {
    // Detectar intenção de compra (Sprint 5)
    const intencao = detectarIntencaoCompra(userMessage, history.map(h => h.content));
    
    const duracao = context.activeDraft?.service?.durationMinutes || 40;
    const res = tool_consultar_disponibilidade(todayIso, context.appointments, context.barbers, duracao);
    const vagas = res.data.vagas.slice(0, 6);

    if (vagas.length > 0) {
      const listaStr = vagas.map((v: any) => `• 🕐 *${v.horario}* — ${v.barbeiros.join(' ou ')}`).join('\n');
      
      // Gerar frase de fechamento (Sprint 5)
      const servicoAtivo = context.activeDraft?.service;
      const fechamento = gerarFraseFechamento(
        servicoAtivo ? {
          id: servicoAtivo.id,
          nome: servicoAtivo.name,
          preco: servicoAtivo.price,
          duracaoMinutos: servicoAtivo.durationMinutes
        } : undefined,
        vagas.map((v: any) => ({ horario: v.horario, barbeiros: v.barbeiros }))
      );

      return {
        reply: `Sim! 😊 Temos horários disponíveis hoje:\n\n${listaStr}\n\n${fechamento.frase}`,
        intent: 'CHECK_AVAILABILITY',
        toolUsed: 'consultar_disponibilidade',
        component: 'slots_list',
        componentData: { slots: vagas },
        leadStatus: intencao.temIntencao ? 'PRONTO_PARA_AGENDAR' : 'INTERESSADO',
        intencao,
        quickReplies: vagas.map((v: any) => ({
          label: v.horario,
          action: 'SELECT_TIME',
          payload: { time: v.horario, date: todayIso }
        }))
      };
    } else {
      return {
        reply: 'Hoje não encontrei horários livres com os critérios atuais. 😅 Quer verificar para amanhã?',
        intent: 'CHECK_AVAILABILITY',
        leadStatus: 'INTERESSADO',
        quickReplies: [
          { label: 'Ver amanhã', action: 'SELECT_DATE', payload: { date: getNextDayIso(1) } },
          { label: 'Ver outro dia', action: 'SELECT_DATE' }
        ]
      };
    }
  }

  // START_BOOKING — Iniciar agendamento
  if (
    norm.includes('quero marcar') ||
    norm.includes('quero agendar') ||
    norm.includes('agendar horario') ||
    norm.includes('marcar um horario') ||
    norm.includes('agendar agora') ||
    norm === 'agendar' ||
    norm === 'marcar' ||
    norm.includes('pode agendar') ||
    norm.includes('pode marcar')
  ) {
    // Detectar intenção de compra (Sprint 5)
    const intencao = detectarIntencaoCompra(userMessage, history.map(h => h.content));
    
    const servicos = await tool_consultar_lista_servicos();
    return {
      reply: `Show de bola! 💈 Vamos agendar seu atendimento na Mamuty.\n\nQual serviço você gostaria de fazer? 👇`,
      intent: 'START_BOOKING',
      toolUsed: 'consultar_lista_servicos',
      component: 'services_list',
      componentData: { services: servicos.data },
      leadStatus: 'PRONTO_PARA_AGENDAR',
      intencao,
      quickReplies: servicos.data.slice(0, 4).map((s: any) => ({
        label: `${s.nome} (R$ ${s.preco})`,
        action: 'SELECT_SERVICE',
        payload: { serviceId: s.id, serviceName: s.nome }
      }))
    };
  }

  // SELECT_SERVICE — Escolher serviço
  if (norm.includes('corte social') || norm.includes('social')) {
    const srv = MAMUTY_KNOWLEDGE_BASE.servicos.find(s => s.nome.toLowerCase().includes('social'))!;
    return {
      reply: `Perfeito! *${srv.nome}* — R$ ${srv.preco} (${srv.duracaoMinutos} min). 😊\n\nCom quem você prefere ser atendido?`,
      intent: 'SELECT_SERVICE',
      component: 'barbers_list',
      quickReplies: [
        { label: 'mamuty.barber', action: 'SELECT_BARBER', payload: { barberName: 'mamuty.barber' } },
        { label: 'Doglas', action: 'SELECT_BARBER', payload: { barberName: 'Doglas' } },
        { label: 'Qualquer profissional', action: 'SELECT_BARBER', payload: { barberName: 'Qualquer profissional' } }
      ],
      newDraftState: { service: srv }
    };
  }

  if (norm.includes('degrade') || norm.includes('degradê')) {
    const srv = MAMUTY_KNOWLEDGE_BASE.servicos.find(s => s.nome.toLowerCase().includes('degradê'))!;
    return {
      reply: `Excelente! *${srv.nome}* — R$ ${srv.preco} (${srv.duracaoMinutos} min). 😊\n\nCom quem você prefere ser atendido?`,
      intent: 'SELECT_SERVICE',
      component: 'barbers_list',
      quickReplies: [
        { label: 'mamuty.barber', action: 'SELECT_BARBER', payload: { barberName: 'mamuty.barber' } },
        { label: 'Doglas', action: 'SELECT_BARBER', payload: { barberName: 'Doglas' } },
        { label: 'Qualquer profissional', action: 'SELECT_BARBER', payload: { barberName: 'Qualquer profissional' } }
      ],
      newDraftState: { service: srv }
    };
  }

  if (norm.includes('barba')) {
    const srv = MAMUTY_KNOWLEDGE_BASE.servicos.find(s => s.nome.toLowerCase().includes('barba'))!;
    return {
      reply: `Beleza! *${srv.nome}* — R$ ${srv.preco} (${srv.duracaoMinutos} min). 😊\n\nCom quem você prefere?`,
      intent: 'SELECT_SERVICE',
      component: 'barbers_list',
      quickReplies: [
        { label: 'mamuty.barber', action: 'SELECT_BARBER', payload: { barberName: 'mamuty.barber' } },
        { label: 'Doglas', action: 'SELECT_BARBER', payload: { barberName: 'Doglas' } }
      ],
      newDraftState: { service: srv }
    };
  }

  if (norm.includes('cabelo e barba') || norm.includes('cabelo + barba') || norm.includes('combo')) {
    const srv = MAMUTY_KNOWLEDGE_BASE.servicos.find(s => s.nome.includes('+'))!;
    return {
      reply: `Bora! *${srv.nome}* — R$ ${srv.preco} (${srv.duracaoMinutos} min). 💈\n\nCom quem você prefere?`,
      intent: 'SELECT_SERVICE',
      component: 'barbers_list',
      quickReplies: [
        { label: 'mamuty.barber', action: 'SELECT_BARBER', payload: { barberName: 'mamuty.barber' } },
        { label: 'Doglas', action: 'SELECT_BARBER', payload: { barberName: 'Doglas' } }
      ],
      newDraftState: { service: srv }
    };
  }

  // SELECT_BARBER — Escolher profissional
  if (norm.includes('mamuty') || norm.includes('hemerson')) {
    const barber = context.barbers.find(b => b.name.toLowerCase().includes('mamuty')) || context.barbers[0];
    return {
      reply: `Perfeito, com o *${barber.name}*! 👊\n\nPara qual dia?`,
      intent: 'SELECT_BARBER',
      component: 'dates_list',
      quickReplies: [
        { label: 'Hoje', action: 'SELECT_DATE', payload: { date: todayIso } },
        { label: 'Amanhã', action: 'SELECT_DATE', payload: { date: getNextDayIso(1) } }
      ],
      newDraftState: { barber }
    };
  }

  if (norm.includes('doglas')) {
    const barber = context.barbers.find(b => b.name === 'Doglas') || context.barbers[1];
    return {
      reply: `Beleza, com o *${barber.name}*! 💈\n\nPara qual dia?`,
      intent: 'SELECT_BARBER',
      component: 'dates_list',
      quickReplies: [
        { label: 'Hoje', action: 'SELECT_DATE', payload: { date: todayIso } },
        { label: 'Amanhã', action: 'SELECT_DATE', payload: { date: getNextDayIso(1) } }
      ],
      newDraftState: { barber }
    };
  }

  if (norm.includes('tanto faz') || norm.includes('qualquer') || norm.includes('primeiro disponivel') || norm.includes('primeiro disponível')) {
    return {
      reply: `Beleza, vou verificar o primeiro horário livre para você! 😊\n\nPara qual dia?`,
      intent: 'SELECT_BARBER',
      component: 'dates_list',
      quickReplies: [
        { label: 'Hoje', action: 'SELECT_DATE', payload: { date: todayIso } },
        { label: 'Amanhã', action: 'SELECT_DATE', payload: { date: getNextDayIso(1) } }
      ],
      newDraftState: { barber: context.barbers.find(b => b.id !== 'any') }
    };
  }

  // ============================================
  // 5. PÓS-AGENDAMENTO
  // ============================================

  // CANCEL_APPOINTMENT
  if (
    norm.includes('cancelar') ||
    norm.includes('desmarcar') ||
    norm.includes('nao vou poder ir') ||
    norm.includes('não vou poder ir') ||
    norm.includes('nao posso ir') ||
    norm.includes('não posso ir')
  ) {
    const phone = context.currentCustomer?.phone || context.activeDraft?.customerPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');

    const userApt = cleanPhone
      ? context.appointments.find(a => a.customerPhone.replace(/\D/g, '').endsWith(cleanPhone.slice(-8)) && a.status === 'confirmed')
      : context.appointments.find(a => a.status === 'confirmed');

    if (userApt) {
      return {
        reply: `Claro! Encontrei seu agendamento:\n\n📅 *${userApt.date.split('-').reverse().join('/')} às ${userApt.time}*\n✂️ *${userApt.serviceNames?.[0]}* com *${userApt.barberName}*\n\nDeseja cancelar?`,
        intent: 'CANCEL_APPOINTMENT',
        component: 'cancel_card',
        componentData: { appointment: userApt },
        quickReplies: [
          { label: 'Sim, cancelar', action: 'CONFIRM_CANCEL', payload: { id: userApt.id } },
          { label: 'Não, manter', action: 'GREETING' }
        ]
      };
    }

    return {
      reply: 'Para localizar seu agendamento, me informe seu *WhatsApp* com DDD:',
      intent: 'CANCEL_APPOINTMENT',
      quickReplies: [
        { label: 'Falar com atendente', action: 'HUMAN_HANDOFF' }
      ]
    };
  }

  // CHECK_MY_APPOINTMENT
  if (
    norm.includes('meus agendamentos') ||
    norm.includes('meu horario') ||
    norm.includes('meu horário') ||
    norm.includes('quando eu tenho') ||
    norm.includes('proximo corte') ||
    norm.includes('próximo corte')
  ) {
    const phone = context.currentCustomer?.phone || context.activeDraft?.customerPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length >= 8) {
      const apts = await tool_buscar_agendamentos_cliente(cleanPhone, context.appointments);
      if (apts.data.total > 0) {
        const lista = apts.data.agendamentos.map((a: any) =>
          `📅 *${a.data.split('-').reverse().join('/')} às ${a.horario}*\n✂️ ${a.servico} com ${a.barbeiro}`
        ).join('\n\n');

        return {
          reply: `Encontrei seus agendamentos:\n\n${lista}`,
          intent: 'CHECK_MY_APPOINTMENT',
          toolUsed: 'buscar_agendamentos_cliente'
        };
      }
    }

    return {
      reply: 'Para verificar seus agendamentos, me informe seu *WhatsApp* com DDD:',
      intent: 'CHECK_MY_APPOINTMENT'
    };
  }

  // ============================================
  // 6. GÍRIAS E LINGUAGEM NATURAL
  // ============================================

  // "Só tenho meia hora"
  if (norm.includes('meia hora') || norm.includes('30 min') || norm.includes('pouco tempo') || norm.includes('algo rapido') || norm.includes('apressado')) {
    const servicosRapidos = MAMUTY_KNOWLEDGE_BASE.servicos.filter(s => s.duracaoMinutos <= 30);
    return {
      reply: `Perfeito! Para quem tem até 30 minutos:\n\n• ✂️ *Corte social* — R$ 40 (30 min)\n• 🧔 *Barba simples* — R$ 35 (30 min)\n\nQuer garantir um desses?`,
      intent: 'SERVICE_LIST',
      component: 'services_list',
      componentData: { services: servicosRapidos }
    };
  }

  // "Dar um tapa no visual"
  if (norm.includes('tapa no visual') || norm.includes('dar um talento') || norm.includes('mudar o visual') || norm.includes('ficar na regua') || norm.includes('ficar na régua')) {
    return {
      reply: `É pra já! 💈👊\n\nO combo *Cabelo + Barba* fica R$ 70 e leva uns 50 min. Quer ver?`,
      intent: 'SERVICE_LIST',
      quickReplies: [
        { label: 'Combo Cabelo + Barba (R$ 70)', action: 'SELECT_SERVICE', payload: { serviceId: 'srv-cabelo-barba' } },
        { label: 'Corte degradê (R$ 40)', action: 'SELECT_SERVICE', payload: { serviceId: 'srv-corte-degrade' } }
      ]
    };
  }

  // "Depois do trampo"
  const isAposTrampo = norm.includes('depois do trampo') || norm.includes('depois do trabalho') || norm.includes('fim de tarde') || norm.includes('noite') || norm.includes('depois das 17') || norm.includes('depois das 18');
  if (isAposTrampo) {
    const minTime = norm.includes('18') || norm.includes('seis') ? '18:00' : '17:00';
    const duracao = context.activeDraft?.service?.durationMinutes || 40;
    const res = tool_consultar_disponibilidade(todayIso, context.appointments, context.barbers, duracao, undefined, minTime);
    const vagasFimTarde = res.data.vagas.filter((v: any) => v.horario >= minTime);

    if (vagasFimTarde.length > 0) {
      const listaStr = vagasFimTarde.slice(0, 4).map((v: any) => `• 🕐 *${v.horario}* com ${v.barbeiros.join(' ou ')}`).join('\n');
      return {
        reply: `Consigo sim! Hoje depois das ${minTime}:\n\n${listaStr}\n\nQual fica melhor? 😊`,
        intent: 'CHECK_AVAILABILITY',
        component: 'slots_list',
        componentData: { slots: vagasFimTarde }
      };
    } else {
      return {
        reply: `Depois das ${minTime} tá cheio! 💈 Mas amanhã tenho vagas no final da tarde. Quer ver?`,
        intent: 'CHECK_AVAILABILITY',
        quickReplies: [
          { label: 'Ver amanhã', action: 'SELECT_DATE', payload: { date: getNextDayIso(1) } }
        ]
      };
    }
  }

  // ============================================
  // 6.5 SPRINT 6: PÓS-VENDA E RECUPERAÇÃO
  // ============================================

  // Avaliação (resposta do cliente)
  if (
    norm.includes('estrela') ||
    norm.includes('nota') ||
    norm.includes('avaliação') ||
    norm.includes('avaliacao') ||
    (norm.match(/^[1-5]$/) && history.some(h => h.content.includes('avaliação')))
  ) {
    const nota = parseInt(norm) || 0;
    if (nota >= 1 && nota <= 5) {
      const estrelas = '⭐'.repeat(nota);
      return {
        reply: `Obrigado pela avaliação, ${context.currentCustomer?.name || 'amigo'}! ${estrelas}\n\nSua opinião é muito importante para a Mamuty. Se quiser deixar um comentário sobre o atendimento, é só enviar! 🙏`,
        intent: 'RATING_RECEIVED',
        quickReplies: [
          { label: 'Menu inicial', action: 'GREETING' },
          { label: 'Agendar novamente', action: 'START_BOOKING' }
        ]
      };
    }
  }

  // Feedback / comentário sobre atendimento
  if (
    norm.includes('ficou bom') ||
    norm.includes('gostei') ||
    norm.includes('excelente') ||
    norm.includes('maravilhoso') ||
    norm.includes('perfeito') ||
    norm.includes('ruim') ||
    norm.includes('péssimo') ||
    norm.includes('não gostei')
  ) {
    const positivo = !norm.includes('ruim') && !norm.includes('péssimo') && !norm.includes('não gostei');
    return {
      reply: positivo
        ? `Que bom que você gostou, ${context.currentCustomer?.name || 'amigo'}! 🙏 Isso nos motiva a continuar melhorando. Esperamos ver você de novo na Mamuty! 💈`
        : `Lamentamos que não tenha sido uma experiência ideal, ${context.currentCustomer?.name || 'amigo'}. 🙏 Sua opinião é importante para nós melhorarmos. Se quiser conversar sobre isso, posso encaminhar para o Hemerson.`,
      intent: 'FEEDBACK_RECEIVED',
      quickReplies: [
        { label: 'Menu inicial', action: 'GREETING' },
        { label: 'Falar com Hemerson', action: 'HUMAN_HANDOFF' }
      ]
    };
  }

  // Consultar status de automações (admin)
  if (
    norm.includes('status automação') ||
    norm.includes('status automacao') ||
    norm.includes('filas de envio') ||
    norm.includes('mensagens pendentes')
  ) {
    const stats = obterEstatisticas();
    return {
      reply: `📊 *Status das Automações:*\n\n📝 Pendentes: ${stats.porStatus.PENDENTE}\n✅ Enviadas: ${stats.porStatus.ENVIADO}\n❌ Falhas: ${stats.porStatus.FALHA}\n🚫 Canceladas: ${stats.porStatus.CANCELADO}\n\n📈 Taxa de sucesso: ${stats.taxaSucesso}%`,
      intent: 'AUTOMATION_STATUS',
      component: 'automation_panel',
      componentData: stats,
      quickReplies: [
        { label: 'Menu inicial', action: 'GREETING' }
      ]
    };
  }

  // Verificar agenda do dia (oportunidades)
  if (
    norm.includes('agenda do dia') ||
    norm.includes('horários livres hoje') ||
    norm.includes('horarios livres hoje') ||
    norm.includes('oportunidades de agenda')
  ) {
    const todayIso = new Date().toISOString().split('T')[0];
    const oportunidade = analisarAgenda(todayIso, context.appointments, context.barbers, context.services);

    if (oportunidade.baixaOcupacao) {
      return {
        reply: `📊 *Agenda de Hoje:*\n\n📍 Ocupação: ${oportunidade.percentualOcupacao}%\n🟢 Slots livres: ${oportunidade.slotsLivres.length}\n💡 Baixa ocupação detectada!\n\nHorários livres:\n${oportunidade.slotsLivres.map(s => `• ${s.horario}`).join('\n')}\n\nPosso contactar clientes para preencher esses horários?`,
        intent: 'SCHEDULE_OPPORTUNITY',
        componentData: oportunidade,
        quickReplies: [
          { label: 'Sim, contactar clientes', action: 'FILL_SCHEDULE' },
          { label: 'Não, manter agenda', action: 'GREETING' }
        ]
      };
    } else {
      return {
        reply: `📊 *Agenda de Hoje:*\n\n📍 Ocupação: ${oportunidade.percentualOcupacao}%\n🟢 Slots livres: ${oportunidade.slotsLivres.length}\n\nA agenda está bem preenchida! 💈`,
        intent: 'SCHEDULE_CHECK',
        quickReplies: [
          { label: 'Menu inicial', action: 'GREETING' }
        ]
      };
    }
  }

  // Verificar clientes para recuperação
  if (
    norm.includes('clientes inativos') ||
    norm.includes('clientes para recuperar') ||
    norm.includes('quem precisa de follow')
  ) {
    return {
      reply: `🔄 *Clientes para Recuperação:*\n\nPara verificar clientes inativos, preciso acessar a base de dados.\n\nNo painel administrativo, você pode ver:\n• 🟡 Clientes em risco (próximos do intervalo)\n• 🔴 Clientes perdidos (60+ dias)\n• ⭐ Clientes frequentes\n\nPosso ajudar com algo mais?`,
      intent: 'RECOVERY_CHECK',
      quickReplies: [
        { label: 'Ver painel admin', action: 'GREETING' },
        { label: 'Menu inicial', action: 'GREETING' }
      ]
    };
  }

  // ============================================
  // 7. RESPOSTAS PADRÃO
  // ============================================

  // Saudações
  if (
    norm === 'oi' || norm === 'ola' || norm === 'opa' || norm.startsWith('bom dia') || norm.startsWith('boa tarde') || norm.startsWith('boa noite') || norm === 'e ai' || norm === 'eai'
  ) {
    return {
      reply: `Fala! 👊 Sou o *Marcos*, assistente da *Mamuty Barbearia*.\n\nComo posso te ajudar? 💈`,
      intent: 'GREETING',
      quickReplies: [
        { label: 'Quero agendar', action: 'START_BOOKING' },
        { label: 'Tem vaga hoje?', action: 'CHECK_AVAILABILITY' },
        { label: 'Ver preços', action: 'SERVICE_LIST' }
      ]
    };
  }

  // Agradecimentos
  if (norm.includes('obrigado') || norm.includes('obrigada') || norm.includes('valeu') || norm.includes('thanks')) {
    return {
      reply: `Tamo junto! 👊 Qualquer coisa, é só chamar. Até mais! 💈`,
      intent: 'THANKS',
      quickReplies: [
        { label: 'Menu inicial', action: 'GREETING' }
      ]
    };
  }

  // Adeus
  if (norm.includes('tchau') || norm.includes('ate mais') || norm.includes('até mais') || norm.includes('flw') || norm.includes('falou')) {
    return {
      reply: `Valeu! 👊 Até a próxima na Mamuty! 💈`,
      intent: 'GOODBYE',
      quickReplies: []
    };
  }

  // ============================================
  // 8. FALLBACK — PADRÃO COM CONDUÇÃO (SPRINT 5: CLASSIFICAÇÃO DE LEAD)
  // ============================================
  
  // Detectar intenção de compra (Sprint 5)
  const intencaoFinal = detectarIntencaoCompra(userMessage, history.map(h => h.content));
  const classificacaoLead = classificarLead(userMessage, intencaoFinal, false);
  
  // Registrar oportunidade se houver intenção de compra (Sprint 5)
  if (intencaoFinal.temIntencao && intencaoFinal.nivel >= 30) {
    const oportunidade = registrarOportunidade(
      context.currentCustomer?.phone || '',
      context.currentCustomer?.name,
      intencaoFinal,
      classificacaoLead.status
    );
  }
  
  return {
    reply: `Fala, tudo bem? Sou o *Marcos*, assistente da *Mamuty Barbearia*! 💈\n\nPosso te ajudar a agendar, consultar preços ou ver horários.\n\nO que você precisa?`,
    intent: 'UNKNOWN',
    leadStatus: classificacaoLead.status,
    intencao: intencaoFinal,
    quickReplies: [
      { label: 'Quero agendar', action: 'START_BOOKING' },
      { label: 'Tem vaga hoje?', action: 'CHECK_AVAILABILITY' },
      { label: 'Ver preços', action: 'SERVICE_LIST' },
      { label: 'Falar com atendente', action: 'HUMAN_HANDOFF' }
    ]
  };
}

function getNextDayIso(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}
