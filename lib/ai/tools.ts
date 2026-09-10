import { supabase } from '../supabase';
import { Appointment, Barber, Customer, PaymentMethod, Service } from '../types';
import { consultarDisponibilidade, getHorarioFuncionamentoDia, ResultadoDisponibilidade } from '../availability';
import { MAMUTY_KNOWLEDGE_BASE } from './knowledgeBase';

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  data: any;
  message?: string;
}

/**
 * Tool: Verificar se a barbearia está aberta hoje
 */
export function tool_verificar_status_negocio(): ToolExecutionResult {
  const now = new Date();
  const hoje = now.toISOString().split('T')[0];
  const info = getHorarioFuncionamentoDia(hoje);
  const horaAtual = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  const minutosAtuais = now.getHours() * 60 + now.getMinutes();
  const minutosAbertura = parseInt(info.abertura.split(':')[0]) * 60 + parseInt(info.abertura.split(':')[1]);
  const minutosFechamento = info.fechamentoMinutos;

  const isOpen = minutosAtuais >= minutosAbertura && minutosAtuais < minutosFechamento;

  return {
    toolName: 'verificar_status_negocio',
    success: true,
    data: {
      aberta: isOpen,
      diaSemana: info.diaSemana,
      horarioAbertura: info.abertura,
      horarioFechamento: info.fechamento,
      horaAtual,
      temIntervalo: info.temIntervalo,
      intervalo: info.temIntervalo ? `${info.intervaloInicio} às ${info.intervaloFim}` : null
    }
  };
}

/**
 * Tool: Consultar horário de funcionamento detalhado
 */
export function tool_consultar_horario_funcionamento(dataIso?: string): ToolExecutionResult {
  const hoje = dataIso || new Date().toISOString().split('T')[0];
  const info = getHorarioFuncionamentoDia(hoje);

  return {
    toolName: 'consultar_horario_funcionamento',
    success: true,
    data: {
      diaSemana: info.diaSemana,
      abertura: info.abertura,
      fechamento: info.fechamento,
      temIntervalo: info.temIntervalo,
      intervalo: info.temIntervalo ? `${info.intervaloInicio} às ${info.intervaloFim}` : null,
      horariosSemanais: MAMUTY_KNOWLEDGE_BASE.empresa.horariosSemanais
    }
  };
}

/**
 * Tool: Consultar lista de serviços com preços
 */
export async function tool_consultar_lista_servicos(): Promise<ToolExecutionResult> {
  try {
    const { data: dbServices } = await supabase.from('services').select('*').eq('active', true);
    if (dbServices && dbServices.length > 0) {
      return {
        toolName: 'consultar_lista_servicos',
        success: true,
        data: dbServices.map(s => ({
          id: s.id,
          nome: s.name,
          preco: Number(s.price),
          duracaoMinutos: s.duration_minutes || 30,
          descricao: s.description || ''
        }))
      };
    }
  } catch (e) {
    console.warn('Nota Supabase tool_consultar_lista_servicos:', e);
  }

  return {
    toolName: 'consultar_lista_servicos',
    success: true,
    data: MAMUTY_KNOWLEDGE_BASE.servicos.map(s => ({
      id: s.id,
      nome: s.nome,
      preco: s.preco,
      duracaoMinutos: s.duracaoMinutos,
      descricao: s.descricao
    }))
  };
}

/**
 * Tool: Consultar preço de um serviço específico
 */
