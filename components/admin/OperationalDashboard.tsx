'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Appointment, AppointmentStatus } from '@/lib/types';
import {
  Clock,
  Users,
  Scissors,
  DollarSign,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Calendar,
  User,
  MessageCircle,
  Phone,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface OperationalDashboardProps {
  selectedDate: string;
}

export default function OperationalDashboard({ selectedDate }: OperationalDashboardProps) {
  const { appointments, barbers, services, customers, salonConfig, updateAppointmentStatus } = useApp();

  const todaysAppointments = useMemo(() => {
    return appointments.filter(a => a.date === selectedDate);
  }, [appointments, selectedDate]);

  const stats = useMemo(() => {
    const total = todaysAppointments.length;
    const aguardando = todaysAppointments.filter(a => a.status === 'aguardando').length;
    const confirmed = todaysAppointments.filter(a => a.status === 'confirmed').length;
    const emAndamento = todaysAppointments.filter(a => a.status === 'em_andamento').length;
    const completed = todaysAppointments.filter(a => a.status === 'completed').length;
    const cancelled = todaysAppointments.filter(a => a.status === 'cancelled').length;
    const noShow = todaysAppointments.filter(a => a.status === 'nao_compareceu').length;
    const revenue = todaysAppointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);
    const pendingRevenue = todaysAppointments
      .filter(a => a.status === 'confirmed' || a.status === 'aguardando' || a.status === 'em_andamento')
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);
    return { total, aguardando, confirmed, emAndamento, completed, cancelled, noShow, revenue, pendingRevenue };
  }, [todaysAppointments]);

  const nextClients = useMemo(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return todaysAppointments
      .filter(a => 
        a.status === 'confirmed' || a.status === 'aguardando' || a.status === 'em_andamento'
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [todaysAppointments]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 19; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const slotStatus = useMemo(() => {
    const map: Record<string, { occupied: boolean; appointments: Appointment[] }> = {};
    timeSlots.forEach(slot => {
      map[slot] = { occupied: false, appointments: [] };
    });
    todaysAppointments.forEach(apt => {
      if (map[apt.time]) {
        map[apt.time].occupied = true;
        map[apt.time].appointments.push(apt);
      }
    });
    return map;
  }, [todaysAppointments, timeSlots]);

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  const statusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'aguardando': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'em_andamento': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'nao_compareceu': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const statusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'aguardando': return 'Aguardando';
      case 'em_andamento': return 'Em andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'nao_compareceu': return 'Faltou';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wider">PAINEL OPERACIONAL</h1>
          <p className="text-xs text-slate-400 mt-1">{todayStr}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Faturamento Hoje</p>
          <p className="text-2xl font-black text-emerald-400">R$ {stats.revenue}</p>
          {stats.pendingRevenue > 0 && (
            <p className="text-[11px] text-slate-400">+ R$ {stats.pendingRevenue} pendente</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <div className="bg-slate-900/70 p-3 rounded-2xl border border-slate-800 text-center">
          <p className="text-2xl font-black text-white">{stats.total}</p>
          <p className="text-[10px] text-slate-500 uppercase">Total</p>
        </div>
        <div className="bg-slate-900/70 p-3 rounded-2xl border border-amber-500/30 text-center">
          <p className="text-2xl font-black text-amber-400">{stats.aguardando + stats.confirmed}</p>
          <p className="text-[10px] text-slate-500 uppercase">Fila</p>
        </div>
        <div className="bg-slate-900/70 p-3 rounded-2xl border border-purple-500/30 text-center">
          <p className="text-2xl font-black text-purple-400">{stats.emAndamento}</p>
          <p className="text-[10px] text-slate-500 uppercase">Atendendo</p>
        </div>
        <div className="bg-slate-900/70 p-3 rounded-2xl border border-emerald-500/30 text-center">
          <p className="text-2xl font-black text-emerald-400">{stats.completed}</p>
          <p className="text-[10px] text-slate-500 uppercase">Feitos</p>
        </div>
        <div className="bg-slate-900/70 p-3 rounded-2xl border border-rose-500/30 text-center">
          <p className="text-2xl font-black text-rose-400">{stats.cancelled}</p>
          <p className="text-[10px] text-slate-500 uppercase">Cancel.</p>
        </div>
        <div className="bg-slate-900/70 p-3 rounded-2xl border border-slate-600/30 text-center">
          <p className="text-2xl font-black text-slate-400">{stats.noShow}</p>
          <p className="text-[10px] text-slate-500 uppercase">Faltas</p>
        </div>
      </div>

      {/* Next Clients Queue */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fila de Atendimento</span>
          </div>
          <span className="text-xs text-slate-500">{nextClients.length} na fila</span>
        </div>
        <div className="divide-y divide-slate-800/50">
          {nextClients.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-500">Nenhum cliente na fila</p>
            </div>
          ) : (
            nextClients.map((apt, idx) => (
              <div key={apt.id} className="p-3 hover:bg-slate-800/30 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{apt.customerName}</p>
                      <p className="text-[11px] text-slate-400">
                        {apt.time} • {apt.barberName} • {apt.serviceNames?.[0]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusColor(apt.status)}`}>
                      {statusLabel(apt.status)}
                    </span>
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'aguardando')}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold transition"
                      >
                        Chegou
                      </button>
                    )}
                    {apt.status === 'aguardando' && (
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'em_andamento')}
                        className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition"
                      >
                        Iniciar
                      </button>
                    )}
                    {apt.status === 'em_andamento' && (
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition"
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                </div>
                {apt.delayMinutes !== undefined && apt.delayMinutes > 0 && apt.status !== 'completed' && apt.status !== 'cancelled' && (
                  <div className="mt-2 ml-11">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      apt.delayMinutes > salonConfig.toleranceMinutes 
                        ? 'bg-rose-500/20 text-rose-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {apt.delayMinutes > salonConfig.toleranceMinutes ? 'Atraso' : 'Atrasado'} {apt.delayMinutes}min
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Time Grid Overview */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Grade de Horários</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Livre</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-600" /> Ocupado</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> Almoço</span>
          </div>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 p-3">
          {timeSlots.map(slot => {
            const isLunch = slot === '12:00' || slot === '12:30' || slot === '13:00' || slot === '13:30';
            const isOccupied = slotStatus[slot]?.occupied;
            const apts = slotStatus[slot]?.appointments || [];
            return (
              <div
                key={slot}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[9px] font-bold transition ${
                  isLunch
                    ? 'bg-amber-500/20 text-amber-400'
                    : isOccupied
                    ? 'bg-slate-700 text-white'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
                title={isLunch ? 'Almoço' : isOccupied ? apts.map(a => `${a.customerName} (${a.barberName})`).join(', ') : 'Livre'}
              >
                <span>{slot}</span>
                {isOccupied && (
                  <span className="text-[7px] text-slate-400 mt-0.5">{apts.length}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Completed Revenue */}
      {stats.completed > 0 && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Atendimentos Concluídos</span>
          </div>
          <div className="space-y-2">
            {todaysAppointments
              .filter(a => a.status === 'completed')
              .sort((a, b) => a.time.localeCompare(b.time))
              .map(apt => (
                <div key={apt.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500">{apt.time}</span>
                    <span className="text-sm font-bold text-white">{apt.customerName}</span>
                    <span className="text-[11px] text-slate-400">{apt.barberName}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">R$ {apt.totalPrice}</span>
                </div>
              ))}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <span className="text-xs font-bold text-slate-400">Total do Dia</span>
              <span className="text-lg font-black text-emerald-400">R$ {stats.revenue}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/admin/clientes" className="bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex items-center justify-between transition group">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition">Clientes</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
        </Link>
        <Link href="/admin/servicos" className="bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex items-center justify-between transition group">
          <div className="flex items-center gap-3">
            <Scissors className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition">Serviços</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
        </Link>
        <Link href="/admin/profissionais" className="bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex items-center justify-between transition group">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition">Profissionais</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
        </Link>
        <Link href="/admin/financeiro" className="bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex items-center justify-between transition group">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition">Financeiro</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
        </Link>
      </div>
    </div>
  );
}
