'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Customer, Appointment } from '@/lib/types';
import {
  Users, X, Phone, Calendar, UserPlus, MessageCircle, Trash2,
  Pencil, Mail, UserCheck, History, Clock, CheckCircle2, XCircle,
  Scissors, ChevronRight, ArrowLeft, Star, CalendarPlus, Stethoscope,
} from 'lucide-react';

export default function ClientesPage() {
  const { customers, appointments, barbers, createCustomer, deleteCustomer, refreshData } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredBarberId, setPreferredBarberId] = useState('');
  const [tier, setTier] = useState<'Bronze' | 'Prata' | 'Ouro VIP'>('Bronze');
  const [birthdate, setBirthdate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setName(''); setPhone(''); setEmail(''); setPreferredBarberId('');
    setTier('Bronze'); setBirthdate(''); setNotes('');
    setIsModalOpen(true);
  };

  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name || ''); setPhone(customer.phone || '');
    setEmail(customer.email || ''); setPreferredBarberId(customer.preferredBarberId || '');
    setTier(customer.tier || 'Bronze'); setBirthdate(customer.birthdate || '');
    setNotes(customer.notes || '');
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (id: string, custName: string) => {
    if (!confirm(`Excluir cliente "${custName}" e seus agendamentos?`)) return;
    try { await deleteCustomer(id); } catch (err: any) { alert('Erro: ' + (err.message || err)); }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { alert('Preencha nome e WhatsApp.'); return; }
    setIsSubmitting(true);
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingCustomer?.id || '');
      if (editingCustomer) {
        if (isUUID) {
          await supabase.from('customers').update({ name: name.trim(), phone: phone.trim().replace(/\D/g, '') }).eq('id', editingCustomer.id);
        }
        editingCustomer.name = name.trim(); editingCustomer.phone = phone.trim();
        editingCustomer.email = email.trim(); editingCustomer.preferredBarberId = preferredBarberId;
        editingCustomer.tier = tier; editingCustomer.birthdate = birthdate;
        editingCustomer.notes = notes.trim();
        await refreshData();
      } else {
        await createCustomer(name.trim(), phone.trim(), { email: email.trim(), preferredBarberId, tier, birthdate, notes: notes.trim() });
      }
      setIsModalOpen(false);
    } catch (err: any) { alert(err.message || 'Erro ao salvar.'); }
    finally { setIsSubmitting(false); }
  };

  const getCustomerApts = (customer: Customer) => {
    const clean = customer.phone.replace(/\D/g, '');
    return appointments.filter(a => a.customerPhone.replace(/\D/g, '').endsWith(clean.slice(-8)));
  };

  const customerApts = selectedCustomer ? getCustomerApts(selectedCustomer) : [];
  const completedApts = customerApts.filter(a => a.status === 'completed');
  const cancelledApts = customerApts.filter(a => a.status === 'cancelled');
  const upcomingApts = customerApts.filter(a => a.status === 'confirmed').sort((a, b) => a.date.localeCompare(b.date));
  const totalSpent = completedApts.reduce((acc, a) => acc + (a.totalPrice || 0), 0);

  if (selectedCustomer) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <button onClick={() => setSelectedCustomer(null)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Voltar à lista
        </button>

        {/* Detail Panel Header */}
        <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{selectedCustomer.name}</h1>
                {selectedCustomer.tier && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    selectedCustomer.tier === 'Ouro VIP' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : selectedCustomer.tier === 'Prata' ? 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                    : 'bg-orange-950/40 text-orange-400 border border-orange-800/40'
                  }`}>{selectedCustomer.tier}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedCustomer.phone}</span>
                {selectedCustomer.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedCustomer.email}</span>}
                {selectedCustomer.preferredBarberId && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <UserCheck className="w-3.5 h-3.5" /> Prefere: {barbers.find(b => b.id === selectedCustomer.preferredBarberId)?.name || '—'}
                  </span>
                )}
              </div>
              {selectedCustomer.notes && (
                <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg w-fit mt-2">
                  <strong>Obs:</strong> {selectedCustomer.notes}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <a href={`https://wa.me/55${selectedCustomer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="px-3 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
              <button onClick={() => { openEditCustomerModal(selectedCustomer); }} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Agendamentos</p>
            <p className="text-3xl font-black text-white mt-1">{customerApts.length}</p>
          </div>
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 text-center">
            <p className="text-[10px] text-emerald-400 uppercase font-bold">Concluídos</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{completedApts.length}</p>
          </div>
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 text-center">
            <p className="text-[10px] text-amber-400 uppercase font-bold">Total Gasto</p>
            <p className="text-3xl font-black text-amber-400 mt-1">R$ {totalSpent}</p>
          </div>
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 text-center">
            <p className="text-[10px] text-sky-400 uppercase font-bold">Próximo</p>
            <p className="text-sm font-black text-sky-400 mt-2">
              {upcomingApts.length > 0 ? `${upcomingApts[0].date.split('-').reverse().join('/')} ${upcomingApts[0].time}` : 'Nenhum'}
            </p>
          </div>
        </div>

        {/* Services History */}
        <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Histórico de Atendimentos</span>
          </div>
          <div className="divide-y divide-slate-800/50 max-h-80 overflow-y-auto">
            {customerApts.map(apt => (
              <div key={apt.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/20 transition">
                <div className="flex items-center gap-3">
                  <Scissors className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-sm font-bold text-white">{apt.serviceNames?.[0] || 'Serviço'}</p>
                    <p className="text-[11px] text-slate-400">{apt.date.split('-').reverse().join('/')} às {apt.time} — {apt.barberName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-bold">R$ {apt.totalPrice}</span>
                  {apt.status === 'completed' && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">Concluído</span>}
                  {apt.status === 'cancelled' && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">Cancelado</span>}
                  {apt.status === 'confirmed' && <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold">Confirmado</span>}
                </div>
              </div>
            ))}
            {customerApts.length === 0 && (
              <p className="p-8 text-center text-xs text-slate-500">Nenhum atendimento registrado.</p>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
            <form onSubmit={handleSaveCustomer} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">Editar Cliente: {editingCustomer?.name}</h3>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Nome *</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">WhatsApp *</label>
                    <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">E-mail</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Aniversário</label>
                    <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Barbeiro Preferido</label>
                    <select value={preferredBarberId} onChange={e => setPreferredBarberId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none">
                      <option value="">Sem preferência</option>
                      {barbers.filter(b => b.id !== 'any').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Nível</label>
                    <select value={tier} onChange={e => setTier(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none">
                      <option value="Bronze">Bronze</option>
                      <option value="Prata">Prata</option>
                      <option value="Ouro VIP">Ouro VIP</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Observações</label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none resize-none" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800 flex gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition">{isSubmitting ? 'Salvando...' : 'Atualizar'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Base de Clientes</h1>
          <p className="text-xs text-slate-400 mt-1">{customers.length} cliente{customers.length === 1 ? '' : 's'} cadastrado{customers.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={openNewCustomerModal} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition shadow-lg shadow-amber-500/20">
          <UserPlus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-800/50">
          {customers.map(customer => {
            const apts = getCustomerApts(customer);
            const lastApt = apts[0];
            return (
              <div key={customer.id} onClick={() => setSelectedCustomer(customer)}
                className="p-4 sm:p-5 hover:bg-slate-800/30 transition flex items-center justify-between gap-4 cursor-pointer group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition truncate">{customer.name}</h3>
                    {customer.tier && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        customer.tier === 'Ouro VIP' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : customer.tier === 'Prata' ? 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                        : 'bg-orange-950/40 text-orange-400 border border-orange-800/40'
                      }`}>{customer.tier}</span>
                    )}
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold shrink-0">
                      {apts.length}x
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3" /> {customer.phone}</span>
                    {customer.preferredBarberId && (
                      <span className="flex items-center gap-1 text-amber-400"><UserCheck className="w-3 h-3" /> {barbers.find(b => b.id === customer.preferredBarberId)?.name || '—'}</span>
                    )}
                    {lastApt && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Último: {lastApt.date.split('-').reverse().join('/')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    className="p-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/40 transition">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={e => { e.stopPropagation(); openEditCustomerModal(customer); }}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500 transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDeleteCustomer(customer.id, customer.name); }}
                    className="p-2 rounded-xl bg-slate-950 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 hover:border-rose-500 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition" />
                </div>
              </div>
            );
          })}
          {customers.length === 0 && (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm">Nenhum cliente cadastrado ainda.</p>
              <button onClick={openNewCustomerModal} className="text-xs text-amber-400 hover:underline font-bold">Cadastrar primeiro cliente</button>
            </div>
          )}
        </div>
      </div>

      {/* New Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form onSubmit={handleSaveCustomer} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-amber-400" /><h3 className="font-bold text-base text-white">Cadastrar Cliente</h3></div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="font-bold text-slate-300 block mb-1">Nome *</label><input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none" /></div>
                <div><label className="font-bold text-slate-300 block mb-1">WhatsApp *</label><input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="font-bold text-slate-300 block mb-1">E-mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none" /></div>
                <div><label className="font-bold text-slate-300 block mb-1">Aniversário</label><input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Barbeiro Preferido</label>
                  <select value={preferredBarberId} onChange={e => setPreferredBarberId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none">
                    <option value="">Sem preferência</option>
                    {barbers.filter(b => b.id !== 'any').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nível</label>
                  <select value={tier} onChange={e => setTier(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none">
                    <option value="Bronze">Bronze</option><option value="Prata">Prata</option><option value="Ouro VIP">Ouro VIP</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">Observações</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none resize-none" placeholder="Preferências do cliente..." />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition">{isSubmitting ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
