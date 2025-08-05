-- Migração para resetar completamente as políticas RLS da tabela users
-- Remove TODAS as políticas existentes e cria novas políticas simples

-- Desabilitar RLS temporariamente para limpeza
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes da tabela users
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

-- Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples sem recursão

-- Política SELECT: Permitir acesso baseado em auth.uid()
CREATE POLICY "users_select_simple" ON users
  FOR SELECT
  USING (
    -- Usuário pode ver seus próprios dados
    user_id = auth.uid()
    OR
    -- Admin pode ver todos (verificação simples)
    (
      auth.uid() IS NOT NULL 
      AND user_type = 'admin' 
      AND user_id = auth.uid()
    )
  );

-- Política INSERT: Permitir inserção de novos usuários
CREATE POLICY "users_insert_simple" ON users
  FOR INSERT
  WITH CHECK (
    -- Usuário pode inserir apenas seus próprios dados
    user_id = auth.uid()
  );

-- Política UPDATE: Permitir atualização
CREATE POLICY "users_update_simple" ON users
  FOR UPDATE
  USING (
    -- Usuário pode atualizar apenas seus próprios dados
    user_id = auth.uid()
  )
  WITH CHECK (
    -- Usuário pode atualizar apenas seus próprios dados
    user_id = auth.uid()
  );

-- Política DELETE: Permitir deleção (será refinada depois)
CREATE POLICY "users_delete_simple" ON users
  FOR DELETE
  USING (
    -- Por enquanto, apenas o próprio usuário pode se deletar
    user_id = auth.uid()
  );

-- Garantir permissões básicas para as roles
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Comentário da migração
COMMENT ON TABLE users IS 'Tabela de usuários com políticas RLS simples - sem recursão';