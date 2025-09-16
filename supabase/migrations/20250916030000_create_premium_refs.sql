-- Migration: create premium_refs table for off-chain idempotency of premium charges
-- Date: 2025-09-16

CREATE TABLE IF NOT EXISTS premium_refs (
  ref TEXT PRIMARY KEY,
  policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount_xlm DECIMAL(18,6) NOT NULL,
  tx_hash TEXT,
  collected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_premium_refs_policy ON premium_refs(policy_id);
CREATE INDEX IF NOT EXISTS idx_premium_refs_user ON premium_refs(user_id);
