import { Appointment, Customer, Service, Barber } from '../types';
import { MAMUTY_KNOWLEDGE_BASE } from './knowledgeBase';

// ============================================
// SPRINT 6 — MOTOR DE AUTOMAÇÃO
// ============================================

// -------------------------------------------
// 1. TIPOS E INTERFACES
// -------------------------------------------

export type AutomationType =
  | 'LEMBRETE_24H'
  | 'LEMBRETE_2H'
  | 'POS_ATENDIMENTO'
  | 'AVALIACAO'
  | 'RECUPERACAO_CLIENTE'
  | 'RECUPERACAO_OPORTUNIDADE'
  | 'PREENCHIMENTO_HORARIO'
  | 'PROMOCAO';

export type AutomationStatus = 'PENDENTE' | 'ENVIADO' | 'CANCELADO' | 'FALHA' | 'AGUARDANDO_APROVACAO';

export type CustomerSegment =
  | 'ATIVO'        // 🟢 Atendido最近emente
  | 'EM_RISCO'     // 🟡 Passando do intervalo habitual
  | 'PERDIDO'      // 🔴 Muito tempo sem atendimento
  | 'FREQUENTE'    // ⭐ Alta frequência de visitas
  | 'NOVO'         // 🔵 Primeira visita
  | 'INATIVO';     // ⚫ Sem atendimento registrado

export interface AutomationRule {
  id: string;
  tipo: AutomationType;
  nome: string;
  descricao: string;
  ativo: boolean;
  condicoes: CondicaoRegra[];
  acoes: string[];
  intervaloMinimoDias: number;  // Intervalo mínimo entre contatos
  horarioEnvio?: string;         // Horário preferencial de envio
  maxContatosPeriodo: number;    // Máximo de contatos por período
  periodoDias: number;           // Período em dias para maxContatos
}

export interface CondicaoRegra {
  campo: string;
  operador: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contém' | 'não_contém';
  valor: any;
}

export interface AutomationJob {
  id: string;
  tipo: AutomationType;
  clienteId: string;
  clienteNome: string;
  clientePhone: string;
  agendamentoId?: string;
  servicoInteresse?: string;
  mensagem: string;
  status: AutomationStatus;
  criadoEm: string;
  agendadoPara: string;    // Quando enviar
  enviadoEm?: string;
  tentativas: number;
  maxTentativas: number;
  erro?: string;
  meta?: Record<string, any>;
}

export interface CustomerStats {
  clienteId: string;
  clienteNome: string;
  clientePhone: string;
  totalAtendimentos: number;
  ultimoAtendimento?: string;
  proximoAtendimento?: string;
  intervaloMedioDias?: number;
  ultimaMensagemEnviada?: string;
  totalMensagensEnviadas: number;
  segmento: CustomerSegment;
  servicosPreferidos: string[];
  barbeiroPreferido?: string;
  gastoTotal: number;
  avaliacaoMedia?: number;
}

export interface ScheduleSlot {
  horario: string;
  data: string;
  ocupado: boolean;
  barbeiroId?: string;
  barbeiroNome?: string;
}

export interface ScheduleOpportunity {
  data: string;
  slotsLivres: ScheduleSlot[];
  baixaOcupacao: boolean;     // < 50% ocupado
  percentualOcupacao: number;
  melhorHorario?: string;     // Maior janela livre
  sugestaoMensagem?: string;
}

// -------------------------------------------
// 2. REGRAS PADRÃO DE AUTOMAÇÃO
// -------------------------------------------

