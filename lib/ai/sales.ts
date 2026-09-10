import { Appointment, Barber, Customer, PaymentMethod, Service } from '../types';
import { MAMUTY_KNOWLEDGE_BASE, ServicoConhecimento } from './knowledgeBase';

// Interface genérica para serviços (aceita tanto ServicoConhecimento quanto objetos de tool)
export interface ServicoGenerico {
  id: string;
  nome: string;
  preco: number;
  duracaoMinutos: number;
  descricao?: string;
  tags?: string[];
}

// ============================================
// SISTEMA DE CLASSIFICAÇÃO DE LEADS
// ============================================

export type LeadStatus =
  | 'PRONTO_PARA_AGENDAR'  // 🟢 - Já quer agendar
  | 'INTERESSADO'          // 🟡 - Perguntou preço, demonstrou interesse
  | 'CURIOSO'              // 🔵 - Perguntas gerais
  | 'PRECISA_DE_HUMANO'    // 🔴 - Reclamação, problema especial
  | 'NAO_CONVERTIDO';      // ⚫ - Desistiu ou não respondeu

export interface LeadClassification {
  status: LeadStatus;
  confianca: number; // 0-100
  sinal: string;     // O que indicou essa classificação
  proximaAcao: string;
}

export interface Oportunidade {
  id: string;
  clientePhone: string;
  clienteNome?: string;
  servicoInteresse?: string;
  servicoId?: string;
  leadStatus: LeadStatus;
  ultimaInteracao: string;
  conversionAttempted: boolean;
  notes: string;
}

// ============================================
// DETECÇÃO DE INTENÇÃO DE COMPRA
// ============================================

export interface IntencaoCompra {
  temIntencao: boolean;
  nivel: number; // 0-100
  servicoInteresse?: string;
  servicoId?: string;
  sinais: string[];
}

export function detectarIntencaoCompra(texto: string, historico: string[]): IntencaoCompra {
  const norm = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const sinais: string[] = [];
  let nivel = 0;

  // Sinais fortes de compra (nível alto)
  const sinaisFortes = [
    'quero marcar',
    'quero agendar',
    'pode reservar',
    'pode agendar',
    'tem vaga',
    'horario disponivel',
    'quero cortar',
    'quero fazer',
    'posso ir',
    'vou la',
    'bora',
    'fechado',
    'pode ser',
    'manda ver',
    'topo'
  ];

  // Sinais médios de interesse
  const sinaisMedios = [
    'quanto custa',
    'qual o preco',
    'valor do',
    'quanto e',
    'preco de',
    'cabelo e barba',
    'cabelo + barba',
    'degrade',
    'barba',
    'combo',
    'servicos'
  ];

  // Sinais fracos de curiosidade
  const sinaisFracos = [
    'o que voces fazem',
    'quais servicos',
    'tem barba',
    'faz corte',
    'funciona'
  ];

  // Verificar sinais fortes
  for (const sinal of sinaisFortes) {
    if (norm.includes(sinal)) {
      sinais.push(sinal);
      nivel += 30;
    }
  }

  // Verificar sinais médios
  for (const sinal of sinaisMedios) {
    if (norm.includes(sinal)) {
      sinais.push(sinal);
      nivel += 20;
    }
  }

  // Verificar sinais fracos
  for (const sinal of sinaisFracos) {
    if (norm.includes(sinal)) {
      sinais.push(sinal);
      nivel += 10;
    }
  }

  // Bonus: se já houve interação anterior sobre o mesmo serviço
  if (historico.length > 0) {
    const ultimaMsg = historico[historico.length - 1].toLowerCase();
    if (sinaisMedios.some(s => ultimaMsg.includes(s))) {
      nivel += 15;
      sinais.push('interesse_anterior');
    }
  }

  // Bonus: perguntas sobre disponibilidade
  if (norm.includes('hoje') || norm.includes('agora') || norm.includes('amanha')) {
    nivel += 15;
    sinais.push('tempo_imediato');
  }

  // Detectar serviço de interesse
  let servicoInteresse: string | undefined;
  let servicoId: string | undefined;

  if (norm.includes('cabelo e barba') || norm.includes('cabelo + barba') || norm.includes('combo')) {
    servicoInteresse = 'Cabelo + Barba';
    servicoId = 'srv-cabelo-barba';
  } else if (norm.includes('degrade') || norm.includes('degradê')) {
    servicoInteresse = 'Corte degradê';
    servicoId = 'srv-corte-degrade';
  } else if (norm.includes('social')) {
    servicoInteresse = 'Corte social';
    servicoId = 'srv-corte-social';
  } else if (norm.includes('barba')) {
    servicoInteresse = 'Barba simples';
    servicoId = 'srv-barba-simples';
  } else if (norm.includes('sobrancelha')) {
    servicoInteresse = 'Cabelo + Sobrancelha';
    servicoId = 'srv-cabelo-sobrancelha';
  } else if (norm.includes('completo')) {
    servicoInteresse = 'Combo Completo';
    servicoId = 'srv-combo-completo';
  }

  return {
    temIntencao: nivel >= 20,
    nivel: Math.min(nivel, 100),
    servicoInteresse,
    servicoId,
    sinais
  };
}

