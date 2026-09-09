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

export const MAMUTY_KNOWLEDGE_BASE: {
  empresa: EmpresaInfo;
  servicos: ServicoConhecimento[];
  barbeiros: BarbeiroConhecimento[];
  regrasGerais: string[];
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
  ]
};
