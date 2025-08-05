-- Verificar e corrigir políticas da tabela unidades
-- Remover todas as políticas problemáticas e criar uma simples

-- Verificar políticas atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'unidades';

-- Remover todas as políticas existentes da tabela unidades
DROP POLICY IF EXISTS "Usuários autenticados podem ver unidades" ON unidades;
DROP POLICY IF EXISTS "Apenas admins podem modificar unidades" ON unidades;
DROP POLICY IF EXISTS "anon_can_read_unidades" ON unidades;

-- Criar política simples que permite leitura para todos
CREATE POLICY "public_read_unidades" ON unidades
    FOR SELECT 
    TO public
    USING (ativa = true);

-- Conceder permissões explícitas
GRANT SELECT ON unidades TO anon;
GRANT SELECT ON unidades TO authenticated;

-- Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'unidades';

-- Testar acesso às unidades
SELECT id, nome, endereco FROM unidades WHERE ativa = true LIMIT 3;