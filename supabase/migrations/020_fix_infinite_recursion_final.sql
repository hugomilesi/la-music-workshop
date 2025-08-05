-- Migração para corrigir recursão infinita nas políticas RLS da tabela users
-- Remove todas as políticas existentes e cria políticas simples sem recursão
-- Data: 2024-01-15

-- Desabilitar RLS temporariamente para limpeza
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes da tabela users
DROP POLICY IF EXISTS "Usuários veem apenas da mesma unidade" ON users;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON users;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON users;
DROP POLICY IF EXISTS "admin_full_access" ON users;
DROP POLICY IF EXISTS "admin_access_via_function" ON users;
DROP POLICY IF EXISTS "admin_by_email" ON users;
DROP POLICY IF EXISTS "users_select_own_profile" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "authenticated_users_select_own" ON users;
DROP POLICY IF EXISTS "authenticated_users_update_own" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "simple_select_own" ON users;
DROP POLICY IF EXISTS "simple_update_own" ON users;
DROP POLICY IF EXISTS "simple_insert_own" ON users;
DROP POLICY IF EXISTS "simple_admin_access" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "admin_policy" ON users;

-- Remover funções que podem estar causando problemas
DROP FUNCTION IF EXISTS is_admin_user();
DROP FUNCTION IF EXISTS check_admin_access();

-- Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários autenticados podem ver todos os perfis (necessário para admin)
CREATE POLICY "authenticated_can_select_all" ON users
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para UPDATE: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "users_can_update_own" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para INSERT: usuários podem inserir apenas com seu próprio user_id
CREATE POLICY "users_can_insert_own" ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: apenas admins podem deletar (baseado no email)
CREATE POLICY "admin_can_delete" ON users
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM auth.users au 
            WHERE au.id = auth.uid() 
            AND au.email IN ('admin@lamusicweek.com', 'hugo@latecnology.com.br')
        )
    );

-- Garantir permissões para os roles
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Comentários explicativos
COMMENT ON POLICY "authenticated_can_select_all" ON users IS 'Usuários autenticados podem ver todos os perfis - necessário para funcionalidade admin';
COMMENT ON POLICY "users_can_update_own" ON users IS 'Usuários podem atualizar apenas seu próprio perfil';
COMMENT ON POLICY "users_can_insert_own" ON users IS 'Usuários podem inserir apenas com seu próprio user_id';
COMMENT ON POLICY "admin_can_delete" ON users IS 'Apenas admins podem deletar usuários, baseado no email';

COMMENT ON TABLE users IS 'Tabela de usuários com políticas RLS corrigidas - sem recursão infinita';