-- Migração para configurar sistema de confirmação de email
-- Esta migração configura templates de email e funções para confirmação

-- Criar tabela para templates de email
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para logs de email
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name VARCHAR(100),
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campo de confirmação de email na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_confirmation_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_confirmation_sent_at TIMESTAMP WITH TIME ZONE;

-- Inserir templates de email padrão
INSERT INTO email_templates (name, subject, html_content, text_content, variables) VALUES
(
  'email_confirmation',
  'Confirme seu email - LA Music Week',
  '<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Confirme seu email</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎵 LA Music Week</h1>
        <p>Confirme seu email para continuar</p>
      </div>
      <div class="content">
        <h2>Olá, {{user_name}}!</h2>
        <p>Obrigado por se cadastrar na LA Music Week! Para completar seu cadastro e ter acesso a todas as funcionalidades, você precisa confirmar seu endereço de email.</p>
        <p>Clique no botão abaixo para confirmar seu email:</p>
        <a href="{{confirmation_url}}" class="button">Confirmar Email</a>
        <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #667eea;">{{confirmation_url}}</p>
        <p><strong>Este link expira em 24 horas.</strong></p>
        <p>Se você não se cadastrou na LA Music Week, pode ignorar este email.</p>
      </div>
      <div class="footer">
        <p>LA Music Week - Transformando vidas através da música</p>
        <p>Este é um email automático, não responda.</p>
      </div>
    </div>
  </body>
  </html>',
  'Olá, {{user_name}}!\n\nObrigado por se cadastrar na LA Music Week!\n\nPara completar seu cadastro, confirme seu email clicando no link abaixo:\n{{confirmation_url}}\n\nEste link expira em 24 horas.\n\nSe você não se cadastrou na LA Music Week, pode ignorar este email.\n\nLA Music Week - Transformando vidas através da música',
  '{"user_name": "Nome do usuário", "confirmation_url": "URL de confirmação"}'
),
(
  'password_reset',
  'Redefinir senha - LA Music Week',
  '<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Redefinir senha</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎵 LA Music Week</h1>
        <p>Redefinir sua senha</p>
      </div>
      <div class="content">
        <h2>Olá, {{user_name}}!</h2>
        <p>Você solicitou a redefinição da sua senha na LA Music Week.</p>
        <p>Clique no botão abaixo para redefinir sua senha:</p>
        <a href="{{reset_url}}" class="button">Redefinir Senha</a>
        <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #667eea;">{{reset_url}}</p>
        <p><strong>Este link expira em 1 hora.</strong></p>
        <p>Se você não solicitou a redefinição de senha, pode ignorar este email.</p>
      </div>
      <div class="footer">
        <p>LA Music Week - Transformando vidas através da música</p>
        <p>Este é um email automático, não responda.</p>
      </div>
    </div>
  </body>
  </html>',
  'Olá, {{user_name}}!\n\nVocê solicitou a redefinição da sua senha na LA Music Week.\n\nClique no link abaixo para redefinir sua senha:\n{{reset_url}}\n\nEste link expira em 1 hora.\n\nSe você não solicitou a redefinição de senha, pode ignorar este email.\n\nLA Music Week - Transformando vidas através da música',
  '{"user_name": "Nome do usuário", "reset_url": "URL de redefinição"}'
),
(
  'welcome_email',
  'Bem-vindo à LA Music Week! 🎵',
  '<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Bem-vindo</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎵 Bem-vindo à LA Music Week!</h1>
      </div>
      <div class="content">
        <h2>Olá, {{user_name}}!</h2>
        <p>Seja muito bem-vindo(a) à LA Music Week! Estamos muito felizes em tê-lo(a) conosco.</p>
        <p>Agora você pode:</p>
        <ul>
          <li>🎸 Explorar nossas oficinas musicais</li>
          <li>📅 Se inscrever em workshops</li>
          <li>🎵 Conectar-se com outros músicos</li>
          <li>📚 Acessar materiais exclusivos</li>
        </ul>
        <p>Sua unidade: <strong>{{unit_name}}</strong></p>
        <a href="{{dashboard_url}}" class="button">Acessar Dashboard</a>
        <p>Se você tiver alguma dúvida, nossa equipe está sempre pronta para ajudar!</p>
      </div>
      <div class="footer">
        <p>LA Music Week - Transformando vidas através da música</p>
        <p>Este é um email automático, não responda.</p>
      </div>
    </div>
  </body>
  </html>',
  'Olá, {{user_name}}!\n\nSeja muito bem-vindo(a) à LA Music Week!\n\nAgora você pode:\n- Explorar nossas oficinas musicais\n- Se inscrever em workshops\n- Conectar-se com outros músicos\n- Acessar materiais exclusivos\n\nSua unidade: {{unit_name}}\n\nAcesse seu dashboard: {{dashboard_url}}\n\nLA Music Week - Transformando vidas através da música',
  '{"user_name": "Nome do usuário", "unit_name": "Nome da unidade", "dashboard_url": "URL do dashboard"}'
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Criar função para gerar token de confirmação
CREATE OR REPLACE FUNCTION generate_email_confirmation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Criar função para confirmar email
CREATE OR REPLACE FUNCTION confirm_user_email(confirmation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  result JSONB;
BEGIN
  -- Buscar usuário pelo token
  SELECT * INTO user_record 
  FROM users 
  WHERE email_confirmation_token = confirmation_token
    AND email_confirmation_sent_at > NOW() - INTERVAL '24 hours'
    AND email_confirmed = false;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Token inválido ou expirado'
    );
  END IF;
  
  -- Confirmar email
  UPDATE users 
  SET 
    email_confirmed = true,
    email_confirmation_token = NULL,
    email_confirmation_sent_at = NULL,
    updated_at = NOW()
  WHERE id = user_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email confirmado com sucesso',
    'user_id', user_record.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar updated_at nas novas tabelas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS nas novas tabelas
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para email_templates (apenas usuários autenticados podem visualizar)
CREATE POLICY "Authenticated users can view email templates" ON email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage email templates" ON email_templates
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas RLS para email_logs
CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can view all email logs" ON email_logs
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "System can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

-- Conceder permissões básicas
GRANT SELECT ON email_templates TO anon, authenticated;
GRANT SELECT ON email_logs TO authenticated;
GRANT ALL ON email_templates TO service_role;
GRANT ALL ON email_logs TO service_role;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email_confirmation_token ON users(email_confirmation_token);
CREATE INDEX IF NOT EXISTS idx_users_email_confirmed ON users(email_confirmed);

COMMIT;