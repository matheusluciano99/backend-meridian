-- Seed data migration (converted from seed.sql)
-- Executed via `supabase db push` because `supabase db execute` is unavailable in current CLI.
-- Idempotency: Uses ON CONFLICT DO NOTHING on unique keys where possible.

-- 1. PRODUCTS
INSERT INTO products (code, name, description, price, coverage_amount, coverage_type, coverage_duration, is_active) VALUES
('ACCIDENT_48H', 'Acidente 48h', 'Cobertura para acidentes pessoais por 48 horas', 300.00, 5000.00, 'fixed', 2, true),
('INCOME_PER_DIEM', 'Renda Diária', 'Seguro de renda diária por incapacidade temporária', 250.00, 50.00, 'daily', 30, true),
('TRAVEL_7D', 'Viagem 7 dias', 'Cobertura para viagens nacionais por 7 dias', 150.00, 10000.00, 'fixed', 7, true),
('HEALTH_30D', 'Saúde 30 dias', 'Cobertura de saúde por 30 dias', 500.00, 15000.00, 'fixed', 30, true),
('PROPERTY_BASIC', 'Propriedade Básica', 'Cobertura básica para propriedades', 200.00, 50000.00, 'fixed', 365, true),
('LIFE_TERM', 'Vida Temporário', 'Seguro de vida por prazo determinado', 1000.00, 100000.00, 'fixed', 365, true),
('DISABILITY_MONTHLY', 'Invalidez Mensal', 'Cobertura de invalidez com pagamento mensal', 300.00, 2000.00, 'monthly', 30, true),
('TRAVEL_OLD', 'Viagem Antigo', 'Produto antigo não mais disponível', 100.00, 5000.00, 'fixed', 7, false),
('HEALTH_BASIC', 'Saúde Básico', 'Versão básica do plano de saúde', 200.00, 5000.00, 'fixed', 30, false)
ON CONFLICT (code) DO NOTHING;

-- 2. USERS
INSERT INTO users (id, email, name, phone, document, wallet_address, balance, kyc_status, kyc_document_url) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'joao.silva@email.com', 'João Silva', '+5511999999999', '12345678901', 'GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 150.00, 'verified', 'https://storage.supabase.co/bucket/kyc/joao_silva_rg.pdf'),
('550e8400-e29b-41d4-a716-446655440002', 'maria.santos@email.com', 'Maria Santos', '+5511888888888', '98765432109', 'GDEF9876543210ZYXWVUTSRQPONMLKJIHGFEDCBA', 75.50, 'verified', 'https://storage.supabase.co/bucket/kyc/maria_santos_cnh.pdf'),
('550e8400-e29b-41d4-a716-446655440003', 'pedro.oliveira@email.com', 'Pedro Oliveira', '+5511777777777', '11122233344', 'GHIJ111122223333444455556666777788889999', 200.00, 'verified', 'https://storage.supabase.co/bucket/kyc/pedro_oliveira_rg.pdf'),
('550e8400-e29b-41d4-a716-446655440004', 'ana.costa@email.com', 'Ana Costa', '+5511666666666', '55566677788', 'GKLN555566667777888899990000111122223333', 0.00, 'pending', 'https://storage.supabase.co/bucket/kyc/ana_costa_rg.pdf'),
('550e8400-e29b-41d4-a716-446655440005', 'carlos.ferreira@email.com', 'Carlos Ferreira', '+5511555555555', '99988877766', 'GMNO999988887777666655554444333322221111', 25.00, 'pending', 'https://storage.supabase.co/bucket/kyc/carlos_ferreira_cnh.pdf'),
('550e8400-e29b-41d4-a716-446655440006', 'lucia.mendes@email.com', 'Lúcia Mendes', '+5511444444444', '44455566677', 'GPQR444455556666777788889999000011112222', 0.00, 'rejected', 'https://storage.supabase.co/bucket/kyc/lucia_mendes_rg.pdf'),
('550e8400-e29b-41d4-a716-446655440007', 'roberto.lima@email.com', 'Roberto Lima', '+5511333333333', '33344455566', 'GSTU333344445555666677778888999900001111', 0.00, 'pending', NULL),
('550e8400-e29b-41d4-a716-446655440008', 'fernanda.alves@email.com', 'Fernanda Alves', '+5511222222222', '22233344455', 'GVWX222233334444555566667777888899990000', 0.00, 'pending', NULL),
('550e8400-e29b-41d4-a716-446655440009', 'gabriel.rodrigues@email.com', 'Gabriel Rodrigues', '+5511111111111', '77788899900', 'GYZA111122223333444455556666777788889999', 0.00, 'pending', NULL),
('550e8400-e29b-41d4-a716-446655440010', 'juliana.moreira@email.com', 'Juliana Moreira', '+5511000000000', '00011122233', 'GZAB000011112222333344445555666677778888', 0.00, 'pending', NULL)
ON CONFLICT (email) DO NOTHING;

