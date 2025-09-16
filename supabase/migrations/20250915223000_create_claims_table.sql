-- Migration: create claims table (idempotent)
-- Date: 2025-09-15
-- Purpose: Ensure claims table exists for environments that applied only partial schema earlier.

CREATE SEQUENCE IF NOT EXISTS claim_sequence START 1;

CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    claim_number VARCHAR(50) UNIQUE NOT NULL DEFAULT ('CLM-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('claim_sequence')::TEXT, 6, '0')),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'paid')),
    claim_type VARCHAR(100) NOT NULL,
    description TEXT,
    incident_date DATE NOT NULL,
    claim_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    documents JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_claims_incident_date ON claims(incident_date);

-- Trigger for updated_at (re-use existing function if present)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    -- Create trigger only if it does not already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_claims_updated_at'
    ) THEN
        CREATE TRIGGER update_claims_updated_at
            BEFORE UPDATE ON claims
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
