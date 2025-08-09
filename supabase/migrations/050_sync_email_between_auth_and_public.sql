-- Migração para sincronizar emails entre auth.users e public.users
-- Garante que mudanças de email sejam refletidas em ambas as tabelas

-- 1. Criar função para sincronizar email do auth.users para public.users
CREATE OR REPLACE FUNCTION public.sync_auth_email_to_public()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar email na tabela public.users quando o email for alterado no auth.users
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        UPDATE public.users 
        SET 
            email = NEW.email,
            email_confirmed = true, -- Manter sempre confirmado
            updated_at = NOW()
        WHERE user_id = NEW.id;
        
        -- Log da sincronização
        RAISE NOTICE 'Email sincronizado de auth.users para public.users: % -> %', OLD.email, NEW.email;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha o processo
        RAISE WARNING 'Erro ao sincronizar email de auth.users para public.users: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger para sincronizar email quando alterado no auth.users
DROP TRIGGER IF EXISTS sync_auth_email_trigger ON auth.users;
CREATE TRIGGER sync_auth_email_trigger
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW 
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.sync_auth_email_to_public();

-- 3. Criar função para sincronizar email do public.users para auth.users
CREATE OR REPLACE FUNCTION public.sync_public_email_to_auth()
RETURNS TRIGGER AS $$
DECLARE
    auth_user_exists BOOLEAN;
BEGIN
    -- Verificar se o usuário existe no auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE id = NEW.user_id
    ) INTO auth_user_exists;
    
    -- Se o usuário existe no auth.users e o email foi alterado
    IF auth_user_exists AND OLD.email IS DISTINCT FROM NEW.email THEN
        -- Atualizar email no auth.users
        UPDATE auth.users 
        SET 
            email = NEW.email,
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- Log da sincronização
        RAISE NOTICE 'Email sincronizado de public.users para auth.users: % -> %', OLD.email, NEW.email;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha o processo
        RAISE WARNING 'Erro ao sincronizar email de public.users para auth.users: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para sincronizar email quando alterado no public.users
DROP TRIGGER IF EXISTS sync_public_email_trigger ON public.users;
CREATE TRIGGER sync_public_email_trigger
    AFTER UPDATE OF email ON public.users
    FOR EACH ROW 
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.sync_public_email_to_auth();

-- 5. Sincronizar emails existentes que possam estar dessincronizados
DO $$
DECLARE
    user_record RECORD;
    sync_count INTEGER := 0;
BEGIN
    -- Buscar usuários com emails diferentes entre auth.users e public.users
    FOR user_record IN
        SELECT 
            au.id,
            au.email as auth_email,
            pu.email as public_email
        FROM auth.users au
        JOIN public.users pu ON au.id = pu.user_id
        WHERE au.email != pu.email
    LOOP
        -- Usar o email do auth.users como fonte da verdade
        UPDATE public.users 
        SET 
            email = user_record.auth_email,
            email_confirmed = true,
            updated_at = NOW()
        WHERE user_id = user_record.id;
        
        sync_count := sync_count + 1;
        
        RAISE NOTICE 'Sincronizado email para usuário %: % -> %', 
            user_record.id, user_record.public_email, user_record.auth_email;
    END LOOP;
    
    RAISE NOTICE 'Total de emails sincronizados: %', sync_count;
END;
$$;

-- 6. Comentários sobre a sincronização
-- Esta migração garante que:
-- - Mudanças de email no auth.users são automaticamente refletidas no public.users
-- - Mudanças de email no public.users são automaticamente refletidas no auth.users
-- - Emails existentes dessincronizados são corrigidos
-- - O sistema mantém consistência entre as duas tabelas