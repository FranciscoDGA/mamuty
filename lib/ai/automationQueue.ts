import { AutomationJob, AutomationType, AutomationStatus } from './automation';
import { supabase } from '@/lib/supabase';

// ============================================
// SPRINT 6 — FILA DE AUTOMAÇÕES (Supabase)
// ============================================

// Cache local (fallback se Supabase offline)
let automationQueue: AutomationJob[] = [];
let loaded = false;

// -------------------------------------------
// 1. INICIALIZAÇÃO
// -------------------------------------------

export async function carregarFila(): Promise<void> {
  const { data, error } = await supabase
    .from('automation_jobs')
    .select('*')
    .order('agendado_para', { ascending: true });

  if (error) {
    console.error('[AutomationQueue] Erro ao carregar fila:', error.message);
    return;
  }

  automationQueue = (data || []).map(mapRowToJob);
  loaded = true;
}

function mapRowToJob(row: any): AutomationJob {
  return {
    id: row.id,
    tipo: row.tipo,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    clientePhone: row.cliente_phone,
    agendamentoId: row.agendamento_id || undefined,
    servicoInteresse: row.servico_interesse || undefined,
    mensagem: row.mensagem,
    status: row.status,
    criadoEm: row.criado_em,
    agendadoPara: row.agendado_para,
    enviadoEm: row.enviado_em || undefined,
    tentativas: row.tentativas,
    maxTentativas: row.max_tentativas,
    erro: row.erro || undefined,
    meta: row.meta || undefined,
  };
}

function mapJobToRow(job: Omit<AutomationJob, 'id'>): Record<string, any> {
  return {
    tipo: job.tipo,
    cliente_id: job.clienteId,
    cliente_nome: job.clienteNome,
    cliente_phone: job.clientePhone,
    agendamento_id: job.agendamentoId || null,
    servico_interesse: job.servicoInteresse || null,
    mensagem: job.mensagem,
    status: job.status,
    criado_em: job.criadoEm,
    agendado_para: job.agendadoPara,
    enviado_em: job.enviadoEm || null,
    tentativas: job.tentativas,
    max_tentativas: job.maxTentativas,
    erro: job.erro || null,
    meta: job.meta || {},
  };
}

// -------------------------------------------
// 2. OPERAÇÕES DA FILA
// -------------------------------------------

export async function adicionarJob(job: Omit<AutomationJob, 'id'>): Promise<AutomationJob> {
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const novoJob: AutomationJob = { ...job, id };

  const row = mapJobToRow(novoJob);
  row.id = id;

  const { error } = await supabase.from('automation_jobs').insert(row);

  if (error) {
    console.error('[AutomationQueue] Erro ao inserir job:', error.message);
  }

  automationQueue.push(novoJob);
  return novoJob;
}

export async function adicionarJobs(jobs: Omit<AutomationJob, 'id'>[]): Promise<AutomationJob[]> {
  const results: AutomationJob[] = [];
  for (const job of jobs) {
    results.push(await adicionarJob(job));
  }
  return results;
}

export async function atualizarJob(jobId: string, updates: Partial<AutomationJob>): Promise<AutomationJob | null> {
  const idx = automationQueue.findIndex(j => j.id === jobId);
  if (idx === -1) return null;

  automationQueue[idx] = { ...automationQueue[idx], ...updates };

  const rowUpdate: Record<string, any> = {};
  if (updates.status !== undefined) rowUpdate.status = updates.status;
  if (updates.enviadoEm !== undefined) rowUpdate.enviado_em = updates.enviadoEm;
  if (updates.tentativas !== undefined) rowUpdate.tentativas = updates.tentativas;
  if (updates.erro !== undefined) rowUpdate.erro = updates.erro;

  if (Object.keys(rowUpdate).length > 0) {
    const { error } = await supabase.from('automation_jobs').update(rowUpdate).eq('id', jobId);
    if (error) console.error('[AutomationQueue] Erro ao atualizar job:', error.message);
  }

  return automationQueue[idx];
}

export async function cancelarJob(jobId: string): Promise<boolean> {
  const job = automationQueue.find(j => j.id === jobId);
  if (!job) return false;

  job.status = 'CANCELADO';

  const { error } = await supabase.from('automation_jobs').update({ status: 'CANCELADO' }).eq('id', jobId);
  if (error) console.error('[AutomationQueue] Erro ao cancelar job:', error.message);

  return true;
}

export async function cancelarJobsCliente(clienteId: string, tipo?: AutomationType): Promise<number> {
  let cancelados = 0;
  const ids: string[] = [];

  automationQueue.forEach(job => {
    if (job.clienteId === clienteId && job.status === 'PENDENTE') {
      if (!tipo || job.tipo === tipo) {
        job.status = 'CANCELADO';
        ids.push(job.id);
        cancelados++;
      }
    }
  });

  if (ids.length > 0) {
    const { error } = await supabase
      .from('automation_jobs')
      .update({ status: 'CANCELADO' })
      .in('id', ids);
    if (error) console.error('[AutomationQueue] Erro ao cancelar jobs:', error.message);
  }

  return cancelados;
}

