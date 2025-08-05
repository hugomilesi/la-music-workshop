-- Corrigir permissões da tabela users

-- Conceder permissões SELECT para role anon
GRANT SELECT ON users TO anon;

-- Conceder todas as permissões para role authenticated
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON users;

-- Criar políticas RLS simples
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

CREATE POLICY "users_insert_authenticated" ON users
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

CREATE POLICY "users_delete_own" ON users
    FOR DELETE
    USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);