export async function tool_consultar_preco_servico(servicoNome: string): Promise<ToolExecutionResult> {
  const normalizado = servicoNome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  try {
    const { data: dbServices } = await supabase.from('services').select('*').eq('active', true);
    if (dbServices && dbServices.length > 0) {
      const encontrado = dbServices.find(s =>
        s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizado) ||
        normalizado.includes(s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );
      if (encontrado) {
        return {
          toolName: 'consultar_preco_servico',
          success: true,
          data: {
            id: encontrado.id,
            nome: encontrado.name,
            preco: Number(encontrado.price),
            duracaoMinutos: encontrado.duration_minutes || 30,
            descricao: encontrado.description || ''
          }
        };
      }
    }
  } catch (e) {
    console.warn('Nota Supabase tool_consultar_preco_servico:', e);
  }

  // Fallback para knowledge base
  const servicoKB = MAMUTY_KNOWLEDGE_BASE.servicos.find(s => {
    const nomeKB = s.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return nomeKB.includes(normalizado) || normalizado.includes(nomeKB);
  });

  if (servicoKB) {
    return {
      toolName: 'consultar_preco_servico',
      success: true,
      data: {
        id: servicoKB.id,
        nome: servicoKB.nome,
        preco: servicoKB.preco,
        duracaoMinutos: servicoKB.duracaoMinutos,
        descricao: servicoKB.descricao
      }
    };
  }

  return {
    toolName: 'consultar_preco_servico',
    success: false,
    data: null,
    message: `Serviço "${servicoNome}" não encontrado no catálogo`
  };
}

/**
 * Tool: Consultar lista de profissionais ativos
 */
export async function tool_consultar_lista_profissionais(): Promise<ToolExecutionResult> {
  try {
    const { data: dbBarbers } = await supabase.from('barbers').select('*').eq('active', true);
    if (dbBarbers && dbBarbers.length > 0) {
      return {
        toolName: 'consultar_lista_profissionais',
        success: true,
        data: dbBarbers.map(b => ({
          id: b.id,
          nome: b.name,
          titulo: b.description || 'Especialista',
          especialidade: b.specialty || 'Degradê & Barba'
        }))
      };
    }
  } catch (e) {
    console.warn('Nota Supabase tool_consultar_lista_profissionais:', e);
  }

  return {
    toolName: 'consultar_lista_profissionais',
    success: true,
    data: MAMUTY_KNOWLEDGE_BASE.barbeiros.map(b => ({
      id: b.id,
      nome: b.nome,
      titulo: b.titulo,
      especialidade: b.especialidades.join(', ')
    }))
  };
}

/**
 * Tool: Consultar endereço e localização
 */
export function tool_consultar_endereco(): ToolExecutionResult {
  const emp = MAMUTY_KNOWLEDGE_BASE.empresa;
  return {
    toolName: 'consultar_endereco',
    success: true,
    data: {
      endereco: emp.endereco,
      cidade: emp.cidade,
      estado: emp.estado,
      cep: emp.cep,
      enderecoCompleto: `${emp.endereco}, ${emp.cidade} - ${emp.estado}, CEP ${emp.cep}`,
      whatsapp: emp.whatsappFormatado
    }
  };
}

/**
 * Tool: Consultar formas de pagamento aceitas
 */
export function tool_consultar_formas_pagamento(): ToolExecutionResult {
  return {
    toolName: 'consultar_formas_pagamento',
    success: true,
    data: {
      formas: MAMUTY_KNOWLEDGE_BASE.empresa.formasPagamento,
      observacao: 'Pagamento presencial no momento do atendimento. PIX, Dinheiro, Débito ou Crédito.'
    }
  };
}

/**
 * 1. Consultar Serviços e Preços Oficiais
 */
export async function tool_consultar_servicos(servicesFallback: Service[]): Promise<ToolExecutionResult> {
  try {
    const { data: dbServices } = await supabase.from('services').select('*').eq('active', true);
    if (dbServices && dbServices.length > 0) {
      return {
        toolName: 'consultar_servicos',
        success: true,
        data: dbServices.map(s => ({
          id: s.id,
          nome: s.name,
          preco: Number(s.price),
          duracaoMinutos: s.duration_minutes || 30,
          descricao: s.description || ''
        }))
      };
    }
  } catch (e) {
    console.warn('Nota Supabase tool_consultar_servicos:', e);
  }

  return {
    toolName: 'consultar_servicos',
    success: true,
    data: MAMUTY_KNOWLEDGE_BASE.servicos
  };
}

