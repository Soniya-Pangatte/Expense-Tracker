-- ====================================================================
-- SpendWise: Enhance Transaction Sources & Payment Methods
-- Safe, Non-Destructive, and Idempotent
-- ====================================================================

-- 1. Update check constraint on transactions.source to support 'recurring' and 'other'
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Find existing check constraint name on source column if present
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
  WHERE con.conrelid = 'public.transactions'::regclass
    AND con.contype = 'c'
    AND att.attname = 'source'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.transactions DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;

  -- Add updated check constraint supporting manual, receipt, bank, recurring, other
  ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_source_check 
    CHECK (source IN ('manual', 'receipt', 'bank', 'recurring', 'other'));
END $$;

-- 2. Ensure payment_method column exists and has proper default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN payment_method TEXT DEFAULT 'UPI';
  END IF;
END $$;