// -------------------------------------------
// 3. CONSULTAS (síncronas, usam cache local)
// -------------------------------------------

export function obterJobsPendentes(): AutomationJob[] {
  return automationQueue
    .filter(j => j.status === 'PENDENTE')
    .sort((a, b) => new Date(a.agendadoPara).getTime() - new Date(b.agendadoPara).getTime());
}

export function obterJobsProntos(): AutomationJob[] {
  const agora = new Date();
  return automationQueue.filter(j =>
    j.status === 'PENDENTE' &&
    new Date(j.agendadoPara) <= agora
  );
}

export function obterJobsPorTipo(tipo: AutomationType): AutomationJob[] {
  return automationQueue.filter(j => j.tipo === tipo);
}

export function obterJobsPorCliente(clienteId: string): AutomationJob[] {
  return automationQueue.filter(j => j.clienteId === clienteId);
}

export function obterJobsEnviados(): AutomationJob[] {
  return automationQueue.filter(j => j.status === 'ENVIADO');
}

export function obterJobsFalha(): AutomationJob[] {
  return automationQueue.filter(j => j.status === 'FALHA');
}

export function contarJobsPorStatus(): Record<AutomationStatus, number> {
  const contagem: Record<AutomationStatus, number> = {
    PENDENTE: 0,
    ENVIADO: 0,
    CANCELADO: 0,
    FALHA: 0,
    AGUARDANDO_APROVACAO: 0
  };

  automationQueue.forEach(job => {
    contagem[job.status]++;
  });

  return contagem;
}

// -------------------------------------------
// 4. PROCESSAMENTO DA FILA
// -------------------------------------------

export async function processarFila(): Promise<{
  processados: number;
  enviados: number;
  falhas: number;
  jobs: AutomationJob[];
}> {
  const jobsProntos = obterJobsProntos();
  let enviados = 0;
  let falhas = 0;
  const jobsProcessados: AutomationJob[] = [];

  for (const job of jobsProntos) {
    const sucesso = Math.random() > 0.05;

    if (sucesso) {
      await atualizarJob(job.id, {
        status: 'ENVIADO',
        enviadoEm: new Date().toISOString(),
        tentativas: job.tentativas + 1,
      });
      enviados++;
    } else {
      const novasTentativas = job.tentativas + 1;
      if (novasTentativas >= job.maxTentativas) {
        await atualizarJob(job.id, {
          tentativas: novasTentativas,
          status: 'FALHA',
          erro: 'Limite de tentativas atingido',
        });
      } else {
        await atualizarJob(job.id, { tentativas: novasTentativas });
      }
      falhas++;
    }

    jobsProcessados.push(automationQueue.find(j => j.id === job.id)!);
  }

  return { processados: jobsProntos.length, enviados, falhas, jobs: jobsProcessados };
}

// -------------------------------------------
// 5. LIMPEZA
// -------------------------------------------

export async function limparJobsAntigos(diasRetencao: number = 30): Promise<number> {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasRetencao);

  const idsParaRemover = automationQueue
    .filter(j =>
      (j.status === 'CANCELADO' || j.status === 'FALHA') &&
      new Date(j.criadoEm) < dataLimite
    )
    .map(j => j.id);

  if (idsParaRemover.length > 0) {
    const { error } = await supabase.from('automation_jobs').delete().in('id', idsParaRemover);
    if (error) console.error('[AutomationQueue] Erro ao limpar jobs:', error.message);
    automationQueue = automationQueue.filter(j => !idsParaRemover.includes(j.id));
  }

  return idsParaRemover.length;
}

// -------------------------------------------
// 6. ESTATÍSTICAS
// -------------------------------------------

export function obterEstatisticas(): {
  total: number;
  porStatus: Record<AutomationStatus, number>;
  porTipo: Record<AutomationType, number>;
  taxaSucesso: number;
  tempoMedioResposta: number;
} {
  const porStatus = contarJobsPorStatus();

  const porTipo: Record<AutomationType, number> = {
    LEMBRETE_24H: 0,
    LEMBRETE_2H: 0,
    POS_ATENDIMENTO: 0,
    AVALIACAO: 0,
    RECUPERACAO_CLIENTE: 0,
    RECUPERACAO_OPORTUNIDADE: 0,
    PREENCHIMENTO_HORARIO: 0,
    PROMOCAO: 0,
  };

  automationQueue.forEach(job => {
    porTipo[job.tipo]++;
  });

  const enviados = automationQueue.filter(j => j.status === 'ENVIADO');
  const total = automationQueue.length;
  const taxaSucesso = total > 0 ? Math.round((enviados.length / total) * 100) : 0;

  let somaTempo = 0;
  let countTempo = 0;
  enviados.forEach(job => {
    if (job.enviadoEm) {
      const diff = new Date(job.enviadoEm).getTime() - new Date(job.criadoEm).getTime();
      somaTempo += diff;
      countTempo++;
    }
  });
  const tempoMedioResposta = countTempo > 0 ? Math.round(somaTempo / countTempo / 60000) : 0;

  return { total, porStatus, porTipo, taxaSucesso, tempoMedioResposta };
}

export function isLoaded(): boolean {
  return loaded;
}
