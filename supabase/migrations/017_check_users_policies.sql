-- Verificar políticas RLS da tabela users
DO $$
BEGIN
    RAISE NOTICE 'Verificando políticas RLS da tabela users...';
END $$;

-- Verificar permissões da tabela users para roles anon e authenticated
SELECT 
    'Permissões da tabela users:' as info,
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND grantee IN ('anon', 'authenticated');

-- Verificar se existe o usuário admin
SELECT 
    'Usuário admin encontrado:' as info,
    email, 
    user_type 
FROM users 
WHERE email = 'admin@lamusicweek.com';