'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Service } from '@/lib/types';
import { Plus, X, Trash2, Scissors, Package, Pencil, Check, Eye, EyeOff } from 'lucide-react';

export default function ServicosPage() {
  const { services, deleteService, refreshData } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'servico' | 'produto'>('all');

  const [formData, setFormData] = useState({
    name: '', type: 'servico', category: 'cabelo', description: '',
    price: '', duration_minutes: '30', pointsReward: '20', popular: false, stock: 'Em estoque'
  });

  const openNewModal = () => {
    setEditingItem(null);
    setFormData({ name: '', type: 'servico', category: 'cabelo', description: '', price: '', duration_minutes: '30', pointsReward: '20', popular: false, stock: 'Em estoque' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Service) => {
    setEditingItem(item);
    const isProduct = item.description?.includes('[PRODUTO]') || item.category === 'produtos';
    let cleanDesc = item.description?.replace('[PRODUTO]', '').trim() || '';
    const popularMatch = cleanDesc.includes('[POPULAR]');
    cleanDesc = cleanDesc.replace('[POPULAR]', '').trim();
    const ptsMatch = cleanDesc.match(/\[PTS:(\d+)\]/);
    const points = ptsMatch ? ptsMatch[1] : (item.pointsReward?.toString() || '20');
    cleanDesc = cleanDesc.replace(/\[PTS:\d+\]/, '').trim();
    const stockMatch = cleanDesc.match(/\[ESTOQUE:([^\]]+)\]/);
    const stock = stockMatch ? stockMatch[1] : 'Em estoque';
    cleanDesc = cleanDesc.replace(/\[ESTOQUE:[^\]]+\]/, '').trim();
    const catMatch = cleanDesc.match(/\[CAT:([^\]]+)\]/);
    const cat = catMatch ? catMatch[1] : (item.category || (isProduct ? 'produtos' : 'cabelo'));
    cleanDesc = cleanDesc.replace(/\[CAT:[^\]]+\]/, '').trim();
    setFormData({ name: item.name, type: isProduct ? 'produto' : 'servico', category: cat, description: cleanDesc, price: item.price.toString(), duration_minutes: item.durationMinutes?.toString() || '0', pointsReward: points, popular: popularMatch || !!item.popular, stock });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isProduct = formData.type === 'produto';
      const parts: string[] = [];
      if (isProduct) parts.push('[PRODUTO]');
      if (formData.popular) parts.push('[POPULAR]');
      if (formData.category) parts.push(`[CAT:${formData.category}]`);
      if (formData.pointsReward) parts.push(`[PTS:${formData.pointsReward}]`);
      if (isProduct && formData.stock) parts.push(`[ESTOQUE:${formData.stock}]`);
      if (formData.description) parts.push(formData.description.trim());
      const fullDescription = parts.join(' ').trim();
      const numPrice = parseFloat(formData.price || '0');
      const numDuration = isProduct ? 0 : parseInt(formData.duration_minutes || '30');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingItem?.id || '');

      if (editingItem) {
        if (isUUID) {
          try { await supabase.from('services').update({ name: formData.name.trim(), description: fullDescription, price: numPrice, duration_minutes: numDuration }).eq('id', editingItem.id); } catch (e) { console.warn(e); }
        }
        editingItem.name = formData.name.trim(); editingItem.description = fullDescription;
        editingItem.price = numPrice; editingItem.durationMinutes = numDuration;
        editingItem.popular = formData.popular; editingItem.pointsReward = parseInt(formData.pointsReward || '0');
        editingItem.category = formData.category as any;
      } else {
        try { await supabase.from('services').insert({ name: formData.name.trim(), description: fullDescription, price: numPrice, duration_minutes: numDuration, active: true }); } catch (e) { console.warn(e); }
      }
      await refreshData();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) { console.warn(err); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    try { await deleteService(id); } catch (err: any) { alert('Erro: ' + (err.message || err)); }
  };

  const toggleStatus = async (item: Service) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
    if (isUUID) {
      try { await supabase.from('services').update({ active: !item.active }).eq('id', item.id); } catch (e) { console.warn(e); }
    }
    await refreshData();
  };

  const startInlineEdit = (id: string, field: string, currentValue: string) => {
    setEditingField({ id, field });
    setEditValue(currentValue);
  };

  const saveInlineEdit = async (item: Service) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
    const field = editingField!.field;
    const val = field === 'price' ? parseFloat(editValue || '0') : parseInt(editValue || '0');
    if (isUUID) {
      try { await supabase.from('services').update({ [field]: val }).eq('id', item.id); } catch (e) { console.warn(e); }
    }
    item[field === 'price' ? 'price' : 'durationMinutes'] = val;
    await refreshData();
    setEditingField(null);
  };

  const filteredItems = services.filter(item => {
    const isProduct = item.description?.includes('[PRODUTO]');
    if (activeFilter === 'servico') return !isProduct;
    if (activeFilter === 'produto') return isProduct;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Serviços & Produtos</h1>
          <p className="text-xs text-slate-400 mt-1">{services.length} item{services.length === 1 ? '' : 's'} cadastrado{services.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={openNewModal} className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
          <Plus className="w-4 h-4" /> Novo Serviço/Produto
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs font-semibold bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
        {[
          { key: 'all' as const, label: `Todos (${services.length})` },
          { key: 'servico' as const, label: 'Serviços', icon: Scissors },
          { key: 'produto' as const, label: 'Produtos', icon: Package },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${activeFilter === tab.key ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}>
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-800/50">
          {filteredItems.map(item => {
            const isProduct = item.description?.includes('[PRODUTO]');
            const cleanDesc = item.description?.replace('[PRODUTO]', '').replace(/\[[^\]]+\]/g, '').trim();
            return (
              <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-800/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ${isProduct ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {isProduct ? 'Produto' : 'Serviço'}
                    </span>
                    <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                    {item.popular && <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold shrink-0">Destaque</span>}
                  </div>
                  {cleanDesc && <p className="text-[11px] text-slate-500 mt-1 truncate">{cleanDesc}</p>}
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  {/* Inline Price Edit */}
                  {editingField?.id === item.id && editingField.field === 'price' ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">R$</span>
                      <input type="number" step="0.01" value={editValue} onChange={e => setEditValue(e.target.value)}
                        className="w-16 bg-slate-950 border border-amber-500 rounded-lg px-2 py-1 text-xs text-white outline-none" autoFocus
                        onBlur={() => saveInlineEdit(item)} onKeyDown={e => e.key === 'Enter' && saveInlineEdit(item)} />
                    </div>
                  ) : (
                    <button onClick={() => startInlineEdit(item.id, 'price', item.price.toString())}
                      className="bg-slate-950 px-2.5 py-1 rounded-lg text-emerald-400 font-bold text-xs border border-slate-800 hover:border-amber-500 transition cursor-pointer" title="Clique para editar preço">
                      R$ {item.price}
                    </button>
                  )}

                  {/* Inline Duration Edit */}
                  {!isProduct && (editingField?.id === item.id && editingField.field === 'duration_minutes' ? (
                    <div className="flex items-center gap-1">
                      <input type="number" step="5" value={editValue} onChange={e => setEditValue(e.target.value)}
                        className="w-12 bg-slate-950 border border-amber-500 rounded-lg px-2 py-1 text-xs text-white outline-none" autoFocus
                        onBlur={() => saveInlineEdit(item)} onKeyDown={e => e.key === 'Enter' && saveInlineEdit(item)} />
                      <span className="text-[10px] text-slate-500">min</span>
                    </div>
                  ) : (
                    <button onClick={() => startInlineEdit(item.id, 'duration_minutes', item.durationMinutes?.toString() || '0')}
                      className="bg-slate-950 px-2.5 py-1 rounded-lg text-slate-400 text-xs border border-slate-800 hover:border-amber-500 transition cursor-pointer font-mono" title="Clique para editar duração">
                      ⏱ {item.durationMinutes} min
                    </button>
                  ))}

                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition" title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 rounded-lg bg-slate-950 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 transition" title="Excluir">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Package className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm">Nenhum item encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form onSubmit={handleSave} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {editingItem ? <Pencil className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-amber-400" />}
                <h3 className="font-bold text-lg text-white">{editingItem ? `Editar: ${editingItem.name}` : 'Novo Serviço ou Produto'}</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'servico' })} className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${formData.type === 'servico' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}><Scissors className="w-3.5 h-3.5" /> Serviço</button>
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'produto' })} className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${formData.type === 'produto' ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}><Package className="w-3.5 h-3.5" /> Produto</button>
                </div>
              </div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Nome *</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" /></div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Descrição</label><textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">Preço (R$) *</label><input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" /></div>
                {formData.type === 'servico' ? (
                  <div><label className="text-xs font-bold text-slate-400 mb-1 block">Duração (min) *</label><input required type="number" step="5" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" /></div>
                ) : (
                  <div><label className="text-xs font-bold text-slate-400 mb-1 block">Estoque</label><input value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" /></div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Categoria</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none">
                    {formData.type === 'servico' ? (<><option value="cabelo">Cabelo</option><option value="barba">Barba</option><option value="combos">Combos</option><option value="tratamentos">Tratamentos</option></>) : (<><option value="produtos">Produtos</option><option value="combos">Kits</option></>)}
                  </select>
                </div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">Pontos Fidelidade</label><input type="number" value={formData.pointsReward} onChange={e => setFormData({...formData, pointsReward: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" /></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <input type="checkbox" checked={formData.popular} onChange={e => setFormData({...formData, popular: e.target.checked})} className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900" />
                <span className="text-xs font-semibold text-white">Marcar como Destaque</span>
              </label>
            </div>
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition">{isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
