'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/types';
import { 
  Users, 
  X, 
  Phone, 
  Calendar, 
  UserPlus, 
  MessageCircle, 
  Trash2, 
  Pencil, 
  Mail, 
  UserCheck, 
  Award, 
  Cake, 
  FileText 
} from 'lucide-react';

export default function ClientesPage() {
  const { customers, appointments, barbers, createCustomer, deleteCustomer, refreshData } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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
    setName('');
    setPhone('');
    setEmail('');
    setPreferredBarberId('');
    setTier('Bronze');
    setBirthdate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name || '');
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    setPreferredBarberId(customer.preferredBarberId || '');
    setTier(customer.tier || 'Bronze');
    setBirthdate(customer.birthdate || '');
    setNotes(customer.notes || '');
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (id: string, custName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${custName}"? Os agendamentos deste cliente também serão removidos.`)) {
      return;
    }

    try {
      await deleteCustomer(id);
      alert(`Cliente "${custName}" removido com sucesso.`);
    } catch (err: any) {
      alert('Erro ao excluir cliente: ' + (err.message || err));
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Preencha o nome e o WhatsApp do cliente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingCustomer?.id || '');

      if (editingCustomer) {
        if (isUUID) {
          const { error } = await supabase
            .from('customers')
            .update({
              name: name.trim(),
              phone: phone.trim().replace(/\D/g, '')
            })
            .eq('id', editingCustomer.id);

          if (error) console.warn('Supabase update note:', error);
        }

        // Always update in state with full rich data
        editingCustomer.name = name.trim();
        editingCustomer.phone = phone.trim();
        editingCustomer.email = email.trim();
        editingCustomer.preferredBarberId = preferredBarberId;
        editingCustomer.tier = tier;
        editingCustomer.birthdate = birthdate;
        editingCustomer.notes = notes.trim();

        await refreshData();
        alert('Cliente atualizado com sucesso!');
      } else {
        await createCustomer(name.trim(), phone.trim(), {
          email: email.trim(),
          preferredBarberId,
          tier,
          birthdate,
          notes: notes.trim()
        });
        alert('Cliente cadastrado com sucesso!');
      }

      setEditingCustomer(null);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with + Novo Cliente Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Base de Clientes</h1>
          <p className="text-xs text-slate-400 mt-1">
            Total de {customers.length} cliente{customers.length === 1 ? '' : 's'} cadastrado{customers.length === 1 ? '' : 's'}
          </p>
        </div>

        <button
          onClick={openNewCustomerModal}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Customers List */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800/50">
          {customers.map(customer => {
            const customerCleanPhone = customer.phone.replace(/\D/g, '');
            const customerApts = appointments.filter(
              a => a.customerPhone.replace(/\D/g, '') === customerCleanPhone
            );
            const latestApt = customerApts[0];

            return (
              <div 
                key={customer.id} 
                className="p-4 sm:p-5 hover:bg-slate-800/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white text-base">{customer.name}</h3>
                    
                    {customer.tier && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        customer.tier === 'Ouro VIP' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : customer.tier === 'Prata'
                          ? 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                          : 'bg-orange-950/40 text-orange-400 border border-orange-800/40'
                      }`}>
                        {customer.tier}
                      </span>
                    )}

                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                      {customerApts.length} atendimento{customerApts.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {customer.phone}
                    </span>

                    {customer.email && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {customer.email}
                      </span>
                    )}

                    {customer.preferredBarberId && (
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <UserCheck className="w-3.5 h-3.5" />
                        Prefere: {barbers.find(b => b.id === customer.preferredBarberId)?.name || 'Barbeiro'}
                      </span>
                    )}

                    {customerCleanPhone && (
                      <a
                        href={`https://wa.me/55${customerCleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}
                  </div>

                  {customer.notes && (
                    <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg w-fit">
                      <strong>Obs:</strong> {customer.notes}
                    </p>
                  )}

                  {latestApt && (
                    <p className="text-[11px] text-slate-500 pt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      Último corte: <span className="text-slate-300">{latestApt.date.split('-').reverse().join('/')}</span> ({latestApt.serviceNames?.[0]} com {latestApt.barberName})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditCustomerModal(customer)}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500 transition flex items-center gap-1 text-xs font-semibold"
                    title="Editar dados completos do cliente"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                    className="p-2 rounded-xl bg-slate-950 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 hover:border-rose-500 transition"
                    title="Excluir cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          
          {customers.length === 0 && (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm">Nenhum cliente cadastrado ainda.</p>
              <button
                onClick={openNewCustomerModal}
                className="text-xs text-amber-400 hover:underline font-bold"
              >
                Cadastrar primeiro cliente &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NOVO / EDITAR CLIENTE COMPLETO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <form 
            onSubmit={handleSaveCustomer} 
            className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-lg w-full shadow-2xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {editingCustomer ? (
                  <Pencil className="w-5 h-5 text-amber-400" />
                ) : (
                  <UserPlus className="w-5 h-5 text-amber-400" />
                )}
                <h3 className="font-bold text-base text-white">
                  {editingCustomer ? `Editar Cliente: ${editingCustomer.name}` : 'Cadastrar Novo Cliente'}
                </h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do cliente"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">WhatsApp / Celular *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">E-mail (opcional)</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Data de Aniversário</label>
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Barbeiro Preferido</label>
                  <select
                    value={preferredBarberId}
                    onChange={(e) => setPreferredBarberId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                  >
                    <option value="">Nenhum / Tanto faz</option>
                    {barbers.filter(b => b.id !== 'any').map(barber => (
                      <option key={barber.id} value={barber.id}>
                        {barber.name} ({barber.specialties?.[0] || barber.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nível de Fidelidade</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
                  >
                    <option value="Bronze">Bronze (Iniciante)</option>
                    <option value="Prata">Prata (Recorrente)</option>
                    <option value="Ouro VIP">Ouro VIP (Cliente VIP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Preferências & Observações de Atendimento</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Não passar lâmina no pescoço (foliculite), gosta de degradê navalhado, café sem açúcar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none leading-relaxed resize-none"
                />
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
                {isSubmitting ? 'Salvando...' : editingCustomer ? 'Atualizar Cliente' : 'Salvar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
