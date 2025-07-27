/*
  # Add settlement days to payment methods

  1. Changes
    - Add `settlement_days` column to `payment_methods` table
    - Default value is 0 (instant settlement like cash)
    - Update existing payment methods with appropriate settlement days

  2. Security
    - No changes to RLS policies needed
*/

-- Add settlement_days column to payment_methods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_methods' AND column_name = 'settlement_days'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN settlement_days integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Update existing payment methods with typical settlement days
UPDATE payment_methods SET settlement_days = 0 WHERE name ILIKE '%dinheiro%' OR name ILIKE '%cash%';
UPDATE payment_methods SET settlement_days = 1 WHERE name ILIKE '%débito%' OR name ILIKE '%debit%';
UPDATE payment_methods SET settlement_days = 2 WHERE name ILIKE '%crédito%' OR name ILIKE '%credit%';
UPDATE payment_methods SET settlement_days = 1 WHERE name ILIKE '%pix%';