'use client';

import React from 'react';
import { Rocket, Clock, Camera, MessageSquare, CreditCard, Lock, Sparkles, TrendingUp, Users } from 'lucide-react';

export default function FuturoPage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Laboratório de Inovação
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Mamuty Labs 🚀</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Este é o mapa do futuro da barbearia. Funcionalidades exclusivas que estão em nossa mira de desenvolvimento para colocar a Mamuty anos à frente da concorrência.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Feature 1 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-amber-500/20 flex items-center gap-1">
            <Lock className="w-3 h-3" /> EM BREVE
          </div>
          
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
            <Clock className="w-6 h-6 text-emerald-400" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2">Fila de Espera Relâmpago 🥷</h3>
          <p className="text-sm text-slate-400 mb-4 line-clamp-3 group-hover:line-clamp-none transition-all">
            Imagine que a sexta-feira à tarde está lotada e um cliente queria muito o horário das 18h. Ele aperta um botão: "Me avise se vagar". Se alguém cancelar de última hora, o sistema dispara instantaneamente um WhatsApp para a fila de espera: "Opa! Abriu vaga para as 18h! O primeiro que clicar, leva!". O barbeiro nunca fica com a cadeira vazia.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-800/50 w-fit px-3 py-1.5 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" /> Aumenta Faturamento
          </div>
        </div>

        {/* Feature 2 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-amber-500/20 flex items-center gap-1">
            <Lock className="w-3 h-3" /> EM BREVE
          </div>
          
          <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center mb-4 border border-sky-500/20">
            <Camera className="w-6 h-6 text-sky-400" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2">Histórico Fotográfico 📸</h3>
          <p className="text-sm text-slate-400 mb-4 line-clamp-3 group-hover:line-clamp-none transition-all">
            Ao invés de só mostrar o nome do serviço, o app guarda um "Álbum de Estilo" de cada cliente. Sempre que ele terminar o corte, o barbeiro tira uma foto rápida pelo app. No mês seguinte, o cliente pode olhar as fotos passadas e clicar em "Repetir esse corte!". O barbeiro já abre o app e vê a foto de referência antes do cliente sentar na cadeira.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-800/50 w-fit px-3 py-1.5 rounded-lg">
            <Users className="w-3.5 h-3.5" /> Encanta o Cliente
          </div>
        </div>

        {/* Feature 3 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-purple-500/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> PESQUISA
          </div>
          
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 border border-purple-500/20">
            <MessageSquare className="w-6 h-6 text-purple-400" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2">Alfred I.A. (Agendamento por Áudio) 🎙️</h3>
          <p className="text-sm text-slate-400 mb-4 line-clamp-3 group-hover:line-clamp-none transition-all">
            Hoje o Alfred apenas manda mensagens prontas. No futuro, ele vai ouvir e pensar. O cliente manda um áudio no WhatsApp: "Fala Alfred, vê se tem algum buraco amanhã com o Hemerson". A nossa IA escuta o áudio, cruza com a agenda, e responde sozinha: "O Hemerson tem vaga às 15h e 16:30. Posso reservar o das 15h?". Atendimento automático de verdade!
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-800/50 w-fit px-3 py-1.5 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" /> Inteligência Artificial
          </div>
        </div>

        {/* Feature 4 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-rose-500/10 text-rose-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-rose-500/20 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> PLANO FUTURO
          </div>
          
          <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mb-4 border border-rose-500/20">
            <CreditCard className="w-6 h-6 text-rose-400" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2">Clube de Assinatura VIP 💳</h3>
          <p className="text-sm text-slate-400 mb-4 line-clamp-3 group-hover:line-clamp-none transition-all">
            Para garantir faturamento até nos meses fracos, criaremos o "Clube Mamuty" (estilo Netflix). O cliente paga uma mensalidade fixa no cartão (ex: R$ 90/mês) e tem direito a 2 cortes por mês, além de desconto em pomadas. Quando ele agendar, o app já reconhece que ele é VIP e o corte sai a R$ 0,00 na tela. Fidelização extrema e receita previsível.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-800/50 w-fit px-3 py-1.5 rounded-lg">
            <CreditCard className="w-3.5 h-3.5" /> Receita Recorrente
          </div>
        </div>

      </div>

      <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-6 text-center mt-8">
        <Rocket className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <h3 className="text-white font-bold mb-2">Quer priorizar alguma destas ideias?</h3>
        <p className="text-sm text-slate-400 mb-4 max-w-lg mx-auto">
          Todas essas funcionalidades podem ser construídas. Converse com o time de desenvolvimento (Gemini) quando quiser dar vida a uma delas!
        </p>
      </div>
    </div>
  );
}
