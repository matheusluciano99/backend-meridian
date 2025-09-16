-- Migration: add user_wallets and anchor_transactions tables
-- Date: 2025-09-16

CREATE TABLE IF NOT EXISTS user_wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL UNIQUE,
    encrypted_secret TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anchor_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit','withdraw')),
    asset_code VARCHAR(20) NOT NULL DEFAULT 'USDC',
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    anchor_tx_id TEXT,
    memo TEXT,
    extra JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anchor_transactions_user ON anchor_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_anchor_transactions_status ON anchor_transactions(status);
CREATE INDEX IF NOT EXISTS idx_anchor_transactions_type ON anchor_transactions(type);

CREATE OR REPLACE FUNCTION update_anchor_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_anchor_transactions_updated') THEN
    CREATE TRIGGER trg_anchor_transactions_updated
      BEFORE UPDATE ON anchor_transactions
      FOR EACH ROW EXECUTE FUNCTION update_anchor_transactions_updated_at();
  END IF;
END $$;
