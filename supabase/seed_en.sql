-- =====================================================
-- SEED DATA - MERIDIAN INSURANCE (ENGLISH VERSION)
-- File executed automatically after migrations
-- Date: 2025-09-15
-- =====================================================

-- This file contains sample data for development
-- Execute only in development environment

-- =====================================================
-- 1. INSURANCE PRODUCTS
-- =====================================================

INSERT INTO products (code, name, description, price, coverage_amount, coverage_type, coverage_duration, is_active) VALUES
-- Active Products
('ACCIDENT_48H', '48h Accident', 'Personal accident coverage for 48 hours', 300.00, 5000.00, 'fixed', 2, true),
('INCOME_PER_DIEM', 'Daily Income', 'Daily income insurance for temporary disability', 250.00, 50.00, 'daily', 30, true),
('TRAVEL_7D', '7-Day Travel', 'National travel coverage for 7 days', 150.00, 10000.00, 'fixed', 7, true),
('HEALTH_30D', '30-Day Health', 'Health coverage for 30 days', 500.00, 15000.00, 'fixed', 30, true),
('PROPERTY_BASIC', 'Basic Property', 'Basic property coverage', 200.00, 50000.00, 'fixed', 365, true),
('LIFE_TERM', 'Term Life', 'Term life insurance for determined period', 1000.00, 100000.00, 'fixed', 365, true),
('DISABILITY_MONTHLY', 'Monthly Disability', 'Disability coverage with monthly payment', 300.00, 2000.00, 'monthly', 30, true),

-- Inactive Products (for testing)
('TRAVEL_OLD', 'Old Travel', 'Old product no longer available', 100.00, 5000.00, 'fixed', 7, false),
('HEALTH_BASIC', 'Basic Health', 'Basic version of health plan', 200.00, 5000.00, 'fixed', 30, false);

-- =====================================================
-- 2. SAMPLE USERS
-- =====================================================

INSERT INTO users (id, email, name, phone, document, wallet_address, balance, kyc_status, kyc_document_url) VALUES
-- Users with verified KYC
('550e8400-e29b-41d4-a716-446655440001', 'john.smith@email.com', 'John Smith', '+15551234567', '12345678901', 'GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 150.00, 'verified', 'https://storage.supabase.co/bucket/kyc/john_smith_id.pdf'),
('550e8400-e29b-41d4-a716-446655440002', 'mary.johnson@email.com', 'Mary Johnson', '+15551234568', '98765432109', 'GDEF9876543210ZYXWVUTSRQPONMLKJIHGFEDCBA', 75.50, 'verified', 'https://storage.supabase.co/bucket/kyc/mary_johnson_dl.pdf'),
('550e8400-e29b-41d4-a716-446655440003', 'david.wilson@email.com', 'David Wilson', '+15551234569', '11122233344', 'GHIJ111122223333444455556666777788889999', 200.00, 'verified', 'https://storage.supabase.co/bucket/kyc/david_wilson_id.pdf'),

-- Users with pending KYC
('550e8400-e29b-41d4-a716-446655440004', 'sarah.brown@email.com', 'Sarah Brown', '+15551234570', '55566677788', 'GKLN555566667777888899990000111122223333', 0.00, 'pending', 'https://storage.supabase.co/bucket/kyc/sarah_brown_id.pdf'),
('550e8400-e29b-41d4-a716-446655440005', 'michael.davis@email.com', 'Michael Davis', '+15551234571', '99988877766', 'GMNO999988887777666655554444333322221111', 25.00, 'pending', 'https://storage.supabase.co/bucket/kyc/michael_davis_dl.pdf'),

-- Users with rejected KYC
('550e8400-e29b-41d4-a716-446655440006', 'lisa.miller@email.com', 'Lisa Miller', '+15551234572', '44455566677', 'GPQR444455556666777788889999000011112222', 0.00, 'rejected', 'https://storage.supabase.co/bucket/kyc/lisa_miller_id.pdf'),

-- Users without KYC (new registrations)
('550e8400-e29b-41d4-a716-446655440007', 'robert.garcia@email.com', 'Robert Garcia', '+15551234573', '33344455566', 'GSTU333344445555666677778888999900001111', 0.00, 'pending', NULL),
('550e8400-e29b-41d4-a716-446655440008', 'jennifer.martinez@email.com', 'Jennifer Martinez', '+15551234574', '22233344455', 'GVWX222233334444555566667777888899990000', 0.00, 'pending', NULL),
('550e8400-e29b-41d4-a716-446655440009', 'william.anderson@email.com', 'William Anderson', '+15551234575', '77788899900', 'GYZA111122223333444455556666777788889999', 0.00, 'pending', NULL),
('550e8400-e29b-41d4-a716-446655440010', 'jessica.taylor@email.com', 'Jessica Taylor', '+15551234576', '00011122233', 'GZAB000011112222333344445555666677778888', 0.00, 'pending', NULL);

-- =====================================================
-- 3. INSURANCE POLICIES
-- =====================================================

INSERT INTO policies (user_id, product_id, policy_number, status, premium_amount, coverage_amount, start_date, end_date, auto_renewal) VALUES
-- Active policies
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM products WHERE code = 'ACCIDENT_48H'), 'POL-20250115-000001', 'ACTIVE', 300.00, 5000.00, '2025-01-15', '2025-01-17', false),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM products WHERE code = 'INCOME_PER_DIEM'), 'POL-20250116-000002', 'ACTIVE', 250.00, 50.00, '2025-01-16', '2025-02-15', true),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM products WHERE code = 'TRAVEL_7D'), 'POL-20250117-000003', 'ACTIVE', 150.00, 10000.00, '2025-01-17', '2025-01-24', false),