// ============================================
// CLASSIFICAÇÃO DE LEAD
// ============================================

export function classificarLead(
  texto: string,
  intencao: IntencaoCompra,
  temAgendamentoRecente: boolean
): LeadClassification {
  const norm = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 🔴 PRECISA DE HUMANO
  if (
    norm.includes('reclamacao') ||
    norm.includes('reclamação') ||
    norm.includes('problema') ||
    norm.includes('errado') ||
    norm.includes('ruim') ||
    norm.includes('péssimo') ||
    norm.includes('pessimo') ||
    norm.includes('quero falar com o dono') ||
    norm.includes('quero negociar')
  ) {
    return {
      status: 'PRECISA_DE_HUMANO',
      confianca: 90,
      sinal: 'Reclamação ou solicitação especial detectada',
      proximaAcao: 'Encaminhar para atendimento humano'
    };
  }

  // 🟢 PRONTO PARA AGENDAR
  if (intencao.nivel >= 60 || intencao.sinais.some(s =>
    ['quero marcar', 'quero agendar', 'pode reservar', 'tem vaga', 'pode ser', 'fechado'].includes(s)
  )) {
    return {
      status: 'PRONTO_PARA_AGENDAR',
      confianca: Math.min(intencao.nivel + 20, 100),
      sinal: 'Demonstrou intenção clara de agendar',
      proximaAcao: 'Verificar disponibilidade e tentar fechar'
    };
  }

  // 🟡 INTERESSADO
  if (intencao.nivel >= 30 || intencao.sinais.some(s =>
    ['quanto custa', 'qual o preco', 'valor do', 'preco de'].includes(s)
  )) {
    return {
      status: 'INTERESSADO',
      confianca: Math.min(intencao.nivel + 10, 80),
      sinal: 'Perguntou preço ou demonstrou interesse específico',
      proximaAcao: 'Apresentar valor + duração + conduzir para agendamento'
    };
  }

  // 🔵 CURIOSO
  if (intencao.nivel >= 10) {
    return {
      status: 'CURIOSO',
      confianca: Math.min(intencao.nivel, 60),
      sinal: 'Fez pergunta geral sobre serviços',
      proximaAcao: 'Apresentar opções e tentar identificar interesse'
    };
  }

  // ⚫ NÃO CONVERTIDO (padrão)
  return {
    status: 'CURIOSO',
    confianca: 30,
    sinal: 'Mensagem inicial sem sinais claros',
    proximaAcao: 'Apresentar cardápio e perguntar como ajudar'
  };
}

// ============================================
// BASE DE OBJEÇÕES E RESPOSTAS
// ============================================

export interface Objecao {
  padroes: string[];
  resposta: string;
  conducao: string;
  acao: string;
}

