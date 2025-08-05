-- Migração para adicionar suporte a convidados no sistema de inscrições
-- Criada em: 2024-01-15
-- Descrição: Adiciona campos para gerenciar convidados nas inscrições

-- Criar tabela para armazenar dados dos convidados
CREATE TABLE IF NOT EXISTS public.convidados (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    inscricao_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    idade INTEGER NOT NULL CHECK (idade >= 5 AND idade <= 18),
    nome_responsavel VARCHAR(255),
    telefone_responsavel VARCHAR(20),
    email_responsavel VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar campos na tabela inscricoes para controlar convidados
ALTER TABLE public.inscricoes 
ADD COLUMN IF NOT EXISTS total_participantes INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS tem_convidados BOOLEAN DEFAULT FALSE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_convidados_inscricao_id ON public.convidados(inscricao_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_tem_convidados ON public.inscricoes(tem_convidados);

-- Habilitar RLS na tabela convidados
ALTER TABLE public.convidados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para convidados
-- Usuários autenticados podem ver convidados de suas próprias inscrições
CREATE POLICY "Users can view their own guests" ON public.convidados
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.inscricoes i 
            WHERE i.id = convidados.inscricao_id 
            AND i.user_id = auth.uid()
        )
    );

-- Usuários autenticados podem inserir convidados em suas próprias inscrições
CREATE POLICY "Users can insert guests for their registrations" ON public.convidados
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.inscricoes i 
            WHERE i.id = convidados.inscricao_id 
            AND i.user_id = auth.uid()
        )
    );

-- Usuários autenticados podem atualizar convidados de suas próprias inscrições
CREATE POLICY "Users can update their own guests" ON public.convidados
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.inscricoes i 
            WHERE i.id = convidados.inscricao_id 
            AND i.user_id = auth.uid()
        )
    );

-- Usuários autenticados podem deletar convidados de suas próprias inscrições
CREATE POLICY "Users can delete their own guests" ON public.convidados
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.inscricoes i 
            WHERE i.id = convidados.inscricao_id 
            AND i.user_id = auth.uid()
        )
    );

-- Administradores podem fazer tudo
CREATE POLICY "Admins can manage all guests" ON public.convidados
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.user_type = 'admin'
        )
    );

-- Função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela convidados
CREATE TRIGGER update_convidados_updated_at 
    BEFORE UPDATE ON public.convidados 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar automaticamente o total de participantes
CREATE OR REPLACE FUNCTION update_total_participantes()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar o total de participantes na inscrição
    UPDATE public.inscricoes 
    SET 
        total_participantes = 1 + (
            SELECT COUNT(*) 
            FROM public.convidados 
            WHERE inscricao_id = COALESCE(NEW.inscricao_id, OLD.inscricao_id)
        ),
        tem_convidados = (
            SELECT COUNT(*) > 0 
            FROM public.convidados 
            WHERE inscricao_id = COALESCE(NEW.inscricao_id, OLD.inscricao_id)
        )
    WHERE id = COALESCE(NEW.inscricao_id, OLD.inscricao_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers para manter o total de participantes atualizado
CREATE TRIGGER update_participantes_on_insert 
    AFTER INSERT ON public.convidados 
    FOR EACH ROW 
    EXECUTE FUNCTION update_total_participantes();

CREATE TRIGGER update_participantes_on_delete 
    AFTER DELETE ON public.convidados 
    FOR EACH ROW 
    EXECUTE FUNCTION update_total_participantes();

-- Conceder permissões para as roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.convidados TO authenticated;
GRANT SELECT ON public.convidados TO anon;

-- Comentários para documentação
COMMENT ON TABLE public.convidados IS 'Tabela para armazenar dados dos convidados nas inscrições';
COMMENT ON COLUMN public.convidados.inscricao_id IS 'ID da inscrição à qual o convidado pertence';
COMMENT ON COLUMN public.convidados.nome IS 'Nome completo do convidado';
COMMENT ON COLUMN public.convidados.idade IS 'Idade do convidado (entre 5 e 18 anos)';
COMMENT ON COLUMN public.convidados.nome_responsavel IS 'Nome do responsável pelo convidado (opcional)';
COMMENT ON COLUMN public.convidados.telefone_responsavel IS 'Telefone do responsável (opcional)';
COMMENT ON COLUMN public.convidados.email_responsavel IS 'Email do responsável (opcional)';

COMMENT ON COLUMN public.inscricoes.total_participantes IS 'Total de participantes (principal + convidados)';
COMMENT ON COLUMN public.inscricoes.tem_convidados IS 'Indica se a inscrição possui convidados';

-- Inserir dados de exemplo (opcional)
-- INSERT INTO public.convidados (inscricao_id, nome, idade, nome_responsavel, telefone_responsavel, email_responsavel)
-- VALUES 
--     ('uuid-da-inscricao', 'João Silva', 12, 'Maria Silva', '(21) 99999-9999', 'maria@email.com'),
--     ('uuid-da-inscricao', 'Ana Costa', 14, 'Pedro Costa', '(21) 88888-8888', 'pedro@email.com');