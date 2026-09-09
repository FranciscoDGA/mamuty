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
  AlertCircle
} from 'lucide-react';
import { ChatMessage, DialogStep, BookingDraft } from '@/lib/conversation/types';
import { processUserMessage } from '@/lib/conversation/engine';

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
        text: `Olá! 👋 Sou o *Marcos*, assistente digital da *Barbearia Mamuty*.\n\nEstou aqui para ajudar você a agendar seu horário sem precisar esperar na barbearia!\n\nVocê pode clicar nos botões rápidos abaixo ou escrever o que precisa:`,
        timestamp: timeStr,
        intent: 'SAUDACAO',
        quickReplies: [
          { label: 'Quero agendar', action: 'INICIAR_AGENDAMENTO' },
          { label: 'Tem vaga hoje?', action: 'VER_HORARIOS_HOJE' },
          { label: 'Quanto custa o corte?', action: 'VER_SERVICOS' },
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

    // 1. Inserir mensagem do usuário na tela se for texto
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

    // Simulação do tempo natural de resposta do WhatsApp (400ms a 700ms)
    setTimeout(async () => {
      try {
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

        // Se a ação requereu persistência real no Supabase
        if (result.actionToExecute) {
          if (result.actionToExecute.type === 'CREATE_APPOINTMENT') {
            try {
              await createAppointment(result.actionToExecute.payload);
            } catch (err: any) {
              console.error('Erro na criação pelo WhatsApp:', err);
              result.reply.text = `⚠️ Ops! ${err.message || 'Houve um imprevisto ao gravar o horário no sistema.'}`;
            }
          } else if (result.actionToExecute.type === 'CANCEL_APPOINTMENT') {
            try {
              await updateAppointmentStatus(result.actionToExecute.payload.id, 'cancelled');
            } catch (err: any) {
              console.error('Erro no cancelamento pelo WhatsApp:', err);
            }
          }
        }

        setDialogStep(result.nextStep);
        setBookingDraft(result.nextDraft);
        setMessages(prev => [...prev, result.reply]);
      } catch (err: any) {
        setMessages(prev => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            sender: 'marcos',
            text: 'Desculpe, tive uma oscilação na consulta da agenda. Por favor, tente novamente.',
            timestamp: timeStr
          }
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 550);
  };

  const handleQuickActionClick = (action: string, payload?: any, label?: string) => {
    if (label) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const userMsg: ChatMessage = {
        id: 'user-' + Date.now(),
        sender: 'user',
        text: label,
        timestamp: timeStr
      };
      setMessages(prev => [...prev, userMsg]);
    }
    handleSendMessage('', { action, data: payload });
  };

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
                Simulação
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium leading-tight">
              ● Online &bull; Marcos (Assistente da Barbearia)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1"
            title="Abrir Painel Administrativo"
          >
            <span>Ver Admin</span>
          </Link>
          <a
            href="https://wa.me/5594984439065"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-300 hover:text-emerald-400 transition"
            title="Ligar ou falar no WhatsApp real"
          >
            <PhoneCall className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 2. Barra de Sugestões de Cenários de Teste */}
      <div className="bg-[#121b22] px-3 py-2 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
        <span className="text-slate-400 font-bold uppercase text-[9px] whitespace-nowrap pl-1">Cenários:</span>
        <button
          onClick={() => handleSendMessage('Vocês estão abertos hoje?')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition border border-slate-700/60"
        >
          "Vocês estão abertos?"
        </button>
        <button
          onClick={() => handleSendMessage('Quanto custa o corte?')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition border border-slate-700/60"
        >
          "Quanto custa o corte?"
        </button>
        <button
          onClick={() => handleSendMessage('Tem vaga hoje?')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition border border-slate-700/60"
        >
          "Tem vaga hoje?"
        </button>
        <button
          onClick={() => handleSendMessage('Quero marcar um horário')}
          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1 rounded-full whitespace-nowrap transition border border-amber-500/40 font-bold"
        >
          "Quero marcar"
        </button>
        <button
          onClick={() => handleSendMessage('Quero cancelar meu horário')}
          className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 px-2.5 py-1 rounded-full whitespace-nowrap transition border border-rose-900/50"
        >
          "Quero cancelar"
        </button>
        <button
          onClick={() => handleSendMessage('Quero falar com alguém')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition border border-slate-700/60"
        >
          "Falar com humano"
        </button>
      </div>

      {/* 3. Área de Mensagens (Estilo Fundo WhatsApp) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b141a] bg-opacity-95 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        {/* Aviso de Ambiente Simulado */}
        <div className="flex justify-center">
          <span className="bg-[#182229] text-slate-400 text-[10px] font-medium px-3 py-1 rounded-lg border border-slate-800 text-center shadow-xs max-w-xs">
            🔒 As mensagens simulam o atendimento do WhatsApp conectando diretamente na base de dados do Supabase.
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

                {/* COMPONENTES INTERATIVOS CONVERSACIONAIS */}

                {/* Lista de Serviços */}
                {msg.component === 'services_list' && msg.payload?.services && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 space-y-2">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Escolha um serviço para agendar:
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {msg.payload.services.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => handleQuickActionClick('ESCOLHER_SERVICO', { serviceId: s.id }, `Quero ${s.name}`)}
                          className="w-full text-left p-2.5 rounded-xl bg-[#111b21] hover:bg-slate-800 border border-slate-700 text-xs text-white transition flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-amber-300">{s.name}</p>
                            <p className="text-[10px] text-slate-400">{s.durationMinutes} min</p>
                          </div>
                          <span className="font-black text-emerald-400 text-xs">R$ {s.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de Barbeiros */}
                {msg.component === 'barbers_list' && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 space-y-2">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Selecione o profissional:
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
                            <p className="text-[10px] text-slate-400 truncate">{b.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de Vagas Livres */}
                {msg.component === 'slots_list' && msg.payload?.slots && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 space-y-2">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Toque no horário desejado:
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

                {/* Formas de Pagamento */}
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

                {/* Resumo Final antes de Confirmar */}
                {msg.component === 'summary_card' && msg.payload?.draft && (
                  <div className="mt-3 p-3 rounded-xl bg-[#111b21] border border-amber-500/40 space-y-1.5 text-xs">
                    <p className="font-bold text-amber-400 border-b border-slate-800 pb-1">Resumo do Agendamento:</p>
                    <p className="flex justify-between text-slate-300"><span>Serviço:</span> <strong className="text-white">{msg.payload.draft.service?.name}</strong></p>
                    <p className="flex justify-between text-slate-300"><span>Profissional:</span> <strong className="text-white">{msg.payload.draft.barber?.name}</strong></p>
                    <p className="flex justify-between text-slate-300"><span>Data:</span> <strong className="text-white">{msg.payload.draft.date?.split('-').reverse().join('/')}</strong></p>
                    <p className="flex justify-between text-slate-300"><span>Horário:</span> <strong className="text-white">{msg.payload.draft.time}</strong></p>
                    <p className="flex justify-between text-slate-300"><span>Pagamento:</span> <strong className="text-amber-300 uppercase">{msg.payload.draft.paymentMethod}</strong></p>
                    <p className="flex justify-between text-slate-300 border-t border-slate-800 pt-1"><span>Valor:</span> <strong className="text-emerald-400">R$ {msg.payload.draft.service?.price}</strong></p>
                  </div>
                )}

                {/* Card de Confirmação Concluída */}
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

                {/* Card de Cancelamento */}
                {msg.component === 'cancel_card' && msg.payload?.appointment && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-rose-400 font-bold">
                      <AlertCircle className="w-4 h-4" />
                      <span>Agendamento Localizado:</span>
                    </div>
                    <p className="text-slate-300">
                      {msg.payload.appointment.date.split('-').reverse().join('/')} às {msg.payload.appointment.time} &bull; {msg.payload.appointment.serviceNames?.[0]} com {msg.payload.appointment.barberName}
                    </p>
                  </div>
                )}

                {/* Encaminhamento para Humano */}
                {msg.component === 'human_handoff' && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60">
                    <a
                      href="https://wa.me/5594984439065?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20um%20atendente%20da%20Barbearia%20Mamuty."
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

              {/* Botões de Respostas Rápidas (Quick Replies) */}
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

        {/* Indicador de Digitando */}
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
          placeholder="Digite uma mensagem para o Marcos..."
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
