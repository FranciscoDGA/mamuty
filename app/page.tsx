'use client';

import React, { useState } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';
import { AppProvider, useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { MyAppointments } from '@/components/appointments/MyAppointments';
import { LoyaltyProgram } from '@/components/loyalty/LoyaltyProgram';
import { ReviewsView } from '@/components/reviews/ReviewsView';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { GalleryView } from '@/components/gallery/GalleryView';
import { Appointment, Customer } from '@/lib/types';
import {
  Scissors,
  Star,
  Users,
  X,
  Check,
  Plus,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
} from 'lucide-react';

function MainContent() {
  const {
    activeTab,
    setActiveTab,
    currentCustomer,
    setCurrentCustomer,
    customers,
    addCustomer,
    submitReview,
    salonConfig,
  } = useApp();

  // User Switcher Modal state
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Review Modal state (when triggered from appointment card)
  const [reviewingAppointment, setReviewingAppointment] = useState<Appointment | null>(null);
  const [modalRating, setModalRating] = useState(5);
  const [modalComment, setModalComment] = useState('');
  const [showPromoNotice, setShowPromoNotice] = useState(true);

  const handleCreateCustomerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return;

    const newCust = addCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
    });

    setCurrentCustomer(newCust);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setShowUserSwitcher(false);
  };

  const handleSubmitAppointmentReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingAppointment || !modalComment.trim()) return;

    submitReview({
      appointmentId: reviewingAppointment.id,
      customerName: reviewingAppointment.customerName,
      barberId: reviewingAppointment.barberId,
      barberName: reviewingAppointment.barberName,
      rating: modalRating,
      comment: modalComment.trim(),
      tags: ['Pontualidade', 'Excelente Atendimento'],
    });

    setReviewingAppointment(null);
    setModalComment('');
    alert('Avaliação registrada com sucesso! Muito obrigado.');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070a12] text-slate-100">
      <OfflineIndicator />
      <Header onOpenUserSwitcher={() => setShowUserSwitcher(true)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-24 md:pb-12">
        {/* Salon Info Bar on top */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{salonConfig.address}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{salonConfig.openingHours}</span>
            </span>
          </div>

          <a
            href={`https://wa.me/${salonConfig.whatsappNumber.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Suporte WhatsApp: {salonConfig.whatsappNumber}</span>
          </a>
        </div>

        {/* Special Promo / Story Announcement Card */}
        {showPromoNotice && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-amber-500/50 shadow-md bg-black">
                <img src="/assets/promo-banner.jpg" alt="Mamuty Barbearia" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Aviso da Barbearia &bull; Somente com Hora Marcada
                </span>
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  Atendimento Especial: Cortes Masculinos, Barba e Kids Personalizado
                </h4>
                <p className="text-[11px] text-slate-300">
                  Agende sua vaga com antecedência para garantir seu atendimento sem espera!
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPromoNotice(false)}
              className="text-slate-500 hover:text-white text-xs p-1.5 rounded-lg hover:bg-slate-800 shrink-0 transition"
              title="Fechar aviso"
            >
              ✕
            </button>
          </div>
        )}

        {/* View Switcher */}
        {activeTab === 'agendar' && <BookingWizard />}
        {activeTab === 'fidelidade' && <LoyaltyProgram />}
        {activeTab === 'admin' && (
          <div className="text-center py-12 space-y-4">
            <h2 className="text-xl font-bold text-white">Painel Administrativo Mamuty</h2>
            <p className="text-sm text-slate-400">Acesse a nova área completa de gestão da barbearia.</p>
            <a
              href="/admin"
              className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/20"
            >
              Abrir Painel Admin &rarr;
            </a>
          </div>
        )}
      </main>

      {/* Bottom Navigation for Mobile Devices */}
      <BottomNav />

      {/* USER SWITCHER MODAL */}
      {showUserSwitcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Perfil do Cliente Ativo</h3>
              </div>
              <button
                onClick={() => setShowUserSwitcher(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Alterne entre clientes de exemplo ou cadastre seu próprio perfil para testar o acúmulo de pontos e selos na Barbearia Mamuty.
            </p>

            {/* List of existing demo customers */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {customers.map((c) => {
                const isSelected = currentCustomer?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCurrentCustomer(c);
                      setShowUserSwitcher(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{c.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                          {c.tier}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{c.phone}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-bold text-amber-400 block">
                        {c.loyaltyStamps} Selos
                      </span>
                      <span className="text-[10px] text-slate-400">{c.loyaltyPoints} pts</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create new profile form */}
            <form onSubmit={handleCreateCustomerProfile} className="pt-3 border-t border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-white block">Cadastrar Novo Perfil</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Seu Nome Completo"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Salvar e Ativar Perfil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* APPOINTMENT REVIEW MODAL */}
      {reviewingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleSubmitAppointmentReview}
            className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Avaliar Atendimento</h3>
              <button
                type="button"
                onClick={() => setReviewingAppointment(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Como foi seu corte com <strong className="text-amber-400">{reviewingAppointment.barberName}</strong>?
            </p>

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setModalRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= modalRating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              required
              value={modalComment}
              onChange={(e) => setModalComment(e.target.value)}
              placeholder="Descreva o atendimento, a pontualidade e o resultado do visual..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-hidden focus:border-amber-500 resize-none"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReviewingAppointment(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Enviar Avaliação
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen bg-[#070a12] text-slate-100 items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-pulse">
          <span className="font-extrabold text-sm">M</span>
        </div>
      </div>
    );
  }

  return (
    <MainContent />
  );
}
