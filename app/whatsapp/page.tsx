'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ChevronLeft, Send, CheckCheck, Loader2, Scissors } from 'lucide-react';
import { Barber, Service } from '@/lib/types';

type Message = {
  id: string;
  sender: 'user' | 'bot';
  text: string | React.ReactNode;
  options?: { label: string; action: () => void }[];
  time: string;
};

export default function WhatsAppDemo() {
  const { services, barbers, appointments, createAppointment, salonConfig, isLoading, error } = useApp();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Flow State
  const [flowState, setFlowState] = useState<'idle' | 'booking_service' | 'booking_barber' | 'booking_date' | 'booking_time' | 'booking_name' | 'booking_phone' | 'booking_confirm' | 'cancelling'>('idle');
  
  // Booking Data
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addBotMessage = (text: string | React.ReactNode, options?: { label: string; action: () => void }[]) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text,
        options,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1000);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  // Dates and Time slots
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dayNum = d.getDate();
      const isSunday = d.getDay() === 0;
      if (!isSunday) dates.push({ iso, label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : `${dayName}, ${dayNum}` });
    }
    return dates;
  }, []);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 18; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const getAvailableTimes = (date: string, barber: Barber, service: Service) => {
    const taken = new Set<string>();
    timeSlots.forEach(slot => {
      const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
      const myEndMinutes = slotMinutes + service.durationMinutes;
      
      const lunchStart = 12 * 60;
      const lunchEnd = 13 * 60;
      if (slotMinutes < lunchEnd && myEndMinutes > lunchStart) {
        taken.add(slot);
        return;
      }
      
      if (barber.id === 'any') {
        const realBarbers = barbers.filter(b => b.id !== 'any');
        let allBusy = true;
        for (const rb of realBarbers) {
          let barberIsBusy = false;
          for (const apt of appointments) {
            if (apt.date === date && apt.barberId === rb.id && apt.status !== 'cancelled') {
              const aptStartMinutes = parseInt(apt.time.split(':')[0]) * 60 + parseInt(apt.time.split(':')[1]);
              const aptEndMinutes = aptStartMinutes + apt.totalDurationMinutes;
              if (slotMinutes < aptEndMinutes && myEndMinutes > aptStartMinutes) {
                barberIsBusy = true;
                break;
              }
            }
          }
          if (!barberIsBusy) {
            allBusy = false;
            break;
          }
        }
        if (allBusy) taken.add(slot);
      } else {
        for (const apt of appointments) {
          if (apt.date === date && apt.barberId === barber.id && apt.status !== 'cancelled') {
            const aptStartMinutes = parseInt(apt.time.split(':')[0]) * 60 + parseInt(apt.time.split(':')[1]);
            const aptEndMinutes = aptStartMinutes + apt.totalDurationMinutes;
            if (slotMinutes < aptEndMinutes && myEndMinutes > aptStartMinutes) {
              taken.add(slot);
              break;
            }
          }
        }
      }
    });
    return timeSlots.filter(s => !taken.has(s));
  };

  // Initialization
  useEffect(() => {
    if (messages.length === 0 && !isLoading && !error) {
      addBotMessage(
        <>
          Olá! 👋<br/>
          Sim, estamos funcionando hoje.<br/><br/>
          Nosso horário de atendimento é das 08:00 às 19:00.<br/>
          Posso verificar os horários disponíveis para você.
        </>,
        [
          { label: '✂️ Agendar horário', action: () => startBookingFlow() },
          { label: '💈 Ver serviços', action: () => showServices() },
          { label: '📍 Como chegar', action: () => showLocation() }
        ]
      );
    }
  }, [isLoading, error]);

  const startBookingFlow = () => {
    addUserMessage('Agendar horário');
    setFlowState('booking_service');
    addBotMessage('Qual serviço você deseja agendar?', 
      services.map(s => ({
        label: `${s.name} — R$ ${s.price} — ${s.durationMinutes} min`,
        action: () => handleSelectService(s)
      }))
    );
  };

  const handleSelectService = (s: Service) => {
    addUserMessage(s.name);
    setSelectedService(s);
    setFlowState('booking_barber');
    addBotMessage('Perfeito! 👌\nCom quem você gostaria de fazer?',
      barbers.map(b => ({
        label: b.id === 'any' ? 'Qualquer profissional' : b.name,
        action: () => handleSelectBarber(b, s)
      }))
    );
  };

  const handleSelectBarber = (b: Barber, s: Service) => {
    addUserMessage(b.id === 'any' ? 'Qualquer profissional' : b.name);
    setSelectedBarber(b);
    setFlowState('booking_date');
    addBotMessage('Para qual dia você gostaria?',
      availableDates.map(d => ({
        label: d.label,
        action: () => handleSelectDate(d.iso, b, s)
      }))
    );
  };

  const handleSelectDate = (date: string, b: Barber, s: Service) => {
    addUserMessage(date.split('-').reverse().join('/'));
    setSelectedDate(date);
    setFlowState('booking_time');
    
    const times = getAvailableTimes(date, b, s);
    if (times.length === 0) {
      addBotMessage('Poxa, não temos mais horários para este dia. Escolha outra data:',
        availableDates.map(d => ({
          label: d.label,
          action: () => handleSelectDate(d.iso, b, s)
        }))
      );
    } else {
      addBotMessage('Esses são os horários disponíveis:',
        times.map(t => ({
          label: t,
          action: () => handleSelectTime(t, date, b, s)
        }))
      );
    }
  };

  const handleSelectTime = (time: string, date: string, b: Barber, s: Service) => {
    // Conflict check right before selecting
    const currentAvailable = getAvailableTimes(date, b, s);
    if (!currentAvailable.includes(time)) {
      addUserMessage(time);
      addBotMessage('⚠️ Esse horário acabou de ser reservado.\nVou verificar outros horários disponíveis para você:',
        currentAvailable.map(t => ({
          label: t,
          action: () => handleSelectTime(t, date, b, s)
        }))
      );
      return;
    }

    addUserMessage(time);
    setSelectedTime(time);
    setFlowState('booking_name');
    addBotMessage('Perfeito! 👍\nVou reservar esse horário para você.\n\nPara confirmar seu horário, qual é o seu nome?');
  };

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const text = inputText.trim();
    addUserMessage(text);
    setInputText('');

    if (flowState === 'booking_name') {
      setCustomerName(text);
      setFlowState('booking_phone');
      addBotMessage('E qual é o seu número de WhatsApp? (Ex: 11999999999)');
    } else if (flowState === 'booking_phone') {
      // Show confirmation
      setFlowState('booking_confirm');
      addBotMessage(
        <>
          Confira seu agendamento:<br/><br/>
          ✂️ <b>Serviço:</b> {selectedService?.name}<br/>
          👤 <b>Profissional:</b> {selectedBarber?.id === 'any' ? 'Qualquer' : selectedBarber?.name}<br/>
          📅 <b>Data:</b> {selectedDate.split('-').reverse().join('/')}<br/>
          ⏰ <b>Horário:</b> {selectedTime}<br/>
          💰 <b>Valor:</b> R$ {selectedService?.price}
        </>,
        [
          { label: '✅ Confirmar agendamento', action: () => finalizeBooking(text) },
          { label: '↩️ Cancelar', action: () => {
             setFlowState('idle');
             addBotMessage('Agendamento cancelado. Como posso ajudar?');
          }}
        ]
      );
    } else {
      // General Intent Matcher
      handleIntent(text.toLowerCase());
    }
  };

  const finalizeBooking = async (phone: string) => {
    addUserMessage('Confirmar agendamento');
    setIsTyping(true);
    
    try {
      let finalBarber = selectedBarber!;
      if (finalBarber.id === 'any') {
         const realBarbers = barbers.filter(b => b.id !== 'any');
         const currentAvailable = getAvailableTimes(selectedDate, finalBarber, selectedService!);
         if (!currentAvailable.includes(selectedTime)) {
            throw new Error('conflict');
         }
         // Pick the specific barber
         for (const rb of realBarbers) {
            const rbAvail = getAvailableTimes(selectedDate, rb, selectedService!);
            if (rbAvail.includes(selectedTime)) {
              finalBarber = rb;
              break;
            }
         }
      }

      await createAppointment({
        customerName: customerName,
        customerPhone: phone,
        barberId: finalBarber.id,
        barberName: finalBarber.name,
        serviceIds: [selectedService!.id],
        serviceNames: [selectedService!.name],
        date: selectedDate,
        time: selectedTime,
        totalPrice: selectedService!.price,
        totalDurationMinutes: selectedService!.durationMinutes,
        source: 'whatsapp'
      });

      addBotMessage(
        <>
          ✅ <b>Agendamento confirmado!</b><br/><br/>
          Seu horário foi reservado com sucesso.<br/>
          <b>{selectedService?.name}</b><br/>
          {finalBarber.name}<br/>
          {selectedDate.split('-').reverse().join('/')} às {selectedTime}<br/>
          Valor: R$ {selectedService?.price}<br/><br/>
          Estamos esperando você! 💈
        </>
      );
      setFlowState('idle');
    } catch (err: any) {
      if (err.message === 'conflict' || err.message.includes('reservado')) {
        addBotMessage('⚠️ Esse horário acabou de ser reservado.\nVou verificar outros horários disponíveis para você:',
          getAvailableTimes(selectedDate, selectedBarber!, selectedService!).map(t => ({
            label: t,
            action: () => handleSelectTime(t, selectedDate, selectedBarber!, selectedService!)
          }))
        );
      } else {
        addBotMessage('Ocorreu um erro ao salvar o agendamento. Tente novamente.');
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleIntent = (text: string) => {
    if (text.includes('vaga') || text.includes('horário') || text.includes('aberto')) {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 8 && hour < 19 && now.getDay() !== 0) {
        addBotMessage('Sim! Estamos funcionando agora. 💈\nQuer verificar horários?', [
          { label: 'Agendar horário', action: () => startBookingFlow() }
        ]);
      } else {
        addBotMessage('No momento estamos fechados.\nNosso próximo horário de atendimento é amanhã às 08:00.', [
          { label: 'Agendar para amanhã', action: () => startBookingFlow() }
        ]);
      }
    } else if (text.includes('corte') || text.includes('serviço') || text.includes('preço') || text.includes('custa')) {
      showServices();
    } else if (text.includes('onde') || text.includes('local') || text.includes('endereço')) {
      showLocation();
    } else if (text.includes('cancelar')) {
      setFlowState('cancelling');
      addBotMessage('Qual é o seu número de WhatsApp para eu localizar os agendamentos?');
    } else {
      addBotMessage('Não entendi muito bem. Você gostaria de:', [
        { label: 'Agendar horário', action: () => startBookingFlow() },
        { label: 'Ver serviços', action: () => showServices() }
      ]);
    }
  };

  const showServices = () => {
    addBotMessage(
      <>
        Aqui estão nossos serviços:<br/>
        {services.map(s => `\n✂️ ${s.name} - R$ ${s.price} (${s.durationMinutes}m)`)}
        <br/><br/>Quer agendar?
      </>,
      [{ label: 'Agendar horário', action: () => startBookingFlow() }]
    );
  };

  const showLocation = () => {
    addBotMessage(
      <>
        📍 Estamos na:<br/>
        <b>{salonConfig.address}</b><br/><br/>
        Posso ajudar você a encontrar um horário?
      </>,
      [{ label: 'Agendar horário', action: () => startBookingFlow() }]
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#ece5dd] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl text-center max-w-sm shadow-xl">
          <p className="text-red-500 font-bold mb-2">Erro de conexão</p>
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#ece5dd] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a12] md:bg-slate-900 flex flex-col md:py-8 items-center">
      
      {/* Phone Mockup Container */}
      <div className="w-full h-screen md:h-[800px] max-h-screen md:max-w-md bg-[#efeae2] md:rounded-[2.5rem] md:shadow-2xl overflow-hidden flex flex-col relative md:border-[8px] border-slate-800">
        
        {/* Header */}
        <div className="bg-[#008069] text-white p-3 flex items-center gap-3 z-10 shadow-md">
          <Link href="/" className="p-1 -ml-1">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
             <div className="w-full h-full bg-amber-500 flex items-center justify-center">
               <Scissors className="w-5 h-5 text-slate-900" />
             </div>
          </div>
          <div className="flex-1">
            <h1 className="font-semibold leading-tight">Mamuty Barbearia</h1>
            <p className="text-[11px] text-white/80">Demonstração de atendimento automático</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-95">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-2 text-sm shadow-sm relative ${
                msg.sender === 'user' 
                  ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none'
              }`}>
                <div className="pr-12 pb-1 whitespace-pre-wrap">{msg.text}</div>
                
                {msg.options && (
                  <div className="mt-2 space-y-1.5 flex flex-col border-t border-slate-200 pt-2">
                    {msg.options.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={opt.action}
                        className="text-left bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-md text-[#008069] font-medium text-xs transition active:bg-slate-300"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="absolute bottom-1 right-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                  {msg.time}
                  {msg.sender === 'user' && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start">
              <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[#f0f2f5] p-2 flex items-end gap-2">
          <div className="flex-1 bg-white rounded-2xl px-4 py-2 min-h-[44px] flex items-center shadow-sm">
            <form onSubmit={handleInputSubmit} className="w-full">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Mensagem"
                className="w-full bg-transparent outline-none text-slate-800 text-sm"
              />
            </form>
          </div>
          <button 
            onClick={handleInputSubmit}
            disabled={!inputText.trim()}
            className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 text-white shadow-sm transition active:scale-95"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
