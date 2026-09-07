'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import Image from 'next/image';

export default function ProfissionaisPage() {
  const { barbers } = useApp();

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-white">Profissionais</h1>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition">
          + Novo Profissional
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.filter(b => b.id !== 'any').map(barber => (
          <div key={barber.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-700 mb-3 relative">
               <Image src={barber.avatarUrl || 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&q=80'} alt={barber.name} fill className="object-cover" referrerPolicy="no-referrer" />
            </div>
            <h3 className="font-bold text-white text-lg">{barber.name}</h3>
            <p className="text-xs text-amber-400 font-bold mb-2">{barber.role}</p>
            <p className="text-sm text-slate-400 mb-3">{barber.specialties.join(', ')}</p>
            <span className="mt-auto bg-emerald-500/20 text-emerald-400 px-3 py-1 text-[10px] uppercase font-bold rounded-full">
              Ativo
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
