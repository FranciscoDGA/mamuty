'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import QRCode from '@/components/QRCode';
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
  Share2,
  Navigation,
  Phone,
  AlertCircle,
  Gift,
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

  const bookingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/agendar`
    : 'https://mamuty.vercel.app/agendar';

  const whatsappMessage = encodeURIComponent(
    `Fala!\n\nAgendei horario na *Barbearia Mamuty*:\n\n*${service}*\n${barber}\n${formattedDate} as ${time}\nR$ ${price}\n${paymentLabels[payment] || payment.toUpperCase()}\n\n*Mamuty barbearia estilo forte.*`
  );

  const googleMapsUrl = `https://www.google.com/maps/search/Cumaru+do+Norte+PA`;

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

          {/* Post-Booking Instructions */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase">Instruções</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">1.</span>
                <span>Chegue com <strong className="text-white">10 minutos de antecedência</strong> ao horário agendado.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">2.</span>
                <span>Em caso de atraso superior a <strong className="text-white">15 minutos</strong>, o horário poderá ser perdido.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">3.</span>
                <span>Para cancelar ou remarcar, entre em contato pelo <strong className="text-white">WhatsApp</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">4.</span>
                <span>Pagamento pode ser feito em <strong className="text-white">PIX, dinheiro, débito ou crédito</strong>.</span>
              </li>
            </ul>
          </div>

          {/* Business Info */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Como Chegar</span>
            </div>
            <p className="text-xs text-slate-300">Cumaru do Norte - PA, CEP 68398-000</p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Navigation className="w-3.5 h-3.5" /> Abrir no Maps
            </a>
          </div>

          {/* Business Hours */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Horários</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Segunda a Sábado</span>
                <span className="font-bold text-white">08:00 - 20:00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Almoço</span>
                <span className="font-bold text-white">12:00 - 14:00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Domingo</span>
                <span className="font-bold text-white">08:00 - 12:00</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Contato</span>
            </div>
            <a
              href="https://wa.me/5594984439065"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>

          {/* QR Code */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Link de Agendamento</span>
            </div>
            <p className="text-[11px] text-slate-400">Compartilhe este link para que outros possam agendar</p>
            <div className="flex flex-col items-center gap-3">
              <QRCode value={bookingUrl} size={150} />
              <div className="flex gap-2 w-full">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Fala! Agende seu horário na Barbearia Mamuty! 💈\n\n${bookingUrl}\n\n~Mamuty barbearia estilo forte.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" /> Compartilhar
                </a>
                <Link
                  href="/agendar"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Calendar className="w-3.5 h-3.5" /> Agendar Novamente
                </Link>
              </div>
            </div>
          </div>

          {/* Loyalty Info */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Programa de Fidelidade</span>
            </div>
            <p className="text-xs text-slate-300">
              A cada corte, ganhe <strong className="text-amber-400">1 selo</strong>. Com <strong className="text-amber-400">10 selos</strong>, seu próximo corte é <strong className="text-emerald-400">GRÁTIS!</strong>
            </p>
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
              href="/meus-agendamentos"
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              Ver Meus Agendamentos
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