export const AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule-lembrete-24h',
    tipo: 'LEMBRETE_24H',
    nome: 'Lembrete 24h antes',
    descricao: 'Envia lembrete 24 horas antes do agendamento',
    ativo: true,
    condicoes: [
      { campo: 'status', operador: '==', valor: 'confirmed' },
      { campo: 'horasAteAgendamento', operador: '>=', valor: 23 },
      { campo: 'horasAteAgendamento', operador: '<=', valor: 25 }
    ],
    acoes: ['ENVIAR_LEMBRETE_24H'],
    intervaloMinimoDias: 0,
    maxContatosPeriodo: 1,
    periodoDias: 1
  },
  {
    id: 'rule-lembrete-2h',
    tipo: 'LEMBRETE_2H',
    nome: 'Lembrete 2h antes',
    descricao: 'Envia lembrete 2 horas antes do agendamento',
    ativo: true,
    condicoes: [
      { campo: 'status', operador: '==', valor: 'confirmed' },
      { campo: 'horasAteAgendamento', operador: '>=', valor: 1.5 },
      { campo: 'horasAteAgendamento', operador: '<=', valor: 2.5 }
    ],
    acoes: ['ENVIAR_LEMBRETE_2H'],
    intervaloMinimoDias: 0,
    maxContatosPeriodo: 1,
    periodoDias: 1
  },
  {
    id: 'rule-pos-atendimento',
    tipo: 'POS_ATENDIMENTO',
    nome: 'Pós-atendimento',
    descricao: 'Envia mensagem de agradecimento após conclusão',
    ativo: true,
    condicoes: [
      { campo: 'status', operador: '==', valor: 'completed' },
      { campo: 'horasAposConclusao', operador: '>=', valor: 1.5 },
      { campo: 'horasAposConclusao', operador: '<=', valor: 3 }
    ],
    acoes: ['ENVIAR_POS_ATENDIMENTO'],
    intervaloMinimoDias: 30,
    maxContatosPeriodo: 1,
    periodoDias: 90
  },
  {
    id: 'rule-avaliacao',
    tipo: 'AVALIACAO',
    nome: 'Solicitar avaliação',
    descricao: 'Solicita avaliação após pós-atendimento',
    ativo: true,
    condicoes: [
      { campo: 'posAtendimentoEnviado', operador: '==', valor: true },
      { campo: 'horasAposPosAtendimento', operador: '>=', valor: 1 },
      { campo: 'avaliacaoRecebida', operador: '!=', valor: true }
    ],
    acoes: ['SOLICITAR_AVALIACAO'],
    intervaloMinimoDias: 30,
    maxContatosPeriodo: 1,
    periodoDias: 90
  },
  {
    id: 'rule-recuperacao-cliente',
    tipo: 'RECUPERACAO_CLIENTE',
    nome: 'Recuperação de cliente',
    descricao: 'Entra em contato com clientes que estão sem atender há tempo',
    ativo: true,
    condicoes: [
      { campo: 'diasSemAtendimento', operador: '>=', valor: 35 },
      { campo: 'possuiAgendamentoFuturo', operador: '==', valor: false },
      { campo: 'recebeuMensagemRecentemente', operador: '==', valor: false },
      { campo: 'permiteComunicacao', operador: '==', valor: true }
    ],
    acoes: ['ENVIAR_RECUPERACAO_CLIENTE'],
    intervaloMinimoDias: 14,
    maxContatosPeriodo: 2,
    periodoDias: 60
  },
  {
    id: 'rule-recuperacao-oportunidade',
    tipo: 'RECUPERACAO_OPORTUNIDADE',
    nome: 'Recuperação de oportunidade',
    descricao: 'Entra em contato com leads que não concretizaram agendamento',
    ativo: true,
    condicoes: [
      { campo: 'oportunidadeNaoConvertida', operador: '==', valor: true },
      { campo: 'horasAposOportunidade', operador: '>=', valor: 24 },
      { campo: 'recebeuMensagemRecentemente', operador: '==', valor: false },
      { campo: 'permiteComunicacao', operador: '==', valor: true }
    ],
    acoes: ['ENVIAR_RECUPERACAO_OPORTUNIDADE'],
    intervaloMinimoDias: 7,
    maxContatosPeriodo: 1,
    periodoDias: 30
  },
  {
    id: 'rule-preenchimento-horario',
    tipo: 'PREENCHIMENTO_HORARIO',
    nome: 'Preenchimento de horário',
    descricao: 'Identifica horários ociosos e oferece para clientes adequados',
    ativo: false,  // Desativado por padrão — modo manual inicial
    condicoes: [
      { campo: 'slotsLivresMesmoDia', operador: '>=', valor: 3 },
      { campo: 'percentualOcupacao', operador: '<', valor: 50 },
      { campo: 'recebeuMensagemRecentemente', operador: '==', valor: false },
      { campo: 'permiteComunicacao', operador: '==', valor: true }
    ],
    acoes: ['ENVIAR_PREENCHIMENTO_HORARIO'],
    intervaloMinimoDias: 3,
    maxContatosPeriodo: 1,
    periodoDias: 7
  }
];

// -------------------------------------------
// 3. SEGMENTAÇÃO DE CLIENTES
// -------------------------------------------

