-- Migração para corrigir recursão infinita nas políticas RLS da tabela users
-- Remove políticas problemáticas e recria sem recursão

-- Remover políticas RLS existentes da tabela users que causam recursão
DROP POLICY IF EXISTS "Usuários veem apenas da mesma unidade" ON users;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON users;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON users;

-- Criar novas políticas RLS sem recursão para a tabela users

-- Política para SELECT: usuários veem apenas seu próprio perfil
CREATE POLICY "users_select_own_profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Política para UPDATE: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "users_update_own_profile" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Política para INSERT: usuários podem inserir apenas seu próprio perfil
CREATE POLICY "users_insert_own_profile" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Política para DELETE: usuários podem deletar apenas seu próprio perfil
CREATE POLICY "users_delete_own_profile" ON users
    FOR DELETE
    USING (auth.uid() = id);

-- Política adicional para administradores (se necessário)
-- Administradores podem ver todos os usuários
CREATE POLICY "admin_full_access" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.user_id = auth.uid() 
            AND u.user_type = 'admin'
        )
    );

-- Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Comentário explicativo
COMMENT ON TABLE users IS 'Tabela de usuários com políticas RLS corrigidas para evitar recursão infinita';