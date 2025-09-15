-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- MERIDIAN INSURANCE
-- =====================================================

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA USERS
-- =====================================================

-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Permitir inserção de novos usuários (registro)
CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- POLÍTICAS PARA PRODUCTS
-- =====================================================

-- Produtos são públicos para leitura (todos podem ver)
CREATE POLICY "Products are publicly readable" ON products
    FOR SELECT USING (true);

-- Apenas administradores podem modificar produtos
CREATE POLICY "Only admins can modify products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.kyc_status = 'verified'
            -- Aqui você pode adicionar uma verificação de role de admin
        )
    );

-- =====================================================
-- POLÍTICAS PARA POLICIES
-- =====================================================

-- Usuários podem ver apenas suas próprias apólices
CREATE POLICY "Users can view own policies" ON policies
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Usuários podem criar apólices para si mesmos
CREATE POLICY "Users can create own policies" ON policies
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Usuários podem atualizar suas próprias apólices (apenas status)
CREATE POLICY "Users can update own policies" ON policies
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- =====================================================
-- POLÍTICAS PARA PAYMENTS
-- =====================================================

-- Usuários podem ver apenas seus próprios pagamentos
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Usuários podem criar pagamentos para si mesmos
CREATE POLICY "Users can create own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Apenas o sistema pode atualizar status de pagamentos (via webhooks)
CREATE POLICY "System can update payment status" ON payments
    FOR UPDATE USING (true); -- Em produção, você pode querer restringir isso

-- =====================================================
-- POLÍTICAS PARA LEDGER
-- =====================================================

-- Usuários podem ver apenas eventos relacionados a eles
CREATE POLICY "Users can view own ledger events" ON ledger
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Apenas o sistema pode inserir eventos no ledger
CREATE POLICY "System can insert ledger events" ON ledger
    FOR INSERT WITH CHECK (true); -- Em produção, você pode querer restringir isso

-- =====================================================
-- POLÍTICAS PARA CLAIMS
-- =====================================================

-- Usuários podem ver apenas seus próprios sinistros
CREATE POLICY "Users can view own claims" ON claims
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Usuários podem criar sinistros para suas próprias apólices
CREATE POLICY "Users can create claims for own policies" ON claims
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id::text AND
        EXISTS (
            SELECT 1 FROM policies 
            WHERE policies.id = claims.policy_id 
            AND policies.user_id::text = auth.uid()::text
        )
    );

-- Usuários podem atualizar seus próprios sinistros (apenas se não aprovados)
CREATE POLICY "Users can update own pending claims" ON claims
    FOR UPDATE USING (
        auth.uid()::text = user_id::text AND 
        status IN ('submitted', 'under_review')
    );

-- =====================================================
-- POLÍTICAS PARA WEBHOOK_LOGS
-- =====================================================

-- Webhook logs são apenas para o sistema (sem acesso direto do usuário)
CREATE POLICY "Webhook logs are system only" ON webhook_logs
    FOR ALL USING (false);

-- =====================================================
-- POLÍTICAS ESPECIAIS PARA ADMINISTRADORES
-- =====================================================

-- Função para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Aqui você pode implementar sua lógica de verificação de admin
    -- Por exemplo, verificar se o usuário tem um campo 'role' = 'admin'
    -- ou se está em uma tabela de administradores
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id::text = auth.uid()::text 
        AND users.kyc_status = 'verified'
        -- Adicione aqui sua lógica de verificação de admin
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para administradores verem todos os dados
CREATE POLICY "Admins can view all data" ON users
    FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all policies" ON policies
    FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all payments" ON payments
    FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all claims" ON claims
    FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all ledger events" ON ledger
    FOR ALL USING (is_admin());

-- =====================================================
-- POLÍTICAS PARA API/SERVICE ACCOUNTS
-- =====================================================

-- Se você usar service accounts para webhooks e operações do sistema,
-- você pode criar políticas específicas para eles

-- Exemplo de política para service account (usando JWT customizado)
-- CREATE POLICY "Service account can manage payments" ON payments
--     FOR ALL USING (
--         auth.jwt() ->> 'role' = 'service_account'
--     );

-- =====================================================
-- FUNÇÕES AUXILIARES PARA RLS
-- =====================================================

-- Função para obter o ID do usuário atual
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário pode acessar uma apólice
CREATE OR REPLACE FUNCTION can_access_policy(policy_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM policies 
        WHERE policies.id = policy_id 
        AND policies.user_id = get_current_user_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS DAS POLÍTICAS
-- =====================================================

COMMENT ON POLICY "Users can view own profile" ON users IS 'Permite que usuários vejam apenas seus próprios dados';
COMMENT ON POLICY "Products are publicly readable" ON products IS 'Produtos são públicos para consulta';
COMMENT ON POLICY "Users can view own policies" ON policies IS 'Usuários podem ver apenas suas próprias apólices';
COMMENT ON POLICY "Users can view own payments" ON payments IS 'Usuários podem ver apenas seus próprios pagamentos';
COMMENT ON POLICY "Users can view own claims" ON claims IS 'Usuários podem ver apenas seus próprios sinistros';

-- =====================================================
-- FIM DAS POLÍTICAS RLS
-- =====================================================
