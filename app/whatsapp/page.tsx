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
          component: brainOutput.component as any,
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
    <div className="max-w-2xl mx-auto h-[92vh] sm:h-[86vh] flex flex-col bg-[#0a0f1a] rounded-2xl border border-slate-800/50 shadow-2xl overflow-hidden font-sans">
      
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-[#111827] via-[#1a2332] to-[#111827] px-4 py-3 border-b border-slate-700/40 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg transition" title="Voltar ao início">
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-500/50 bg-slate-900 shadow-lg shadow-amber-500/10">
              <img src="/marcos-avatar.jpg" alt="Marcos - Assistente Digital" className="w-full h-full object-cover" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#111827] rounded-full shadow-sm"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-sm sm:text-base tracking-tight">Marcos</h1>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase">
                Assistente Digital
              </span>
            </div>
            <p className="text-[11px] text-emerald-400/80 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Online &bull; Mamuty Barbearia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTestPanelOpen(prev => !prev)}
            className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-amber-400 border border-slate-700/50 hover:border-amber-500/30 px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5"
            title="Bancada de Testes"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Testes</span>
            {isTestPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <Link
            href="/admin"
            className="text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5"
            title="Painel Administrativo"
          >
            <span>Admin</span>
          </Link>
        </div>
      </div>

      {/* Test Panel */}
      {isTestPanelOpen && (
        <div className="bg-gradient-to-b from-slate-900/95 to-slate-900/80 border-b border-slate-700/40 p-3 shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" /> Cenários de Teste
            </span>
            <span className="text-[10px] text-slate-500">Clique para testar</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {testScenarios.map((ts, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(ts.text)}
                className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-amber-300 border border-slate-700/50 hover:border-amber-500/30 px-3 py-2 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all duration-200 active:scale-95 text-left shrink-0 hover:shadow-lg hover:shadow-amber-500/5"
              >
                <span className="font-bold text-amber-400/70 block text-[9px] uppercase tracking-wide">{ts.title}</span>
                <span className="line-clamp-1">"{ts.text}"</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Human Handoff Alert */}
      {humanHandoffAlert && (
        <div className="bg-gradient-to-r from-amber-950/80 to-amber-900/60 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <span><strong>Atendimento humano:</strong> {humanHandoffAlert}</span>
          </div>
          <button onClick={() => setHumanHandoffAlert(null)} className="text-amber-400/60 hover:text-white p-1 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0d1117] bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0.8)_0%,rgba(13,17,23,1)_100%)]">
        
        <div className="flex justify-center">
          <span className="bg-slate-800/60 text-slate-400 text-[10px] font-medium px-4 py-1.5 rounded-full border border-slate-700/50 text-center shadow-sm">
            🧠 Cérebro do Marcos ativo
          </span>
        </div>

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2 animate-in fade-in`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/30 shrink-0 mb-1">
                  <img src="/marcos-avatar.jpg" alt="Marcos" className="w-full h-full object-cover" />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 shadow-lg relative ${
                  isUser
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-tr-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-100 rounded-tl-md border border-slate-700/40 shadow-slate-900/50'
                }`}
              >
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </p>

                {/* Services List */}
                {msg.component === 'services_list' && msg.payload?.services && (
                  <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Serviços Oficiais
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.payload.services.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => handleQuickActionClick('ESCOLHER_SERVICO', { serviceId: s.id }, `Quero ${s.nome || s.name}`)}
                          className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-700/80 border border-slate-700/50 hover:border-amber-500/30 text-xs text-white transition-all duration-200 flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-bold text-amber-300 group-hover:text-amber-200">{s.nome || s.name}</p>
                            <p className="text-[10px] text-slate-400">{s.duracaoMinutos || s.durationMinutes} min</p>
                          </div>
                          <span className="font-black text-emerald-400 text-sm group-hover:scale-110 transition-transform">R$ {s.preco || s.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Barbers List */}
                {msg.component === 'barbers_list' && (
                  <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Com quem você prefere?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {barbers.map((b: any) => (
                        <button
                          key={b.id}
                          onClick={() => handleQuickActionClick('ESCOLHER_BARBEIRO', { barberName: b.name }, `Prefiro com ${b.name}`)}
                          className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-700/80 border border-slate-700/50 hover:border-amber-500/30 text-xs text-left text-white transition-all duration-200 flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 shrink-0 border-2 border-amber-500/30 group-hover:border-amber-500/60 transition-colors">
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

                {/* Time Slots */}
                {msg.component === 'slots_list' && msg.payload?.slots && (
                  <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Horários disponíveis
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {msg.payload.slots.slice(0, 9).map((slot: any) => (
                        <button
                          key={slot.horario}
                          onClick={() => handleQuickActionClick('ESCOLHER_HORARIO', { time: slot.horario }, `Quero às ${slot.horario}`)}
                          className="py-2.5 px-2 rounded-xl bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 border border-slate-700/50 hover:border-amber-500 text-xs font-bold text-white transition-all duration-200 text-center hover:shadow-lg hover:shadow-amber-500/20"
                        >
                          {slot.horario}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Methods */}
                {msg.component === 'payment_methods' && (
                  <div className="mt-3 pt-3 border-t border-slate-700/40 grid grid-cols-2 gap-2">
                    {[
                      { id: 'pix', label: 'PIX', icon: QrCode },
                      { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                      { id: 'debito', label: 'Débito', icon: CreditCard },
                      { id: 'credito', label: 'Crédito', icon: CreditCard }
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleQuickActionClick('ESCOLHER_PAGAMENTO', { method: m.id }, `Vou pagar com ${m.label}`)}
                        className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-700/80 border border-slate-700/50 hover:border-amber-500/30 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all duration-200"
                      >
                        <m.icon className="w-4 h-4 text-amber-400" />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Summary Card */}
                {msg.component === 'summary_card' && msg.payload?.draft && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2 text-xs shadow-lg shadow-amber-500/5">
                    <p className="font-bold text-amber-400 border-b border-slate-700/50 pb-2 uppercase tracking-wider">Confirmação de Reserva</p>
                    <div className="space-y-1.5">
                      <p className="flex justify-between text-slate-300"><span>Serviço:</span> <strong className="text-white">{msg.payload.draft.service?.name || msg.payload.draft.service?.nome}</strong></p>
                      <p className="flex justify-between text-slate-300"><span>Barbeiro:</span> <strong className="text-white">{msg.payload.draft.barber?.name}</strong></p>
                      <p className="flex justify-between text-slate-300"><span>Data:</span> <strong className="text-white">{msg.payload.draft.date?.split('-').reverse().join('/')}</strong></p>
                      <p className="flex justify-between text-slate-300"><span>Horário:</span> <strong className="text-white">{msg.payload.draft.time}</strong></p>
                      <p className="flex justify-between text-slate-300"><span>Pagamento:</span> <strong className="text-amber-300 uppercase">{msg.payload.draft.paymentMethod}</strong></p>
                      <p className="flex justify-between text-slate-300 border-t border-slate-700/50 pt-2"><span>Valor:</span> <strong className="text-emerald-400 text-sm">R$ {msg.payload.draft.service?.price || msg.payload.draft.service?.preco}</strong></p>
                    </div>
                  </div>
                )}

                {/* Confirmed Card */}
                {msg.component === 'confirmed_card' && (
                  <div className="mt-3 p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/30 space-y-3 shadow-lg shadow-emerald-500/10">
                    <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-xs">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span>Salvo no Sistema</span>
                    </div>
                    <Link
                      href="/admin"
                      className="block w-full text-center py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
                    >
                      Ver na Agenda &rarr;
                    </Link>
                  </div>
                )}

                {/* Cancel Card */}
                {msg.component === 'cancel_card' && msg.payload?.appointment && (
                  <div className="mt-3 p-4 rounded-xl bg-rose-950/50 border border-rose-500/30 space-y-2 text-xs shadow-lg shadow-rose-500/10">
                    <div className="flex items-center gap-2.5 text-rose-400 font-bold">
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <span>Agendamento no Sistema</span>
                    </div>
                    <p className="text-slate-300 pl-10.5">
                      {msg.payload.appointment.date.split('-').reverse().join('/')} às {msg.payload.appointment.time} &bull; {msg.payload.appointment.serviceNames?.[0]} com {msg.payload.appointment.barberName}
                    </p>
                  </div>
                )}

                {/* Human Handoff */}
                {msg.component === 'human_handoff' && (
                  <div className="mt-3 pt-3 border-t border-slate-700/40">
                    <a
                      href="https://wa.me/5594984439065?text=Ol%C3%A1%20Hemerson%2C%20o%20assistente%20Marcos%20me%20encaminhou%20para%20falar%20com%20voc%C3%AA."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Falar com Hemerson</span>
                    </a>
                  </div>
                )}

                {/* Timestamp */}
                <div className={`flex items-center justify-end gap-1.5 mt-2 text-[10px] ${isUser ? 'text-slate-700' : 'text-slate-500'}`}>
                  <span>{msg.timestamp}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-slate-700" />}
                </div>
              </div>

              {/* Quick Replies */}
              {msg.quickReplies && msg.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5 max-w-[85%]">
                  {msg.quickReplies.map((qr, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickActionClick(qr.action, qr.payload, qr.label)}
                      className="bg-slate-800/60 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-700/50 hover:border-amber-500 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 shadow-sm hover:shadow-lg hover:shadow-amber-500/20"
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
          <div className="flex items-end gap-2 animate-in fade-in">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/30 shrink-0 mb-1">
              <img src="/marcos-avatar.jpg" alt="Marcos" className="w-full h-full object-cover" />
            </div>
            <div className="bg-slate-800/80 text-slate-300 rounded-2xl rounded-tl-md px-4 py-3 border border-slate-700/40 flex items-center gap-2.5 shadow-lg">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-xs text-slate-400 italic font-medium">Marcos está digitando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gradient-to-r from-[#111827] via-[#1a2332] to-[#111827] p-3 border-t border-slate-700/40 flex items-center gap-2.5 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Envie uma mensagem..."
          className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder:text-slate-500 transition-all duration-200"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim()}
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:hover:from-amber-500 disabled:hover:to-amber-600 text-slate-950 flex items-center justify-center transition-all duration-200 active:scale-95 shrink-0 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
          title="Enviar mensagem"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}