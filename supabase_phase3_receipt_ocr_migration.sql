-- ====================================================================
-- SPENDWISE - PHASE 3: SMART RECEIPT SCANNING & OCR MIGRATION
-- ====================================================================

-- 1. Ensure public.receipt_uploads has all Phase 3 columns
ALTER TABLE public.receipt_uploads
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS merchant_name TEXT,
  ADD COLUMN IF NOT EXISTS receipt_date DATE,
  ADD COLUMN IF NOT EXISTS receipt_time TEXT,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI',
  ADD COLUMN IF NOT EXISTS suggested_category TEXT,
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS raw_text TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Update status check constraint to support Phase 3 statuses
ALTER TABLE public.receipt_uploads DROP CONSTRAINT IF EXISTS receipt_uploads_status_check;
ALTER TABLE public.receipt_uploads
  ADD CONSTRAINT receipt_uploads_status_check
  CHECK (status IN ('uploaded', 'processing', 'review_required', 'confirmed', 'failed', 'pending_review', 'verified', 'rejected'));

-- 3. Indexes for duplicate checking, user receipts, and transaction links
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_user_hash ON public.receipt_uploads(user_id, file_hash);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_user_date ON public.receipt_uploads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_tx ON public.receipt_uploads(transaction_id);

-- 4. Verify transactions table has receipt_id and source columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'receipt_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN receipt_id UUID REFERENCES public.receipt_uploads(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'merchant'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN merchant TEXT;
  END IF;
END $$;

-- 5. Row Level Security policies check for receipt_uploads
ALTER TABLE public.receipt_uploads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can manage their own receipts' AND tablename = 'receipt_uploads'
  ) THEN
    CREATE POLICY "Users can manage their own receipts"
      ON public.receipt_uploads FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Storage Bucket Configuration for Receipts (Private Bucket)
-- In Supabase Storage, run in dashboard or SQL editor if storage schema exists:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false) ON CONFLICT (id) DO NOTHING;
--
-- Policy for users to upload to their own user_id folder:
-- CREATE POLICY "Users can upload their own receipts" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- Policy for users to read their own receipts:
-- CREATE POLICY "Users can view their own receipts" ON storage.objects
--   FOR SELECT USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- Policy for users to delete their own receipts:
-- CREATE POLICY "Users can delete their own receipts" ON storage.objects
--   FOR DELETE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
