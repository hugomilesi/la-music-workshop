// Configurações de email e domínio para o projeto

// Configurações do domínio
export const EMAIL_CONFIG = {
  // Domínio principal do projeto
  DOMAIN: 'latecnology.com.br',
  
  // Email remetente
  SENDER_EMAIL: 'team@latecnology.com.br',
  SENDER_NAME: 'LA-Music',
  
  // URLs de redirecionamento para produção
  PRODUCTION_URLS: {
    CONFIRM_EMAIL: 'https://latecnology.com.br/auth/callback',
    RESET_PASSWORD: 'https://latecnology.com.br/reset-password',
    DASHBOARD: 'https://latecnology.com.br/dashboard'
  },
  
  // URLs de redirecionamento para desenvolvimento
  DEVELOPMENT_URLS: {
    CONFIRM_EMAIL: 'http://localhost:5173/auth/callback',
    RESET_PASSWORD: 'http://localhost:5173/reset-password',
    DASHBOARD: 'http://localhost:5173/dashboard'
  },
  
  // Configurações SMTP do Resend
  SMTP: {
    HOST: 'smtp.resend.com',
    PORT: 465,
    USER: 'resend',
    PASSWORD: import.meta.env.VITE_RESEND_API_KEY
  }
};

// Função para obter URLs baseadas no ambiente
export function getEmailRedirectUrls() {
  const isProduction = window.location.hostname !== 'localhost';
  
  if (isProduction) {
    return {
      // Confirmação de email removida - não precisamos mais
      RESET_PASSWORD: 'https://latecnology.com.br/reset-password'
    };
  }
  
  return {
    // Confirmação de email removida - não precisamos mais
    RESET_PASSWORD: 'http://localhost:5173/reset-password'
  };
}

// Função para obter a URL base do site
export function getSiteUrl() {
  const isProduction = window.location.hostname === 'latecnology.com.br';
  
  return isProduction ? 'https://latecnology.com.br' : window.location.origin;
}

// Configurações para templates de email
export const EMAIL_TEMPLATES = {
  SITE_NAME: 'LA Music Week',
  COMPANY_NAME: 'LA-Music',
  SUPPORT_EMAIL: 'team@latecnology.com.br',
  
  // Variáveis padrão para templates
  DEFAULT_VARIABLES: {
    site_name: 'LA Music Week',
    company_name: 'LA-Music',
    support_email: 'team@latecnology.com.br',
    current_year: new Date().getFullYear().toString()
  }
};

// Configurações de rate limiting
export const EMAIL_LIMITS = {
  // Limite padrão do Supabase com SMTP customizado
  HOURLY_LIMIT: 30,
  
  // Intervalo mínimo entre emails (em segundos)
  MIN_INTERVAL: 1
};