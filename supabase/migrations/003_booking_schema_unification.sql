-- =============================================================
-- MIGRATION 003: BOOKING SCHEMA UNIFICATION
-- Sprint 03 — Unifies webhook schema with migration 001
-- =============================================================
-- CORREÇÃO: DROP POLICY IF EXISTS antes de CREATE POLICY
-- para permitir re-execução sem erros.
-- =============================================================

-- 1. ADD MISSING COLUMNS TO APPOINTMENTS
-- =============================================================
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS barber_name TEXT;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS service_ids TEXT[],
  ADD COLUMN IF NOT EXISTS service_names TEXT[];

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS time TIME;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS total_duration_minutes INTEGER;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pendente';

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS whatsapp_notification_sent BOOLEAN DEFAULT false;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 2. EXTEND CHECK CONSTRAINT
-- =============================================================
-- Drop and recreate to add new statuses
-- =============================================================
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'confirmed',
    'completed',
    'cancelled',
    'em_andamento',
    'aguardando',
    'nao_compareceu',
    'expired'
  ));

-- 3. BACKFILL FROM EXISTING DATA
-- =============================================================
UPDATE public.appointments
SET date = appointment_date,
    time = appointment_time,
    total_price = price,
    total_duration_minutes = duration_minutes
WHERE date IS NULL;

-- 4. INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date
  ON public.appointments(barber_id, date);

CREATE INDEX IF NOT EXISTS idx_appointments_date_time
  ON public.appointments(date, time);

CREATE INDEX IF NOT EXISTS idx_appointments_phone
  ON public.appointments(customer_phone);

CREATE INDEX IF NOT EXISTS idx_appointments_status_date
  ON public.appointments(status, date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_idempotency
  ON public.appointments(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 5. UPDATED RLS POLICIES
-- =============================================================
-- CORREÇÃO: DROP IF EXISTS antes de CREATE
-- =============================================================
DROP POLICY IF EXISTS "Owner can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owner can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owner can delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owner full access on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Customers can view own appointments by phone" ON public.appointments;

-- Public can INSERT (direct client booking fallback)
CREATE POLICY "Public can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (true);

-- Owner full access (admin dashboard)
CREATE POLICY "Owner full access on appointments"
  ON public.appointments FOR ALL
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Customers can view own appointments by phone (for meus-agendamentos)
--暂时 open, server API will handle auth
CREATE POLICY "Customers can view own appointments by phone"
  ON public.appointments FOR SELECT
  USING (true);

-- Manter INSERT público
-- Manter UPDATE/DELETE para owner apenas (server API usa service role)

-- 6. SYNC TRIGGER
-- =============================================================
CREATE OR REPLACE FUNCTION public.sync_appointment_datetime()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date IS NULL THEN
    NEW.date := NEW.appointment_date;
  END IF;
  IF NEW.time IS NULL THEN
    NEW.time := NEW.appointment_time;
  END IF;
  IF NEW.total_price IS NULL THEN
    NEW.total_price := NEW.price;
  END IF;
  IF NEW.total_duration_minutes IS NULL THEN
    NEW.total_duration_minutes := NEW.duration_minutes;
  END IF;

  IF NEW.appointment_date IS NULL THEN
    NEW.appointment_date := NEW.date;
  END IF;
  IF NEW.appointment_time IS NULL THEN
    NEW.appointment_time := NEW.time;
  END IF;
  IF NEW.price IS NULL THEN
    NEW.price := NEW.total_price;
  END IF;
  IF NEW.duration_minutes IS NULL THEN
    NEW.duration_minutes := NEW.total_duration_minutes;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_datetime ON public.appointments;

CREATE TRIGGER sync_datetime
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_appointment_datetime();
