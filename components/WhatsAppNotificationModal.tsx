'use client';

import React, { useState } from 'react';
import { Appointment } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { formatWhatsAppMessage, generateWhatsAppUrl } from '@/lib/whatsapp';
import { MessageSquare, ExternalLink, Copy, Check, X, BellRing, Smartphone } from 'lucide-react';

interface Props {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  initialRecipient?: 'cliente' | 'barbearia' | 'lembrete';
}

export const WhatsAppNotificationModal: React.FC<Props> = ({
  appointment,
  isOpen,
  onClose,
  initialRecipient = 'cliente',
}) => {
  const { salonConfig } = useApp();
  const [recipient, setRecipient] = useState<'cliente' | 'barbearia' | 'lembrete'>(initialRecipient);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const targetPhone =
    recipient === 'cliente' || recipient === 'lembrete'
      ? appointment.customerPhone
      : salonConfig.whatsappNumber;

  const messageText = formatWhatsAppMessage(appointment, salonConfig, recipient);
  const whatsappUrl = generateWhatsAppUrl(targetPhone, messageText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-700 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                Notificação WhatsApp
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-800 rounded font-medium">Online</span>
              </h3>
              <p className="text-[11px] text-emerald-100">
                Disparo direto para {recipient === 'barbearia' ? 'a Barbearia' : appointment.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Filter Tabs */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setRecipient('cliente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              recipient === 'cliente'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Confirmação Cliente
          </button>
          <button
            onClick={() => setRecipient('barbearia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              recipient === 'barbearia'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Aviso Barbearia / Barbeiro
          </button>
          <button
            onClick={() => setRecipient('lembrete')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              recipient === 'lembrete'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Lembrete de Horário
          </button>
        </div>

        {/* WhatsApp Chat Bubble Mock */}
        <div className="p-4 overflow-y-auto flex-1 bg-[#0b141a] bg-opacity-95 text-slate-200">
          <div className="text-center mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-400">
              Destinatário: {targetPhone}
            </span>
          </div>

          <div className="max-w-[92%] ml-auto bg-[#005c4b] text-slate-100 rounded-xl rounded-tr-xs p-3.5 shadow-md text-xs leading-relaxed whitespace-pre-line border border-emerald-500/20">
            {messageText}
            <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-emerald-200/70">
              <span>Agora</span>
              <Check className="w-3 h-3 text-cyan-300" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="btn-open-whatsapp"
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition active:scale-[0.98]"
          >
            <Smartphone className="w-4 h-4" />
            <span>Abrir no WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          <button
            onClick={handleCopy}
            id="btn-copy-whatsapp-text"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Mensagem</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
