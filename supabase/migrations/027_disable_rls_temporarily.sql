-- Migração temporária para desabilitar RLS na tabela users
-- Isso permitirá inserções enquanto investigamos o problema
-- Data: 2025-01-04

-- Desabilitar RLS temporariamente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Garantir permissões básicas
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Comentário da migração
COMMENT ON TABLE users IS 'RLS temporariamente desabilitado para permitir inserções';