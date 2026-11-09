-- ==============================================================================
-- SPENDWISE – MASTER PRODUCTION DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Complete consolidated schema for Phases 0 through 8
-- Compatible with PostgreSQL 15+ / Supabase PostgreSQL
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. USER PREFERENCES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  currency TEXT DEFAULT 'INR' NOT NULL,
  date_format TEXT DEFAULT 'MMM DD, YYYY',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_all_own"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. USER ROLES (ROLE-BASED ACCESS CONTROL - RBAC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Helper function to check if a user is an active Administrator
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = check_user_id
      AND user_roles.role = 'admin'
      AND user_roles.is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "user_roles_admin_insert"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "user_roles_admin_update"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "user_roles_admin_delete"
  ON public.user_roles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 4. ADMIN AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_select"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "audit_logs_admin_insert"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 5. MONTHLY BUDGETS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monthly_budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'Monthly Budget',
  description TEXT,
  month_year TEXT NOT NULL, -- e.g. '2026-11'
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'INR' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_budgets_user_month ON public.monthly_budgets(user_id, month_year);

ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_budgets_all_own"
  ON public.monthly_budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system-wide default categories
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT 'Tag',
  color TEXT DEFAULT '#447F98',
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id, type);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select"
  ON public.categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "categories_user_insert"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_user_update"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "categories_user_delete"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id AND is_system = FALSE);

-- ------------------------------------------------------------------------------
-- 7. CATEGORY BUDGETS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  limit_amount NUMERIC(12, 2) NOT NULL CHECK (limit_amount >= 0),
  month_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_name, month_year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month_year);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_all_own"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 8. RECURRING EXPENSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR' NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name TEXT DEFAULT 'General',
  frequency TEXT NOT NULL DEFAULT 'Monthly' CHECK (frequency IN ('Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Yearly')),
  due_date TEXT DEFAULT '1st',
  next_due_date DATE,
  payment_method TEXT DEFAULT 'Auto-Debit',
  merchant TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_user_status ON public.recurring_expenses(user_id, status);

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_expenses_all_own"
  ON public.recurring_expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 9. TRANSACTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  merchant TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR' NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'receipt', 'bank', 'recurring')),
  receipt_id UUID,
  bank_import_id UUID,
  reference_number TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category_name);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, type);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_all_own"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 10. RECEIPT UPLOADS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receipt_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  file_hash TEXT,
  merchant_name TEXT,
  total_amount NUMERIC(12, 2),
  receipt_date DATE,
  category_name TEXT,
  currency TEXT DEFAULT 'INR',
  ocr_engine TEXT DEFAULT 'gemini-vision',
  status TEXT DEFAULT 'processed' CHECK (status IN ('uploaded', 'processed', 'confirmed', 'rejected')),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  raw_ocr_response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_user_hash ON public.receipt_uploads(user_id, file_hash);

ALTER TABLE public.receipt_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipt_uploads_all_own"
  ON public.receipt_uploads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 11. BANK STATEMENT IMPORTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_imports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT,
  file_size BIGINT,
  total_transactions INT DEFAULT 0,
  imported_transactions INT DEFAULT 0,
  duplicates_skipped INT DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  total_debit NUMERIC(12, 2) DEFAULT 0,
  total_credit NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_imports_user ON public.bank_imports(user_id, created_at DESC);

ALTER TABLE public.bank_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_imports_all_own"
  ON public.bank_imports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 12. AI CHATBOT CONVERSATIONS & MESSAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Financial Advisory',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conversations_all_own"
  ON public.ai_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user ON public.ai_messages(user_id);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_messages_all_own"
  ON public.ai_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 13. AUTOMATIC USER INITIALIZATION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url, currency)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'currency', 'INR')
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create User Preferences
  INSERT INTO public.user_preferences (user_id, currency, date_format)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'currency', 'INR'),
    'MMM DD, YYYY'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Create Default User Role (Always 'user', never 'admin')
  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (
    NEW.id,
    'user',
    TRUE
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 14. SECURE ADMIN PROMOTION PROCEDURE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_user_role(target_email TEXT, target_role TEXT)
RETURNS VOID AS $$
DECLARE
  target_id UUID;
BEGIN
  IF target_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be user or admin.';
  END IF;

  SELECT id INTO target_id FROM auth.users WHERE email = target_email;
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email %', target_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role, is_active, updated_at)
  VALUES (target_id, target_role, TRUE, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET role = target_role, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
