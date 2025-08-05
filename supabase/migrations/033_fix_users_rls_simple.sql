-- Migração simplificada para corrigir RLS da tabela users
-- Permitir inserção de novos usuários durante cadastro

-- Desabilitar RLS temporariamente para limpeza
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Allow anon to insert new users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to view own data" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to update own data" ON users;
DROP POLICY IF EXISTS "Allow admins to view all users" ON users;
DROP POLICY IF EXISTS "Allow admins to update all users" ON users;
DROP POLICY IF EXISTS "Allow admins to delete users" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "Enable insert for anon users" ON users;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON users;

-- Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Política MUITO SIMPLES para inserção (anon)
-- Permitir que qualquer um insira durante o cadastro
CREATE POLICY "anon_insert_users" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política para leitura (authenticated)
-- Usuários podem ver seus próprios dados
CREATE POLICY "auth_select_own_users" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para atualização (authenticated)
-- Usuários podem atualizar seus próprios dados
CREATE POLICY "auth_update_own_users" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para admins verem tudo
CREATE POLICY "admin_select_all_users" ON users
  FOR SELECT
  TO authenticated
  USING (
    user_type = 'admin'
  );

-- Política para admins atualizarem tudo
CREATE POLICY "admin_update_all_users" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.user_id = auth.uid() 
      AND admin_user.user_type = 'admin'
    )
  );

-- Política para admins deletarem
CREATE POLICY "admin_delete_users" ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.user_id = auth.uid() 
      AND admin_user.user_type = 'admin'
    )
  );

-- Garantir permissões básicas
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;

-- Comentário
COMMENT ON TABLE users IS 'Tabela de usuários com RLS simplificado para permitir cadastro';