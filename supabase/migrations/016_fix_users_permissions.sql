-- Corrigir permissões da tabela users para permitir que administradores vejam todos os usuários

-- Verificar permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'users' AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Garantir que a role authenticated tenha acesso completo à tabela users
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON users TO anon;

-- Verificar se há políticas RLS que podem estar bloqueando o acesso
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- Remover políticas RLS restritivas se existirem e criar uma política mais permissiva
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;

-- Criar política que permite que usuários autenticados vejam todos os usuários
-- Isso é necessário para o dashboard administrativo funcionar
CREATE POLICY "Authenticated users can view all users" ON users
    FOR SELECT
    TO authenticated
    USING (true);

-- Criar política que permite que usuários autenticados atualizem seus próprios dados
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Criar política que permite que administradores façam qualquer operação
CREATE POLICY "Admin can manage all users" ON users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Verificar as novas permissões
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'users' AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Verificar as novas políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';