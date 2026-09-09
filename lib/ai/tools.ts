import { supabase } from '../supabase';
import { Appointment, Barber, Customer, Service } from '../types';
import { consultarDisponibilidade, getHorarioFuncionamentoDia, ResultadoDisponibilidade } from '../availability';
import { MAMUTY_KNOWLEDGE_BASE } from './knowledgeBase';

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  data: any;
  message?: string;
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
