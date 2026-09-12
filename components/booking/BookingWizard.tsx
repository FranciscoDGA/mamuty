'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Barber, Service, PaymentMethod, Customer } from '@/lib/types';
import { consultarDisponibilidade } from '@/lib/availability';
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
  CreditCard,
  Banknote,
  QrCode,
  Sparkles,
  Zap,
  UserPlus,
  Phone,
} from 'lucide-react';

const CLIENT_SESSION_KEY = 'mamuty_client_session';

interface ClientSession {
  name: string;
  phone: string;
}

export const BookingWizard: React.FC = () => {
  const router = useRouter();
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

  const [step, setStep] = useState<number>(0);
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

  useEffect(() => {
    const stored = localStorage.getItem(CLIENT_SESSION_KEY);
    if (stored) {
      try {
        const parsed: ClientSession = JSON.parse(stored);
        setCustomerName(parsed.name);
        setCustomerPhone(parsed.phone);
        setStep(1);
      } catch {}
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const bParam = params.get('barbeiro') || params.get('barber') || params.get('b');
      if (bParam) setScannedBarberParam(bParam);
    }
  }, []);

  useEffect(() => {
    if (currentCustomer) {
      if (!customerName) setCustomerName(currentCustomer.name);
      if (!customerPhone) setCustomerPhone(currentCustomer.phone);
      if (!customerEmail && currentCustomer.email) setCustomerEmail(currentCustomer.email);
      setRecognizedCustomer(currentCustomer);
    }
  }, [currentCustomer]);

  useEffect(() => {
    if (preselectedBarberId && barbers.length > 0) {
      const match = barbers.find(b => b.id === preselectedBarberId);
      if (match) setSelectedBarber(match);
    }
  }, [preselectedBarberId, barbers]);

  useEffect(() => {
    if (scannedBarberParam && barbers.length > 0) {
      const match = barbers.find(
        b => b.id.toLowerCase() === scannedBarberParam.toLowerCase() ||
             b.name.toLowerCase().includes(scannedBarberParam.toLowerCase())
      );
      if (match) setSelectedBarber(match);
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

  const handleClientRegister = () => {
    if (!customerName.trim() || !customerPhone.trim()) return;
    localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify({ name: customerName.trim(), phone: customerPhone.trim() }));
    setStep(1);
  };

  const handleNextStep = () => {
    if (step === 1 && scannedBarberParam && selectedBarber) {
      setStep(3);
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
      
      const params = new URLSearchParams({
        servico: selectedService.name,
        barbeiro: finalBarber.name,
        data: selectedDate,
        horario: selectedTime,
        valor: String(selectedService.price),
        pagamento: paymentMethod,
        cliente: customerName.trim(),
      });

      router.push(`/confirmacao?${params.toString()}`);
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
    { id: 5, label: 'Dados', icon: CheckCircle2 },
    { id: 6, label: 'Pagamento', icon: CreditCard },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step Progress */}
      {step >= 1 && (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
          {stepsList.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isPassed = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => {
                    if (isPassed) setStep(s.id);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition shrink-0 ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : isPassed
                      ? 'text-emerald-400 hover:text-emerald-300 cursor-pointer'
                      : 'text-slate-600'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isActive ? 'text-amber-400' : isPassed ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className="hidden sm:inline">{s.label}</span>
                  {isPassed && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                </button>
                {idx < stepsList.length - 1 && (
                  <div className={`w-4 h-px shrink-0 ${isPassed ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Scanned Barber Banner */}
      {scannedBarberParam && selectedBarber && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            Agendando com <strong>{selectedBarber.name}</strong> (detectado automaticamente)
          </p>
        </div>
      )}

      {/* STEP 0: CADASTRO CLIENTE */}
      {step === 0 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Seja bem-vindo!</h2>
            <p className="text-sm text-slate-400 mt-1">Para agendar, precisamos dos seus dados</p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">Seu nome *</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Como podemos te chamar?"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">WhatsApp *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="(94) 99999-9999"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">Usado para confirmar seu agendamento</p>
            </div>
          </div>

          <button
            onClick={handleClientRegister}
            disabled={!customerName.trim() || !customerPhone.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:from-slate-700 disabled:to-slate-700 text-slate-950 font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            Começar <ChevronRight className="w-4 h-4" />
          </button>

          <p className="text-center text-[10px] text-slate-600">
            Seus dados são salvos apenas no seu dispositivo
          </p>
        </div>
      )}

      {/* STEP 1: SERVIÇO */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-white">Qual serviço?</h2>
            <p className="text-sm text-slate-400 mt-1">Escolha o que você precisa</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((srv) => (
              <button
                key={srv.id}
                onClick={() => { setSelectedService(srv); setStep(2); }}
                className={`p-4 rounded-2xl border transition text-left flex flex-col gap-3 ${
                  selectedService?.id === srv.id
                    ? 'bg-amber-500/10 border-amber-500 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 active:scale-[0.98]'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-white">{srv.name}</h3>
                  <span className="text-emerald-400 font-extrabold text-sm whitespace-nowrap">R$ {srv.price}</span>
                </div>
                <p className="text-xs text-slate-400">{srv.description}</p>
                <div className="flex items-center justify-between text-xs border-t border-slate-800/60 pt-2">
                  <span className="flex items-center gap-1 text-amber-400 font-medium">
                    <Clock className="w-3 h-3" /> {srv.durationMinutes} min
                  </span>
                  {srv.popular && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Mais pedido
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: PROFISSIONAL */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-white">Quem vai te atender?</h2>
            <p className="text-sm text-slate-400 mt-1">Escolha seu barbeiro ou deixe com a gente</p>
          </div>

          <button
            onClick={() => { setSelectedBarber({ id: 'any', name: 'Primeiro Disponível', role: 'Qualquer profissional livre', avatarUrl: '/logo.png', rating: 0, reviewsCount: 0, specialties: [], phone: '', bio: '', availableDays: [] } as Barber); setStep(3); }}
            className={`w-full p-4 rounded-2xl border transition text-left flex items-center gap-4 ${
              selectedBarber?.id === 'any'
                ? 'bg-emerald-500/10 border-emerald-500 shadow-md'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 active:scale-[0.98]'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Primeiro Disponível</h3>
              <p className="text-xs text-slate-400">Agendamos com quem estiver livre mais rápido</p>
            </div>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {barbers.map((barber) => (
              <button
                key={barber.id}
                onClick={() => { setSelectedBarber(barber); setStep(3); }}
                className={`p-4 rounded-2xl border transition text-left flex items-center gap-4 ${
                  selectedBarber?.id === barber.id
                    ? 'bg-amber-500/10 border-amber-500 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 active:scale-[0.98]'
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-500/30 bg-slate-950 shrink-0">
                  <img src={barber.avatarUrl || '/logo.png'} alt={barber.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{barber.name}</h3>
                  <p className="text-xs text-slate-400">{barber.role}</p>
                </div>
              </button>
            ))}
          </div>

          <button onClick={handlePrevStep} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      )}

      {/* STEP 3: DATA */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-white">Qual dia?</h2>
            <p className="text-sm text-slate-400 mt-1">
              {availabilityResult.funcionamento.diaSemana}: até {availabilityResult.funcionamento.fechamento}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {availableDates.map((date) => (
              <button
                key={date.iso}
                onClick={() => { setSelectedDate(date.iso); setStep(4); }}
                className={`p-4 flex flex-col items-center justify-center rounded-2xl border transition ${
                  selectedDate === date.iso
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600 active:scale-[0.98]'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider mb-1">{date.dayName}</span>
                <span className="text-2xl font-extrabold">{date.dayNum}</span>
                <span className="text-[10px] text-slate-400">{date.monthName}</span>
                {date.isSunday && <span className="text-[9px] text-amber-400/90 mt-1 font-bold">Até 12h</span>}
              </button>
            ))}
          </div>

          <button onClick={handlePrevStep} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      )}

      {/* STEP 4: HORÁRIO */}
      {step === 4 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-white">Qual horário?</h2>
            <p className="text-sm text-slate-400 mt-1">
              {availabilityResult.funcionamento.temIntervalo ? 'Almoço: 12h às 14h' : 'Horário contínuo'}
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {availabilityResult.slots.map(slotObj => {
              const isFree = slotObj.disponivel;
              const isChosen = selectedTime === slotObj.horario;
              return (
                <button
                  key={slotObj.horario}
                  disabled={!isFree}
                  onClick={() => { setSelectedTime(slotObj.horario); setStep(5); }}
                  className={`p-3 rounded-xl border text-sm font-bold transition text-center ${
                    !isFree
                      ? 'opacity-30 bg-slate-950/80 border-slate-800 text-slate-500 cursor-not-allowed line-through'
                      : isChosen
                      ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:border-slate-600 active:scale-95'
                  }`}
                >
                  {slotObj.horario}
                </button>
              );
            })}
          </div>

          <button onClick={handlePrevStep} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      )}

      {/* STEP 5: DADOS */}
      {step === 5 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-white">Confirme seus dados</h2>
            <p className="text-sm text-slate-400 mt-1">Está tudo certo?</p>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900 text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <span className="text-amber-400 font-bold text-sm">{customerName.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">{customerName}</p>
                <p className="text-xs text-amber-300 font-mono">{customerPhone}</p>
              </div>
              <button
                onClick={() => setStep(0)}
                className="ml-auto text-[10px] text-slate-400 hover:text-white transition"
              >
                Alterar
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">E-mail (opcional)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={handlePrevStep} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button
              onClick={() => { setSubmitError(''); setStep(6); }}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 transition active:scale-95"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: PAGAMENTO + CONFIRMAÇÃO */}
      {step === 6 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-white">Como vai pagar?</h2>
            <p className="text-sm text-slate-400 mt-1">Acerto presencial no momento do atendimento</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                  onClick={() => setPaymentMethod(opt.id as PaymentMethod)}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col gap-2 ${
                    isSel
                      ? 'bg-amber-500/20 border-amber-500 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-5 h-5 ${isSel ? 'text-amber-400' : 'text-slate-400'}`} />
                    {isSel && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{opt.label}</p>
                    <p className="text-[11px] text-slate-400">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Resumo</h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between"><span className="text-slate-400">Serviço</span> <span className="font-bold text-white">{selectedService?.name}</span></p>
              <p className="flex justify-between"><span className="text-slate-400">Profissional</span> <span className="font-bold text-white">{selectedBarber?.name}</span></p>
              <p className="flex justify-between"><span className="text-slate-400">Data</span> <span className="font-bold text-white">{selectedDate?.split('-').reverse().join('/')}</span></p>
              <p className="flex justify-between"><span className="text-slate-400">Horário</span> <span className="font-bold text-white">{selectedTime}</span></p>
              <p className="flex justify-between"><span className="text-slate-400">Pagamento</span> <span className="font-bold text-amber-300 uppercase">{paymentMethod}</span></p>
              <p className="flex justify-between border-t border-slate-800 pt-2"><span className="text-slate-400">Total</span> <span className="font-extrabold text-emerald-400 text-lg">R$ {selectedService?.price}</span></p>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={handlePrevStep} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Agendamento'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
