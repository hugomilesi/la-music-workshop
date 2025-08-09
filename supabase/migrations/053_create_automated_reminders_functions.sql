-- Migração para criar funções de processamento de lembretes automáticos

-- 1. Função para processar lembretes automáticos que devem ser enviados
CREATE OR REPLACE FUNCTION public.processar_lembretes_automaticos()
RETURNS TABLE (
    lembrete_id uuid,
    inscricao_id uuid,
    user_id uuid,
    titulo text,
    mensagem text,
    workshop_titulo text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        la.id as lembrete_id,
        i.id as inscricao_id,
        i.user_id,
        la.titulo,
        la.mensagem,
        w.titulo as workshop_titulo
    FROM lembretes_automaticos la
    JOIN workshops w ON la.workshop_id = w.id
    JOIN inscricoes i ON i.workshop_id = w.id
    LEFT JOIN envios_lembretes el ON el.lembrete_id = la.id AND el.inscricao_id = i.id
    WHERE 
        la.ativo = true
        AND el.id IS NULL -- Não foi enviado ainda
        AND (
            -- Lembrete 2 dias antes (48 horas)
            (la.periodo_disparo = '2 days' AND w.data_inicio <= NOW() + INTERVAL '2 days' AND w.data_inicio > NOW() + INTERVAL '1 day 23 hours')
            OR
            -- Lembrete 8 horas antes
            (la.periodo_disparo = '8 hours' AND w.data_inicio <= NOW() + INTERVAL '8 hours' AND w.data_inicio > NOW() + INTERVAL '7 hours')
            OR
            -- Outros períodos configurados
            (la.periodo_disparo NOT IN ('2 days', '8 hours') AND 
             w.data_inicio <= NOW() + la.periodo_disparo::interval AND 
             w.data_inicio > NOW() + (la.periodo_disparo::interval - INTERVAL '1 hour'))
        )
    ORDER BY w.data_inicio, la.periodo_disparo;
END;
$$;

-- 2. Função para marcar lembrete como enviado
CREATE OR REPLACE FUNCTION public.marcar_lembrete_enviado(
    p_lembrete_id uuid,
    p_inscricao_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO envios_lembretes (
        lembrete_id,
        inscricao_id,
        data_envio,
        status_envio,
        tentativas
    ) VALUES (
        p_lembrete_id,
        p_inscricao_id,
        NOW(),
        'enviado',
        1
    )
    ON CONFLICT (lembrete_id, inscricao_id) 
    DO UPDATE SET
        data_envio = NOW(),
        status_envio = 'enviado',
        tentativas = envios_lembretes.tentativas + 1;
END;
$$;

-- 3. Função para obter lembretes que precisam ser enviados em períodos específicos
CREATE OR REPLACE FUNCTION public.obter_lembretes_periodo(
    p_periodo text DEFAULT '2 days'
)
RETURNS TABLE (
    lembrete_id uuid,
    inscricao_id uuid,
    user_id uuid,
    titulo text,
    mensagem text,
    workshop_titulo text,
    data_evento timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        la.id as lembrete_id,
        i.id as inscricao_id,
        i.user_id,
        la.titulo,
        la.mensagem,
        w.titulo as workshop_titulo,
        w.data_inicio as data_evento
    FROM lembretes_automaticos la
    JOIN workshops w ON la.workshop_id = w.id
    JOIN inscricoes i ON i.workshop_id = w.id
    LEFT JOIN envios_lembretes el ON el.lembrete_id = la.id AND el.inscricao_id = i.id
    WHERE 
        la.ativo = true
        AND la.periodo_disparo = p_periodo
        AND el.id IS NULL -- Não foi enviado ainda
        AND CASE 
            WHEN p_periodo = '2 days' THEN 
                w.data_inicio <= NOW() + INTERVAL '2 days' AND w.data_inicio > NOW() + INTERVAL '1 day 23 hours'
            WHEN p_periodo = '8 hours' THEN 
                w.data_inicio <= NOW() + INTERVAL '8 hours' AND w.data_inicio > NOW() + INTERVAL '7 hours'
            ELSE 
                w.data_inicio <= NOW() + p_periodo::interval AND 
                w.data_inicio > NOW() + (p_periodo::interval - INTERVAL '1 hour')
        END
    ORDER BY w.data_inicio;
END;
$$;

-- 4. Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION public.processar_lembretes_automaticos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_lembrete_enviado(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obter_lembretes_periodo(text) TO authenticated;

-- 5. Comentários sobre as funções
COMMENT ON FUNCTION public.processar_lembretes_automaticos() IS 'Processa lembretes automáticos que devem ser enviados baseado no período configurado';
COMMENT ON FUNCTION public.marcar_lembrete_enviado(uuid, uuid) IS 'Marca um lembrete como enviado para uma inscrição específica';
COMMENT ON FUNCTION public.obter_lembretes_periodo(text) IS 'Obtém lembretes que precisam ser enviados em um período específico (ex: "2 days", "8 hours")';