-- Migração para corrigir permissões da tabela users
-- Data: 2025-01-04
-- Descrição: Corrige políticas RLS e permissões para permitir inserção de novos usuários

-- 1. Remover todas as políticas existentes da tabela users
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "allow_select_own_profile" ON users;
DROP POLICY IF EXISTS "allow_update_own_profile" ON users;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON users;
DROP POLICY IF EXISTS "allow_admin_delete" ON users;

-- 2. Garantir que RLS está habilitado e forçado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- 3. Garantir permissões básicas para os roles
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT ALL PRIVILEGES ON users TO service_role;

-- 4. Criar políticas RLS simples e funcionais

-- Política para SELECT: usuários autenticados podem ver todos os perfis
CREATE POLICY "users_select_policy" ON users
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para INSERT: usuários autenticados podem inserir apenas com seu próprio user_id
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: apenas service_role pode deletar
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE
    TO service_role
    USING (true);

-- 5. Política especial para permitir inserção durante o registro (role anon)
CREATE POLICY "users_insert_anon_policy" ON users
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 6. Verificar se as permissões foram aplicadas corretamente
DO $$
BEGIN
    -- Log das permissões aplicadas
    RAISE NOTICE 'Permissões da tabela users:';
    RAISE NOTICE 'RLS habilitado: %', (SELECT rowsecurity FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public');
END $$;

-- 7. Comentário na tabela
COMMENT ON TABLE users IS 'Tabela de usuários com políticas RLS corrigidas - permissões para anon e authenticated';