'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Scissors, CalendarCheck, Award, Star, BarChart3, Camera } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, appointments, currentCustomer } = useApp();

  const upcomingCount = appointments.filter(
    (a) =>
      a.status === 'confirmed' &&
      currentCustomer &&
      a.customerPhone.replace(/\D/g, '') === currentCustomer.phone.replace(/\D/g, '')
  ).length;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800/80 safe-area-pb">
      <nav className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
        {/* Agendar */}
        <button
          onClick={() => setActiveTab('agendar')}
          id="tab-mobile-agendar"
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition min-w-[50px] ${
            activeTab === 'agendar' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition ${
              activeTab === 'agendar' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
            }`}
          >
            <Scissors className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Agendar</span>
        </button>

        {/* Painel Admin */}
        <button
          onClick={() => setActiveTab('admin')}
          id="tab-mobile-admin"
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition min-w-[50px] ${
            activeTab === 'admin' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition ${
              activeTab === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Admin</span>
        </button>
      </nav>
    </div>
  );
};

