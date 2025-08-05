-- Migração para corrigir definitivamente os problemas de RLS
-- Remove recursão infinita e permite acesso adequado para administradores
-- Data: 2025-01-06

-- 1. Limpar todas as políticas existentes da tabela users
DROP POLICY IF EXISTS "anon_insert_users" ON users;
DROP POLICY IF EXISTS "auth_select_own_users" ON users;
DROP POLICY IF EXISTS "auth_update_own_users" ON users;
DROP POLICY IF EXISTS "admin_select_all_users" ON users;
DROP POLICY IF EXISTS "admin_update_all_users" ON users;
DROP POLICY IF EXISTS "admin_delete_users" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "admin_full_access" ON users;

-- 2. Reabilitar RLS na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas simples e eficazes sem recursão

-- Política para permitir inserção de novos usuários (cadastro)
CREATE POLICY "allow_user_registration" ON users
    FOR INSERT
    WITH CHECK (true);

-- Política para usuários autenticados verem seu próprio perfil
CREATE POLICY "users_select_own_profile" ON users
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Política para usuários autenticados atualizarem seu próprio perfil
CREATE POLICY "users_update_own_profile" ON users
    FOR UPDATE
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- Política para administradores terem acesso completo
-- Usando verificação direta por email para evitar recursão
CREATE POLICY "admin_full_access_by_email" ON users
    FOR ALL
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@lamusicweek.com',
            'hugo@latecnology.com.br',
            'admin@admin.com'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            'admin@lamusicweek.com',
            'hugo@latecnology.com.br',
            'admin@admin.com'
        )
    );

-- 4. Garantir que administradores possam ver workshops/eventos

-- Limpar políticas existentes de workshops
DROP POLICY IF EXISTS "workshops_public_select" ON workshops;
DROP POLICY IF EXISTS "workshops_admin_all" ON workshops;
DROP POLICY IF EXISTS "workshops_unit_based" ON workshops;

-- Política para todos verem workshops (público)
CREATE POLICY "workshops_public_read" ON workshops
    FOR SELECT
    USING (true);

-- Política para administradores gerenciarem workshops
CREATE POLICY "workshops_admin_manage" ON workshops
    FOR ALL
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@lamusicweek.com',
            'hugo@latecnology.com.br',
            'admin@admin.com'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            'admin@lamusicweek.com',
            'hugo@latecnology.com.br',
            'admin@admin.com'
        )
    );

-- Política para usuários autenticados se inscreverem
CREATE POLICY "workshops_authenticated_enroll" ON workshops
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 5. Garantir políticas adequadas para eventos

-- Limpar políticas existentes de eventos
DROP POLICY IF EXISTS "eventos_public_select" ON eventos;
DROP POLICY IF EXISTS "eventos_admin_all" ON eventos;

-- Política para todos verem eventos
CREATE POLICY "eventos_public_read" ON eventos
    FOR SELECT
    USING (true);

-- Política para administradores gerenciarem eventos
CREATE POLICY "eventos_admin_manage" ON eventos
    FOR ALL
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@lamusicweek.com',
            'hugo@latecnology.com.br',
            'admin@admin.com'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            'admin@lamusicweek.com',
            'hugo@latecnology.com.br',
            'admin@admin.com'
        )
    );

-- 6. Garantir permissões básicas para as roles
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON users TO service_role;

GRANT SELECT ON workshops TO anon;
GRANT ALL PRIVILEGES ON workshops TO authenticated;
GRANT ALL PRIVILEGES ON workshops TO service_role;

GRANT SELECT ON eventos TO anon;
GRANT ALL PRIVILEGES ON eventos TO authenticated;
GRANT ALL PRIVILEGES ON eventos TO service_role;

-- Comentários explicativos
COMMENT ON TABLE users IS 'Tabela de usuários com RLS corrigido - sem recursão infinita';
COMMENT ON TABLE workshops IS 'Tabela de workshops com acesso público para visualização e restrito para modificações';
COMMENT ON TABLE eventos IS 'Tabela de eventos com acesso público para visualização e restrito para modificações';