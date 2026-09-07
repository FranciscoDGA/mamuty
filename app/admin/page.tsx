'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Bell, Calendar, ChevronLeft, Clock, User, Scissors, XCircle, CheckCircle } from 'lucide-react';

export default function AdminPage() {
  const { appointments, barbers, updateAppointmentStatus } = useApp();
  
  // For Sprint 1/2, we focus on "Today"
  const todayIso = new Date().toISOString().split('T')[0];
  
  const todaysAppointments = appointments.filter(a => a.date === todayIso && a.status !== 'cancelled');
  const totalCustomers = new Set(todaysAppointments.map(a => a.customerPhone)).size;

  const [filterBarber, setFilterBarber] = useState<string>('all');
  
  const filteredAppointments = filterBarber === 'all' 
    ? todaysAppointments 
    : todaysAppointments.filter(a => a.barberId === filterBarber);

  const sortedByCreated = [...appointments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const newestAppointment = sortedByCreated[0];

  const timeSlots = [];
  for (let h = 8; h <= 18; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  const handleCancel = async (id: string) => {
    if (confirm('Deseja realmente cancelar este agendamento?')) {
      await updateAppointmentStatus(id, 'cancelled');
    }
  };

  const handleComplete = async (id: string) => {
    if (confirm('Marcar este agendamento como concluído?')) {
      await updateAppointmentStatus(id, 'completed');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-extrabold text-amber-500">Mamuty</h1>
            <h2 className="text-lg text-slate-300">Painel Administrativo</h2>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
            <ChevronLeft className="w-4 h-4" />
            Voltar ao site
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Hoje</p>
            <p className="text-2xl font-extrabold text-white">{todaysAppointments.length} <span className="text-sm font-normal text-slate-500">agendamentos</span></p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Clientes</p>
            <p className="text-2xl font-extrabold text-white">{totalCustomers} <span className="text-sm font-normal text-slate-500">atendidos</span></p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 col-span-2 md:col-span-1">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Horários Ocupados</p>
            <p className="text-2xl font-extrabold text-amber-400">{todaysAppointments.filter(a => a.status === 'confirmed').length} <span className="text-sm font-normal text-slate-500">reservados</span></p>
          </div>
        </div>

        {newestAppointment && newestAppointment.status === 'confirmed' && (
          <div className="bg-emerald-900/20 border border-emerald-500/50 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Novo Agendamento</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{newestAppointment.customerName}</h3>
              <p className="text-sm text-slate-300 flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5" /> {newestAppointment.serviceNames[0]} com {newestAppointment.barberName}
              </p>
              <p className="text-sm text-slate-300 flex items-center gap-2 mt-1">
                <Calendar className="w-3.5 h-3.5" /> {newestAppointment.date.split('-').reverse().join('/')} — {newestAppointment.time}
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <p className="text-xl font-extrabold text-emerald-400">R$ {newestAppointment.totalPrice}</p>
              <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-md font-bold uppercase">
                Origem: {newestAppointment.source}
              </span>
            </div>
          </div>
        )}

        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900">
            <h3 className="font-bold text-lg text-white">Agenda de Hoje — {todayIso.split('-').reverse().join('/')}</h3>
            
            <select 
              value={filterBarber} 
              onChange={(e) => setFilterBarber(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="all">Todos os profissionais</option>
              {barbers.filter(b => b.id !== 'any').map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <div className="divide-y divide-slate-800/50">
            {timeSlots.map(slot => {
              const aptsInSlot = filteredAppointments.filter(a => a.time === slot);

              return (
                <div key={slot} className="flex items-stretch min-h-[60px] hover:bg-slate-800/30 transition">
                  <div className="w-20 shrink-0 border-r border-slate-800/50 flex flex-col items-center justify-center py-2 text-slate-400">
                    <span className="text-sm font-bold">{slot}</span>
                  </div>
                  
                  <div className="flex-1 p-3">
                    {aptsInSlot.length === 0 ? (
                      <span className="text-sm text-slate-500 italic flex items-center h-full">disponível</span>
                    ) : (
                      <div className="space-y-2">
                        {aptsInSlot.map(apt => (
                          <div key={apt.id} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-white text-sm flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-amber-500" />
                                  {apt.customerName}
                                </p>
                                {apt.status === 'completed' && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">Concluído</span>}
                              </div>
                              <p className="text-xs text-slate-400">
                                {apt.barberName} — <span className="text-amber-400">{apt.serviceNames[0]}</span>
                              </p>
                              <p className="text-[10px] text-slate-500 mt-1 uppercase">Origem: {apt.source}</p>
                            </div>
                            
                            {apt.status === 'confirmed' && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleCancel(apt.id)} className="p-2 bg-slate-900 border border-rose-900/50 text-rose-400 hover:bg-rose-900/20 hover:border-rose-500 transition rounded-lg" title="Cancelar Agendamento">
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleComplete(apt.id)} className="p-2 bg-slate-900 border border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20 hover:border-emerald-500 transition rounded-lg" title="Marcar como Concluído">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
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

      </div>
    </div>
  );
}
