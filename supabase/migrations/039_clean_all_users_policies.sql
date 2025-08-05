-- Migração para limpar TODAS as políticas RLS da tabela users
-- Remove todas as políticas existentes para evitar conflitos
-- Data: 2025-01-06

-- 1. Remover TODAS as políticas existentes da tabela users
DROP POLICY IF EXISTS "allow_user_registration" ON users;
DROP POLICY IF EXISTS "users_select_own_profile" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "admin_full_access_by_email" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_delete_own" ON users;
DROP POLICY IF EXISTS "admin_full_access" ON users;
DROP POLICY IF EXISTS "anon_insert_users" ON users;
DROP POLICY IF EXISTS "auth_select_own_users" ON users;
DROP POLICY IF EXISTS "auth_update_own_users" ON users;
DROP POLICY IF EXISTS "admin_select_all_users" ON users;
DROP POLICY IF EXISTS "admin_update_all_users" ON users;
DROP POLICY IF EXISTS "admin_delete_users" ON users;
DROP POLICY IF EXISTS "users_insert_registration" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;

-- 2. Remover políticas de workshops também
DROP POLICY IF EXISTS "workshops_public_read" ON workshops;
DROP POLICY IF EXISTS "workshops_admin_manage" ON workshops;
DROP POLICY IF EXISTS "workshops_authenticated_enroll" ON workshops;
DROP POLICY IF EXISTS "workshops_select_all" ON workshops;
DROP POLICY IF EXISTS "workshops_admin_full" ON workshops;
DROP POLICY IF EXISTS "workshops_public_select" ON workshops;
DROP POLICY IF EXISTS "workshops_admin_all" ON workshops;
DROP POLICY IF EXISTS "workshops_unit_based" ON workshops;

-- 3. Comentário
COMMENT ON TABLE users IS 'Tabela users com todas as políticas RLS removidas - pronta para novas políticas';
COMMENT ON TABLE workshops IS 'Tabela workshops com todas as políticas RLS removidas - pronta para novas políticas';