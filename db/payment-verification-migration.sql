-- Run this once in the Supabase SQL Editor before deploying the updated files.
-- Existing successful Daraja transactions remain verified; other transactions
-- remain unverified until confirmed by an admin.
ALTER TABLE public.mpesa_transactions
  ADD COLUMN IF NOT EXISTS verify_status text;

UPDATE public.mpesa_transactions
SET verify_status = CASE
  WHEN status = 'success' OR result_code::text = '0' THEN 'verified'
  ELSE 'unverified'
END
WHERE verify_status IS NULL;

ALTER TABLE public.mpesa_transactions
  ALTER COLUMN verify_status SET DEFAULT 'unverified';

ALTER TABLE public.mpesa_transactions
  ALTER COLUMN verify_status SET NOT NULL;
