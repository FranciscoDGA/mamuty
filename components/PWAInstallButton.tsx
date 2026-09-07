'use client';

import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isMounted = useIsMounted();

  if (!isMounted || isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'full') {
      return (
        <button
          onClick={install}
          id="btn-install-pwa-full"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
        >
          <Download className="w-5 h-5 text-slate-950" />
          <span>Instalar App Mamuty</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        id="btn-install-pwa"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-xs font-semibold transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          id="btn-install-ios"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-medium transition"
        >
          <Share2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
                <Download className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Instalar no iPhone / iPad</h3>
              <p className="text-xs text-slate-400 mb-4">
                Adicione o Mamuty à tela de início para abrir como um aplicativo nativo:
              </p>

              <div className="space-y-3 bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 text-sm">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-xs font-bold text-amber-400">1</div>
                  <p className="text-xs text-slate-300">
                    Toque no botão <Share2 className="inline w-3.5 h-3.5 text-blue-400 mx-1" /> <strong>Compartilhar</strong> na barra do Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-xs font-bold text-amber-400">2</div>
                  <p className="text-xs text-slate-300">
                    Role para baixo e selecione <PlusSquare className="inline w-3.5 h-3.5 text-amber-400 mx-1" /> <strong>Adicionar à Tela de Início</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-xs font-bold text-amber-400">3</div>
                  <p className="text-xs text-slate-300">
                    Toque em <strong>Adicionar</strong> no canto superior direito.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for other browsers (e.g. desktop non-chromium or when prompt not fired yet)
  return (
    <button
      onClick={() => {
        alert('Para instalar o app Mamuty no seu dispositivo, acesse pelo navegador do celular ou clique nos 3 pontinhos do navegador e selecione "Instalar aplicativo".');
      }}
      id="btn-install-info"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-medium transition"
    >
      <Download className="w-3.5 h-3.5 text-amber-400" />
      <span>Instalar App</span>
    </button>
  );
};
