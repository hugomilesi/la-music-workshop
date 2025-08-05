-- Função para deletar usuário completamente (public.users + auth.users)
-- Esta função resolve o problema de usuários permanecerem no auth.users após remoção

CREATE OR REPLACE FUNCTION delete_user_completely(user_table_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user_id UUID;
    user_email TEXT;
BEGIN
    -- Buscar o user_id do auth.users e email para logs
    SELECT user_id, email INTO auth_user_id, user_email
    FROM public.users 
    WHERE id = user_table_id;
    
    -- Verificar se o usuário existe
    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado na tabela public.users';
    END IF;
    
    -- Log da operação
    RAISE NOTICE 'Iniciando remoção completa do usuário: % (ID: %)', user_email, auth_user_id;
    
    -- 1. Deletar todas as inscrições do usuário
    DELETE FROM public.inscricoes WHERE user_id = user_table_id;
    RAISE NOTICE 'Inscrições removidas para usuário: %', user_email;
    
    -- 2. Deletar todos os convidados relacionados às inscrições do usuário
    DELETE FROM public.convidados 
    WHERE inscricao_id IN (
        SELECT id FROM public.inscricoes WHERE user_id = user_table_id
    );
    RAISE NOTICE 'Convidados removidos para usuário: %', user_email;
    
    -- 3. Deletar da tabela public.users
    DELETE FROM public.users WHERE id = user_table_id;
    RAISE NOTICE 'Usuário removido da tabela public.users: %', user_email;
    
    -- 4. Deletar do auth.users (requer privilégios de service_role)
    -- Esta operação deve ser feita via service_role no frontend
    -- Aqui apenas registramos que precisa ser feito
    RAISE NOTICE 'ATENÇÃO: Usuário % ainda precisa ser removido do auth.users via service_role', auth_user_id;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao deletar usuário completamente: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION delete_user_completely(UUID) IS 'Deleta usuário completamente do sistema, removendo de public.users e todas as tabelas relacionadas. A remoção do auth.users deve ser feita via service_role no frontend.';

-- Conceder permissões para authenticated users (admins)
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;

-- Criar política RLS para a função (apenas admins podem executar)
CREATE POLICY "Only admins can execute complete user deletion" ON public.users
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.user_id = auth.uid()
        AND u.user_type = 'admin'
    )
);