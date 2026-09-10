'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
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
  Trash2,
  Star,
  CalendarPlus,
  Users,
  TrendingUp,
  AlertCircle,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

export default function AdminPage() {
  const { 
    appointments, 
    barbers, 
    services, 
    updateAppointmentStatus, 
    createAppointment,
    deleteAppointment,
    addLoyaltyStamp,
    latestNewBooking,
    dismissNewBookingAlert,
    refreshData
  } = useApp();

  const [filterBarber, setFilterBarber] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualServiceId, setManualServiceId] = useState('');
  const [manualBarberId, setManualBarberId] = useState('');
  const [manualDate, setManualDate] = useState(selectedDate);
  const [manualTime, setManualTime] = useState('10:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!manualName.trim() || !manualPhone.trim() || !manualServiceId || !manualBarberId) return;

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
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar.');
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

  const todaysAppointments = useMemo(() => {
    return appointments.filter(a => a.date === selectedDate);
  }, [appointments, selectedDate]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchDate = a.date === selectedDate;
      const matchBarber = filterBarber === 'all' || a.barberId === filterBarber;
      return matchDate && matchBarber;
    });
  }, [appointments, selectedDate, filterBarber]);

  const stats = useMemo(() => {
    const total = todaysAppointments.length;
    const pending = todaysAppointments.filter(a => a.status === 'confirmed').length;
    const completed = todaysAppointments.filter(a => a.status === 'completed').length;
    const cancelled = todaysAppointments.filter(a => a.status === 'cancelled').length;
    return { total, pending, completed, cancelled };
  }, [todaysAppointments]);

  const handleCancel = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar?')) {
      await updateAppointmentStatus(id, 'cancelled');
    }
  };

  const handleComplete = async (id: string) => {
    await updateAppointmentStatus(id, 'completed');
  };

  const handleDeleteAppointment = async (id: string, clientName: string) => {
    if (!confirm(`Excluir agendamento de "${clientName}"?`)) return;
    try {
      await deleteAppointment(id);
    } catch (err: any) {
      alert('Erro ao excluir: ' + (err.message || err));
    }
  };

  const handleChairReschedule = async (apt: any, daysToAdd: number) => {
    try {
      const baseDate = new Date(apt.date + 'T12:00:00');
      const nextDateObj = new Date(baseDate.getTime() + daysToAdd * 86400000);
      const nextDateStr = nextDateObj.toISOString().split('T')[0];

      await createAppointment({
        customerName: apt.customerName,
        customerPhone: apt.customerPhone,
        barberId: apt.barberId,
        barberName: apt.barberName,
        serviceIds: apt.serviceIds,
        serviceNames: apt.serviceNames,
        date: nextDateStr,
        time: apt.time,
        totalPrice: apt.totalPrice,
        totalDurationMinutes: apt.totalDurationMinutes,
        paymentMethod: apt.paymentMethod || 'presencial',
        status: 'confirmed',
        notes: `Retorno Cadeira (+${daysToAdd}d)`
      });

      const dateFormatted = nextDateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
      const msg = `Fala, *${apt.customerName.split(' ')[0]}*! 💈\n\nRetorno garantido na *Barbearia Mamuty* para *${dateFormatted} às ${apt.time}* com *${apt.barberName}*!\n\n*~Mamuty barbearia estilo forte.*`;
      const cleanPhone = apt.customerPhone.replace(/\D/g, '');
      const phoneWithDDI = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

      if (confirm(`Retorno criado para ${dateFormatted} às ${apt.time}!\n\nEnviar confirmação no WhatsApp?`)) {
        window.open(`https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err: any) {
      alert('Erro ao reagendar: ' + (err.message || err));
    }
  };

  const handleAddStampFromApt = async (apt: any) => {
    try {
      const updated = await addLoyaltyStamp(apt.customerPhone);
      const stamps = updated ? updated.loyaltyStamps : 1;
      const remaining = Math.max(0, 10 - stamps);

      const msg = stamps >= 10
        ? `🎉 *PARABÉNS!* 10 selos completos! Seu próximo corte é GRÁTIS!`
        : `+1 selo creditado! (${stamps}/10) - Faltam ${remaining} para o corte cortesia!`;

      const cleanPhone = apt.customerPhone.replace(/\D/g, '');
      const phoneWithDDI = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

      if (confirm(`+1 Selo para ${apt.customerName}! (${stamps}/10)\n\nEnviar no WhatsApp?`)) {
        window.open(`https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err: any) {
      alert('Erro ao creditar selo.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white tracking-wider">MAMUTY</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
              Painel Admin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => openNewBookingModal()}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* New Booking Alert */}
      {latestNewBooking && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
            <div>
              <p className="text-xs font-bold text-amber-300 uppercase">Novo Agendamento</p>
              <p className="text-sm font-bold text-white">
                {latestNewBooking.customerName} &bull; {latestNewBooking.serviceNames?.[0]}
              </p>
            </div>
          </div>
          <button onClick={dismissNewBookingAlert} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Hoje</p>
          <p className="text-3xl font-black text-white mt-1">{stats.total}</p>
          <p className="text-[11px] text-slate-400">Agendamentos</p>
        </div>
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Pendentes</p>
          <p className="text-3xl font-black text-amber-400 mt-1">{stats.pending}</p>
          <p className="text-[11px] text-slate-400">Confirmados</p>
        </div>
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Concluídos</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{stats.completed}</p>
          <p className="text-[11px] text-slate-400">Atendimentos</p>
        </div>
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cancelados</p>
          <p className="text-3xl font-black text-rose-400 mt-1">{stats.cancelled}</p>
          <p className="text-[11px] text-slate-400">Cancelamentos</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/clientes', label: 'Clientes', icon: Users, color: 'text-blue-400' },
          { href: '/admin/servicos', label: 'Serviços', icon: Scissors, color: 'text-amber-400' },
          { href: '/admin/profissionais', label: 'Profissionais', icon: User, color: 'text-emerald-400' },
          { href: '/admin/configuracoes', label: 'Configurações', icon: BarChart3, color: 'text-slate-400' },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-3">
              <link.icon className={`w-5 h-5 ${link.color}`} />
              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition">{link.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
          </Link>
        ))}
      </div>

      {/* Filters */}
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
            <option value="all">Todos</option>
            {activeBarbers.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Horários — {selectedDate.split('-').reverse().join('/')}
          </span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {timeSlots.map(slot => {
            const aptsInSlot = filteredAppointments.filter(a => a.time === slot);
            const isLunch = slot === '12:00' || slot === '12:30' || slot === '13:00' || slot === '13:30';

            return (
              <div key={slot} className="flex items-stretch min-h-[56px] hover:bg-slate-800/20 transition group">
                <div className="w-16 shrink-0 border-r border-slate-800/60 flex items-center justify-center py-2 bg-slate-950/30">
                  <span className="text-xs font-mono font-bold text-slate-400">{slot}</span>
                </div>
                
                <div className="flex-1 p-2 flex items-center">
                  {isLunch && aptsInSlot.length === 0 ? (
                    <div className="w-full text-center py-1.5 text-xs text-slate-600 italic font-medium">
                      🍽️ Almoço
                    </div>
                  ) : aptsInSlot.length === 0 ? (
                    <button
                      onClick={() => openNewBookingModal(slot)}
                      className="w-full text-left py-1.5 px-3 rounded-lg border border-dashed border-slate-800/60 hover:border-amber-500/40 text-xs text-slate-600 hover:text-amber-400 flex items-center justify-between transition opacity-0 group-hover:opacity-100"
                    >
                      <span>Livre</span>
                      <Plus className="w-3 h-3" />
                    </button>
                  ) : (
                    <div className="w-full space-y-1.5">
                      {aptsInSlot.map(apt => (
                        <div 
                          key={apt.id} 
                          className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            apt.status === 'completed'
                              ? 'bg-emerald-950/20 border-emerald-900/30'
                              : apt.status === 'cancelled'
                              ? 'bg-rose-950/10 border-rose-900/20 opacity-50'
                              : 'bg-slate-800/80 border-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{apt.customerName}</span>
                            <span className="text-[10px] text-slate-500">{apt.serviceNames?.[0]}</span>
                            <span className="text-[10px] text-slate-500">&bull;</span>
                            <span className="text-[10px] text-slate-400">{apt.barberName}</span>
                            <span className="text-[10px] text-emerald-400 font-bold">R$ {apt.totalPrice}</span>
                            {apt.status === 'confirmed' && (
                              <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-bold">Confirmado</span>
                            )}
                            {apt.status === 'completed' && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">Concluído</span>
                            )}
                            {apt.status === 'cancelled' && (
                              <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold">Cancelado</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {apt.status !== 'confirmed' && apt.status !== 'completed' && (
                              <button
                                onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold transition"
                                title="Confirmar"
                              >
                                <CheckCircle className="w-3 h-3 inline mr-1" />OK
                              </button>
                            )}
                            {apt.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => handleComplete(apt.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition"
                                  title="Concluir"
                                >
                                  <Check className="w-3 h-3 inline mr-1" />Feito
                                </button>
                                <a
                                  href={`https://wa.me/55${apt.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Fala ${apt.customerName}! Seu horário hoje às ${apt.time} está confirmado. Responda 1 para confirmar.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-emerald-700/40 hover:bg-emerald-600/60 border border-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-bold transition"
                                  title="Lembrete WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3 inline" />
                                </a>
                              </>
                            )}
                            {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                              <button
                                onClick={() => handleCancel(apt.id)}
                                className="px-2 py-1 bg-slate-900 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 rounded-lg text-[11px] font-bold transition"
                                title="Cancelar"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAppointment(apt.id, apt.customerName)}
                              className="px-1.5 py-1 text-slate-600 hover:text-rose-400 rounded-lg transition"
                              title="Excluir"
                            >
                              <Trash2 className="w-3 h-3" />
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form 
            onSubmit={handleSaveManualBooking} 
            className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white">Novo Agendamento</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Serviço</label>
                  <select value={manualServiceId} onChange={(e) => setManualServiceId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none">
                    {activeServices.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Profissional</label>
                  <select value={manualBarberId} onChange={(e) => setManualBarberId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none">
                    {activeBarbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Data</label>
                  <input type="date" required value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Horário</label>
                  <select value={manualTime} onChange={(e) => setManualTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none">
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition">
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}