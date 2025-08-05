-- Migração para corrigir permissões do role anon
-- Resolve o erro "permission denied for table users" para anon key
-- Data: 2024-01-15

-- Garantir que o role anon tem permissões básicas na tabela users
GRANT SELECT ON public.users TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Verificar se RLS está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Criar política específica para anon role (leitura limitada)
DROP POLICY IF EXISTS "anon_can_read_basic_info" ON public.users;
CREATE POLICY "anon_can_read_basic_info" ON public.users
    FOR SELECT
    TO anon
    USING (true); -- Permite leitura básica para verificações de login

-- Garantir permissões em outras tabelas importantes
GRANT SELECT ON public.workshops TO anon;
GRANT SELECT ON public.unidades TO anon;
GRANT SELECT ON public.eventos TO anon;

-- Verificar permissões atuais
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
    AND table_name IN ('users', 'workshops', 'unidades', 'eventos')
ORDER BY table_name, grantee;

-- Comentário explicativo
COMMENT ON POLICY "anon_can_read_basic_info" ON public.users IS 'Permite que usuários não autenticados façam consultas básicas na tabela users';