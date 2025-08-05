-- Migração simples para corrigir recursão infinita
-- Remove políticas problemáticas e cria básicas
-- Data: 2025-01-06

-- 1. Criar função simples para verificar admin
CREATE OR REPLACE FUNCTION check_admin_email()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = ANY(ARRAY[
            'admin@lamusicweek.com',
            'hugo@latecnology.com.br', 
            'admin@admin.com'
        ])
    );
$$;

-- 2. Políticas básicas para users
CREATE POLICY "basic_users_insert" ON users
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "basic_users_select" ON users
    FOR SELECT
    USING (auth.uid()::text = user_id::text OR check_admin_email());

CREATE POLICY "basic_users_update" ON users
    FOR UPDATE
    USING (auth.uid()::text = user_id::text OR check_admin_email());

CREATE POLICY "basic_users_delete" ON users
    FOR DELETE
    USING (check_admin_email());

-- 3. Políticas básicas para workshops
CREATE POLICY "basic_workshops_select" ON workshops
    FOR SELECT
    USING (true);

CREATE POLICY "basic_workshops_manage" ON workshops
    FOR ALL
    USING (check_admin_email())
    WITH CHECK (check_admin_email());