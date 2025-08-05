-- Criar usuário administrador - versão final simplificada
-- Apenas inserir na tabela users (o auth será criado manualmente)

DO $$
DECLARE
    campo_grande_unit_id UUID;
BEGIN
    -- Buscar o ID da unidade Campo Grande
    SELECT id INTO campo_grande_unit_id 
    FROM unidades 
    WHERE nome = 'Campo Grande';
    
    -- Verificar se a unidade foi encontrada
    IF campo_grande_unit_id IS NOT NULL THEN
        -- Verificar se o usuário já existe
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@lamusicweek.com') THEN
            -- Inserir na tabela users
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
            
            RAISE NOTICE 'Usuário administrador criado com sucesso na tabela users!';
        ELSE
            RAISE NOTICE 'Usuário administrador já existe na tabela users.';
        END IF;
        
        RAISE NOTICE 'PRÓXIMO PASSO: Criar usuário no Supabase Auth Dashboard:';
        RAISE NOTICE 'Email: admin@lamusicweek.com';
        RAISE NOTICE 'Senha: admin123';
        RAISE NOTICE 'UUID: 11111111-1111-1111-1111-111111111111';
    ELSE
        RAISE NOTICE 'ERRO: Unidade Campo Grande não encontrada!';
    END IF;
END $$;

-- Verificar o resultado
SELECT 
    u.user_id,
    u.email,
    u.user_type,
    u.nome_completo,
    un.nome as unidade
FROM users u
JOIN unidades un ON u.unit_id = un.id
WHERE u.email = 'admin@lamusicweek.com';