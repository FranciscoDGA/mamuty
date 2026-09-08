'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/types';
import { Users, Plus, X, Phone, Calendar, UserPlus, MessageCircle, Trash2, Pencil } from 'lucide-react';

export default function ClientesPage() {
  const { customers, appointments, createCustomer, refreshData } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setIsModalOpen(true);
  };

  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (id: string, custName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${custName}"? Os agendamentos deste cliente também serão removidos.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
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
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: name.trim(),
            phone: phone.trim()
          })
          .eq('id', editingCustomer.id);

        if (error) throw error;
        await refreshData();
        alert('Cliente atualizado com sucesso!');
      } else {
        await createCustomer(name.trim(), phone.trim());
        alert('Cliente cadastrado com sucesso!');
      }
      setName('');
      setPhone('');
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
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{customer.name}</h3>
                    <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                      {customerApts.length} atendimento{customerApts.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {customer.phone}
                    </span>

                    <a
                      href={`https://wa.me/55${customerCleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chamar no WhatsApp
                    </a>
                  </div>

                  {latestApt && (
                    <p className="text-[11px] text-slate-500 pt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      Último corte: <span className="text-slate-300">{latestApt.date.split('-').reverse().join('/')}</span> ({latestApt.serviceNames?.[0]} com {latestApt.barberName})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditCustomerModal(customer)}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500 transition flex items-center gap-1 text-xs font-semibold"
                    title="Editar dados do cliente"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                    className="p-2 rounded-xl bg-slate-950 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 hover:border-rose-500 transition"
                    title="Excluir cliente permanentemente"
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

      {/* MODAL: NOVO / EDITAR CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form 
            onSubmit={handleSaveCustomer} 
            className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4"
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
              <div>
                <label className="font-bold text-slate-300 block mb-1">Nome Completo</label>
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
                <label className="font-bold text-slate-300 block mb-1">WhatsApp / Celular</label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
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
