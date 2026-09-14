-- =============================================================
-- SPRINT A4: Schema + RLS + Profiles
-- Mamuty Barbearia — Segurança e Permissões
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard
-- =============================================================
-- CORREÇÃO: Políticas RLS usam DROP IF EXISTS antes de CREATE
-- para permitir re-execução sem erros.
-- =============================================================

-- 1. PROFILES
-- =============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'owner'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. SERVICES
-- =============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BARBERS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT DEFAULT '',
  description TEXT DEFAULT '',
  photo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CUSTOMERS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. APPOINTMENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'em_andamento')),
  price NUMERIC(10,2) DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. BUSINESS_SETTINGS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
  SELECT auth.uid() IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================
-- PROFILES policies
-- =============================================================
DROP POLICY IF EXISTS "Owner can view own profile" ON public.profiles;
CREATE POLICY "Owner can view own profile"
  ON public.profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Owner can update own profile" ON public.profiles;
CREATE POLICY "Owner can update own profile"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

-- =============================================================
-- SERVICES policies
-- =============================================================
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
  ON public.services FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Owner can view all services" ON public.services;
CREATE POLICY "Owner can view all services"
  ON public.services FOR SELECT USING (public.is_owner());

DROP POLICY IF EXISTS "Owner can insert services" ON public.services;
CREATE POLICY "Owner can insert services"
  ON public.services FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner can update services" ON public.services;
CREATE POLICY "Owner can update services"
  ON public.services FOR UPDATE USING (public.is_owner());

DROP POLICY IF EXISTS "Owner can delete services" ON public.services;
CREATE POLICY "Owner can delete services"
  ON public.services FOR DELETE USING (public.is_owner());

-- =============================================================
-- BARBERS policies
-- =============================================================
DROP POLICY IF EXISTS "Public can view active barbers" ON public.barbers;
CREATE POLICY "Public can view active barbers"
  ON public.barbers FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Owner can view all barbers" ON public.barbers;
CREATE POLICY "Owner can view all barbers"
  ON public.barbers FOR SELECT USING (public.is_owner());

DROP POLICY IF EXISTS "Owner can insert barbers" ON public.barbers;
CREATE POLICY "Owner can insert barbers"
  ON public.barbers FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner can update barbers" ON public.barbers;
CREATE POLICY "Owner can update barbers"
  ON public.barbers FOR UPDATE USING (public.is_owner());

DROP POLICY IF EXISTS "Owner can delete barbers" ON public.barbers;
CREATE POLICY "Owner can delete barbers"
  ON public.barbers FOR DELETE USING (public.is_owner());

-- =============================================================
-- CUSTOMERS policies
-- =============================================================
DROP POLICY IF EXISTS "Owner can view all customers" ON public.customers;
CREATE POLICY "Owner can view all customers"
  ON public.customers FOR SELECT USING (public.is_owner());

DROP POLICY IF EXISTS "Public can create customers" ON public.customers;
CREATE POLICY "Public can create customers"
  ON public.customers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Owner can update customers" ON public.customers;
CREATE POLICY "Owner can update customers"
  ON public.customers FOR UPDATE USING (public.is_owner());

DROP POLICY IF EXISTS "Owner can delete customers" ON public.customers;
CREATE POLICY "Owner can delete customers"
  ON public.customers FOR DELETE USING (public.is_owner());

-- =============================================================
-- APPOINTMENTS policies
-- =============================================================
DROP POLICY IF EXISTS "Owner can view all appointments" ON public.appointments;
CREATE POLICY "Owner can view all appointments"
  ON public.appointments FOR SELECT USING (public.is_owner());

DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;
CREATE POLICY "Public can create appointments"
  ON public.appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Owner can update appointments" ON public.appointments;
CREATE POLICY "Owner can update appointments"
  ON public.appointments FOR UPDATE USING (public.is_owner());

DROP POLICY IF EXISTS "Owner can delete appointments" ON public.appointments;
CREATE POLICY "Owner can delete appointments"
  ON public.appointments FOR DELETE USING (public.is_owner());

-- =============================================================
-- BUSINESS_SETTINGS policies
-- =============================================================
DROP POLICY IF EXISTS "Owner can view settings" ON public.business_settings;
CREATE POLICY "Owner can view settings"
  ON public.business_settings FOR SELECT USING (public.is_owner());

DROP POLICY IF EXISTS "Owner can insert settings" ON public.business_settings;
CREATE POLICY "Owner can insert settings"
  ON public.business_settings FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner can update settings" ON public.business_settings;
CREATE POLICY "Owner can update settings"
  ON public.business_settings FOR UPDATE USING (public.is_owner());

DROP POLICY IF EXISTS "Owner can delete settings" ON public.business_settings;
CREATE POLICY "Owner can delete settings"
  ON public.business_settings FOR DELETE USING (public.is_owner());

-- =============================================================
-- Índices
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_barber ON public.appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(active);
CREATE INDEX IF NOT EXISTS idx_barbers_active ON public.barbers(active);

-- =============================================================
-- Dados iniciais
-- =============================================================
INSERT INTO public.services (name, description, price, duration_minutes, active)
SELECT * FROM (VALUES
  ('Corte Social', 'Corte masculino com tesoura e máquina', 40.00, 30, true),
  ('Corte Degradê', 'Degradê navalhado com acabamento perfeito', 40.00, 40, true),
  ('Barba', 'Barba completa com navalha e hidratação', 35.00, 30, true),
  ('Cabelo + Barba', 'Combo completo cabelo e barba', 70.00, 50, true),
  ('Cabelo + Sobrancelha', 'Corte com alinhamento de sobrancelha', 60.00, 45, true),
  ('Combo Completo', 'Corte + Barba + Sobrancelha + Hidratação', 100.00, 60, true)
) AS v(name, description, price, duration_minutes, active)
WHERE NOT EXISTS (SELECT 1 FROM public.services LIMIT 1);

INSERT INTO public.barbers (name, specialty, description, photo_url, active)
SELECT * FROM (VALUES
  ('mamuty.barber', 'Degradê, Barba, Corte Tradicional', 'Barbeiro especialista em degradê e acabamento navalhado', '/barber-hemerson.jpg', true),
  ('Douglas', 'Corte Social, Barba', 'Barbeiro especialista em corte social e barba', '/barber-douglas.jpg', true)
) AS v(name, specialty, description, photo_url, active)
WHERE NOT EXISTS (SELECT 1 FROM public.barbers LIMIT 1);

INSERT INTO public.business_settings (key, value)
SELECT * FROM (VALUES
  ('general', '{"shopName": "Mamuty Barbearia", "whatsapp": "(94) 98443-9065", "address": "Cumaru do Norte - PA"}'::jsonb),
  ('hours', '{"openTime": "08:00", "closeTime": "20:00", "lunchStart": "12:00", "lunchEnd": "14:00", "workDays": "Segunda a Sábado"}'::jsonb),
  ('payments', '{"pix": true, "dinheiro": true, "debito": true, "credito": true}'::jsonb),
  ('cancellation', '{"advanceHours": 2, "policy": "Cancelamento deve ser feito com pelo menos 2 horas de antecedência."}'::jsonb)
) AS v(key, value)
WHERE NOT EXISTS (SELECT 1 FROM public.business_settings LIMIT 1);
