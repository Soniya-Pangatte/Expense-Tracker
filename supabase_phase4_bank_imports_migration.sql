-- ====================================================================
-- SPENDWISE - PHASE 4: BANK STATEMENT IMPORT & BULK PROCESSING MIGRATION
-- ====================================================================

-- 1. Ensure public.bank_imports has all Phase 4 tracking columns
ALTER TABLE public.bank_imports
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS total_debit NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_credit NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure bank_name has a default
ALTER TABLE public.bank_imports ALTER COLUMN bank_name SET DEFAULT 'Bank Statement';

-- 2. Update status check constraint on bank_imports
ALTER TABLE public.bank_imports DROP CONSTRAINT IF EXISTS bank_imports_status_check;
ALTER TABLE public.bank_imports
  ADD CONSTRAINT bank_imports_status_check
  CHECK (status IN ('processing', 'completed', 'failed', 'partial'));

-- 3. Ensure transactions table has reference_number and bank_import_id foreign key
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- 4. Create performance indexes for bank import queries and deduplication
CREATE INDEX IF NOT EXISTS idx_bank_imports_user_date ON public.bank_imports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bank_imports_user_hash ON public.bank_imports(user_id, file_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_import ON public.transactions(bank_import_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ref_num ON public.transactions(user_id, reference_number);

-- 5. Row Level Security policies check for bank_imports
ALTER TABLE public.bank_imports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can manage their own bank imports' AND tablename = 'bank_imports'
  ) THEN
    CREATE POLICY "Users can manage their own bank imports"
      ON public.bank_imports FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