-- Paused policies
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM products WHERE code = 'HEALTH_30D'), 'POL-20250118-000004', 'PAUSED', 500.00, 15000.00, '2025-01-18', '2025-02-17', false),
('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM products WHERE code = 'PROPERTY_BASIC'), 'POL-20250119-000005', 'PAUSED', 200.00, 50000.00, '2025-01-19', '2026-01-19', true),

-- Cancelled policies
('550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM products WHERE code = 'LIFE_TERM'), 'POL-20250120-000006', 'CANCELLED', 1000.00, 100000.00, '2025-01-20', '2026-01-20', false),

-- Expired policies
('550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM products WHERE code = 'ACCIDENT_48H'), 'POL-20250110-000007', 'EXPIRED', 300.00, 5000.00, '2025-01-10', '2025-01-12', false),
('550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM products WHERE code = 'DISABILITY_MONTHLY'), 'POL-20250111-000008', 'EXPIRED', 300.00, 2000.00, '2025-01-11', '2025-02-10', false),

-- Recent active policies
('550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM products WHERE code = 'INCOME_PER_DIEM'), 'POL-20250121-000009', 'ACTIVE', 250.00, 50.00, '2025-01-21', '2025-02-20', true),
('550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM products WHERE code = 'TRAVEL_7D'), 'POL-20250122-000010', 'ACTIVE', 150.00, 10000.00, '2025-01-22', '2025-01-29', false);

-- =====================================================
-- 4. PAYMENTS
-- =====================================================

INSERT INTO payments (user_id, policy_id, user_wallet, amount, currency, status, transaction_hash, anchor_transaction_id, interactive_url, webhook_data) VALUES
-- Successful payments
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM policies WHERE policy_number = 'POL-20250115-000001'), 'GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 300.00, 'XLM', 'SUCCEEDED', 'tx_hash_001_abc123', 'anchor_tx_001', 'https://testanchor.stellar.org/deposit?wallet=GABC123...&amount=300', '{"status": "completed", "amount": "300", "currency": "XLM"}'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM policies WHERE policy_number = 'POL-20250116-000002'), 'GDEF9876543210ZYXWVUTSRQPONMLKJIHGFEDCBA', 250.00, 'XLM', 'SUCCEEDED', 'tx_hash_002_def456', 'anchor_tx_002', 'https://testanchor.stellar.org/deposit?wallet=GDEF987...&amount=250', '{"status": "completed", "amount": "250", "currency": "XLM"}'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM policies WHERE policy_number = 'POL-20250117-000003'), 'GHIJ111122223333444455556666777788889999', 150.00, 'XLM', 'SUCCEEDED', 'tx_hash_003_ghi789', 'anchor_tx_003', 'https://testanchor.stellar.org/deposit?wallet=GHIJ111...&amount=150', '{"status": "completed", "amount": "150", "currency": "XLM"}'),

-- Pending payments
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM policies WHERE policy_number = 'POL-20250118-000004'), 'GKLN555566667777888899990000111122223333', 500.00, 'XLM', 'PENDING', NULL, 'anchor_tx_004', 'https://testanchor.stellar.org/deposit?wallet=GKLN555...&amount=500', NULL),
('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM policies WHERE policy_number = 'POL-20250119-000005'), 'GMNO999988887777666655554444333322221111', 200.00, 'XLM', 'PENDING', NULL, 'anchor_tx_005', 'https://testanchor.stellar.org/deposit?wallet=GMNO999...&amount=200', NULL),

-- Failed payments
('550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM policies WHERE policy_number = 'POL-20250120-000006'), 'GPQR444455556666777788889999000011112222', 1000.00, 'XLM', 'FAILED', NULL, 'anchor_tx_006', 'https://testanchor.stellar.org/deposit?wallet=GPQR444...&amount=1000', '{"status": "failed", "error": "insufficient_funds"}'),

-- Cancelled payments
('550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM policies WHERE policy_number = 'POL-20250110-000007'), 'GSTU333344445555666677778888999900001111', 300.00, 'XLM', 'CANCELLED', NULL, 'anchor_tx_007', 'https://testanchor.stellar.org/deposit?wallet=GSTU333...&amount=300', '{"status": "cancelled", "reason": "user_cancelled"}'),

-- Recent successful payments
('550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM policies WHERE policy_number = 'POL-20250111-000008'), 'GVWX222233334444555566667777888899990000', 300.00, 'XLM', 'SUCCEEDED', 'tx_hash_008_vwx123', 'anchor_tx_008', 'https://testanchor.stellar.org/deposit?wallet=GVWX222...&amount=300', '{"status": "completed", "amount": "300", "currency": "XLM"}'),
('550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM policies WHERE policy_number = 'POL-20250121-000009'), 'GYZA111122223333444455556666777788889999', 250.00, 'XLM', 'SUCCEEDED', 'tx_hash_009_yza456', 'anchor_tx_009', 'https://testanchor.stellar.org/deposit?wallet=GYZA111...&amount=250', '{"status": "completed", "amount": "250", "currency": "XLM"}'),
('550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM policies WHERE policy_number = 'POL-20250122-000010'), 'GZAB000011112222333344445555666677778888', 150.00, 'XLM', 'SUCCEEDED', 'tx_hash_010_zab789', 'anchor_tx_010', 'https://testanchor.stellar.org/deposit?wallet=GZAB000...&amount=150', '{"status": "completed", "amount": "150", "currency": "XLM"}');

-- =====================================================
-- 5. LEDGER RECORDS
-- =====================================================

INSERT INTO ledger (user_id, policy_id, payment_id, event_type, event_data, amount, currency) VALUES
-- Policy creation events
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM policies WHERE policy_number = 'POL-20250115-000001'), NULL, 'policy_created', '{"policy_number": "POL-20250115-000001", "product": "ACCIDENT_48H"}', 300.00, 'XLM'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM policies WHERE policy_number = 'POL-20250116-000002'), NULL, 'policy_created', '{"policy_number": "POL-20250116-000002", "product": "INCOME_PER_DIEM"}', 250.00, 'XLM'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM policies WHERE policy_number = 'POL-20250117-000003'), NULL, 'policy_created', '{"policy_number": "POL-20250117-000003", "product": "TRAVEL_7D"}', 150.00, 'XLM'),

-- Payment received events
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM policies WHERE policy_number = 'POL-20250115-000001'), (SELECT id FROM payments WHERE transaction_hash = 'tx_hash_001_abc123'), 'payment_received', '{"transaction_hash": "tx_hash_001_abc123", "status": "completed"}', 300.00, 'XLM'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM policies WHERE policy_number = 'POL-20250116-000002'), (SELECT id FROM payments WHERE transaction_hash = 'tx_hash_002_def456'), 'payment_received', '{"transaction_hash": "tx_hash_002_def456", "status": "completed"}', 250.00, 'XLM'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM policies WHERE policy_number = 'POL-20250117-000003'), (SELECT id FROM payments WHERE transaction_hash = 'tx_hash_003_ghi789'), 'payment_received', '{"transaction_hash": "tx_hash_003_ghi789", "status": "completed"}', 150.00, 'XLM'),

-- Policy activation events
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM policies WHERE policy_number = 'POL-20250115-000001'), NULL, 'policy_activated', '{"policy_number": "POL-20250115-000001", "start_date": "2025-01-15"}', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM policies WHERE policy_number = 'POL-20250116-000002'), NULL, 'policy_activated', '{"policy_number": "POL-20250116-000002", "start_date": "2025-01-16"}', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM policies WHERE policy_number = 'POL-20250117-000003'), NULL, 'policy_activated', '{"policy_number": "POL-20250117-000003", "start_date": "2025-01-17"}', NULL, NULL),

