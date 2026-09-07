'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function ClientesPage() {
  const { customers, appointments } = useApp();

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-extrabold text-white mb-6">Clientes Cadastrados</h1>
      
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-800/50">
          {customers.map(customer => {
            const customerApts = appointments.filter(a => a.customerPhone.replace(/\D/g, '') === customer.phone.replace(/\D/g, ''));
            const latestApt = customerApts[0];

            return (
              <div key={customer.id} className="p-5 hover:bg-slate-800/30 transition">
                <h3 className="font-bold text-white text-lg">{customer.name}</h3>
                <p className="text-sm text-slate-400 font-mono mt-1 mb-3">WhatsApp: {customer.phone}</p>
                
                <div className="text-xs space-y-1">
                  <p className="text-slate-500">Agendamentos totais: <span className="text-white font-bold">{customerApts.length}</span></p>
                  {latestApt && (
                    <p className="text-slate-500">
                      Último agendamento: <span className="text-amber-400">{latestApt.date.split('-').reverse().join('/')}</span> — {latestApt.serviceNames[0]} com {latestApt.barberName} ({latestApt.status})
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          
          {customers.length === 0 && (
            <div className="p-8 text-center text-slate-500">Nenhum cliente cadastrado ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}
