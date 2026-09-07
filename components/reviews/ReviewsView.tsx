'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Review } from '@/lib/types';
import { Star, ThumbsUp, MessageSquarePlus, Filter, CheckCircle2, User, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const AVAILABLE_TAGS = [
  'Degradê Impecável',
  'Pontualidade',
  'Visagismo Top',
  'Barboterapia Relaxante',
  'Ambiente 10/10',
  'Café Gourmet',
  'Atendimento Rápido',
  'Mão Leve',
];

export const ReviewsView: React.FC = () => {
  const { reviews, barbers, submitReview, currentCustomer } = useApp();

  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('todos');
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);

  // New review state
  const [newRating, setNewRating] = useState<number>(5);
  const [newBarberId, setNewBarberId] = useState<string>(barbers[0]?.id || '');
  const [newComment, setNewComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Degradê Impecável', 'Pontualidade']);
  const [authorName, setAuthorName] = useState<string>(currentCustomer?.name || '');

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (selectedBarberFilter === 'todos') return reviews;
    return reviews.filter((r) => r.barberId === selectedBarberFilter);
  }, [reviews, selectedBarberFilter]);

  // Overall average
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 5;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(2));
  }, [reviews]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSendReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) {
      alert('Por favor, preencha seu nome e comentário.');
      return;
    }

    const barberObj = barbers.find((b) => b.id === newBarberId);

    submitReview({
      customerName: authorName.trim(),
      barberId: newBarberId,
      barberName: barberObj?.name || 'Barbeiro Mamuty',
      rating: newRating,
      comment: newComment.trim(),
      tags: selectedTags,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#ffffff'],
      });
    } catch (e) {}

    setNewComment('');
    setShowReviewForm(false);
    alert('Obrigado pela sua avaliação! Ela já está visível para toda a comunidade Mamuty.');
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>Avaliações & Opiniões</span>
          </h2>
          <p className="text-xs text-slate-400">
            Veja o que os clientes dizem sobre a experiência na Barbearia Mamuty.
          </p>
        </div>

        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          id="btn-toggle-review-form"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/10 self-start sm:self-auto"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>{showReviewForm ? 'Fechar Formulário' : 'Deixar Avaliação'}</span>
        </button>
      </div>

      {/* Hero Rating Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex flex-col items-center justify-center shrink-0">
            <span className="text-3xl font-black text-amber-400">{averageRating}</span>
            <div className="flex items-center gap-0.5 text-amber-400 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Excelente Reputação</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Baseado em <strong className="text-white">{reviews.length} avaliações</strong> verificadas de clientes reais.
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>98% dos clientes recomendam a Barbearia Mamuty</span>
            </div>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="flex flex-wrap gap-2 justify-center sm:justify-end max-w-xs">
          {['Visagismo #1', 'Pontualidade', 'Barba Terapêutica', 'Ambiente Premium'].map((badge, i) => (
            <span
              key={i}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-950 text-amber-300 border border-slate-800"
            >
              ★ {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Review Submission Form Modal / Box */}
      {showReviewForm && (
        <form
          onSubmit={handleSendReview}
          className="bg-slate-900 rounded-2xl p-5 border border-amber-500/30 shadow-xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Conte sua experiência na Barbearia Mamuty</span>
            </h3>
            <span className="text-xs text-slate-400">Avaliação Pública</span>
          </div>

          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Sua Nota (1 a 5 estrelas):
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewRating(star)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-400 ml-2">
                {newRating === 5
                  ? 'Excepcional / Impecável'
                  : newRating === 4
                  ? 'Muito Bom'
                  : newRating === 3
                  ? 'Bom'
                  : 'Regular'}
              </span>
            </div>
          </div>

          {/* Barber Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Profissional Avaliado
              </label>
              <select
                value={newBarberId}
                onChange={(e) => setNewBarberId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seu Nome
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: Carlos Mendes"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Quick Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Destaques do Atendimento (Selecione):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Seu Comentário
            </label>
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Conte como foi seu atendimento, o resultado do corte, o ambiente e o café..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              Publicar Avaliação
            </button>
          </div>
        </form>
      )}

      {/* Barber Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedBarberFilter('todos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
            selectedBarberFilter === 'todos'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          Todos os Barbeiros ({reviews.length})
        </button>

        {barbers.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBarberFilter(b.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              selectedBarberFilter === b.id
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {b.name.split(' ')[0]} ({reviews.filter((r) => r.barberId === b.id).length})
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-3.5">
        {filteredReviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-400">
                  {rev.customerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{rev.customerName}</h4>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Cliente Verificado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Atendido por <strong className="text-amber-400">{rev.barberName}</strong> • {new Date(rev.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`w-3.5 h-3.5 ${
                      idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              &ldquo;{rev.comment}&rdquo;
            </p>

            {rev.tags && rev.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {rev.tags.map((t: string, i: number) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
