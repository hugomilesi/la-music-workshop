-- Migração para permitir acesso anônimo aos workshops
-- Conforme especificado no todo.md: "o cliente anônimo deve ter conseguir ver todas as oficinas disponiveis, mas nao se inscrever."
-- Data: 2024-01-15

BEGIN;

-- Criar política específica para permitir que usuários anônimos vejam workshops
CREATE POLICY "Anon can view all workshops" ON public.workshops
    FOR SELECT
    TO anon
    USING (status = 'ativa');

-- Garantir que a função get_workshops_by_unit pode ser executada por anon
-- (já foi concedida na migração 053, mas garantindo aqui também)
GRANT EXECUTE ON FUNCTION get_workshops_by_unit(UUID) TO anon;

-- Garantir que anon pode ler a tabela unidades para obter nomes das unidades
GRANT SELECT ON public.unidades TO anon;

-- Comentário explicativo
COMMENT ON POLICY "Anon can view all workshops" ON public.workshops IS 'Permite que usuários não autenticados vejam todos os workshops ativos';

COMMIT;