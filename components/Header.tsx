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
  DollarSign,
  Settings,
  Award
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
    <header className="sticky top-0 z-40 w-full bg-[#090d16] border-b border-slate-800/80">
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
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500/50 bg-black flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
            <img 
              src="/logo.png" 
              alt="Logo Mamuty Barbearia" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-wider text-white">MAMUTY</span>
              <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-500/40">
                Barbearia
              </span>
            </div>
            <p className="text-[11px] text-amber-400/90 font-medium hidden sm:block">
              {salonConfig.tagline || '~Mamuty barbearia estilo forte.'}
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
            href="/"
            onClick={() => setActiveTab('fidelidade')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              pathname === '/' && activeTab === 'fidelidade'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Clube Fidelidade</span>
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
        <div className="fixed inset-0 z-[100] md:hidden bg-[#070a12]/98 flex flex-col">
          {/* Top Bar of Drawer */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0 bg-[#090d16]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-500/50 bg-black flex items-center justify-center shadow-md shrink-0">
                <img src="/logo.png" alt="Mamuty" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-black text-base tracking-wider text-white block leading-tight">MAMUTY</span>
                <span className="text-[10px] text-amber-400 font-semibold">Estilo Forte &bull; Cumaru do Norte</span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Fechar Menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            {/* Quick Profile Summary */}
            {currentCustomer && (
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenUserSwitcher?.();
                }}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
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
                <div className="text-right">
                  <span className="text-xs bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-lg font-bold block">
                    {currentCustomer.tier}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Trocar perfil</span>
                </div>
              </div>
            )}

            {/* Navigation Links */}
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
                    : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:bg-slate-800'
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
                href="/"
                onClick={() => {
                  setActiveTab('fidelidade');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  pathname === '/' && activeTab === 'fidelidade'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-white">Clube Fidelidade</span>
                    <span className="text-xs text-slate-400">Consulte seus selos apenas com seu celular</span>
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
                    : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Assistente WhatsApp (IA)</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                        Online
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Tire dúvidas e marque por mensagem</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/admin/financeiro"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  pathname === '/admin/financeiro'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Financeiro & Caixa</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                        Gestão
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Faturamento, despesas e comissões</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  pathname === '/admin'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-white">Painel Administrativo</span>
                    <span className="text-xs text-slate-400">Agenda, clientes, barbeiros e serviços</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/admin/configuracoes"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  pathname === '/admin/configuracoes'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-white">Configurações da Barbearia</span>
                    <span className="text-xs text-slate-400">Horários, tom de voz da IA e WhatsApp</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>

            {/* PWA Install */}
            <div className="pt-2">
              <PWAInstallButton />
            </div>

            {/* Salon Info */}
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
        </div>
      )}
    </header>
  );
};
