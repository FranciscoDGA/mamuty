import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Scissors, UserCircle, ArrowLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col md:flex-row font-sans pb-20 md:pb-0">
      
      {/* Sidebar / Mobile Topbar */}
      <aside className="w-full md:w-64 bg-slate-900/90 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-800 p-4 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Painel de Gestão</span>
            <h1 className="text-xl font-black text-amber-500 tracking-wide">Mamuty Admin</h1>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800/80 px-2.5 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Site</span>
          </Link>
        </div>
        
        {/* Navigation - Horizontal scroll on mobile, vertical stack on desktop */}
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-semibold">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition whitespace-nowrap"
          >
            <LayoutDashboard className="w-4 h-4 text-amber-400" /> Agenda
          </Link>
          <Link
            href="/admin/clientes"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition whitespace-nowrap"
          >
            <Users className="w-4 h-4 text-amber-400" /> Clientes
          </Link>
          <Link
            href="/admin/servicos"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition whitespace-nowrap"
          >
            <Scissors className="w-4 h-4 text-amber-400" /> Serviços
          </Link>
          <Link
            href="/admin/profissionais"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition whitespace-nowrap"
          >
            <UserCircle className="w-4 h-4 text-amber-400" /> Profissionais
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto">
        {children}
      </main>
      
    </div>
  );
}
