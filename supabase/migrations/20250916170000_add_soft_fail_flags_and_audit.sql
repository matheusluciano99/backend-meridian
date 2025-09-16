-- Migration: add soft-fail flags & audit view
-- Date: 2025-09-16

-- 1. Add columns for soft-fail tracking
ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS premium_initial_skipped BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS activation_onchain_skipped BOOLEAN DEFAULT false;

-- 2. Reinforce numeric integrity constraints (drop existing similar if present)
ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_hourly_rate_positive;
ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_funding_balance_nonnegative;
ALTER TABLE policies
  ADD CONSTRAINT policies_hourly_rate_positive CHECK (hourly_rate_xlm IS NULL OR hourly_rate_xlm > 0),
  ADD CONSTRAINT policies_funding_balance_nonnegative CHECK (funding_balance_xlm >= 0);

-- 3. Audit view for funding integrity. Simple first pass; expected_funding = funding_balance_xlm + total_premium_paid_xlm
CREATE OR REPLACE VIEW policy_funding_audit AS
SELECT
  p.id as policy_id,
  p.user_id,
  p.status,
  p.funding_balance_xlm,
  p.total_premium_paid_xlm,
  (COALESCE(p.funding_balance_xlm,0) + COALESCE(p.total_premium_paid_xlm,0)) AS funding_plus_paid,
  p.hourly_rate_xlm,
  p.next_charge_at,
  p.last_charge_at,
  p.premium_initial_skipped,
  p.activation_onchain_skipped,
  CASE WHEN p.funding_balance_xlm < 0 THEN true ELSE false END AS anomaly_negative_funding
FROM policies p;

-- 4. Backfill activation_onchain_skipped from ledger
UPDATE policies p SET activation_onchain_skipped = true
WHERE NOT activation_onchain_skipped
  AND EXISTS (
    SELECT 1 FROM ledger l
    WHERE l.policy_id = p.id AND l.event_type = 'policy_activation_onchain_skipped'
  );

-- 5. Backfill premium_initial_skipped from ledger reason activation_soft_fail
UPDATE policies p SET premium_initial_skipped = true
WHERE NOT premium_initial_skipped
  AND EXISTS (
    SELECT 1 FROM ledger l
    WHERE l.policy_id = p.id AND l.event_type = 'policy_hourly_charge_skipped'
      AND (l.event_data->>'reason') = 'activation_soft_fail'
  );

-- 6. Helpful index for querying soft-fail policies pending reconciliation
CREATE INDEX IF NOT EXISTS idx_policies_soft_fail_flags ON policies(activation_onchain_skipped, premium_initial_skipped)
  WHERE activation_onchain_skipped = true OR premium_initial_skipped = true;
