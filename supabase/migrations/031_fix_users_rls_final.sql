-- Migração para corrigir políticas RLS da tabela users
-- Permite acesso completo aos próprios dados e acesso de admin
-- Data: 2025-01-04

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "users_insert_authenticated" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_delete_own" ON users;
DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;

-- Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários podem ver seus próprios dados
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para SELECT: admins podem ver todos os dados
CREATE POLICY "users_select_admin" ON users
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.user_id = auth.uid() 
    AND u.user_type = 'admin'
  ));

-- Política para INSERT: usuários autenticados podem criar perfil
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar seus próprios dados
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: admins podem atualizar qualquer usuário
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.user_id = auth.uid() 
    AND u.user_type = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.user_id = auth.uid() 
    AND u.user_type = 'admin'
  ));

-- Política para DELETE: admins podem deletar usuários
CREATE POLICY "users_delete_admin" ON users
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.user_id = auth.uid() 
    AND u.user_type = 'admin'
  ));

-- Garantir permissões para roles anon e authenticated
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Comentários das políticas
COMMENT ON POLICY "users_select_own" ON users IS 'Usuários podem ver seus próprios dados';
COMMENT ON POLICY "users_select_admin" ON users IS 'Admins podem ver todos os usuários';
COMMENT ON POLICY "users_insert_own" ON users IS 'Usuários podem criar seu próprio perfil';
COMMENT ON POLICY "users_update_own" ON users IS 'Usuários podem atualizar seus próprios dados';
COMMENT ON POLICY "users_update_admin" ON users IS 'Admins podem atualizar qualquer usuário';
COMMENT ON POLICY "users_delete_admin" ON users IS 'Admins podem deletar usuários';

-- Comentário da tabela
COMMENT ON TABLE users IS 'Tabela de usuários com RLS configurado corretamente';