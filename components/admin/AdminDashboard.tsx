'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Appointment, Customer, FinancialTransaction, Service } from '@/lib/types';
import { formatWhatsAppMessage, generateWhatsAppUrl } from '@/lib/whatsapp';
import { WhatsAppNotificationModal } from '@/components/WhatsAppNotificationModal';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  CalendarCheck,
  Scissors,
  Plus,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  CreditCard,
  Banknote,
  Settings,
  Download,
  RotateCcw,
  Sparkles,
  Smartphone,
  ChevronRight,
  Trash2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    appointments,
    customers,
    transactions,
    services,
    barbers,
    salonConfig,
    updateSalonConfig,
    updateAppointmentStatus,
    addTransaction,
    addService,
    deleteService,
    resetAllData,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'financeiro' | 'agenda' | 'clientes' | 'servicos' | 'config'>('financeiro');
  const [selectedWhatsAppApt, setSelectedWhatsAppApt] = useState<Appointment | null>(null);

  // Search queries
  const [clientSearch, setClientSearch] = useState('');
  const [agendaSearch, setAgendaSearch] = useState('');
  const [agendaBarberFilter, setAgendaBarberFilter] = useState('todos');

  // New Transaction Form state
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<'receita' | 'despesa'>('receita');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Serviços Extras');
  const [txDesc, setTxDesc] = useState('');
  const [txMethod, setTxMethod] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');

  // New Service Form state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvCategory, setNewSrvCategory] = useState<'cabelo' | 'barba' | 'combos' | 'tratamentos'>('cabelo');
  const [newSrvPrice, setNewSrvPrice] = useState('');
  const [newSrvDuration, setNewSrvDuration] = useState('30');
  const [newSrvDesc, setNewSrvDesc] = useState('');

  // === FINANCIAL CALCULATIONS ===
  const totalReceitas = useMemo(() => {
    return transactions.filter((t) => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const totalDespesas = useMemo(() => {
    return transactions.filter((t) => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const lucroLiquido = totalReceitas - totalDespesas;

  const ticketMedio = useMemo(() => {
    const revenueCount = transactions.filter((t) => t.type === 'receita').length;
    return revenueCount > 0 ? totalReceitas / revenueCount : 0;
  }, [totalReceitas, transactions]);

  const paymentBreakdown = useMemo(() => {
    const counts = { pix: 0, cartao: 0, dinheiro: 0, presencial: 0 };
    transactions.forEach((t) => {
      if (t.type === 'receita') {
        const m = t.paymentMethod as keyof typeof counts;
        if (counts[m] !== undefined) counts[m] += t.amount;
      }
    });
    return counts;
  }, [transactions]);

  // Handler to add manual transaction
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (!amountNum || amountNum <= 0 || !txDesc.trim()) {
      alert('Preencha um valor válido e descrição.');
      return;
    }

    addTransaction({
      type: txType,
      category: txCategory,
      amount: amountNum,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: txMethod,
      description: txDesc.trim(),
    });

    setTxAmount('');
    setTxDesc('');
    setShowTxModal(false);
    alert('Lançamento financeiro registrado com sucesso!');
  };

  // Handler to add service
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newSrvPrice);
    const durationNum = parseInt(newSrvDuration);
    if (!newSrvName.trim() || !priceNum || !durationNum) {
      alert('Preencha os campos obrigatórios do serviço.');
      return;
    }

    addService({
      name: newSrvName.trim(),
      category: newSrvCategory,
      description: newSrvDesc.trim(),
      price: priceNum,
      durationMinutes: durationNum,
      pointsReward: Math.floor(priceNum),
    });

    setNewSrvName('');
    setNewSrvPrice('');
    setNewSrvDesc('');
    setShowServiceModal(false);
    alert('Novo serviço adicionado ao catálogo com sucesso!');
  };

  // Filtered clients
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.phone.includes(clientSearch) ||
        (c.email && c.email.toLowerCase().includes(clientSearch.toLowerCase()))
    );
  }, [customers, clientSearch]);

  // Filtered agenda
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchBarber = agendaBarberFilter === 'todos' || apt.barberId === agendaBarberFilter;
      const matchSearch =
        apt.customerName.toLowerCase().includes(agendaSearch.toLowerCase()) ||
        apt.customerPhone.includes(agendaSearch) ||
        apt.serviceNames.join(' ').toLowerCase().includes(agendaSearch.toLowerCase());
      return matchBarber && matchSearch;
    });
  }, [appointments, agendaBarberFilter, agendaSearch]);

  // WhatsApp recall for inactive client
  const handleSendRecallWhatsApp = (customer: Customer) => {
    const cleanPhone = customer.phone.replace(/\D/g, '');
    const phone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const msg =
      `Fala, *${customer.name.split(' ')[0]}*! Tudo certo? 💈\n\n` +
      `Sentimos sua falta aqui na *Barbearia Mamuty*! Você tem *${customer.loyaltyStamps} selos* e *${customer.loyaltyPoints} pontos* acumulados no seu Clube VIP.\n\n` +
      `Que tal dar aquele talento no visual essa semana? Temos horários disponíveis!\n\n` +
      `Acesse nosso app e agende em segundos:\n` +
      `📍 ${salonConfig.address}`;
    window.open(generateWhatsAppUrl(phone, msg), '_blank');
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-950 p-5 rounded-3xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Painel de Gestão & Financeiro</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controle central da Barbearia Mamuty: faturamento, agenda, clientes e fidelidade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTxModal(true)}
            id="btn-admin-add-tx"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-900/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lançar Caixa</span>
          </button>

          <button
            onClick={() => {
              const jsonStr = JSON.stringify(
                { appointments, customers, transactions, services, salonConfig },
                null,
                2
              );
              const blob = new Blob([jsonStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `mamuty-dados-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            id="btn-export-backup"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Exportar Backup JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveAdminTab('financeiro')}
          id="tab-admin-finance"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            activeAdminTab === 'financeiro'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financeiro & Caixa</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('agenda')}
          id="tab-admin-agenda"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            activeAdminTab === 'agenda'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Agenda & Atendimentos ({appointments.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('clientes')}
          id="tab-admin-clients"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            activeAdminTab === 'clientes'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Histórico de Clientes ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('servicos')}
          id="tab-admin-services"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            activeAdminTab === 'servicos'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Serviços & Preços ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('config')}
          id="tab-admin-config"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            activeAdminTab === 'config'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </div>

      {/* ================= 1. FINANCEIRO & CAIXA ================= */}
      {activeAdminTab === 'financeiro' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Key Financial Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Faturamento Total
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">
                R$ {totalReceitas.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {transactions.filter((t) => t.type === 'receita').length} transações registradas
              </span>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Despesas Totais
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-400 mt-1 block">
                R$ {totalDespesas.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Insumos, café e manutenção
              </span>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Lucro Líquido
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1 block">
                R$ {lucroLiquido.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Margem de rentabilidade
              </span>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Ticket Médio
              </span>
              <span className="text-xl sm:text-2xl font-black text-cyan-400 mt-1 block">
                R$ {ticketMedio.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Média por atendimento
              </span>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Receitas por Método de Pagamento</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block">PIX Integrado</span>
                    <span className="text-[10px] text-slate-500">Mais rápido</span>
                  </div>
                </div>
                <span className="font-extrabold text-white text-sm">
                  R$ {paymentBreakdown.pix.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block">Cartão de Crédito</span>
                    <span className="text-[10px] text-slate-500">À vista e parcelado</span>
                  </div>
                </div>
                <span className="font-extrabold text-white text-sm">
                  R$ {paymentBreakdown.cartao.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block">Dinheiro / No Local</span>
                    <span className="text-[10px] text-slate-500">Balcão físico</span>
                  </div>
                </div>
                <span className="font-extrabold text-white text-sm">
                  R$ {(paymentBreakdown.dinheiro + paymentBreakdown.presencial).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* Livro Caixa (Transactions List) */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Livro Caixa / Transações Recentes</span>
              </h3>
              <span className="text-xs text-slate-400">
                {transactions.length} registros
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Categoria & Descrição</th>
                    <th className="py-2.5 px-3">Método</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'receita'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {tx.type === 'receita' ? '+ Receita' : '- Despesa'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-200">{tx.description}</div>
                        <div className="text-[10px] text-slate-500">{tx.category}</div>
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[10px] text-slate-400">
                        {tx.paymentMethod}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-extrabold whitespace-nowrap ${
                          tx.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'receita' ? '+' : '-'} R$ {tx.amount.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. AGENDA GERAL ================= */}
      {activeAdminTab === 'agenda' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={agendaSearch}
                onChange={(e) => setAgendaSearch(e.target.value)}
                placeholder="Buscar por cliente, telefone ou serviço..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={agendaBarberFilter}
                onChange={(e) => setAgendaBarberFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500 w-full sm:w-auto"
              >
                <option value="todos">Todos os Barbeiros</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Appointments Table / Cards */}
          <div className="space-y-2.5">
            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Nenhum agendamento encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex flex-col items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] font-black">{apt.time}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-white">{apt.customerName}</h4>
                        <span className="text-xs text-slate-400">({apt.customerPhone})</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.2 rounded-full uppercase ${
                            apt.status === 'confirmado'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : apt.status === 'concluido'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-0.5">
                        {apt.serviceNames.join(' + ')} • <strong className="text-amber-400">{apt.barberName}</strong>
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Data: {apt.date}</span>
                        <span>•</span>
                        <span className="text-white font-bold">R$ {apt.totalPrice.toFixed(2)}</span>
                        <span>•</span>
                        <span className="uppercase text-[10px] text-slate-400">
                          {apt.paymentMethod} ({apt.paymentStatus})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                    {/* WhatsApp notification trigger */}
                    <button
                      onClick={() => setSelectedWhatsAppApt(apt)}
                      className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/30 transition"
                      title="Enviar WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    {apt.status === 'confirmado' && (
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'concluido', 'pago')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                      >
                        Concluir Atendimento
                      </button>
                    )}

                    {apt.status !== 'cancelado' && (
                      <button
                        onClick={() => {
                          if (confirm('Cancelar este agendamento?')) {
                            updateAppointmentStatus(apt.id, 'cancelado');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 text-xs transition"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= 3. HISTÓRICO DE CLIENTES ================= */}
      {activeAdminTab === 'clientes' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Base e Histórico de Clientes</h3>
              <p className="text-xs text-slate-400">
                Acompanhe o engajamento, número de visitas e dispare lembretes via WhatsApp.
              </p>
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{c.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {c.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{c.phone}</p>
                    </div>

                    <button
                      onClick={() => handleSendRecallWhatsApp(c)}
                      id={`btn-recall-${c.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                      title="Mandar mensagem no WhatsApp lembrando do corte"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center my-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Visitas</span>
                      <span className="font-black text-sm text-white">{c.totalVisits}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Gasto Total</span>
                      <span className="font-black text-sm text-amber-400">
                        R$ {c.totalSpent.toFixed(0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Selos / Pts</span>
                      <span className="font-black text-sm text-emerald-400">
                        {c.loyaltyStamps}★ / {c.loyaltyPoints}p
                      </span>
                    </div>
                  </div>

                  {c.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                      Obs: {c.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                  <span>Última visita: {c.lastVisit || 'Primeira vez'}</span>
                  <span>Cliente Recorrente</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 4. SERVIÇOS & PREÇOS ================= */}
      {activeAdminTab === 'servicos' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Catálogo de Serviços da Barbearia</h3>
              <p className="text-xs text-slate-400">
                Gerencie valores, durações e novos procedimentos do salão.
              </p>
            </div>

            <button
              onClick={() => setShowServiceModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Serviço</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{srv.name}</h4>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      {srv.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{srv.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold mt-2">
                    <span className="text-amber-400 font-extrabold text-sm">
                      R$ {srv.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span>• {srv.durationMinutes} min</span>
                    <span className="text-emerald-400">+{srv.pointsReward} pts</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Excluir o serviço "${srv.name}"?`)) {
                      deleteService(srv.id);
                    }
                  }}
                  className="p-2 text-slate-500 hover:text-rose-400 transition"
                  title="Excluir serviço"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 5. CONFIGURAÇÕES GERAIS ================= */}
      {activeAdminTab === 'config' && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4 max-w-2xl animate-in fade-in duration-200">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800 flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Configurações Oficiais da Barbearia Mamuty</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                WhatsApp Oficial do Salão (com DDD)
              </label>
              <input
                type="text"
                value={salonConfig.whatsappNumber}
                onChange={(e) => updateSalonConfig({ whatsappNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Chave PIX Oficial
              </label>
              <input
                type="text"
                value={salonConfig.pixKey}
                onChange={(e) => updateSalonConfig({ pixKey: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Beneficiário PIX
              </label>
              <input
                type="text"
                value={salonConfig.pixBeneficiary}
                onChange={(e) => updateSalonConfig({ pixBeneficiary: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Meta de Selos da Cartela Fidelidade
              </label>
              <input
                type="number"
                value={salonConfig.loyaltyStampsGoal}
                onChange={(e) => updateSalonConfig({ loyaltyStampsGoal: parseInt(e.target.value) || 10 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                value={salonConfig.address}
                onChange={(e) => updateSalonConfig({ address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Alterações salvas automaticamente no navegador.</span>

            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja restaurar os dados de demonstração da Barbearia Mamuty?')) {
                  resetAllData();
                  alert('Dados redefinidos com sucesso!');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800 text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Dados Padrão</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Lançar Transação no Caixa */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateTransaction}
            className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-2xl max-w-md w-full space-y-4"
          >
            <h3 className="font-bold text-sm text-white">Lançar Movimentação de Caixa</h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTxType('receita')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  txType === 'receita'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                + Entrada (Receita)
              </button>
              <button
                type="button"
                onClick={() => setTxType('despesa')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  txType === 'despesa'
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                - Saída (Despesa)
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="Ex: 85.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
              <input
                type="text"
                required
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                placeholder="Ex: Venda de pomada matte"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden"
                >
                  <option value="Serviços de Barbearia">Serviços</option>
                  <option value="Venda de Produtos">Venda Produtos</option>
                  <option value="Insumos e Lâminas">Insumos</option>
                  <option value="Frigobar & Café">Café & Bebidas</option>
                  <option value="Geral">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Meio de Pgto</label>
                <select
                  value={txMethod}
                  onChange={(e) => setTxMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden"
                >
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTxModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
              >
                Salvar Lançamento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Novo Serviço */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateService}
            className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-2xl max-w-md w-full space-y-4"
          >
            <h3 className="font-bold text-sm text-white">Adicionar Novo Serviço ao Mamuty</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Serviço *</label>
              <input
                type="text"
                required
                value={newSrvName}
                onChange={(e) => setNewSrvName(e.target.value)}
                placeholder="Ex: Corte Freestyle Artístico"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Preço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newSrvPrice}
                  onChange={(e) => setNewSrvPrice(e.target.value)}
                  placeholder="Ex: 75.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Duração (min) *</label>
                <input
                  type="number"
                  required
                  value={newSrvDuration}
                  onChange={(e) => setNewSrvDuration(e.target.value)}
                  placeholder="30"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
              <select
                value={newSrvCategory}
                onChange={(e) => setNewSrvCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden"
              >
                <option value="cabelo">✂️ Cabelo</option>
                <option value="barba">🪒 Barba</option>
                <option value="combos">👑 Combos VIP</option>
                <option value="tratamentos">✨ Tratamentos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
              <textarea
                rows={2}
                value={newSrvDesc}
                onChange={(e) => setNewSrvDesc(e.target.value)}
                placeholder="Breve descrição do procedimento..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
              >
                Cadastrar Serviço
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WhatsApp Modal Trigger for any selected appointment */}
      {selectedWhatsAppApt && (
        <WhatsAppNotificationModal
          appointment={selectedWhatsAppApt}
          isOpen={!!selectedWhatsAppApt}
          onClose={() => setSelectedWhatsAppApt(null)}
          initialRecipient="cliente"
        />
      )}
    </div>
  );
};
