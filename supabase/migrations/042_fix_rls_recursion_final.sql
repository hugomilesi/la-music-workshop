-- Migração para corrigir recursão infinita nas políticas RLS
-- Remove todas as políticas problemáticas e cria políticas simples
-- Data: 2025-01-06

BEGIN;

-- 1. Remover TODAS as políticas existentes da tabela users
DROP POLICY IF EXISTS "basic_users_insert" ON users;
DROP POLICY IF EXISTS "basic_users_select" ON users;
DROP POLICY IF EXISTS "basic_users_update" ON users;
DROP POLICY IF EXISTS "basic_users_delete" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "admin_users_policy" ON users;
DROP POLICY IF EXISTS "user_own_data_policy" ON users;
DROP POLICY IF EXISTS "admin_full_access" ON users;
DROP POLICY IF EXISTS "user_self_access" ON users;
DROP POLICY IF EXISTS "anon_insert_users" ON users;
DROP POLICY IF EXISTS "authenticated_select_own" ON users;
DROP POLICY IF EXISTS "authenticated_update_own" ON users;
DROP POLICY IF EXISTS "admin_delete_users" ON users;

-- 2. Remover políticas de workshops que dependem da função
DROP POLICY IF EXISTS "basic_workshops_select" ON workshops;
DROP POLICY IF EXISTS "basic_workshops_manage" ON workshops;
DROP POLICY IF EXISTS "workshops_select_policy" ON workshops;
DROP POLICY IF EXISTS "workshops_admin_policy" ON workshops;

-- 3. Remover funções problemáticas
DROP FUNCTION IF EXISTS check_admin_email() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS check_user_admin() CASCADE;

-- 4. Criar função simples para verificar admin SEM recursão
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email IN (
            'admin@lamusicweek.com',
            'hugo@latecnology.com.br', 
            'admin@admin.com'
        )
    );
$$;

-- 5. Criar políticas RLS simples SEM recursão para USERS

-- Política para INSERT: permite anônimos criarem usuários (registro)
CREATE POLICY "allow_anon_insert_users" ON users
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Política para SELECT: usuários veem seus próprios dados + admins veem tudo
CREATE POLICY "allow_users_select_own" ON users
    FOR SELECT
    TO authenticated
    USING (
        auth.uid()::text = user_id::text 
        OR is_admin_user()
    );

-- Política para UPDATE: usuários editam seus próprios dados + admins editam tudo
CREATE POLICY "allow_users_update_own" ON users
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid()::text = user_id::text 
        OR is_admin_user()
    )
    WITH CHECK (
        auth.uid()::text = user_id::text 
        OR is_admin_user()
    );

-- Política para DELETE: apenas admins podem deletar
CREATE POLICY "allow_admin_delete_users" ON users
    FOR DELETE
    TO authenticated
    USING (is_admin_user());

-- 6. Criar políticas para WORKSHOPS

-- Política para SELECT: todos podem ver workshops
CREATE POLICY "allow_all_select_workshops" ON workshops
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Política para INSERT/UPDATE/DELETE: apenas admins
CREATE POLICY "allow_admin_manage_workshops" ON workshops
    FOR ALL
    TO authenticated
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- 7. Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops FORCE ROW LEVEL SECURITY;

-- 8. Dar permissões básicas aos roles
GRANT SELECT, INSERT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT SELECT ON workshops TO anon;
GRANT ALL PRIVILEGES ON workshops TO authenticated;

COMMIT;