// Teste do fluxo de confirmação de email
// Este script simula o processo completo de registro e confirmação

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailConfirmationFlow() {
  console.log('🧪 Iniciando teste do fluxo de confirmação de email');
  
  try {
    // 1. Verificar configuração atual
    console.log('\n1. Verificando configuração atual...');
    const { data: currentSession } = await supabase.auth.getSession();
    console.log('Sessão atual:', currentSession.session ? 'Ativa' : 'Nenhuma');
    
    // 2. Simular registro com email de teste
    console.log('\n2. Testando registro...');
    const testEmail = `teste_${Date.now()}@exemplo.com`;
    const testPassword = 'senha123456';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:5173/auth/callback'
      }
    });
    
    if (signUpError) {
      console.error('❌ Erro no registro:', signUpError);
      return;
    }
    
    console.log('✅ Registro realizado:', {
      user: signUpData.user ? 'Criado' : 'Não criado',
      session: signUpData.session ? 'Ativa' : 'Pendente confirmação',
      needsConfirmation: !signUpData.session
    });
    
    // 3. Verificar usuário na tabela auth.users
    console.log('\n3. Verificando usuário na tabela auth.users...');
    if (signUpData.user) {
      // Usar service role para consultar auth.users
      const supabaseAdmin = createClient(
        supabaseUrl, 
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI'
      );
      
      const { data: authUser, error: authUserError } = await supabaseAdmin
        .from('auth.users')
        .select('email, email_confirmed_at, confirmation_sent_at')
        .eq('id', signUpData.user.id)
        .single();
        
      if (authUserError) {
        console.error('❌ Erro ao consultar auth.users:', authUserError);
      } else {
        console.log('📧 Status do usuário:', {
          email: authUser.email,
          emailConfirmed: !!authUser.email_confirmed_at,
          confirmationSent: !!authUser.confirmation_sent_at
        });
      }
    }
    
    // 4. Simular diferentes cenários de callback
    console.log('\n4. Testando cenários de callback...');
    
    // Cenário 1: URL com token_hash
    console.log('\n📋 Cenário 1: URL com token_hash');
    const mockTokenHashUrl = 'http://localhost:5173/auth/callback?token_hash=exemplo123&type=email';
    console.log('URL simulada:', mockTokenHashUrl);
    
    // Cenário 2: URL com access_token e refresh_token
    console.log('\n📋 Cenário 2: URL com tokens de acesso');
    const mockTokenUrl = 'http://localhost:5173/auth/callback?access_token=exemplo&refresh_token=exemplo&type=email';
    console.log('URL simulada:', mockTokenUrl);
    
    // Cenário 3: URL com código
    console.log('\n📋 Cenário 3: URL com código');
    const mockCodeUrl = 'http://localhost:5173/auth/callback?code=exemplo123';
    console.log('URL simulada:', mockCodeUrl);
    
    console.log('\n✅ Teste concluído. Verifique os logs acima para identificar problemas.');
    console.log('\n💡 Próximos passos:');
    console.log('1. Verificar se o email de confirmação foi enviado');
    console.log('2. Clicar no link do email e observar os logs do console');
    console.log('3. Verificar se a URL de redirecionamento está correta');
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  }
}

// Executar o teste
testEmailConfirmationFlow();

// Função para testar callback manual
window.testCallback = async function(url) {
  console.log('🔧 Testando callback manual com URL:', url);
  
  const urlParams = new URLSearchParams(new URL(url).search);
  const token_hash = urlParams.get('token_hash');
  const type = urlParams.get('type');
  const access_token = urlParams.get('access_token');
  const refresh_token = urlParams.get('refresh_token');
  const code = urlParams.get('code');
  
  console.log('Parâmetros extraídos:', {
    token_hash: !!token_hash,
    type,
    access_token: !!access_token,
    refresh_token: !!refresh_token,
    code: !!code
  });
  
  // Testar diferentes métodos
  if (token_hash) {
    console.log('🔐 Testando verifyOtp...');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type || 'email'
      });
      console.log('Resultado verifyOtp:', { data, error });
    } catch (error) {
      console.error('Erro verifyOtp:', error);
    }
  }
  
  if (access_token && refresh_token) {
    console.log('🔑 Testando setSession...');
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token
      });
      console.log('Resultado setSession:', { data, error });
    } catch (error) {
      console.error('Erro setSession:', error);
    }
  }
  
  if (code) {
    console.log('🔄 Testando exchangeCodeForSession...');
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      console.log('Resultado exchangeCodeForSession:', { data, error });
    } catch (error) {
      console.error('Erro exchangeCodeForSession:', error);
    }
  }
};

console.log('\n🛠️ Funções disponíveis:');
console.log('- testCallback(url): Testa callback manual com uma URL');
console.log('Exemplo: testCallback("http://localhost:5173/auth/callback?token_hash=abc123&type=email")');