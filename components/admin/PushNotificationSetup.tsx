'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function PushNotificationSetup() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const checkSubscription = async () => {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch (err) {
        console.error('Push setup error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSubscription();
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) throw new Error('VAPID public key not found');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Save to Supabase
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        subscription: subscription.toJSON(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (error) throw error;
      
      setIsSubscribed(true);
      alert('Notificações ativadas com sucesso!');
    } catch (err) {
      console.error('Error subscribing:', err);
      alert('Erro ao ativar notificações. Verifique a permissão do navegador.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      }
      setIsSubscribed(false);
      alert('Alertas resetados! Clique em "Ativar Alertas" novamente para consertar as chaves.');
    } catch (err) {
      console.error('Error unsubscribing:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-slate-400" />;

  if (isSubscribed) {
    return (
      <button
        onClick={handleUnsubscribe}
        className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition"
        title="Clique para resetar os alertas"
      >
        <Bell className="w-4 h-4" /> Pop-ups ON (Resetar)
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      className="flex items-center gap-2 text-rose-400 hover:text-rose-300 text-xs font-bold transition"
      title="Ativar Notificações"
    >
      <BellOff className="w-4 h-4" /> Ativar Pop-ups
    </button>
  );
}
