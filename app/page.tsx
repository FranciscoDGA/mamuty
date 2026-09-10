'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useApp } from '@/context/AppContext';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import {
  MapPin,
  Clock,
  Calendar,
  ChevronRight,
} from 'lucide-react';

export default function Home() {
  const isMounted = useIsMounted();
  const { salonConfig } = useApp();
  const router = useRouter();
  
  // Acesso secreto: toque 5x no logo (usando refs para confiabilidade)
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showAdminHint, setShowAdminHint] = useState(false);

  const handleSecretTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    // Reset se passou mais de 1.5 segundos
    if (timeDiff > 1500) {
      tapCountRef.current = 1;
    } else {
      tapCountRef.current++;
    }
    
    lastTapRef.current = now;
    
    // Limpar timer anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Mostrar hint no 3º toque
    if (tapCountRef.current === 3) {
      setShowAdminHint(true);
    }
    
    // Verificar se chegou a 5 toques
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setShowAdminHint(false);
      router.push('/admin/login');
      return;
    }
    
    // Reset após 2 segundos
    timerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      setShowAdminHint(false);
    }, 2000);
  }, [router]);

  // Cleanup do timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen bg-[#070a12] text-slate-100 items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-pulse">
          <span className="font-extrabold text-lg">M</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#070a12] text-slate-100">
      <OfflineIndicator />

      {/* Main Content — Centered Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col items-center text-center space-y-8">
          {/* Logo - Toque 5x para Admin */}
          <div className="relative">
            <div 
              onClick={handleSecretTap}
              onTouchEnd={handleSecretTap}
              className="w-28 h-28 rounded-full overflow-hidden border-3 border-amber-500/60 bg-black shadow-2xl shadow-amber-500/20 cursor-pointer active:scale-95 transition-transform select-none touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <img src="/logo.png" alt="Mamuty Barbearia" className="w-full h-full object-cover pointer-events-none" />
            </div>
            {/* Hint secreto */}
            {showAdminHint && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[10px] text-amber-400/60 font-medium">Mais 2 toques...</span>
              </div>
            )}
          </div>

          {/* Brand */}
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-widest">
              MAMUTY
            </h1>
            <p className="text-lg sm:text-xl font-extrabold text-amber-400 tracking-[0.3em] uppercase">
              Barbearia
            </p>
          </div>

          {/* Tagline */}
          <p className="text-base text-slate-300 font-medium">
            Seu horário começa aqui.
          </p>

          {/* CTA */}
          <Link
            href="/agendar"
            className="w-full max-w-xs py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.97]"
          >
            <Calendar className="w-5 h-5" />
            <span>Agendar Horário</span>
            <ChevronRight className="w-5 h-5" />
          </Link>

          {/* Info */}
          <div className="w-full space-y-3 pt-4 border-t border-slate-800/60">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Hoje: {salonConfig.openingHours}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>{salonConfig.address}</span>
            </div>
          </div>

          {/* PWA Install */}
          <div className="pt-2">
            <PWAInstallButton variant="full" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center space-y-2">
        <p className="text-[11px] text-slate-600">
          ~Mamuty barbearia estilo forte. &bull; Cumaru do Norte - PA
        </p>
        <Link 
          href="/admin/login" 
          className="text-[9px] text-slate-700 hover:text-slate-500 transition inline-block"
        >
          •
        </Link>
      </footer>
    </div>
  );
}