export const BASE_OBJECOES: Objecao[] = [
  {
    padroes: ['caro', 'muito', 'preco alto', 'preço alto', 'valor alto'],
    resposta: 'Entendo! 😊 Se quiser uma opção mais acessível, temos o corte social por R$ 40 e a barba por R$ 35.',
    conducao: 'Posso verificar os horários disponíveis para você?',
    acao: 'OFERECER_ALTERNATIVA'
  },
  {
    padroes: ['nao sei qual', 'não sei qual', 'nao sei escolher', 'não sei escolher', 'duvida'],
    resposta: 'Sem problema! Se você quer algo mais simples e rápido, o corte social é uma ótima opção. Se quiser um visual mais moderno, o degradê é perfeito.',
    conducao: 'Qual estilo você prefere?',
    acao: 'AJUDAR_ESCOLHA'
  },
  {
    padroes: ['nao tenho tempo', 'não tenho tempo', 'pressa', 'rapido', 'agil'],
    resposta: 'Entendo! Posso verificar o profissional que tem o horário mais próximo disponível para você.',
    conducao: 'Quer que eu encontre o primeiro horário livre?',
    acao: 'ENCONTRAR_HORARIO'
  },
  {
    padroes: ['nao sei se quero', 'não sei se quero', 'depois', 'mais tarde', 'pensar'],
    resposta: 'Sem pressa! 😊 Posso deixar os horários disponíveis para você ver quando quiser.',
    conducao: 'Quer que eu verifique as opções para hoje ou amanhã?',
    acao: 'MANTER_INTERESSE'
  },
  {
    padroes: ['brinco', 'brincadeira', 'zoeira', 'encherao'],
    resposta: 'Tranquilo! 😊 Quando quiser agendar sério, é só chamar. Estou aqui!',
    conducao: '',
    acao: 'AGUARDAR'
  },
  {
    padroes: ['nao gosto', 'não gosto', 'odeio', 'horror'],
    resposta: 'Cada pessoa tem seu estilo! 😊 Temos várias opções diferentes. Qual tipo de corte você mais curte?',
    conducao: 'Posso te mostrar nossos serviços.',
    acao: 'REDIRECIONAR'
  }
];

export function buscarObjecao(texto: string): Objecao | null {
  const norm = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  for (const objecao of BASE_OBJECOES) {
    if (objecao.padroes.some(padrao => norm.includes(padrao))) {
      return objecao;
    }
  }

  return null;
}

// ============================================
// UPSELL E CROSS-SELL
// ============================================

export interface SugestaoServico {
  servico: ServicoGenerico;
  motivo: string;
  frase: string;
}

export function sugerirUpsell(
  servicoAtual: ServicoGenerico,
  todosServicos: ServicoGenerico[]
): SugestaoServico | null {
  // Mapeamento de upsell
  const upsellMap: Record<string, string> = {
    'srv-corte-social': 'srv-corte-degrade',
    'srv-corte-degrade': 'srv-cabelo-barba',
    'srv-barba-simples': 'srv-cabelo-barba',
    'srv-cabelo-barba': 'srv-combo-completo',
    'srv-cabelo-sobrancelha': 'srv-combo-completo'
  };

  const sugestaoId = upsellMap[servicoAtual.id];
  if (!sugestaoId) return null;

  const sugestaoServico = todosServicos.find(s => s.id === sugestaoId);
  if (!sugestaoServico) return null;

  const frases: Record<string, string> = {
    'srv-corte-degrade': 'Se quiser um visual mais marcante, o degradê é uma ótima opção!',
    'srv-cabelo-barba': 'Que tal aproveitar o combo Cabelo + Barba por R$ 70? É mais vantajoso!',
    'srv-combo-completo': 'Para o visual completo, temos o Combo Completo com tudo incluso!'
  };

  return {
    servico: sugestaoServico,
    motivo: 'upsell',
    frase: frases[sugestaoId] || `Que tal adicionar ${sugestaoServico.nome}?`
  };
}

export function sugerirCrossSell(
  servicoAtual: ServicoGenerico,
  todosServicos: ServicoGenerico[]
): SugestaoServico | null {
  // Cross-sell: serviços complementares
  const crossSellMap: Record<string, string> = {
    'srv-corte-social': 'srv-barba-simples',
    'srv-corte-degrade': 'srv-barba-simples',
    'srv-barba-simples': 'srv-corte-social'
  };

  const sugestaoId = crossSellMap[servicoAtual.id];
  if (!sugestaoId) return null;

  const sugestaoServico = todosServicos.find(s => s.id === sugestaoId);
  if (!sugestaoServico) return null;

  return {
    servico: sugestaoServico,
    motivo: 'cross-sell',
    frase: `Se quiser complementar, temos também ${sugestaoServico.nome} por R$ ${sugestaoServico.preco}.`
  };
}

// ============================================
// LÓGICA DE FECHAMENTO
// ============================================

export interface FraseFechamento {
  frase: string;
  tipo: 'direto' | 'sutil' | 'urgencia';
}

