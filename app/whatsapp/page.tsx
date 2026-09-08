'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { 
  ChevronLeft, 
  Send, 
  CheckCheck, 
  Loader2, 
  Scissors, 
  Mic, 
  MicOff, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  X,
  PhoneCall
} from 'lucide-react';
import { Barber, Service } from '@/lib/types';

type Message = {
  id: string;
  sender: 'user' | 'bot';
  text: string | React.ReactNode;
  options?: { label: string; action: () => void }[];
  time: string;
  isAudio?: boolean;
};

export default function WhatsAppDemo() {
  const { services, barbers, appointments, createAppointment, salonConfig } = useApp();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quick Action Chips
  const quickChips = [
    'Quais os preços dos serviços?',
    'Tem vaga para hoje?',
    'Quem são os barbeiros?',
    'Qual o endereço da barbearia?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initial welcome message
  useEffect(() => {
    const welcomeTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'welcome-1',
        sender: 'bot',
        text: `Fala, tudo bem? Bem-vindo ao WhatsApp da *Mamuty Barbearia*! 💈✂️\n\nSou o assistente digital da barbearia. Como posso te ajudar hoje?\n\n• Agendar um horário\n• Preços e serviços\n• Barbeiros disponíveis\n• Endereço e horários`,
        time: welcomeTime,
        options: [
          { label: '💈 Ver serviços e preços', action: () => handleSendText('Quais os preços dos serviços?') },
          { label: '🕒 Tem vaga hoje?', action: () => handleSendText('Tem vaga para hoje?') },
          { label: '✂️ Agendar horário agora', action: () => handleSendText('Quero agendar um corte') }
        ]
      }
    ]);
  }, []);

  const addBotMessage = (text: string | React.ReactNode, options?: { label: string; action: () => void }[]) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'bot',
      text,
      options,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const handleSendText = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent) return;

    if (!textToSend) setInputText('');

    const userMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message immediately
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'user',
      text: messageContent,
      time: userMsgTime
    }]);

    setIsTyping(true);

    try {
      // Call AI Chat API
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: typeof m.text === 'string' ? m.text : 'Mensagem'
            })),
            { role: 'user', content: messageContent }
          ]
        })
      });

      const data = await res.json();
      setIsTyping(false);

      if (data && data.reply) {
        const dynamicOptions = data.options?.map((opt: any) => ({
          label: opt.label,
          action: () => handleSendText(opt.text)
        }));

        addBotMessage(data.reply, dynamicOptions);
      } else {
        addBotMessage('Opa! Como posso ajudar você a agendar na Mamuty?');
      }
    } catch (err) {
      setIsTyping(false);
      addBotMessage('Tive uma oscilação na conexão, mas você pode me dizer qual serviço e horário deseja agendar!');
    }
  };

  // Audio Recording Simulation
  const handleToggleRecording = () => {
    if (isRecording) {
      // Finish recording and send simulated audio message
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);

      const userMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'user',
        text: '🎤 Mensagem de áudio enviada: "Opa, tudo bom? Gostaria de saber se tem horário para corte hoje à tarde com o João!"',
        time: userMsgTime,
        isAudio: true
      }]);

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(
          'Recebi seu áudio! 🎧\n\nO João tem horários disponíveis hoje sim! Temos vagas às *15:30*, *17:00* e *18:30*. Qual desses horários fica melhor pra você?',
          [
            { label: 'Hoje às 15:30 com João', action: () => handleSendText('Quero agendar hoje às 15:30 com o João') },
            { label: 'Hoje às 17:00 com João', action: () => handleSendText('Quero agendar hoje às 17:00 com o João') },
            { label: 'Hoje às 18:30 com João', action: () => handleSendText('Quero agendar hoje às 18:30 com o João') }
          ]
        );
      }, 1500);
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] md:bg-slate-900 flex flex-col md:py-6 items-center">
      {/* Desktop Top Return Link */}
      <div className="hidden md:flex items-center justify-between w-full max-w-md mb-3 px-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-400 bg-slate-800/90 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar para o Início</span>
        </Link>
        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Assistente IA Ativo
        </span>
      </div>

      {/* Phone Mockup Container */}
      <div className="w-full h-screen md:h-[820px] max-h-screen md:max-w-md bg-[#efeae2] md:rounded-[2.5rem] md:shadow-2xl overflow-hidden flex flex-col relative md:border-[8px] border-slate-800">
        
        {/* WhatsApp Header */}
        <div className="bg-[#008069] text-white p-3 flex items-center justify-between z-10 shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <Link 
              href="/" 
              className="p-1 -ml-1 rounded-full hover:bg-black/10 transition"
              title="Voltar ao Início"
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-white/20">
               <div className="w-full h-full bg-amber-500 flex items-center justify-center">
                 <Scissors className="w-5 h-5 text-slate-900" />
               </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm leading-tight">Mamuty Barbearia</h1>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              </div>
              <p className="text-[10px] text-white/80">Online &bull; Atendente de IA</p>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs bg-black/20 hover:bg-black/30 text-white px-3 py-1 rounded-lg transition font-semibold"
          >
            Fechar ✕
          </Link>
        </div>

        {/* Quick Suggestion Chips on Top of Chat */}
        <div className="bg-slate-100/90 border-b border-slate-200/80 p-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendText(chip)}
              className="text-[11px] whitespace-nowrap bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-300 rounded-full px-3 py-1 shadow-xs transition active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-95">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm shadow-sm relative ${
                msg.sender === 'user' 
                  ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none'
              }`}>
                {msg.isAudio ? (
                  <div className="flex items-center gap-2 text-emerald-800 font-medium">
                    <Mic className="w-4 h-4 text-emerald-600" />
                    <span>{msg.text}</span>
                  </div>
                ) : (
                  <div className="pr-12 pb-1 whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                )}
                
                {/* Action options buttons */}
                {msg.options && (
                  <div className="mt-2.5 space-y-1.5 flex flex-col border-t border-slate-200 pt-2">
                    {msg.options.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={opt.action}
                        className="text-left bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl text-[#008069] font-bold text-xs transition active:bg-emerald-200 border border-emerald-200/60"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-slate-400">
                  {msg.time}
                  {msg.sender === 'user' && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5 bg-white p-2.5 rounded-2xl rounded-tl-none w-20 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Audio Recording Banner */}
        {isRecording && (
          <div className="bg-rose-50 border-t border-rose-200 p-2.5 flex items-center justify-between px-4 text-xs animate-pulse text-rose-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span className="font-bold">Gravando áudio... 0:0{recordingSeconds}</span>
            </div>
            <button
              onClick={handleToggleRecording}
              className="text-rose-600 font-extrabold hover:underline"
            >
              Solte para enviar
            </button>
          </div>
        )}

        {/* Chat Input Bar */}
        <div className="bg-[#f0f2f5] p-2.5 flex items-center gap-2 border-t border-slate-300 shrink-0">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder={isRecording ? 'Gravando áudio...' : 'Mensagem no WhatsApp...'}
            disabled={isRecording}
            className="flex-1 bg-white border border-slate-300 rounded-full px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008069]"
          />

          {inputText.trim() ? (
            <button 
              onClick={() => handleSendText()}
              className="w-10 h-10 rounded-full bg-[#008069] hover:bg-[#00705c] text-white flex items-center justify-center transition shadow-md shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleToggleRecording}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-md shrink-0 active:scale-95 ${
                isRecording 
                  ? 'bg-rose-600 text-white animate-bounce' 
                  : 'bg-[#008069] hover:bg-[#00705c] text-white'
              }`}
              title="Gravar áudio"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
