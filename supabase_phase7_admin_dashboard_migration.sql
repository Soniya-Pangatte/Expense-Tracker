-- ==========================================================
-- SpendWise Phase 7 – Admin Dashboard & RBAC Database Migration
-- Role-Based Access Control, Admin Audit Logs, and RLS
-- ==========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER ROLES & ACCOUNT STATUS TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Helper function to check if a user is an Admin
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

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own role; Admins can read all roles
CREATE POLICY "Users view own role, admins view all"
  ON public.user_roles FOR SELECT
  USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Policy 2: Only verified Admins can insert/update/delete user roles
CREATE POLICY "Only admins can insert user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())
  );

CREATE POLICY "Only admins can update user roles"
  ON public.user_roles FOR UPDATE
  USING (
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid())
  );

CREATE POLICY "Only admins can delete user roles"
  ON public.user_roles FOR DELETE
  USING (
    public.is_admin(auth.uid())
  );


-- 2. ADMIN AUDIT LOGS TABLE
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
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON public.admin_audit_logs(admin_id);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (
    public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())
  );


-- 3. UPDATE HANDLE_NEW_USER TRIGGER
-- Ensures every new registrant defaults to 'user' role with active status.
-- Public users can never self-assign 'admin'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url, currency)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'currency', 'INR')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert preferences
  INSERT INTO public.user_preferences (user_id, currency, date_format)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'currency', 'INR'),
    'MMM DD, YYYY'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert default user role (always 'user', never 'admin')
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


-- 4. SECURE ADMIN PROMOTION STORED PROCEDURE
-- Callable by database administrators or service-role to securely promote an initial admin
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

