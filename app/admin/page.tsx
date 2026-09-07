'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Bell, Calendar, ChevronLeft, Clock, User, Scissors } from 'lucide-react';

export default function AdminPage() {
  const { appointments, barbers } = useApp();
  
  // For Sprint 1, we focus on "Today"
  const todayIso = new Date().toISOString().split('T')[0];
  
  const todaysAppointments = appointments.filter(a => a.date === todayIso && a.status !== 'cancelado');
  const totalCustomers = new Set(todaysAppointments.map(a => a.customerPhone)).size;

  // Filter by Barber (optional, simple implementation)
  const [filterBarber, setFilterBarber] = useState<string>('all');
  
  const filteredAppointments = filterBarber === 'all' 
    ? todaysAppointments 
    : todaysAppointments.filter(a => a.barberId === filterBarber);

  // Identify newest appointment (for the "🔔 NOVO AGENDAMENTO" highlight)
  // Let's assume the one with the most recent createdAt is the newest
  const sortedByCreated = [...appointments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const newestAppointment = sortedByCreated[0];

  // Timeline generation for today
  const timeSlots = [];
  for (let h = 8; h <= 18; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
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

        {/* Dashboard Stats */}
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
            <p className="text-2xl font-extrabold text-amber-400">{todaysAppointments.length} <span className="text-sm font-normal text-slate-500">reservados</span></p>
          </div>
        </div>

        {/* Highlight Newest Appointment */}
        {newestAppointment && (
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
            <div className="text-right">
              <p className="text-xl font-extrabold text-emerald-400">R$ {newestAppointment.totalPrice}</p>
              <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-md font-bold mt-2 inline-block capitalize">
                Status: {newestAppointment.status}
              </span>
            </div>
          </div>
        )}

        {/* Agenda Timeline */}
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
              // Find appointments starting at this exact slot
              const aptsInSlot = filteredAppointments.filter(a => a.time === slot);

              return (
                <div key={slot} className="flex items-stretch min-h-[60px] hover:bg-slate-800/30 transition">
                  {/* Time label */}
                  <div className="w-20 shrink-0 border-r border-slate-800/50 flex flex-col items-center justify-center py-2 text-slate-400">
                    <span className="text-sm font-bold">{slot}</span>
                  </div>
                  
                  {/* Content area */}
                  <div className="flex-1 p-3">
                    {aptsInSlot.length === 0 ? (
                      <span className="text-sm text-slate-500 italic flex items-center h-full">disponível</span>
                    ) : (
                      <div className="space-y-2">
                        {aptsInSlot.map(apt => (
                          <div key={apt.id} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-white text-sm flex items-center gap-1.5">
                                <User className="w-4 h-4 text-amber-500" />
                                {apt.customerName}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {apt.barberName} — <span className="text-amber-400">{apt.serviceNames[0]}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-300">
                                Duração: {apt.totalDurationMinutes} min
                              </span>
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

      </div>
    </div>
  );
}
