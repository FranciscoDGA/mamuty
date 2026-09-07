'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import {
  Scissors,
  ShieldCheck,
  Menu,
  X,
  MessageCircle,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  ChevronRight,
  Download,
} from 'lucide-react';

export const Header: React.FC<{ onOpenUserSwitcher?: () => void }> = ({ onOpenUserSwitcher }) => {
  const { activeTab, setActiveTab, currentCustomer, salonConfig } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route or tab change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, activeTab]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={() => {
            setActiveTab('agendar');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 text-left group transition shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wider text-white">MAMUTY</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Barbearia
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {salonConfig.tagline || 'Excelência em Cabelo, Barba e Estilo'}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <Link
            href="/"
            onClick={() => setActiveTab('agendar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              pathname === '/' && activeTab === 'agendar'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Agendar Horário
          </Link>

          <Link
            href="/whatsapp"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              pathname === '/whatsapp'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp Bot</span>
          </Link>

          <Link
            href="/admin"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              pathname.startsWith('/admin')
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Painel Admin</span>
          </Link>
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-2">
          <PWAInstallButton />

          {currentCustomer && (
            <button
              onClick={onOpenUserSwitcher}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition"
              title="Trocar cliente ativo"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                {currentCustomer.name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <span className="text-xs font-semibold text-slate-200 block truncate max-w-[100px]">
                  {currentCustomer.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  {currentCustomer.tier}
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-amber-400 hover:border-slate-700 transition focus:outline-hidden"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Hamburger Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 md:hidden bg-black/80 backdrop-blur-md animate-in fade-in duration-200 flex flex-col justify-between">
          <div className="bg-[#090d16] border-b border-slate-800 p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Quick Profile Summary if logged in */}
            {currentCustomer && (
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenUserSwitcher?.();
                }}
                className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                    {currentCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{currentCustomer.name}</h4>
                    <p className="text-xs text-slate-400">{currentCustomer.phone}</p>
                  </div>
                </div>
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md font-bold">
                  {currentCustomer.tier}
                </span>
              </div>
            )}

            {/* Menu Links */}
            <div className="space-y-2">
              <Link
                href="/"
                onClick={() => {
                  setActiveTab('agendar');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  pathname === '/' && activeTab === 'agendar'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-white">Agendar Horário</span>
                    <span className="text-xs text-slate-400">Escolha serviço, barbeiro e horário</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/whatsapp"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  pathname === '/whatsapp'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">WhatsApp Bot</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                        Sprint 3
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Simulação de agendamento por chat</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  pathname.startsWith('/admin')
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Painel Administrativo</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">
                        Gestão
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Agenda, clientes, serviços e barbeiros</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>

            {/* Install PWA Option on Mobile */}
            <div className="pt-2">
              <PWAInstallButton />
            </div>

            {/* Salon Info on Mobile Drawer */}
            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{salonConfig.address || 'Av. Paulista, 1842 - Bela Vista, SP'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{salonConfig.openingHours || 'Segunda a Sábado: 09:00 às 20:30'}</span>
              </div>
              <a
                href={`https://wa.me/${(salonConfig.whatsappNumber || '5511987654321').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 font-semibold pt-1"
              >
                <Phone className="w-4 h-4" />
                <span>Suporte WhatsApp: {salonConfig.whatsappNumber}</span>
              </a>
            </div>
          </div>

          {/* Background backdrop click to close */}
          <div
            className="flex-1 w-full"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}
    </header>
  );
};