export function calcularSegmentoCliente(
  stats: CustomerStats,
  diasDesdeUltimoAtendimento: number | null,
  intervaloMedioDias: number | null
): CustomerSegment {
  // Sem atendimentos registrados
  if (stats.totalAtendimentos === 0) {
    return 'NOVO';
  }

  // Sem data de último atendimento
  if (diasDesdeUltimoAtendimento === null) {
    return 'INATIVO';
  }

  // Frequente: 4+ atendimentos nos últimos 90 dias
  if (stats.totalAtendimentos >= 4) {
    const agora = new Date();
    const noventaDiasAtras = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (stats.ultimoAtendimento && new Date(stats.ultimoAtendimento) > noventaDiasAtras) {
      return 'FREQUENTE';
    }
  }

  // Perdido: mais de 60 dias sem atendimento
  if (diasDesdeUltimoAtendimento > 60) {
    return 'PERDIDO';
  }

  // Em risco: passando do intervalo médio
  if (intervaloMedioDias && diasDesdeUltimoAtendimento > intervaloMedioDias * 1.2) {
    return 'EM_RISCO';
  }

  // Ativo: dentro do intervalo esperado
  return 'ATIVO';
}

export function calcularIntervaloMedio(historicoDatas: string[]): number | null {
  if (historicoDatas.length < 2) return null;

  const datasOrdenadas = historicoDatas
    .map(d => new Date(d).getTime())
    .sort((a, b) => a - b);

  let somaIntervalos = 0;
  let countIntervalos = 0;

  for (let i = 1; i < datasOrdenadas.length; i++) {
    const diffDias = (datasOrdenadas[i] - datasOrdenadas[i - 1]) / (24 * 60 * 60 * 1000);
    somaIntervalos += diffDias;
    countIntervalos++;
  }

  return Math.round(somaIntervalos / countIntervalos);
}

export function estimarProximoAtendimento(
  historicoDatas: string[],
  intervaloMedioDias: number | null
): string | null {
  if (!intervaloMedioDias || historicoDatas.length === 0) return null;

  const ultimaData = new Date(historicoDatas[historicoDatas.length - 1]);
  const proximaData = new Date(ultimaData.getTime() + intervaloMedioDias * 24 * 60 * 60 * 1000);

  return proximaData.toISOString().split('T')[0];
}

// -------------------------------------------
// 4. MOTOR DE REGRAS
// -------------------------------------------

export function verificarCondicoes(
  regra: AutomationRule,
  contexto: Record<string, any>
): boolean {
  return regra.condicoes.every(condicao => {
    const valorCampo = contexto[condicao.campo];

    switch (condicao.operador) {
      case '==':
        return valorCampo === condicao.valor;
      case '!=':
        return valorCampo !== condicao.valor;
      case '>':
        return valorCampo > condicao.valor;
      case '<':
        return valorCampo < condicao.valor;
      case '>=':
        return valorCampo >= condicao.valor;
      case '<=':
        return valorCampo <= condicao.valor;
      case 'contém':
        return String(valorCampo).includes(String(condicao.valor));
      case 'não_contém':
        return !String(valorCampo).includes(String(condicao.valor));
      default:
        return false;
    }
  });
}

export function avaliarRegras(
  rules: AutomationRule[],
  contexto: Record<string, any>
): AutomationRule[] {
  return rules.filter(regra => {
    if (!regra.ativo) return false;
    return verificarCondicoes(regra, contexto);
  });
}

// -------------------------------------------
// 5. GERAÇÃO DE MENSAGENS
// -------------------------------------------

export function gerarMensagemLembrete24h(appointment: Appointment): string {
  const dataFormatada = appointment.date.split('-').reverse().join('/');
  const servico = appointment.serviceNames?.[0] || 'atendimento';
  const barbeiro = appointment.barberName || 'nosso profissional';

  return `Olá, ${appointment.customerName}! 👋 Passando para lembrar que você tem um horário reservado na Mamuty amanhã às ${appointment.time} com ${barbeiro} para ${servico}. Esperamos você! 💈`;
}

export function gerarMensagemLembrete2h(appointment: Appointment): string {
  return `${appointment.customerName}, seu horário na Mamuty está chegando! 💈 Até daqui a pouco. Estamos te esperando!`;
}

export function gerarMensagemPosAtendimento(appointment: Appointment): string {
  return `Obrigado por escolher a Mamuty, ${appointment.customerName}! 💈 Foi um prazer atender você. Seu feedback é muito importante para nós.`;
}

export function gerarMensagemAvaliacao(appointment: Appointment): string {
  return `${appointment.customerName}, como foi seu atendimento na Mamuty? ⭐\n\nSe puder, avalie de 1 a 5 estrelas e deixe um comentário. Isso nos ajuda a melhorar cada vez mais! 🙏`;
}

