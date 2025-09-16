-- Migration: add PENDING_FUNDING status to policies.status constraint
-- Date: 2025-09-16

ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_status_check;
ALTER TABLE policies
  ADD CONSTRAINT policies_status_check CHECK (status IN ('ACTIVE','PAUSED','CANCELLED','EXPIRED','PENDING_FUNDING'));

-- Optionally adjust existing rows that might need transition (none expected here)
-- Ensure default remains ACTIVE (or change if needed). Keeping default as ACTIVE for now.
