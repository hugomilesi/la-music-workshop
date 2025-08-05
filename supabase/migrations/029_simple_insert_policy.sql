-- Migração para criar política de inserção mais simples
-- Permite inserção para qualquer usuário autenticado
-- Data: 2025-01-04

-- Remover política de inserção existente
DROP POLICY IF EXISTS "users_insert_own" ON users;

-- Criar política de inserção mais permissiva
CREATE POLICY "users_insert_authenticated" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Permite inserção para qualquer usuário autenticado

-- Comentário da migração
COMMENT ON POLICY "users_insert_authenticated" ON users IS 'Permite inserção para qualquer usuário autenticado';