-- Migração para corrigir política de inserção da tabela users
-- Permite que usuários autenticados criem seus próprios perfis
-- Data: 2025-01-04

-- Remover política de inserção existente
DROP POLICY IF EXISTS "users_insert_simple" ON users;

-- Criar nova política de inserção mais permissiva
CREATE POLICY "users_insert_authenticated" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Permitir inserção para usuários autenticados
    -- O user_id deve corresponder ao auth.uid() do usuário logado
    user_id = auth.uid()
  );

-- Garantir que a role authenticated tem permissão de INSERT
GRANT INSERT ON users TO authenticated;

-- Comentário da migração
COMMENT ON POLICY "users_insert_authenticated" ON users IS 'Permite que usuários autenticados criem seus próprios perfis';