export function gerarMensagemRecuperacaoCliente(
  clienteNome: string,
  diasSemAtendimento: number,
  servicoPreferido?: string
): string {
  const servicoTexto = servicoPreferido ? ` Seu serviço favorito, ${servicoPreferido}, continua disponível.` : '';

  return `Olá, ${clienteNome}! 👋 Faz ${diasSemAtendimento} dias que não vemos você por aqui.${servicoTexto} Se quiser renovar o corte, posso verificar os horários disponíveis para você esta semana. 💈`;
}

export function gerarMensagemRecuperacaoOportunidade(
  clienteNome: string,
  servicoInteresse: string
): string {
  return `Olá, ${clienteNome}! 👋 Vi que você tinha interesse em fazer ${servicoInteresse}. Se ainda quiser, posso verificar os horários disponíveis para você. 💈`;
}

export function gerarMensagemPreenchimentoHorario(
  clienteNome: string,
  horarios: string[]
): string {
  const horariosTexto = horarios.join(' e ');
  return `Olá, ${clienteNome}! Temos alguns horários disponíveis hoje à tarde (${horariosTexto}). Se você estiver pensando em cortar o cabelo, posso verificar um horário para você. 💈`;
}

// -------------------------------------------
// 6. VERIFICAÇÃO DE ANTI-SPAM
// -------------------------------------------

export function podeEnviarMensagem(
  clienteId: string,
  tipo: AutomationType,
  regra: AutomationRule,
  jobs: AutomationJob[],
  customerStats?: CustomerStats
): { permitido: boolean; motivo?: string } {
  // 1. Verificar se permite comunicação
  if (customerStats && !customerStats.segmento) {
    // Sem segmento definido = permitir
  }

  // 2. Verificar se já tem agendamento futuro (não contactar)
  if (customerStats?.proximoAtendimento) {
    const agora = new Date();
    const proximoAgendamento = new Date(customerStats.proximoAtendimento);
    if (proximoAgendamento > agora) {
      return { permitido: false, motivo: 'Cliente já possui agendamento futuro' };
    }
  }

  // 3. Verificar intervalo mínimo entre contatos do mesmo tipo
  const jobsMesmoTipo = jobs.filter(
    j => j.clienteId === clienteId &&
    j.tipo === tipo &&
    j.status === 'ENVIADO'
  );

  if (jobsMesmoTipo.length > 0) {
    const ultimoEnvio = new Date(jobsMesmoTipo[jobsMesmoTipo.length - 1].enviadoEm!);
    const agora = new Date();
    const diasDesdeUltimoEnvio = (agora.getTime() - ultimoEnvio.getTime()) / (24 * 60 * 60 * 1000);

    if (diasDesdeUltimoEnvio < regra.intervaloMinimoDias) {
      return {
        permitido: false,
        motivo: `Intervalo mínimo de ${regra.intervaloMinimoDias} dias entre contatos do tipo ${tipo}`
      };
    }
  }

  // 4. Verificar máximo de contatos no período
  const jobsNoPeriodo = jobs.filter(
    j => j.clienteId === clienteId &&
    j.status === 'ENVIADO' &&
    j.enviadoEm
  ).filter(j => {
    const dataEnvio = new Date(j.enviadoEm!);
    const agora = new Date();
    const periodoMs = regra.periodoDias * 24 * 60 * 60 * 1000;
    return (agora.getTime() - dataEnvio.getTime()) <= periodoMs;
  });

  if (jobsNoPeriodo.length >= regra.maxContatosPeriodo) {
    return {
      permitido: false,
      motivo: `Limite de ${regra.maxContatosPeriodo} contatos no período de ${regra.periodoDias} dias`
    };
  }

  // 5. Verificar se recebeu mensagem recentemente (últimos 3 dias)
  const ultimaMensagem = customerStats?.ultimaMensagemEnviada;
  if (ultimaMensagem) {
    const dataMsg = new Date(ultimaMensagem);
    const agora = new Date();
    const diasDesdeUltimaMsg = (agora.getTime() - dataMsg.getTime()) / (24 * 60 * 60 * 1000);

    if (diasDesdeUltimaMsg < 3) {
      return {
        permitido: false,
        motivo: 'Cliente recebeu mensagem nos últimos 3 dias'
      };
    }
  }

  return { permitido: true };
}

// -------------------------------------------
// 7. DETECÇÃO DE OPORTUNIDADES DE AGENDA
// -------------------------------------------

