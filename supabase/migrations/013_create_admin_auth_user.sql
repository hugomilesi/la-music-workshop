-- Criar usuário administrador no sistema de autenticação do Supabase
-- Este script cria o usuário diretamente no auth.users

-- Inserir usuário no auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) 
SELECT 
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@lamusicweek.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@lamusicweek.com'
);

-- Inserir identidade no auth.identities
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT 
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'admin@lamusicweek.com')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = '11111111-1111-1111-1111-111111111111'
);

-- Agora inserir na tabela users
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
        ) 
        SELECT 
            '11111111-1111-1111-1111-111111111111',
            'admin@lamusicweek.com',
            'admin',
            campo_grande_unit_id,
            'Administrador Sistema',
            '(21) 99999-9999',
            '1990-01-01',
            true
        WHERE NOT EXISTS (
            SELECT 1 FROM users WHERE user_id = '11111111-1111-1111-1111-111111111111'
        );
        
        RAISE NOTICE 'Usuário administrador criado com sucesso!';
        RAISE NOTICE 'Email: admin@lamusicweek.com';
        RAISE NOTICE 'Senha: admin123';
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