import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI';

// Cliente anônimo (como usado no frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Cliente admin (para limpeza)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Dados de teste que simulam o que vem do formulário
const testFormData = {
  email: 'teste.cadastro@example.com',
  password: 'senha123456',
  nomeCompleto: 'Usuário de Teste',
  telefone: '11987654321',
  dataNascimento: '1995-05-15',
  unitId: '8f424adf-64ca-43e9-909c-8dfd6783ac15' // Barra
};

// Simular a função signUp do AuthContext
async function simulateSignUp(email, password, userData) {
  console.log('🔄 Simulando cadastro de usuário:', { email, userData });
  
  try {
    // Criar usuário no Supabase Auth COM envio automático de email
    console.log('📧 Tentando criar usuário no Supabase Auth...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${supabaseUrl}/auth/callback` // Simular redirect
      },
    });
    
    if (error) {
      console.error('❌ Erro no cadastro Supabase Auth:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText
      });
      return { error };
    }
    
    console.log('✅ Usuário criado no Supabase Auth:', data.user?.id);
  
    // Se o cadastro foi bem-sucedido e temos dados do usuário
    if (data.user && userData) {
      try {
        console.log('👤 Processando dados do perfil do usuário...');
        
        // Primeiro verificar se o usuário já existe na tabela users
        console.log('🔍 Verificando se usuário já existe na tabela users...');
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Erro ao verificar usuário existente:', checkError);
          return { error: { message: 'Erro ao verificar usuário', details: checkError } };
        }

        if (existingUser) {
          // Usuário já existe, vamos atualizá-lo
          console.log('🔄 Usuário já existe, atualizando dados...');
          const { error: updateError } = await supabase
            .from('users')
            .update({
              user_type: userData.userType || 'student',
              nome_completo: userData.nome_completo,
              telefone: userData.telefone,
              data_nascimento: userData.data_nascimento,
              unit_id: userData.unit_id,
              email_confirmed: false
            })
            .eq('user_id', data.user.id);

          if (updateError) {
            console.error('❌ Erro ao atualizar usuário:', updateError);
            return { error: { message: 'Erro ao atualizar dados do usuário', details: updateError } };
          }
          console.log('✅ Dados do usuário atualizados com sucesso');
        } else {
          // Usuário não existe, vamos criá-lo
          console.log('➕ Criando novo perfil de usuário...');
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              user_id: data.user.id,
              email: data.user.email,
              nome_completo: userData.nome_completo,
              telefone: userData.telefone,
              data_nascimento: userData.data_nascimento,
              unit_id: userData.unit_id,
              user_type: 'student',
              email_confirmed: false
            });

          if (profileError) {
            console.error('❌ Erro ao criar perfil:', profileError);
            console.error('❌ Detalhes completos do erro:', {
              code: profileError.code,
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint
            });
            return { error: { message: 'Erro ao criar perfil do usuário', details: profileError } };
          }
          console.log('✅ Perfil do usuário criado com sucesso');
        }

        console.log('📧 Email de confirmação enviado automaticamente pelo Supabase');
        
      } catch (profileError) {
        console.error('❌ Erro ao processar cadastro:', profileError);
        return { 
          error: { 
            message: 'Erro ao processar cadastro',
            details: profileError
          } 
        };
      }
    }
    
    console.log('✅ Cadastro concluído com sucesso');
    return { error: null, user: data.user };
    
  } catch (generalError) {
    console.error('❌ Erro geral durante o cadastro:', generalError);
    return { 
      error: { 
        message: 'Erro inesperado durante o cadastro',
        details: generalError
      } 
    };
  }
}

async function testRegisterProcess() {
  console.log('🧪 Iniciando teste do processo de cadastro...');
  console.log('📋 Dados de teste:', testFormData);
  
  try {
    // Limpar qualquer usuário de teste existente primeiro
    console.log('\n🧹 Limpando dados de teste anteriores...');
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('email', testFormData.email);
    
    // Tentar deletar do auth também (pode falhar, mas não é problema)
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const testUser = authUsers.users.find(u => u.email === testFormData.email);
      if (testUser) {
        await supabaseAdmin.auth.admin.deleteUser(testUser.id);
        console.log('🧹 Usuário removido do auth');
      }
    } catch (authCleanError) {
      console.log('ℹ️ Não foi possível limpar auth (normal se usuário não existir)');
    }
    
    // Simular o processo de cadastro
    console.log('\n🚀 Executando processo de cadastro...');
    const result = await simulateSignUp(
      testFormData.email,
      testFormData.password,
      {
        nome_completo: testFormData.nomeCompleto,
        telefone: testFormData.telefone,
        data_nascimento: testFormData.dataNascimento,
        unit_id: testFormData.unitId
      }
    );
    
    if (result.error) {
      console.error('❌ Processo de cadastro falhou:', result.error);
      
      // Verificar se é erro 400
      if (result.error.details?.status === 400 || result.error.details?.code === '400') {
        console.log('🎯 ERRO 400 IDENTIFICADO! Este é o problema que o usuário está enfrentando.');
      }
    } else {
      console.log('✅ Processo de cadastro bem-sucedido!');
      console.log('👤 Usuário criado:', result.user?.id);
      
      // Verificar se o perfil foi criado corretamente
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('user_id', result.user.id)
        .single();
      
      if (profile) {
        console.log('✅ Perfil criado corretamente:', {
          id: profile.id,
          email: profile.email,
          nome_completo: profile.nome_completo,
          unit_id: profile.unit_id
        });
      }
    }
    
  } catch (err) {
    console.error('💥 Erro inesperado no teste:', err);
  } finally {
    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('email', testFormData.email);
    console.log('✅ Limpeza concluída');
  }
}

// Executar o teste
testRegisterProcess();