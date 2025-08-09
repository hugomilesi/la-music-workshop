-- Migração para corrigir recursão infinita na política users_select_policy

-- Remove a política problemática que causa recursão infinita
DROP POLICY IF EXISTS users_select_policy ON users;

-- Cria nova política sem recursão - verifica admin pelos metadados do auth.users
CREATE POLICY users_select_policy ON users
  FOR SELECT
  TO public
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 
      FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND (au.raw_user_meta_data ->> 'user_type') = 'admin'
    )
  );

-- Comentário explicativo:
-- Esta política permite que:
-- 1. Usuários vejam seus próprios dados (user_id = auth.uid())
-- 2. Administradores vejam todos os dados (verificando user_type nos metadados do auth.users)
-- Evita recursão ao não consultar a própria tabela users para verificar se é admin