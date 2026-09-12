'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Instagram,
  Link2,
} from 'lucide-react';

interface ShareBookingLinkProps {
  className?: string;
}

export default function ShareBookingLink({ className = '' }: ShareBookingLinkProps) {
  const { salonConfig } = useApp();
  const [copied, setCopied] = useState(false);

  const bookingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/agendar`
    : 'https://mamuty.vercel.app/agendar';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = bookingUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(
      `Fala! Agende seu horário na Barbearia Mamuty! 💈\n\n${bookingUrl}\n\n~Mamuty barbearia estilo forte.`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleInstagramShare = () => {
    // Instagram doesn't support direct URL sharing, so we copy to clipboard
    handleCopy();
    alert('Link copiado! Cole no seu bio ou story do Instagram.');
  };

  return (
    <div className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Compartilhar Link de Agendamento</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono truncate">
          {bookingUrl}
        </div>
        <button
          onClick={handleCopy}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
            copied 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleWhatsAppShare}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
        >
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
        </button>
        <button
          onClick={handleInstagramShare}
          className="flex-1 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
        >
          <Instagram className="w-3.5 h-3.5" /> Instagram
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
        >
          <Link2 className="w-3.5 h-3.5" /> Copiar
        </button>
      </div>
    </div>
  );
}