-- Cancellation events
('550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM policies WHERE policy_number = 'POL-20250120-000006'), NULL, 'policy_cancelled', '{"policy_number": "POL-20250120-000006", "reason": "user_request"}', NULL, NULL);

-- =====================================================
-- 6. CLAIMS
-- =====================================================

INSERT INTO claims (policy_id, user_id, claim_number, status, claim_type, description, incident_date, claim_amount, approved_amount, documents, notes) VALUES
-- Approved claims
((SELECT id FROM policies WHERE policy_number = 'POL-20250115-000001'), '550e8400-e29b-41d4-a716-446655440001', 'CLM-20250116-000001', 'approved', 'accident', 'Traffic accident during 48h coverage period', '2025-01-16', 2500.00, 2500.00, '{"medical_report": "https://storage.supabase.co/bucket/claims/medical_001.pdf", "police_report": "https://storage.supabase.co/bucket/claims/police_001.pdf"}', 'Claim approved in full'),
((SELECT id FROM policies WHERE policy_number = 'POL-20250116-000002'), '550e8400-e29b-41d4-a716-446655440002', 'CLM-20250117-000002', 'approved', 'income_loss', 'Income loss for 15 days due to accident', '2025-01-17', 750.00, 750.00, '{"medical_certificate": "https://storage.supabase.co/bucket/claims/medical_002.pdf", "income_proof": "https://storage.supabase.co/bucket/claims/income_002.pdf"}', 'Payment of 15 daily allowances approved'),

-- Claims under review
((SELECT id FROM policies WHERE policy_number = 'POL-20250117-000003'), '550e8400-e29b-41d4-a716-446655440003', 'CLM-20250118-000003', 'under_review', 'travel_delay', 'Flight delay during covered trip', '2025-01-18', 500.00, NULL, '{"flight_delay_certificate": "https://storage.supabase.co/bucket/claims/flight_003.pdf"}', 'Awaiting documentation analysis'),

-- Rejected claims
((SELECT id FROM policies WHERE policy_number = 'POL-20250110-000007'), '550e8400-e29b-41d4-a716-446655440007', 'CLM-20250119-000004', 'rejected', 'accident', 'Accident after policy expiration', '2025-01-19', 1000.00, 0.00, '{"medical_report": "https://storage.supabase.co/bucket/claims/medical_004.pdf"}', 'Claim rejected - policy expired'),

-- Paid claims
((SELECT id FROM policies WHERE policy_number = 'POL-20250111-000008'), '550e8400-e29b-41d4-a716-446655440008', 'CLM-20250120-000005', 'paid', 'disability', 'Temporary disability for 10 days', '2025-01-20', 2000.00, 2000.00, '{"medical_certificate": "https://storage.supabase.co/bucket/claims/medical_005.pdf", "disability_certificate": "https://storage.supabase.co/bucket/claims/disability_005.pdf"}', 'Payment completed'),

-- Recently submitted claims
((SELECT id FROM policies WHERE policy_number = 'POL-20250121-000009'), '550e8400-e29b-41d4-a716-446655440009', 'CLM-20250123-000006', 'submitted', 'income_loss', 'Income loss for 5 days', '2025-01-23', 250.00, NULL, '{"medical_certificate": "https://storage.supabase.co/bucket/claims/medical_006.pdf"}', 'Awaiting initial analysis'),
((SELECT id FROM policies WHERE policy_number = 'POL-20250122-000010'), '550e8400-e29b-41d4-a716-446655440010', 'CLM-20250124-000007', 'submitted', 'travel_cancellation', 'Trip cancellation due to medical reasons', '2025-01-24', 800.00, NULL, '{"medical_certificate": "https://storage.supabase.co/bucket/claims/medical_007.pdf", "travel_documents": "https://storage.supabase.co/bucket/claims/travel_007.pdf"}', 'Documentation under analysis');

-- =====================================================
-- 7. WEBHOOK LOGS
-- =====================================================

INSERT INTO webhook_logs (source, event_type, payload, processed, error_message) VALUES
-- Successfully processed webhooks
('anchor', 'payment_completed', '{"transaction_id": "anchor_tx_001", "status": "completed", "amount": "300", "currency": "XLM"}', true, NULL),
('anchor', 'payment_completed', '{"transaction_id": "anchor_tx_002", "status": "completed", "amount": "250", "currency": "XLM"}', true, NULL),
('anchor', 'payment_completed', '{"transaction_id": "anchor_tx_003", "status": "completed", "amount": "150", "currency": "XLM"}', true, NULL),

-- Webhooks with errors
('anchor', 'payment_failed', '{"transaction_id": "anchor_tx_006", "status": "failed", "error": "insufficient_funds"}', true, NULL),
('anchor', 'payment_cancelled', '{"transaction_id": "anchor_tx_007", "status": "cancelled", "reason": "user_cancelled"}', true, NULL),

-- Webhooks pending processing
('anchor', 'payment_pending', '{"transaction_id": "anchor_tx_004", "status": "pending", "amount": "500", "currency": "XLM"}', false, NULL),
('anchor', 'payment_pending', '{"transaction_id": "anchor_tx_005", "status": "pending", "amount": "200", "currency": "XLM"}', false, NULL),

-- Webhooks with processing errors
('stellar', 'transaction_failed', '{"transaction_hash": "tx_failed_001", "error": "invalid_signature"}', false, 'Error processing transaction: invalid signature'),
('stellar', 'transaction_timeout', '{"transaction_hash": "tx_timeout_001", "timeout": 300}', false, 'Transaction processing timeout after 5 minutes'),

-- Test webhooks
('test', 'webhook_test', '{"test": true, "timestamp": "2025-01-25T10:00:00Z"}', true, NULL);

-- =====================================================
-- 8. UPDATE SEQUENCES
-- =====================================================

-- Update sequences to continue from inserted data
SELECT setval('policy_sequence', 10);
SELECT setval('claim_sequence', 7);

-- =====================================================
-- 9. DATA INSERTION VERIFICATION
-- =====================================================

-- Queries to verify if data was inserted correctly
SELECT 'Users inserted:' as info, COUNT(*) as total FROM users
UNION ALL
SELECT 'Products inserted:', COUNT(*) FROM products
UNION ALL
SELECT 'Policies inserted:', COUNT(*) FROM policies
UNION ALL
SELECT 'Payments inserted:', COUNT(*) FROM payments
UNION ALL
SELECT 'Ledger events inserted:', COUNT(*) FROM ledger
UNION ALL
SELECT 'Claims inserted:', COUNT(*) FROM claims
UNION ALL
SELECT 'Webhook logs inserted:', COUNT(*) FROM webhook_logs;