export function gerarFraseFechamento(
  servico: ServicoGenerico | undefined,
  horariosDisponiveis: { horario: string; barbeiros: string[] }[]
): FraseFechamento {
  if (!servico || horariosDisponiveis.length === 0) {
    return {
      frase: 'Quer que eu verifique outros horários disponíveis?',
      tipo: 'sutil'
    };
  }

  const primeiroSlot = horariosDisponiveis[0];
  const barbeiros = primeiroSlot.barbeiros.join(' ou ');

  return {
    frase: `Tenho *${primeiroSlot.horario}* disponível com ${barbeiros}. Posso reservar para você?`,
    tipo: 'direto'
  };
}

export function gerarFechamentoUrgencia(
  servico: ServicoGenerico | undefined
): FraseFechamento {
  if (!servico) {
    return {
      frase: 'Esses horários estão popular. Quer que eu reserve antes que preencham?',
      tipo: 'urgencia'
    };
  }

  return {
    frase: `O ${servico.nome} é muito procurado. Tenho horários ainda hoje. Quer reservar?`,
    tipo: 'urgencia'
  };
}

// ============================================
// RECUPERAÇÃO DE CONVERSA
// ============================================

export function registrarOportunidade(
  phone: string,
  nome: string | undefined,
  intencao: IntencaoCompra,
  leadStatus: LeadStatus
): Oportunidade {
  return {
    id: 'opp-' + Date.now(),
    clientePhone: phone,
    clienteNome: nome,
    servicoInteresse: intencao.servicoInteresse,
    servicoId: intencao.servicoId,
    leadStatus,
    ultimaInteracao: new Date().toISOString(),
    conversionAttempted: false,
    notes: `Intenção detectada: ${intencao.sinais.join(', ')}`
  };
}

// ============================================
// REGRAS COMERCIAIS
// ============================================

export interface RegraComercial {
  pode: string[];
  naoPode: string[];
}

export const REGRAS_COMERCIAIS: RegraComercial = {
  pode: [
    'Apresentar serviços e preços',
    'Recomendar serviços adequados ao perfil',
    'Sugerir combos quando fizer sentido',
    'Oferecer alternativas mais acessíveis',
    'Tentar recuperar uma venda',
    'Conduzir para agendamento',
    'Criar senso de urgência (horários limitados)',
    'Encontrar primeiro horário disponível'
  ],
  naoPode: [
    'Inventar desconto',
    'Prometer resultado',
    'Negociar preço sem autorização',
    'Pressionar o cliente',
    'Insistir indefinidamente',
    'Inventar disponibilidade',
    'Confirmar pagamento não realizado',
    'Criar expectativa falsa'
  ]
};

// ============================================
// MÉTRICAS COMERCIAIS
// ============================================

export interface MetricasComerciais {
  totalConversas: number;
  interessados: number;
  prontosParaAgendar: number;
  agendamentos: number;
  taxaConversao: number;
  servicosMaisProcurados: { nome: string; count: number }[];
}

export function calcularMetricas(
  oportunidades: Oportunidade[],
  agendamentos: Appointment[]
): MetricasComerciais {
  const totalConversas = oportunidades.length;
  const interessados = oportunidades.filter(o =>
    o.leadStatus === 'INTERESSADO' || o.leadStatus === 'PRONTO_PARA_AGENDAR'
  ).length;
  const prontosParaAgendar = oportunidades.filter(o =>
    o.leadStatus === 'PRONTO_PARA_AGENDAR'
  ).length;

  // Contar agendamentos de hoje
  const hoje = new Date().toISOString().split('T')[0];
  const agendamentosHoje = agendamentos.filter(a => a.date === hoje).length;

  const taxaConversao = totalConversas > 0
    ? Math.round((agendamentosHoje / totalConversas) * 100)
    : 0;

  // Serviços mais procurados
  const servicoCount: Record<string, number> = {};
  oportunidades.forEach(o => {
    if (o.servicoInteresse) {
      servicoCount[o.servicoInteresse] = (servicoCount[o.servicoInteresse] || 0) + 1;
    }
  });

  const servicosMaisProcurados = Object.entries(servicoCount)
    .map(([nome, count]) => ({ nome, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalConversas,
    interessados,
    prontosParaAgendar,
    agendamentos: agendamentosHoje,
    taxaConversao,
    servicosMaisProcurados
  };
}
