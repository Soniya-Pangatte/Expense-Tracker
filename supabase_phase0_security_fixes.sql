-- ====================================================================
-- SpendWise Phase 0: Security & Database Integrity Migration
-- Safe, Non-Destructive, and Idempotent
-- ====================================================================

-- 1. Ensure transactions.user_id defaults to authenticated user
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.transactions 
      ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- 2. Ensure transactions.currency has default 'INR'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.transactions 
      ALTER COLUMN currency SET DEFAULT 'INR';
  END IF;
END $$;

-- 3. Ensure monthly_budgets has month_year column and proper constraint
DO $$
BEGIN
  -- Verify month_year column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'monthly_budgets' 
    AND column_name = 'month_year'
  ) THEN
    ALTER TABLE public.monthly_budgets ADD COLUMN month_year TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM');
  END IF;
END $$;

-- 4. Seed system categories safely without duplicates
-- These provide initial financial categories available to all authenticated users
INSERT INTO public.categories (name, icon, color, is_income, is_system, user_id)
SELECT v.name, v.icon, v.color, v.is_income, TRUE, NULL
FROM (VALUES
  ('Housing & Rent', 'Home', '#447F98', FALSE),
  ('Groceries & Food', 'ShoppingBag', '#629BB5', FALSE),
  ('Utilities & Bills', 'Zap', '#243D49', FALSE),
  ('Transport & Fuel', 'Car', '#B9D9E1', FALSE),
  ('Entertainment & Leisure', 'Film', '#83BDCF', FALSE),
  ('Health & Fitness', 'HeartPulse', '#345968', FALSE),
  ('Shopping & Apparel', 'Tag', '#526C78', FALSE),
  ('Dining Out', 'Utensils', '#758D97', FALSE),
  ('Salary & Earnings', 'Briefcase', '#329B78', TRUE),
  ('Freelance & Investments', 'TrendingUp', '#4D9A82', TRUE)
) AS v(name, icon, color, is_income)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c 
  WHERE c.name = v.name AND c.is_system = TRUE
);

-- 5. Harden Row Level Security (RLS) on Categories
-- Prevent users from modifying or deleting global system categories
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id AND is_system = FALSE)
  WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id AND is_system = FALSE);

-- 6. Ensure profile update cannot reassign id
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 7. Performance & RLS Query Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_user_month ON public.monthly_budgets(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_categories_system_user ON public.categories(is_system, user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);

