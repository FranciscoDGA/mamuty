'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { Barber, Service, PaymentMethod, Customer } from '@/lib/types';
import { consultarDisponibilidade, getHorarioFuncionamentoDia } from '@/lib/availability';
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
  MessageCircle,
  CreditCard,
  Banknote,
  QrCode,
  Sparkles
} from 'lucide-react';

export const BookingWizard: React.FC = () => {
  const {
    services,
    barbers,
    appointments,
    createAppointment,
    buscarClientePorWhatsapp,
    isLoading,
    currentCustomer,
    preselectedBarberId,
  } = useApp();

  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(() => currentCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(() => currentCustomer?.phone || '');
  const [customerEmail, setCustomerEmail] = useState<string>(() => currentCustomer?.email || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [recognizedCustomer, setRecognizedCustomer] = useState<Customer | null>(currentCustomer);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [scannedBarberParam, setScannedBarberParam] = useState<string | null>(null);

  // Pre-fill customer credentials if logged in or selected
  useEffect(() => {
    if (currentCustomer) {
      if (!customerName) setCustomerName(currentCustomer.name);
      if (!customerPhone) setCustomerPhone(currentCustomer.phone);
      if (!customerEmail && currentCustomer.email) setCustomerEmail(currentCustomer.email);
      setRecognizedCustomer(currentCustomer);
    }
  }, [currentCustomer]);

  // Pre-select barber from Gallery or outside click
  useEffect(() => {
    if (preselectedBarberId && barbers.length > 0) {
      const match = barbers.find(b => b.id === preselectedBarberId);
      if (match) {
        setSelectedBarber(match);
      }
    }
  }, [preselectedBarberId, barbers]);

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
      const dayName = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });
      const isSunday = d.getDay() === 0;
      dates.push({ iso, dayName, dayNum, monthName, isSunday });
    }
    return dates;
  }, []);

  // Single Source of Truth: Central Availability Engine
  const availabilityResult = useMemo(() => {
    return consultarDisponibilidade(
      {
        data: selectedDate,
        barberId: selectedBarber?.id,
        serviceDurationMinutes: selectedService?.durationMinutes || 40,
      },
      appointments,
      barbers
    );
  }, [selectedDate, selectedBarber, selectedService, appointments, barbers]);

  const handlePhoneChange = async (val: string) => {
    setCustomerPhone(val);
    const clean = val.replace(/\D/g, '');
    if (clean.length >= 8) {
      const found = await buscarClientePorWhatsapp(clean);
      if (found) {
        setCustomerName(found.name);
        if (found.email) setCustomerEmail(found.email);
        setRecognizedCustomer(found);
      } else {
        setRecognizedCustomer(null);
      }
    }
  };

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
    if (targetStep >= 2 && !selectedService && services.length > 0) {
      setSelectedService(services[0]);
    }
    if (targetStep >= 3 && !selectedBarber && barbers.length > 0) {
      setSelectedBarber(barbers[0]);
    }
    if (targetStep >= 4 && !selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0].iso);
    }
    if (targetStep >= 5 && !selectedTime && availabilityResult.slots.length > 0) {
      const firstFree = availabilityResult.slots.find(s => s.disponivel);
      setSelectedTime(firstFree?.horario || '10:00');
    }
    setStep(targetStep);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      setSubmitError('Por favor, preencha todos os dados obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      let finalBarber = selectedBarber;
      if (selectedBarber.id === 'any') {
        const slotObj = availabilityResult.slots.find(s => s.horario === selectedTime);
        if (slotObj && slotObj.barbeirosDisponiveis.length > 0) {
          const match = barbers.find(b => b.id === slotObj.barbeirosDisponiveis[0].id);
          if (match) finalBarber = match;
        }
      }

      await createAppointment({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        barberId: finalBarber.id,
        barberName: finalBarber.name,
        serviceIds: [selectedService.id],
        serviceNames: [selectedService.name],
        date: selectedDate,
        time: selectedTime,
        totalPrice: selectedService.price,
        totalDurationMinutes: selectedService.durationMinutes,
        paymentMethod,
        source: 'site'
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
        <p className="text-slate-400">Carregando dados da Barbearia Mamuty...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero Header Oficial */}
      <div className="mb-6 flex flex-col items-center justify-center text-center space-y-3 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-500/60 bg-black shadow-lg shadow-amber-500/20">
          <img src="/logo.png" alt="Mamuty Barbearia" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">Mamuty Barbearia</h1>
          <p className="text-sm sm:text-base text-amber-400 font-extrabold mt-1">
            Agende seu horário sem precisar esperar na barbearia.
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            ~Mamuty barbearia estilo forte. &bull; Cumaru do Norte - PA
          </p>
        </div>

        {/* Chips Informativos */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-slate-300">
          <span className="bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
            📍 Cumaru do Norte - PA
          </span>
          <span className="bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60 text-emerald-400 font-semibold">
            💈 Atendimento Adulto & Kids
          </span>
          <span className="bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60 text-amber-300">
            ⏰ Somente com hora marcada
          </span>
        </div>

        <div className="pt-2 flex items-center gap-2 flex-wrap justify-center">
          <Link
            href="/whatsapp"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Simulador WhatsApp (Marcos IA)</span>
          </Link>
          <a
            href="https://wa.me/5594984439065"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition border border-slate-700 active:scale-95"
          >
            <span>(94) 98443-9065</span>
          </a>
        </div>
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
                Agendando com <strong className="text-amber-400">{selectedBarber.name}</strong>.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold">
            Direto do Espelho
          </span>
        </div>
      )}

      {/* Navegador de Etapas Superior */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 overflow-x-auto gap-1">
        {stepsList.map((s) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isPassed = step > s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleStepClick(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                  : isPassed
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : isPassed ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>{s.label}</span>
              {isPassed && <Check className="w-3 h-3 text-emerald-400" />}
            </button>
          );
        })}
      </div>

      {/* ETAPA 1: SERVIÇO */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-500" />
            Serviço
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((srv) => (
              <div
                key={srv.id}
                onClick={() => setSelectedService(srv)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedService?.id === srv.id
                    ? 'bg-amber-500/10 border-amber-500 shadow-md scale-101'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-white text-base">{srv.name}</h3>
                    <span className="text-emerald-400 font-extrabold text-sm whitespace-nowrap">R$ {srv.price}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{srv.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2">
                  <span className="flex items-center gap-1 font-medium text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    {srv.durationMinutes} min
                  </span>
                  {srv.popular && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Mais pedido
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleNextStep}
              disabled={!selectedService}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2 transition active:scale-95"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 2: PROFISSIONAL */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            Quem você prefere?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                onClick={() => setSelectedBarber(barber)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center gap-4 ${
                  selectedBarber?.id === barber.id
                    ? 'bg-amber-500/10 border-amber-500 shadow-md scale-101'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border border-amber-500/30 bg-slate-950 relative shrink-0">
                  <img src={barber.avatarUrl || '/logo.png'} alt={barber.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base">{barber.name}</h3>
                  <p className="text-xs text-slate-400">{barber.role}</p>
                  {barber.id !== 'any' && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                      <span>★ 5.0</span>
                      <span className="text-slate-500 font-normal">({barber.reviewsCount || 120}+ cortes)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 flex justify-between">
            <button onClick={handlePrevStep} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button onClick={handleNextStep} disabled={!selectedBarber} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 3: DATA */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-500" />
              Qual dia?
            </h2>
            <span className="text-xs text-slate-400">
              {availabilityResult.funcionamento.diaSemana}: até {availabilityResult.funcionamento.fechamento}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {availableDates.map((date) => (
              <button
                key={date.iso}
                onClick={() => setSelectedDate(date.iso)}
                className={`p-4 flex flex-col items-center justify-center rounded-2xl border transition ${
                  selectedDate === date.iso
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider mb-1">{date.dayName}</span>
                <span className="text-2xl font-extrabold">{date.dayNum}</span>
                <span className="text-[10px] text-slate-400">{date.monthName}</span>
                {date.isSunday && <span className="text-[9px] text-amber-400/90 mt-1 font-bold">Abre até 12h</span>}
              </button>
            ))}
          </div>

          <div className="pt-4 flex justify-between">
            <button onClick={handlePrevStep} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button onClick={handleNextStep} disabled={!selectedDate} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 4: HORÁRIO */}
      {step === 4 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Qual horário?
            </h2>
            <p className="text-xs text-slate-400">
              {availabilityResult.funcionamento.temIntervalo ? 'Intervalo de almoço: 12h às 14h' : 'Sem intervalo'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {availabilityResult.slots.map(slotObj => {
              const isFree = slotObj.disponivel;
              const isChosen = selectedTime === slotObj.horario;

              return (
                <button
                  key={slotObj.horario}
                  disabled={!isFree}
                  onClick={() => setSelectedTime(slotObj.horario)}
                  className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between gap-2 ${
                    !isFree
                      ? 'opacity-40 bg-slate-950/80 border-slate-800 text-slate-500 cursor-not-allowed line-through'
                      : isChosen
                      ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md font-black scale-102'
                      : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:border-slate-600 active:scale-95'
                  }`}
                  title={slotObj.motivo || 'Disponível'}
                >
                  <span className="text-sm font-extrabold">{slotObj.horario}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                    !isFree
                      ? 'bg-rose-950/50 text-rose-400 border border-rose-900/60'
                      : isChosen
                      ? 'bg-black/20 text-slate-950 font-black'
                      : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                  }`}>
                    {isFree ? 'Disponível' : '❌ Ocupado'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between">
            <button onClick={handlePrevStep} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button onClick={handleNextStep} disabled={!selectedTime} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 5: SEUS DADOS & FORMA DE PAGAMENTO */}
      {step === 5 && (
        <div className="space-y-4 animate-in fade-in">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-500" />
            Dados do Cliente & Pagamento
          </h2>

          {submitError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900 text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {recognizedCustomer && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold">Encontramos seu cadastro! 👋</p>
                <p className="text-slate-300">
                  Olá de volta, <strong>{recognizedCustomer.name}</strong>. Seus dados foram pré-preenchidos.
                </p>
              </div>
            </div>
          )}

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">WhatsApp / Celular *</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="Ex: 94984439065"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Ao digitar o WhatsApp, o sistema identifica se você já é cliente da Mamuty.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">Nome Completo *</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">E-mail (opcional)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="Ex: joao@email.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* SELEÇÃO DA FORMA DE PAGAMENTO */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 mb-2 block">
                Como pretende pagar?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'pix', label: 'PIX', icon: QrCode, desc: 'Chave instantânea' },
                  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, desc: 'No balcão' },
                  { id: 'debito', label: 'Débito', icon: CreditCard, desc: 'Cartão de débito' },
                  { id: 'credito', label: 'Crédito', icon: CreditCard, desc: 'Cartão de crédito' }
                ].map(opt => {
                  const Icon = opt.icon;
                  const isSel = paymentMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentMethod(opt.id as PaymentMethod)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                        isSel
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="w-4 h-4 text-amber-400" />
                        {isSel && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{opt.label}</p>
                        <p className="text-[10px] text-slate-400">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                * Pagamento registrado para sua preferência. Acerto presencial no momento do atendimento.
              </p>
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
             <h3 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-2">Confira seu agendamento</h3>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Serviço</span> <span className="font-bold text-amber-400">{selectedService?.name}</span></p>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Profissional</span> <span className="font-bold text-white">{selectedBarber?.name}</span></p>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Data</span> <span className="font-bold text-white">{selectedDate?.split('-').reverse().join('/')}</span></p>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Horário</span> <span className="font-bold text-white">{selectedTime}</span></p>
             <p className="text-sm flex justify-between"><span className="text-slate-400">Forma de Pagamento</span> <span className="font-bold text-amber-300 uppercase">{paymentMethod}</span></p>
             <p className="text-sm flex justify-between border-t border-slate-800 pt-2"><span className="text-slate-400">Valor total</span> <span className="font-bold text-emerald-400">R$ {selectedService?.price}</span></p>
          </div>

          <div className="pt-4 flex justify-between">
            <button onClick={handlePrevStep} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button 
              onClick={handleConfirmBooking} 
              disabled={!customerName || !customerPhone || isSubmitting} 
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Agendamento'}
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 6: CONFIRMAÇÃO COM SUCESSO */}
      {step === 6 && (
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">🎉 Horário Reservado!</h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            {customerName}, seu atendimento na <strong>Barbearia Mamuty</strong> está confirmado e registrado no sistema.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-left space-y-2 max-w-sm mx-auto shadow-inner">
             <p className="text-xs sm:text-sm flex justify-between"><span className="text-slate-400">Serviço</span> <span className="font-bold text-amber-400">{selectedService?.name}</span></p>
             <p className="text-xs sm:text-sm flex justify-between"><span className="text-slate-400">Profissional</span> <span className="font-bold text-white">{selectedBarber?.name}</span></p>
             <p className="text-xs sm:text-sm flex justify-between"><span className="text-slate-400">Data</span> <span className="font-bold text-white">{selectedDate?.split('-').reverse().join('/')}</span></p>
             <p className="text-xs sm:text-sm flex justify-between"><span className="text-slate-400">Horário</span> <span className="font-bold text-white">{selectedTime}</span></p>
             <p className="text-xs sm:text-sm flex justify-between"><span className="text-slate-400">Pagamento</span> <span className="font-bold text-amber-300 uppercase">{paymentMethod}</span></p>
             <p className="text-xs sm:text-sm flex justify-between border-t border-slate-800/80 pt-2"><span className="text-slate-400">Valor</span> <span className="font-bold text-emerald-400">R$ {selectedService?.price}</span></p>
             <p className="text-[11px] text-slate-500 pt-1">📍 Cumaru do Norte - PA &bull; Av. das Nações</p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
             <a
               href={`https://wa.me/5594984439065?text=${encodeURIComponent(
                 `Fala, Hemerson! 💈✂️\n\nAcabei de agendar meu horário pelo app da *Barbearia Mamuty*:\n\n👤 *Cliente:* ${customerName}\n✂️ *Serviço:* ${selectedService?.name}\n💈 *Barbeiro:* ${selectedBarber?.name}\n📅 *Data:* ${selectedDate?.split('-').reverse().join('/')} às ${selectedTime}\n💰 *Valor:* R$ ${selectedService?.price}\n💳 *Pagamento:* ${paymentMethod.toUpperCase()}\n\n*~Mamuty barbearia estilo forte.*`
               )}`}
               target="_blank"
               rel="noopener noreferrer"
               className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
             >
               <MessageCircle className="w-4 h-4 text-slate-950" />
               <span>Avisar no WhatsApp (1-Toque)</span>
             </a>

             <button
              onClick={() => {
                setStep(1);
                setSelectedService(null);
                setSelectedBarber(null);
                setSelectedTime('');
                setCustomerName('');
                setCustomerPhone('');
                setCustomerEmail('');
                setRecognizedCustomer(null);
              }}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition active:scale-95"
             >
               Novo Agendamento
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
