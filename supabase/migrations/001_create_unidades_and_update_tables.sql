-- Migração 001: Criar tabela unidades e atualizar tabelas existentes
-- Data: 2024-01-15
-- Descrição: Adiciona sistema de unidades e campos para autenticação

-- 1. Criar tabela unidades
CREATE TABLE IF NOT EXISTS public.unidades (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    endereco TEXT,
    telefone VARCHAR(20),
    email VARCHAR(255),
    responsavel VARCHAR(255),
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inserir unidades padrão
INSERT INTO public.unidades (nome, endereco, responsavel) VALUES 
('Unidade Centro', 'Rua Principal, 123 - Centro', 'João Silva'),
('Unidade Norte', 'Av. Norte, 456 - Bairro Norte', 'Maria Santos'),
('Unidade Sul', 'Rua Sul, 789 - Bairro Sul', 'Pedro Costa')
ON CONFLICT (nome) DO NOTHING;

-- 3. Adicionar campos na tabela users para autenticação
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_confirmation_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- 4. Adicionar constraint de foreign key para unit_id na tabela users
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_unit_id 
FOREIGN KEY (unit_id) REFERENCES public.unidades(id);

-- 5. Adicionar campos na tabela workshops para filtro por unidade
ALTER TABLE public.workshops 
ADD COLUMN IF NOT EXISTS unit_id UUID,
ADD COLUMN IF NOT EXISTS idade_minima INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS idade_maxima INTEGER DEFAULT 100;

-- 6. Adicionar constraint de foreign key para unit_id na tabela workshops
ALTER TABLE public.workshops 
ADD CONSTRAINT fk_workshops_unit_id 
FOREIGN KEY (unit_id) REFERENCES public.unidades(id);

-- 7. Adicionar campos na tabela inscricoes para sistema de convidados
ALTER TABLE public.inscricoes 
ADD COLUMN IF NOT EXISTS participant_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS participant_age INTEGER,
ADD COLUMN IF NOT EXISTS participant_type VARCHAR(50) DEFAULT 'principal',
ADD COLUMN IF NOT EXISTS invited_by_user_id UUID,
ADD COLUMN IF NOT EXISTS presente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_presenca TIMESTAMPTZ;

-- 8. Adicionar constraint de foreign key para invited_by_user_id
ALTER TABLE public.inscricoes 
ADD CONSTRAINT fk_inscricoes_invited_by_user_id 
FOREIGN KEY (invited_by_user_id) REFERENCES public.users(id);

-- 9. Adicionar constraint para participant_type
ALTER TABLE public.inscricoes 
ADD CONSTRAINT chk_participant_type 
CHECK (participant_type IN ('principal', 'convidado'));

-- 10. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON public.users(unit_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_workshops_unit_id ON public.workshops(unit_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_invited_by_user_id ON public.inscricoes(invited_by_user_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_participant_type ON public.inscricoes(participant_type);

-- 11. Habilitar RLS nas tabelas
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

-- 12. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. Criar triggers para updated_at
CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON public.unidades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workshops_updated_at BEFORE UPDATE ON public.workshops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inscricoes_updated_at BEFORE UPDATE ON public.inscricoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();