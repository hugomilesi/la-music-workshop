-- Migração para corrigir políticas RLS da tabela users
-- Permitir que admins deletem usuários

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_admin_delete_policy" ON users;
DROP POLICY IF EXISTS "Admins can delete any user" ON users;
DROP POLICY IF EXISTS "Users can delete themselves" ON users;

-- Criar política para permitir que admins deletem qualquer usuário
CREATE POLICY "admin_can_delete_users" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.user_id = auth.uid() 
      AND admin_user.user_type = 'admin'
    )
  );

-- Criar política para permitir que usuários deletem a si mesmos
CREATE POLICY "users_can_delete_themselves" ON users
  FOR DELETE
  USING (user_id = auth.uid());

-- Verificar se as políticas de SELECT, INSERT e UPDATE existem
-- Se não existirem, criar políticas básicas

-- Política de SELECT para admins verem todos os usuários
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'admin_can_select_all_users'
  ) THEN
    EXECUTE 'CREATE POLICY "admin_can_select_all_users" ON users
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users admin_user 
          WHERE admin_user.user_id = auth.uid() 
          AND admin_user.user_type = ''admin''
        )
      )';
  END IF;
END $$;

-- Política de SELECT para usuários verem apenas seus próprios dados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'users_can_select_own_data'
  ) THEN
    EXECUTE 'CREATE POLICY "users_can_select_own_data" ON users
      FOR SELECT
      USING (user_id = auth.uid())';
  END IF;
END $$;

-- Política de UPDATE para admins atualizarem qualquer usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'admin_can_update_all_users'
  ) THEN
    EXECUTE 'CREATE POLICY "admin_can_update_all_users" ON users
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM users admin_user 
          WHERE admin_user.user_id = auth.uid() 
          AND admin_user.user_type = ''admin''
        )
      )';
  END IF;
END $$;

-- Política de UPDATE para usuários atualizarem apenas seus próprios dados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'users_can_update_own_data'
  ) THEN
    EXECUTE 'CREATE POLICY "users_can_update_own_data" ON users
      FOR UPDATE
      USING (user_id = auth.uid())';
  END IF;
END $$;

-- Política de INSERT para permitir criação de novos usuários
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'allow_user_creation'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_user_creation" ON users
      FOR INSERT
      WITH CHECK (true)';
  END IF;
END $$;

-- Garantir que as permissões básicas estejam configuradas
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Comentário para documentar a migração
COMMENT ON TABLE users IS 'Tabela de usuários com políticas RLS corrigidas para permitir admin deletar usuários';