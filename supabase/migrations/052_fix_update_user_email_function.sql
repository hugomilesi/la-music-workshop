-- Fix update_user_email function to handle email inconsistencies
-- This migration fixes the function to verify users by ID instead of email
-- to avoid issues with existing email inconsistencies

-- Drop the existing function
DROP FUNCTION IF EXISTS public.update_user_email(UUID, TEXT, TEXT);

-- Create the corrected function
CREATE OR REPLACE FUNCTION public.update_user_email(
    p_user_id UUID,
    p_old_email TEXT,
    p_new_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user_exists BOOLEAN;
    public_user_exists BOOLEAN;
    email_already_exists_auth BOOLEAN;
    email_already_exists_public BOOLEAN;
    result JSON;
BEGIN
    -- Verificar se o usuário existe em auth.users (por ID, não por email)
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE id = p_user_id
    ) INTO auth_user_exists;
    
    -- Verificar se o usuário existe em public.users (por user_id, não por email)
    SELECT EXISTS(
        SELECT 1 FROM public.users 
        WHERE user_id = p_user_id
    ) INTO public_user_exists;
    
    -- Se o usuário não existe em nenhuma das tabelas
    IF NOT auth_user_exists AND NOT public_user_exists THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Usuário não encontrado',
            'error_code', 'USER_NOT_FOUND'
        );
    END IF;
    
    -- Verificar se o novo email já existe em auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = p_new_email AND id != p_user_id
    ) INTO email_already_exists_auth;
    
    -- Verificar se o novo email já existe em public.users
    SELECT EXISTS(
        SELECT 1 FROM public.users 
        WHERE email = p_new_email AND user_id != p_user_id
    ) INTO email_already_exists_public;
    
    -- Se o email já existe em qualquer uma das tabelas
    IF email_already_exists_auth OR email_already_exists_public THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Este email já está sendo usado por outro usuário',
            'error_code', 'EMAIL_ALREADY_EXISTS'
        );
    END IF;
    
    -- Iniciar transação para atualizar ambas as tabelas
    BEGIN
        -- Atualizar auth.users se o usuário existe lá
        IF auth_user_exists THEN
            UPDATE auth.users 
            SET 
                email = p_new_email,
                updated_at = NOW()
            WHERE id = p_user_id;
        END IF;
        
        -- Atualizar public.users se o usuário existe lá
        IF public_user_exists THEN
            UPDATE public.users 
            SET 
                email = p_new_email,
                updated_at = NOW()
            WHERE user_id = p_user_id;
        END IF;
        
        -- Se chegou até aqui, a operação foi bem-sucedida
        RETURN json_build_object(
            'success', true,
            'message', 'Email atualizado com sucesso em ambas as tabelas',
            'old_email', p_old_email,
            'new_email', p_new_email,
            'updated_auth', auth_user_exists,
            'updated_public', public_user_exists
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Em caso de erro, fazer rollback e retornar erro
            RAISE;
            RETURN json_build_object(
                'success', false,
                'message', 'Erro ao atualizar email: ' || SQLERRM,
                'error_code', 'UPDATE_FAILED'
            );
    END;
END;
$$;

-- Grant permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.update_user_email(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_email(UUID, TEXT, TEXT) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_user_email(UUID, TEXT, TEXT) IS 
'Synchronizes email updates between auth.users and public.users tables. Verifies users by ID instead of email to handle inconsistencies. Returns JSON with success status and detailed information.';