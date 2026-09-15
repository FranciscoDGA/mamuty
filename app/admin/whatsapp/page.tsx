'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Smartphone, 
  Bot, 
  Database, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ArrowDown, 
  ExternalLink, 
  Zap, 
  Activity, 
  TrendingUp, 
  Users, 
  CalendarCheck,
  Radio,
  CheckCircle
} from 'lucide-react';
import { getUazapiConfig, UazapiConfig } from '@/lib/uazapi';
import { obterEstatisticasDiarias, obterSessoesAtivas, DailyStats, ConversationSession } from '@/lib/ai/conversationLog';

export default function WhatsAppMonitorPage() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [sessoes, setSessoes] = useState<ConversationSession[]>([]);
  const [uazapiConfig, setUazapiConfig] = useState<UazapiConfig | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'sessoes' | 'metricas'>('status');

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const statsData = await obterEstatisticasDiarias();
      setStats(statsData);
      setSessoes(obterSessoesAtivas());
      setUazapiConfig(getUazapiConfig());
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
    } catch (e) {
      console.error('Erro ao carregar dados do monitor:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/uazapi` 
    : 'https://mamuty.vercel.app/api/webhooks/uazapi';

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar URL:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* 1. HEADER (100% Mobile Friendly) */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              WhatsApp Monitor
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Uazapi & Alfred IA
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Monitoramento em tempo real do Funcionário Digital e conexão com o WhatsApp
          </p>
        </div>

        {/* Refresh button & status */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="text-right text-[11px] text-slate-400 hidden sm:block">
            <span>Última checagem: </span>
            <strong className="text-slate-200">{lastUpdate || '--:--:--'}</strong>
          </div>
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            title="Atualizar dados agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS CARDS (4 KPIs Mobile First Grid) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Funcionário Digital */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Funcionário Digital
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`w-2.5 h-2.5 rounded-full ${
                uazapiConfig?.configured 
                  ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20' 
                  : 'bg-amber-400 animate-pulse ring-4 ring-amber-400/20'
              }`} />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-white truncate">
            {uazapiConfig?.configured ? 'Online' : 'Simulado'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {uazapiConfig?.configured ? '⚡ Uazapi Conectada' : 'Modo simulador ativo'}
          </p>
        </div>

        {/* Conversas Hoje */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 truncate">
            Conversas Hoje
          </span>
          <div className="text-xl sm:text-2xl font-black text-sky-400">
            {stats?.totalConversations || 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {stats?.uniqueClients || 0} clientes únicos
          </p>
        </div>

        {/* Agendamentos */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 truncate">
            Agendamentos IA
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {stats?.appointmentsCreated || 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {stats?.appointmentsCancelled || 0} cancelamentos
          </p>
        </div>

        {/* Sessões Ativas */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 truncate">
            Sessões Ativas
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-400">
            {sessoes.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            conversando agora
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABS SELECTOR (Full Width, No Horizontal Overflow) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('status')}
          className={`py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 active:scale-95 ${
            activeTab === 'status'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Status Uazapi</span>
        </button>

        <button
          onClick={() => setActiveTab('sessoes')}
          className={`py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 active:scale-95 ${
            activeTab === 'sessoes'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Sessões ({sessoes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('metricas')}
          className={`py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 active:scale-95 ${
            activeTab === 'metricas'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Métricas</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT: STATUS & UAZAPI */}
      {/* ========================================================================= */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* Uazapi Dedicated Config Card */}
          <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Conexão Uazapi
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-extrabold uppercase">
                      Provedor Oficial
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    API de comunicação oficial do WhatsApp para envio e recepção de mensagens do Alfred
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="self-start sm:self-auto">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                  uazapiConfig?.configured 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {uazapiConfig?.configured ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Conectada & Operante
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Configuração Pendente
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Config Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Status da API
                </span>
                <p className={`text-sm font-bold flex items-center gap-1.5 ${
                  uazapiConfig?.configured ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {uazapiConfig?.configured ? '✅ Conexão Ativa' : '⚠️ Pendente de Chave'}
                </p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Instância / Sessão
                </span>
                <p className="text-xs font-mono text-slate-200 truncate" title={uazapiConfig?.session || 'Não configurada'}>
                  {uazapiConfig?.session || 'Não configurada'}
                </p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Token de Acesso
                </span>
                <p className="text-sm font-bold text-slate-200">
                  {uazapiConfig?.hasToken ? '✅ Presente (.env)' : '⚠️ Ausente'}
                </p>
              </div>
            </div>

            {/* Webhook Configuration Box */}
            <div className="bg-gradient-to-r from-emerald-950/30 via-slate-950 to-slate-950 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Webhook URL da Uazapi (Recebimento de Mensagens)
                  </span>
                </div>
                <button
                  onClick={handleCopyWebhook}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center gap-1 border border-emerald-500/30 shrink-0 active:scale-95"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copiado!' : 'Copiar URL'}</span>
                </button>
              </div>

              {/* Webhook URL Container */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 break-all select-all">
                {webhookUrl}
              </div>

              {/* Step-by-Step Instructions */}
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 space-y-1.5 text-xs text-slate-300 leading-relaxed">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Como ativar no painel da Uazapi:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Acesse o painel da sua instância na Uazapi.</li>
                  <li>No campo <strong className="text-white">Webhook URL</strong>, cole o link copiado acima.</li>
                  <li>Marque o evento <strong className="text-emerald-400">Messages</strong> (ou Mensagens Recebidas).</li>
                  <li>Pronto! Todas as mensagens de clientes serão atendidas automaticamente pelo <strong className="text-amber-400">Alfred</strong>.</li>
                </ol>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/whatsapp"
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Bot className="w-4 h-4" />
                <span>Testar Alfred no Simulador</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Architecture Diagram (100% Mobile Responsive - No Z-API) */}
          {/* ========================================================================= */}
          <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Fluxo de Comunicação em Tempo Real
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Arquitetura direta de inteligência artificial e agendamento da Mamuty
              </p>
            </div>

            {/* Desktop Flow (Horizontal) */}
            <div className="hidden md:flex items-center justify-between gap-2 p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
              {/* Step 1: Cliente */}
              <div className="flex-1 text-center p-3 rounded-xl bg-slate-900 border border-slate-800">
                <Smartphone className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-white block">Cliente</span>
                <span className="text-[10px] text-slate-400">Manda WhatsApp</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

              {/* Step 2: WhatsApp */}
              <div className="flex-1 text-center p-3 rounded-xl bg-slate-900 border border-slate-800">
                <MessageSquare className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-white block">WhatsApp</span>
                <span className="text-[10px] text-slate-400">Rede Oficial</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

              {/* Step 3: Uazapi */}
              <div className="flex-1 text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-emerald-300 block">Uazapi</span>
                <span className="text-[10px] text-emerald-400/80">API & Webhook</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

              {/* Step 4: Alfred IA */}
              <div className="flex-1 text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Bot className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-amber-300 block">Alfred IA</span>
                <span className="text-[10px] text-amber-400/80">Gemini 3.6 Flash</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

              {/* Step 5: Supabase */}
              <div className="flex-1 text-center p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
                <Database className="w-5 h-5 text-sky-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-sky-300 block">Supabase</span>
                <span className="text-[10px] text-sky-400/80">Agenda & Caixa</span>
              </div>
            </div>

            {/* Mobile Flow (Vertical Step Flow - Zero Overflow) */}
            <div className="md:hidden space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white">1. Cliente no WhatsApp</p>
                  <p className="text-[10px] text-slate-400">Envia áudio ou mensagem de texto querendo cortar</p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-slate-600" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-emerald-300">2. Uazapi (Webhook)</p>
                  <p className="text-[10px] text-emerald-400/80">Recebe a mensagem e encaminha para a barbearia</p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-slate-600" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Bot className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-amber-300">3. Alfred IA (Gemini 3.6 Flash)</p>
                  <p className="text-[10px] text-amber-400/80">Entende o pedido, consulta vagas e responde humanizado</p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-slate-600" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
                <Database className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-sky-300">4. Supabase & Painel Admin</p>
                  <p className="text-[10px] text-sky-400/80">Cria o agendamento na cadeira e toca o alerta sonoro no caixa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: SESSÕES ATIVAS */}
      {/* ========================================================================= */}
      {activeTab === 'sessoes' && (
        <div className="bg-slate-900/80 rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Conversas em Andamento ({sessoes.length})
            </h3>
            <span className="text-[10px] text-slate-400">Atualização automática a cada 30s</span>
          </div>

          {sessoes.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-300">Nenhuma sessão ativa neste momento</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Quando um cliente enviar uma mensagem para a barbearia no WhatsApp, a conversa aparecerá aqui em tempo real.
              </p>
              <div className="pt-2">
                <Link
                  href="/whatsapp"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simular conversa agora</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="space-y-3 md:hidden">
                {sessoes.map((sessao) => (
                  <div 
                    key={sessao.id} 
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {sessao.clientName || 'Cliente sem nome'}
                        </h4>
                        <p className="text-xs font-mono text-slate-400">
                          {sessao.clientPhone}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sessao.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : sessao.status === 'human_handoff' 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {sessao.status === 'active' ? '🟢 Ativo' : sessao.status === 'human_handoff' ? '🔴 Humano' : '🟡 Inativo'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {sessao.intents.slice(0, 3).map((intent, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                          {intent}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                      <span>{sessao.messageCount} mensagens trocadas</span>
                      <span>Última ação: {new Date(sessao.lastActivityAt).toLocaleTimeString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-950">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Telefone</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Mensagens</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Intenções</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Última Atividade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900/40 divide-y divide-slate-800">
                    {sessoes.map((sessao) => (
                      <tr key={sessao.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3 text-xs font-bold text-white">
                          {sessao.clientName || 'Desconhecido'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300 font-mono">
                          {sessao.clientPhone}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300 font-bold">
                          {sessao.messageCount}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {[...new Set(sessao.intents)].slice(0, 3).join(', ') || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sessao.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                            sessao.status === 'idle' ? 'bg-amber-500/20 text-amber-300' :
                            sessao.status === 'human_handoff' ? 'bg-rose-500/20 text-rose-300' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {sessao.status === 'active' ? '🟢 Ativo' :
                             sessao.status === 'idle' ? '🟡 Inativo' :
                             sessao.status === 'human_handoff' ? '🔴 Humano' :
                             '⚪ Finalizado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {new Date(sessao.lastActivityAt).toLocaleTimeString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT: MÉTRICAS */}
      {/* ========================================================================= */}
      {activeTab === 'metricas' && (
        <div className="space-y-6">
          {/* Métricas Diárias */}
          <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Métricas de Hoje ({stats?.date || new Date().toLocaleDateString('pt-BR')})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-xl sm:text-2xl font-black text-sky-400">
                  {stats?.messagesIncoming || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase font-bold">
                  Recebidas
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">
                  {stats?.messagesOutgoing || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase font-bold">
                  Enviadas
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-xl sm:text-2xl font-black text-purple-400">
                  {stats?.avgResponseTimeMs || 0}ms
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase font-bold">
                  Tempo Médio
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-xl sm:text-2xl font-black text-amber-400">
                  {stats?.humanHandoffs || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase font-bold">
                  P/ Humano
                </div>
              </div>
            </div>
          </div>

          {/* Intenções Mais Utilizadas (Zero Overflow Responsive Bar List) */}
          <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Intenções Mais Frequentes dos Clientes
            </h3>

            {stats?.intents && Object.keys(stats.intents).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.intents)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([intent, count]) => {
                    const maxVal = Math.max(...Object.values(stats.intents)) || 1;
                    const pct = Math.round((count / maxVal) * 100);
                    return (
                      <div key={intent} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-300 truncate max-w-[200px] sm:max-w-none">
                            {intent}
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
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nenhum dado de intenções registrado ainda hoje.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
