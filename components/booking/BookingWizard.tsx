'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { Barber, Service } from '@/lib/types';
import Link from 'next/link';
import {
  Scissors,
  User,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
  MessageCircle
} from 'lucide-react';

export const BookingWizard: React.FC = () => {
  const {
    services,
    barbers,
    appointments,
    createAppointment,
    isLoading,
    error,
  } = useApp();

  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [scannedBarberParam, setScannedBarberParam] = useState<string | null>(null);

  // Auto-detect barber from mirror QR code URL param (?barbeiro=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const bParam = params.get('barbeiro') || params.get('barber') || params.get('b');
      if (bParam) {
        setScannedBarberParam(bParam);
      }
    }
  }, []);

  // When barbers load and URL had a barber param, preselect that barber
  useEffect(() => {
    if (scannedBarberParam && barbers.length > 0) {
      const match = barbers.find(
        b => b.id.toLowerCase() === scannedBarberParam.toLowerCase() ||
             b.name.toLowerCase().includes(scannedBarberParam.toLowerCase())
      );
      if (match) {
        setSelectedBarber(match);
      }
    }
  }, [scannedBarberParam, barbers]);

  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });
      const isSunday = d.getDay() === 0;
      dates.push({ iso, dayName, dayNum, monthName, isSunday });
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

  const occupiedSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return new Set<string>();
    
    const taken = new Set<string>();
    
    timeSlots.forEach(slot => {
      const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
      const myEndMinutes = slotMinutes + selectedService.durationMinutes;
      
      // Lunch break rule: 12:00 to 13:00 is blocked. 
      // Overlap logic: if the service starts before 13:00 and ends after 12:00, it's blocked.
      const lunchStart = 12 * 60;
      const lunchEnd = 13 * 60;
      if (slotMinutes < lunchEnd && myEndMinutes > lunchStart) {
        taken.add(slot);
        return; // blocked by lunch, no need to check further
      }
      
      // If 'any' barber is selected, check if ALL barbers are busy
      if (selectedBarber?.id === 'any') {
        const realBarbers = barbers.filter(b => b.id !== 'any');
        let allBusy = true;
        
        for (const rb of realBarbers) {
          let barberIsBusy = false;
          for (const apt of appointments) {
            if (apt.date === selectedDate && apt.barberId === rb.id && apt.status !== 'cancelled') {
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
        
        if (allBusy) {
          taken.add(slot);
        }
      } else {
        // Specific barber
        for (const apt of appointments) {
          if (apt.date === selectedDate && apt.barberId === selectedBarber?.id && apt.status !== 'cancelled') {
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

    return taken;
  }, [appointments, selectedDate, selectedBarber, timeSlots, selectedService, barbers]);

  const handleNextStep = () => {
    if (step === 1 && scannedBarberParam && selectedBarber) {
      setStep(3); // Skip barber selection since it was scanned from mirror
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrevStep = () => {
    if (step === 3 && scannedBarberParam && selectedBarber) {
      setStep(1);
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === step) return;
    // Set sensible defaults if user jumps forward
    if (targetStep >= 2 && !selectedService && services.length > 0) {
      setSelectedService(services[0]);
    }
    if (targetStep >= 3 && !selectedBarber && barbers.length > 0) {
      setSelectedBarber(barbers[0]);
    }
    if (targetStep >= 4 && !selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0].iso);
    }
    if (targetStep >= 5 && !selectedTime && timeSlots.length > 0) {
      setSelectedTime(timeSlots[0] || '10:00');
    }
    setStep(targetStep);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      setSubmitError('Por favor, preencha todos os dados.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      let finalBarber = selectedBarber;
      if (selectedBarber.id === 'any') {
         const realBarbers = barbers.filter(b => b.id !== 'any');
         const slotMinutes = parseInt(selectedTime.split(':')[0]) * 60 + parseInt(selectedTime.split(':')[1]);
         const myEndMinutes = slotMinutes + selectedService.durationMinutes;
         
         for (const rb of realBarbers) {
            let barberIsBusy = false;
            for (const apt of appointments) {
              if (apt.date === selectedDate && apt.barberId === rb.id && apt.status !== 'cancelled') {
                const aptStartMinutes = parseInt(apt.time.split(':')[0]) * 60 + parseInt(apt.time.split(':')[1]);
                const aptEndMinutes = aptStartMinutes + apt.totalDurationMinutes;
                if (slotMinutes < aptEndMinutes && myEndMinutes > aptStartMinutes) {
                  barberIsBusy = true;
                  break;
                }
              }
            }
            if (!barberIsBusy) {
              finalBarber = rb;
              break;
            }
         }
      }

      await createAppointment({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        barberId: finalBarber.id,
        barberName: finalBarber.name,
        serviceIds: [selectedService.id],
        serviceNames: [selectedService.name],
        date: selectedDate,
        time: selectedTime,
        totalPrice: selectedService.price,
        totalDurationMinutes: selectedService.durationMinutes,
        source: 'web'
      });
      
      setStep(6);
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao salvar agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { id: 1, label: 'Serviço', icon: Scissors },
    { id: 2, label: 'Profissional', icon: User },
    { id: 3, label: 'Data', icon: CalendarIcon },
    { id: 4, label: 'Horário', icon: Clock },
    { id: 5, label: 'Dados', icon: CheckCircle2 }
  ];



  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-slate-400">Carregando disponibilidade...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-100">Agende seu Horário</h1>
        <p className="text-slate-400 text-sm max-w-md">
          Bem-vindo à Mamuty. Agende em poucos passos abaixo ou converse diretamente com nosso assistente no WhatsApp.
        </p>
        <Link
          href="/whatsapp"
          className="mt-1 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Falar com Assistente no WhatsApp &rarr;</span>
        </Link>
      </div>

      {scannedBarberParam && selectedBarber && (
        <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 border border-amber-500/40 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">Cadeira do Espelho Conectada!</p>
              <p className="text-xs text-white">
                Agendando com <strong className="text-amber-400">{selectedBarber.name}</strong>. Escolha o serviço e a data direto na cadeira!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setScannedBarberParam(null);
              setSelectedBarber(null);
            }}
            className="text-[11px] text-slate-400 hover:text-white underline shrink-0 px-2 py-1"
            title="Trocar de Barbeiro"
          >
            Trocar
          </button>
        </div>
      )}

      {step < 6 && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between overflow-x-auto scrollbar-none pb-2 gap-2">
            {stepsList.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isPast = step > s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleStepClick(s.id)}
                  className="flex flex-col items-center min-w-[64px] gap-1.5 cursor-pointer group transition-transform active:scale-95 focus:outline-none"
                  title={`Ir para etapa ${s.label}`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${
                    isActive ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-amber-500/20 scale-105' :
                    isPast ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 group-hover:border-emerald-400' :
                    'bg-slate-900 border-slate-800 text-slate-400 group-hover:border-slate-700 group-hover:text-white'
                  }`}>
                    {isPast ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[11px] font-bold transition-colors ${
                    isActive ? 'text-amber-400 font-extrabold' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>

          {step > 1 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedBarber(null);
                  setSelectedDate('');
                  setSelectedTime('');
                  setCustomerName('');
                  setCustomerPhone('');
                }}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition py-1 px-2 rounded-lg hover:bg-slate-900"
              >
                ✕ Cancelar e voltar ao início
              </button>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-500" />
            Qual serviço você deseja?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((srv) => (
              <button
                key={srv.id}
                onClick={() => setSelectedService(srv)}
                className={`flex flex-col text-left p-4 rounded-2xl border transition ${
                  selectedService?.id === srv.id
                    ? 'bg-amber-500/10 border-amber-500 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-100">{srv.name}</span>
                  <span className="text-amber-400 font-extrabold text-sm">R$ {srv.price}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{srv.description}</p>
                <div className="mt-auto flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-950 px-2 py-1 rounded-md w-fit">
                  <Clock className="w-3 h-3" />
                  <span>{srv.durationMinutes} min</span>
                </div>
              </button>
            ))}
          </div>
          <div className="pt-4 flex justify-end">
            <button onClick={handleNextStep} disabled={!selectedService} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in">
           <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            Escolha o profissional
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {barbers.map((barber) => (
               <button
                key={barber.id}
                onClick={() => setSelectedBarber(barber)}
                className={`flex items-center gap-4 text-left p-3 rounded-2xl border transition ${
                  selectedBarber?.id === barber.id
                    ? 'bg-amber-500/10 border-amber-500 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-700">
                  <Image src={barber.avatarUrl || 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&q=80'} alt={barber.name} fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-100 block">{barber.name}</span>
                  <span className="text-xs text-amber-400 font-medium block">{barber.role}</span>
                  {barber.id !== 'any' && <span className="text-[10px] text-slate-400">Especialidade: {barber.specialties.join(', ')}</span>}
                </div>
              </button>
            ))}
          </div>
          <div className="pt-4 flex justify-between">
            <button onClick={handlePrevStep} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button onClick={handleNextStep} disabled={!selectedBarber} className="px-6 py-3 rounded-xl bg-amber-500 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-in fade-in">
           <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-500" />
            Para qual dia?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {availableDates.map((date) => (
              <button
                key={date.iso}
                disabled={date.isSunday}
                onClick={() => setSelectedDate(date.iso)}
                className={`p-4 flex flex-col items-center justify-center rounded-2xl border transition ${
                  date.isSunday ? 'opacity-40 bg-slate-900/30 border-slate-800/50 cursor-not-allowed' :
                  selectedDate === date.iso ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider mb-1">{date.dayName}</span>
                <span className="text-2xl font-extrabold">{date.dayNum}</span>
                <span className="text-[10px] text-slate-400">{date.monthName}</span>
                {date.isSunday && <span className="text-[9px] text-rose-400 mt-1 font-bold">Fechado</span>}
              </button>
            ))}
          </div>
          <div className="pt-4 flex justify-between">
            <button onClick={handlePrevStep} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button onClick={handleNextStep} disabled={!selectedDate} className="px-6 py-3 rounded-xl bg-amber-500 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-in fade-in">
           <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Qual o melhor horário?
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {timeSlots.map(slot => {
              const isOccupied = occupiedSlots.has(slot);
              return (
                <button
                  key={slot}
                  disabled={isOccupied}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-3 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                    isOccupied ? 'opacity-30 bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed' :
                    selectedTime === slot ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md' :
                    'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
          <div className="pt-4 flex justify-between">
            <button onClick={handlePrevStep} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button onClick={handleNextStep} disabled={!selectedTime} className="px-6 py-3 rounded-xl bg-amber-500 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 animate-in fade-in">
           <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-500" />
            Seus Dados
          </h2>
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900 text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {submitError}
            </div>
          )}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">Nome Completo</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">WhatsApp</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
             <h3 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-2">Seu Agendamento</h3>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Serviço</span> <span className="font-bold text-amber-400">{selectedService?.name}</span></p>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Profissional</span> <span className="font-bold text-white">{selectedBarber?.name}</span></p>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Data</span> <span className="font-bold text-white">{selectedDate?.split('-').reverse().join('/')}</span></p>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Horário</span> <span className="font-bold text-white">{selectedTime}</span></p>
             <p className="text-sm flex justify-between border-t border-slate-800 pt-2"><span className="text-slate-400">Valor total</span> <span className="font-bold text-emerald-400">R$ {selectedService?.price}</span></p>
          </div>
          <div className="pt-4 flex justify-between">
            <button onClick={handlePrevStep} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button onClick={handleConfirmBooking} disabled={!customerName || !customerPhone || isSubmitting} className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Agendamento'}
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-5 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Agendamento Confirmado!</h1>
          <p className="text-slate-400 text-sm">Seu horário foi reservado com sucesso.</p>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-left space-y-2 max-w-sm mx-auto">
             <p className="text-sm flex justify-between"><span className="text-slate-400">Serviço</span> <span className="font-bold text-amber-400">{selectedService?.name}</span></p>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Profissional</span> <span className="font-bold text-white">{selectedBarber?.name}</span></p>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Data</span> <span className="font-bold text-white">{selectedDate?.split('-').reverse().join('/')}</span></p>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Horário</span> <span className="font-bold text-white">{selectedTime}</span></p>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Valor</span> <span className="font-bold text-emerald-400">R$ {selectedService?.price}</span></p>
          </div>

          <div className="pt-4">
             <button
              onClick={() => {
                setStep(1);
                setSelectedService(null);
                setSelectedBarber(null);
                setSelectedTime('');
                setCustomerName('');
                setCustomerPhone('');
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
             >
               Voltar para o início
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
