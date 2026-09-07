'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function ServicosPage() {
  const { services } = useApp();

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-white">Serviços</h1>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition">
          + Novo Serviço
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => (
          <div key={service.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex justify-between items-start">
            <div>
              <h3 className="font-bold text-white text-lg">{service.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{service.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs">
                 <span className="bg-slate-950 px-2 py-1 rounded text-emerald-400 font-bold">R$ {service.price}</span>
                 <span className="bg-slate-950 px-2 py-1 rounded text-amber-400 font-bold">{service.durationMinutes} min</span>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 text-[10px] uppercase font-bold rounded">
              Ativo
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
