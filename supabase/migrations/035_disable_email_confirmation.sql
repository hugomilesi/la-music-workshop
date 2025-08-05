-- Verificar usuários pendentes de confirmação e criar trigger para auto-criação de perfil

-- 1. Verificar se há usuários pendentes de confirmação
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM 
    auth.users 
WHERE 
    email_confirmed_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2. Confirmar todos os usuários existentes que estão pendentes
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. Criar função para auto-criação de perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_unit_id UUID;
BEGIN
    -- Buscar uma unidade padrão
    SELECT id INTO default_unit_id
    FROM public.unidades
    LIMIT 1;
    
    -- Criar perfil automaticamente
    INSERT INTO public.users (
        user_id,
        email,
        nome_completo,
        user_type,
        unit_id,
        email_confirmed
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
        default_unit_id,
        NEW.email_confirmed_at IS NOT NULL
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha o processo de criação do usuário
        RAISE WARNING 'Erro ao criar perfil automaticamente: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para executar a função
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Comentário sobre a solução
-- Este trigger criará automaticamente um perfil na tabela public.users
-- sempre que um usuário for criado na tabela auth.users