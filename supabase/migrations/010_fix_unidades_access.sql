-- Permitir acesso de leitura às unidades para usuários anônimos
-- Isso é necessário para o dropdown de unidades no formulário de cadastro

-- Remover política existente se houver
DROP POLICY IF EXISTS "Usuários autenticados podem ver unidades" ON unidades;
DROP POLICY IF EXISTS "anon_can_read_unidades" ON unidades;

-- Criar política que permite leitura para usuários anônimos e autenticados
CREATE POLICY "anon_can_read_unidades" ON unidades
    FOR SELECT 
    USING (ativa = true);

-- Conceder permissões para o role anon
GRANT SELECT ON unidades TO anon;
GRANT SELECT ON unidades TO authenticated;

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'unidades';