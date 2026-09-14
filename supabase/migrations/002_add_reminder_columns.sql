-- ============================================
-- MIGRATION 002: Adicionar colunas para lembretes
-- ============================================

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder
  ON public.appointments (appointment_date, appointment_time, status, reminder_sent)
  WHERE status = 'confirmed' AND reminder_sent = false;

COMMENT ON COLUMN public.appointments.reminder_sent IS 'Indica se lembrete foi enviado via WhatsApp';
COMMENT ON COLUMN public.appointments.customer_phone IS 'Telefone do cliente para lembretes';
COMMENT ON COLUMN public.appointments.customer_name IS 'Nome do cliente para lembretes personalizados';
