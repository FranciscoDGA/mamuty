// ============================================
// RATE LIMITING — Controle de spam
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas a cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  windowMs: number;    // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições por janela
  message?: string;    // Mensagem de erro personalizada
}

/**
 * Verifica se o request excedeu o rate limit
 * @param key - Identificador único (ex: IP, telefone)
 * @param config - Configuração do rate limit
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Se não existe ou expirou, criar nova entrada
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Incrementar contador
  entry.count++;

  // Verificar se excedeu
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit para agendamentos: 3 por telefone por hora
 */
export function checkBookingRateLimit(phone: string) {
  return checkRateLimit(`booking:${phone}`, {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3,
    message: 'Você atingiu o limite de agendamentos. Tente novamente em 1 hora.',
  });
}

/**
 * Rate limit para API geral: 30 requests por minuto por IP
 */
export function checkApiRateLimit(ip: string) {
  return checkRateLimit(`api:${ip}`, {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30,
    message: 'Muitas requisições. Aguarde um momento.',
  });
}

/**
 * Rate limit para login: 5 tentativas por 15 minutos
 */
export function checkLoginRateLimit(identifier: string) {
  return checkRateLimit(`login:${identifier}`, {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5,
    message: 'Muitas tentativas de login. Aguarde 15 minutos.',
  });
}

/**
 * Rate limit para chat/mensagens: 20 mensagens por minuto
 */
export function checkChatRateLimit(sessionId: string) {
  return checkRateLimit(`chat:${sessionId}`, {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 20,
    message: 'Você está enviando mensagens muito rápido.',
  });
}
