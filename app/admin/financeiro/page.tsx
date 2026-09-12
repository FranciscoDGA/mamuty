'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Plus, 
  Download, 
  Calendar, 
  Users, 
  Scissors, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  X,
  CheckCircle2,
  Receipt
} from 'lucide-react';

interface LocalTransaction {
  id: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: 'pix' | 'cartao' | 'dinheiro';
  barberId?: string;
  barberName?: string;
}

const INITIAL_TRANSACTIONS: LocalTransaction[] = [];

export default function FinanceiroPage() {
  const { appointments, barbers } = useApp();

  const [transactions, setTransactions] = useState<LocalTransaction[]>(INITIAL_TRANSACTIONS);
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('month');
  const [commissionRate, setCommissionRate] = useState<number>(50); // 50% de comissão padrão
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Transaction Form State
  const [txForm, setTxForm] = useState({
    type: 'receita' as 'receita' | 'despesa',
    category: 'Serviços',
    description: '',
    amount: '',
    paymentMethod: 'pix' as 'pix' | 'cartao' | 'dinheiro',
    barberName: ''
  });

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mamuty_financial_txs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTransactions(parsed);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar transações financeiras:', e);
    }
  }, []);

  // Save to localStorage
  const saveTransactions = (newTxs: LocalTransaction[]) => {
    setTransactions(newTxs);
    try {
      localStorage.setItem('mamuty_financial_txs', JSON.stringify(newTxs));
    } catch (e) {
      console.warn('Erro ao salvar transações financeiras:', e);
    }
  };

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (dateFilter === 'today' && t.date !== todayStr) return false;
      if (dateFilter === 'month' && !t.date.startsWith(currentMonthStr)) return false;
      return true;
    });
  }, [transactions, filterType, dateFilter, todayStr, currentMonthStr]);

  const totalReceitas = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'receita')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalDespesas = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const lucroLiquido = totalReceitas - totalDespesas;

  const countReceitas = filteredTransactions.filter(t => t.type === 'receita').length;
  const ticketMedio = countReceitas > 0 ? totalReceitas / countReceitas : 0;

  // Breakdown por pagamento
  const paymentBreakdown = useMemo(() => {
    const res = { pix: 0, cartao: 0, dinheiro: 0 };
    filteredTransactions.forEach(t => {
      if (t.type === 'receita') {
        res[t.paymentMethod] += t.amount;
      }
    });
    return res;
  }, [filteredTransactions]);

  // Fechamento de Caixa de Hoje
  const caixaHoje = useMemo(() => {
    const txHoje = transactions.filter(t => t.date === todayStr);
    const recHoje = txHoje.filter(t => t.type === 'receita').reduce((a, b) => a + b.amount, 0);
    const despHoje = txHoje.filter(t => t.type === 'despesa').reduce((a, b) => a + b.amount, 0);
    const dinheiroFisico = txHoje.filter(t => t.type === 'receita' && t.paymentMethod === 'dinheiro').reduce((a, b) => a + b.amount, 0);
    const pixHoje = txHoje.filter(t => t.type === 'receita' && t.paymentMethod === 'pix').reduce((a, b) => a + b.amount, 0);
    const cartaoHoje = txHoje.filter(t => t.type === 'receita' && t.paymentMethod === 'cartao').reduce((a, b) => a + b.amount, 0);
    return { recHoje, despHoje, saldoHoje: recHoje - despHoje, dinheiroFisico, pixHoje, cartaoHoje, totalAtendimentos: txHoje.filter(t => t.type === 'receita').length };
  }, [transactions, todayStr]);

  // Comissões dos Barbeiros
  const barberCommissions = useMemo(() => {
    const map: Record<string, { totalProduced: number; count: number }> = {};
    barbers.forEach(b => {
      map[b.name] = { totalProduced: 0, count: 0 };
    });

    filteredTransactions.forEach(t => {
      if (t.type === 'receita' && t.barberName) {
        if (!map[t.barberName]) {
          map[t.barberName] = { totalProduced: 0, count: 0 };
        }
        map[t.barberName].totalProduced += t.amount;
        map[t.barberName].count += 1;
      }
    });

    return Object.entries(map).map(([name, data]) => {
      const barberVal = (data.totalProduced * commissionRate) / 100;
      const houseVal = data.totalProduced - barberVal;
      return {
        name,
        totalProduced: data.totalProduced,
        count: data.count,
        barberVal,
        houseVal
      };
    });
  }, [barbers, filteredTransactions, commissionRate]);

  // Add Transaction Handler
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(txForm.amount);
    if (!numAmount || numAmount <= 0 || !txForm.description.trim()) {
      alert('Informe um valor válido e uma descrição.');
      return;
    }

    const newTx: LocalTransaction = {
      id: `tx-${Date.now()}`,
      type: txForm.type,
      category: txForm.category,
      description: txForm.description.trim(),
      amount: numAmount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: txForm.paymentMethod,
      barberName: txForm.barberName || undefined
    };

    saveTransactions([newTx, ...transactions]);
    setIsModalOpen(false);
    setTxForm({
      type: 'receita',
      category: 'Serviços',
      description: '',
      amount: '',
      paymentMethod: 'pix',
      barberName: ''
    });
    alert('Lançamento financeiro registrado com sucesso!');
  };

  const handleDeleteTx = (id: string, desc: string) => {
    if (!confirm(`Deseja realmente remover o lançamento "${desc}"?`)) return;
    const next = transactions.filter(t => t.id !== id);
    saveTransactions(next);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Data', 'Tipo', 'Categoria', 'Descricao', 'Metodo_Pagamento', 'Barbeiro', 'Valor'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.type,
      `"${t.category}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.paymentMethod,
      `"${t.barberName || '-'}"`,
      t.amount.toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financeiro-mamuty-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-emerald-400" />
              Gestão Financeira & Caixa
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visão completa do faturamento, despesas operacionais, comissões e fechamento diário da barbearia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 cursor-pointer"
            title="Exportar dados para planilha Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar no Caixa</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold px-2">Período:</span>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              dateFilter === 'today' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              dateFilter === 'month' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Mês Atual
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              dateFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Histórico Completo
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Filtrar Tipo:</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Todas as Movimentações</option>
            <option value="receita">Apenas Receitas (+)</option>
            <option value="despesa">Apenas Despesas (-)</option>
          </select>
        </div>
      </div>

      {/* Filter Status */}
      <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>
          Exibindo: <strong className="text-slate-300">
            {filterType === 'all' ? 'Todas' : filterType === 'receita' ? 'Receitas' : 'Despesas'}
          </strong>
          {dateFilter === 'today' && ' — Hoje'}
          {dateFilter === 'month' && ' — Mês Atual'}
          {dateFilter === 'all' && ' — Histórico Completo'}
          {' • '}<strong className="text-amber-400">{filteredTransactions.length}</strong> registro(s)
        </span>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Bruto */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-emerald-900/30 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faturamento Bruto</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            R$ {totalReceitas.toFixed(2).replace('.', ',')}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-bold">+{countReceitas}</span>
            <span>entradas no período</span>
          </div>
        </div>

        {/* Despesas Operacionais */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-rose-900/30 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Despesas / Custos</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-2">
            R$ {totalDespesas.toFixed(2).replace('.', ',')}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
            <span>Insumos, café, manutenção</span>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-amber-900/30 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido Real</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black mt-2 ${lucroLiquido >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            R$ {lucroLiquido.toFixed(2).replace('.', ',')}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
            <span>Margem líquida livre no bolso</span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-cyan-900/30 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ticket Médio</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-cyan-400 mt-2">
            R$ {ticketMedio.toFixed(2).replace('.', ',')}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
            <span>Média por cliente atendido</span>
          </div>
        </div>
      </div>

      {/* Caixa do Dia + Distribuição Meios de Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fechamento do Caixa Hoje */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Fechamento do Dia ({todayStr})</h3>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
              Ao Vivo
            </span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Atendimentos Hoje:</span>
              <span className="font-bold text-white">{caixaHoje.totalAtendimentos} cortes/serviços</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Total Faturado Hoje:</span>
              <span className="font-bold text-emerald-400">R$ {caixaHoje.recHoje.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Dinheiro Físico na Gaveta:</span>
              <span className="font-extrabold text-amber-400">R$ {caixaHoje.dinheiroFisico.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Recebido via PIX:</span>
              <span className="font-bold text-white">R$ {caixaHoje.pixHoje.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Cartão de Crédito/Débito:</span>
              <span className="font-bold text-white">R$ {caixaHoje.cartaoHoje.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>

        {/* Breakdown de Pagamentos */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <PieChart className="w-4 h-4 text-amber-400" />
            <span>Faturamento por Meio de Pagamento</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* PIX */}
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                  0% Taxa
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">PIX Instantâneo</span>
                <span className="text-lg font-black text-white">
                  R$ {paymentBreakdown.pix.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Cartão */}
            <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded">
                  Maquininha
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Cartão Débito / Crédito</span>
                <span className="text-lg font-black text-white">
                  R$ {paymentBreakdown.cartao.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Dinheiro */}
            <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded">
                  No Local
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Dinheiro / Espécie</span>
                <span className="text-lg font-black text-white">
                  R$ {paymentBreakdown.dinheiro.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Módulo de Comissões dos Barbeiros */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-400" />
              <span>Controle de Comissões da Equipe</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculo automático do repasse de cada barbeiro com base no faturamento individual
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Comissão:</span>
            <select
              value={commissionRate}
              onChange={e => setCommissionRate(Number(e.target.value))}
              className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
            >
              <option value="40" className="bg-slate-900">40% Barbeiro / 60% Barbearia</option>
              <option value="50" className="bg-slate-900">50% Barbeiro / 50% Barbearia</option>
              <option value="60" className="bg-slate-900">60% Barbeiro / 40% Barbearia</option>
              <option value="70" className="bg-slate-900">70% Barbeiro / 30% Barbearia</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {barberCommissions.map((bc, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{bc.name}</span>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                  {bc.count} cortes
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Produção Total:</span>
                  <span className="font-bold text-white">R$ {bc.totalProduced.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Repasse Barbeiro ({commissionRate}%):</span>
                  <span>R$ {bc.barberVal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-slate-800">
                  <span>Fica com a Barbearia:</span>
                  <span>R$ {bc.houseVal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Livro Caixa (Histórico de Movimentações) */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              <span>Livro Caixa & Movimentações</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Histórico detalhado de entradas e saídas registradas
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {filteredTransactions.length} registros exibidos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Categoria & Descrição</th>
                <th className="py-2.5 px-3">Profissional</th>
                <th className="py-2.5 px-3">Método</th>
                <th className="py-2.5 px-3 text-right">Valor</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                    {tx.date}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.type === 'receita'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {tx.type === 'receita' ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> Receita
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3" /> Despesa
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200">{tx.description}</div>
                    <div className="text-[10px] text-slate-500">{tx.category}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {tx.barberName ? (
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium text-amber-300">
                        {tx.barberName}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 uppercase text-[10px] font-bold text-slate-400">
                    {tx.paymentMethod}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-black text-sm whitespace-nowrap ${
                      tx.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'receita' ? '+' : '-'} R$ {tx.amount.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDeleteTx(tx.id, tx.description)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <DollarSign className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm">Nenhum lançamento encontrado para este filtro.</p>
              <p className="text-xs text-slate-600">
                {dateFilter === 'today' && 'Nenhum lançamento registrado hoje. Clique em "Lançar no Caixa" para adicionar.'}
                {dateFilter === 'month' && 'Nenhum lançamento neste mês. Clique em "Lançar no Caixa" para adicionar.'}
                {dateFilter === 'all' && 'Nenhum lançamento registrado ainda. Comece clicando em "Lançar no Caixa".'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Lançar no Caixa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleAddTransaction}
            className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full shadow-2xl space-y-4 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg text-white">Lançar no Caixa</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tipo: Receita ou Despesa */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Tipo de Movimentação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'receita', category: 'Serviços' })}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                    txForm.type === 'receita'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Entrada / Receita</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'despesa', category: 'Insumos' })}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                    txForm.type === 'despesa'
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Saída / Despesa</span>
                </button>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Descrição do Lançamento</label>
              <input
                required
                value={txForm.description}
                onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                placeholder={txForm.type === 'receita' ? 'Ex: Corte Degradê + Pomada no Balcão' : 'Ex: Compra de lâminas descartáveis e toalhas'}
              />
            </div>

            {/* Valor e Categoria */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Valor (R$)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={txForm.amount}
                  onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  placeholder="50.00"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Categoria</label>
                <select
                  value={txForm.category}
                  onChange={e => setTxForm({ ...txForm, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none cursor-pointer"
                >
                  {txForm.type === 'receita' ? (
                    <>
                      <option value="Serviços">✂️ Serviços / Cortes</option>
                      <option value="Venda de Produto">📦 Venda de Produtos</option>
                      <option value="Combo VIP">👑 Combo VIP</option>
                      <option value="Outros">Outras Entradas</option>
                    </>
                  ) : (
                    <>
                      <option value="Insumos">💈 Insumos & Lâminas</option>
                      <option value="Café & Bar">☕ Café, Água & Cerveja</option>
                      <option value="Aluguel & Contas">⚡ Energia, Água & Net</option>
                      <option value="Equipamentos">🔧 Máquinas & Manutenção</option>
                      <option value="Outros">Outras Saídas</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Meio de Pagamento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Meio de Pagamento</label>
                <select
                  value={txForm.paymentMethod}
                  onChange={e => setTxForm({ ...txForm, paymentMethod: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none cursor-pointer"
                >
                  <option value="pix">📱 PIX Instantâneo</option>
                  <option value="cartao">💳 Cartão Crédito/Débito</option>
                  <option value="dinheiro">💵 Dinheiro / Espécie</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Profissional (Opcional)</label>
                <select
                  value={txForm.barberName}
                  onChange={e => setTxForm({ ...txForm, barberName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none cursor-pointer"
                >
                  <option value="">Nenhum / Geral da Barbearia</option>
                  {barbers.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Confirmar Lançamento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
