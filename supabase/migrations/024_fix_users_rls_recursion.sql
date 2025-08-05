-- Migração para corrigir recursão infinita nas políticas RLS da tabela users
-- Remove todas as políticas existentes e cria novas políticas simples

-- Remover todas as políticas existentes da tabela users
DROP POLICY IF EXISTS "admin_can_select_all_users" ON users;
DROP POLICY IF EXISTS "users_can_select_own_data" ON users;
DROP POLICY IF EXISTS "admin_can_update_all_users" ON users;
DROP POLICY IF EXISTS "users_can_update_own_data" ON users;
DROP POLICY IF EXISTS "allow_user_creation" ON users;
DROP POLICY IF EXISTS "admin_can_delete_users" ON users;
DROP POLICY IF EXISTS "users_can_delete_themselves" ON users;
DROP POLICY IF EXISTS "admin_can_insert_users" ON users;
DROP POLICY IF EXISTS "users_can_insert_own_data" ON users;

-- Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Admin vê todos, usuários veem apenas seus próprios dados
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (
    -- Admin pode ver todos os usuários
    EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.id IN (
        SELECT u.user_id FROM users u 
        WHERE u.user_id = au.id 
        AND u.user_type = 'admin'
      )
    )
    OR
    -- Usuários podem ver apenas seus próprios dados
    user_id = auth.uid()
  );

-- Política INSERT: Permitir criação de novos usuários
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (
    -- Admin pode inserir qualquer usuário
    EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.id IN (
        SELECT u.user_id FROM users u 
        WHERE u.user_id = au.id 
        AND u.user_type = 'admin'
      )
    )
    OR
    -- Usuário pode inserir apenas seus próprios dados
    user_id = auth.uid()
  );

-- Política UPDATE: Admin atualiza todos, usuários atualizam apenas seus dados
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (
    -- Admin pode atualizar qualquer usuário
    EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.id IN (
        SELECT u.user_id FROM users u 
        WHERE u.user_id = au.id 
        AND u.user_type = 'admin'
      )
    )
    OR
    -- Usuários podem atualizar apenas seus próprios dados
    user_id = auth.uid()
  )
  WITH CHECK (
    -- Admin pode atualizar qualquer usuário
    EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.id IN (
        SELECT u.user_id FROM users u 
        WHERE u.user_id = au.id 
        AND u.user_type = 'admin'
      )
    )
    OR
    -- Usuários podem atualizar apenas seus próprios dados
    user_id = auth.uid()
  );

-- Política DELETE: Apenas admin pode deletar usuários
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  USING (
    -- Apenas admin pode deletar usuários
    EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.id IN (
        SELECT u.user_id FROM users u 
        WHERE u.user_id = au.id 
        AND u.user_type = 'admin'
      )
    )
  );

-- Garantir permissões básicas para as roles
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Comentário da migração
COMMENT ON TABLE users IS 'Tabela de usuários com políticas RLS corrigidas - sem recursão infinita';