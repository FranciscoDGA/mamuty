'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Scissors, Sparkles, MessageCircle, ShieldCheck, Award } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const pathname = usePathname();

  const isAgendar = pathname === '/' && activeTab === 'agendar';
  const isGaleria = pathname === '/' && activeTab === 'galeria';
  const isFidelidade = pathname === '/' && activeTab === 'fidelidade';
  const isWhatsapp = pathname === '/whatsapp';
  const isAdmin = pathname.startsWith('/admin') || (pathname === '/' && activeTab === 'admin');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800/80 safe-area-pb">
      <nav className="flex items-center justify-around px-1.5 py-1 max-w-md mx-auto">
        {/* Agendar */}
        <Link
          href="/"
          onClick={() => setActiveTab('agendar')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            isAgendar ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition ${
              isAgendar ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
            }`}
          >
            <Scissors className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Agendar</span>
        </Link>

        {/* Galeria */}
        <Link
          href="/"
          onClick={() => setActiveTab('galeria')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            isGaleria ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition ${
              isGaleria ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Galeria</span>
        </Link>

        {/* Fidelidade */}
        <Link
          href="/"
          onClick={() => setActiveTab('fidelidade')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            isFidelidade ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition ${
              isFidelidade ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
            }`}
          >
            <Award className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Fidelidade</span>
        </Link>

        {/* WhatsApp Bot */}
        <Link
          href="/whatsapp"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            isWhatsapp ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition ${
              isWhatsapp ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">WhatsApp</span>
        </Link>

        {/* Painel Admin */}
        <Link
          href="/admin"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            isAdmin ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition ${
              isAdmin ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Admin</span>
        </Link>
      </nav>
    </div>
  );
};
