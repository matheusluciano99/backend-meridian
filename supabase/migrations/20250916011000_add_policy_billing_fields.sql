-- Migration: add billing fields to policies (hourly model)
-- Date: 2025-09-16

ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS billing_model VARCHAR(20) DEFAULT 'HOURLY' CHECK (billing_model IN ('HOURLY')),
  ADD COLUMN IF NOT EXISTS hourly_rate_xlm DECIMAL(15,6),
  ADD COLUMN IF NOT EXISTS funding_balance_xlm DECIMAL(18,6) DEFAULT 0.000000 NOT NULL,
  ADD COLUMN IF NOT EXISTS total_premium_paid_xlm DECIMAL(18,6) DEFAULT 0.000000 NOT NULL,
  ADD COLUMN IF NOT EXISTS coverage_limit_xlm DECIMAL(18,6),
  ADD COLUMN IF NOT EXISTS next_charge_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_charge_at TIMESTAMP WITH TIME ZONE;

-- Backfill existing active policies with initial values using premium_amount as first funding + first charge already consumed
UPDATE policies
SET billing_model = 'HOURLY',
    hourly_rate_xlm = CASE WHEN premium_amount IS NOT NULL AND premium_amount > 0 THEN premium_amount / 24 ELSE 1 END,
    funding_balance_xlm = premium_amount,
    total_premium_paid_xlm = 0,
    coverage_limit_xlm = coverage_amount,
    next_charge_at = NOW(),
    last_charge_at = NULL
WHERE billing_model IS NULL OR hourly_rate_xlm IS NULL;

CREATE INDEX IF NOT EXISTS idx_policies_next_charge ON policies(next_charge_at) WHERE status = 'ACTIVE';
