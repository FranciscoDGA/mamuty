'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, X, Trash2, Scissors, Package, Check } from 'lucide-react';

export default function ServicosPage() {
  const { services, refreshData } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'servico' | 'produto'>('all');

  const [formData, setFormData] = useState({
    name: '',
    type: 'servico', // 'servico' or 'produto'
    description: '',
    price: '',
    duration_minutes: '30'
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const descriptionWithType = formData.type === 'produto' 
        ? `[PRODUTO] ${formData.description}` 
        : formData.description;

      const { error: dbError } = await supabase.from('services').insert({
        name: formData.name,
        description: descriptionWithType,
        price: parseFloat(formData.price),
        duration_minutes: formData.type === 'produto' ? 0 : parseInt(formData.duration_minutes || '30'),
        active: true
      });

      if (dbError) throw dbError;

      await refreshData();
      setIsModalOpen(false);
      setFormData({ name: '', type: 'servico', description: '', price: '', duration_minutes: '30' });
      alert(formData.type === 'produto' ? 'Produto cadastrado com sucesso!' : 'Serviço cadastrado com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente "${name}"?`)) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
      alert(`"${name}" foi excluído com sucesso.`);
    } catch (err: any) {
      alert('Erro ao excluir: ' + (err.message || err));
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('services').update({ active: !currentStatus }).eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (err) {
      alert('Erro ao atualizar status.');
    }
  };

  const filteredItems = services.filter(item => {
    const isProduct = item.description?.includes('[PRODUTO]');
    if (activeFilter === 'servico') return !isProduct;
    if (activeFilter === 'produto') return isProduct;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Serviços & Produtos</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre, edite ou exclua serviços da barbearia e produtos para venda
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" /> Novo Serviço ou Produto
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs font-semibold bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Todos ({services.length})
        </button>
        <button
          onClick={() => setActiveFilter('servico')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
            activeFilter === 'servico' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Serviços</span>
        </button>
        <button
          onClick={() => setActiveFilter('produto')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
            activeFilter === 'produto' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Produtos de Venda</span>
        </button>
      </div>
      
      {/* Grid of Services & Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const isProduct = item.description?.includes('[PRODUTO]');
          const cleanDescription = item.description?.replace('[PRODUTO]', '').trim();

          return (
            <div 
              key={item.id} 
              className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between gap-4 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md inline-block mb-1.5 ${
                      isProduct ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isProduct ? 'Produto' : 'Serviço'}
                    </span>
                    <h3 className="font-bold text-white text-lg">{item.name}</h3>
                  </div>

                  <span className="bg-slate-950 px-3 py-1 rounded-xl text-emerald-400 font-extrabold text-sm border border-slate-800">
                    R$ {item.price}
                  </span>
                </div>

                {cleanDescription && (
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cleanDescription}</p>
                )}

                <div className="flex items-center gap-3 mt-3 text-xs">
                  {!isProduct && (
                    <span className="bg-slate-950 px-2.5 py-1 rounded-lg text-slate-400 border border-slate-800 font-mono">
                      ⏱ {item.durationMinutes} min
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <button 
                  onClick={() => toggleStatus(item.id, true)}
                  title="Desativar item"
                  className="bg-emerald-500/20 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 px-3 py-1 text-[10px] uppercase font-bold rounded-lg transition"
                >
                  Ativo
                </button>

                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="p-2 rounded-lg bg-slate-950 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 hover:border-rose-500 transition flex items-center gap-1 text-xs"
                  title="Excluir item permanentemente"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-2 p-12 text-center text-slate-500 space-y-2 bg-slate-900/30 rounded-2xl border border-slate-800">
            <Package className="w-10 h-10 mx-auto text-slate-700" />
            <p className="text-sm">Nenhum item encontrado nesta categoria.</p>
          </div>
        )}
      </div>

      {/* Modal: Novo Serviço ou Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form onSubmit={handleCreate} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white">Cadastrar Serviço ou Produto</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <p className="text-sm text-rose-400 bg-rose-500/10 p-2 rounded">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Tipo de Cadastro</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'servico' })}
                    className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      formData.type === 'servico' 
                        ? 'bg-amber-500 text-slate-950 border-amber-400' 
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Serviço</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'produto' })}
                    className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      formData.type === 'produto' 
                        ? 'bg-indigo-500 text-white border-indigo-400' 
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Produto de Venda</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  {formData.type === 'produto' ? 'Nome do Produto' : 'Nome do Serviço'}
                </label>
                <input 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" 
                  placeholder={formData.type === 'produto' ? 'Ex: Pomada Modeladora Efeito Matte' : 'Ex: Corte Masculino Degradê'} 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Descrição / Detalhes</label>
                <textarea 
                  rows={2} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" 
                  placeholder={formData.type === 'produto' ? 'Ex: Fixação forte e sem brilho, pote de 100g' : 'Ex: Acabamento detalhado com tesoura e navalha'} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Preço (R$)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" 
                    placeholder="35.00" 
                  />
                </div>

                {formData.type === 'servico' && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Duração (Minutos)</label>
                    <input 
                      required 
                      type="number" 
                      step="5" 
                      value={formData.duration_minutes} 
                      onChange={e => setFormData({...formData, duration_minutes: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" 
                      placeholder="40" 
                    />
                  </div>
                )}
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
                {isSubmitting ? 'Cadastrando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
