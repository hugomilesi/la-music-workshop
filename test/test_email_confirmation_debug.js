// Script de debug para testar o fluxo de confirmação de email
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const checkSupabaseConfig = async () => {
  console.log('URL do projeto:', process.env.SUPABASE_URL);
  console.log('Chave anônima:', process.env.SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada');
};

const checkCurrentSession = async () => {
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Erro ao obter sessão:', error);
    } else {
      console.log('Sessão atual:', session ? 'Ativa' : 'Nenhuma');
      if (session) {
        console.log('  - ID do usuário:', session.user.id);
        console.log('  - Email:', session.user.email);
        console.log('  - Email confirmado em:', session.user.email_confirmed_at);
        console.log('  - Criado em:', session.user.created_at);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar sessão:', error);
  }
  
};

const checkRecentUsers = async () => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
    } else {
      console.log(`Encontrados ${users.length} usuários recentes:`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} - Confirmado: ${user.email_confirmed ? '✅' : '❌'} - Criado: ${user.created_at}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  }
  
};

const testUserRegistration = async () => {
  const testEmail = `teste_${Date.now()}@exemplo.com`;
  const testPassword = 'MinhaSenh@123';
  
  console.log(`Email de teste: ${testEmail}`);
  console.log('Senha de teste: MinhaSenh@123');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome_completo: 'Usuário Teste',
          telefone: '(11) 99999-9999',
          data_nascimento: '1990-01-01',
          unit_id: 1
        },
        emailRedirectTo: `${process.env.SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });
    
    if (error) {
      console.error('❌ Erro no registro:', error);
    } else {
      console.log('✅ Registro realizado com sucesso!');
      console.log('  - ID do usuário:', data.user?.id);
      console.log('  - Email:', data.user?.email);
      console.log('  - Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
      console.log('  - Sessão criada:', data.session ? 'Sim' : 'Não');
      
      // Verificar se foi criado na tabela users
      if (data.user?.id) {
        console.log('\n5. 🔍 Verificando criação na tabela users...');
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
          
        if (profileError) {
          console.error('❌ Erro ao buscar perfil:', profileError);
        } else {
          console.log('✅ Perfil encontrado na tabela users:');
          console.log('  - Nome:', userProfile.nome_completo);
          console.log('  - Email confirmado:', userProfile.email_confirmed ? '✅' : '❌');
          console.log('  - Tipo de usuário:', userProfile.user_type);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro durante o teste de registro:', error);
  }
  
};

// Função para testar URL de callback
const testCallbackUrl = () => {
  console.log('🔗 === TESTE DE URL DE CALLBACK ===');
  
  const currentUrl = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  
  console.log('URL atual:', currentUrl);
  console.log('\nParâmetros da URL:');
  for (const [key, value] of urlParams.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  
  console.log('\nParâmetros do Hash:');
  for (const [key, value] of hashParams.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  
  // Verificar parâmetros específicos
  const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');
  const type = urlParams.get('type') || hashParams.get('type');
  const error = urlParams.get('error') || hashParams.get('error');
  
  console.log('\nParâmetros de confirmação:');
  console.log('  token_hash:', tokenHash || 'Não encontrado');
  console.log('  type:', type || 'Não encontrado');
  console.log('  error:', error || 'Nenhum erro');
  
  if (tokenHash && type === 'email') {
    console.log('✅ URL de callback válida detectada!');
    return true;
  } else {
    console.log('❌ URL de callback inválida ou incompleta');
    return false;
  }
};

// Função para testar confirmação manual
const testManualConfirmation = async (tokenHash, type = 'email') => {
  console.log('🔧 === TESTE DE CONFIRMAÇÃO MANUAL ===');
  
  if (!tokenHash) {
    console.error('❌ token_hash é obrigatório');
    return;
  }
  
  try {
    const { data, error } = await window.supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type
    });
    
    if (error) {
      console.error('❌ Erro na confirmação manual:', error);
    } else {
      console.log('✅ Confirmação manual bem-sucedida!');
      console.log('  - Usuário:', data.user?.email);
      console.log('  - Sessão criada:', data.session ? 'Sim' : 'Não');
    }
  } catch (error) {
    console.error('❌ Erro durante confirmação manual:', error);
  }
};

// Executar testes automaticamente no Node.js
async function runTests() {
  console.log('🧪 Iniciando testes de confirmação de email...');
  
  try {
    console.log('\n1️⃣ Verificando configuração do Supabase...');
    await checkSupabaseConfig();
    
    console.log('\n2️⃣ Verificando sessão atual...');
    await checkCurrentSession();
    
    console.log('\n3️⃣ Verificando usuários recentes...');
    await checkRecentUsers();
    
    console.log('\n4️⃣ Testando registro de usuário...');
    await testUserRegistration();
    
    console.log('\n✅ Testes concluídos!');
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar testes
runTests();