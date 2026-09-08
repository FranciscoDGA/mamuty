'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, 
  XCircle, 
  Bell, 
  Scissors, 
  Calendar, 
  User, 
  Plus, 
  X, 
  Clock, 
  Phone,
  Filter,
  Check,
  MessageCircle,
  Trash2
} from 'lucide-react';

export default function AdminPage() {
  const { 
    appointments, 
    barbers, 
    services, 
    updateAppointmentStatus, 
    createAppointment,
    refreshData
  } = useApp();

  const [filterBarber, setFilterBarber] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Modal State for Manual Booking
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualServiceId, setManualServiceId] = useState('');
  const [manualBarberId, setManualBarberId] = useState('');
  const [manualDate, setManualDate] = useState(selectedDate);
  const [manualTime, setManualTime] = useState('10:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default service and barber if not selected
  const activeServices = useMemo(() => services.filter(s => s.id), [services]);
  const activeBarbers = useMemo(() => barbers.filter(b => b.id !== 'any'), [barbers]);

  const openNewBookingModal = (defaultTime?: string) => {
    setManualName('');
    setManualPhone('');
    setManualServiceId(activeServices[0]?.id || '');
    setManualBarberId(activeBarbers[0]?.id || '');
    setManualDate(selectedDate);
    if (defaultTime) setManualTime(defaultTime);
    setIsModalOpen(true);
  };

  const handleSaveManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPhone.trim() || !manualServiceId || !manualBarberId) {
      alert('Por favor, preencha todos os campos do agendamento.');
      return;
    }

    setIsSubmitting(true);
    try {
      const s = services.find(srv => srv.id === manualServiceId) || activeServices[0];
      const b = barbers.find(bar => bar.id === manualBarberId) || activeBarbers[0];

      await createAppointment({
        customerName: manualName.trim(),
        customerPhone: manualPhone.trim(),
        barberId: b.id,
        barberName: b.name,
        serviceIds: [s.id],
        serviceNames: [s.name],
        date: manualDate,
        time: manualTime,
        totalPrice: s.price,
        totalDurationMinutes: s.durationMinutes,
        source: 'web'
      });

      setIsModalOpen(false);
      alert('Agendamento manual cadastrado com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 19; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchDate = a.date === selectedDate;
      const matchBarber = filterBarber === 'all' || a.barberId === filterBarber;
      return matchDate && matchBarber;
    });
  }, [appointments, selectedDate, filterBarber]);

  const todaysAppointments = useMemo(() => {
    return appointments.filter(a => a.date === selectedDate);
  }, [appointments, selectedDate]);

  const totalCustomers = new Set(todaysAppointments.map(a => a.customerPhone)).size;

  const handleCancel = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      await updateAppointmentStatus(id, 'cancelled');
    }
  };

  const handleComplete = async (id: string) => {
    await updateAppointmentStatus(id, 'completed');
  };

  const handleDeleteAppointment = async (id: string, clientName: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o agendamento de "${clientName}"?`)) return;
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
      alert('Agendamento excluído com sucesso.');
    } catch (err: any) {
      alert('Erro ao excluir agendamento: ' + (err.message || err));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Agenda de Atendimentos</h1>
          <p className="text-xs text-slate-400 mt-1">Gerencie reservas e cadastre agendamentos manuais</p>
        </div>

        <button
          onClick={() => openNewBookingModal()}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Agendamento Manual</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
          <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Agendamentos</p>
          <p className="text-2xl font-black text-white mt-1">{todaysAppointments.length}</p>
        </div>
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
          <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Clientes Únicos</p>
          <p className="text-2xl font-black text-white mt-1">{totalCustomers}</p>
        </div>
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
          <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Confirmados</p>
          <p className="text-2xl font-black text-amber-400 mt-1">
            {todaysAppointments.filter(a => a.status === 'confirmed').length}
          </p>
        </div>
      </div>

      {/* Filters: Date & Barber */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filterBarber} 
            onChange={(e) => setFilterBarber(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
          >
            <option value="all">Todos os profissionais</option>
            {activeBarbers.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline Schedule */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Horários do dia ({selectedDate.split('-').reverse().join('/')})
          </span>
          <span className="text-xs text-slate-400">Clique em um horário para agendar</span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {timeSlots.map(slot => {
            const aptsInSlot = filteredAppointments.filter(a => a.time === slot);

            return (
              <div key={slot} className="flex items-stretch min-h-[64px] hover:bg-slate-800/20 transition group">
                <div className="w-20 shrink-0 border-r border-slate-800/60 flex flex-col items-center justify-center py-2 text-slate-400 bg-slate-950/30">
                  <span className="text-xs font-mono font-bold text-slate-300">{slot}</span>
                </div>
                
                <div className="flex-1 p-3 flex items-center">
                  {aptsInSlot.length === 0 ? (
                    <button
                      onClick={() => openNewBookingModal(slot)}
                      className="w-full text-left py-1.5 px-3 rounded-xl border border-dashed border-slate-800/80 hover:border-amber-500/50 hover:bg-amber-500/5 text-xs text-slate-500 hover:text-amber-400 flex items-center justify-between transition"
                    >
                      <span className="italic">Horário disponível</span>
                      <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1 font-semibold text-[11px]">
                        <Plus className="w-3.5 h-3.5" /> Agendar
                      </span>
                    </button>
                  ) : (
                    <div className="w-full space-y-2">
                      {aptsInSlot.map(apt => (
                        <div 
                          key={apt.id} 
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            apt.status === 'completed'
                              ? 'bg-emerald-950/20 border-emerald-900/40'
                              : apt.status === 'cancelled'
                              ? 'bg-rose-950/20 border-rose-900/30 opacity-60'
                              : 'bg-slate-800/90 border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-white text-sm flex items-center gap-1.5">
                                <User className="w-4 h-4 text-amber-500" />
                                {apt.customerName}
                              </p>
                              <span className="text-xs text-slate-400 font-mono">({apt.customerPhone})</span>
                              {apt.status === 'completed' && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                                  Concluído
                                </span>
                              )}
                              {apt.status === 'cancelled' && (
                                <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold uppercase">
                                  Cancelado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300">
                              Barbeiro: <strong className="text-white">{apt.barberName}</strong> &bull; Serviço: <strong className="text-amber-400">{apt.serviceNames?.[0] || 'Corte'}</strong> (R$ {apt.totalPrice})
                            </p>
                          </div>
                                             <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {apt.status === 'confirmed' && (
                              <>
                                <a
                                  href={`https://wa.me/55${apt.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                    `Fala, ${apt.customerName}! 💈✂️\n\nConfirmado seu horário hoje às ${apt.time} na Mamuty Barbearia (${apt.serviceNames?.[0] || 'Atendimento'} com ${apt.barberName})?\n\nResponda 1 para CONFIRMAR ou 2 para REMARCAR.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-emerald-700/40 hover:bg-emerald-600/60 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                                  title="Enviar Lembrete Anti-No-Show no WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Lembrete WhatsApp</span>
                                </a>

                                <button 
                                  onClick={() => handleComplete(apt.id)} 
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                                  title="Concluir Atendimento"
                                >
                                  <Check className="w-3.5 h-3.5" /> Concluir
                                </button>
                                <button 
                                  onClick={() => handleCancel(apt.id)} 
                                  className="px-3 py-1.5 bg-slate-900 border border-rose-900/60 text-rose-400 hover:bg-rose-950/40 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                                  title="Cancelar Agendamento"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Cancelar
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleDeleteAppointment(apt.id, apt.customerName)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 rounded-lg transition"
                              title="Excluir Agendamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: NOVO AGENDAMENTO MANUAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form 
            onSubmit={handleSaveManualBooking} 
            className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Cadastrar Agendamento Manual</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">WhatsApp / Telefone</label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Serviço</label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                  >
                    {activeServices.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Profissional</label>
                  <select
                    value={manualBarberId}
                    onChange={(e) => setManualBarberId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                  >
                    {activeBarbers.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Horário</label>
                  <select
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Agendamento'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
