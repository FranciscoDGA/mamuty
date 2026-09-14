-- =============================================================
-- MIGRATION 004: NOTIFICAÇÕES, LEMBRETES E PUSH PWA (SPRINT 04)
-- Mamuty Barbearia — Infraestrutura Oficial de Notificações
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard
-- =============================================================

-- 1. TABELA DE NOTIFICAÇÕES (IN-APP)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer', 'store', 'admin')),
  recipient_phone TEXT, -- Telefone limpo (apenas dígitos) para cliente
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'BOOKING_CREATED',
    'BOOKING_CANCELLED',
    'BOOKING_RESCHEDULED',
    'BOOKING_EXPIRED',
    'BOOKING_MISSED',
    'PROFESSIONAL_CHANGED',
    'REMINDER'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_notifications_customer_read 
  ON public.notifications(recipient_phone, read_at);

CREATE INDEX IF NOT EXISTS idx_notifications_type_created 
  ON public.notifications(recipient_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_booking 
  ON public.notifications(booking_id);

-- 2. TABELA DE AGENDAMENTO DE LEMBRETES (3 LEMBRETES AUTOMÁTICOS)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('reminder_1', 'reminder_2', 'reminder_3')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed', 'skipped')),
  idempotency_key TEXT UNIQUE NOT NULL,
  sent_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca de lembretes devidos (execução periódica)
CREATE INDEX IF NOT EXISTS idx_reminders_status_scheduled 
  ON public.booking_reminders(status, scheduled_for) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reminders_booking 
  ON public.booking_reminders(booking_id);

-- 3. TABELA DE INSCRIÇÕES DE PUSH (PWA)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('customer', 'store')),
  target_identifier TEXT NOT NULL, -- Telefone do cliente ou 'store_main'
  subscription JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_sub_target_endpoint 
  ON public.push_subscriptions(target_type, target_identifier, (subscription->>'endpoint'));

-- 4. CONFIGURAÇÃO PADRÃO DE INTERVALOS DOS LEMBRETES
-- =============================================================
INSERT INTO public.business_settings (key, value, updated_at)
VALUES (
  'reminders_config',
  '{
    "active": true,
    "reminder_1_minutes": 1440,
    "reminder_2_minutes": 180,
    "reminder_3_minutes": 30
  }'::jsonb,
  now()
)
ON CONFLICT (key) DO NOTHING;

-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS:
DROP POLICY IF EXISTS "Owner full access on notifications" ON public.notifications;
CREATE POLICY "Owner full access on notifications"
  ON public.notifications FOR ALL
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Customers can view their own notifications" ON public.notifications;
CREATE POLICY "Customers can view their own notifications"
  ON public.notifications FOR SELECT
  USING (recipient_type = 'customer');

DROP POLICY IF EXISTS "Public can insert notifications via server" ON public.notifications;
CREATE POLICY "Public can insert notifications via server"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can mark their own notifications as read" ON public.notifications;
CREATE POLICY "Customers can mark their own notifications as read"
  ON public.notifications FOR UPDATE
  USING (recipient_type = 'customer')
  WITH CHECK (recipient_type = 'customer');

-- BOOKING_REMINDERS:
DROP POLICY IF EXISTS "Owner full access on reminders" ON public.booking_reminders;
CREATE POLICY "Owner full access on reminders"
  ON public.booking_reminders FOR ALL
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Public can insert reminders via server" ON public.booking_reminders;
CREATE POLICY "Public can insert reminders via server"
  ON public.booking_reminders FOR INSERT
  WITH CHECK (true);

-- PUSH_SUBSCRIPTIONS:
DROP POLICY IF EXISTS "Owner full access on push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Owner full access on push_subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Public can insert or update push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Public can insert or update push_subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (true);
