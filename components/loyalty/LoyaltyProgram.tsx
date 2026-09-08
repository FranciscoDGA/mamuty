'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LoyaltyReward } from '@/lib/types';
import confetti from 'canvas-confetti';
import {
  Award,
  Crown,
  Sparkles,
  Scissors,
  Gift,
  Check,
  Flame,
  Coffee,
  Beer,
  ChevronRight,
  ShieldAlert,
  Info,
  Phone,
  Search,
  RotateCcw
} from 'lucide-react';

export const LoyaltyProgram: React.FC = () => {
  const { currentCustomer, setCurrentCustomer, customers, loyaltyRewards, redeemLoyaltyReward, salonConfig, setActiveTab } = useApp();
  const [phoneSearch, setPhoneSearch] = useState<string>('');
  const [notFoundMsg, setNotFoundMsg] = useState<string>('');
  const [redeemSuccessMsg, setRedeemSuccessMsg] = useState<string>('');

  const handleLookupPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneSearch.replace(/\D/g, '');
    if (!clean) return;

    const found = customers.find(c => c.phone.replace(/\D/g, '').includes(clean));
    if (found) {
      setCurrentCustomer(found);
      setNotFoundMsg('');
    } else {
      const tempCust = {
        id: `phone-${clean}`,
        name: 'Cliente VIP',
        phone: phoneSearch,
        totalVisits: 0,
        totalSpent: 0,
        loyaltyStamps: 0,
        loyaltyPoints: 0,
        tier: 'Bronze' as const
      };
      setCurrentCustomer(tempCust);
      setNotFoundMsg('Nenhum selo registrado ainda com este número. Ao cortar o cabelo na barbearia, seus selos aparecerão aqui!');
    }
  };

  if (!currentCustomer) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 bg-slate-900/90 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Consulte seu Cartão Fidelidade</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Sem cadastro chato e sem senha: basta digitar seu número de WhatsApp para ver seus selos e cortes grátis!
          </p>
        </div>

        <form onSubmit={handleLookupPhone} className="space-y-3">
          <div className="relative">
            <Phone className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
            <input
              type="tel"
              required
              value={phoneSearch}
              onChange={e => setPhoneSearch(e.target.value)}
              placeholder="Digite seu WhatsApp: (11) 99999-9999"
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Consultar Meus Selos</span>
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800 text-center">
          <button
            onClick={() => setActiveTab('agendar')}
            className="text-xs text-slate-400 hover:text-amber-400 transition"
          >
            Ainda não cortou? <strong className="text-amber-400">Agende seu corte agora &rarr;</strong>
          </button>
        </div>
      </div>
    );
  }

  const stampsGoal = salonConfig.loyaltyStampsGoal || 10;
  const currentStamps = currentCustomer.loyaltyStamps || 0;
  const stampsRemaining = Math.max(0, stampsGoal - currentStamps);

  const handleRedeem = (reward: LoyaltyReward) => {
    const success = redeemLoyaltyReward(reward.id, currentCustomer.id);
    if (success) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#d97706', '#fbbf24', '#ffffff'],
        });
      } catch (e) {}

      setRedeemSuccessMsg(`Parabéns! Recompensa "${reward.title}" resgatada com sucesso! Apresente na recepção.`);
      setTimeout(() => setRedeemSuccessMsg(''), 5000);
    } else {
      alert('Saldo de pontos ou selos insuficiente para este resgate.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span>Clube Fidelidade Mamuty</span>
          </h2>
          <p className="text-xs text-slate-400">
            Corte com frequência, acumule selos e resgate cortes e produtos grátis.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setCurrentCustomer(null)}
            className="text-[11px] font-bold text-slate-400 hover:text-amber-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Consultar Outro Número</span>
          </button>

          {/* Current Tier Badge */}
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-2xl">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div className="text-left leading-none">
              <span className="text-[10px] uppercase font-bold text-amber-400/80 block">Categoria</span>
              <span className="text-xs font-black text-white">{currentCustomer.tier}</span>
            </div>
          </div>
        </div>
      </div>

      {notFoundMsg && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{notFoundMsg}</span>
        </div>
      )}

      {/* Success Notification */}
      {redeemSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{redeemSuccessMsg}</span>
        </div>
      )}

      {/* === DIGITAL STAMP CARD (CARTELA DIGITAL DE SELOS) === */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0d1527] to-slate-900 rounded-3xl p-6 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        {/* Background Mammoth watermark / accent */}
        <div className="absolute -right-8 -bottom-8 opacity-5 text-amber-400 pointer-events-none">
          <Scissors className="w-64 h-64" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
              Cartela Fidelidade Digital
            </span>
            <h3 className="text-lg font-black text-white mt-1">
              {currentStamps} de {stampsGoal} Selos Carimbados
            </h3>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Saldo de Pontos:</span>
            <span className="text-xl font-black text-amber-400">
              {currentCustomer.loyaltyPoints} pts
            </span>
          </div>
        </div>

        {/* 10 Stamps Grid */}
        <div className="grid grid-cols-5 gap-2.5 sm:gap-4 mb-6">
          {Array.from({ length: stampsGoal }).map((_, index) => {
            const stampNumber = index + 1;
            const isStamped = stampNumber <= currentStamps;
            const isMilestone5 = stampNumber === 5;
            const isMilestone10 = stampNumber === 10;

            return (
              <div
                key={stampNumber}
                className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl border transition-all duration-300 select-none ${
                  isStamped
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 scale-100'
                    : 'bg-slate-950/80 border-slate-800 text-slate-600'
                }`}
              >
                {isStamped ? (
                  <>
                    <Scissors className="w-5 h-5 text-slate-950" />
                    <span className="text-[10px] font-black mt-0.5">{stampNumber}º</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold text-slate-500">{stampNumber}</span>
                    {isMilestone5 && (
                      <span className="text-[8px] font-bold text-amber-400/80 uppercase">50% OFF</span>
                    )}
                    {isMilestone10 && (
                      <span className="text-[8px] font-black text-amber-400 uppercase">Grátis</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Stamp Status Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300">
              {stampsRemaining > 0 ? (
                <>
                  Faltam apenas <strong className="text-amber-400">{stampsRemaining} corte{stampsRemaining > 1 ? 's' : ''}</strong> para você ganhar um atendimento 100% gratuito!
                </>
              ) : (
                <strong className="text-emerald-400">
                  🎉 Parabéns! Sua cartela está completa! Resgate seu corte grátis abaixo!
                </strong>
              )}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('agendar')}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition text-xs shrink-0"
          >
            Agendar Novo Corte
          </button>
        </div>
      </div>

      {/* === VIP PERKS BY TIER === */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className={`p-4 rounded-2xl border ${currentCustomer.tier === 'Bronze' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-2">
            <Coffee className="w-4 h-4" />
            <span>Nível Bronze</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            • 1x Pontos por Real<br />
            • Café Gourmet Expresso grátis<br />
            • Lembretes no WhatsApp
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${currentCustomer.tier === 'Prata' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-2">
            <Beer className="w-4 h-4" />
            <span>Nível Prata (4+ visitas)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            • 1.2x Pontos acumulados<br />
            • Cerveja artesanal de cortesia<br />
            • Prioridade nos horários nobres
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${currentCustomer.tier === 'Ouro VIP' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-2">
            <Crown className="w-4 h-4" />
            <span>Nível Ouro VIP (10+ visitas)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            • 1.5x Pontos acumulados<br />
            • Toalha quente facial cortesia<br />
            • Presente exclusivo no aniversário
          </p>
        </div>
      </div>

      {/* === REWARDS STORE (VITRINE DE RESGATE) === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Recompensas Disponíveis para Resgate</span>
          </h3>
          <span className="text-xs text-slate-400">
            Seu saldo: <strong className="text-amber-400">{currentCustomer.loyaltyPoints} pts</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loyaltyRewards.map((reward) => {
            const canAfford =
              reward.type === 'points'
                ? currentCustomer.loyaltyPoints >= reward.pointsCost
                : currentCustomer.loyaltyStamps >= (reward.stampsRequired || 5);

            return (
              <div
                key={reward.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm text-white">{reward.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 whitespace-nowrap">
                      {reward.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {reward.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {reward.type === 'points'
                      ? `${reward.pointsCost} Pontos`
                      : `${reward.stampsRequired} Selos`}
                  </span>

                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{canAfford ? 'Resgatar' : 'Saldo Insuficiente'}</span>
                    {canAfford && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
