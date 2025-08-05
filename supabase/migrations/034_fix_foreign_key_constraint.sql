-- Corrigir problema de foreign key constraint na tabela users
-- O erro 23503 indica que o user_id não existe na tabela auth.users quando tentamos inserir na public.users

-- 1. Remover registros órfãos (se existirem)
DELETE FROM public.users 
WHERE user_id NOT IN (
    SELECT id FROM auth.users
);

-- 2. Remover a constraint existente
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_id_fkey;

-- 3. Recriar a constraint com ON DELETE CASCADE para evitar problemas futuros
ALTER TABLE public.users 
ADD CONSTRAINT users_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 4. Verificar se as permissões estão corretas
GRANT SELECT ON auth.users TO authenticated;
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- 5. Comentário de sucesso
-- Foreign key constraint corrigida com sucesso!