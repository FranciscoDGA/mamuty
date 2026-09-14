'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { BellRing, X, Check } from 'lucide-react';

export const PushPermissionModal: React.FC = () => {
  const { currentCustomer } = useApp();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Only check in browser
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in window)) {
      return;
    }

    const hasPrompted = localStorage.getItem('mamuty_push_prompted');
    if (!hasPrompted && Notification.permission === 'default') {
      // Show prompt gently after 4 seconds of page view
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('mamuty_push_prompted', 'dismissed');
    setShowPrompt(false);
  };

  const handleEnablePush = async () => {
    try {
      setIsSubscribing(true);
      const permission = await Notification.requestPermission();
      localStorage.setItem('mamuty_push_prompted', permission);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        // In browser standard, we obtain subscription or check existing
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Placeholder application server key / minimal subscription
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              // Minimal dummy public key if VAPID is not set in env yet
              applicationServerKey: new Uint8Array([4, 23, 15, 88, 42, 99, 12, 45]),
            });
          } catch {
            // Some browsers require valid VAPID key to subscribe; if so, register intention
          }
        }

        // Register to backend
        await fetch('/api/notifications/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetType: currentCustomer?.phone ? 'customer' : 'store',
            targetIdentifier: currentCustomer?.phone || 'store_main',
            subscription: subscription || { endpoint: `local-web-${Date.now()}` },
          }),
        });
      }
    } catch (err) {
      console.warn('Push registration handled gracefully:', err);
    } finally {
      setIsSubscribing(false);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] p-4 rounded-2xl bg-slate-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
          <BellRing className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Ativar Lembretes no Celular?</h4>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Receba notificações automáticas da Mamuty lembrando o horário do seu corte.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleEnablePush}
              disabled={isSubscribing}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {isSubscribing ? 'Ativando...' : 'Ativar Lembretes'}
            </button>

            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
            >
              Depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
