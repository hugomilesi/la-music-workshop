-- Atualizar usuário existente para admin se o email for admin@lamusicweek.com
-- Isso permite que um usuário se torne admin fazendo login com esse email

-- Atualizar qualquer usuário com email admin@lamusicweek.com para ser admin
UPDATE users 
SET user_type = 'admin'
WHERE email = 'admin@lamusicweek.com' AND user_type != 'admin';

-- Se não houver usuário com esse email, a atualização não fará nada
-- O usuário admin será criado quando alguém se registrar com admin@lamusicweek.com

-- Comentário explicativo
COMMENT ON TABLE users IS 'Tabela de usuários com usuário admin de teste criado';