export function analisarAgenda(
  data: string,
  appointments: Appointment[],
  barbers: Barber[],
  services: Service[]
): ScheduleOpportunity {
  const horariosFuncionamento = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  // Remover horário de intervalo (12:00-14:00)
  const slots: ScheduleSlot[] = horariosFuncionamento.map(h => {
    const ocupado = appointments.some(a => {
      if (a.date !== data) return false;
      if (a.status !== 'confirmed') return false;
      // Verificar se o horário conflita
      const horaInicio = parseInt(h.split(':')[0]) * 60 + parseInt(h.split(':')[1]);
      const horaApt = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
      const duracao = a.totalDurationMinutes || 40;
      return horaApt >= horaInicio - duracao && horaApt < horaInicio + 60;
    });

    return {
      horario: h,
      data,
      ocupado
    };
  });

  const slotsLivres = slots.filter(s => !s.ocupado);
  const percentualOcupacao = ((slots.length - slotsLivres.length) / slots.length) * 100;
  const baixaOcupacao = percentualOcupacao < 50;

  // Melhor horário: maior janela de slots livres consecutivos
  let melhorHorario: string | undefined;
  let maiorJanela = 0;
  let janelaAtual = 0;
  let inicioJanela = '';

  for (const slot of slots) {
    if (!slot.ocupado) {
      if (janelaAtual === 0) inicioJanela = slot.horario;
      janelaAtual++;
      if (janelaAtual > maiorJanela) {
        maiorJanela = janelaAtual;
        melhorHorario = inicioJanela;
      }
    } else {
      janelaAtual = 0;
    }
  }

  return {
    data,
    slotsLivres,
    baixaOcupacao,
    percentualOcupacao: Math.round(percentualOcupacao),
    melhorHorario
  };
}

// -------------------------------------------
// 8. PROCESSAMENTO DE CONCLUSÃO DE ATENDIMENTO
// -------------------------------------------

export function processarConclusaoAtendimento(
  appointment: Appointment,
  jobs: AutomationJob[]
): AutomationJob[] {
  const novosJobs: AutomationJob[] = [];
  const agora = new Date();

  // Verificar se já existe pós-atendimento para este agendamento
  const jaTemPosAtendimento = jobs.some(
    j => j.agendamentoId === appointment.id && j.tipo === 'POS_ATENDIMENTO'
  );

  if (!jaTemPosAtendimento) {
    // Criar job de pós-atendimento (agendado para 2h depois)
    const dataEnvio = new Date(agora.getTime() + 2 * 60 * 60 * 1000);

    novosJobs.push({
      id: `job-pos-${appointment.id}`,
      tipo: 'POS_ATENDIMENTO',
      clienteId: appointment.customerPhone,
      clienteNome: appointment.customerName || 'Cliente',
      clientePhone: appointment.customerPhone,
      agendamentoId: appointment.id,
      servicoInteresse: appointment.serviceNames?.[0],
      mensagem: gerarMensagemPosAtendimento(appointment),
      status: 'PENDENTE',
      criadoEm: agora.toISOString(),
      agendadoPara: dataEnvio.toISOString(),
      tentativas: 0,
      maxTentativas: 3,
      meta: { appointmentDate: appointment.date, appointmentTime: appointment.time }
    });

    // Criar job de avaliação (agendado para 3h depois)
    const dataAvaliacao = new Date(agora.getTime() + 3 * 60 * 60 * 1000);

    novosJobs.push({
      id: `job-aval-${appointment.id}`,
      tipo: 'AVALIACAO',
      clienteId: appointment.customerPhone,
      clienteNome: appointment.customerName || 'Cliente',
      clientePhone: appointment.customerPhone,
      agendamentoId: appointment.id,
      servicoInteresse: appointment.serviceNames?.[0],
      mensagem: gerarMensagemAvaliacao(appointment),
      status: 'PENDENTE',
      criadoEm: agora.toISOString(),
      agendadoPara: dataAvaliacao.toISOString(),
      tentativas: 0,
      maxTentativas: 3,
      meta: { appointmentDate: appointment.date, appointmentTime: appointment.time }
    });
  }

  return novosJobs;
}

// -------------------------------------------
// 9. PROCESSAMENTO DE AGENDAMENTO CRIADO
// -------------------------------------------