-- 3. POLICIES
INSERT INTO policies (user_id, product_id, policy_number, status, premium_amount, coverage_amount, start_date, end_date, auto_renewal) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM products WHERE code = 'ACCIDENT_48H'), 'POL-20250115-000001', 'ACTIVE', 300.00, 5000.00, '2025-01-15', '2025-01-17', false),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM products WHERE code = 'INCOME_PER_DIEM'), 'POL-20250116-000002', 'ACTIVE', 250.00, 50.00, '2025-01-16', '2025-02-15', true),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM products WHERE code = 'TRAVEL_7D'), 'POL-20250117-000003', 'ACTIVE', 150.00, 10000.00, '2025-01-17', '2025-01-24', false),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM products WHERE code = 'HEALTH_30D'), 'POL-20250118-000004', 'PAUSED', 500.00, 15000.00, '2025-01-18', '2025-02-17', false),
('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM products WHERE code = 'PROPERTY_BASIC'), 'POL-20250119-000005', 'PAUSED', 200.00, 50000.00, '2025-01-19', '2026-01-19', true),
('550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM products WHERE code = 'LIFE_TERM'), 'POL-20250120-000006', 'CANCELLED', 1000.00, 100000.00, '2025-01-20', '2026-01-20', false),
('550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM products WHERE code = 'ACCIDENT_48H'), 'POL-20250110-000007', 'EXPIRED', 300.00, 5000.00, '2025-01-10', '2025-01-12', false),
('550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM products WHERE code = 'DISABILITY_MONTHLY'), 'POL-20250111-000008', 'EXPIRED', 300.00, 2000.00, '2025-01-11', '2025-02-10', false),
('550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM products WHERE code = 'INCOME_PER_DIEM'), 'POL-20250121-000009', 'ACTIVE', 250.00, 50.00, '2025-01-21', '2025-02-20', true),
('550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM products WHERE code = 'TRAVEL_7D'), 'POL-20250122-000010', 'ACTIVE', 150.00, 10000.00, '2025-01-22', '2025-01-29', false)
ON CONFLICT (policy_number) DO NOTHING;

-- 4. PAYMENTS
INSERT INTO payments (user_id, policy_id, user_wallet, amount, currency, status, transaction_hash, anchor_transaction_id, interactive_url, webhook_data) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM policies WHERE policy_number = 'POL-20250115-000001'), 'GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 300.00, 'XLM', 'SUCCEEDED', 'tx_hash_001_abc123', 'anchor_tx_001', 'https://testanchor.stellar.org/deposit?wallet=GABC123...&amount=300', '{"status": "completed", "amount": "300", "currency": "XLM"}'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM policies WHERE policy_number = 'POL-20250116-000002'), 'GDEF9876543210ZYXWVUTSRQPONMLKJIHGFEDCBA', 250.00, 'XLM', 'SUCCEEDED', 'tx_hash_002_def456', 'anchor_tx_002', 'https://testanchor.stellar.org/deposit?wallet=GDEF987...&amount=250', '{"status": "completed", "amount": "250", "currency": "XLM"}'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM policies WHERE policy_number = 'POL-20250117-000003'), 'GHIJ111122223333444455556666777788889999', 150.00, 'XLM', 'SUCCEEDED', 'tx_hash_003_ghi789', 'anchor_tx_003', 'https://testanchor.stellar.org/deposit?wallet=GHIJ111...&amount=150', '{"status": "completed", "amount": "150", "currency": "XLM"}'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM policies WHERE policy_number = 'POL-20250118-000004'), 'GKLN555566667777888899990000111122223333', 500.00, 'XLM', 'PENDING', NULL, 'anchor_tx_004', 'https://testanchor.stellar.org/deposit?wallet=GKLN555...&amount=500', NULL),
('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM policies WHERE policy_number = 'POL-20250119-000005'), 'GMNO999988887777666655554444333322221111', 200.00, 'XLM', 'PENDING', NULL, 'anchor_tx_005', 'https://testanchor.stellar.org/deposit?wallet=GMNO999...&amount=200', NULL),
('550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM policies WHERE policy_number = 'POL-20250120-000006'), 'GPQR444455556666777788889999000011112222', 1000.00, 'XLM', 'FAILED', NULL, 'anchor_tx_006', 'https://testanchor.stellar.org/deposit?wallet=GPQR444...&amount=1000', '{"status": "failed", "error": "insufficient_funds"}'),
('550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM policies WHERE policy_number = 'POL-20250110-000007'), 'GSTU333344445555666677778888999900001111', 300.00, 'XLM', 'CANCELLED', NULL, 'anchor_tx_007', 'https://testanchor.stellar.org/deposit?wallet=GSTU333...&amount=300', '{"status": "cancelled", "reason": "user_cancelled"}'),
('550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM policies WHERE policy_number = 'POL-20250111-000008'), 'GVWX222233334444555566667777888899990000', 300.00, 'XLM', 'SUCCEEDED', 'tx_hash_008_vwx123', 'anchor_tx_008', 'https://testanchor.stellar.org/deposit?wallet=GVWX222...&amount=300', '{"status": "completed", "amount": "300", "currency": "XLM"}'),
('550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM policies WHERE policy_number = 'POL-20250121-000009'), 'GYZA111122223333444455556666777788889999', 250.00, 'XLM', 'SUCCEEDED', 'tx_hash_009_yza456', 'anchor_tx_009', 'https://testanchor.stellar.org/deposit?wallet=GYZA111...&amount=250', '{"status": "completed", "amount": "250", "currency": "XLM"}'),
('550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM policies WHERE policy_number = 'POL-20250122-000010'), 'GZAB000011112222333344445555666677778888', 150.00, 'XLM', 'SUCCEEDED', 'tx_hash_010_zab789', 'anchor_tx_010', 'https://testanchor.stellar.org/deposit?wallet=GZAB000...&amount=150', '{"status": "completed", "amount": "150", "currency": "XLM"}')
ON CONFLICT (transaction_hash) DO NOTHING;

-- 5. LEDGER
INSERT INTO ledger (user_id, policy_id, payment_id, event_type, event_data, amount, currency) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM policies WHERE policy_number = 'POL-20250115-000001'), NULL, 'policy_created', '{"policy_number": "POL-20250115-000001", "product": "ACCIDENT_48H"}', 300.00, 'XLM'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM policies WHERE policy_number = 'POL-20250116-000002'), NULL, 'policy_created', '{"policy_number": "POL-20250116-000002", "product": "INCOME_PER_DIEM"}', 250.00, 'XLM'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM policies WHERE policy_number = 'POL-20250117-000003'), NULL, 'policy_created', '{"policy_number": "POL-20250117-000003", "product": "TRAVEL_7D"}', 150.00, 'XLM'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM policies WHERE policy_number = 'POL-20250115-000001'), (SELECT id FROM payments WHERE transaction_hash = 'tx_hash_001_abc123'), 'payment_received', '{"transaction_hash": "tx_hash_001_abc123", "status": "completed"}', 300.00, 'XLM'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM policies WHERE policy_number = 'POL-20250116-000002'), (SELECT id FROM payments WHERE transaction_hash = 'tx_hash_002_def456'), 'payment_received', '{"transaction_hash": "tx_hash_002_def456", "status": "completed"}', 250.00, 'XLM'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM policies WHERE policy_number = 'POL-20250117-000003'), (SELECT id FROM payments WHERE transaction_hash = 'tx_hash_003_ghi789'), 'payment_received', '{"transaction_hash": "tx_hash_003_ghi789", "status": "completed"}', 150.00, 'XLM'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM policies WHERE policy_number = 'POL-20250115-000001'), NULL, 'policy_activated', '{"policy_number": "POL-20250115-000001", "start_date": "2025-01-15"}', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM policies WHERE policy_number = 'POL-20250116-000002'), NULL, 'policy_activated', '{"policy_number": "POL-20250116-000002", "start_date": "2025-01-16"}', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM policies WHERE policy_number = 'POL-20250117-000003'), NULL, 'policy_activated', '{"policy_number": "POL-20250117-000003", "start_date": "2025-01-17"}', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM policies WHERE policy_number = 'POL-20250120-000006'), NULL, 'policy_cancelled', '{"policy_number": "POL-20250120-000006", "reason": "user_request"}', NULL, NULL);

