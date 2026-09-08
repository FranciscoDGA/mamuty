'use client';

import React, { useState, useMemo } from 'react';
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
  CheckCircle2
} from 'lucide-react';

export default function MarketingPage() {
  const { customers, appointments } = useApp();
  const [filterDays, setFilterDays] = useState<number>(20);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white">Marketing & Retenção de Clientes</h1>
          </div>
          <p className="text-xs text-slate-400">
            Reengaje clientes sumidos automaticamente pelo WhatsApp para preencher a agenda da barbearia
          </p>
        </div>

        {/* Filter Chip Selector */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 px-2 font-medium">Inativos há:</span>
          <button
            onClick={() => setFilterDays(15)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterDays === 15 ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            +15 dias
          </button>
          <button
            onClick={() => setFilterDays(20)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterDays === 20 ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            +20 dias
          </button>
          <button
            onClick={() => setFilterDays(30)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterDays === 30 ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            +30 dias
          </button>
        </div>
      </div>

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

      {/* Campaign Strategy Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-5 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            💡 Como funciona o Marketing Ativo da Mamuty:
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Homens cortam o cabelo em média a cada 20 a 25 dias. O sistema identifica automaticamente quem está com o visual desatualizado e gera uma mensagem de WhatsApp pronta, sem parecer propaganda invasiva.
          </p>
        </div>
      </div>

      {/* Inactive Clients Action List */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Lista de Clientes para Reengajar ({inactiveClients.length})
          </span>
          <span className="text-xs text-slate-400">1 clique abre o WhatsApp do cliente</span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {inactiveClients.map((client) => {
            const isSent = sentMap[client.cleanPhone];
            const message = `E aí, ${client.name}! 💈✂️\n\nJá faz quase um mês desde seu último ${client.lastService} na Mamuty com o ${client.preferredBarber}.\n\nQue tal dar aquele talento no visual pro fim de semana? Temos horários livres nesta semana!\n\nResponda aqui para garantir sua vaga. Abraço!`;

            return (
              <div 
                key={client.id}
                className="p-4 sm:p-5 hover:bg-slate-800/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-base">{client.name}</h4>
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">
                      {client.daysInactive === 999 ? 'Sem visitas registradas' : `${client.daysInactive} dias sem cortar`}
                    </span>
                    {isSent && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Enviado
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">
                    WhatsApp: <span className="text-slate-300 font-mono">{client.phone}</span> &bull; Barbeiro: <span className="text-amber-400">{client.preferredBarber}</span> &bull; Histórico: <span className="text-white">{client.totalVisits} atendimentos</span>
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
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
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
  );
}
