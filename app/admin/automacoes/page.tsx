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
      POS_ATENDIMENTO: 'Pos-atendimento',
      AVALIACAO: 'Avaliacao',
      RECUPERACAO_CLIENTE: 'Recuperacao de cliente',
      RECUPERACAO_OPORTUNIDADE: 'Recuperacao de oportunidade',
      PREENCHIMENTO_HORARIO: 'Preenchimento de horario',
      PROMOCAO: 'Promocao'
    };
    return labels[tipo] || tipo;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      ENVIADO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-gray-100 text-gray-800',
      FALHA: 'bg-red-100 text-red-800',
      AGUARDANDO_APROVACAO: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando automacoes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Automacoes</h1>
          <p className="text-gray-600 mt-2">Central de automacoes do Funcionario Digital Marcos</p>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('regras')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'regras'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Regras
          </button>
          <button
            onClick={() => setActiveTab('fila')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'fila'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Fila de Envio
          </button>
          <button
            onClick={() => setActiveTab('metricas')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'metricas'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Metricas
          </button>
        </div>

        {activeTab === 'regras' && (
          <div className="space-y-4">
            {rules.map(rule => (
              <div
                key={rule.id}
                className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                  rule.ativo ? 'border-green-500' : 'border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getTipoLabel(rule.tipo)}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rule.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rule.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{rule.descricao}</p>
                    <div className="flex space-x-4 mt-3 text-sm text-gray-500">
                      <span>Intervalo minimo: {rule.intervaloMinimoDias} dias</span>
                      <span>Max: {rule.maxContatosPeriodo}x por {rule.periodoDias} dias</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rule.ativo ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rule.ativo ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'fila' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Status da Fila</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {stats && Object.entries(stats.porStatus).map(([status, count]) => (
                  <div key={status} className="text-center">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                      {status}
                    </div>
                    <div className="text-2xl font-bold mt-2">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Pendentes ({pendingJobs.length})</h3>
              {pendingJobs.length === 0 ? (
                <p className="text-gray-500">Nenhum job pendente no momento.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agendado para</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingJobs.slice(0, 10).map(job => (
                        <tr key={job.id}>
                          <td className="px-4 py-3 text-sm">{getTipoLabel(job.tipo)}</td>
                          <td className="px-4 py-3 text-sm">{job.clienteNome}</td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(job.agendadoPara).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
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

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Enviados recentemente ({sentJobs.length})</h3>
              {sentJobs.length === 0 ? (
                <p className="text-gray-500">Nenhum envio registrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enviado em</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sentJobs.slice(0, 10).map(job => (
                        <tr key={job.id}>
                          <td className="px-4 py-3 text-sm">{getTipoLabel(job.tipo)}</td>
                          <td className="px-4 py-3 text-sm">{job.clienteNome}</td>
                          <td className="px-4 py-3 text-sm">
                            {job.enviadoEm ? new Date(job.enviadoEm).toLocaleString('pt-BR') : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
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

        {activeTab === 'metricas' && stats && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Metricas Gerais</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-500">Total de jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.taxaSucesso}%</div>
                  <div className="text-sm text-gray-500">Taxa de sucesso</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.tempoMedioResposta}min</div>
                  <div className="text-sm text-gray-500">Tempo medio</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {stats.porStatus.PENDENTE || 0}
                  </div>
                  <div className="text-sm text-gray-500">Pendentes</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Jobs por Tipo</h3>
              <div className="space-y-3">
                {Object.entries(stats.porTipo).map(([tipo, count]) => (
                  <div key={tipo} className="flex items-center">
                    <div className="w-48 text-sm text-gray-700">{getTipoLabel(tipo as AutomationType)}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm font-medium">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Regras Ativas</h3>
              <div className="space-y-2">
                {rules.filter(r => r.ativo).map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <span className="font-medium">{getTipoLabel(rule.tipo)}</span>
                      <span className="text-sm text-gray-500 ml-2">— {rule.nome}</span>
                    </div>
                    <span className="text-green-600 text-sm font-medium">Ativo</span>
                  </div>
                ))}
                {rules.filter(r => !r.ativo).map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-500">{getTipoLabel(rule.tipo)}</span>
                      <span className="text-sm text-gray-400 ml-2">— {rule.nome}</span>
                    </div>
                    <span className="text-gray-400 text-sm">Inativo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