-- 6. CLAIMS
INSERT INTO claims (policy_id, user_id, claim_number, status, claim_type, description, incident_date, claim_amount, approved_amount, documents, notes) VALUES
((SELECT id FROM policies WHERE policy_number = 'POL-20250115-000001'), '550e8400-e29b-41d4-a716-446655440001', 'CLM-20250116-000001', 'approved', 'accident', 'Acidente de trânsito durante cobertura de 48h', '2025-01-16', 2500.00, 2500.00, '{"medical_report": "https://storage.supabase.co/bucket/claims/medical_001.pdf", "police_report": "https://storage.supabase.co/bucket/claims/police_001.pdf"}', 'Sinistro aprovado integralmente'),
((SELECT id FROM policies WHERE policy_number = 'POL-20250116-000002'), '550e8400-e29b-41d4-a716-446655440002', 'CLM-20250117-000002', 'approved', 'income_loss', 'Perda de renda por 15 dias devido a acidente', '2025-01-17', 750.00, 750.00, '{"medical_certificate": "https://storage.supabase.co/bucket/claims/medical_002.pdf", "income_proof": "https://storage.supabase.co/bucket/claims/income_002.pdf"}', 'Pagamento de 15 diárias aprovado'),
((SELECT id FROM policies WHERE policy_number = 'POL-20250117-000003'), '550e8400-e29b-41d4-a716-446655440003', 'CLM-20250118-000003', 'under_review', 'travel_delay', 'Atraso de voo durante viagem coberta', '2025-01-18', 500.00, NULL, '{"flight_delay_certificate": "https://storage.supabase.co/bucket/claims/flight_003.pdf"}', 'Aguardando análise de documentação'),
((SELECT id FROM policies WHERE policy_number = 'POL-20250110-000007'), '550e8400-e29b-41d4-a716-446655440007', 'CLM-20250119-000004', 'rejected', 'accident', 'Acidente após expiração da apólice', '2025-01-19', 1000.00, 0.00, '{"medical_report": "https://storage.supabase.co/bucket/claims/medical_004.pdf"}', 'Sinistro rejeitado - apólice expirada'),
((SELECT id FROM policies WHERE policy_number = 'POL-20250111-000008'), '550e8400-e29b-41d4-a716-446655440008', 'CLM-20250120-000005', 'paid', 'disability', 'Invalidez temporária por 10 dias', '2025-01-20', 2000.00, 2000.00, '{"medical_certificate": "https://storage.supabase.co/bucket/claims/medical_005.pdf", "disability_certificate": "https://storage.supabase.co/bucket/claims/disability_005.pdf"}', 'Pagamento realizado'),
((SELECT id FROM policies WHERE policy_number = 'POL-20250121-000009'), '550e8400-e29b-41d4-a716-446655440009', 'CLM-20250123-000006', 'submitted', 'income_loss', 'Perda de renda por 5 dias', '2025-01-23', 250.00, NULL, '{"medical_certificate": "https://storage.supabase.co/bucket/claims/medical_006.pdf"}', 'Aguardando análise inicial'),
((SELECT id FROM policies WHERE policy_number = 'POL-20250122-000010'), '550e8400-e29b-41d4-a716-446655440010', 'CLM-20250124-000007', 'submitted', 'travel_cancellation', 'Cancelamento de viagem por motivos médicos', '2025-01-24', 800.00, NULL, '{"medical_certificate": "https://storage.supabase.co/bucket/claims/medical_007.pdf", "travel_documents": "https://storage.supabase.co/bucket/claims/travel_007.pdf"}', 'Documentação em análise')
ON CONFLICT (claim_number) DO NOTHING;

