-- Migration: add billing fields to products
-- Date: 2025-09-16

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS hourly_rate_xlm DECIMAL(15,6),
  ADD COLUMN IF NOT EXISTS coverage_multiplier DECIMAL(10,4);

-- Backfill heuristic: se price definido e hourly_rate_xlm nulo, derivar hourly_rate_xlm = price / 24
UPDATE products
SET hourly_rate_xlm = price / 24
WHERE hourly_rate_xlm IS NULL;

-- Se coverage_multiplier vazio, definir 1.0
UPDATE products
SET coverage_multiplier = 1.0
WHERE coverage_multiplier IS NULL;
