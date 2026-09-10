'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import {
  CheckCircle2,
  MessageCircle,
  Calendar,
  MapPin,
  Scissors,
  User,
  Clock,
  CreditCard,
  Banknote,
  QrCode,
  ArrowLeft,
} from 'lucide-react';

const paymentIcons: Record<string, React.ElementType> = {
  pix: QrCode,
  dinheiro: Banknote,
  debito: CreditCard,
  credito: CreditCard,
};

const paymentLabels: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
};

function ConfirmacaoContent() {
  const searchParams = useSearchParams();

  const service = searchParams.get('servico') || '';
  const barber = searchParams.get('barbeiro') || '';
  const date = searchParams.get('data') || '';
  const time = searchParams.get('horario') || '';
  const price = searchParams.get('valor') || '';
  const payment = searchParams.get('pagamento') || 'pix';
  const customerName = searchParams.get('cliente') || '';

  const formattedDate = date ? date.split('-').reverse().join('/') : '';
  const PaymentIcon = paymentIcons[payment] || CreditCard;

  const whatsappMessage = encodeURIComponent(
    `Fala! 💈\n\nAgendei horário na *Barbearia Mamuty*:\n\n✂️ *${service}*\n💈 ${barber}\n📅 ${formattedDate} às ${time}\n💰 R$ ${price}\n💳 ${paymentLabels[payment] || payment.toUpperCase()}\n\n*~Mamuty barbearia estilo forte.*`
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#070a12] text-slate-100">
      <OfflineIndicator />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[#090d16]/95 backdrop-blur-lg border-b border-slate-800/80">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/agendar" className="flex items-center gap-2 text-slate-300 hover:text-white transition text-sm">
            <ArrowLeft className="w-4 h-4" />
            Novo
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-amber-500/50 bg-black">
              <img src="/logo.png" alt="Mamuty" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-sm tracking-wider text-white">MAMUTY</span>
          </div>
          <PWAInstallButton />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-8 pb-8">
        <div className="space-y-6 animate-in fade-in">
          {/* Success */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Agendado!</h1>
            <p className="text-sm text-slate-400">
              Seu horário na <strong className="text-amber-400">Barbearia Mamuty</strong> está confirmado.
            </p>
          </div>

          {/* Summary Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-3">
                <Scissors className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-400 w-20">Serviço</span>
                <span className="font-bold text-white">{service}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-400 w-20">Barbeiro</span>
                <span className="font-bold text-white">{barber}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-400 w-20">Data</span>
                <span className="font-bold text-white">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-400 w-20">Horário</span>
                <span className="font-bold text-white">{time}</span>
              </div>
              <div className="flex items-center gap-3">
                <PaymentIcon className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-400 w-20">Pagamento</span>
                <span className="font-bold text-amber-300 uppercase">{paymentLabels[payment] || payment}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">Total</span>
                <span className="font-extrabold text-emerald-400 text-lg">R$ {price}</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 justify-center text-xs text-slate-500">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>Cumaru do Norte - PA</span>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <a
              href={`https://wa.me/5594984439065?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" />
              Confirmar no WhatsApp
            </a>

            <Link
              href="/agendar"
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              Novo Agendamento
            </Link>

            <Link
              href="/"
              className="block text-center text-xs text-slate-500 hover:text-slate-300 transition pt-2"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-[#070a12] items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-pulse">
          <span className="font-extrabold text-sm">M</span>
        </div>
      </div>
    }>
      <ConfirmacaoContent />
    </Suspense>
  );
}