-- =====================================================
-- SCRIPT COMPLETO - CRIAÇÃO DO BANCO DE DADOS
-- MERIDIAN INSURANCE
-- Data: 2025-09-15
-- =====================================================

-- Este script cria todo o banco de dados do zero
-- Execute em um banco PostgreSQL vazio

-- =====================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- =====================================================

-- uuid-ossp nem sempre está habilitado em todos os planos. Usamos pgcrypto.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. SEQUÊNCIAS PARA NÚMEROS DE APÓLICE E SINISTROS
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS policy_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS claim_sequence START 1;

-- =====================================================
-- 3. TABELA: products
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    coverage_amount DECIMAL(15,2) NOT NULL,
    coverage_type VARCHAR(100) DEFAULT 'fixed' CHECK (coverage_type IN ('fixed', 'daily', 'monthly', 'percentage')),
    coverage_duration INTEGER DEFAULT 30, -- em dias
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA: users
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    document VARCHAR(20) UNIQUE, -- CPF/CNPJ
    wallet_address VARCHAR(255), -- Endereço da carteira Stellar
    balance DECIMAL(15,2) DEFAULT 0.00, -- Saldo do usuário em XLM
    kyc_status VARCHAR(50) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_document_url TEXT, -- URL do documento enviado para KYC
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABELA: policies
-- =====================================================

CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    policy_number VARCHAR(50) UNIQUE NOT NULL DEFAULT ('POL-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('policy_sequence')::TEXT, 6, '0')),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED')),
    premium_amount DECIMAL(15,2) NOT NULL,
    coverage_amount DECIMAL(15,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renewal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. TABELA: payments
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    user_wallet VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'XLM',
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
    transaction_hash VARCHAR(255) UNIQUE,
    anchor_transaction_id VARCHAR(255),
    interactive_url TEXT,
    webhook_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. TABELA: ledger
-- =====================================================

CREATE TABLE IF NOT EXISTS ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    amount DECIMAL(15,2),
    currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. TABELA: claims
-- =====================================================

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

-- =====================================================
-- 9. TABELA: webhook_logs
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    processed BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_document ON users(document);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

-- Índices para policies
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_product_id ON policies(product_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_policies_dates ON policies(start_date, end_date);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_policy_id ON payments(policy_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_hash ON payments(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Índices para ledger
CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_policy_id ON ledger(policy_id);
CREATE INDEX IF NOT EXISTS idx_ledger_event_type ON ledger(event_type);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON ledger(created_at);

-- Índices para claims
CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_claims_incident_date ON claims(incident_date);

-- Índices para webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- =====================================================
-- 11. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabela
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. VERIFICAÇÃO DA CRIAÇÃO
-- =====================================================

-- Verificar se todas as tabelas foram criadas
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'products', 'policies', 'payments', 'ledger', 'claims', 'webhook_logs')
ORDER BY tablename;