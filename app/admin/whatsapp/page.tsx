'use client';

import { useState, useEffect } from 'react';
import { isZApiConfigured, getZApiConfig } from '@/lib/zapi';
import { obterEstatisticasDiarias, obterSessoesAtivas, DailyStats, ConversationSession } from '@/lib/ai/conversationLog';
import { getZApiConfig as getConfig } from '@/lib/zapi';

export default function WhatsAppMonitorPage() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [sessoes, setSessoes] = useState<ConversationSession[]>([]);
  const [zapiConfig, setZapiConfig] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'status' | 'sessoes' | 'metricas'>('status');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const statsData = await obterEstatisticasDiarias();
      setStats(statsData);
      setSessoes(obterSessoesAtivas());
      setZapiConfig(getZApiConfig());
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      online: 'bg-green-500',
      offline: 'bg-red-500',
      warning: 'bg-yellow-500',
      active: 'text-green-600',
      idle: 'text-yellow-600',
      completed: 'text-blue-600',
      human_handoff: 'text-red-600'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📱 WhatsApp Monitor</h1>
            <p className="text-gray-600 mt-2">Painel de monitoramento do Funcionário Digital</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>Última atualização: {lastUpdate}</div>
            <button
              onClick={loadData}
              className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-xs"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Status do Funcionário */}
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Funcionário Digital</p>
                <p className="text-2xl font-bold text-gray-900">
                  {zapiConfig?.configured ? '🟢 Online' : '🟡 Simulado'}
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full ${zapiConfig?.configured ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {zapiConfig?.configured ? 'Z-API conectada' : 'Modo simulador'}
            </p>
          </div>

          {/* Conversas Hoje */}
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Conversas Hoje</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalConversations || 0}</p>
            <p className="text-xs text-gray-400 mt-1">
              {stats?.uniqueClients || 0} clientes únicos
            </p>
          </div>

          {/* Agendamentos */}
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Agendamentos</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.appointmentsCreated || 0}</p>
            <p className="text-xs text-gray-400 mt-1">
              {stats?.appointmentsCancelled || 0} cancelamentos
            </p>
          </div>

          {/* Sessões Ativas */}
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Sessões Ativas</p>
            <p className="text-3xl font-bold text-gray-900">{sessoes.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              clientes conversando agora
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'status'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🟢 Status
          </button>
          <button
            onClick={() => setActiveTab('sessoes')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'sessoes'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            💬 Sessões Ativas
          </button>
          <button
            onClick={() => setActiveTab('metricas')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'metricas'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📊 Métricas
          </button>
        </div>

        {/* Status Tab */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Configuração Z-API */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📲 Configuração WhatsApp</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Status Z-API</p>
                  <p className={`font-bold ${zapiConfig?.configured ? 'text-green-600' : 'text-yellow-600'}`}>
                    {zapiConfig?.configured ? '✅ Configurada' : '⚠️ Não configurada'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Instance ID</p>
                  <p className="font-mono text-sm">{zapiConfig?.instanceId || 'não configurado'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Security Key</p>
                  <p className="font-bold">{zapiConfig?.hasSecurityKey ? '✅ Configurada' : '⚠️ Não configurada'}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Webhook URL:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp` : '/api/webhooks/whatsapp'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Configure esta URL no painel da Z-API para receber mensagens
                </p>
              </div>
            </div>

            {/* Arquitetura */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🏗️ Arquitetura</h3>
              <div className="flex items-center justify-center space-x-2 text-sm">
                <div className="p-3 bg-green-100 rounded-lg text-green-800 font-medium">
                  📱 Cliente
                </div>
                <span className="text-gray-400">→</span>
                <div className="p-3 bg-green-100 rounded-lg text-green-800 font-medium">
                  💬 WhatsApp
                </div>
                <span className="text-gray-400">→</span>
                <div className="p-3 bg-blue-100 rounded-lg text-blue-800 font-medium">
                  🔗 Z-API
                </div>
                <span className="text-gray-400">→</span>
                <div className="p-3 bg-purple-100 rounded-lg text-purple-800 font-medium">
                  🤖 Marcos
                </div>
                <span className="text-gray-400">→</span>
                <div className="p-3 bg-orange-100 rounded-lg text-orange-800 font-medium">
                  🗄️ Supabase
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessões Tab */}
        {activeTab === 'sessoes' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">💬 Sessões Ativas ({sessoes.length})</h3>
            {sessoes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">💬</p>
                <p>Nenhuma sessão ativa no momento</p>
                <p className="text-sm mt-1">As sessões aparecerão quando clientes enviarem mensagens</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mensagens</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intents</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Atividade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessoes.map(sessao => (
                      <tr key={sessao.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {sessao.clientName || 'Desconhecido'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                          {sessao.clientPhone}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {sessao.messageCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {[...new Set(sessao.intents)].slice(0, 3).join(', ') || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sessao.status === 'active' ? 'bg-green-100 text-green-800' :
                            sessao.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                            sessao.status === 'human_handoff' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {sessao.status === 'active' ? '🟢 Ativo' :
                             sessao.status === 'idle' ? '🟡 Inativo' :
                             sessao.status === 'human_handoff' ? '🔴 Humano' :
                             '⚪ Finalizado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(sessao.lastActivityAt).toLocaleTimeString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Métricas Tab */}
        {activeTab === 'metricas' && stats && (
          <div className="space-y-6">
            {/* Métricas do dia */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Métricas de Hoje ({stats.date})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.messagesIncoming}</div>
                  <div className="text-sm text-gray-500">Mensagens recebidas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.messagesOutgoing}</div>
                  <div className="text-sm text-gray-500">Mensagens enviadas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.avgResponseTimeMs}ms</div>
                  <div className="text-sm text-gray-500">Tempo médio resposta</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{stats.humanHandoffs}</div>
                  <div className="text-sm text-gray-500">Transferências para humano</div>
                </div>
              </div>
            </div>

            {/* Intents mais usadas */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🧠 Intents Mais Utilizadas</h3>
              <div className="space-y-3">
                {Object.entries(stats.intents)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([intent, count]) => (
                    <div key={intent} className="flex items-center">
                      <div className="w-48 text-sm text-gray-700 font-mono">{intent}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full transition-all"
                          style={{ width: `${(count / Math.max(...Object.values(stats.intents))) * 100}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm font-medium">{count}</div>
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
