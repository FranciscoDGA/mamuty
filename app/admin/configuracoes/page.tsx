'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Store, Clock, Bot, Save, RotateCcw, CheckCircle2, Tag, Send, MapPin, MessageCircle, CreditCard, Ban } from 'lucide-react';

interface ShopSettings {
  shopName: string;
  whatsapp: string;
  address: string;
  openTime: string;
  closeTime: string;
  workDays: string;
  lunchStart: string;
  lunchEnd: string;
  intervalMinutes: string;
  toleranceMinutes: string;
  aiTone: 'relaxed' | 'professional' | 'energetic';
  welcomeMessage: string;
  autoAntiNoShow: boolean;
  reminderAdvance: string;
  suggestProducts: boolean;
  cancelPolicy: string;
  cancelAdvanceHours: string;
  paymentPix: boolean;
  paymentDinheiro: boolean;
  paymentDebito: boolean;
  paymentCredito: boolean;
  activeCampaignTitle: string;
  activeCampaignDiscount: string;
  activeCampaignMessage: string;
  isCampaignActive: boolean;
}

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Mamuty Barbearia',
  whatsapp: '(94) 98443-9065',
  address: 'Rua Principal, 123 - Centro, Cumaru do Norte - PA',
  openTime: '09:00',
  closeTime: '20:00',
  workDays: 'Segunda a Sábado',
  lunchStart: '12:00',
  lunchEnd: '14:00',
  intervalMinutes: '30',
  toleranceMinutes: '15',
  aiTone: 'professional',
  welcomeMessage: 'Fala, campeão! Seja muito bem-vindo à Barbearia Mamuty. Em que posso te ajudar hoje? Marcar corte, ver preços ou tirar dúvidas?',
  autoAntiNoShow: true,
  reminderAdvance: '2',
  suggestProducts: true,
  cancelPolicy: 'Cancelamento deve ser feito com pelo menos 2 horas de antecedência.',
  cancelAdvanceHours: '2',
  paymentPix: true,
  paymentDinheiro: true,
  paymentDebito: true,
  paymentCredito: true,
  activeCampaignTitle: '',
  activeCampaignDiscount: '',
  activeCampaignMessage: '',
  isCampaignActive: false,
};

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mamuty_shop_settings');
      if (saved) setSettings(JSON.parse(saved));
    } catch (e) { console.error(e); }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('mamuty_shop_settings', JSON.stringify(settings));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e) { alert('Erro ao salvar.'); }
  };

  const handleReset = () => {
    if (confirm('Restaurar configurações padrão?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('mamuty_shop_settings', JSON.stringify(DEFAULT_SETTINGS));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const s = (key: keyof ShopSettings, val: string) => setSettings(prev => ({ ...prev, [key]: val }));
  const sBool = (key: keyof ShopSettings, val: boolean) => setSettings(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-amber-400" /> Configurações
          </h1>
          <p className="text-xs text-slate-400 mt-1">Dados, horários, mensagens e regras da barbearia</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleReset} className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs transition flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20">
            <Save className="w-4 h-4" /> Salvar
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl flex items-center gap-2.5 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Configurações salvas com sucesso!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Endereço */}
        <Section icon={MapPin} title="Endereço">
          <Input label="Endereço Completo" value={settings.address} onChange={v => s('address', v)} />
        </Section>

        {/* Horários */}
        <Section icon={Clock} title="Horários de Funcionamento">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="Abertura" value={settings.openTime} onChange={v => s('openTime', v)} type="time" />
            <Input label="Fechamento" value={settings.closeTime} onChange={v => s('closeTime', v)} type="time" />
            <Input label="Almoço Início" value={settings.lunchStart} onChange={v => s('lunchStart', v)} type="time" />
            <Input label="Almoço Fim" value={settings.lunchEnd} onChange={v => s('lunchEnd', v)} type="time" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Dias de Funcionamento" value={settings.workDays} onChange={v => s('workDays', v)} />
            <Select label="Intervalo de Encaixes" value={settings.intervalMinutes} onChange={v => s('intervalMinutes', v)} options={[{ v: '15', l: '15 min' }, { v: '30', l: '30 min' }, { v: '45', l: '45 min' }, { v: '60', l: '60 min' }]} />
          </div>
        </Section>

        {/* Tolerância */}
        <Section icon={Clock} title="Tolerância de Atraso">
          <p className="text-xs text-slate-400 mb-3">
            Tempo máximo que o cliente pode chegar após o horário marcado sem ser considerado atrasado.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tolerância (minutos)"
              value={settings.toleranceMinutes}
              onChange={v => s('toleranceMinutes', v)}
              options={[
                { v: '5', l: '5 minutos' },
                { v: '10', l: '10 minutos' },
                { v: '15', l: '15 minutos (padrão)' },
                { v: '20', l: '20 minutos' },
                { v: '30', l: '30 minutos' },
                { v: '45', l: '45 minutos' },
              ]}
            />
            <div className="flex items-end">
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 w-full">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Exemplo</p>
                <p className="text-xs text-slate-300">
                  Horário: <span className="text-amber-400 font-bold">14:00</span> | 
                  Chegada: <span className="text-emerald-400 font-bold">14:08</span> = 
                  <span className="text-emerald-400 font-bold"> No tempo</span>
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Horário: <span className="text-amber-400 font-bold">14:00</span> | 
                  Chegada: <span className="text-rose-400 font-bold">14:25</span> = 
                  <span className="text-rose-400 font-bold"> Atraso</span>
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* WhatsApp */}
        <Section icon={MessageCircle} title="WhatsApp & Atendimento">
          <Input label="WhatsApp Comercial" value={settings.whatsapp} onChange={v => s('whatsapp', v)} placeholder="(94) 98443-9065" />
          <div>
            <label className="font-bold text-slate-300 block mb-1.5 text-xs">Tom de Voz do Assistente</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'relaxed' as const, label: 'Descontraído', desc: 'Gírias leves, emojis, tom acolhedor' },
                { key: 'professional' as const, label: 'Profissional', desc: 'Formal, polido, focado em clareza' },
                { key: 'energetic' as const, label: 'Vendedor', desc: 'Focado em fechar rápido' },
              ].map(tone => (
                <button key={tone.key} type="button" onClick={() => s('aiTone', tone.key)}
                  className={`p-3 rounded-2xl border text-left transition ${settings.aiTone === tone.key ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}>
                  <p className="font-bold text-amber-400 text-xs">{tone.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{tone.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <Textarea label="Mensagem de Boas-Vindas" value={settings.welcomeMessage} onChange={v => s('welcomeMessage', v)} rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Toggle label="Lembrete Anti-No-Show" desc="Avisar cliente para confirmar" checked={settings.autoAntiNoShow} onChange={v => sBool('autoAntiNoShow', v)} />
            <Toggle label="Sugerir Produtos" desc="Oferecer pomada e pós-barba" checked={settings.suggestProducts} onChange={v => sBool('suggestProducts', v)} />
          </div>
        </Section>

        {/* Pagamentos */}
        <Section icon={CreditCard} title="Formas de Pagamento">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Toggle label="PIX" checked={settings.paymentPix} onChange={v => sBool('paymentPix', v)} />
            <Toggle label="Dinheiro" checked={settings.paymentDinheiro} onChange={v => sBool('paymentDinheiro', v)} />
            <Toggle label="Débito" checked={settings.paymentDebito} onChange={v => sBool('paymentDebito', v)} />
            <Toggle label="Crédito" checked={settings.paymentCredito} onChange={v => sBool('paymentCredito', v)} />
          </div>
        </Section>

        {/* Cancelamento */}
        <Section icon={Ban} title="Política de Cancelamento">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Horas de Antecedência" value={settings.cancelAdvanceHours} onChange={v => s('cancelAdvanceHours', v)} type="number" />
            <div />
          </div>
          <Textarea label="Política" value={settings.cancelPolicy} onChange={v => s('cancelPolicy', v)} rows={2} />
        </Section>

        {/* Mensagens Automáticas */}
        <Section icon={MessageCircle} title="Mensagens Automáticas">
          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Confirmação Automática</p>
              <p className="text-xs text-slate-300">"Fala <span className="text-amber-400">{'{{nome}}'}</span>! Seu horário hoje às <span className="text-amber-400">{'{{horário}}'}</span> está confirmado. Responda 1 para confirmar."</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Lembrete</p>
              <p className="text-xs text-slate-300">"Fala <span className="text-amber-400">{'{{nome}}'}</span>! Lembrando que você tem horário amanhã às <span className="text-amber-400">{'{{horário}}'}</span> com <span className="text-amber-400">{'{{barbeiro}}'}</span>. Até lá!"</p>
            </div>
          </div>
        </Section>

        {/* Campanha */}
        <Section icon={Tag} title="Campanha & Promoção">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300">Status da Campanha</span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${settings.isCampaignActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
              {settings.isCampaignActive ? 'Ativa' : 'Pausada'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Título" value={settings.activeCampaignTitle} onChange={v => s('activeCampaignTitle', v)} placeholder="Ex: Quarta Maluca" />
            <Input label="Desconto" value={settings.activeCampaignDiscount} onChange={v => s('activeCampaignDiscount', v)} placeholder="Ex: 15% OFF" />
          </div>
          <Textarea label="Mensagem Promocional" value={settings.activeCampaignMessage} onChange={v => s('activeCampaignMessage', v)} rows={2} />
          <div className="flex items-center justify-between pt-2">
            <Toggle label="Ativar promoção nas respostas do assistente" checked={settings.isCampaignActive} onChange={v => sBool('isCampaignActive', v)} />
            <a href={`https://wa.me/55${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(settings.activeCampaignMessage)}`} target="_blank" rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition">
              <Send className="w-3.5 h-3.5" /> Testar WhatsApp
            </a>
          </div>
        </Section>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={handleReset} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">Restaurar</button>
          <button type="submit" className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-sm flex items-center gap-2 transition shadow-xl shadow-amber-500/20">
            <Save className="w-4 h-4" /> Salvar Tudo
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Icon className="w-5 h-5 text-amber-400" />
        <h2 className="font-bold text-base text-white">{title}</h2>
      </div>
      <div className="space-y-3 text-xs">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="font-bold text-slate-300 block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <label className="font-bold text-slate-300 block mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="font-bold text-slate-300 block mb-1.5">{label}</label>
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none leading-relaxed resize-none" />
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
      <div>
        <p className="font-bold text-white text-xs">{label}</p>
        {desc && <p className="text-[11px] text-slate-400">{desc}</p>}
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-amber-500 cursor-pointer" />
    </div>
  );
}
