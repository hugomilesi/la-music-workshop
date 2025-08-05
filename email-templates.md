# Templates de Email - LA Music Week

Este arquivo contém os templates de email em HTML para serem configurados no Supabase.

## 1. Template de Confirmação de Email

**Nome do Template:** `confirm_signup`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirme seu email - LA Music Week</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .content h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }
        .content p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .music-note {
            font-size: 24px;
            margin: 0 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://raw.githubusercontent.com/your-repo/assets/main/lamusic.png" alt="LA Music" style="height: 60px; margin-bottom: 10px;">
            <h1>LA Music Week</h1>
        </div>
        <div class="content">
            <h2>Confirme seu email</h2>
            <p>Olá! Obrigado por se cadastrar na LA Music Week.</p>
            <p>Para completar seu cadastro e ter acesso às oficinas incríveis que preparamos, clique no botão abaixo para confirmar seu email:</p>
            <a href="{{ .ConfirmationURL }}" class="btn" style="color: white !important;">Confirmar Email</a>
            <p style="margin-top: 30px; font-size: 14px; color: #999;">
                Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
            </p>
        </div>
        <div class="footer">
            <p>🎼 Prepare-se para uma semana incrível de música! 🎼</p>
            <p>LA Music Week - Onde a música ganha vida</p>
        </div>
    </div>
</body>
</html>
```

## 2. Template de Recuperação de Senha

**Nome do Template:** `recovery`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar senha - LA Music Week</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .content h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }
        .content p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://raw.githubusercontent.com/your-repo/assets/main/lamusic.png" alt="LA Music" style="height: 60px; margin-bottom: 10px;">
            <h1>LA Music Week</h1>
        </div>
        <div class="content">
            <h2>Recuperar senha</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
            <a href="{{ .ConfirmationURL }}" class="btn" style="color: white !important;">Redefinir Senha</a>
            <div class="warning">
                <strong>⚠️ Importante:</strong> Este link expira em 1 hora por motivos de segurança.
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #999;">
                Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
            </p>
            <p style="font-size: 14px; color: #999;">
                Se você não solicitou esta alteração, pode ignorar este email com segurança.
            </p>
        </div>
        <div class="footer">
            <p>🎼 Sua segurança é nossa prioridade 🎼</p>
            <p>LA Music Week - Onde a música ganha vida</p>
        </div>
    </div>
</body>
</html>
```

## 3. Template de Convite

**Nome do Template:** `invite`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite - LA Music Week</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .content h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }
        .content p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .highlight {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://raw.githubusercontent.com/your-repo/assets/main/lamusic.png" alt="LA Music" style="height: 60px; margin-bottom: 10px;">
            <h1>LA Music Week</h1>
        </div>
        <div class="content">
            <h2>Você foi convidado!</h2>
            <p>Olá! Você recebeu um convite especial para participar da <span class="highlight">LA Music Week</span>.</p>
            <p>Junte-se a nós nesta experiência musical única com oficinas incríveis, networking e muito aprendizado!</p>
            <a href="{{ .ConfirmationURL }}" class="btn" style="color: white !important;">Aceitar Convite</a>
            <p style="margin-top: 30px; font-size: 14px; color: #999;">
                Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
            </p>
        </div>
        <div class="footer">
            <p>🎼 Uma semana que vai transformar sua relação com a música! 🎼</p>
            <p>LA Music Week - Onde a música ganha vida</p>
        </div>
    </div>
</body>
</html>
```

## 4. Template de Mudança de Email

**Nome do Template:** `email_change`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmar mudança de email - LA Music Week</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .content h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }
        .content p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .info-box {
            background: #e3f2fd;
            border: 1px solid #90caf9;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #1565c0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://raw.githubusercontent.com/your-repo/assets/main/lamusic.png" alt="LA Music" style="height: 60px; margin-bottom: 10px;">
            <h1>LA Music Week</h1>
        </div>
        <div class="content">
            <h2>Confirmar mudança de email</h2>
            <p>Você solicitou a alteração do email da sua conta na LA Music Week.</p>
            <div class="info-box">
                <strong>📧 Novo email:</strong> {{ .Email }}
            </div>
            <p>Para confirmar esta alteração, clique no botão abaixo:</p>
            <a href="{{ .ConfirmationURL }}" class="btn" style="color: white !important;">Confirmar Novo Email</a>
            <p style="margin-top: 30px; font-size: 14px; color: #999;">
                Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
            </p>
            <p style="font-size: 14px; color: #999;">
                Se você não solicitou esta alteração, entre em contato conosco imediatamente.
            </p>
        </div>
        <div class="footer">
            <p>🎼 Mantendo suas informações sempre atualizadas 🎼</p>
            <p>LA Music Week - Onde a música ganha vida</p>
        </div>
    </div>
</body>
</html>
```

## Como configurar no Supabase

1. Acesse o painel do Supabase
2. Vá em **Authentication** > **Email Templates**
3. Para cada template acima:
   - Selecione o tipo de template correspondente
   - Copie o código HTML
   - Cole no editor do Supabase
   - Salve as alterações

## Variáveis disponíveis

- `{{ .ConfirmationURL }}` - URL de confirmação
- `{{ .Email }}` - Email do usuário
- `{{ .Token }}` - Token de confirmação
- `{{ .SiteURL }}` - URL do site

## Notas importantes

- Os templates usam design responsivo
- Cores e estilo seguem a identidade visual da LA Music Week
- Todos os templates incluem fallback para links que não funcionam
- Textos em português brasileiro
- Design moderno com gradientes e sombras