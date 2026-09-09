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
  PhoneCall,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { Barber, Service } from '@/lib/types';

type Message = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  options?: { label: string; action: () => void }[];
  time: string;
  isAudio?: boolean;
  audioDuration?: string;
  audioDurationSeconds?: number;
  transcription?: string;
};

export default function WhatsAppDemo() {
  const { services, barbers, appointments, createAppointment, salonConfig } = useApp();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activePlaybackId, setActivePlaybackId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordedTranscriptRef = useRef<string>('');

  // Quick Action Chips
  const quickChips = [
    'Quais os preços dos serviços?',
    'Tem vaga para hoje?',
    'Quem são os barbeiros?',
    'Qual o endereço da barbearia?'
  ];

  // Quick Audio Presets
  const audioPresets = [
    { label: '🎙️ "Tem vaga com Hemerson hoje?"', text: 'Olá, gostaria de saber se tem vaga pra corte hoje com o Hemerson!' },
    { label: '🎙️ "Quanto custa corte e barba?"', text: 'Boa tarde, quanto sai o combo de corte de cabelo e barba?' },
    { label: '🎙️ "Quero agendar no sábado de manhã"', text: 'Fala galera, quero marcar um horário no sábado de manhã, como faço?' }
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
        text: `Fala, tudo bem? Bem-vindo à *Mamuty Barbearia*! 💈✂️\n\nEu sou o *Marcos*, o funcionário digital e assistente da Mamuty Barbearia. Você pode me mandar mensagem de texto ou *gravar um áudio*, que eu compreendo sua voz perfeitamente! Como posso te ajudar hoje?\n\n• Agendar um horário\n• Preços e serviços\n• Barbeiros disponíveis (mamuty.barber e Doglas)\n• Endereço e funcionamento`,
        time: welcomeTime,
        options: [
          { label: '💈 Ver serviços e preços', action: () => handleSendText('Quais os preços dos serviços?') },
          { label: '🕒 Tem vaga hoje?', action: () => handleSendText('Tem vaga para hoje?') },
          { label: '✂️ Agendar horário agora', action: () => handleSendText('Quero agendar um corte') }
        ]
      }
    ]);
  }, []);

  const addBotMessage = (
    text: string, 
    options?: { label: string; action: () => void }[], 
    isAudio = false, 
    durationSecs = 7
  ) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'bot',
      text,
      options,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAudio,
      audioDurationSeconds: durationSecs,
      audioDuration: `0:0${durationSecs}`,
      transcription: isAudio ? text : undefined
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

  // Audio Playback Simulation
  const handleTogglePlayAudio = (msgId: string, durationSecs: number = 8) => {
    if (activePlaybackId === msgId) {
      // Pause
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      setActivePlaybackId(null);
      return;
    }

    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setActivePlaybackId(msgId);
    
    // Speech synthesis audio feedback if available
    const msg = messages.find(m => m.id === msgId);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && msg) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg.transcription || msg.text);
      utterance.lang = 'pt-BR';
      utterance.rate = playbackSpeed;
      utterance.onend = () => {
        setActivePlaybackId(null);
        setPlaybackProgress(prev => ({ ...prev, [msgId]: 100 }));
      };
      window.speechSynthesis.speak(utterance);
    }

    let progress = playbackProgress[msgId] || 0;
    if (progress >= 100) progress = 0;

    const intervalMs = 100 / (durationSecs * 10 * playbackSpeed);
    playbackTimerRef.current = setInterval(() => {
      progress += 1;
      if (progress >= 100) {
        progress = 100;
        clearInterval(playbackTimerRef.current!);
        setActivePlaybackId(null);
      }
      setPlaybackProgress(prev => ({ ...prev, [msgId]: progress }));
    }, 100 / playbackSpeed);
  };

  // Send Simulated or Transcribed Audio Message
  const handleSendAudioMessage = (spokenText: string, durationSeconds: number) => {
    const userMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDuration = `0:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'user',
      text: spokenText,
      time: userMsgTime,
      isAudio: true,
      audioDuration: formattedDuration,
      audioDurationSeconds: durationSeconds,
      transcription: spokenText
    }]);

    setIsTyping(true);

    // Call API with transcribed text
    setTimeout(async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.transcription || m.text
              })),
              { role: 'user', content: spokenText }
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

          // Bot replies with an audio voice note if it was an audio input!
          addBotMessage(data.reply, dynamicOptions, true, 8);
        } else {
          addBotMessage('Áudio recebido e processado! 🎧 Como prefere prosseguir com seu agendamento?', undefined, true, 5);
        }
      } catch (err) {
        setIsTyping(false);
        addBotMessage('Recebi seu áudio! Temos vagas hoje às 15:30 e 17:00 com o Carlos. Qual horário prefere?');
      }
    }, 1200);
  };

  // Real Speech Recognition or Simulated Recording
  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }

      const finalDuration = Math.max(recordingSeconds, 3);
      const text = recordedTranscriptRef.current.trim() || 'Opa, tudo bem? Queria saber os horários disponíveis com o Carlos hoje à tarde!';
      
      handleSendAudioMessage(text, finalDuration);
      setRecordingSeconds(0);
      recordedTranscriptRef.current = '';
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingSeconds(0);
      recordedTranscriptRef.current = '';

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);

      // Try browser SpeechRecognition if available
      if (typeof window !== 'undefined') {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            const rec = new SpeechRec();
            rec.lang = 'pt-BR';
            rec.continuous = true;
            rec.interimResults = true;
            rec.onresult = (event: any) => {
              let currentTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
              }
              if (currentTranscript) {
                recordedTranscriptRef.current = currentTranscript;
              }
            };
            rec.start();
            recognitionRef.current = rec;
          } catch (e) {
            console.log('Speech recognition not started, fallback to simulated transcription', e);
          }
        }
      }
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
            <div className="w-10 h-10 rounded-full bg-black overflow-hidden shrink-0 border border-white/30">
               <img src="/logo.png" alt="Mamuty Barbearia" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm leading-tight">Marcos</h1>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              </div>
              <p className="text-[10px] text-white/90">Assistente da Mamuty Barbearia &bull; Online</p>
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
              <div className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3 text-xs sm:text-sm shadow-sm relative ${
                msg.sender === 'user' 
                  ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none'
              }`}>
                {msg.isAudio ? (
                  <div className="w-60 sm:w-72">
                    {/* Audio Player Header */}
                    <div className="flex items-center gap-2.5">
                      {/* Play / Pause Toggle Button */}
                      <button
                        onClick={() => handleTogglePlayAudio(msg.id, msg.audioDurationSeconds || 7)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 active:scale-90 shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                            : 'bg-[#008069] text-white hover:bg-[#00705c]'
                        }`}
                        title={activePlaybackId === msg.id ? 'Pausar' : 'Ouvir áudio'}
                      >
                        {activePlaybackId === msg.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      {/* Sound Waveform Visualization */}
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-0.5 h-7">
                          {[
                            35, 60, 25, 80, 50, 90, 65, 40, 85, 55, 75, 30, 95, 60, 40, 85, 100, 70, 45, 80, 35, 65, 30, 75, 50, 25
                          ].map((h, barIdx, arr) => {
                            const barPct = (barIdx / arr.length) * 100;
                            const isFilled = (playbackProgress[msg.id] || 0) >= barPct;
                            return (
                              <span
                                key={barIdx}
                                style={{ height: `${h}%` }}
                                className={`w-1 rounded-full transition-colors duration-150 ${
                                  isFilled
                                    ? msg.sender === 'user' ? 'bg-emerald-800' : 'bg-[#008069]'
                                    : 'bg-slate-300'
                                }`}
                              />
                            );
                          })}
                        </div>

                        {/* Audio Timer & Speed Selector */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>
                            {activePlaybackId === msg.id
                              ? `0:0${Math.floor(((playbackProgress[msg.id] || 0) / 100) * (msg.audioDurationSeconds || 7))}`
                              : msg.audioDuration || '0:07'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaybackSpeed(s => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));
                            }}
                            className="bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[9px] transition"
                            title="Velocidade de reprodução"
                          >
                            {playbackSpeed}x
                          </button>
                        </div>
                      </div>

                      {/* Contact / Audio Avatar */}
                      <div className="w-8 h-8 rounded-full bg-slate-200/70 flex items-center justify-center shrink-0">
                        <Mic className={`w-4 h-4 ${activePlaybackId === msg.id ? 'text-emerald-600 animate-pulse' : 'text-slate-500'}`} />
                      </div>
                    </div>

                    {/* Transcription Box */}
                    {msg.transcription && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/70 text-[11px] text-slate-600 leading-relaxed">
                        <span className="font-semibold text-emerald-800 text-[10px] uppercase tracking-wide block mb-0.5">
                          🎙️ Transcrição por IA:
                        </span>
                        &ldquo;{msg.transcription}&rdquo;
                      </div>
                    )}
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

        {/* Audio Presets Shortcut Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1">
            <Mic className="w-3 h-3 text-emerald-600" /> Simular Áudio:
          </span>
          {audioPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSendAudioMessage(preset.text, 6)}
              className="text-[11px] whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-medium transition active:scale-95 shrink-0"
              title="Clique para enviar este áudio gravado"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Live Audio Recording Banner */}
        {isRecording && (
          <div className="bg-rose-50 border-t border-rose-200 p-2.5 flex items-center justify-between px-4 text-xs animate-pulse text-rose-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span className="font-bold">Gravando sua voz... 0:0{recordingSeconds}</span>
            </div>
            <button
              onClick={handleToggleRecording}
              className="text-rose-600 font-extrabold hover:underline active:scale-95"
            >
              Clique para Enviar Áudio ➔
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
              title="Enviar mensagem"
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
              title={isRecording ? 'Parar e enviar áudio' : 'Gravar áudio com sua voz'}
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
