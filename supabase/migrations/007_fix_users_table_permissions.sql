-- Migração para corrigir permissões da tabela users
-- Resolve o erro 42501 (permission denied for table users)
-- Data: 2024-01-15

-- Conceder permissões básicas para o role anon (usuários não autenticados)
-- Permite apenas leitura limitada para verificações de login
GRANT SELECT ON public.users TO anon;

-- Conceder permissões completas para o role authenticated (usuários autenticados)
-- Permite operações CRUD para usuários logados
GRANT ALL PRIVILEGES ON public.users TO authenticated;

-- Verificar se as permissões foram aplicadas corretamente
-- Esta consulta pode ser usada para debug:
-- SELECT grantee, table_name, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_schema = 'public' 
-- AND table_name = 'users'
-- AND grantee IN ('anon', 'authenticated') 
-- ORDER BY grantee, privilege_type;

-- Comentário explicativo
COMMENT ON TABLE public.users IS 'Tabela de usuários com permissões corrigidas para anon e authenticated roles';