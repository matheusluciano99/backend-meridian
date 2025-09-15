-- =====================================================
-- MIGRAÇÃO: Adicionar coluna balance à tabela users
-- MERIDIAN INSURANCE
-- Data: 2024-01-XX
-- =====================================================

-- Esta migração adiciona a coluna balance à tabela users existente
-- Execute APÓS o schema inicial ter sido criado

-- =====================================================
-- 1. ADICIONAR COLUNA BALANCE
-- =====================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0.00;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================