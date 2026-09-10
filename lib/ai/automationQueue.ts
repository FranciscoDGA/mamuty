import { AutomationJob, AutomationType, AutomationStatus } from './automation';

// ============================================
// SPRINT 6 — FILA DE AUTOMAÇÕES
// ============================================

// Armazenamento em memória (futuramente Supabase)
let automationQueue: AutomationJob[] = [];
let jobIdCounter = 0;

// -------------------------------------------
// 1. OPERAÇÕES DA FILA
// -------------------------------------------

export function adicionarJob(job: Omit<AutomationJob, 'id'>): AutomationJob {
  jobIdCounter++;
  const novoJob: AutomationJob = {
    ...job,
    id: `job-${jobIdCounter}-${Date.now()}`
  };
  automationQueue.push(novoJob);
  return novoJob;
}

export function adicionarJobs(jobs: Omit<AutomationJob, 'id'>[]): AutomationJob[] {
  return jobs.map(job => adicionarJob(job));
}

export function obterJob(jobId: string): AutomationJob | undefined {
  return automationQueue.find(j => j.id === jobId);
}

export function atualizarJob(jobId: string, updates: Partial<AutomationJob>): AutomationJob | null {
  const index = automationQueue.findIndex(j => j.id === jobId);
  if (index === -1) return null;

  automationQueue[index] = { ...automationQueue[index], ...updates };
  return automationQueue[index];
}

export function cancelarJob(jobId: string): boolean {
  const job = automationQueue.find(j => j.id === jobId);
  if (!job) return false;

  job.status = 'CANCELADO';
  return true;
}

export function cancelarJobsCliente(clienteId: string, tipo?: AutomationType): number {
  let cancelados = 0;
  automationQueue.forEach(job => {
    if (job.clienteId === clienteId && job.status === 'PENDENTE') {
      if (!tipo || job.tipo === tipo) {
        job.status = 'CANCELADO';
        cancelados++;
      }
    }
  });
  return cancelados;
}

// -------------------------------------------
// 2. CONSULTAS
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
// 3. PROCESSAMENTO DA FILA
// -------------------------------------------

export function processarFila(): {
  processados: number;
  enviados: number;
  falhas: number;
  jobs: AutomationJob[];
} {
  const jobsProntos = obterJobsProntos();
  let enviados = 0;
  let falhas = 0;

  const jobsProcessados: AutomationJob[] = [];

  for (const job of jobsProntos) {
    // Simular envio (futuramente: integração com Z-API)
    const sucesso = Math.random() > 0.05; // 95% de sucesso simulado

    if (sucesso) {
      job.status = 'ENVIADO';
      job.enviadoEm = new Date().toISOString();
      job.tentativas++;
      enviados++;
    } else {
      job.tentativas++;
      if (job.tentativas >= job.maxTentativas) {
        job.status = 'FALHA';
        job.erro = 'Limite de tentativas atingido';
      }
      falhas++;
    }

    jobsProcessados.push(job);
  }

  return {
    processados: jobsProntos.length,
    enviados,
    falhas,
    jobs: jobsProcessados
  };
}

// -------------------------------------------
// 4. LIMPEZA E MANUTENÇÃO
// -------------------------------------------

export function limparJobsAntigos(diasRetencao: number = 30): number {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasRetencao);

  const tamanhoAntes = automationQueue.length;
  automationQueue = automationQueue.filter(job => {
    if (job.status === 'CANCELADO' || job.status === 'FALHA') {
      return new Date(job.criadoEm) > dataLimite;
    }
    return true;
  });

  return tamanhoAntes - automationQueue.length;
}

export function limparFila(): void {
  automationQueue = [];
}

// -------------------------------------------
// 5. ESTATÍSTICAS
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
    PROMOCAO: 0
  };

  automationQueue.forEach(job => {
    porTipo[job.tipo]++;
  });

  const enviados = automationQueue.filter(j => j.status === 'ENVIADO');
  const total = automationQueue.length;
  const taxaSucesso = total > 0 ? Math.round((enviados.length / total) * 100) : 0;

  // Tempo médio entre criação e envio
  let somaTempo = 0;
  let countTempo = 0;
  enviados.forEach(job => {
    if (job.enviadoEm) {
      const diff = new Date(job.enviadoEm).getTime() - new Date(job.criadoEm).getTime();
      somaTempo += diff;
      countTempo++;
    }
  });
  const tempoMedioResposta = countTempo > 0 ? Math.round(somaTempo / countTempo / 60000) : 0; // em minutos

  return {
    total,
    porStatus,
    porTipo,
    taxaSucesso,
    tempoMedioResposta
  };
}

// -------------------------------------------
// 6. EXPORTAR PARA SUPABASE (futuro)
// -------------------------------------------

export function serializarFila(): AutomationJob[] {
  return JSON.parse(JSON.stringify(automationQueue));
}

export function importarFila(dados: AutomationJob[]): void {
  automationQueue = dados;
  // Atualizar counter
  const maxId = dados.reduce((max, job) => {
    const match = job.id.match(/job-(\d+)-/);
    if (match) {
      const num = parseInt(match[1]);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  jobIdCounter = maxId;
}
