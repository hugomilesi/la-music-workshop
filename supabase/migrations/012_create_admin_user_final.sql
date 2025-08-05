-- Criar usuário administrador na tabela users
-- Email: admin@lamusicweek.com
-- Nota: O usuário deve ser criado manualmente no Supabase Auth Dashboard

-- Gerar um UUID fixo para o administrador
-- Este UUID deve ser usado ao criar o usuário no Supabase Auth Dashboard

-- UUID fixo para o administrador (use este UUID ao criar o usuário no Supabase Auth)
-- UUID: 11111111-1111-1111-1111-111111111111

-- Inserir registro na tabela users para o administrador
DO $$
DECLARE
    campo_grande_unit_id UUID;
BEGIN
    -- Buscar o ID da unidade Campo Grande
    SELECT id INTO campo_grande_unit_id 
    FROM unidades 
    WHERE nome = 'Campo Grande';
    
    -- Inserir na tabela users
    IF campo_grande_unit_id IS NOT NULL THEN
        INSERT INTO users (
            user_id,
            email,
            user_type,
            unit_id,
            nome_completo,
            telefone,
            data_nascimento,
            email_confirmed
        ) VALUES (
            '11111111-1111-1111-1111-111111111111',
            'admin@lamusicweek.com',
            'admin',
            campo_grande_unit_id,
            'Administrador Sistema',
            '(21) 99999-9999',
            '1990-01-01',
            true
        );
        
        RAISE NOTICE 'Registro do administrador criado na tabela users!';
        RAISE NOTICE 'Agora crie o usuário no Supabase Auth Dashboard com:';
        RAISE NOTICE 'Email: admin@lamusicweek.com';
        RAISE NOTICE 'Senha: admin123';
        RAISE NOTICE 'UUID: 11111111-1111-1111-1111-111111111111';
    ELSE
        RAISE NOTICE 'Erro: Não foi possível encontrar a unidade Campo Grande';
    END IF;
END $$;

-- Verificar se o usuário foi criado
SELECT 
    u.email,
    u.user_type,
    u.nome_completo,
    un.nome as unidade
FROM users u
JOIN unidades un ON u.unit_id = un.id
WHERE u.email = 'admin@lamusicweek.com';