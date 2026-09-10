import { supabase } from '../supabase';

// ============================================
// SPRINT 7 — LOG DE CONVERSAS WHATSAPP
// ============================================

// -------------------------------------------
// 1. TIPOS
// -------------------------------------------

export interface ConversationLog {
  id: string;
  clientPhone: string;
  clientName?: string;
  direction: 'incoming' | 'outgoing';
  message: string;
  intent?: string;
  toolUsed?: string;
  action?: string;
  status: 'success' | 'error' | 'fallback';
  timestamp: string;
  responseTimeMs?: number;
  metadata?: Record<string, any>;
}

export interface ConversationSession {
  id: string;
  clientPhone: string;
  clientName?: string;
  startedAt: string;
  lastActivityAt: string;
  messageCount: number;
  intents: string[];
  status: 'active' | 'idle' | 'completed' | 'human_handoff';
  context?: Record<string, any>;
}

export interface DailyStats {
  date: string;
  totalConversations: number;
  uniqueClients: number;
  messagesIncoming: number;
  messagesOutgoing: number;
  intents: Record<string, number>;
  avgResponseTimeMs: number;
  appointmentsCreated: number;
  appointmentsCancelled: number;
  humanHandoffs: number;
}

// -------------------------------------------
// 2. LOGGING
// -------------------------------------------

export async function logConversation(entry: Omit<ConversationLog, 'id' | 'timestamp'>): Promise<void> {
  const logEntry: ConversationLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };

  try {
    // Tentar salvar no Supabase
    const { error } = await supabase
      .from('conversation_logs')
      .insert({
        id: logEntry.id,
        client_phone: logEntry.clientPhone,
        client_name: logEntry.clientName,
        direction: logEntry.direction,
        message: logEntry.message,
        intent: logEntry.intent,
        tool_used: logEntry.toolUsed,
        action: logEntry.action,
        status: logEntry.status,
        timestamp: logEntry.timestamp,
        response_time_ms: logEntry.responseTimeMs,
        metadata: logEntry.metadata
      });

    if (error) {
      console.warn('[ConversationLog] Erro ao salvar no Supabase:', error.message);
      // Fallback: salvar em memória (para desenvolvimento)
      salvarLogEmMemoria(logEntry);
    }
  } catch (e) {
    console.warn('[ConversationLog] Supabase indisponível, salvando em memória');
    salvarLogEmMemoria(logEntry);
  }
}

// Armazenamento em memória como fallback
const logsEmMemoria: ConversationLog[] = [];
const MAX_LOGS_MEMORIA = 1000;

function salvarLogEmMemoria(log: ConversationLog): void {
  logsEmMemoria.push(log);
  if (logsEmMemoria.length > MAX_LOGS_MEMORIA) {
    logsEmMemoria.shift();
  }
}

// -------------------------------------------
// 3. SESSÕES DE CONVERSA
// -------------------------------------------

const sessoesAtivas: Map<string, ConversationSession> = new Map();

export async function obterOuCriarSessao(clientPhone: string, clientName?: string): Promise<ConversationSession> {
  const existing = sessoesAtivas.get(clientPhone);

  if (existing) {
    // Atualizar última atividade
    existing.lastActivityAt = new Date().toISOString();
    existing.messageCount++;
    return existing;
  }

  // Criar nova sessão
  const sessao: ConversationSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    clientPhone,
    clientName,
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    messageCount: 1,
    intents: [],
    status: 'active'
  };

  sessoesAtivas.set(clientPhone, sessao);
  return sessao;
}

export function atualizarSessao(clientPhone: string, updates: Partial<ConversationSession>): void {
  const sessao = sessoesAtivas.get(clientPhone);
  if (sessao) {
    Object.assign(sessao, updates, { lastActivityAt: new Date().toISOString() });
  }
}

export function obterSessao(clientPhone: string): ConversationSession | undefined {
  return sessoesAtivas.get(clientPhone);
}

