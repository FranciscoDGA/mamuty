import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Scissors, UserCircle } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-4 shrink-0 flex flex-col gap-2">
        <div className="mb-4">
          <h1 className="text-xl font-extrabold text-amber-500">Mamuty Admin</h1>
        </div>
        
        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition whitespace-nowrap">
            <LayoutDashboard className="w-4 h-4" /> Agenda
          </Link>
          <Link href="/admin/clientes" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition whitespace-nowrap">
            <Users className="w-4 h-4" /> Clientes
          </Link>
          <Link href="/admin/servicos" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition whitespace-nowrap">
            <Scissors className="w-4 h-4" /> Serviços
          </Link>
          <Link href="/admin/profissionais" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition whitespace-nowrap">
            <UserCircle className="w-4 h-4" /> Profissionais
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
    </div>
  );
}
