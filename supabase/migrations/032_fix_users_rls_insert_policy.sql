-- Migração para corrigir políticas RLS da tabela users
-- Permitir inserção de novos usuários durante o cadastro

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "Enable insert for anon users" ON users;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON users;
DROP POLICY IF EXISTS "Allow anon to insert users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to view their own data" ON users;
DROP POLICY IF EXISTS "Allow users to update their own data" ON users;
DROP POLICY IF EXISTS "Allow admins to view all users" ON users;
DROP POLICY IF EXISTS "Allow admins to update all users" ON users;
DROP POLICY IF EXISTS "Allow admins to delete users" ON users;

-- Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Política para permitir inserção de novos usuários (anon)
-- Durante o cadastro, usuários anônimos precisam poder inserir
CREATE POLICY "Allow anon to insert new users" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política para permitir que usuários autenticados vejam seus próprios dados
CREATE POLICY "Allow authenticated users to view own data" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para permitir que usuários autenticados atualizem seus próprios dados
CREATE POLICY "Allow authenticated users to update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para administradores verem todos os usuários
CREATE POLICY "Allow admins to view all users" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.user_id = auth.uid() 
      AND u.user_type = 'admin'
    )
  );

-- Política para administradores atualizarem todos os usuários
CREATE POLICY "Allow admins to update all users" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.user_id = auth.uid() 
      AND u.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.user_id = auth.uid() 
      AND u.user_type = 'admin'
    )
  );

-- Política para administradores deletarem usuários
CREATE POLICY "Allow admins to delete users" ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.user_id = auth.uid() 
      AND u.user_type = 'admin'
    )
  );

-- Garantir permissões básicas para as roles
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;

-- Comentário na tabela
COMMENT ON TABLE users IS 'Tabela de usuários com RLS configurado para permitir cadastro de novos usuários';