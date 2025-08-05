-- Migração para criar templates de email necessários
-- Templates: confirmação, boas-vindas, reset de senha

-- Limpar templates existentes se houver
DELETE FROM email_templates WHERE name IN ('email_confirmation', 'welcome_email', 'password_reset');

-- Template de Confirmação de Email
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  variables,
  active
) VALUES (
  'email_confirmation',
  'Confirme seu email - LA Music Week',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirme seu Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #8B5CF6;
            margin-bottom: 10px;
        }
        .title {
            color: #1F2937;
            font-size: 28px;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #8B5CF6;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #7C3AED;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .warning {
            background-color: #FEF3C7;
            border: 1px solid #F59E0B;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎵 LA Music Week</div>
            <h1 class="title">Confirme seu Email</h1>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{nome_completo}}</strong>,</p>
            
            <p>Obrigado por se cadastrar na LA Music Week! Para completar seu cadastro e ter acesso a todas as funcionalidades da plataforma, você precisa confirmar seu endereço de email.</p>
            
            <div style="text-align: center;">
                <a href="{{confirmation_url}}" class="button">Confirmar Email</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Este link expira em 24 horas. Se você não confirmar seu email dentro deste prazo, será necessário solicitar um novo link de confirmação.
            </div>
            
            <p>Se você não conseguir clicar no botão acima, copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">{{confirmation_url}}</p>
            
            <p>Se você não se cadastrou na LA Music Week, pode ignorar este email com segurança.</p>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado automaticamente. Por favor, não responda.</p>
            <p>© 2025 LA Music Week. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>',
  'Olá {{nome_completo}},\n\nObrigado por se cadastrar na LA Music Week!\n\nPara completar seu cadastro, confirme seu email clicando no link abaixo:\n{{confirmation_url}}\n\nEste link expira em 24 horas.\n\nSe você não se cadastrou na LA Music Week, ignore este email.\n\n© 2025 LA Music Week',
  '["nome_completo", "confirmation_url", "email"]',
  true
);

-- Template de Boas-vindas
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  variables,
  active
) VALUES (
  'welcome_email',
  'Bem-vindo(a) à LA Music Week! 🎵',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo à LA Music Week</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #8B5CF6;
            margin-bottom: 10px;
        }
        .title {
            color: #1F2937;
            font-size: 28px;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #8B5CF6;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .feature-list {
            background-color: #F3F4F6;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .feature-item {
            margin: 10px 0;
            padding-left: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎵 LA Music Week</div>
            <h1 class="title">Bem-vindo(a)!</h1>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{nome_completo}}</strong>,</p>
            
            <p>É com grande alegria que damos as boas-vindas à <strong>LA Music Week</strong>! Seu email foi confirmado com sucesso e agora você tem acesso completo à nossa plataforma.</p>
            
            <div class="feature-list">
                <h3>🎯 O que você pode fazer agora:</h3>
                <div class="feature-item">🎪 <strong>Explorar Workshops:</strong> Descubra workshops incríveis de música</div>
                <div class="feature-item">📝 <strong>Fazer Inscrições:</strong> Inscreva-se nos eventos que mais te interessam</div>
                <div class="feature-item">👤 <strong>Gerenciar Perfil:</strong> Atualize suas informações pessoais</div>
                <div class="feature-item">📧 <strong>Receber Notificações:</strong> Fique por dentro de novos eventos</div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{platform_url}}" class="button">Acessar Plataforma</a>
            </div>
            
            <p>Você está cadastrado na unidade: <strong>{{unit_name}}</strong></p>
            
            <p>Se tiver alguma dúvida ou precisar de ajuda, nossa equipe está sempre disponível para auxiliá-lo.</p>
            
            <p>Desejamos uma excelente experiência musical!</p>
        </div>
        
        <div class="footer">
            <p>© 2025 LA Music Week. Todos os direitos reservados.</p>
            <p>Você está recebendo este email porque se cadastrou em nossa plataforma.</p>
        </div>
    </div>
</body>
</html>',
  'Bem-vindo(a) à LA Music Week!\n\nOlá {{nome_completo}},\n\nSeu email foi confirmado com sucesso! Agora você pode:\n\n• Explorar workshops de música\n• Fazer inscrições em eventos\n• Gerenciar seu perfil\n• Receber notificações\n\nUnidade: {{unit_name}}\n\nAcesse: {{platform_url}}\n\n© 2025 LA Music Week',
  '["nome_completo", "platform_url", "unit_name", "email"]',
  true
);

-- Template de Reset de Senha
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  variables,
  active
) VALUES (
  'password_reset',
  'Redefinir sua senha - LA Music Week',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Senha</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #8B5CF6;
            margin-bottom: 10px;
        }
        .title {
            color: #1F2937;
            font-size: 28px;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #DC2626;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #B91C1C;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .security-notice {
            background-color: #FEE2E2;
            border: 1px solid #DC2626;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎵 LA Music Week</div>
            <h1 class="title">Redefinir Senha</h1>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{nome_completo}}</strong>,</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta na LA Music Week.</p>
            
            <div style="text-align: center;">
                <a href="{{reset_url}}" class="button">Redefinir Senha</a>
            </div>
            
            <div class="security-notice">
                <strong>🔒 Informações de Segurança:</strong>
                <ul>
                    <li>Este link expira em 1 hora por motivos de segurança</li>
                    <li>Você pode usar este link apenas uma vez</li>
                    <li>Se não foi você quem solicitou, ignore este email</li>
                </ul>
            </div>
            
            <p>Se você não conseguir clicar no botão acima, copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">{{reset_url}}</p>
            
            <p><strong>Se você não solicitou esta redefinição de senha:</strong></p>
            <ul>
                <li>Sua conta permanece segura</li>
                <li>Nenhuma ação é necessária</li>
                <li>Considere alterar sua senha se suspeitar de atividade suspeita</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado automaticamente. Por favor, não responda.</p>
            <p>© 2025 LA Music Week. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>',
  'Redefinir Senha - LA Music Week\n\nOlá {{nome_completo}},\n\nRecebemos uma solicitação para redefinir sua senha.\n\nClique no link abaixo para redefinir:\n{{reset_url}}\n\nEste link expira em 1 hora.\n\nSe você não solicitou esta redefinição, ignore este email.\n\n© 2025 LA Music Week',
  '["nome_completo", "reset_url", "email"]',
  true
);

-- Comentário
COMMENT ON TABLE email_templates IS 'Templates de email com confirmação, boas-vindas e reset de senha';