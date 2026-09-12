'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
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
} from 'lucide-react';
import Link from 'next/link';

export default function MeusAgendamentosPage() {
  const { appointments, updateAppointmentStatus } = useApp();
  const [phone, setPhone] = useState('');
  const [searched, setSearched] = useState(false);

  const myAppointments = useMemo(() => {
    if (!phone.trim()) return [];
    const clean = phone.replace(/\D/g, '');
    return appointments.filter(a => {
      const aptPhone = a.customerPhone.replace(/\D/g, '');
      return aptPhone.includes(clean) || clean.includes(aptPhone);
    }).sort((a, b) => {
      const dateA = a.date + ' ' + a.time;
      const dateB = b.date + ' ' + b.time;
      return dateB.localeCompare(dateA);
    });
  }, [appointments, phone]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const handleCancel = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      await updateAppointmentStatus(id, 'cancelled');
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
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-3 rounded-xl text-sm transition"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Results */}
        {searched && (
          <div className="space-y-3">
            {myAppointments.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nenhum agendamento encontrado</p>
                <p className="text-slate-600 text-xs mt-1">Verifique o número digitado</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-4">
                  {myAppointments.length} agendamento{myAppointments.length > 1 ? 's' : ''} encontrado{myAppointments.length > 1 ? 's' : ''}
                </p>
                {myAppointments.map(apt => (
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
                        <span className="text-xs text-slate-400">{apt.time}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor(apt.status)}`}>
                        {statusLabel(apt.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Scissors className="w-3 h-3" />
                        <span>{apt.serviceNames?.[0]}</span>
                      </div>
                      <span>&bull;</span>
                      <span>{apt.barberName}</span>
                      <span className="text-emerald-400 font-bold ml-auto">R$ {apt.totalPrice}</span>
                    </div>

                    {(apt.status === 'confirmed' || apt.status === 'aguardando') && (
                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <a
                          href={`https://wa.me/55${apt.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostaria de cancelar meu agendamento para ${apt.date} às ${apt.time}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                        >
                          Falar no WhatsApp
                        </a>
                        <button
                          onClick={() => handleCancel(apt.id)}
                          className="flex-1 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/30 text-rose-400 text-xs font-bold transition"
                        >
                          Cancelar
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
            Para reagendar, entre em contato pelo WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}
