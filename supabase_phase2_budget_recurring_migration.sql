-- ====================================================================
-- SPENDWISE - PHASE 2: BUDGET MANAGEMENT & RECURRING EXPENSES MIGRATION
-- ====================================================================

-- 1. Ensure columns exist on monthly_budgets
ALTER TABLE public.monthly_budgets 
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Monthly Budget',
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Ensure columns & constraints on category budgets (public.budgets)
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Ensure unique constraint on (user_id, category_name) if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'budgets_user_category_key'
  ) THEN
    ALTER TABLE public.budgets ADD CONSTRAINT budgets_user_category_key UNIQUE (user_id, category_name);
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 3. Enhance recurring_expenses table
ALTER TABLE public.recurring_expenses
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI',
  ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Update status check constraint on recurring_expenses to include 'Completed'
ALTER TABLE public.recurring_expenses DROP CONSTRAINT IF EXISTS recurring_expenses_status_check;
ALTER TABLE public.recurring_expenses 
  ADD CONSTRAINT recurring_expenses_status_check 
  CHECK (status IN ('Active', 'Upcoming', 'Paused', 'Cancelled', 'Completed'));

-- 4. Verify indexes for fast budget & recurring expense lookups
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_user_month ON public.monthly_budgets(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_budgets_user_cat ON public.budgets(user_id, category_name);
CREATE INDEX IF NOT EXISTS idx_recurring_user_status ON public.recurring_expenses(user_id, status);

-- 5. Row Level Security policies check
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Monthly budgets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own monthly budgets' AND tablename = 'monthly_budgets') THEN
    CREATE POLICY "Users can manage their own monthly budgets"
      ON public.monthly_budgets FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Category budgets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own category budgets' AND tablename = 'budgets') THEN
    CREATE POLICY "Users can manage their own category budgets"
      ON public.budgets FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Recurring expenses
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own recurring expenses' AND tablename = 'recurring_expenses') THEN
    CREATE POLICY "Users can manage their own recurring expenses"
      ON public.recurring_expenses FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
