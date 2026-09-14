'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Barber } from '@/lib/types';
import {
  X,
  User,
  Check,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';

interface ChangeBarberModalProps {
  appointmentId: string;
  currentBarberId: string;
  serviceIds: string[];
  date: string;
  time: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangeBarberModal: React.FC<ChangeBarberModalProps> = ({
  appointmentId,
  currentBarberId,
  serviceIds,
  date,
  time,
  onClose,
  onSuccess,
}) => {
  const { barbers, updateAppointment } = useApp();
  const [selectedBarberId, setSelectedBarberId] = useState<string>(currentBarberId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const compatibleBarbers = barbers.filter(b => {
    // Carro-chefe (Hemerson) can do all services
    if (b.id === 'barber-1') return true;
    // Douglas can only do social cuts
    if (b.id === 'barber-2') {
      // Allow selection but mark as potentially incompatible
      return true;
    }
    return true;
  });

  const handleChangeBarber = async () => {
    if (selectedBarberId === currentBarberId) {
      setError('Escolha um profissional diferente.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const newBarber = barbers.find(b => b.id === selectedBarberId);
      await updateAppointment(appointmentId, {
        barberId: selectedBarberId,
        barberName: newBarber?.name || '',
      });
      onSuccess();
    } catch (err: any) {
      const message = err.message || 'Erro ao trocar profissional.';
      if (message.includes('CONFLICT') || message.includes('indisponível')) {
        setError('Esse profissional não está disponível nesse horário.');
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Trocar Profissional</h2>
            <p className="text-xs text-slate-400">Escolha outro barbeiro disponível</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            {compatibleBarbers.map(barber => {
              const isCurrent = barber.id === currentBarberId;
              const isSelected = barber.id === selectedBarberId;
              return (
                <button
                  key={barber.id}
                  onClick={() => { if (!isCurrent) setSelectedBarberId(barber.id); }}
                  disabled={isCurrent}
                  className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition ${
                    isCurrent
                      ? 'bg-slate-800/30 border-slate-700 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-amber-500/10 border-amber-500'
                      : 'bg-slate-800/60 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                    <img src={barber.avatarUrl || '/logo.png'} alt={barber.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{barber.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Atual</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{barber.role}</p>
                  </div>
                  {!isCurrent && isSelected && <Check className="w-5 h-5 text-amber-400" />}
                  {!isCurrent && !isSelected && <ChevronRight className="w-4 h-4 text-slate-600" />}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleChangeBarber}
              disabled={isSubmitting || selectedBarberId === currentBarberId}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Troca'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
