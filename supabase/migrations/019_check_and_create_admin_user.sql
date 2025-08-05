-- Verificar e criar usuário admin se necessário

-- Primeiro, verificar se o usuário admin já existe
DO $$
DECLARE
    admin_exists INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_exists 
    FROM users 
    WHERE email = 'admin@lamusicweek.com';
    
    IF admin_exists = 0 THEN
        -- Criar o usuário admin se não existir
        INSERT INTO users (
            id,
            user_id,
            email,
            user_type,
            nome_completo,
            email_confirmed,
            created_at,
            updated_at
        ) VALUES (
            '11111111-1111-1111-1111-111111111111',
            '11111111-1111-1111-1111-111111111111',
            'admin@lamusicweek.com',
            'admin',
            'Administrador',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Usuário admin criado com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário admin já existe!';
    END IF;
END $$;

-- Verificar o resultado
SELECT 
    id,
    user_id,
    email,
    user_type,
    nome_completo,
    email_confirmed
FROM users 
WHERE email = 'admin@lamusicweek.com';