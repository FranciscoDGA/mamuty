'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { BookingWizard } from '@/components/booking/BookingWizard';
import ShareBookingLink from '@/components/ShareBookingLink';
import { Appointment } from '@/lib/types';
import {
  ChevronLeft,
  Star,
  X,
  Users,
  MapPin,
  Clock,
  Phone,
  Share2,
  QrCode,
} from 'lucide-react';

export default function AgendarPage() {
  const { 
    salonConfig,
    currentCustomer,
    setCurrentCustomer,
    customers,
    addCustomer,
    submitReview,
  } = useApp();

  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [reviewingAppointment, setReviewingAppointment] = useState<Appointment | null>(null);
  const [modalRating, setModalRating] = useState(5);
  const [modalComment, setModalComment] = useState('');

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
      
      {/* Header Simples */}
      <header className="sticky top-0 z-40 w-full bg-[#090d16]/95 backdrop-blur-lg border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Voltar</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-500/50 bg-black shadow-md shadow-amber-500/20">
              <img src="/logo.png" alt="Mamuty" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-sm tracking-wider text-white">MAMUTY</span>
              <span className="text-[10px] text-amber-400 font-semibold ml-1.5">Agendar</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />
            {currentCustomer && (
              <button
                onClick={() => setShowUserSwitcher(true)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition"
                title="Trocar cliente"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  {currentCustomer.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-slate-200 hidden sm:block">
                  {currentCustomer.name.split(' ')[0]}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Salon Info Bar */}
      <div className="bg-slate-900/40 border-b border-slate-800/60 px-4 py-2">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" />
              {salonConfig.address}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              {salonConfig.openingHours}
            </span>
          </div>
          <a
            href={`https://wa.me/${salonConfig.whatsappNumber.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <Phone className="w-3 h-3" />
            Suporte
          </a>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-8">
        <BookingWizard />
        
        {/* Share Section */}
        <div className="mt-8">
          <ShareBookingLink />
        </div>
      </main>

      {/* Footer Simples */}
      <footer className="bg-[#090d16] border-t border-slate-800/80 py-4 px-4 text-center">
        <p className="text-[11px] text-slate-500">
          ~Mamuty barbearia estilo forte. &bull; Cumaru do Norte - PA
        </p>
      </footer>

      {/* USER SWITCHER MODAL */}
      {showUserSwitcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Perfil do Cliente</h3>
              </div>
              <button
                onClick={() => setShowUserSwitcher(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                    </div>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCreateCustomerProfile} className="pt-3 border-t border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-white block">Novo Perfil</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Seu Nome"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
                <input
                  type="tel"
                  required
                  placeholder="(94) 99999-9999"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Salvar Perfil
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}