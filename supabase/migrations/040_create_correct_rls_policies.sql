-- Migração para criar políticas RLS corretas sem recursão infinita
-- Cria políticas simples e eficazes para users e workshops
-- Data: 2025-01-06

-- 1. Criar função para verificar se usuário é admin (sem recursão)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar diretamente no auth.users se o email é de admin
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND email IN (
            'admin@lamusicweek.com',
            'hugo@latecnology.com.br', 
            'admin@admin.com'
        )
    );
END;
$$;

-- 2. Criar políticas para tabela users

-- Política para permitir inserção de novos usuários (cadastro)
CREATE POLICY "users_insert_registration" ON users
    FOR INSERT
    WITH CHECK (true);

-- Política para usuários autenticados verem seu próprio perfil
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid()::text = user_id::text OR is_admin_user());

-- Política para usuários autenticados atualizarem seu próprio perfil
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid()::text = user_id::text OR is_admin_user())
    WITH CHECK (auth.uid()::text = user_id::text OR is_admin_user());

-- Política para administradores poderem deletar usuários
CREATE POLICY "users_delete_admin" ON users
    FOR DELETE
    USING (is_admin_user());

-- 3. Criar políticas para tabela workshops

-- Política simples para todos verem workshops
CREATE POLICY "workshops_select_all" ON workshops
    FOR SELECT
    USING (true);

-- Política para administradores gerenciarem workshops
CREATE POLICY "workshops_admin_full" ON workshops
    FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- 4. Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

-- 5. Garantir permissões adequadas
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON users TO service_role;

GRANT SELECT ON workshops TO anon;
GRANT ALL PRIVILEGES ON workshops TO authenticated;
GRANT ALL PRIVILEGES ON workshops TO service_role;

-- 6. Comentários
COMMENT ON FUNCTION is_admin_user() IS 'Função para verificar se usuário é admin sem causar recursão';
COMMENT ON TABLE users IS 'Tabela de usuários com RLS corrigido - sem recursão infinita';
COMMENT ON TABLE workshops IS 'Tabela de workshops com políticas RLS simpl