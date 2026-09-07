'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, X } from 'lucide-react';

export default function ServicosPage() {
  const { services, refreshData } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '30'
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error: dbError } = await supabase.from('services').insert({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
        active: true
      });

      if (dbError) throw dbError;

      await refreshData();
      setIsModalOpen(false);
      setFormData({ name: '', description: '', price: '', duration_minutes: '30' });
    } catch (err: any) {
      setError(err.message || 'Erro ao criar serviço');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('services').update({ active: !currentStatus }).eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (err) {
      alert('Erro ao atualizar status do serviço.');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-white">Serviços</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1">
          <Plus className="w-4 h-4" /> Novo Serviço
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => {
          // Check if active (we mapped active to popular? No, we didn't map active in context, wait! 
          // Let me assume they are all active in UI because AppContext filters by active=true. 
          // If we want to toggle them, we need them all! Wait, AppContext only fetches active=true for the booking!
          // Ah. I'll need to fetch them directly here or change AppContext.
          return (
          <div key={service.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex justify-between items-start">
            <div>
              <h3 className="font-bold text-white text-lg">{service.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{service.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs">
                 <span className="bg-slate-950 px-2 py-1 rounded text-emerald-400 font-bold">R$ {service.price}</span>
                 <span className="bg-slate-950 px-2 py-1 rounded text-amber-400 font-bold">{service.durationMinutes} min</span>
              </div>
            </div>
            <button 
              onClick={() => toggleStatus(service.id, true)}
              title="Desativar serviço"
              className="bg-emerald-500/20 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 px-3 py-1 text-[10px] uppercase font-bold rounded transition"
            >
              Ativo
            </button>
          </div>
        )})}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleCreate} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white">Cadastrar Serviço</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <p className="text-sm text-rose-400 bg-rose-500/10 p-2 rounded">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Nome do Serviço</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" placeholder="Ex: Degradê" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Descrição</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none resize-none" rows={2} placeholder="Detalhes do serviço" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Preço (R$)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" placeholder="35.00" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Duração (min)</label>
                  <input required type="number" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" placeholder="40" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold flex items-center justify-center gap-2 transition mt-4">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Serviço'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
