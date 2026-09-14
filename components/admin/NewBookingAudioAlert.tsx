'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Volume2, VolumeX, CheckCircle, Calendar, Clock, User, Scissors } from 'lucide-react';

interface NewBookingInfo {
  id: string;
  customerName: string;
  customerPhone?: string;
  barberName: string;
  serviceName: string;
  date: string;
  time: string;
  totalPrice?: number;
}

/**
 * Toca o som do "Bibe do Salão" sintetizado via Web Audio API.
 * Funciona 100% no celular (Android/iOS) e no desktop sem precisar de mp3 externo.
 */
function playShopChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Sequência de notas agradáveis e nítidas (Chime de Loja: C5, E5, G5, C6)
    const notes = [
      { freq: 523.25, time: 0.0, duration: 0.25 }, // C5
      { freq: 659.25, time: 0.15, duration: 0.25 }, // E5
      { freq: 783.99, time: 0.30, duration: 0.30 }, // G5
      { freq: 1046.5, time: 0.45, duration: 0.70 }, // C6
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.001, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.4, now + note.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });

    // Bip de confirmação após 1 segundo
    setTimeout(() => {
      try {
        const bipOsc = ctx.createOscillator();
        const bipGain = ctx.createGain();
        bipOsc.type = 'triangle';
        bipOsc.frequency.setValueAtTime(880, ctx.currentTime);
        bipGain.gain.setValueAtTime(0.3, ctx.currentTime);
        bipGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        bipOsc.connect(bipGain);
        bipGain.connect(ctx.destination);
        bipOsc.start();
        bipOsc.stop(ctx.currentTime + 0.2);
      } catch {}
    }, 900);

    // Vibração no celular
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([250, 100, 250, 100, 400]);
    }
  } catch (err) {
    console.warn('[ShopChime] Erro ao tocar som:', err);
  }
}

export default function NewBookingAudioAlert() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [latestBooking, setLatestBooking] = useState<NewBookingInfo | null>(null);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // Carrega preferência de som salva
  useEffect(() => {
    const saved = localStorage.getItem('mamuty_admin_sound_enabled');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('mamuty_admin_sound_enabled', String(next));
    if (next) {
      playShopChime();
    }
  };

  const handleTestSound = () => {
    playShopChime();
  };

  const triggerAlert = useCallback(
    (booking: NewBookingInfo) => {
      if (soundEnabled) {
        playShopChime();
      }
      setLatestBooking(booking);
    },
    [soundEnabled]
  );

  // Escuta novos agendamentos via Supabase Realtime + Polling de segurança
  useEffect(() => {
    let channel: any = null;

    // 1. Carga inicial dos IDs para não disparar alerta de agendamentos antigos
    const fetchInitial = async () => {
      try {
        const { data } = await supabase
          .from('appointments')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(30);

        if (data) {
          const ids = new Set(data.map((d) => d.id));
          setKnownIds(ids);
        }
        initialLoadDone.current = true;
      } catch (e) {
        console.warn('[NewBookingAlert] Erro na carga inicial:', e);
        initialLoadDone.current = true;
      }
    };

    fetchInitial();

    // 2. Realtime subscription no Supabase
    try {
      channel = supabase
        .channel('admin-new-appointments')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'appointments' },
          (payload: any) => {
            const newRow = payload.new;
            if (!newRow) return;

            setKnownIds((prev) => {
              if (prev.has(newRow.id)) return prev;
              const next = new Set(prev);
              next.add(newRow.id);

              // Só alerta se já passou da carga inicial
              if (initialLoadDone.current) {
                const booking: NewBookingInfo = {
                  id: newRow.id,
                  customerName: newRow.customer_name || 'Cliente',
                  customerPhone: newRow.customer_phone,
                  barberName: newRow.barber_name || 'Barbeiro',
                  serviceName: Array.isArray(newRow.service_names)
                    ? newRow.service_names.join(', ')
                    : newRow.service_name || 'Corte',
                  date: newRow.date || newRow.appointment_date || '',
                  time: newRow.time || newRow.appointment_time || '',
                  totalPrice: Number(newRow.total_price || newRow.price || 0),
                };
                triggerAlert(booking);
              }
              return next;
            });
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[NewBookingAlert] Realtime não suportado:', err);
    }

    // 3. Polling de verificação a cada 15 segundos (para celulares com tela bloqueada/wake)
    const pollInterval = setInterval(async () => {
      if (!initialLoadDone.current) return;
      try {
        const { data } = await supabase
          .from('appointments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          setKnownIds((prev) => {
            let foundNew = false;
            let newest: NewBookingInfo | null = null;
            const next = new Set(prev);

            for (const item of data) {
              if (!next.has(item.id)) {
                next.add(item.id);
                foundNew = true;
                if (!newest) {
                  newest = {
                    id: item.id,
                    customerName: item.customer_name || 'Cliente',
                    customerPhone: item.customer_phone,
                    barberName: item.barber_name || 'Barbeiro',
                    serviceName: Array.isArray(item.service_names)
                      ? item.service_names.join(', ')
                      : 'Corte',
                    date: item.date || item.appointment_date || '',
                    time: item.time || item.appointment_time || '',
                    totalPrice: Number(item.total_price || 0),
                  };
                }
              }
            }

            if (foundNew && newest) {
              triggerAlert(newest);
            }
            return next;
          });
        }
      } catch {}
    }, 15000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [triggerAlert]);

  return (
    <>
      {/* Barra de status de áudio no topo do admin */}
      <div className="bg-slate-900 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-200">
            Monitor de Agendamentos do Salão
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestSound}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition text-[11px] font-semibold"
            title="Testar som do alarme"
          >
            🔔 Testar Bip
          </button>
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition text-[11px] font-medium ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
            title="Ativar/desativar som"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5" /> Som: Ativo
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" /> Som: Mudo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal / Toast Flutuante de Alerta em Tempo Real */}
      {latestBooking && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[420px] z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 p-4 rounded-2xl shadow-2xl shadow-black/60 border-2 border-amber-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-white">
                  <Bell className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">
                    🚨 NOVO AGENDAMENTO!
                  </h4>
                  <p className="text-xs font-semibold text-slate-900">
                    Alguém acabou de agendar no salão
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLatestBooking(null)}
                className="text-black/60 hover:text-black font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 bg-black/10 rounded-xl p-3 text-xs space-y-1.5 border border-black/10">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> {latestBooking.customerName}
                </span>
                {latestBooking.customerPhone && (
                  <span className="font-mono text-[11px] opacity-80">
                    {latestBooking.customerPhone}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-slate-900 font-medium">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" /> {latestBooking.serviceName}
                </span>
                <span>com {latestBooking.barberName}</span>
              </div>

              <div className="flex items-center justify-between font-semibold pt-1 border-t border-black/10">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {latestBooking.date}
                </span>
                <span className="flex items-center gap-1 text-slate-950 font-bold bg-white/40 px-2 py-0.5 rounded">
                  <Clock className="w-3.5 h-3.5" /> {latestBooking.time}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setLatestBooking(null)}
                className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Entendido / Fechar Alerta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
