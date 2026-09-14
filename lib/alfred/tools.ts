import { Service, Barber, Appointment, Customer } from '../types';
import { MAMUTY_KNOWLEDGE_BASE } from '../ai/knowledgeBase';
import { DisponibilidadeQuery, consultarDisponibilidade, SlotDisponibilidade } from '../availability';

export interface AlfredToolContext {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  currentCustomer: Customer | null;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export function getServices(ctx: AlfredToolContext): ToolResult {
  return { success: true, data: ctx.services.filter(s => s.active !== false) };
}

export function getServiceByName(ctx: AlfredToolContext, name: string): ToolResult {
  const normalizado = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const found = ctx.services.find(s =>
    s.active !== false && (
      s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizado) ||
      normalizado.includes(s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    )
  );
  if (!found) return { success: false, error: 'Serviço não encontrado.' };
  return { success: true, data: found };
}

export function getBarbers(ctx: AlfredToolContext): ToolResult {
  return { success: true, data: ctx.barbers.filter(b => b.active !== false) };
}

export function getBarberByName(ctx: AlfredToolContext, name: string): ToolResult {
  const normalizado = name.toLowerCase();
  const found = ctx.barbers.find(b =>
    b.active !== false && b.name.toLowerCase().includes(normalizado)
  );
  if (!found) return { success: false, error: 'Profissional não encontrado.' };
  return { success: true, data: found };
}

export function getBarbersForService(ctx: AlfredToolContext, serviceId: string): ToolResult {
  const kb = MAMUTY_KNOWLEDGE_BASE;
  const servicoKb = kb.servicos.find(s => s.id === serviceId);
  if (!servicoKb) return { success: false, error: 'Serviço não encontrado na base.' };

  const compatibleIds = servicoKb.profissionaisIds;
  const compatible = ctx.barbers.filter(b => b.active !== false && compatibleIds.includes(b.id));
  return { success: true, data: compatible };
}

export function getServicesForBarber(ctx: AlfredToolContext, barberId: string): ToolResult {
  const kb = MAMUTY_KNOWLEDGE_BASE;
  const barbeiroKb = kb.barbeiros.find(b => b.id === barberId);
  if (!barbeiroKb) return { success: false, error: 'Profissional não encontrado na base.' };

  const compatibleIds = barbeiroKb.servicosIds;
  const compatible = ctx.services.filter(s => s.active !== false && compatibleIds.includes(s.id));
  return { success: true, data: compatible };
}

export function getAvailableSlots(
  ctx: AlfredToolContext,
  date: string,
  barberId?: string,
  serviceDurationMinutes?: number
): ToolResult {
  const query: DisponibilidadeQuery = {
    data: date,
    barberId: barberId && barberId !== 'any' ? barberId : undefined,
    serviceDurationMinutes: serviceDurationMinutes || 40,
  };

  const resultado = consultarDisponibilidade(
    query,
    ctx.appointments,
    ctx.barbers,
    [],
    [],
    []
  );

  const availableSlots = resultado.slots.filter(s => s.disponivel);
  return {
    success: true,
    data: {
      data: resultado.data,
      funcionamento: resultado.funcionamento,
      slotsDisponiveis: availableSlots.map(s => ({
        horario: s.horario,
        barbeiros: s.barbeirosDisponiveis.map(b => b.name),
      })),
      totalSlotsDisponiveis: availableSlots.length,
      sugestoes: resultado.sugestoesFormatadas,
    }
  };
}

export function getBusinessHours(): ToolResult {
  const kb = MAMUTY_KNOWLEDGE_BASE;
  return {
    success: true,
    data: {
      horarios: kb.empresa.horariosSemanais,
      intervalo: '12:00 às 14:00',
      toleranciaAtraso: kb.empresa.toleranciaAtraso + ' minutos',
      feriados: kb.empresa.valorFeriado,
    }
  };
}

export function getPaymentMethods(): ToolResult {
  const kb = MAMUTY_KNOWLEDGE_BASE;
  return {
    success: true,
    data: {
      formas: kb.empresa.formasPagamento,
      pixAntecipado: true,
      sinalObrigatorio: false,
      cartaoComAcrescimo: true,
      beneficiario: kb.empresa.beneficiarioPix,
      cnpj: kb.empresa.cnpj,
    }
  };
}

export function getAddress(): ToolResult {
  const kb = MAMUTY_KNOWLEDGE_BASE;
  return {
    success: true,
    data: {
      endereco: `${kb.empresa.endereco}, ${kb.empresa.cidade} - ${kb.empresa.estado}, CEP ${kb.empresa.cep}`,
      referencia: kb.empresa.pontoReferencia,
    }
  };
}

export function getPromotedServices(): ToolResult {
  const kb = MAMUTY_KNOWLEDGE_BASE;
  const carroChefe = kb.servicos.find(s => s.tags.includes('carro-chefe'));
  const maisPedidos = kb.servicos.filter(s => s.tags.includes('mais pedido'));
  return {
    success: true,
    data: {
      carroChefe: carroChefe ? { nome: carroChefe.nome, preco: carroChefe.preco } : null,
      maisPedidos: maisPedidos.map(s => ({ nome: s.nome, preco: s.preco })),
    }
  };
}
