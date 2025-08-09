-- Migração para desabilitar completamente a confirmação de email
-- Os usuários poderão alterar seus emails sem necessidade de confirmação

-- 1. Confirmar todos os usuários existentes que ainda não foram confirmados
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Atualizar a tabela users para marcar todos como confirmados
UPDATE public.users 
SET email_confirmed = true
WHERE email_confirmed = false OR email_confirmed IS NULL;

-- 3. Criar função para auto-confirmar novos usuários
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-confirmar o email do usuário
    NEW.email_confirmed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para auto-confirmar usuários na criação
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

-- 5. Atualizar a função handle_new_user para sempre marcar como confirmado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_unit_id UUID;
BEGIN
    -- Buscar uma unidade padrão
    SELECT id INTO default_unit_id
    FROM public.unidades
    LIMIT 1;
    
    -- Criar perfil automaticamente com email sempre confirmado
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
        true -- Sempre confirmado
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha o processo de criação do usuário
        RAISE WARNING 'Erro ao criar perfil automaticamente: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Comentário sobre a configuração
-- Esta migração desabilita completamente a confirmação de email:
-- - Todos os usuários existentes são marcados como confirmados
-- - Novos usuários são automaticamente confirmados na criação
-- - Mudanças de email não requerem confirmação