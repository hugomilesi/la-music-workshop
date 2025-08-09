-- Migração para desabilitar emails de boas-vindas e otimizar carregamento de workshops por unidade
-- Esta migração resolve os problemas reportados pelo usuário

BEGIN;

-- 1. Desabilitar template de email de boas-vindas
UPDATE email_templates 
SET active = false 
WHERE name = 'welcome_email';

-- 2. Criar função otimizada para buscar workshops por unidade
-- Esta função melhora a performance do carregamento de workshops
CREATE OR REPLACE FUNCTION get_workshops_by_unit(p_unit_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    nome VARCHAR,
    descricao TEXT,
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    local VARCHAR,
    capacidade INTEGER,
    preco DECIMAL,
    instrumento VARCHAR,
    nivel VARCHAR,
    vagas_disponiveis INTEGER,
    status VARCHAR,
    unit_id UUID,
    idade_minima INTEGER,
    idade_maxima INTEGER,
    imagem TEXT,
    permite_convidados BOOLEAN,
    nome_instrutor VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    unidade_nome VARCHAR
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Se unit_id for fornecido, filtrar por unidade
    -- Caso contrário, retornar todos os workshops ativos
    IF p_unit_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            w.id,
            w.nome,
            w.descricao,
            w.data_inicio,
            w.data_fim,
            w.local,
            w.capacidade,
            w.preco,
            w.instrumento,
            w.nivel,
            w.vagas_disponiveis,
            w.status,
            w.unit_id,
            w.idade_minima,
            w.idade_maxima,
            w.imagem,
            w.permite_convidados,
            w.nome_instrutor,
            w.created_at,
            w.updated_at,
            u.nome as unidade_nome
        FROM workshops w
        LEFT JOIN unidades u ON w.unit_id = u.id
        WHERE w.status = 'ativa' 
        AND w.unit_id = p_unit_id
        ORDER BY w.created_at DESC;
    ELSE
        RETURN QUERY
        SELECT 
            w.id,
            w.nome,
            w.descricao,
            w.data_inicio,
            w.data_fim,
            w.local,
            w.capacidade,
            w.preco,
            w.instrumento,
            w.nivel,
            w.vagas_disponiveis,
            w.status,
            w.unit_id,
            w.idade_minima,
            w.idade_maxima,
            w.imagem,
            w.permite_convidados,
            w.nome_instrutor,
            w.created_at,
            w.updated_at,
            u.nome as unidade_nome
        FROM workshops w
        LEFT JOIN unidades u ON w.unit_id = u.id
        WHERE w.status = 'ativa'
        ORDER BY w.created_at DESC;
    END IF;
END;
$$;

-- 3. Criar índice para melhorar performance de consultas por unidade
CREATE INDEX IF NOT EXISTS idx_workshops_unit_status ON workshops(unit_id, status) WHERE status = 'ativa';

-- 4. Criar função para pré-carregar dados críticos do usuário
-- Esta função ajuda a reduzir o tempo de carregamento inicial
CREATE OR REPLACE FUNCTION get_user_critical_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_data JSON;
    workshops_data JSON;
BEGIN
    -- Buscar dados do usuário
    SELECT json_build_object(
        'id', u.id,
        'user_id', u.user_id,
        'nome_completo', u.nome_completo,
        'email', u.email,
        'user_type', u.user_type,
        'telefone', u.telefone,
        'unit_id', u.unit_id,
        'unit_name', un.nome
    ) INTO user_data
    FROM users u
    LEFT JOIN unidades un ON u.unit_id = un.id
    WHERE u.user_id = p_user_id;
    
    -- Se for admin, não filtrar workshops por unidade
    -- Se for student/responsavel, filtrar por unidade
    IF (user_data->>'user_type') = 'admin' THEN
        SELECT json_agg(w.*) INTO workshops_data
        FROM get_workshops_by_unit(NULL) w;
    ELSE
        SELECT json_agg(w.*) INTO workshops_data
        FROM get_workshops_by_unit((user_data->>'unit_id')::UUID) w;
    END IF;
    
    RETURN json_build_object(
        'user', user_data,
        'workshops', COALESCE(workshops_data, '[]'::json)
    );
END;
$$;

-- 5. Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION get_workshops_by_unit(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_critical_data(UUID) TO authenticated;

-- 6. Comentários para documentação
COMMENT ON FUNCTION get_workshops_by_unit(UUID) IS 'Função otimizada para buscar workshops por unidade. Se unit_id for NULL, retorna todos os workshops ativos.';
COMMENT ON FUNCTION get_user_critical_data(UUID) IS 'Função para pré-carregar dados críticos do usuário, incluindo workshops filtrados por unidade.';

-- 7. Atualizar configuração para garantir que emails de boas-vindas não sejam enviados
-- Criar uma configuração de sistema para controlar envio de emails
CREATE TABLE IF NOT EXISTS system_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração para desabilitar emails de boas-vindas
INSERT INTO system_config (config_key, config_value, description) VALUES
('DISABLE_WELCOME_EMAILS', 'true', 'Desabilita o envio automático de emails de boas-vindas')
ON CONFLICT (config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- Habilitar RLS na tabela de configuração
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de configurações
CREATE POLICY "Allow read system config" ON system_config
    FOR SELECT USING (true);

-- Política para permitir apenas admins modificarem configurações
CREATE POLICY "Allow admin modify system config" ON system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Conceder permissões
GRANT SELECT ON system_config TO authenticated, anon;
GRANT ALL ON system_config TO service_role;

COMMIT;