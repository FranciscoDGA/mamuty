'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useIsMounted } from '@/hooks/useIsMounted';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const isMounted = useIsMounted();

  if (!isMounted || isOnline) return null;

  return (
    <div
      id="offline-indicator-banner"
      className="fixed bottom-20 left-4 right-4 sm:right-auto sm:max-w-xs z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 text-slate-950 font-medium px-4 py-2.5 text-xs shadow-xl backdrop-blur-xs transition-all animate-bounce"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
      <span>Modo Offline — Você pode navegar e ver seus agendamentos salvos.</span>
    </div>
  );
};
