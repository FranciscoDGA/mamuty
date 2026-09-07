import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Scissors, UserCircle, ArrowLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-b md:border-b-0 md:border-r border-slate-800 p-5 shrink-0 flex flex-col justify-between gap-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block">Gestão</span>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Mamuty Admin</h1>
            </div>
            <Link
              href="/"
              className="md:hidden flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Site
            </Link>
          </div>
          
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none text-xs font-semibold">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition whitespace-nowrap"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" />
              <span>Agenda</span>
            </Link>
            <Link
              href="/admin/clientes"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Clientes</span>
            </Link>
            <Link
              href="/admin/servicos"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition whitespace-nowrap"
            >
              <Scissors className="w-4 h-4 text-amber-400" />
              <span>Serviços</span>
            </Link>
            <Link
              href="/admin/profissionais"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition whitespace-nowrap"
            >
              <UserCircle className="w-4 h-4 text-amber-400" />
              <span>Profissionais</span>
            </Link>
          </nav>
        </div>

        <div className="hidden md:block pt-4 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3.5 py-2.5 rounded-xl transition w-full"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Voltar à Barbearia</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 md:p-8">
        {children}
      </main>
      
    </div>
  );
}
