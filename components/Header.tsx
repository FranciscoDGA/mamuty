'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { ShieldCheck, User, Scissors, Sparkles } from 'lucide-react';

export const Header: React.FC<{ onOpenUserSwitcher?: () => void }> = ({ onOpenUserSwitcher }) => {
  const { activeTab, setActiveTab, currentCustomer, salonConfig } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <button
          onClick={() => setActiveTab('agendar')}
          className="flex items-center gap-2.5 text-left group transition"
          id="btn-logo-home"
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
              {salonConfig.tagline}
            </p>
          </div>
        </button>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('agendar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'agendar'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Agendar Horário
          </button>
          
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Painel Admin
          </button>
        </nav>

        {/* Right Actions: Install PWA + User Switcher + Admin Toggle */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Customer Profile Pill */}
          {currentCustomer && (
            <button
              onClick={onOpenUserSwitcher}
              id="btn-customer-profile"
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

          {/* Admin Mode Button */}
          <button
            onClick={() => setActiveTab('admin')}
            id="btn-admin-tab"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Painel Admin</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
