-- Corrigir políticas RLS da tabela users para permitir cadastro
-- O problema é que o cliente anônimo não consegue fazer INSERT/UPDATE na tabela users

-- Primeiro, vamos verificar as políticas existentes e removê-las se necessário
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.users;

-- Política para permitir que usuários anônimos insiram seus próprios perfis durante o cadastro
-- Isso é necessário porque durante o cadastro, o usuário ainda não está autenticado
CREATE POLICY "Allow anonymous insert during signup" ON public.users
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Política para permitir que usuários autenticados vejam apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Política para permitir que usuários autenticados atualizem apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários autenticados insiram seu próprio perfil
-- (caso não tenha sido criado durante o cadastro)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política para permitir que administradores vejam todos os perfis
CREATE POLICY "Admins can view all profiles" ON public.users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Política para permitir que administradores atualizem todos os perfis
CREATE POLICY "Admins can update all profiles" ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Política para permitir que administradores deletem perfis
CREATE POLICY "Admins can delete profiles" ON public.users
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Garantir que as permissões básicas estejam configuradas
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.users TO service_role;

-- Verificar se RLS está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;