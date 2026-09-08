'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useApp } from '@/context/AppContext';
import { 
  Sparkles, 
  Send, 
  Calendar, 
  Clock, 
  Users, 
  UserCheck, 
  UserX, 
  MessageSquare, 
  Filter, 
  ArrowRight,
  CheckCircle2,
  QrCode as QrCodeIcon,
  Printer,
  Copy,
  Check,
  Scissors,
  Share2,
  Smartphone
} from 'lucide-react';

export default function MarketingPage() {
  const { customers, appointments, barbers } = useApp();
  
  const [activeTab, setActiveTab] = useState<'lembretes' | 'plaquinhas'>('lembretes');
  const [filterDays, setFilterDays] = useState<number>(20);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  // Mirror Display QR Code State
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Selected Barber Object
  const selectedBarber = useMemo(() => {
    if (selectedBarberId === 'all') return null;
    return barbers.find(b => b.id === selectedBarberId) || null;
  }, [selectedBarberId, barbers]);

  // Target URL for Mirror QR Code
  const mirrorBookingUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mamuty.vercel.app';
    if (selectedBarberId === 'all') {
      return `${origin}/`;
    }
    return `${origin}/?barbeiro=${selectedBarberId}`;
  }, [selectedBarberId]);

  // Generate QR Code Data URL
  useEffect(() => {
    QRCode.toDataURL(mirrorBookingUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
  }, [mirrorBookingUrl]);

  // Calculate client inactivity
  const clientStats = useMemo(() => {
    const today = new Date();

    return customers.map(cust => {
      const cleanPhone = cust.phone.replace(/\D/g, '');
      const custApts = appointments.filter(
        a => a.customerPhone.replace(/\D/g, '') === cleanPhone && a.status === 'completed'
      );

      let lastDate: Date | null = null;
      let lastBarber = 'nosso barbeiro';
      let lastService = 'corte';

      if (custApts.length > 0) {
        // Sort by date desc
        custApts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        lastDate = new Date(custApts[0].date);
        lastBarber = custApts[0].barberName || lastBarber;
        lastService = custApts[0].serviceNames?.[0] || lastService;
      }

      const daysInactive = lastDate 
        ? Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999; // never visited or no completed visit

      return {
        ...cust,
        cleanPhone,
        totalVisits: custApts.length,
        lastVisitDate: lastDate ? custApts[0].date : null,
        daysInactive,
        preferredBarber: lastBarber,
        lastService
      };
    });
  }, [customers, appointments]);

  const inactiveClients = useMemo(() => {
    return clientStats.filter(c => c.daysInactive >= filterDays);
  }, [clientStats, filterDays]);

  const activeClientsCount = clientStats.filter(c => c.daysInactive < 20).length;

  const handleMarkSent = (phone: string) => {
    setSentMap(prev => ({ ...prev, [phone]: true }));
  };

  const handleCopyLink = async () => {
    if (typeof navigator !== 'undefined') {
      await navigator.clipboard.writeText(mirrorBookingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrintPlaque = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Printable Area Specific Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-mirror-plaque, #printable-mirror-plaque * {
            visibility: visible;
          }
          #printable-mirror-plaque {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 480px;
            box-shadow: none;
            border: 2px solid #000;
          }
        }
      `}</style>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white">Marketing & Aceleração de Clientes</h1>
          </div>
          <p className="text-xs text-slate-400">
            Ferramentas para garantir a fidelização direta na cadeira e retorno automático via WhatsApp
          </p>
        </div>

        {/* Top Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('lembretes')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lembretes'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Lembretes de Visual</span>
          </button>
          <button
            onClick={() => setActiveTab('plaquinhas')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'plaquinhas'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCodeIcon className="w-4 h-4" />
            <span>Plaquinhas do Espelho</span>
          </button>
        </div>
      </div>

      {/* TAB 1: RETENTION / MAINTENANCE REMINDERS */}
      {activeTab === 'lembretes' && (
        <div className="space-y-6">
          {/* KPI Retention Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Base Total</p>
                <p className="text-2xl font-black text-white">{customers.length} <span className="text-xs font-normal text-slate-500">clientes</span></p>
              </div>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Clientes Recentes</p>
                <p className="text-2xl font-black text-emerald-400">{activeClientsCount} <span className="text-xs font-normal text-slate-500">(&lt; 20 dias)</span></p>
              </div>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Oportunidade de Retorno</p>
                <p className="text-2xl font-black text-rose-400">{inactiveClients.length} <span className="text-xs font-normal text-slate-500">precisam cortar</span></p>
              </div>
            </div>
          </div>

          {/* Filter Interval Selector */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" /> Segmentação por Ciclo de Corte:
              </h3>
              <p className="text-xs text-slate-400">
                Escolha a régua de tempo para adaptar a abordagem no WhatsApp
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterDays(15)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterDays === 15 ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                +15 dias (Degradê / Fade)
              </button>
              <button
                onClick={() => setFilterDays(20)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterDays === 20 ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                +20 dias (Alinhamento)
              </button>
              <button
                onClick={() => setFilterDays(30)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterDays === 30 ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                +30 dias (Completo)
              </button>
            </div>
          </div>

          {/* Inactive Clients Action List */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Lista de Clientes ({inactiveClients.length}) &bull; {filterDays} dias sem atendimento
              </span>
              <span className="text-xs text-emerald-400 font-medium hidden sm:inline">1 clique abre o WhatsApp</span>
            </div>

            <div className="divide-y divide-slate-800/50">
              {inactiveClients.map((client) => {
                const isSent = sentMap[client.cleanPhone];
                
                // Tailored customized copy based on duration
                let message = '';
                if (filterDays === 15) {
                  message = `Fala, ${client.name}! 💈✂️\n\nAquele degradê na régua já começou a perder a linha? Já se passaram 15 dias do seu último corte com o ${client.preferredBarber}.\n\nVem alinhar o pezinho e manter o padrão antes do fim de semana!\n\nQuer que eu reserve sua vaga?`;
                } else if (filterDays === 20) {
                  message = `E aí, ${client.name}! 💈✂️\n\nJá faz 20 dias desde o seu último corte na Mamuty com o ${client.preferredBarber}.\n\nQue tal dar aquele talento no visual pro fim de semana? Temos horários livres nesta semana!\n\nResponda aqui para garantir sua cadeira. Abraço!`;
                } else {
                  message = `Opa, ${client.name}! Tudo bem? 💈✂️\n\nSeu último corte na Mamuty com o ${client.preferredBarber} já completou 1 mês!\n\nNão deixa o visual passar do ponto. Bora garantir seu horário com antecedência antes que lote?\n\nQual o melhor dia pra você?`;
                }

                return (
                  <div 
                    key={client.id}
                    className="p-4 sm:p-5 hover:bg-slate-800/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-base">{client.name}</h4>
                        <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">
                          {client.daysInactive === 999 ? 'Sem visitas registradas' : `${client.daysInactive} dias sem cortar`}
                        </span>
                        {isSent && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Mensagem Enviada
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400">
                        WhatsApp: <span className="text-slate-300 font-mono">{client.phone}</span> &bull; Barbeiro: <span className="text-amber-400 font-bold">{client.preferredBarber}</span>
                      </p>

                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 italic max-w-xl">
                        &ldquo;{message}&rdquo;
                      </div>
                    </div>

                    <div className="shrink-0">
                      <a
                        href={`https://wa.me/55${client.cleanPhone}?text=${encodeURIComponent(message)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleMarkSent(client.cleanPhone)}
                        className="w-full sm:w-auto px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                        <span>Disparar WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}

              {inactiveClients.length === 0 && (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <p className="text-sm text-white font-bold">Parabéns! Todos os clientes cortaram recentemente.</p>
                  <p className="text-xs text-slate-400">Nenhum cliente está há mais de {filterDays} dias sem atendimento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MIRROR ACRYLIC DISPLAY PLAQUES (QR CODE CADEIRA) */}
      {activeTab === 'plaquinhas' && (
        <div className="space-y-6">
          {/* Instructions Box */}
          <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 p-5 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-400" /> Plaquinha de Acrílico para o Espelho da Cadeira
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Coloque esta plaquinha luxuosa no espelho de cada cadeira. Quando o cliente estiver finalizando o corte, ele aponta a câmera do celular e já agenda o retorno para daqui a 15 ou 21 dias diretamente com você, sem fila nem espera!
              </p>
            </div>

            {/* Print & Share Action Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={handlePrintPlaque}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Placa (A5)</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700 active:scale-95"
                title="Copiar Link de Agendamento da Cadeira"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
          </div>

          {/* Barber Selection Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Selecione o Barbeiro da Cadeira:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedBarberId('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                  selectedBarberId === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                💈 Barbearia Geral (Qualquer Cadeira)
              </button>
              {barbers.filter(b => b.id !== 'any').map(barber => (
                <button
                  key={barber.id}
                  onClick={() => setSelectedBarberId(barber.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-2 ${
                    selectedBarberId === barber.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>Cadeira do {barber.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Plaque Preview Canvas / Card */}
          <div className="flex flex-col items-center justify-center py-4">
            <div 
              id="printable-mirror-plaque"
              ref={printRef}
              className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#161a23] via-[#0d1017] to-[#07090e] border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 text-center relative shadow-2xl overflow-hidden"
            >
              {/* Luxury Accent Corner Borders */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-400" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-400" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-400" />

              {/* Plaque Header */}
              <div className="space-y-1 mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mb-1 border border-amber-500/30">
                  <Scissors className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider uppercase">
                  MAMUTY
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-semibold">
                  BARBEARIA & SALÃO MASCULINO
                </p>
              </div>

              {/* Dedicated Barber Chair Badge */}
              <div className="my-3 inline-block bg-amber-500/10 border border-amber-500/40 px-4 py-1.5 rounded-full">
                <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                  {selectedBarber ? `CADEIRA DO ${selectedBarber.name.toUpperCase()}` : 'CADEIRA VIP &bull; AGENDAMENTO RÁPIDO'}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-3.5 rounded-2xl mx-auto w-48 h-48 sm:w-56 sm:h-56 my-4 shadow-lg flex items-center justify-center border-4 border-amber-400/80">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code de Agendamento da Cadeira" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-slate-400 text-xs">Gerando QR Code...</div>
                )}
              </div>

              {/* Plaque Call to Action */}
              <div className="space-y-1 mt-2">
                <h4 className="text-sm sm:text-base font-black text-white">
                  Aponte a Câmera do Seu Celular
                </h4>
                <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                  Garanta seu próximo corte para daqui a <strong className="text-amber-400">15 ou 21 dias</strong> direto na cadeira em 10 segundos!
                </p>
                <div className="pt-2 text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" /> Sem senha &bull; Sem app para baixar &bull; 100% Celular
                </div>
              </div>
            </div>

            {/* Quick Share to Barber WhatsApp */}
            <div className="mt-4 flex items-center gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Fala barbeiro! Aqui está o seu link exclusivo do QR Code de cadeira da Mamuty: ${mirrorBookingUrl}\n\nColoque no espelho da sua bancada para seus clientes agendarem com você direto na cadeira!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-300 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl border border-slate-800 transition flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enviar Link para o Barbeiro via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
