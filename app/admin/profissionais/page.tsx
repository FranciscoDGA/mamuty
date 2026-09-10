'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Loader2, Plus, X, Trash2, Pencil, Check, Eye, EyeOff } from 'lucide-react';

export default function ProfissionaisPage() {
  const { barbers, deleteBarber, refreshData } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({ name: '', specialty: '', description: '', photo_url: '' });

  const openNewModal = () => {
    setEditingBarber(null);
    setFormData({ name: '', specialty: '', description: '', photo_url: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (barber: any) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name || '',
      specialty: barber.specialties?.join(', ') || barber.role || '',
      description: barber.role || '',
      photo_url: barber.avatarUrl || ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      if (editingBarber) {
        const { error: dbError } = await supabase.from('barbers').update({
          name: formData.name, specialty: formData.specialty,
          description: formData.description, photo_url: formData.photo_url || null
        }).eq('id', editingBarber.id);
        if (dbError) throw dbError;
      } else {
        const { error: dbError } = await supabase.from('barbers').insert({
          name: formData.name, specialty: formData.specialty,
          description: formData.description, photo_url: formData.photo_url || null, active: true
        });
        if (dbError) throw dbError;
      }
      await refreshData();
      setIsModalOpen(false);
      setEditingBarber(null);
    } catch (err: any) { setError(err.message || 'Erro ao salvar'); }
    finally { setIsSubmitting(false); }
  };

  const toggleStatus = async (barber: any) => {
    try {
      const { error } = await supabase.from('barbers').update({ active: !barber.active }).eq('id', barber.id);
      if (error) throw error;
      await refreshData();
    } catch (err) { alert('Erro ao atualizar status.'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir profissional "${name}"?`)) return;
    try { await deleteBarber(id); } catch (err: any) { alert('Erro: ' + (err.message || err)); }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Equipe</h1>
          <p className="text-xs text-slate-400 mt-1">{barbers.filter(b => b.id !== 'any').length} profissional{barbers.filter(b => b.id !== 'any').length === 1 ? '' : 'eis'}</p>
        </div>
        <button onClick={openNewModal} className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
          <Plus className="w-4 h-4" /> Novo Profissional
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {barbers.filter(b => b.id !== 'any').map(barber => {
          const isActive = barber.active !== false;
          return (
            <div key={barber.id} className={`bg-slate-900/60 p-5 rounded-2xl border transition ${isActive ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/30 opacity-60'}`}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-700 shrink-0 relative">
                  <Image src={barber.avatarUrl || 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&q=80'} alt={barber.name} fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg truncate">{barber.name}</h3>
                    {isActive ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Ativo
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" /> Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-400 font-bold mt-0.5">{barber.role}</p>
                  <p className="text-sm text-slate-400 mt-1">{barber.specialties?.join(', ')}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                <button onClick={() => toggleStatus(barber)} className={`px-3 py-1.5 text-[11px] uppercase font-bold rounded-lg transition flex items-center gap-1.5 ${isActive ? 'bg-emerald-500/20 text-emerald-400 hover:bg-rose-500/20 hover:text-rose-400 border border-emerald-500/30 hover:border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'}`}>
                  {isActive ? <><EyeOff className="w-3 h-3" /> Desativar</> : <><Eye className="w-3 h-3" /> Ativar</>}
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditModal(barber)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition flex items-center gap-1 text-xs font-semibold">
                    <Pencil className="w-3.5 h-3.5" /> <span>Editar</span>
                  </button>
                  <button onClick={() => handleDelete(barber.id, barber.name)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition flex items-center gap-1 text-xs">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleSave} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {editingBarber ? <Pencil className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-amber-400" />}
                <h3 className="font-bold text-lg text-white">{editingBarber ? `Editar: ${editingBarber.name}` : 'Novo Profissional'}</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {error && <p className="text-sm text-rose-400 bg-rose-500/10 p-2 rounded">{error}</p>}
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Nome *</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" /></div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Especialidade *</label><input required value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" placeholder="Ex: Degradê e Barba" /></div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Descrição</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none resize-none" rows={2} placeholder="Sobre o profissional..." /></div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">URL da Foto</label><input value={formData.photo_url} onChange={e => setFormData({...formData, photo_url: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" placeholder="https://..." /></div>
            </div>
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition">{isSubmitting ? 'Salvando...' : editingBarber ? 'Atualizar' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
