-- Migração para reabilitar RLS com políticas corretas
-- Permite inserção e seleção de dados pelos usuários autenticados
-- Data: 2025-01-04

-- Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON users';
    END LOOP;
END $$;

-- Política SELECT: Usuários podem ver seus próprios dados
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política INSERT: Usuários podem inserir seus próprios dados
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política UPDATE: Usuários podem atualizar seus próprios dados
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Política DELETE: Usuários podem deletar seus próprios dados
CREATE POLICY "users_delete_own" ON users
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Políticas para administradores (acesso total)
CREATE POLICY "admin_full_access" ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.email IN ('admin@latecnology.com', 'hugo@latecnology.com')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.email IN ('admin@latecnology.com', 'hugo@latecnology.com')
    )
  );

-- Garantir permissões básicas
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Comentário da migração
COMMENT ON TABLE users IS 'RLS habilitado com políticas corretas para usuários e administradores';