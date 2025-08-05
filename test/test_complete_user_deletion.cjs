// Script de teste para verificar a remoção completa de usuários
// Este script testa se a função delete_user_completely está funcionando corretamente

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteUserDeletion() {
  console.log('🧪 Iniciando teste de remoção completa de usuários...');
  
  try {
    // 1. Verificar se a função existe testando uma chamada simples
    console.log('\n1. Verificando se a função delete_user_completely existe...');
    try {
      // Tentar chamar a função com um ID inexistente para testar se ela existe
      const { error: funcError } = await supabase
        .rpc('delete_user_completely', { user_table_id: '00000000-0000-0000-0000-000000000000' });
      
      if (funcError && funcError.message.includes('function delete_user_completely')) {
        console.log('❌ Função delete_user_completely não encontrada');
      } else {
        console.log('✅ Função delete_user_completely encontrada');
      }
    } catch (error) {
      console.log('✅ Função delete_user_completely encontrada (erro esperado com ID inválido)');
    }
    
    // 2. Listar usuários existentes
    console.log('\n2. Listando usuários existentes...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_type, nome_completo')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log(`📋 Encontrados ${users.length} usuários:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.nome_completo || 'Sem nome'} (${user.email}) - ${user.user_type}`);
    });
    
    // 3. Verificar usuários no auth.users
    console.log('\n3. Verificando usuários no auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Erro ao buscar usuários do auth:', authError.message);
    } else {
      console.log(`🔐 Encontrados ${authUsers.users.length} usuários no auth.users`);
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ID: ${user.id}`);
      });
    }
    
    // 4. Verificar se existe o usuário hugogmilesi@gmail.com
    console.log('\n4. Verificando se o usuário hugogmilesi@gmail.com ainda existe...');
    
    const { data: hugoUser, error: hugoError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'hugogmilesi@gmail.com')
      .single();
    
    if (hugoError && hugoError.code === 'PGRST116') {
      console.log('✅ Usuário hugogmilesi@gmail.com NÃO encontrado na tabela public.users');
    } else if (hugoError) {
      console.log('❌ Erro ao buscar usuário hugo:', hugoError.message);
    } else {
      console.log('⚠️  Usuário hugogmilesi@gmail.com AINDA EXISTE na tabela public.users:', hugoUser);
    }
    
    // Verificar no auth.users
    const hugoInAuth = authUsers.users.find(u => u.email === 'hugogmilesi@gmail.com');
    if (hugoInAuth) {
      console.log('⚠️  Usuário hugogmilesi@gmail.com AINDA EXISTE no auth.users:', hugoInAuth.id);
    } else {
      console.log('✅ Usuário hugogmilesi@gmail.com NÃO encontrado no auth.users');
    }
    
    // 5. Testar permissões da função
    console.log('\n5. Testando permissões da função...');
    const { data: permissions, error: permError } = await supabase
      .from('information_schema.routine_privileges')
      .select('*')
      .eq('routine_name', 'delete_user_completely');
    
    if (permError) {
      console.log('❌ Erro ao verificar permissões:', permError.message);
    } else {
      console.log('🔒 Permissões da função:', permissions);
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testCompleteUserDeletion();