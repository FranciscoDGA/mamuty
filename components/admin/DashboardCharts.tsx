'use client';

import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Appointment, Barber, Service } from '@/lib/types';

interface DashboardChartsProps {
  appointments: Appointment[];
  barbers: Barber[];
  services: Service[];
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DashboardCharts({ appointments, barbers, services }: DashboardChartsProps) {
  // Dados para gráfico de receita por dia (últimos 7 dias)
  const revenueData = useMemo(() => {
    const days: { date: string; label: string; receita: number; agendamentos: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayAppointments = appointments.filter(a => 
        a.date === dateStr && (a.status === 'completed' || a.status === 'confirmed')
      );
      
      days.push({
        date: dateStr,
        label: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        receita: dayAppointments.reduce((sum, a) => sum + (a.totalPrice || 0), 0),
        agendamentos: dayAppointments.length
      });
    }
    
    return days;
  }, [appointments]);

  // Dados para gráfico de horários de pico
  const peakHoursData = useMemo(() => {
    const hours: Record<string, number> = {};
    
    // Inicializar horários (9h às 20h)
    for (let h = 9; h <= 20; h++) {
      hours[`${h.toString().padStart(2, '0')}:00`] = 0;
    }
    
    // Contar agendamentos por hora
    appointments
      .filter(a => a.status === 'confirmed' || a.status === 'completed')
      .forEach(a => {
        const hour = a.time?.substring(0, 2) + ':00';
        if (hours[hour] !== undefined) {
          hours[hour]++;
        }
      });
    
    return Object.entries(hours).map(([hour, count]) => ({
      hora: hour,
      agendamentos: count
    }));
  }, [appointments]);

  // Dados para gráfico de distribuição por barbeiro
  const barberData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    appointments
      .filter(a => a.status === 'completed')
      .forEach(a => {
        const barberName = barbers.find(b => b.id === a.barberId)?.name || 'Desconhecido';
        counts[barberName] = (counts[barberName] || 0) + 1;
      });
    
    return Object.entries(counts).map(([name, value]) => ({
      name: name.length > 12 ? name.substring(0, 12) + '...' : name,
      value
    }));
  }, [appointments, barbers]);

  // Dados para gráfico de serviços mais procurados
  const serviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    appointments
      .filter(a => a.status === 'completed')
      .forEach(a => {
        a.serviceNames?.forEach(name => {
          counts[name] = (counts[name] || 0) + 1;
        });
      });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        value
      }));
  }, [appointments]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'completed');
    const totalRevenue = completed.reduce((sum, a) => sum + (a.totalPrice || 0), 0);
    const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;
    
    return {
      totalRevenue,
      avgTicket,
      totalAppointments: completed.length,
      successRate: appointments.length > 0 
        ? Math.round((completed.length / appointments.length) * 100) 
        : 0
    };
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-400/80 text-xs font-medium mb-1">Receita Total</p>
          <p className="text-emerald-400 text-2xl font-black">R$ {stats.totalRevenue.toFixed(0)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-900/40 to-amber-950/40 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400/80 text-xs font-medium mb-1">Ticket Médio</p>
          <p className="text-amber-400 text-2xl font-black">R$ {stats.avgTicket.toFixed(0)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-400/80 text-xs font-medium mb-1">Atendimentos</p>
          <p className="text-blue-400 text-2xl font-black">{stats.totalAppointments}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border border-purple-500/20 rounded-xl p-4">
          <p className="text-purple-400/80 text-xs font-medium mb-1">Taxa Sucesso</p>
          <p className="text-purple-400 text-2xl font-black">{stats.successRate}%</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita Últimos 7 Dias */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
            Receita - Últimos 7 Dias
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horários de Pico */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
            Horários de Pico
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hora" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Line type="monotone" dataKey="agendamentos" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição por Barbeiro */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            Atendimentos por Barbeiro
          </h3>
          <div className="h-48 flex items-center justify-center">
            {barberData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={barberData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {barberData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-xs">Sem dados disponíveis</p>
            )}
          </div>
        </div>

        {/* Serviços Mais Procurados */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
            Serviços Mais Procurados
          </h3>
          <div className="h-48">
            {serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-xs">Sem dados disponíveis</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