/**
 * 2. Consultar Profissionais Ativos
 */
export async function tool_consultar_profissionais(barbersFallback: Barber[]): Promise<ToolExecutionResult> {
  try {
    const { data: dbBarbers } = await supabase.from('barbers').select('*').eq('active', true);
    if (dbBarbers && dbBarbers.length > 0) {
      return {
        toolName: 'consultar_profissionais',
        success: true,
        data: dbBarbers.map(b => ({
          id: b.id,
          nome: b.name,
          titulo: b.description || 'Especialista',
          especialidade: b.specialty || 'Degradê & Barba'
        }))
      };
    }
  } catch (e) {
    console.warn('Nota Supabase tool_consultar_profissionais:', e);
  }

  return {
    toolName: 'consultar_profissionais',
    success: true,
    data: MAMUTY_KNOWLEDGE_BASE.barbeiros
  };
}

/**
 * 3. Consultar Disponibilidade Real no Banco (respeitando funcionamento e intervalo)
 */
export function tool_consultar_disponibilidade(
  dataIso: string,
  appointments: Appointment[],
  barbers: Barber[],
  serviceDurationMinutes = 40,
  barberId?: string,
  horarioMinimo = '08:00'
): ToolExecutionResult {
  const res = consultarDisponibilidade(
    {
      data: dataIso,
      barberId,
      serviceDurationMinutes,
      horarioMinimo
    },
    appointments,
    barbers
  );

  const livres = res.slots.filter(s => s.disponivel);

  return {
    toolName: 'consultar_disponibilidade',
    success: true,
    data: {
      data: dataIso,
      diaSemana: res.funcionamento.diaSemana,
      fechamento: res.funcionamento.fechamento,
      intervalo: res.funcionamento.temIntervalo ? '12:00 às 14:00' : 'Sem intervalo',
      totalVagasLivres: livres.length,
      vagas: livres.map(l => ({
        horario: l.horario,
        barbeiros: l.barbeirosDisponiveis.map(b => b.name)
      })),
      sugestoes: res.sugestoesFormatadas
    }
  };
}

/**
 * 4. Buscar Cliente Inteligente por Telefone / WhatsApp
 */
export async function tool_buscar_cliente_por_whatsapp(
  phone: string,
  appointments: Appointment[]
): Promise<ToolExecutionResult> {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 8) {
    return {
      toolName: 'buscar_cliente_por_whatsapp',
      success: false,
      data: null,
      message: 'Telefone inválido para consulta'
    };
  }

  try {
    const suffix = clean.slice(-8);
    const { data } = await supabase.from('customers').select('*').ilike('phone', `%${suffix}%`).maybeSingle();

    if (data) {
      const clientApts = appointments.filter(a => a.customerPhone.replace(/\D/g, '').endsWith(suffix));
      return {
        toolName: 'buscar_cliente_por_whatsapp',
        success: true,
        data: {
          id: data.id,
          nome: data.name,
          phone: data.phone,
          totalAtendimentos: clientApts.length,
          ultimoAtendimento: clientApts[0]?.date
        }
      };
    }
  } catch (e) {
    console.warn('Nota Supabase tool_buscar_cliente_por_whatsapp:', e);
  }

  return {
    toolName: 'buscar_cliente_por_whatsapp',
    success: true,
    data: null,
    message: 'Cliente ainda não cadastrado (novo cliente)'
  };
}

/**
 * 5. Encaminhar para Atendimento Humano
 */
export function tool_encaminhar_para_humano(motivo?: string): ToolExecutionResult {
  return {
    toolName: 'encaminhar_para_humano',
    success: true,
    data: {
      responsavel: 'Hemerson Barber (Dono da Barbearia Mamuty)',
      whatsapp: '5594984439065',
      whatsappFormatado: '(94) 98443-9065',
      motivo: motivo || 'Dúvida ou solicitação fora do escopo automatizado',
      linkDireto: 'https://wa.me/5594984439065?text=Ol%C3%A1%20Hemerson%2C%20o%20assistente%20Marcos%20me%20encaminhou%20para%20falar%20com%20voc%C3%AA.'
    }
  };
}

