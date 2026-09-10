-- ============================================
-- MIGRATION 002: Adicionar colunas para lembretes
-- ============================================

-- Adicionar coluna para controle de lembrete enviado
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Adicionar colunas para dados do cliente (para lembretes sem JOIN)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Criar índice para查询 rápido de lembretes
CREATE INDEX IF NOT EXISTS idx_appointments_reminder 
  ON public.appointments (appointment_date, appointment_time, status, reminder_sent)
  WHERE status = 'confirmed' AND reminder_sent = false;

-- Comentário
COMMENT ON COLUMN public.appointments.reminder_sent IS 'Indica se lembrete foi enviado via WhatsApp';
COMMENT ON COLUMN public.appointments.customer_phone IS 'Telefone do cliente para lembretes';
COMMENT ON COLUMN public.appointments.customer_name IS 'Nome do cliente para lembretes personalizados';
