'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { Barber, Service } from '@/lib/types';
import {
  Scissors,
  User,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle
} from 'lucide-react';

export const BookingWizard: React.FC = () => {
  const {
    services,
    barbers,
    appointments,
    createAppointment,
    setActiveTab,
  } = useApp();

  // Wizard Steps: 1 = Services, 2 = Barber, 3 = Date, 4 = Time, 5 = Client Details, 6 = Success
  const [step, setStep] = useState<number>(1);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Customer state
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Next 7 dates generator
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

  // Time slots generator (08:00 to 19:00, 30 min intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 18; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  // Calculate occupied slots
  const occupiedSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return new Set<string>();
    
    const taken = new Set<string>();
    
    // For each appointment on the selected date
    appointments.forEach((apt) => {
      if (apt.date === selectedDate && apt.status !== 'cancelado') {
        // If "Any" professional is selected, we need to check if ALL professionals are busy. 
        // For simplicity in MVP, if a specific barber is selected, check only them.
        const matchesBarber = selectedBarber?.id === 'any' || apt.barberId === selectedBarber?.id;
        
        if (matchesBarber) {
          // Block the appointment's start time, and subsequent slots based on duration
          const aptStartMinutes = parseInt(apt.time.split(':')[0]) * 60 + parseInt(apt.time.split(':')[1]);
          const aptEndMinutes = aptStartMinutes + apt.totalDurationMinutes;
          
          timeSlots.forEach(slot => {
            const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
            // If this slot falls inside the appointment time
            if (slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes) {
              taken.add(slot);
            }
            // Also, we must block slots if OUR selected service would overlap with an existing appointment
            const myEndMinutes = slotMinutes + selectedService.durationMinutes;
            if (slotMinutes < aptEndMinutes && myEndMinutes > aptStartMinutes) {
              taken.add(slot);
            }
          });
        }
      }
    });

    // If 'any' barber is selected, a slot is only taken if ALL barbers are taken.
    // For Sprint 1, let's just do a simple block if any barber is busy to avoid overbooking, or just let it be optimistic.
    // Actually, if 'any', we should find at least one free barber.
    if (selectedBarber?.id === 'any') {
      const realBarbers = barbers.filter(b => b.id !== 'any');
      timeSlots.forEach(slot => {
        const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
        const myEndMinutes = slotMinutes + selectedService.durationMinutes;
        
        let allBusy = true;
        for (const rb of realBarbers) {
          let barberIsBusy = false;
          for (const apt of appointments) {
            if (apt.date === selectedDate && apt.barberId === rb.id && apt.status !== 'cancelado') {
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
        } else {
          taken.delete(slot);
        }
      });
    }

    return taken;
  }, [appointments, selectedDate, selectedBarber, timeSlots, selectedService, barbers]);

  const handleNextStep = () => setStep((s) => s + 1);
  const handlePrevStep = () => setStep((s) => s - 1);

  const handleConfirmBooking = () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      alert('Por favor, preencha todos os dados.');
      return;
    }

    // If 'any' barber, pick the first available
    let finalBarber = selectedBarber;
    if (selectedBarber.id === 'any') {
       const realBarbers = barbers.filter(b => b.id !== 'any');
       const slotMinutes = parseInt(selectedTime.split(':')[0]) * 60 + parseInt(selectedTime.split(':')[1]);
       const myEndMinutes = slotMinutes + selectedService.durationMinutes;
       
       for (const rb of realBarbers) {
          let barberIsBusy = false;
          for (const apt of appointments) {
            if (apt.date === selectedDate && apt.barberId === rb.id && apt.status !== 'cancelado') {
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

    createAppointment({
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
      paymentMethod: 'no_local',
      paymentStatus: 'pendente',
      status: 'confirmado',
      whatsappNotificationSent: false
    });

    setStep(6);
  };

  const stepsList = [
    { id: 1, label: 'Serviço', icon: Scissors },
    { id: 2, label: 'Profissional', icon: User },
    { id: 3, label: 'Data', icon: CalendarIcon },
    { id: 4, label: 'Horário', icon: Clock },
    { id: 5, label: 'Dados', icon: CheckCircle2 }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Home State (Step 0 essentially, but we integrate it in Step 1 or a top banner) */}
      <div className="mb-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-100">Agende seu Horário</h1>
        <p className="text-slate-400 text-sm max-w-md">Bem-vindo à Mamuty. Escolha o serviço desejado e reserve seu horário em poucos passos.</p>
      </div>

      {step < 6 && (
        <div className="flex items-center justify-between overflow-x-auto scrollbar-none pb-2 gap-2 mb-6">
          {stepsList.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isPast = step > s.id;
            return (
              <div key={s.id} className="flex flex-col items-center min-w-[60px] gap-1.5 opacity-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isActive ? 'bg-amber-500 border-amber-500 text-slate-950' :
                  isPast ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                  'bg-slate-900 border-slate-800 text-slate-500'
                }`}>
                  {isPast ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Step 1: Servico */}
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
            <button
              onClick={handleNextStep}
              disabled={!selectedService}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-950 font-bold flex items-center gap-2 transition"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Profissional */}
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
                  <Image src={barber.avatarUrl} alt={barber.name} fill className="object-cover" referrerPolicy="no-referrer" />
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

      {/* Step 3: Data */}
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

      {/* Step 4: Horário */}
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

      {/* Step 5: Dados do Cliente */}
      {step === 5 && (
        <div className="space-y-4 animate-in fade-in">
           <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-500" />
            Seus Dados
          </h2>

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
            <button onClick={handleConfirmBooking} disabled={!customerName || !customerPhone} className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2">
              Confirmar Agendamento <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Sucesso */}
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

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400/90 leading-relaxed">
              Em breve, a Mamuty poderá enviar a confirmação e os lembretes diretamente pelo WhatsApp. (Demonstração: Nenhum WhatsApp real foi enviado).
            </p>
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
