'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { Barber, PortfolioPhoto } from '@/lib/types';
import {
  Scissors,
  Heart,
  Search,
  Filter,
  Star,
  Sparkles,
  Share2,
  Calendar,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  Award,
} from 'lucide-react';

export const GalleryView: React.FC = () => {
  const {
    portfolio,
    barbers,
    services,
    toggleLikePortfolio,
    setActiveTab,
    setPreselectedBarberId,
  } = useApp();

  // Filters
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({});

  // Lightbox Modal
  const [activePhoto, setActivePhoto] = useState<PortfolioPhoto | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Categories config
  const categories = [
    { id: 'all', label: 'Todos os Estilos' },
    { id: 'fade', label: 'Degradê & Fade' },
    { id: 'barba', label: 'Barba & Alinhamento' },
    { id: 'classico', label: 'Cortes Clássicos' },
    { id: 'freestyle', label: 'Freestyle & Desenho' },
    { id: 'platinado', label: 'Platinados & Cor' },
  ];

  // Active Barber info if filtered
  const currentFilteredBarber: Barber | undefined = useMemo(() => {
    if (selectedBarberId === 'all') return undefined;
    return barbers.find((b) => b.id === selectedBarberId);
  }, [selectedBarberId, barbers]);

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    return portfolio.filter((item) => {
      // Barber filter
      if (selectedBarberId !== 'all' && item.barberId !== selectedBarberId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTag = item.styleTag.toLowerCase().includes(q);
        const matchesBarber = item.barberName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTag && !matchesBarber) {
          return false;
        }
      }

      return true;
    });
  }, [portfolio, selectedBarberId, selectedCategory, searchQuery]);

  // Handle like toggle
  const handleLike = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!likedPhotos[photoId]) {
      toggleLikePortfolio(photoId);
      setLikedPhotos((prev) => ({ ...prev, [photoId]: true }));
    }
  };

  // Direct CTA to schedule with that barber
  const handleBookWithBarber = (barberId: string) => {
    setPreselectedBarberId(barberId);
    setActiveTab('agendar');
  };

  // Share photo on WhatsApp
  const handleSharePhoto = (photo: PortfolioPhoto) => {
    const text = `Confira esse estilo "${photo.title}" feito pelo barbeiro ${photo.barberName} na Barbearia Mamuty!`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Copy direct link
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b101b] to-slate-950 border border-slate-800/80 p-6 md:p-8">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portfólio Oficial & Galeria de Cortes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight mb-3">
            Inspire-se na Arte dos Nossos Barbeiros
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            Cada corte reflete a assinatura de um especialista. Explore os trabalhos realizados por Matheus Mamuty, Diego Alcantara, Gabriel Santos e Lucas Barreto. Escolha seu estilo e agende direto com o mestre.
          </p>

          {/* Search bar */}
          <div className="mt-6 flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-1.5 focus-within:border-amber-500/60 transition max-w-lg">
            <div className="pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="input-gallery-search"
              placeholder="Buscar por corte, degradê, barba, fade, pompadour..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none px-2 py-1"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter 1: Barber Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-200 uppercase tracking-wider">
              Filtrar por Barbeiro
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {filteredPhotos.length} foto{filteredPhotos.length !== 1 ? 's' : ''} encontrada{filteredPhotos.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* All Barbers Button */}
          <button
            onClick={() => setSelectedBarberId('all')}
            id="filter-barber-all"
            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
              selectedBarberId === 'all'
                ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-sm'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition shrink-0 ${
              selectedBarberId === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <Scissors className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate">Todos os Mestres</span>
              <span className="text-[10px] text-slate-400 block">
                {portfolio.length} cortes
              </span>
            </div>
          </button>

          {/* Individual Barbers */}
          {barbers.map((barber) => {
            const barberPhotosCount = portfolio.filter((p) => p.barberId === barber.id).length;
            const isSelected = selectedBarberId === barber.id;

            return (
              <button
                key={barber.id}
                onClick={() => setSelectedBarberId(barber.id)}
                id={`filter-barber-${barber.id}`}
                className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left transition ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-700">
                  <Image
                    src={barber.avatarUrl}
                    alt={barber.name}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-500/20 border-2 border-amber-400 rounded-xl" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate leading-tight">
                    {barber.name.replace('Matheus "Mamuty" Rocha', 'Matheus Mamuty')}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {barberPhotosCount} fotos • {barber.rating}★
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter 2: Style & Categories pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              id={`filter-cat-${cat.id}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Barber Spotlight Banner (Active when 1 barber is specifically selected) */}
      {currentFilteredBarber && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-md shrink-0">
              <Image
                src={currentFilteredBarber.avatarUrl}
                alt={currentFilteredBarber.name}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  {currentFilteredBarber.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
                  {currentFilteredBarber.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                {currentFilteredBarber.bio}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold mr-2">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {currentFilteredBarber.rating} ({currentFilteredBarber.reviewsCount} avaliações)
                </span>
                {currentFilteredBarber.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <button
              onClick={() => handleBookWithBarber(currentFilteredBarber.id)}
              id={`btn-book-barber-${currentFilteredBarber.id}`}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition"
            >
              <Scissors className="w-4 h-4" />
              <span>Agendar com {currentFilteredBarber.name.split(' ')[0]}</span>
            </button>
            <button
              onClick={() => setSelectedBarberId('all')}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              title="Ver todos os barbeiros"
            >
              Ver Todos
            </button>
          </div>
        </div>
      )}

      {/* Gallery Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200 mb-1">
            Nenhum estilo encontrado
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Não encontramos fotos com os filtros atuais. Tente selecionar outro profissional ou categoria.
          </p>
          <button
            onClick={() => {
              setSelectedBarberId('all');
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition"
          >
            Limpar Todos os Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => {
            const isLiked = likedPhotos[photo.id];

            return (
              <div
                key={photo.id}
                onClick={() => setActivePhoto(photo)}
                id={`card-photo-${photo.id}`}
                className="group relative bg-slate-900/80 border border-slate-800/90 rounded-2xl overflow-hidden hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <Image
                    src={photo.imageUrl}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-amber-300">
                      {photo.styleTag}
                    </span>

                    {/* Like button */}
                    <button
                      onClick={(e) => handleLike(photo.id, e)}
                      id={`btn-like-${photo.id}`}
                      className={`pointer-events-auto p-2 rounded-full backdrop-blur-md border transition flex items-center gap-1 text-xs font-bold ${
                        isLiked
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                          : 'bg-slate-950/60 border-slate-700/60 text-slate-300 hover:text-rose-400 hover:border-rose-500/40'
                      }`}
                      title="Curtir estilo"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition ${
                          isLiked ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                      <span>{photo.likesCount}</span>
                    </button>
                  </div>

                  {/* Barber pill inside image bottom-left */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-amber-400/60 shrink-0">
                      <Image
                        src={photo.barberAvatar}
                        alt={photo.barberName}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-200 drop-shadow-sm">
                      {photo.barberName}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                      {photo.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {photo.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {photo.suggestedServiceName ? (
                      <span className="text-[11px] text-amber-400/90 font-medium truncate">
                        {photo.suggestedServiceName}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Corte profissional</span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookWithBarber(photo.barberId);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-[11px] transition flex items-center gap-1 shrink-0"
                    >
                      <span>Quero este</span>
                      <Scissors className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-slate-950/70 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Big Image View */}
            <div className="relative w-full lg:w-3/5 bg-black h-72 sm:h-96 lg:h-auto min-h-[300px]">
              <Image
                src={activePhoto.imageUrl}
                alt={activePhoto.title}
                fill
                className="object-contain lg:object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-3 left-3">
                <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-bold text-amber-300">
                  {activePhoto.styleTag}
                </span>
              </div>
            </div>

            {/* Right: Detailed Info & Booking CTA */}
            <div className="w-full lg:w-2/5 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-5">
              <div className="space-y-4">
                {/* Barber Profile Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-500/40 shrink-0">
                    <Image
                      src={activePhoto.barberAvatar}
                      alt={activePhoto.barberName}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-400">Criado por</h4>
                    <span className="text-sm font-bold text-slate-100 block">
                      {activePhoto.barberName}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 leading-snug">
                    {activePhoto.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    {activePhoto.description}
                  </p>
                </div>

                {/* Recommended Service Box */}
                {activePhoto.suggestedServiceName && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Serviço Recomendado</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      {activePhoto.suggestedServiceName}
                    </p>
                  </div>
                )}

                {/* Social Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleLike(activePhoto.id)}
                    className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition ${
                      likedPhotos[activePhoto.id]
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-rose-400'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        likedPhotos[activePhoto.id] ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                    <span>{activePhoto.likesCount} Curtidas</span>
                  </button>

                  <button
                    onClick={() => handleSharePhoto(activePhoto)}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition"
                    title="Compartilhar no WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition"
                    title="Copiar Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <ExternalLink className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action: Book This Style */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    handleBookWithBarber(activePhoto.barberId);
                    setActivePhoto(null);
                  }}
                  id="btn-modal-book-cut"
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Scissors className="w-4 h-4" />
                  <span>Agendar Este Estilo com {activePhoto.barberName.split(' ')[0]}</span>
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  Você será direcionado para escolher data e horário com confirmação imediata.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