/**
 * 6. Buscar cliente por telefone (identificação inteligente)
 */
export async function tool_buscar_cliente_inteligente(
  phone: string,
  appointments: Appointment[]
): Promise<ToolExecutionResult> {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 8) {
    return {
      toolName: 'buscar_cliente_inteligente',
      success: false,
      data: null,
      message: 'Telefone inválido para consulta'
    };
  }

  try {
    const suffix = clean.slice(-8);
    const { data } = await supabase.from('customers').select('*').ilike('phone', `%${suffix}%`).maybeSingle();

    if (data) {
      const clientApts = appointments.filter(a => a.customerPhone.replace(/\D/g, '').endsWith(suffix));
      const completedApts = clientApts.filter(a => a.status === 'completed');
      const lastApt = clientApts[0];

      return {
        toolName: 'buscar_cliente_inteligente',
        success: true,
        data: {
          id: data.id,
          nome: data.name,
          phone: data.phone,
          totalAtendimentos: clientApts.length,
          atendimentosConcluidos: completedApts.length,
          ultimoAtendimento: lastApt?.date,
          profissionalPreferido: lastApt?.barberName || null,
          servicoPreferido: lastApt?.serviceNames?.[0] || null,
          status: 'cliente_cadastrado'
        }
      };
    }
  } catch (e) {
    console.warn('Nota Supabase tool_buscar_cliente_inteligente:', e);
  }

  return {
    toolName: 'buscar_cliente_inteligente',
    success: true,
    data: { status: 'cliente_novo' },
    message: 'Cliente ainda não cadastrado'
  };
}

/**
 * 7. Criar novo cliente no Supabase
 */
export async function tool_criar_cliente(nome: string, phone: string): Promise<ToolExecutionResult> {
  const cleanPhone = phone.replace(/\D/g, '');

  try {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existing) {
      return {
        toolName: 'criar_cliente',
        success: true,
        data: { id: existing.id, nome, phone: cleanPhone, status: 'ja_cadastrado' }
      };
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({ name: nome, phone: cleanPhone })
      .select('id')
      .single();

    if (error) throw error;

    return {
      toolName: 'criar_cliente',
      success: true,
      data: { id: data.id, nome, phone: cleanPhone, status: 'criado' }
    };
  } catch (e) {
    console.warn('Erro ao criar cliente:', e);
    return {
      toolName: 'criar_cliente',
      success: false,
      data: null,
      message: 'Erro ao criar cliente no banco'
    };
  }
}

/**
 * 8. Criar agendamento no Supabase (com proteção contra duplo)
 */
