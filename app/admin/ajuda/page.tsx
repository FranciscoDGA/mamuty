'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  HelpCircle, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Users, 
  Scissors, 
  QrCode, 
  Award, 
  MessageSquare, 
  PhoneCall, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone,
  Printer,
  ShieldCheck,
  Search
} from 'lucide-react';

interface HelpTopic {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge?: string;
  routeTarget: string;
  routeLabel: string;
  steps: { title: string; desc: string; tip?: string }[];
  whatsappExample?: string;
}

export default function AjudaAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('cadeira');

  const topics: HelpTopic[] = [
    {
      id: 'cadeira',
      category: 'Fidelização & Agenda',
      title: 'Agendamento da Cadeira (+15d e +21d)',
      subtitle: 'Como garantir o próximo corte do cliente antes dele levantar da cadeira',
      icon: Calendar,
      badge: 'Gera + Faturamento',
      routeTarget: '/admin',
      routeLabel: 'Ir para a Agenda',
      steps: [
        {
          title: '1. Abra a Agenda no celular',
          desc: 'Acesse a tela inicial do Admin (/admin) no seu celular enquanto finaliza o atendimento do cliente.'
        },
        {
          title: '2. Toque em [+15d] ou [+21d]',
          desc: 'No card do agendamento concluído, selecione se o cliente precisa voltar em 15 dias (ideal para degradê/fade) ou 21 dias (corte tradicional).',
          tip: 'O sistema calcula automaticamente o mesmo dia da semana e mesmo horário!'
        },
        {
          title: '3. Envie a confirmação no WhatsApp',
          desc: 'O sistema abre o WhatsApp do cliente na hora com a mensagem de confirmação preenchida. É só clicar em Enviar.'
        }
      ],
      whatsappExample: 'Fala Carlos! Seu retorno na cadeira com Hemerson Barber já ficou garantido para Sexta-feira às 15:00. Nos vemos lá!'
    },
    {
      id: 'plaquinha',
      category: 'Marketing no Espelho',
      title: 'Plaquinha de Acrílico com QR Code',
      subtitle: 'Como gerar e imprimir os displays com QR Code para colocar nas bancadas',
      icon: QrCode,
      badge: 'Exclusivo',
      routeTarget: '/admin/marketing',
      routeLabel: 'Gerar Plaquinhas',
      steps: [
        {
          title: '1. Acesse a aba Plaquinhas do Espelho',
          desc: 'No menu Marketing, toque na aba superior "Plaquinhas do Espelho".'
        },
        {
          title: '2. Selecione o Barbeiro da Cadeira',
          desc: 'Escolha a cadeira correspondente (ex: Hemerson Barber ou Barbearia Geral). O QR Code é gerado instantaneamente na tela.'
        },
        {
          title: '3. Imprima ou envie ao Barbeiro',
          desc: 'Toque em "Imprimir Placa (A5)" para imprimir a plaquinha de mesa com borda dourada, ou envie o link direto ao barbeiro pelo WhatsApp.',
          tip: 'Coloque a plaquinha na bancada ou no espelho. O cliente aponta a câmera e agenda direto com você em 10 segundos!'
        }
      ]
    },
    {
      id: 'fidelidade',
      category: 'Clube de Vantagens',
      title: 'Cartão Fidelidade por Celular (+1 Selo)',
      subtitle: 'Como pontuar clientes sem papel e como o cliente consulta os 10 selos',
      icon: Award,
      badge: 'Sem Senha',
      routeTarget: '/admin',
      routeLabel: 'Ir para a Agenda',
      steps: [
        {
          title: '1. O cliente consulta apenas com o WhatsApp',
          desc: 'O cliente entra no site da barbearia, clica na aba "Fidelidade" e digita o telefone dele. Não precisa criar login nem senha.'
        },
        {
          title: '2. Você dá +1 Selo com 1 toque',
          desc: 'No card do cliente na Agenda, toque no botão dourado [+1 Selo]. O sistema credita o ponto no cadastro dele.'
        },
        {
          title: '3. Notificação automática e Corte Grátis',
          desc: 'O WhatsApp abre parabenizando o cliente pelo selo. Quando ele completa 10 selos, a tela estoura em confetes com o corte 100% grátis.',
          tip: 'Fideliza o cliente que nunca mais vai querer cortar em outra barbearia!'
        }
      ],
      whatsappExample: 'Show Carlos! Você ganhou +1 selo no Clube Mamuty. Agora você tem 8 de 10 selos! Faltam apenas 2 cortes para o corte grátis.'
    },
    {
      id: 'lembretes',
      category: 'Marketing Ativo',
      title: 'Lembretes de Visual (+15d, +20d e +30d)',
      subtitle: 'Como recuperar clientes sumidos e preencher os dias de pouco movimento',
      icon: MessageSquare,
      badge: 'Recupera Clientes',
      routeTarget: '/admin/marketing',
      routeLabel: 'Ver Clientes Inativos',
      steps: [
        {
          title: '1. Escolha a régua de tempo',
          desc: 'Na aba Marketing, filtre clientes que estão a +15 dias (fade/degradê perdendo a linha), +20 dias (alinhamento de barba) ou +30 dias (corte atrasado).'
        },
        {
          title: '2. Mensagem pronta humanizada',
          desc: 'O sistema já escreve a mensagem citando o nome do cliente, o último corte que ele fez e o barbeiro que o atendeu.'
        },
        {
          title: '3. Dispare em 1 toque',
          desc: 'Toque em [Disparar WhatsApp] ao lado de cada cliente. Em 3 minutos você manda mensagem para 10 clientes e preenche sua agenda da semana.',
          tip: 'Faça isso às terças e quartas-feiras para lotar a barbearia antes do fim de semana!'
        }
      ]
    },
    {
      id: 'whatsapp_ia',
      category: 'Atendimento Automático',
      title: 'Atendente de IA com Áudios no WhatsApp',
      subtitle: 'Como clientes podem agendar e tirar dúvidas por texto ou gravando áudios de voz',
      icon: PhoneCall,
      badge: 'Inovação',
      routeTarget: '/whatsapp',
      routeLabel: 'Testar WhatsApp IA',
      steps: [
        {
          title: '1. Simulação visual idêntica ao WhatsApp',
          desc: 'O assistente funciona no link /whatsapp. O cliente que não gosta de formulários fala com o robô inteligente da Mamuty.'
        },
        {
          title: '2. Gravação de Voz por Áudio',
          desc: 'O cliente clica no microfone e fala naturalmente ("Tem vaga com o Hemerson hoje à tarde?").'
        },
        {
          title: '3. A IA transcreve e responde na hora',
          desc: 'O assistente entende o áudio, mostra os horários disponíveis e gera as opções de confirmação com 1 toque.',
          tip: 'Ótimo para clientes mais velhos ou que têm dificuldade de usar internet!'
        }
      ]
    },
    {
      id: 'financeiro',
      category: 'Gestão do Negócio',
      title: 'Financeiro, Caixa & Comissões',
      subtitle: 'Como controlar o dinheiro da barbearia, entradas do Pix e despesas do dia',
      icon: DollarSign,
      badge: 'Controle Total',
      routeTarget: '/admin/financeiro',
      routeLabel: 'Acessar Financeiro',
      steps: [
        {
          title: '1. Entradas automáticas por atendimento',
          desc: 'Cada agendamento finalizado é somado automaticamente no faturamento bruto do dia e do mês.'
        },
        {
          title: '2. Lançar despesas rápidas',
          desc: 'Gastou com giletes, produtos, energia ou café? Toque em "Nova Despesa" e registre o valor em 10 segundos.'
        },
        {
          title: '3. Fechamento de Caixa e Comissões',
          desc: 'O painel mostra o lucro líquido exato da barbearia descontando despesas e dividindo a comissão de cada barbeiro.',
          tip: 'Evita erros de contas no final do mês e dá visão real do seu lucro!'
        }
      ]
    },
    {
      id: 'servicos',
      category: 'Configuração da Barbearia',
      title: 'Cadastro de Serviços, Barbeiros & Preços',
      subtitle: 'Como adicionar cortes, mudar preços e gerenciar a equipe',
      icon: Scissors,
      routeTarget: '/admin/servicos',
      routeLabel: 'Gerenciar Serviços',
      steps: [
        {
          title: '1. Ajuste preços a qualquer momento',
          desc: 'Acesse /admin/servicos para editar valores, tempos de atendimento e descrições dos cortes.'
        },
        {
          title: '2. Cadastre novos barbeiros',
          desc: 'Em /admin/profissionais, adicione novos integrantes da equipe com foto, especialidades e telefone.'
        },
        {
          title: '3. Serviços Kids em Destaque',
          desc: 'O serviço de atendimento infantil já está configurado e destacado no app para valorizar seu atendimento familiar.',
          tip: 'Tudo o que você altera aqui é refletido imediatamente no celular dos clientes!'
        }
      ]
    }
  ];

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Central de Ajuda & Treinamento</h1>
          </div>
          <p className="text-xs text-slate-400">
            Aprenda o passo a passo prático de cada recurso para tirar o máximo proveito da Mamuty Barbearia
          </p>
        </div>

        <Link
          href="/admin"
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
        >
          <span>Voltar para a Agenda</span>
        </Link>
      </div>

      {/* Quick Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Qual funcionalidade você quer aprender? (ex: cadeira, selo, plaquinha, caixa...)"
          className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
        />
      </div>

      {/* Topics Accordion List */}
      <div className="space-y-3">
        {filteredTopics.map((topic) => {
          const Icon = topic.icon;
          const isExpanded = expandedId === topic.id;

          return (
            <div 
              key={topic.id}
              className={`rounded-2xl border transition overflow-hidden ${
                isExpanded 
                  ? 'bg-slate-900 border-amber-500/50 shadow-xl' 
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Accordion Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : topic.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition ${
                    isExpanded 
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20' 
                      : 'bg-slate-800/80 text-amber-400 border-slate-700'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {topic.category}
                      </span>
                      {topic.badge && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                          {topic.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-white text-sm sm:text-base truncate">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate hidden sm:block">
                      {topic.subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-1 rounded-lg bg-slate-800 text-slate-400 ml-2 shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Accordion Expanded Content */}
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-800/70 space-y-4">
                  <p className="text-xs text-slate-300 sm:hidden">
                    {topic.subtitle}
                  </p>

                  {/* Steps List */}
                  <div className="space-y-2.5">
                    {topic.steps.map((step, idx) => (
                      <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                        <h4 className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{step.title}</span>
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed pl-5">
                          {step.desc}
                        </p>
                        {step.tip && (
                          <div className="ml-5 mt-1 text-[11px] text-amber-400/90 font-medium bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                            💡 <strong>Dica de Ouro:</strong> {step.tip}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* WhatsApp Example Box */}
                  {topic.whatsappExample && (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider block">
                        📱 Exemplo de Mensagem Pronta para WhatsApp:
                      </span>
                      <p className="text-xs text-slate-200 italic">
                        &ldquo;{topic.whatsappExample}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Direct Route Action */}
                  <div className="pt-2 flex justify-end">
                    <Link
                      href={topic.routeTarget}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
                    >
                      <span>{topic.routeLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Box */}
      <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <h4 className="font-bold text-white text-sm">Ficou com alguma dúvida adicional?</h4>
          <p className="text-xs text-slate-400">
            Você tem suporte prioritário a qualquer momento para tirar dúvidas do sistema.
          </p>
        </div>
        <a
          href="https://wa.me/5594984439065?text=Ola!%20Estou%20com%20uma%20duvida%20sobre%20o%20app%20Mamuty."
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md active:scale-95 shrink-0 flex items-center gap-2"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Falar no WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