export function processarNovoAgendamento(
  appointment: Appointment,
  jobs: AutomationJob[]
): AutomationJob[] {
  const novosJobs: AutomationJob[] = [];

  // Calcular data/hora do agendamento
  const [ano, mes, dia] = appointment.date.split('-').map(Number);
  const [hora, minuto] = appointment.time.split(':').map(Number);
  const dataAgendamento = new Date(ano, mes - 1, dia, hora, minuto);

  // Lembrete 24h antes
  const dataLembrete24h = new Date(dataAgendamento.getTime() - 24 * 60 * 60 * 1000);
  if (dataLembrete24h > new Date()) {
    novosJobs.push({
      id: `job-lemb24-${appointment.id}`,
      tipo: 'LEMBRETE_24H',
      clienteId: appointment.customerPhone,
      clienteNome: appointment.customerName || 'Cliente',
      clientePhone: appointment.customerPhone,
      agendamentoId: appointment.id,
      servicoInteresse: appointment.serviceNames?.[0],
      mensagem: gerarMensagemLembrete24h(appointment),
      status: 'PENDENTE',
      criadoEm: new Date().toISOString(),
      agendadoPara: dataLembrete24h.toISOString(),
      tentativas: 0,
      maxTentativas: 3,
      meta: { appointmentDate: appointment.date, appointmentTime: appointment.time }
    });
  }

  // Lembrete 2h antes
  const dataLembrete2h = new Date(dataAgendamento.getTime() - 2 * 60 * 60 * 1000);
  if (dataLembrete2h > new Date()) {
    novosJobs.push({
      id: `job-lemb2-${appointment.id}`,
      tipo: 'LEMBRETE_2H',
      clienteId: appointment.customerPhone,
      clienteNome: appointment.customerName || 'Cliente',
      clientePhone: appointment.customerPhone,
      agendamentoId: appointment.id,
      servicoInteresse: appointment.serviceNames?.[0],
      mensagem: gerarMensagemLembrete2h(appointment),
      status: 'PENDENTE',
      criadoEm: new Date().toISOString(),
      agendadoPara: dataLembrete2h.toISOString(),
      tentativas: 0,
      maxTentativas: 3,
      meta: { appointmentDate: appointment.date, appointmentTime: appointment.time }
    });
  }

  return novosJobs;
}

// -------------------------------------------
// 10. MÉTRICAS DO FUNCIONÁRIO DIGITAL
// -------------------------------------------

export interface AutomationMetrics {
  totalConversasHoje: number;
  totalAgendamentosHoje: number;
  clientesRecuperados: number;
  lembretesEnviados: number;
  oportunidadesRecuperadas: number;
  atendimentosTransferidos: number;
  mensagensEnviadas: number;
  mensagensPendentes: number;
  taxaConversao: number;
  receitaInfluenciada: number;
}

export function calcularMetricasAutomacao(
  jobs: AutomationJob[],
  appointments: Appointment[],
  oportunidades: { status: string; valor?: number }[]
): AutomationMetrics {
  const hoje = new Date().toISOString().split('T')[0];

  const jobsHoje = jobs.filter(j => j.criadoEm.startsWith(hoje));
  const jobsEnviados = jobs.filter(j => j.status === 'ENVIADO');
  const jobsPendentes = jobs.filter(j => j.status === 'PENDENTE');

  const agendamentosHoje = appointments.filter(a => a.date === hoje && a.status === 'confirmed');

  const clientesRecuperados = jobsEnviados.filter(j => j.tipo === 'RECUPERACAO_CLIENTE').length;
  const lembretesEnviados = jobsEnviados.filter(j => j.tipo.startsWith('LEMBRETE')).length;
  const oportunidadesRecuperadas = jobsEnviados.filter(j => j.tipo === 'RECUPERACAO_OPORTUNIDADE').length;

  const totalConversas = jobsHoje.length;
  const taxaConversao = totalConversas > 0
    ? Math.round((agendamentosHoje.length / totalConversas) * 100)
    : 0;

  // Receita influenciada (soma dos agendamentos criados via automação)
  const receitaInfluenciada = oportunidades
    .filter(o => o.status === 'agendado' && o.valor)
    .reduce((soma, o) => soma + (o.valor || 0), 0);

  return {
    totalConversasHoje: totalConversas,
    totalAgendamentosHoje: agendamentosHoje.length,
    clientesRecuperados,
    lembretesEnviados,
    oportunidadesRecuperadas,
    atendimentosTransferidos: 0,
    mensagensEnviadas: jobsEnviados.length,
    mensagensPendentes: jobsPendentes.length,
    taxaConversao,
    receitaInfluenciada
  };
}
