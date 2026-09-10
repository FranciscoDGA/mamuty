import { IntentType } from './types';

export function classificarIntencao(texto: string): IntentType {
  const norm = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Falar com Humano
  if (
    norm.includes('falar com alguem') ||
    norm.includes('atendente') ||
    norm.includes('humano') ||
    norm.includes('pessoa') ||
    norm.includes('dono') ||
    norm.includes('falar com o hemerson')
  ) {
    return 'HUMAN_HANDOFF';
  }

  // 2. Cancelar Agendamento
  if (
    norm.includes('cancelar') ||
    norm.includes('desmarcar') ||
    norm.includes('nao vou poder ir') ||
    norm.includes('não vou poder ir') ||
    norm.includes('nao posso ir') ||
    norm.includes('não posso ir')
  ) {
    return 'CANCEL_APPOINTMENT';
  }

  // 3. Reagendar
  if (
    norm.includes('remarcar') ||
    norm.includes('mudar data') ||
    norm.includes('trocar horario') ||
    norm.includes('reagendar') ||
    norm.includes('outro dia')
  ) {
    return 'RESCHEDULE_APPOINTMENT';
  }

  // 4. Iniciar Agendamento
  if (
    norm.includes('quero marcar') ||
    norm.includes('quero agendar') ||
    norm.includes('agendar horario') ||
    norm.includes('marcar um horario') ||
    norm.includes('agendar agora') ||
    norm === 'agendar' ||
    norm === 'marcar'
  ) {
    return 'START_BOOKING';
  }

  // 5. Consultar Disponibilidade / Vaga
  if (
    norm.includes('tem vaga') ||
    norm.includes('vaga hoje') ||
    norm.includes('horario disponivel') ||
    norm.includes('horarios livres') ||
    norm.includes('tem horario') ||
    norm.includes('tem vaga hoje') ||
    norm.includes('vagas')
  ) {
    return 'CHECK_AVAILABILITY';
  }

  // 6. Consultar Serviços e Preços
  if (
    norm.includes('quanto custa') ||
    norm.includes('preco') ||
    norm.includes('precos') ||
    norm.includes('valor') ||
    norm.includes('valores') ||
    norm.includes('tabela') ||
    norm.includes('quais servicos') ||
    norm.includes('servicos')
  ) {
    return 'SERVICE_LIST';
  }

  // 7. Horário de Funcionamento
  if (
    norm.includes('aberto') ||
    norm.includes('abertos') ||
    norm.includes('fechado') ||
    norm.includes('funcionamento') ||
    norm.includes('que horas fecha') ||
    norm.includes('que horas abre') ||
    norm.includes('estao funcionando') ||
    norm.includes('esta aberto')
  ) {
    return 'BUSINESS_HOURS';
  }

  // 8. Informações Gerais (Endereço, Formas de Pagamento)
  if (
    norm.includes('onde fica') ||
    norm.includes('endereco') ||
    norm.includes('localizacao') ||
    norm.includes('como chegar') ||
    norm.includes('aceita pix') ||
    norm.includes('aceita cartao') ||
    norm.includes('forma de pagamento') ||
    norm.includes('pagamento')
  ) {
    return 'ADDRESS';
  }

  // 9. Saudações
  if (
    norm === 'oi' ||
    norm === 'ola' ||
    norm === 'opa' ||
    norm.startsWith('bom dia') ||
    norm.startsWith('boa tarde') ||
    norm.startsWith('boa noite') ||
    norm === 'ola mamuty' ||
    norm === 'oi marcos'
  ) {
    return 'GREETING';
  }

  return 'UNKNOWN';
}
