'use client';

import React, { useState, useCallback } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
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
  const [phone, setPhone] = useState('');
  const [searched, setSearched] = useState(false);
  const [appointments, setAppointments] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [rescheduleTarget, setRescheduleTarget] = useState<BookingRecord | null>(null);
  const [changeBarberTarget, setChangeBarberTarget] = useState<BookingRecord | null>(null);

  const fetchBookings = useCallback(async (phoneNumber: string) => {
    setIsLoading(true);
    setError('');
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const response = await fetch(`/api/bookings?phone=${cleanPhone}`);
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
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    await fetchBookings(phone);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja realmente cancelar seu horário?')) return;

    setCancellingId(id);
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        const data = await response.json();
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

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-sky-400 bg-sky-500/20';
      case 'aguardando': return 'text-amber-400 bg-amber-500/20';
      case 'em_andamento': return 'text-purple-400 bg-purple-500/20';
      case 'completed': return 'text-emerald-400 bg-emerald-500/20';
      case 'cancelled': return 'text-rose-400 bg-rose-500/20';
      case 'nao_compareceu': return 'text-slate-400 bg-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'aguardando': return 'Aguardando';
      case 'em_andamento': return 'Em andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'nao_compareceu': return 'Não compareceu';
      default: return status;
    }
  };

  const handleRescheduleSuccess = () => {
    setRescheduleTarget(null);
    // Re-fetch bookings
    fetchBookings(phone);
  };

  const handleChangeBarberSuccess = () => {
    setChangeBarberTarget(null);
    fetchBookings(phone);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white tracking-wider">MAMUTY</h1>
            <p className="text-xs text-slate-400">Meus Agendamentos</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="Digite seu WhatsApp..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-3 rounded-xl text-sm transition disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-rose-950/30 border border-rose-900/30 rounded-xl p-3 mb-4">
            <p className="text-rose-400 text-xs">{error}</p>
          </div>
        )}

        {/* Results */}
        {searched && (
          <div className="space-y-3">
            {appointments.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nenhum agendamento encontrado</p>
                <p className="text-slate-600 text-xs mt-1">Verifique o número digitado</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-4">
                  {appointments.length} agendamento{appointments.length > 1 ? 's' : ''} encontrado{appointments.length > 1 ? 's' : ''}
                </p>
                {appointments.map(apt => (
                  <div
                    key={apt.id}
                    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold text-white">
                          {new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
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

                    {(apt.status === 'confirmed' || apt.status === 'aguardando') && (
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
                          <User className="w-3 h-3" /> Trocar Barbeiro
                        </button>
                        <button
                          onClick={() => handleCancel(apt.id)}
                          disabled={cancellingId === apt.id}
                          className="flex-1 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/30 text-rose-400 text-xs font-bold transition disabled:opacity-50"
                        >
                          {cancellingId === apt.id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-600">
            Duvidas? Entre em contato pelo WhatsApp
          </p>
        </div>
      </div>

      {/* Reschedule Modal */}
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

      {/* Change Barber Modal */}
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
