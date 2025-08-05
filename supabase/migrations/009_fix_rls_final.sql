-- Migração final para corrigir recursão infinita nas políticas RLS
-- Remove todas as políticas problemáticas e cria políticas simples e eficazes
-- Data: 2024-01-15

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

-- Remover função que pode estar causando problemas
DROP FUNCTION IF EXISTS is_admin_user();

-- Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política SIMPLES para SELECT: usuários veem apenas seu próprio perfil
CREATE POLICY "simple_select_own" ON users
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política SIMPLES para UPDATE: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "simple_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política SIMPLES para INSERT: usuários podem inserir apenas com seu próprio user_id
CREATE POLICY "simple_insert_own" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política SIMPLES para admin baseada APENAS no email (sem consulta à tabela users)
CREATE POLICY "simple_admin_access" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM auth.users au 
            WHERE au.id = auth.uid() 
            AND au.email IN ('admin@lamusicweek.com', 'hugo@latecnology.com.br')
        )
    );

-- Comentários explicativos
COMMENT ON POLICY "simple_select_own" ON users IS 'Política simples: usuários veem apenas seu próprio perfil';
COMMENT ON POLICY "simple_update_own" ON users IS 'Política simples: usuários atualizam apenas seu próprio perfil';
COMMENT ON POLICY "simple_insert_own" ON users IS 'Política simples: usuários inserem apenas com seu próprio user_id';
COMMENT ON POLICY "simple_admin_access" ON users IS 'Política simples: admin baseado apenas no email, sem recursão';

-- Verificar se as políticas foram criadas corretamente
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'users';