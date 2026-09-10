export interface EmpresaInfo {
  nome: string;
  slogan: string;
  dono: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  whatsapp: string;
  whatsappFormatado: string;
  formasPagamento: string[];
  horariosSemanais: {
    dias: string;
    horario: string;
    intervalo: string;
  }[];
}

export interface ServicoConhecimento {
  id: string;
  nome: string;
  preco: number;
  duracaoMinutos: number;
  descricao: string;
  tags: string[];
}

export interface BarbeiroConhecimento {
  id: string;
  nome: string;
  titulo: string;
  especialidades: string[];
  ativo: boolean;
}

export interface RegraComportamento {
  id: string;
  descricao: string;
  prioridade: 'critica' | 'alta' | 'media';
}

export interface FAQItem {
  pergunta: string;
  resposta: string;
  intencoes: string[];
}

export const MAMUTY_KNOWLEDGE_BASE: {
  empresa: EmpresaInfo;
  servicos: ServicoConhecimento[];
  barbeiros: BarbeiroConhecimento[];
  regrasGerais: string[];
  regrasComportamento: RegraComportamento[];
  faqs: FAQItem[];
  personalidade: {
    nome: string;
    tom: string;
    estilo: string[];
    evitar: string[];
  };
} = {
  empresa: {
    nome: 'Mamuty Barbearia',
    slogan: '~Mamuty barbearia estilo forte. 👊',
    dono: 'Hemerson Barber (Fundador & Barbeiro Chefe)',
    endereco: 'Av. das Nações, Centro',
    cidade: 'Cumaru do Norte',
    estado: 'PA',
    cep: '68398-000',
    whatsapp: '5594984439065',
    whatsappFormatado: '(94) 98443-9065',
    formasPagamento: ['PIX', 'Dinheiro', 'Débito', 'Crédito'],
    horariosSemanais: [
      { dias: 'Segunda, Quarta, Quinta, Sexta, Sábado', horario: '08:00 às 20:00', intervalo: '12:00 às 14:00' },
      { dias: 'Terça-feira', horario: '08:00 às 18:00', intervalo: '12:00 às 14:00' },
      { dias: 'Domingo', horario: '08:00 às 12:00', intervalo: 'Sem intervalo (fecha às 12h)' },
    ]
  },
  servicos: [
    {
      id: 'srv-corte-social',
      nome: 'Corte social',
      preco: 40,
      duracaoMinutos: 30,
      descricao: 'Corte tradicional alinhado na tesoura ou máquina. Ideal para quem tem pouco tempo.',
      tags: ['social', 'tradicional', 'tesoura', 'rapido', '30 min']
    },
    {
      id: 'srv-corte-degrade',
      nome: 'Corte degradê',
      preco: 40,
      duracaoMinutos: 40,
      descricao: 'Degradê milimétrico na régua (Low, Mid ou High Fade), alinhamento perfeito de nuca e laterais.',
      tags: ['degrade', 'fade', 'regua', 'disfarcado', 'navalhado', 'estilo']
    },
    {
      id: 'srv-barba-simples',
      nome: 'Barba simples',
      preco: 35,
      duracaoMinutos: 30,
      descricao: 'Desenho, alinhamento e hidratação de barba com toalha e navalha.',
      tags: ['barba', 'navalha', 'alinhamento', 'barboterapia', 'toalha']
    },
    {
      id: 'srv-cabelo-barba',
      nome: 'Cabelo + Barba',
      preco: 70,
      duracaoMinutos: 50,
      descricao: 'Combo completo de corte (degradê ou social) com barba alinhada no estilo forte Mamuty.',
      tags: ['combo', 'cabelo e barba', 'corte e barba', 'completo', 'tapa no visual']
    },
    {
      id: 'srv-cabelo-sobrancelha',
      nome: 'Cabelo + Sobrancelha',
      preco: 60,
      duracaoMinutos: 45,
      descricao: 'Corte completo com limpeza e alinhamento milimétrico de sobrancelha.',
      tags: ['sobrancelha', 'alinhamento facial']
    },
    {
      id: 'srv-combo-completo',
      nome: 'Combo Completo',
      preco: 100,
      duracaoMinutos: 60,
      descricao: 'Corte completo, barba alinhada com toalha quente, sobrancelha e finalização com pomada premium.',
      tags: ['vip', 'completao', 'tudo', 'barba cabelo sobrancelha']
    }
  ],
  barbeiros: [
    {
      id: 'barber-mamuty',
      nome: 'mamuty.barber',
      titulo: 'Fundador & Barbeiro Chefe (Hemerson Barber)',
      especialidades: ['Degradê milimétrico', 'Cortes Clássicos', 'Tesoura', 'Barba', 'Atendimento Kids'],
      ativo: true
    },
    {
      id: 'barber-doglas',
      nome: 'Doglas',
      titulo: 'Especialista em Degradê & Barba',
      especialidades: ['Fade Navalhado', 'Degradê na Régua', 'Barboterapia', 'Pezinho'],
      ativo: true
    }
  ],
  regrasGerais: [
    'NUNCA inventar serviços ou preços que não constam na lista oficial.',
    'Se o cliente perguntar por corte infantil, química ou outros serviços não listados, avisar que não consta no catálogo oficial e oferecer encaminhamento para a equipe humana.',
    'Sempre conduzir para o agendamento de forma amigável e acolhedora, sem respostas gigantescas.',
    'Respeitar rigorosamente o intervalo de almoço das 12h às 14h e o fechamento do dia.',
    'Sempre sugerir horários e perguntar a preferência de barbeiro entre mamuty.barber e Doglas.'
  ],

  regrasComportamento: [
    {
      id: 'R001',
      descricao: 'NUNCA inventar preço. Sempre consultar getServices() ou tool_consultar_lista_servicos()',
      prioridade: 'critica'
    },
    {
      id: 'R002',
      descricao: 'NUNCA inventar horário disponível. Sempre consultar consultarDisponibilidade()',
      prioridade: 'critica'
    },
    {
      id: 'R003',
      descricao: 'NUNCA confirmar agendamento sem consultar a agenda primeiro',
      prioridade: 'critica'
    },
    {
      id: 'R004',
      descricao: 'NUNCA confirmar pagamento que não foi realizado. Apenas registrar preferência.',
      prioridade: 'critica'
    },
    {
      id: 'R005',
      descricao: 'Não oferecer desconto sem autorização do dono',
      prioridade: 'alta'
    },
    {
      id: 'R006',
      descricao: 'Sempre tentar avançar a conversa para agendamento quando houver intenção de compra',
      prioridade: 'alta'
    },
    {
      id: 'R007',
      descricao: 'Se não souber, encaminhar para humano. NUNCA inventar resposta.',
      prioridade: 'critica'
    },
    {
      id: 'R008',
      descricao: 'Respostas curtas e naturais. Uma conversa de cada vez. Sem textos enormes.',
      prioridade: 'alta'
    },
    {
      id: 'R009',
      descricao: 'Identificar cliente recorrente e usar dados do histórico',
      prioridade: 'media'
    },
    {
      id: 'R010',
      descricao: 'Respeitar intervalo de almoço 12h-14h e horário de fechamento',
      prioridade: 'critica'
    }
  ],

  faqs: [
    {
      pergunta: 'Está aberto hoje?',
      resposta: 'Sim! Estamos funcionando. [horários]',
      intencoes: ['BUSINESS_STATUS', 'HORARIO_FUNCIONAMENTO']
    },
    {
      pergunta: 'Quanto custa o corte?',
      resposta: 'Corte degradê R$ 40, Corte social R$ 40. [consultar preço]',
      intencoes: ['SERVICE_PRICE', 'CONSULTAR_SERVICOS']
    },
    {
      pergunta: 'Tem vaga hoje?',
      resposta: '[consultar disponibilidade real]',
      intencoes: ['CHECK_AVAILABILITY', 'CONSULTAR_DISPONIBILIDADE']
    },
    {
      pergunta: 'Quem está atendendo?',
      resposta: '[consultar profissionais ativos]',
      intencoes: ['BARBER_LIST', 'CONSULTAR_PROFICIONAIS']
    },
    {
      pergunta: 'Onde fica?',
      resposta: 'Av. das Nações, Centro, Cumaru do Norte - PA',
      intencoes: ['ADDRESS', 'INFORMACOES_GERAIS']
    },
    {
      pergunta: 'Aceita PIX?',
      resposta: 'Sim! PIX, Dinheiro, Débito e Crédito.',
      intencoes: ['PAYMENT_METHODS']
    },
    {
      pergunta: 'Quero marcar horário',
      resposta: '[iniciar fluxo de agendamento]',
      intencoes: ['START_BOOKING', 'INICIAR_AGENDAMENTO']
    },
    {
      pergunta: 'Cancelar agendamento',
      resposta: '[buscar agendamento e cancelar]',
      intencoes: ['CANCEL_APPOINTMENT', 'CANCELAR_AGENDAMENTO']
    }
  ],

  personalidade: {
    nome: 'Marcos',
    tom: 'Profissional, simpático, objetivo, masculino/premium, natural',
    estilo: [
      'Respostas curtas e diretas',
      'Usar emojis com moderação (💈, ✂️, 👊, 😊)',
      'Tom masculino e premium',
      'Conduzir para ação (agendar, consultar)',
      'Identificar cliente recorrente',
      'Ser proativo em sugerir horários'
    ],
    evitar: [
      'Textos longos e complicados',
      'Respostas genéricas de robô',
      'Inventar informações',
      'Oferecer descontos sem autorização',
      'Confirmar agendamento sem consultar agenda',
      'Parecer frio ou formal demais'
    ]
  }
};
