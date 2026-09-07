'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Loader2, Plus, X } from 'lucide-react';

export default function ProfissionaisPage() {
  const { barbers, refreshData } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    description: '',
    photo_url: ''
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error: dbError } = await supabase.from('barbers').insert({
        name: formData.name,
        specialty: formData.specialty,
        description: formData.description,
        photo_url: formData.photo_url || null,
        active: true
      });

      if (dbError) throw dbError;

      await refreshData();
      setIsModalOpen(false);
      setFormData({ name: '', specialty: '', description: '', photo_url: '' });
    } catch (err: any) {
      setError(err.message || 'Erro ao criar profissional');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('barbers').update({ active: !currentStatus }).eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (err) {
      alert('Erro ao atualizar status do profissional.');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-white">Profissionais</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1">
          <Plus className="w-4 h-4" /> Novo Profissional
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.filter(b => b.id !== 'any').map(barber => (
          <div key={barber.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-700 mb-3 relative">
               <Image src={barber.avatarUrl || 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&q=80'} alt={barber.name} fill className="object-cover" referrerPolicy="no-referrer" />
            </div>
            <h3 className="font-bold text-white text-lg">{barber.name}</h3>
            <p className="text-xs text-amber-400 font-bold mb-2">{barber.role}</p>
            <p className="text-sm text-slate-400 mb-4">{barber.specialties.join(', ')}</p>
            
            <button 
              onClick={() => toggleStatus(barber.id, true)}
              title="Desativar profissional"
              className="mt-auto bg-emerald-500/20 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 px-3 py-1 text-[10px] uppercase font-bold rounded-full transition"
            >
              Ativo
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleCreate} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white">Cadastrar Profissional</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <p className="text-sm text-rose-400 bg-rose-500/10 p-2 rounded">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Nome do Profissional</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" placeholder="Ex: Roberto" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Especialidade Curta</label>
                <input required value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" placeholder="Ex: Degradê e Barba" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Descrição Longa</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none resize-none" rows={2} placeholder="Um pouco sobre o profissional..." />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">URL da Foto (opcional)</label>
                <input value={formData.photo_url} onChange={e => setFormData({...formData, photo_url: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" placeholder="https://..." />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold flex items-center justify-center gap-2 transition mt-4">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Profissional'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