export function obterTodasSessoes(): ConversationSession[] {
  return Array.from(sessoesAtivas.values());
}

export function obterSessoesAtivas(): ConversationSession[] {
  return Array.from(sessoesAtivas.values()).filter(s => s.status === 'active');
}

// -------------------------------------------
// 4. ESTATÍSTICAS DIÁRIAS
// -------------------------------------------

export async function obterEstatisticasDiarias(data?: string): Promise<DailyStats> {
  const targetDate = data || new Date().toISOString().split('T')[0];

  try {
    // Tentar buscar do Supabase
    const { data: logs, error } = await supabase
      .from('conversation_logs')
      .select('*')
      .gte('timestamp', `${targetDate}T00:00:00`)
      .lte('timestamp', `${targetDate}T23:59:59`);

    if (!error && logs) {
      return calcularEstatisticas(logs, targetDate);
    }
  } catch (e) {
    console.warn('[ConversationLog] Erro ao buscar estatísticas do Supabase');
  }

  // Fallback: usar logs em memória
  const logsHoje = logsEmMemoria.filter(l => l.timestamp.startsWith(targetDate));
  return calcularEstatisticas(logsHoje, targetDate);
}

function calcularEstatisticas(logs: any[], targetDate: string): DailyStats {
  const uniquePhones = new Set(logs.map(l => l.client_phone || l.clientPhone));
  const incoming = logs.filter(l => l.direction === 'incoming');
  const outgoing = logs.filter(l => l.direction === 'outgoing');

  // Contar intents
  const intents: Record<string, number> = {};
  logs.forEach(l => {
    const intent = l.intent || l.action || 'unknown';
    intents[intent] = (intents[intent] || 0) + 1;
  });

  // Tempo médio de resposta
  const responseTimes = logs
    .filter(l => l.response_time_ms || l.responseTimeMs)
    .map(l => l.response_time_ms || l.responseTimeMs);
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  // Agendamentos criados/cancelados
  const appointmentsCreated = logs.filter(l =>
    l.action === 'CREATE_APPOINTMENT' || l.intent === 'CONFIRM_BOOKING'
  ).length;
  const appointmentsCancelled = logs.filter(l =>
    l.action === 'CANCEL_APPOINTMENT' || l.intent === 'CANCEL_APPOINTMENT'
  ).length;
  const humanHandoffs = logs.filter(l =>
    l.intent === 'HUMAN_HANDOFF' || l.action === 'HUMAN_HANDOFF'
  ).length;

  return {
    date: targetDate,
    totalConversations: logs.length,
    uniqueClients: uniquePhones.size,
    messagesIncoming: incoming.length,
    messagesOutgoing: outgoing.length,
    intents,
    avgResponseTimeMs: avgResponseTime,
    appointmentsCreated,
    appointmentsCancelled,
    humanHandoffs
  };
}

// -------------------------------------------
// 5. LIMPEZA E MANUTENÇÃO
// -------------------------------------------

export function limparSessoesInativas(timeoutMinutos: number = 30): number {
  const agora = new Date();
  let removidas = 0;

  sessoesAtivas.forEach((sessao, phone) => {
    const ultimaAtividade = new Date(sessao.lastActivityAt);
    const diffMinutos = (agora.getTime() - ultimaAtividade.getTime()) / 60000;

    if (diffMinutos > timeoutMinutos) {
      sessao.status = 'idle';
      sessoesAtivas.delete(phone);
      removidas++;
    }
  });

  return removidas;
}

export function limparLogsEmMemoria(): void {
  logsEmMemoria.length = 0;
}

// -------------------------------------------
// 6. EXPORTAÇÃO
// -------------------------------------------

export function exportarLogs(periodo?: { inicio: string; fim: string }): ConversationLog[] {
  if (!periodo) {
    return [...logsEmMemoria];
  }

  return logsEmMemoria.filter(log => {
    const logDate = log.timestamp;
    return logDate >= periodo.inicio && logDate <= periodo.fim;
  });
}
