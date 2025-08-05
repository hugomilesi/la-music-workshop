-- Migração para corrigir recursão infinita na política admin_full_access
-- Remove a política problemática e simplifica o acesso de administradores

-- Remover a política admin_full_access que causa recursão
DROP POLICY IF EXISTS "admin_full_access" ON users;

-- Criar função para verificar se usuário é admin usando auth.users
-- Esta função evita recursão ao consultar auth.users em vez de public.users
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual tem role de admin no auth.users
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            (raw_user_meta_data ->> 'user_type')::text = 'admin'
            OR (raw_app_meta_data ->> 'user_type')::text = 'admin'
            OR email = 'admin@lamusicweek.com'
        )
    );
END;
$$;

-- Criar política para administradores usando a função personalizada
CREATE POLICY "admin_access_via_function" ON users
    FOR ALL
    USING (is_admin_user());

-- Política adicional para permitir que usuários com email específico sejam admin
CREATE POLICY "admin_by_email" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM auth.users au 
            WHERE au.id = auth.uid() 
            AND au.email = 'admin@lamusicweek.com'
        )
    );

-- Comentário explicativo
COMMENT ON FUNCTION is_admin_user() IS 'Função para verificar se usuário é admin consultando auth.users para evitar recursão';
COMMENT ON POLICY "admin_access_via_function" ON users IS 'Política para administradores usando função sem recursão';
COMMENT ON POLICY "admin_by_email" ON users IS 'Política para admin baseada em email específico';