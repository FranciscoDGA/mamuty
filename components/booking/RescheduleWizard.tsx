'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Barber, Service } from '@/lib/types';
import { consultarDisponibilidade } from '@/lib/availability';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
  Scissors,
  User,
} from 'lucide-react';

interface RescheduleWizardProps {
  appointmentId: string;
  currentServiceId: string;
  currentBarberId: string;
  currentDate: string;
  currentTime: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleWizard: React.FC<RescheduleWizardProps> = ({
  appointmentId,
  currentServiceId,
  currentBarberId,
  currentDate,
  currentTime,
  onClose,
  onSuccess,
}) => {
  const {
    services,
    barbers,
    appointments,
    updateAppointment,
    barberSchedules,
    blockedSlots,
    closedDays,
  } = useApp();

  const [step, setStep] = useState<'date' | 'time' | 'confirm'>('date');
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [selectedTime, setSelectedTime] = useState<string>(currentTime);
  const [selectedBarberId, setSelectedBarberId] = useState<string>(currentBarberId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [calendarPage, setCalendarPage] = useState(0);
  const DAYS_PER_PAGE = 7;

  const currentService = services.find(s => s.id === currentServiceId);
  const currentBarber = barbers.find(b => b.id === currentBarberId);

  const allCalendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });
      const isSunday = d.getDay() === 0;
      const isClosed = closedDays.some(c => c.date === iso);

      let barberAvailable = true;
      if (selectedBarberId) {
        const dayOff = barberSchedules.find(s => s.barberId === selectedBarberId)?.dayOff || [];
        barberAvailable = !dayOff.includes(d.getDay());
      }

      days.push({ iso, dayName, dayNum, monthName, isSunday, isClosed, barberAvailable });
    }
    return days;
  }, [selectedBarberId, closedDays, barberSchedules]);

  const availableDates = useMemo(() => {
    const start = calendarPage * DAYS_PER_PAGE;
    return allCalendarDays.slice(start, start + DAYS_PER_PAGE);
  }, [allCalendarDays, calendarPage]);

  const totalCalendarPages = Math.ceil(allCalendarDays.length / DAYS_PER_PAGE);

  const availabilityResult = useMemo(() => {
    return consultarDisponibilidade(
      {
        data: selectedDate,
        barberId: selectedBarberId,
        serviceDurationMinutes: currentService?.durationMinutes || 40,
      },
      appointments,
      barbers,
      barberSchedules,
      blockedSlots,
      closedDays
    );
  }, [selectedDate, selectedBarberId, currentService, appointments, barbers, barberSchedules, blockedSlots, closedDays]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Selecione uma data e horário.');
      return;
    }

    if (selectedDate === currentDate && selectedTime === currentTime) {
      setError('O novo horário é igual ao atual. Escolha um horário diferente.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateAppointment(appointmentId, {
        date: selectedDate,
        time: selectedTime,
        barberId: selectedBarberId,
        barberName: barbers.find(b => b.id === selectedBarberId)?.name || currentBarber?.name || '',
      });
      onSuccess();
    } catch (err: any) {
      const message = err.message || 'Erro ao remarcar.';
      if (message.includes('CONFLICT') || message.includes('indisponível')) {
        setError('Esse horário acabou de ficar indisponível. Escolha outro.');
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Remarcar Agendamento</h2>
            <p className="text-xs text-slate-400">Escolha nova data e horário</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Current Info */}
          <div className="bg-slate-800/50 rounded-xl p-3 space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase">Agendamento Atual</p>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1"><Scissors className="w-3 h-3 text-amber-400" /> {currentService?.name || 'Serviço'}</span>
              <span className="flex items-center gap-1"><User className="w-3 h-3 text-amber-400" /> {currentBarber?.name || 'Profissional'}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3 text-amber-400" /> {currentDate.split('-').reverse().join('/')}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" /> {currentTime}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step: Date */}
          {step === 'date' && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-white">Nova Data</p>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCalendarPage(p => Math.max(0, p - 1))}
                  disabled={calendarPage === 0}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs text-slate-500">Semana {calendarPage + 1} de {totalCalendarPages}</span>
                <button
                  onClick={() => setCalendarPage(p => Math.min(totalCalendarPages - 1, p + 1))}
                  disabled={calendarPage >= totalCalendarPages - 1}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableDates.map((date) => {
                  const isDisabled = date.isClosed || date.isSunday || (Boolean(selectedBarberId) && !date.barberAvailable);
                  return (
                    <button
                      key={date.iso}
                      onClick={() => { if (!isDisabled) { setSelectedDate(date.iso); setStep('time'); } }}
                      disabled={isDisabled}
                      className={`p-3 flex flex-col items-center rounded-xl border text-xs transition ${
                        isDisabled
                          ? 'bg-slate-950/50 border-slate-800/50 text-slate-600 cursor-not-allowed opacity-50'
                          : selectedDate === date.iso
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                          : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="font-bold uppercase tracking-wider">{date.dayName}</span>
                      <span className="text-xl font-extrabold">{date.dayNum}</span>
                      <span className="text-[10px] text-slate-400">{date.monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step: Time */}
          {step === 'time' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Novo Horário</p>
                <button onClick={() => setStep('date')} className="text-xs text-amber-400 hover:text-amber-300">
                  Trocar data
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availabilityResult.slots.map(slotObj => {
                  const isFree = slotObj.disponivel;
                  const isChosen = selectedTime === slotObj.horario;
                  const isLunch = slotObj.motivo?.includes('Almoço');
                  return (
                    <button
                      key={slotObj.horario}
                      disabled={!isFree}
                      onClick={() => { setSelectedTime(slotObj.horario); setStep('confirm'); }}
                      className={`p-3 rounded-xl border text-sm font-bold transition text-center ${
                        !isFree
                          ? isLunch
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400/60 cursor-not-allowed'
                            : 'opacity-40 bg-slate-950/80 border-slate-800 text-slate-500 cursor-not-allowed line-through'
                          : isChosen
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/60'
                      }`}
                    >
                      {slotObj.horario}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-white">Confirmar Remarcação</p>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                  <span>De: <strong>{currentDate.split('-').reverse().join('/')} {currentTime}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                  <ChevronRight className="w-4 h-4" />
                  <span>Para: <strong>{selectedDate.split('-').reverse().join('/')} {selectedTime}</strong></span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('time')}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition"
                >
                  Voltar
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Confirmar</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
