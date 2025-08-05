-- Corrigir problemas com usuários admin e políticas RLS

-- 1. Limpar registros duplicados de admin
DELETE FROM users 
WHERE email = 'admin@lamusicweek.com' 
AND user_id != '34f21b19-e668-4e30-9c87-55a52a28272f';

-- 2. Garantir que existe apenas um admin válido
INSERT INTO users (
  user_id,
  email,
  nome_completo,
  telefone,
  data_nascimento,
  unit_id,
  user_type
) 
SELECT 
  '34f21b19-e668-4e30-9c87-55a52a28272f',
  'admin@lamusicweek.com',
  'Administrador',
  '11999999999',
  '1980-01-01',
  (SELECT id FROM unidades WHERE nome = 'Campo Grande' LIMIT 1),
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users 
  WHERE user_id = '34f21b19-e668-4e30-9c87-55a52a28272f'
);

-- 3. Remover políticas RLS existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;
DROP POLICY IF EXISTS "Admin can delete users" ON users;
DROP POLICY IF EXISTS "Admin can insert users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable delete for admin users" ON users;

-- 4. Criar políticas RLS simples e funcionais
-- Política para visualização
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (
    -- Usuários podem ver seu próprio perfil
    auth.uid() = user_id
    OR
    -- Admins podem ver todos os usuários
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.user_id = auth.uid() 
      AND admin_user.user_type = 'admin'
    )
  );

-- Política para inserção (apenas admins)
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.user_id = auth.uid() 
      AND admin_user.user_type = 'admin'
    )
    OR
    -- Permitir auto-inserção durante registro
    auth.uid() = user_id
  );

-- Política para atualização
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (
    -- Usuários podem atualizar seu próprio perfil
    auth.uid() = user_id
    OR
    -- Admins podem atualizar qualquer usuário
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.user_id = auth.uid() 
      AND admin_user.user_type = 'admin'
    )
  );

-- Política para exclusão (apenas admins)
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.user_id = auth.uid() 
      AND admin_user.user_type = 'admin'
    )
  );

-- 5. Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Conceder permissões básicas
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- 7. Limpar registros órfãos (sem email)
DELETE FROM users WHERE email IS NULL;

-- 8. Verificar e corrigir constraint de foreign key
-- Remover constraint problemática se existir
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_id_fkey;

-- Recriar constraint correta
ALTER TABLE users 
ADD CONSTRAINT users_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 9. Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE user_id = auth.uid() 
    AND user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Atualizar políticas para usar a função
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (
    auth.uid() = user_id OR is_admin()
  );

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (
    is_admin() OR auth.uid() = user_id
  );

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (
    auth.uid() = user_id OR is_admin()
  );

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  USING (
    is_admin()
  );