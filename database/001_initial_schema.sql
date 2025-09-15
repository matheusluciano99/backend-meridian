-- =====================================================
-- MIGRAÇÃO 001: SCHEMA INICIAL
-- MERIDIAN INSURANCE
-- Data: 2024-01-XX
-- =====================================================

-- Esta migração cria a estrutura inicial do banco de dados
-- Execute este arquivo no Supabase SQL Editor

-- =====================================================
-- 1. EXTENSÕES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    document VARCHAR(20) UNIQUE, -- CPF/CNPJ
    wallet_address VARCHAR(255), -- Endereço da carteira Stellar
    kyc_status VARCHAR(50) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_document_url TEXT, -- URL do documento enviado para KYC
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    coverage_amount DECIMAL(15,2) NOT NULL,
    coverage_type VARCHAR(100), -- 'fixed', 'daily', 'percentage'
    coverage_duration INTEGER, -- em dias
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de apólices
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'PAUSED' CHECK (status IN ('PAUSED', 'ACTIVE', 'CANCELLED', 'EXPIRED')),
    premium_amount DECIMAL(10,2) NOT NULL,
    coverage_amount DECIMAL(15,2) NOT NULL,
    start_date DATE,
    end_date DATE,
    auto_renewal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    user_wallet VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'XLM',
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
    transaction_hash VARCHAR(255), -- Hash da transação Stellar
    anchor_transaction_id VARCHAR(255), -- ID da transação no anchor
    interactive_url TEXT, -- URL para depósito interativo
    webhook_data JSONB, -- Dados recebidos do webhook
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ledger (eventos)
CREATE TABLE IF NOT EXISTS ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- 'payment_received', 'policy_created', 'policy_activated', etc.
    event_data JSONB NOT NULL, -- Dados específicos do evento
    amount DECIMAL(15,2), -- Valor envolvido no evento (se aplicável)
    currency VARCHAR(10) DEFAULT 'XLM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sinistros
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'paid')),
    claim_type VARCHAR(100) NOT NULL, -- 'accident', 'income_loss', etc.
    description TEXT NOT NULL,
    incident_date DATE NOT NULL,
    claim_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    documents JSONB, -- URLs dos documentos anexados
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de webhook
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL, -- 'anchor', 'stellar', etc.
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ÍNDICES
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
-- 4. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
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
-- 5. SEQUÊNCIAS E FUNÇÕES AUXILIARES
-- =====================================================

-- Sequência para números de apólice
CREATE SEQUENCE IF NOT EXISTS policy_sequence START 1;

-- Função para gerar número de apólice
CREATE OR REPLACE FUNCTION generate_policy_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'POL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('policy_sequence')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Sequência para números de sinistro
CREATE SEQUENCE IF NOT EXISTS claim_sequence START 1;

-- Função para gerar número de sinistro
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CLM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('claim_sequence')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. DADOS INICIAIS (SEED DATA)
-- =====================================================

-- Inserir produtos iniciais
INSERT INTO products (code, name, description, price, coverage_amount, coverage_type, coverage_duration) VALUES
('ACCIDENT_48H', 'Acidentes 48h', 'Cobertura para acidentes pessoais por 48 horas', 300.00, 5000.00, 'fixed', 2),
('INCOME_PER_DIEM', 'Diária Autônomos', 'Cobertura de renda diária para trabalhadores autônomos', 250.00, 50.00, 'daily', 30)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 7. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE users IS 'Usuários do sistema de seguros';
COMMENT ON TABLE products IS 'Produtos de seguro disponíveis';
COMMENT ON TABLE policies IS 'Apólices de seguro contratadas';
COMMENT ON TABLE payments IS 'Pagamentos e transações financeiras';
COMMENT ON TABLE ledger IS 'Registro de eventos financeiros e operacionais';
COMMENT ON TABLE claims IS 'Sinistros e reclamações';
COMMENT ON TABLE webhook_logs IS 'Log de webhooks recebidos';

-- =====================================================
-- FIM DA MIGRAÇÃO 001
-- =====================================================
