'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Search, 
  Phone, 
  Calendar, 
  Clock, 
  Scissors, 
  XCircle,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  User,
  CalendarClock,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RescheduleWizard } from '@/components/booking/RescheduleWizard';
import { ChangeBarberModal } from '@/components/booking/ChangeBarberModal';

interface BookingRecord {
  id: string;
  customer_name: string;
  customer_phone: string;
  barber_id: string;
  barber_name: string;
  service_ids: string[];
  service_names: string[];
  date: string;
  time: string;
  total_price: number;
  total_duration_minutes: number;
  status: string;
  payment_method: string;
}

export default function MeusAgendamentosPage() {
  const router = useRouter();
  
  // Auth states
  const [step, setStep] = useState<'phone' | 'pin' | 'appointments'>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [hash, setHash] = useState('');
  const [sessionHash, setSessionHash] = useState('');
  
  // Data states
  const [appointments, setAppointments] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [rescheduleTarget, setRescheduleTarget] = useState<BookingRecord | null>(null);
  const [changeBarberTarget, setChangeBarberTarget] = useState<BookingRecord | null>(null);

  // Computed
  const futuros = useMemo(() => {
    const now = new Date();
    return appointments.filter(a => {
      if (a.status === 'cancelled') return false;
      const aptDate = new Date(`${a.date}T${a.time}:00`);
      return aptDate >= now;
    });
  }, [appointments]);

  const passados = useMemo(() => {
    const now = new Date();
    return appointments.filter(a => {
      const aptDate = new Date(`${a.date}T${a.time}:00`);
      return aptDate < now || a.status === 'cancelled';
    });
  }, [appointments]);

  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Digite um WhatsApp válido com DDD');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/pin/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar PIN');
      
      setHash(data.hash);
      setStep('pin');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin, hash }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'PIN inválido');
      
      setSessionHash(data.sessionHash);
      await fetchBookings(data.sessionHash);
      setStep('appointments');
    } catch (err: any) {
      setError(err.message || 'Código incorreto');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = useCallback(async (activeSessionHash: string) => {
    setIsLoading(true);
    setError('');
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await fetch(`/api/bookings?phone=${cleanPhone}&sessionHash=${activeSessionHash}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar agendamentos');
      }

      setAppointments(data.appointments || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar agendamentos');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [phone]);

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja realmente cancelar seu horário?')) return;

    setCancellingId(id);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await fetch(`/api/bookings/${id}?phone=${cleanPhone}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cancelar');
      }

      setAppointments(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'cancelled' } : a
      ));
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar agendamento');
    } finally {
      setCancellingId(null);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'aguardando': return 'Aguardando';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'nao_compareceu': return 'Faltou';
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'aguardando': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'confirmed': return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'cancelled': return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'nao_compareceu': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  const handleRescheduleSuccess = () => {
    setRescheduleTarget(null);
    fetchBookings(sessionHash);
  };

  const handleChangeBarberSuccess = () => {
    setChangeBarberTarget(null);
    fetchBookings(sessionHash);
  };

  const handleBookAgain = (apt: BookingRecord) => {
    const params = new URLSearchParams();
    if (apt.service_names?.length > 0) params.set('servico', apt.service_names[0]);
    if (apt.barber_id) params.set('barbeiroId', apt.barber_id);
    router.push(`/agendar?${params.toString()}`);
  };

  const renderAppointmentCard = (apt: BookingRecord, isPast: boolean) => (
    <div key={apt.id} className={`bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 ${isPast ? 'opacity-75' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-white">
            {new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
          </span>
          <Clock className="w-3 h-3 text-slate-500 ml-2" />
          <span className="text-xs text-slate-400">{apt.time?.substring(0, 5)}</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor(apt.status)}`}>
          {statusLabel(apt.status)}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Scissors className="w-3 h-3" />
          <span>{apt.service_names?.[0] || 'Serviço'}</span>
        </div>
        <span>&bull;</span>
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{apt.barber_name}</span>
        </div>
        <span className="text-emerald-400 font-bold ml-auto">R$ {apt.total_price}</span>
      </div>

      {!isPast && (apt.status === 'confirmed' || apt.status === 'aguardando') && (
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setRescheduleTarget(apt)}
            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1"
          >
            <CalendarClock className="w-3 h-3" /> Remarcar
          </button>
          <button
            onClick={() => setChangeBarberTarget(apt)}
            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1"
          >
            <User className="w-3 h-3" /> Trocar
          </button>
          <button
            onClick={() => handleCancel(apt.id)}
            disabled={cancellingId === apt.id}
            className="flex-1 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/30 text-rose-400 text-xs font-bold transition disabled:opacity-50"
          >
            {cancellingId === apt.id ? '...' : 'Cancelar'}
          </button>
        </div>
      )}

      {isPast && (
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => handleBookAgain(apt)}
            className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Agendar Novamente
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-200">
      <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-b border-slate-800/80">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-white transition rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-black text-white text-sm tracking-widest">MAMUTY</h1>
            <p className="text-[10px] text-slate-400">Meus Agendamentos</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        {error && (
          <div className="bg-rose-950/30 border border-rose-900/30 rounded-xl p-3 mb-6">
            <p className="text-rose-400 text-xs">{error}</p>
          </div>
        )}

        {/* STEP 1: PHONE */}
        {step === 'phone' && (
          <form onSubmit={handleSendPin} className="space-y-4 animate-in fade-in">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-white font-bold text-lg">Buscar Agendamentos</h2>
              <p className="text-xs text-slate-400 mt-1">
                Digite seu número de WhatsApp para enviarmos um código de segurança.
              </p>
            </div>

            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="DDD + Número"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || phone.length < 10}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-3.5 rounded-xl text-sm transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Receber Código no WhatsApp'}
            </button>
          </form>
        )}

        {/* STEP 2: PIN */}
        {step === 'pin' && (
          <form onSubmit={handleVerifyPin} className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-white font-bold text-lg">Código de Segurança</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enviamos um código de 4 dígitos no WhatsApp para <strong className="text-white">{phone}</strong>.
              </p>
            </div>

            <input
              type="text"
              placeholder="0 0 0 0"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-amber-400 text-center tracking-[1em] font-black text-2xl focus:border-amber-500 outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || pin.length < 4}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-3.5 rounded-xl text-sm transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Acessar Agendamentos'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setPin(''); }}
              className="w-full text-slate-500 hover:text-slate-300 text-xs py-2"
            >
              Mudar número
            </button>
          </form>
        )}

        {/* STEP 3: APPOINTMENTS */}
        {step === 'appointments' && (
          <div className="space-y-6 animate-in fade-in">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nenhum agendamento encontrado.</p>
              </div>
            ) : (
              <>
                {futuros.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider pl-1">Próximos Agendamentos</h2>
                    {futuros.map(a => renderAppointmentCard(a, false))}
                  </div>
                )}

                {passados.length > 0 && (
                  <div className="space-y-3 pt-6 mt-6 border-t border-slate-800/50">
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Histórico</h2>
                    {passados.map(a => renderAppointmentCard(a, true))}
                  </div>
                )}
              </>
            )}
            
            <button
              onClick={() => { setStep('phone'); setAppointments([]); setPin(''); }}
              className="w-full text-slate-500 hover:text-slate-300 text-xs py-4"
            >
              Buscar outro número
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {rescheduleTarget && (
        <RescheduleWizard
          appointmentId={rescheduleTarget.id}
          currentServiceId={rescheduleTarget.service_ids?.[0] || ''}
          currentBarberId={rescheduleTarget.barber_id}
          currentDate={rescheduleTarget.date}
          currentTime={rescheduleTarget.time?.substring(0, 5)}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {changeBarberTarget && (
        <ChangeBarberModal
          appointmentId={changeBarberTarget.id}
          currentBarberId={changeBarberTarget.barber_id}
          serviceIds={changeBarberTarget.service_ids || []}
          date={changeBarberTarget.date}
          time={changeBarberTarget.time?.substring(0, 5)}
          onClose={() => setChangeBarberTarget(null)}
          onSuccess={handleChangeBarberSuccess}
        />
      )}
    </div>
  );
}
