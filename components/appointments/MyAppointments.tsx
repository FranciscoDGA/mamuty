'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Appointment } from '@/lib/types';
import { WhatsAppNotificationModal } from '@/components/WhatsAppNotificationModal';
import {
  CalendarDays,
  Clock,
  Scissors,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageSquare,
  CalendarPlus,
  Star,
  Search,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const MyAppointments: React.FC<{ onOpenReviewModal?: (apt: Appointment) => void }> = ({
  onOpenReviewModal,
}) => {
  const { appointments, updateAppointmentStatus, currentCustomer, setActiveTab } = useApp();
  const [selectedWhatsAppApt, setSelectedWhatsAppApt] = useState<Appointment | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Filter appointments for current customer or search query
  const customerPhoneClean = currentCustomer?.phone.replace(/\D/g, '') || '';

  const relevantAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptPhoneClean = apt.customerPhone.replace(/\D/g, '');
      const matchesCustomer = customerPhoneClean && aptPhoneClean.includes(customerPhoneClean);
      const matchesSearch =
        searchFilter === '' ||
        apt.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        apt.barberName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        apt.customerPhone.includes(searchFilter);

      return searchFilter !== '' ? matchesSearch : matchesCustomer || matchesSearch;
    });
  }, [appointments, customerPhoneClean, searchFilter]);

  const upcomingAppointments = useMemo(() => {
    return relevantAppointments.filter((a) => a.status === 'confirmado' || a.status === 'em_andamento');
  }, [relevantAppointments]);

  const pastAppointments = useMemo(() => {
    return relevantAppointments.filter((a) => a.status === 'concluido' || a.status === 'cancelado');
  }, [relevantAppointments]);

  const handleCancelAppointment = (id: string) => {
    if (confirm('Deseja realmente cancelar este agendamento na Barbearia Mamuty?')) {
      updateAppointmentStatus(id, 'cancelado');
    }
  };

  const createGoogleCalendarUrl = (apt: Appointment) => {
    const title = encodeURIComponent(`Mamuty Barbearia: ${apt.serviceNames.join(', ')}`);
    const details = encodeURIComponent(
      `Agendamento com ${apt.barberName} no Mamuty Barbearia. Valor: R$ ${apt.totalPrice.toFixed(2)}`
    );
    const location = encodeURIComponent('Mamuty Barbearia - Av. Paulista, 1842');

    // Date formatting YYYYMMDDTHHMMSS
    const dateStr = apt.date.replace(/-/g, '');
    const [hh, mm] = apt.time.split(':');
    const startIso = `${dateStr}T${hh}${mm}00`;

    // End time estimate
    const endMinutes = parseInt(hh) * 60 + parseInt(mm) + apt.totalDurationMinutes;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    const endIso = `${dateStr}T${endH}${endM}00`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-16 space-y-6">
      {/* Header & Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-400" />
            <span>Meus Agendamentos</span>
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe seus horários marcados e histórico na Barbearia Mamuty.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('agendar')}
          id="btn-new-booking-from-appointments"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/10 self-start sm:self-auto"
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Filter by phone or name */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Buscar por seu nome ou telefone..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition"
        />
      </div>

      {/* === UPCOMING APPOINTMENTS === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Próximos Horários ({upcomingAppointments.length})</span>
          </h3>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="bg-slate-900/60 rounded-2xl p-8 border border-slate-800 text-center">
            <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Nenhum horário futuro encontrado</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Você ainda não tem nenhum agendamento pendente. Que tal dar um trato no visual hoje?
            </p>
            <button
              onClick={() => setActiveTab('agendar')}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              Agendar Horário Agora
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 p-4 transition shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-extrabold uppercase">
                        {new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                      <span className="text-base font-black leading-none">
                        {apt.date.split('-')[2]}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{apt.serviceNames.join(' + ')}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                          Confirmado
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Barbeiro: <strong className="text-amber-400">{apt.barberName}</strong>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {apt.time} ({apt.totalDurationMinutes} min)
                        </span>
                        <span className="text-amber-400 font-bold">
                          R$ {apt.totalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status Pill */}
                  <div className="text-left sm:text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        apt.paymentStatus === 'pago'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {apt.paymentStatus === 'pago' ? '✅ Pago no App' : '⏳ Pagar no Balcão'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedWhatsAppApt(apt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/30 font-semibold transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Notificação WhatsApp</span>
                    </button>

                    <a
                      href={createGoogleCalendarUrl(apt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium transition"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Adicionar à Agenda</span>
                    </a>
                  </div>

                  <button
                    onClick={() => handleCancelAppointment(apt.id)}
                    className="text-xs text-rose-400/80 hover:text-rose-400 font-medium transition"
                  >
                    Cancelar Horário
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === PAST APPOINTMENTS === */}
      {pastAppointments.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-slate-400">
            Histórico de Atendimentos ({pastAppointments.length})
          </h3>

          <div className="space-y-2.5">
            {pastAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300">{apt.serviceNames.join(', ')}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${
                        apt.status === 'concluido'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {apt.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Com {apt.barberName} em {new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {apt.time}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {apt.status === 'concluido' && !apt.ratingSubmitted && onOpenReviewModal && (
                    <button
                      onClick={() => onOpenReviewModal(apt)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold hover:bg-amber-500/25 transition"
                    >
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>Avaliar Corte</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('agendar')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 transition"
                  >
                    <span>Repetir Corte</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Modal Trigger */}
      {selectedWhatsAppApt && (
        <WhatsAppNotificationModal
          appointment={selectedWhatsAppApt}
          isOpen={!!selectedWhatsAppApt}
          onClose={() => setSelectedWhatsAppApt(null)}
        />
      )}
    </div>
  );
};
