'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Barber, BarberSchedule, BlockedSlot, ClosedDay } from '@/lib/types';
import {
  Calendar,
  Clock,
  UserX,
  Plus,
  Trash2,
  ChevronRight,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_SEMANA_COMPLETO = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function AgendaPage() {
  const {
    barbers,
    barberSchedules,
    blockedSlots,
    closedDays,
    addBarberSchedule,
    updateBarberSchedule,
    addBlockedSlot,
    removeBlockedSlot,
    addClosedDay,
    removeClosedDay,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'folgas' | 'bloqueios' | 'fechados'>('folgas');
  const [selectedBarber, setSelectedBarber] = useState<string>(barbers[0]?.id || '');
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showAddClosed, setShowAddClosed] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockStart, setNewBlockStart] = useState('08:00');
  const [newBlockEnd, setNewBlockEnd] = useState('12:00');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [newClosedDate, setNewClosedDate] = useState('');
  const [newClosedReason, setNewClosedReason] = useState('');

  const getBarberSchedule = (barberId: string): BarberSchedule => {
    const existing = barberSchedules.find(s => s.barberId === barberId);
    return existing || { id: '', barberId, dayOff: [], blockedSlots: [] };
  };

  const toggleDayOff = (barberId: string, day: number) => {
    const current = getBarberSchedule(barberId);
    const newDayOff = current.dayOff.includes(day)
      ? current.dayOff.filter(d => d !== day)
      : [...current.dayOff, day];

    if (current.id) {
      updateBarberSchedule(current.id, { dayOff: newDayOff });
    } else {
      addBarberSchedule({ barberId, dayOff: newDayOff, blockedSlots: [] });
    }
  };

  const handleAddBlock = () => {
    if (!selectedBarber || !newBlockDate || !newBlockStart || !newBlockEnd) return;
    addBlockedSlot({
      barberId: selectedBarber,
      date: newBlockDate,
      startTime: newBlockStart,
      endTime: newBlockEnd,
      reason: newBlockReason || undefined,
    });
    setShowAddBlock(false);
    setNewBlockDate('');
    setNewBlockStart('08:00');
    setNewBlockEnd('12:00');
    setNewBlockReason('');
  };

  const handleAddClosed = () => {
    if (!newClosedDate) return;
    addClosedDay({
      date: newClosedDate,
      reason: newClosedReason || 'Barbearia fechada',
    });
    setShowAddClosed(false);
    setNewClosedDate('');
    setNewClosedReason('');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Agenda Profissional</h1>
        <p className="text-xs text-slate-400 mt-1">Configure folgas, bloqueios e dias fechados</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
        {[
          { key: 'folgas' as const, label: 'Folgas', icon: UserX },
          { key: 'bloqueios' as const, label: 'Bloqueios', icon: Clock },
          { key: 'fechados' as const, label: 'Dias Fechados', icon: Calendar },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition ${
                activeTab === tab.key
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* FOLGAS TAB */}
      {activeTab === 'folgas' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Selecione o profissional</h3>
            <div className="flex gap-2">
              {barbers.filter(b => b.active !== false).map(barber => (
                <button
                  key={barber.id}
                  onClick={() => setSelectedBarber(barber.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    selectedBarber === barber.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-700">
                    <img src={barber.avatarUrl || '/logo.png'} alt={barber.name} className="w-full h-full object-cover" />
                  </div>
                  {barber.name}
                </button>
              ))}
            </div>
          </div>

          {selectedBarber && (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5">
              <h3 className="text-sm font-bold text-white mb-2">
                Dias de folga de {barbers.find(b => b.id === selectedBarber)?.name}
              </h3>
              <p className="text-[11px] text-slate-500 mb-4">Selecione os dias em que o profissional não trabalha</p>
              <div className="grid grid-cols-7 gap-2">
                {DIAS_SEMANA.map((dia, idx) => {
                  const schedule = getBarberSchedule(selectedBarber);
                  const isDayOff = schedule.dayOff.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleDayOff(selectedBarber, idx)}
                      className={`py-3 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                        isDayOff
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-lg">{isDayOff ? '✕' : '✓'}</span>
                      <span>{dia}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BLOQUEIOS TAB */}
      {activeTab === 'bloqueios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Horários Bloqueados</h3>
            <button
              onClick={() => setShowAddBlock(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold transition hover:bg-amber-400"
            >
              <Plus className="w-3.5 h-3.5" /> Bloquear Horário
            </button>
          </div>

          {/* Add Block Form */}
          {showAddBlock && (
            <div className="bg-slate-900 rounded-2xl border border-amber-500/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-amber-400">Novo Bloqueio</h4>
                <button onClick={() => setShowAddBlock(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Profissional</label>
                <select
                  value={selectedBarber}
                  onChange={e => setSelectedBarber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {barbers.filter(b => b.active !== false).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Data</label>
                  <input
                    type="date"
                    value={newBlockDate}
                    min={today}
                    onChange={e => setNewBlockDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Início</label>
                  <input
                    type="time"
                    value={newBlockStart}
                    onChange={e => setNewBlockStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Fim</label>
                  <input
                    type="time"
                    value={newBlockEnd}
                    onChange={e => setNewBlockEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Motivo (opcional)</label>
                <input
                  type="text"
                  value={newBlockReason}
                  onChange={e => setNewBlockReason(e.target.value)}
                  placeholder="Ex: Consulta médica, compromisso..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <button
                onClick={handleAddBlock}
                disabled={!newBlockDate || !newBlockStart || !newBlockEnd}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition"
              >
                Adicionar Bloqueio
              </button>
            </div>
          )}

          {/* Blocked Slots List */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            {blockedSlots.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                <p className="text-sm">Nenhum horário bloqueado</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {blockedSlots
                  .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                  .map(block => {
                    const barber = barbers.find(b => b.id === block.barberId);
                    return (
                      <div key={block.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-rose-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{barber?.name || 'Desconhecido'}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(block.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                              {' • '}{block.startTime} às {block.endTime}
                            </p>
                            {block.reason && <p className="text-[10px] text-slate-500">{block.reason}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => removeBlockedSlot(block.id)}
                          className="p-2 rounded-lg bg-slate-950 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIAS FECHADOS TAB */}
      {activeTab === 'fechados' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Dias Fechados</h3>
            <button
              onClick={() => setShowAddClosed(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold transition hover:bg-amber-400"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Dia
            </button>
          </div>

          {/* Add Closed Day Form */}
          {showAddClosed && (
            <div className="bg-slate-900 rounded-2xl border border-amber-500/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-amber-400">Novo Dia Fechado</h4>
                <button onClick={() => setShowAddClosed(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Data</label>
                  <input
                    type="date"
                    value={newClosedDate}
                    min={today}
                    onChange={e => setNewClosedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Motivo</label>
                  <input
                    type="text"
                    value={newClosedReason}
                    onChange={e => setNewClosedReason(e.target.value)}
                    placeholder="Ex: Feriado, reforma..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleAddClosed}
                disabled={!newClosedDate}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition"
              >
                Adicionar Dia Fechado
              </button>
            </div>
          )}

          {/* Closed Days List */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            {closedDays.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                <p className="text-sm">Nenhum dia fechado configurado</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {closedDays
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(day => (
                    <div key={day.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-400">{day.reason}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeClosedDay(day.id)}
                        className="p-2 rounded-lg bg-slate-950 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
