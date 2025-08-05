-- Consulta para verificar as políticas RLS da tabela users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Verificar se há políticas que referenciam a própria tabela users
SELECT 
    policyname,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
    AND schemaname = 'public'
    AND (qual LIKE '%users%' OR with_check LIKE '%users%');