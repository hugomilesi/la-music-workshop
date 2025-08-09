-- Migração para criar triggers de validação de idade
-- Criada em: 2024-01-20
-- Descrição: Adiciona triggers para validar idade nas inscrições e convidados

-- Criar função para validar idade antes de inserir inscrição
CREATE OR REPLACE FUNCTION validate_age_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    workshop_idade_min INTEGER;
    workshop_idade_max INTEGER;
    workshop_nome TEXT;
BEGIN
    -- Buscar as restrições de idade do workshop
    SELECT idade_minima, idade_maxima, nome
    INTO workshop_idade_min, workshop_idade_max, workshop_nome
    FROM workshops
    WHERE id = NEW.workshop_id;
    
    -- Validar idade mínima
    IF workshop_idade_min IS NOT NULL AND NEW.participant_age < workshop_idade_min THEN
        RAISE EXCEPTION 'check_idade_minima: Idade mínima para o workshop "%" é % anos. Idade informada: % anos.', 
            workshop_nome, workshop_idade_min, NEW.participant_age;
    END IF;
    
    -- Validar idade máxima
    IF workshop_idade_max IS NOT NULL AND NEW.participant_age > workshop_idade_max THEN
        RAISE EXCEPTION 'check_idade_maxima: Idade máxima para o workshop "%" é % anos. Idade informada: % anos.', 
            workshop_nome, workshop_idade_max, NEW.participant_age;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar função para validar idade de convidados antes de inserir
CREATE OR REPLACE FUNCTION validate_guest_age_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    workshop_idade_min INTEGER;
    workshop_idade_max INTEGER;
    workshop_nome TEXT;
    workshop_id UUID;
BEGIN
    -- Buscar o workshop_id através da inscrição
    SELECT i.workshop_id INTO workshop_id
    FROM inscricoes i
    WHERE i.id = NEW.inscricao_id;
    
    -- Buscar as restrições de idade do workshop
    SELECT idade_minima, idade_maxima, nome
    INTO workshop_idade_min, workshop_idade_max, workshop_nome
    FROM workshops
    WHERE id = workshop_id;
    
    -- Validar idade mínima
    IF workshop_idade_min IS NOT NULL AND NEW.idade < workshop_idade_min THEN
        RAISE EXCEPTION 'convidados_idade_check: Idade mínima para convidados na oficina "%" é % anos. Idade informada: % anos.', 
            workshop_nome, workshop_idade_min, NEW.idade;
    END IF;
    
    -- Validar idade máxima
    IF workshop_idade_max IS NOT NULL AND NEW.idade > workshop_idade_max THEN
        RAISE EXCEPTION 'convidados_idade_check: Idade máxima para convidados na oficina "%" é % anos. Idade informada: % anos.', 
            workshop_nome, workshop_idade_max, NEW.idade;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS trigger_validate_age ON public.inscricoes;
DROP TRIGGER IF EXISTS trigger_validate_guest_age ON public.convidados;

-- Criar trigger para validar idade nas inscrições
CREATE TRIGGER trigger_validate_age
    BEFORE INSERT ON public.inscricoes
    FOR EACH ROW
    EXECUTE FUNCTION validate_age_before_insert();

-- Criar trigger para validar idade dos convidados
CREATE TRIGGER trigger_validate_guest_age
    BEFORE INSERT ON public.convidados
    FOR EACH ROW
    EXECUTE FUNCTION validate_guest_age_before_insert();

-- Comentários para documentação
COMMENT ON FUNCTION validate_age_before_insert() IS 'Função para validar idade do participante antes de inserir inscrição';
COMMENT ON FUNCTION validate_guest_age_before_insert() IS 'Função para validar idade do convidado antes de inserir na tabela convidados';
COMMENT ON TRIGGER trigger_validate_age ON public.inscricoes IS 'Trigger para validar idade nas inscrições';
COMMENT ON TRIGGER trigger_validate_guest_age ON public.convidados IS 'Trigger para validar idade dos convidados';