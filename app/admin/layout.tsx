'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminLoginPage from './login/page';
import { 
  LayoutDashboard, 
  Users, 
  Scissors, 
  UserCircle, 
  ArrowLeft, 
  Sparkles, 
  Settings, 
  DollarSign,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Loader2,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // If we are directly on the login route, render it without admin wrapper
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If loading auth state, show high-contrast dark loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-slate-400 text-xs tracking-wider uppercase font-bold">
          Verificando credenciais do dono...
        </p>
      </div>
    );
  }

  // If not authenticated, render Login/Cadastro screen directly!
  if (!user) {
    return <AdminLoginPage />;
  }

  const navItems = [
    { href: '/admin', label: 'Agenda & Cadeira', icon: LayoutDashboard },
    { href: '/admin/financeiro', label: 'Financeiro & Caixa', icon: DollarSign },
    { href: '/admin/clientes', label: 'Clientes', icon: Users },
    { href: '/admin/servicos', label: 'Serviços & Produtos', icon: Scissors },
    { href: '/admin/profissionais', label: 'Profissionais', icon: UserCircle },
    { href: '/admin/automacoes', label: 'Automações', icon: Sparkles },
    { href: '/admin/whatsapp', label: 'WhatsApp Monitor', icon: Sparkles },
    { href: '/admin/marketing', label: 'Marketing & QR Code', icon: Sparkles },
    { href: '/admin/ajuda', label: 'Ajuda & Treinamento', icon: HelpCircle, isSpecial: true },
    { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
  ];

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair da área administrativa?')) {
      logout();
      router.push('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col md:flex-row font-sans pb-20 md:pb-0">
      
      {/* ========================================================================= */}
      {/* MOBILE TOP BAR (Optimized 100% for owner's smartphone) */}
      {/* ========================================================================= */}
      <header className="md:hidden bg-slate-900/95 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 active:scale-95"
            aria-label="Abrir Menu Administrativo"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block leading-tight">
              Dono Conectado
            </span>
            <h1 className="text-sm font-extrabold text-white truncate max-w-[170px]">
              {user.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/admin/ajuda"
            className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
              pathname === '/admin/ajuda'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
            title="Central de Ajuda & Treinamento"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-[10px] hidden sm:inline">Ajuda</span>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center gap-1 active:scale-95"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[11px] hidden sm:inline">Sair</span>
          </button>
          <Link
            href="/"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition active:scale-95"
            title="Ir para o Site"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </Link>
        </div>
      </header>

      {/* MOBILE HORIZONTAL NAVIGATION SCROLL BAR (Quick thumb switching on phone) */}
      <div className="md:hidden bg-slate-900/80 border-b border-slate-800/80 px-3 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 sticky top-[57px] z-30 backdrop-blur-md">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-slate-950/60 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT DRAWER */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 h-full p-5 flex flex-col justify-between z-10 shadow-2xl">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Mamuty Admin</h3>
                    <p className="text-[10px] text-amber-400 font-medium">Área Exclusiva do Dono</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Owner Info Chip */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Drawer Navigation List */}
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition active:scale-95 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-600'}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                href="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Voltar à Barbearia</span>
              </Link>
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold transition border border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex w-64 bg-slate-900/90 border-r border-slate-800 p-5 shrink-0 flex-col justify-between gap-6 sticky top-0 h-screen">
        <div className="space-y-6">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-amber-500/50 bg-black flex items-center justify-center shadow-md shrink-0">
              <img src="/logo.png" alt="Mamuty Admin" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                Gestão da Barbearia
              </span>
              <h1 className="text-base font-black text-white tracking-wide flex items-center gap-1.5">
                <span>Mamuty Admin</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </h1>
            </div>
          </div>

          {/* Owner Profile Card */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-white truncate">{user.name}</p>
              <span className="text-[10px] text-amber-400 font-semibold block">Proprietário</span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="flex flex-col gap-1.5 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10'
                      : 'bg-slate-800/30 hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: Back & Logout */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3.5 py-2.5 rounded-xl transition w-full font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Voltar à Barbearia</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2.5 rounded-xl transition w-full font-bold border border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 min-w-0 p-4 md:p-8">
        {children}
      </main>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION DOCK (100% Mobile First Ergonomics) */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 px-3 py-2 z-40 backdrop-blur-lg flex items-center justify-around">
        <Link
          href="/admin"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition active:scale-95 ${
            pathname === '/admin' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Agenda</span>
        </Link>
        <Link
          href="/admin/financeiro"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition active:scale-95 ${
            pathname === '/admin/financeiro' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span>Caixa</span>
        </Link>
        <Link
          href="/admin/clientes"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition active:scale-95 ${
            pathname === '/admin/clientes' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Clientes</span>
        </Link>
        <Link
          href="/admin/servicos"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition active:scale-95 ${
            pathname === '/admin/servicos' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scissors className="w-5 h-5" />
          <span>Serviços</span>
        </Link>
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-amber-400 transition active:scale-95"
        >
          <Menu className="w-5 h-5" />
          <span>Mais</span>
        </button>
      </nav>
      
    </div>
  );
}