export async function tool_criar_agendamento(dados: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  durationMinutes: number;
  paymentMethod: PaymentMethod;
}): Promise<ToolExecutionResult> {
  const cleanPhone = dados.customerPhone.replace(/\D/g, '');

  // 1. Proteção contra duplo agendamento
  try {
    const { data: existingSlots } = await supabase
      .from('appointments')
      .select('id, appointment_time, duration_minutes, status')
      .eq('barber_id', dados.barberId)
      .eq('appointment_date', dados.date)
      .not('status', 'eq', 'cancelled');

    if (existingSlots && existingSlots.length > 0) {
      const reqStart = parseInt(dados.time.split(':')[0]) * 60 + parseInt(dados.time.split(':')[1]);
      const reqEnd = reqStart + dados.durationMinutes;

      for (const ex of existingSlots) {
        const exTime = ex.appointment_time ? ex.appointment_time.substring(0, 5) : '10:00';
        const exStart = parseInt(exTime.split(':')[0]) * 60 + parseInt(exTime.split(':')[1]);
        const exEnd = exStart + (ex.duration_minutes || 40);

        if (reqStart < exEnd && reqEnd > exStart) {
          return {
            toolName: 'criar_agendamento',
            success: false,
            data: null,
            message: `O horário das ${dados.time} com ${dados.barberName} acabou de ser reservado. Por favor, escolha outro horário.`
          };
        }
      }
    }
  } catch (e) {
    console.warn('Verificação de concorrência:', e);
  }

  // 2. Buscar ou criar customer_id
  let customerId = '';
  try {
    const { data: existingCust } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingCust) {
      customerId = existingCust.id;
    } else {
      const { data: newCust } = await supabase
        .from('customers')
        .insert({ name: dados.customerName, phone: cleanPhone })
        .select('id')
        .single();
      if (newCust) customerId = newCust.id;
    }
  } catch (e) {
    console.warn('Erro ao resolver customer:', e);
  }

  // 3. Montar notes
  const notesArr = [
    `Origem: whatsapp`,
    `Pagamento: ${dados.paymentMethod.toUpperCase()}`
  ];
  if (dados.customerEmail) notesArr.push(`E-mail: ${dados.customerEmail}`);
  const notesPayload = notesArr.join(' | ');

  // 4. Inserir agendamento
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        customer_id: customerId || null,
        service_id: dados.serviceId || null,
        barber_id: dados.barberId || null,
        appointment_date: dados.date,
        appointment_time: dados.time.length === 5 ? dados.time + ':00' : dados.time,
        status: 'confirmed',
        price: dados.price,
        duration_minutes: dados.durationMinutes,
        notes: notesPayload,
      })
      .select('*')
      .single();

    if (error) throw error;

    return {
      toolName: 'criar_agendamento',
      success: true,
      data: {
        id: data.id,
        customerName: dados.customerName,
        customerPhone: cleanPhone,
        barberName: dados.barberName,
        serviceName: dados.serviceName,
        date: dados.date,
        time: dados.time,
        price: dados.price,
        paymentMethod: dados.paymentMethod,
        status: 'confirmed'
      }
    };
  } catch (e) {
    console.warn('Erro ao criar agendamento:', e);
    return {
      toolName: 'criar_agendamento',
      success: false,
      data: null,
      message: 'Erro ao salvar agendamento no banco'
    };
  }
}

/**
 * 9. Cancelar agendamento
 */
export async function tool_cancelar_agendamento(appointmentId: string): Promise<ToolExecutionResult> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId);

    if (error) throw error;

    return {
      toolName: 'cancelar_agendamento',
      success: true,
      data: { id: appointmentId, status: 'cancelled', message: 'Agendamento cancelado com sucesso' }
    };
  } catch (e) {
    console.warn('Erro ao cancelar agendamento:', e);
    return {
      toolName: 'cancelar_agendamento',
      success: false,
      data: null,
      message: 'Erro ao cancelar agendamento'
    };
  }
}

/**
 * 10. Buscar agendamentos do cliente
 */
export async function tool_buscar_agendamentos_cliente(phone: string, appointments: Appointment[]): Promise<ToolExecutionResult> {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 8) {
    return {
      toolName: 'buscar_agendamentos_cliente',
      success: false,
      data: null,
      message: 'Telefone inválido'
    };
  }

  const suffix = cleanPhone.slice(-8);
  const clienteApts = appointments.filter(
    a => a.customerPhone.replace(/\D/g, '').endsWith(suffix) && a.status === 'confirmed'
  );

  return {
    toolName: 'buscar_agendamentos_cliente',
    success: true,
    data: {
      total: clienteApts.length,
      agendamentos: clienteApts.map(a => ({
        id: a.id,
        servico: a.serviceNames?.[0] || 'Serviço',
        barbeiro: a.barberName,
        data: a.date,
        horario: a.time,
        valor: a.totalPrice,
        status: a.status
      }))
    }
  };
}
