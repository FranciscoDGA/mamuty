'use client';

import { useState, useEffect } from 'react';
import { AUTOMATION_RULES, AutomationRule, AutomationType } from '@/lib/ai/automation';
import {
  obterEstatisticas,
  obterJobsPendentes,
  obterJobsEnviados,
  contarJobsPorStatus,
  carregarFila,
  isLoaded
} from '@/lib/ai/automationQueue';
import { 
  Sparkles, 
  Settings, 
  Send, 
  BarChart, 
  CheckCircle2, 
  Clock,
  Activity,
  Zap,
  ListOrdered
} from 'lucide-react';

interface AutomationStats {
  total: number;
  porStatus: Record<string, number>;
  porTipo: Record<string, number>;
  taxaSucesso: number;
  tempoMedioResposta: number;
}

export default function AutomacoesPage() {
  const [rules, setRules] = useState<AutomationRule[]>(AUTOMATION_RULES);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [sentJobs, setSentJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'regras' | 'fila' | 'metricas'>('regras');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!isLoaded()) {
      await carregarFila();
    }
    const statsData = obterEstatisticas();
    setStats(statsData);
    setPendingJobs(obterJobsPendentes());
    setSentJobs(obterJobsEnviados());
    setLoading(false);
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, ativo: !r.ativo } : r
    ));
  };

  const getTipoLabel = (tipo: AutomationType): string => {
    const labels: Record<AutomationType, string> = {
      LEMBRETE_24H: 'Lembrete 24h',
      LEMBRETE_2H: 'Lembrete 2h',
      LEMBRETE_30MIN: 'Lembrete 30min',
      POS_ATENDIMENTO: 'Pós-atendimento',
      AVALIACAO: 'Avaliação',
      RECUPERACAO_CLIENTE: 'Recuperação de cliente',
      RECUPERACAO_OPORTUNIDADE: 'Recuperação de oportunidade',
      PREENCHIMENTO_HORARIO: 'Preenchimento de horário',
      PROMOCAO: 'Promoção',
      CANCELAMENTO_AUTOMATICO: 'Cancelamento Automático'
    };
    return labels[tipo] || tipo;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      ENVIADO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      CANCELADO: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      FALHA: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      AGUARDANDO_APROVACAO: 'bg-sky-500/20 text-sky-400 border-sky-500/30'
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        <p className="text-slate-400 text-xs tracking-wider uppercase font-bold">Carregando automações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white">Automações</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Central de automações do Funcionário Digital Alfred
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('regras')}
          className={`py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 active:scale-95 ${
            activeTab === 'regras'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Regras</span>
        </button>

        <button
          onClick={() => setActiveTab('fila')}
          className={`py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 active:scale-95 ${
            activeTab === 'fila'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Fila de Envio</span>
        </button>

        <button
          onClick={() => setActiveTab('metricas')}
          className={`py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 active:scale-95 ${
            activeTab === 'metricas'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Métricas</span>
        </button>
      </div>

      {/* Regras Tab */}
      {activeTab === 'regras' && (
        <div className="space-y-4">
          {rules.map(rule => (
            <div
              key={rule.id}
              className={`bg-slate-900/90 rounded-2xl p-4 sm:p-5 border ${
                rule.ativo ? 'border-emerald-500/40 shadow-lg shadow-emerald-900/10' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {getTipoLabel(rule.tipo)}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        rule.ativo ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {rule.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{rule.descricao}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-mono">
                    <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                      Intervalo mínimo: <strong className="text-amber-400">{rule.intervaloMinimoDias} dias</strong>
                    </span>
                    <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                      Max: <strong className="text-amber-400">{rule.maxContatosPeriodo}x</strong> por <strong className="text-amber-400">{rule.periodoDias} dias</strong>
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`relative inline-flex h-6 sm:h-7 w-11 sm:w-12 items-center rounded-full transition-colors active:scale-95 cursor-pointer ${
                      rule.ativo ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 sm:h-5 w-4 sm:w-5 transform rounded-full bg-white transition-transform ${
                        rule.ativo ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fila de Envio Tab */}
      {activeTab === 'fila' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Status da Fila
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {stats && Object.entries(stats.porStatus).map(([status, count]) => (
                <div key={status} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 border ${getStatusColor(status)}`}>
                    {status}
                  </div>
                  <div className="text-2xl font-black text-white">{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Pendentes ({pendingJobs.length})
              </div>
            </h3>
            {pendingJobs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Nenhum job pendente no momento.
              </div>
            ) : (
              <div className="overflow-x-auto pb-2">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Agendado para</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pendingJobs.slice(0, 10).map(job => (
                      <tr key={job.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-3 px-3 font-semibold text-white">{getTipoLabel(job.tipo)}</td>
                        <td className="py-3 px-3 text-slate-300">{job.clienteNome}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {new Date(job.agendadoPara).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                Enviados Recentemente ({sentJobs.length})
              </div>
            </h3>
            {sentJobs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Nenhum envio registrado ainda.
              </div>
            ) : (
              <div className="overflow-x-auto pb-2">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Enviado em</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sentJobs.slice(0, 10).map(job => (
                      <tr key={job.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-3 px-3 font-semibold text-white">{getTipoLabel(job.tipo)}</td>
                        <td className="py-3 px-3 text-slate-300">{job.clienteNome}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {job.enviadoEm ? new Date(job.enviadoEm).toLocaleString('pt-BR') : '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Métricas Tab */}
      {activeTab === 'metricas' && stats && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-amber-400" />
              Métricas Gerais
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-2xl sm:text-3xl font-black text-sky-400">{stats.total}</div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase font-bold">Total de Jobs</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.taxaSucesso}%</div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase font-bold">Taxa de Sucesso</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-2xl sm:text-3xl font-black text-purple-400">{stats.tempoMedioResposta}m</div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase font-bold">Tempo Médio</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-2xl sm:text-3xl font-black text-amber-400">
                  {stats.porStatus.PENDENTE || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase font-bold">Pendentes</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Jobs por Tipo
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.porTipo).map(([tipo, count]) => {
                const maxVal = stats.total || 1;
                const pct = Math.round((count / maxVal) * 100);
                return (
                  <div key={tipo} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-300 truncate max-w-[200px] sm:max-w-none">
                        {getTipoLabel(tipo as AutomationType)}
                      </span>
                      <span className="font-bold text-amber-400 shrink-0 ml-2">
                        {count} vezes
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