-- 7. WEBHOOK LOGS (não idempotente - se a migration rodar outra vez, duplicará; espera-se execução única)
INSERT INTO webhook_logs (source, event_type, payload, processed, error_message) VALUES
('anchor', 'payment_completed', '{"transaction_id": "anchor_tx_001", "status": "completed", "amount": "300", "currency": "XLM"}', true, NULL),
('anchor', 'payment_completed', '{"transaction_id": "anchor_tx_002", "status": "completed", "amount": "250", "currency": "XLM"}', true, NULL),
('anchor', 'payment_completed', '{"transaction_id": "anchor_tx_003", "status": "completed", "amount": "150", "currency": "XLM"}', true, NULL),
('anchor', 'payment_failed', '{"transaction_id": "anchor_tx_006", "status": "failed", "error": "insufficient_funds"}', true, NULL),
('anchor', 'payment_cancelled', '{"transaction_id": "anchor_tx_007", "status": "cancelled", "reason": "user_cancelled"}', true, NULL),
('anchor', 'payment_pending', '{"transaction_id": "anchor_tx_004", "status": "pending", "amount": "500", "currency": "XLM"}', false, NULL),
('anchor', 'payment_pending', '{"transaction_id": "anchor_tx_005", "status": "pending", "amount": "200", "currency": "XLM"}', false, NULL),
('stellar', 'transaction_failed', '{"transaction_hash": "tx_failed_001", "error": "invalid_signature"}', false, 'Erro ao processar transação: assinatura inválida'),
('stellar', 'transaction_timeout', '{"transaction_hash": "tx_timeout_001", "timeout": 300}', false, 'Timeout ao processar transação após 5 minutos'),
('test', 'webhook_test', '{"test": true, "timestamp": "2025-01-25T10:00:00Z"}', true, NULL);

-- 8. SEQUENCES
SELECT setval('policy_sequence', GREATEST((SELECT MAX(split_part(policy_number,'-',3)::int) FROM policies), 10));
SELECT setval('claim_sequence', GREATEST((SELECT MAX(split_part(claim_number,'-',3)::int) FROM claims), 7));
