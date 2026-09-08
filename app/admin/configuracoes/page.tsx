'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  Clock, 
  Bot, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Tag, 
  Send
} from 'lucide-react';

interface ShopSettings {
  shopName: string;
  whatsapp: string;
  address: string;
  openTime: string;
  closeTime: string;
  workDays: string;
  intervalMinutes: string;
  aiTone: 'relaxed' | 'professional' | 'energetic';
  welcomeMessage: string;
  autoAntiNoShow: boolean;
  reminderAdvance: string;
  suggestProducts: boolean;
  activeCampaignTitle: string;
  activeCampaignDiscount: string;
  activeCampaignMessage: string;
  isCampaignActive: boolean;
}

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Mamuty Barbearia & Salão Masculino',
  whatsapp: '11999999999',
  address: 'Rua Principal, 123 - Centro, SP',
  openTime: '09:00',
  closeTime: '20:00',
  workDays: 'Segunda a Sábado',
  intervalMinutes: '30',
  aiTone: 'relaxed',
  welcomeMessage: 'Fala, campeão! 💈✂️ Seja muito bem-vindo à Barbearia Mamuty. Em que posso te ajudar hoje? Marcar corte, ver preços ou tirar dúvidas?',
  autoAntiNoShow: true,
  reminderAdvance: '2',
  suggestProducts: true,
  activeCampaignTitle: 'Quarta Maluca da Barba & Cabelo',
  activeCampaignDiscount: '15% OFF',
  activeCampaignMessage: 'Fala meu amigo! 💈✂️ Especial dessa semana: Combo Cabelo + Barba com 15% OFF aqui na Barbearia Mamuty! Responda essa mensagem para garantir sua vaga hoje!',
  isCampaignActive: true
};

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mamuty_shop_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Erro ao ler configurações do localStorage', e);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('mamuty_shop_settings', JSON.stringify(settings));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e) {
      alert('Erro ao salvar configurações localmente.');
    }
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar as configurações padrão?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('mamuty_shop_settings', JSON.stringify(DEFAULT_SETTINGS));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const cleanPhone = settings.whatsapp.replace(/\D/g, '');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-amber-400" />
            Configurações & Painel de Controle
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie as informações da barbearia, o tom do assistente IA e campanhas de vendas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
            title="Restaurar valores padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl flex items-center gap-2.5 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Configurações e regras de negócio atualizadas com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bloco 1: Dados do Estabelecimento */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Store className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base text-white">Dados do Estabelecimento</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Nome da Barbearia</label>
              <input
                type="text"
                value={settings.shopName}
                onChange={e => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1.5">WhatsApp Comercial (Atendimento)</label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-300 block mb-1.5">Endereço Completo</label>
              <input
                type="text"
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Horários & Agenda */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base text-white">Horários de Funcionamento & Agenda</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Horário de Abertura</label>
              <input
                type="time"
                value={settings.openTime}
                onChange={e => setSettings({ ...settings, openTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Horário de Fechamento</label>
              <input
                type="time"
                value={settings.closeTime}
                onChange={e => setSettings({ ...settings, closeTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Dias de Funcionamento</label>
              <input
                type="text"
                value={settings.workDays}
                onChange={e => setSettings({ ...settings, workDays: e.target.value })}
                placeholder="Segunda a Sábado"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Intervalo de Encaixes</label>
              <select
                value={settings.intervalMinutes}
                onChange={e => setSettings({ ...settings, intervalMinutes: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos (Padrão)</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 3: Assistente IA & WhatsApp */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Bot className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base text-white">Assistente IA & Regras do WhatsApp</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Tom de Voz do Assistente no WhatsApp</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, aiTone: 'relaxed' })}
                  className={`p-3 rounded-2xl border text-left transition ${
                    settings.aiTone === 'relaxed'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-bold text-amber-400">Descontraído & Estilo Barbearia</p>
                  <p className="text-[11px] text-slate-400 mt-1">Usa gírias leves (&apos;campeão&apos;, &apos;fera&apos;), emojis e tom acolhedor.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, aiTone: 'professional' })}
                  className={`p-3 rounded-2xl border text-left transition ${
                    settings.aiTone === 'professional'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-bold text-amber-400">Profissional & Executivo</p>
                  <p className="text-[11px] text-slate-400 mt-1">Formal, polido, focado em clareza de horários e serviços.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, aiTone: 'energetic' })}
                  className={`p-3 rounded-2xl border text-left transition ${
                    settings.aiTone === 'energetic'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-bold text-amber-400">Vendedor & Comercial</p>
                  <p className="text-[11px] text-slate-400 mt-1">Focado em fechamento rápido e sugestão de combos adicionais.</p>
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Mensagem Inicial de Boas-Vindas</label>
              <textarea
                rows={3}
                value={settings.welcomeMessage}
                onChange={e => setSettings({ ...settings, welcomeMessage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="font-bold text-white">Lembrete Anti-No-Show</p>
                  <p className="text-[11px] text-slate-400">Avisar cliente para confirmar ou liberar a vaga</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoAntiNoShow}
                  onChange={e => setSettings({ ...settings, autoAntiNoShow: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="font-bold text-white">Sugerir Produtos no WhatsApp</p>
                  <p className="text-[11px] text-slate-400">Oferecer pomada, minoxidil e pós-barba</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.suggestProducts}
                  onChange={e => setSettings({ ...settings, suggestProducts: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 4: Gestão de Campanhas & Promoções */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-base text-white">Campanha & Promoção Ativa</h2>
            </div>

            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
              settings.isCampaignActive 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-slate-800 text-slate-500'
            }`}>
              {settings.isCampaignActive ? 'Campanha Ativa' : 'Campanha Pausada'}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-300 block mb-1.5">Título da Campanha</label>
                <input
                  type="text"
                  value={settings.activeCampaignTitle}
                  onChange={e => setSettings({ ...settings, activeCampaignTitle: e.target.value })}
                  placeholder="Ex: Quarta Maluca"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1.5">Desconto ou Benefício</label>
                <input
                  type="text"
                  value={settings.activeCampaignDiscount}
                  onChange={e => setSettings({ ...settings, activeCampaignDiscount: e.target.value })}
                  placeholder="Ex: 15% OFF"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Mensagem Promocional de Disparo WhatsApp</label>
              <textarea
                rows={3}
                value={settings.activeCampaignMessage}
                onChange={e => setSettings({ ...settings, activeCampaignMessage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
                <input
                  type="checkbox"
                  checked={settings.isCampaignActive}
                  onChange={e => setSettings({ ...settings, isCampaignActive: e.target.checked })}
                  className="w-4 h-4 accent-amber-500"
                />
                <span>Ativar e divulgar esta promoção nas respostas do assistente</span>
              </label>

              {/* Botão de disparo de teste */}
              <a
                href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(settings.activeCampaignMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Testar Envio no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Botão Salvar Principal no Fim */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            Cancelar / Restaurar
          </button>

          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-sm flex items-center gap-2 transition shadow-xl shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
}