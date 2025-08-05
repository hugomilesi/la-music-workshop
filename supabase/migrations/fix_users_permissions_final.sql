-- Corrigir definitivamente as permissões da tabela users
-- O problema é que o cliente anônimo não consegue fazer operações na tabela users

-- Primeiro, remover todas as políticas existentes
DROP POLICY IF EXISTS "Allow anonymous insert during signup" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.users;

-- Desabilitar RLS temporariamente para garantir que as permissões sejam aplicadas
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Garantir permissões básicas primeiro
GRANT ALL PRIVILEGES ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.users TO service_role;

-- Reabilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Criar políticas mais permissivas para resolver o problema de cadastro

-- Permitir que qualquer um (anon) insira dados na tabela users
-- Isso é necessário durante o processo de cadastro
CREATE POLICY "Allow insert for everyone" ON public.users
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Permitir que qualquer um (anon) atualize dados na tabela users
-- Isso é necessário durante o processo de cadastro quando o usuário já existe
CREATE POLICY "Allow update for everyone" ON public.users
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- Permitir que usuários autenticados vejam apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Permitir que usuários anônimos vejam dados básicos (necessário para verificações)
CREATE POLICY "Allow select for anon" ON public.users
    FOR SELECT
    TO anon
    USING (true);

-- Política especial para administradores
CREATE POLICY "Admins can do everything" ON public.users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Verificar se as permissões foram aplicadas
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;