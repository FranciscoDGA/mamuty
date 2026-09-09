'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { 
  ChevronLeft, 
  Send, 
  CheckCheck, 
  Loader2, 
  Scissors, 
  Calendar, 
  Clock, 
  User, 
  X,
  PhoneCall,
  MessageCircle,
  Sparkles,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Flame,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ChatMessage, DialogStep, BookingDraft } from '@/lib/conversation/types';
import { processUserMessage } from '@/lib/conversation/engine';
import { pensarEResponderMarcos } from '@/lib/ai/brain';

export default function WhatsAppSimulationPage() {
  const { 
    services, 
    barbers, 
    appointments, 
    createAppointment, 
    updateAppointmentStatus, 
    currentCustomer 
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>('IDLE');
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>({});
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(true);
  const [humanHandoffAlert, setHumanHandoffAlert] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Mensagem inicial de boas-vindas do assistente Marcos
  useEffect(() => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setMessages([
      {
        id: 'msg-init-1',
        sender: 'marcos',
        text: `Fala, tudo bem? 👋 Sou o *Marcos*, assistente digital da *Barbearia Mamuty*!\n\nEstou aqui para tirar dúvidas sobre serviços, preços e horários, além de garantir seu agendamento sem fila de espera.\n\nComo posso te ajudar hoje? 💈`,
        timestamp: timeStr,
        intent: 'SAUDACAO',
        quickReplies: [
          { label: 'Quero agendar', action: 'INICIAR_AGENDAMENTO' },
          { label: 'Tem vaga hoje?', action: 'VER_HORARIOS_HOJE' },
          { label: 'Quanto custa o degradê?', action: 'MENSAGEM_TEXTO', payload: { text: 'Quanto custa o degradê?' } },
          { label: 'Vocês estão abertos hoje?', action: 'VER_FUNCIONAMENTO' }
        ]
      }
    ]);
  }, []);

  const handleSendMessage = async (textToSend?: string, actionPayload?: any) => {
    const text = (textToSend || inputText).trim();
    if (!text && !actionPayload) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 1. Adicionar mensagem do cliente na tela
    if (text) {
      const userMsg: ChatMessage = {
        id: 'user-' + Date.now(),
        sender: 'user',
        text,
        timestamp: timeStr
      };
      setMessages(prev => [...prev, userMsg]);
      setInputText('');
    }

    setIsTyping(true);

    setTimeout(async () => {
      try {
        // Se for ação estruturada rápida do motor de diálogo
        if (actionPayload?.action && actionPayload.action !== 'MENSAGEM_TEXTO') {
          const result = processUserMessage(
            text,
            {
              services,
              barbers,
              appointments,
              currentCustomer,
              step: dialogStep,
              draft: bookingDraft
            },
            actionPayload
          );

          if (result.actionToExecute?.type === 'CREATE_APPOINTMENT') {
            try {
              await createAppointment(result.actionToExecute.payload);
            } catch (err: any) {
              result.reply.text = `⚠️ Ops! ${err.message || 'Houve um erro ao agendar.'}`;
            }
          } else if (result.actionToExecute?.type === 'CANCEL_APPOINTMENT') {
            try {
              await updateAppointmentStatus(result.actionToExecute.payload.id, 'cancelled');
            } catch (err: any) {
              console.error('Erro ao cancelar:', err);
            }
          }

          setDialogStep(result.nextStep);
          setBookingDraft(result.nextDraft);
          setMessages(prev => [...prev, result.reply]);
          return;
        }

        // Se for texto livre, aciona o Cérebro Cognitivo do Marcos (Sprint 4)
        const history = messages.map(m => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text
        }));

        const brainOutput = await pensarEResponderMarcos(text || actionPayload?.payload?.text || '', {
          services,
          barbers,
          appointments,
          currentCustomer,
          conversationHistory: history,
          activeDraft: bookingDraft
        });

        if (brainOutput.intent === 'HUMANO' || brainOutput.intent === 'SERVICO_NAO_LISTADO') {
          setHumanHandoffAlert('Atendimento humano solicitado. Link direto para o WhatsApp do Hemerson ativado.');
        }

        if (brainOutput.newDraftState) {
          setBookingDraft(prev => ({ ...prev, ...brainOutput.newDraftState }));
        }

        if (brainOutput.actionToExecute?.type === 'CANCEL_APPOINTMENT') {
          await updateAppointmentStatus(brainOutput.actionToExecute.payload.id, 'cancelled');
        }

        const marcosMsg: ChatMessage = {
          id: 'marcos-' + Date.now(),
          sender: 'marcos',
          text: brainOutput.reply,
          timestamp: timeStr,
          intent: brainOutput.intent as any,
          quickReplies: brainOutput.quickReplies,
          component: brainOutput.component,
          payload: brainOutput.componentData
        };

        setMessages(prev => [...prev, marcosMsg]);
      } catch (err: any) {
        setMessages(prev => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            sender: 'marcos',
            text: 'Desculpe, tive uma oscilação momentânea. Por favor, tente novamente.',
            timestamp: timeStr
          }
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 450);
  };

  const handleQuickActionClick = (action: string, payload?: any, label?: string) => {
    if (label) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setMessages(prev => [...prev, { id: 'user-' + Date.now(), sender: 'user', text: label, timestamp: timeStr }]);
    }

    if (action === 'MENSAGEM_TEXTO' && payload?.text) {
      handleSendMessage(payload.text);
      return;
    }

    handleSendMessage('', { action, data: payload });
  };

  // Testes pré-configurados da Sprint 4
  const testScenarios = [
    { title: 'Teste 01 (Horário)', text: 'Oi, vocês estão abertos hoje?' },
    { title: 'Teste 02 (Preço Conduzido)', text: 'Quanto custa o degradê?' },
    { title: 'Teste 03 (Horário Fim de Tarde)', text: 'Tem vaga hoje depois das 17?' },
    { title: 'Teste 04 (Serviço Combo)', text: 'Quero marcar cabelo e barba.' },
    { title: 'Teste 05 (Cancelamento)', text: 'Quero cancelar meu horário.' },
    { title: 'Teste 06 (Gíria Trampo)', text: 'Mano, consigo cortar aí hoje depois do trampo?' },
    { title: 'Teste 07 (Restrição 30m)', text: 'Só tenho meia hora.' },
    { title: 'Teste 08 (Gíria Tapa no Visual)', text: 'Queria dar um tapa no visual.' },
    { title: 'Teste 09 (Não Inventar Preço)', text: 'Vocês fazem corte infantil?' },
    { title: 'Teste 10 (Encaminhar Humano)', text: 'Quero falar com alguém.' }
  ];

  return (
    <div className="max-w-2xl mx-auto h-[92vh] sm:h-[86vh] flex flex-col bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
      
      {/* 1. Header Oficial do WhatsApp */}
      <div className="bg-[#1f2c34] px-4 py-3 border-b border-slate-700/60 flex items-center justify-between z-10 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 text-slate-300 hover:text-white rounded-lg transition" title="Voltar ao início">
            <ChevronLeft className="w-6 h-6" />
          </Link>

          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 bg-black shadow-md">
              <img src="/logo.png" alt="Mamuty Barbearia" className="w-full h-full object-cover" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1f2c34] rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-white text-sm sm:text-base leading-tight">Mamuty Barbearia</h1>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                IA Marcos
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium leading-tight">
              ● Online &bull; Assistente Digital da Barbearia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTestPanelOpen(prev => !prev)}
            className="text-[11px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1"
            title="Alternar Bancada de Testes da Sprint 4"
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Bancada de Testes</span>
            {isTestPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <Link
            href="/admin"
            className="text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1"
            title="Abrir Painel Administrativo"
          >
            <span>Admin</span>
          </Link>
        </div>
      </div>

      {/* 2. Bancada de Testes da IA (Sprint 4 - Modo de Teste) */}
      {isTestPanelOpen && (
        <div className="bg-slate-900/95 border-b border-purple-500/30 p-2.5 shrink-0 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-purple-400 flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5" /> Cenários de Teste da Sprint 4 (Linguagem Natural & Gírias):
            </span>
            <span className="text-[10px] text-slate-400">Clique para testar a IA</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {testScenarios.map((ts, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(ts.text)}
                className="bg-slate-950 hover:bg-purple-950/60 text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-500/50 px-2.5 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition active:scale-95 text-left shrink-0"
              >
                <span className="font-bold text-purple-400 block text-[9px] uppercase">{ts.title}</span>
                <span>"{ts.text}"</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alerta de Encaminhamento para Humano */}
      {humanHandoffAlert && (
        <div className="bg-amber-950/70 border-b border-amber-500/40 px-4 py-2 flex items-center justify-between gap-2 text-xs text-amber-300 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>🔔 <strong>Atendimento humano solicitado:</strong> {humanHandoffAlert}</span>
          </div>
          <button onClick={() => setHumanHandoffAlert(null)} className="text-amber-400 hover:text-white p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Área de Mensagens (Estilo WhatsApp) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b141a] bg-opacity-95 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        
        <div className="flex justify-center">
          <span className="bg-[#182229] text-slate-400 text-[10px] font-medium px-3 py-1 rounded-lg border border-slate-800 text-center shadow-xs max-w-xs">
            🧠 Cérebro do Marcos ativo: Base de conhecimento da Mamuty + Consulta em tempo real ao Supabase.
          </span>
        </div>

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3 shadow-md relative ${
                  isUser
                    ? 'bg-[#005c4b] text-white rounded-tr-none'
                    : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/40'
                }`}
              >
                {/* Texto da mensagem */}
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </p>

                {/* COMPONENTES INTERATIVOS */}

                {/* 1. Lista de Serviços */}
                {msg.component === 'services_list' && msg.payload?.services && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 space-y-2">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Serviços Oficiais Cadastrados:
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {msg.payload.services.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => handleQuickActionClick('ESCOLHER_SERVICO', { serviceId: s.id }, `Quero ${s.nome || s.name}`)}
                          className="w-full text-left p-2.5 rounded-xl bg-[#111b21] hover:bg-slate-800 border border-slate-700 text-xs text-white transition flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-amber-300">{s.nome || s.name}</p>
                            <p className="text-[10px] text-slate-400">{s.duracaoMinutos || s.durationMinutes} min</p>
                          </div>
                          <span className="font-black text-emerald-400 text-xs">R$ {s.preco || s.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Lista de Barbeiros */}
                {msg.component === 'barbers_list' && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 space-y-2">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Com quem você prefere?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {barbers.map((b: any) => (
                        <button
                          key={b.id}
                          onClick={() => handleQuickActionClick('ESCOLHER_BARBEIRO', { barberName: b.name }, `Prefiro com ${b.name}`)}
                          className="p-2.5 rounded-xl bg-[#111b21] hover:bg-slate-800 border border-slate-700 text-xs text-left text-white transition flex items-center gap-2.5"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-black shrink-0 border border-amber-500/40">
                            <img src={b.avatarUrl || '/logo.png'} alt={b.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{b.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{b.role || b.titulo}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Vagas / Horários Livres */}
                {msg.component === 'slots_list' && msg.payload?.slots && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 space-y-2">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Horários disponíveis no sistema:
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {msg.payload.slots.slice(0, 9).map((slot: any) => (
                        <button
                          key={slot.horario}
                          onClick={() => handleQuickActionClick('ESCOLHER_HORARIO', { time: slot.horario }, `Quero às ${slot.horario}`)}
                          className="py-2 px-1 rounded-xl bg-[#111b21] hover:bg-amber-500 hover:text-slate-950 border border-slate-700 text-xs font-bold text-white transition text-center"
                        >
                          {slot.horario}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Formas de Pagamento */}
                {msg.component === 'payment_methods' && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-2">
                    {[
                      { id: 'pix', label: 'PIX', icon: QrCode },
                      { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                      { id: 'debito', label: 'Débito', icon: CreditCard },
                      { id: 'credito', label: 'Crédito', icon: CreditCard }
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleQuickActionClick('ESCOLHER_PAGAMENTO', { method: m.id }, `Vou pagar com ${m.label}`)}
                        className="p-2 rounded-xl bg-[#111b21] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
                      >
                        <m.icon className="w-3.5 h-3.5 text-amber-400" />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 5. Resumo Final */}
                {msg.component === 'summary_card' && msg.payload?.draft && (
                  <div className="mt-3 p-3 rounded-xl bg-[#111b21] border border-amber-500/40 space-y-1.5 text-xs">
                    <p className="font-bold text-amber-400 border-b border-slate-800 pb-1">Confirmação de Reserva:</p>
                    <p className="flex justify-between text-slate-300"><span>Serviço:</span> <strong className="text-white">{msg.payload.draft.service?.name || msg.payload.draft.service?.nome}</strong></p>
                    <p className="flex justify-between text-slate-300"><span>Barbeiro:</span> <strong className="text-white">{msg.payload.draft.barber?.name}</strong></p>
                    <p className="flex justify-between text-slate-300"><span>Data:</span> <strong className="text-white">{msg.payload.draft.date?.split('-').reverse().join('/')}</strong></p>
                    <p className="flex justify-between text-slate-300"><span>Horário:</span> <strong className="text-white">{msg.payload.draft.time}</strong></p>
                    <p className="flex justify-between text-slate-300"><span>Pagamento:</span> <strong className="text-amber-300 uppercase">{msg.payload.draft.paymentMethod}</strong></p>
                    <p className="flex justify-between text-slate-300 border-t border-slate-800 pt-1"><span>Valor:</span> <strong className="text-emerald-400">R$ {msg.payload.draft.service?.price || msg.payload.draft.service?.preco}</strong></p>
                  </div>
                )}

                {/* 6. Card de Agendamento Concluído */}
                {msg.component === 'confirmed_card' && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvo no Supabase & Visível no Admin</span>
                    </div>
                    <Link
                      href="/admin"
                      className="block w-full text-center py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                    >
                      Conferir na Agenda do Dono (/admin) &rarr;
                    </Link>
                  </div>
                )}

                {/* 7. Card de Cancelamento */}
                {msg.component === 'cancel_card' && msg.payload?.appointment && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-rose-400 font-bold">
                      <AlertCircle className="w-4 h-4" />
                      <span>Agendamento no Sistema:</span>
                    </div>
                    <p className="text-slate-300">
                      {msg.payload.appointment.date.split('-').reverse().join('/')} às {msg.payload.appointment.time} &bull; {msg.payload.appointment.serviceNames?.[0]} com {msg.payload.appointment.barberName}
                    </p>
                  </div>
                )}

                {/* 8. Encaminhamento para Humano */}
                {msg.component === 'human_handoff' && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60">
                    <a
                      href="https://wa.me/5594984439065?text=Ol%C3%A1%20Hemerson%2C%20o%20assistente%20Marcos%20me%20encaminhou%20para%20falar%20com%20voc%C3%AA."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Falar com Hemerson (+55 94 98443-9065)</span>
                    </a>
                  </div>
                )}

                {/* Timestamp & Checks */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                </div>
              </div>

              {/* Quick Reply Chips */}
              {msg.quickReplies && msg.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                  {msg.quickReplies.map((qr, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickActionClick(qr.action, qr.payload, qr.label)}
                      className="bg-[#1f2c34] hover:bg-[#00a884] text-slate-200 hover:text-white border border-slate-700/60 hover:border-transparent px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 shadow-xs"
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-start gap-2 animate-in fade-in">
            <div className="bg-[#202c33] text-slate-300 rounded-2xl rounded-tl-none px-4 py-2.5 border border-slate-700/40 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-xs text-slate-400 italic font-medium">Marcos está digitando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Campo de Entrada de Mensagem */}
      <div className="bg-[#202c33] p-3 border-t border-slate-800 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Envie uma mensagem (ex: 'Tem vaga hoje depois do trampo?')..."
          className="flex-1 bg-[#2a3942] border border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 flex items-center justify-center transition active:scale-95 shrink-0 shadow-md"
          title="Enviar mensagem"
        >
          <Send className="w-4 h-4 text-slate-950" />
        </button>
      </div>

    </div>
  );
}
