// Script para testar a remoção completa do usuário hugogmilesi@gmail.com
// Este script simula o que acontece quando um admin remove um usuário

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDeleteHugoUser() {
  console.log('🧪 Testando remoção completa do usuário hugogmilesi@gmail.com...');
  
  try {
    // 1. Buscar o usuário Hugo
    console.log('\n1. Buscando dados do usuário Hugo...');
    const { data: hugoUser, error: hugoError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'hugogmilesi@gmail.com')
      .single();
    
    if (hugoError) {
      console.log('❌ Usuário Hugo não encontrado:', hugoError.message);
      return;
    }
    
    console.log('✅ Usuário Hugo encontrado:');
    console.log(`   ID: ${hugoUser.id}`);
    console.log(`   Auth ID: ${hugoUser.user_id}`);
    console.log(`   Email: ${hugoUser.email}`);
    console.log(`   Nome: ${hugoUser.nome_completo}`);
    
    // 2. Verificar inscrições do usuário
    console.log('\n2. Verificando inscrições do usuário...');
    const { data: inscricoes, error: inscricoesError } = await supabase
      .from('inscricoes')
      .select('*')
      .eq('user_id', hugoUser.id);
    
    if (inscricoesError) {
      console.log('❌ Erro ao buscar inscrições:', inscricoesError.message);
    } else {
      console.log(`📝 Encontradas ${inscricoes.length} inscrições`);
    }
    
    // 3. Simular a remoção usando nossa função
    console.log('\n3. Executando função de remoção completa...');
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('delete_user_completely', { user_table_id: hugoUser.id });
    
    if (deleteError) {
      console.log('❌ Erro na função de remoção:', deleteError.message);
      return;
    }
    
    console.log('✅ Função de remoção executada com sucesso:', deleteResult);
    
    // 4. Verificar se foi removido do public.users
    console.log('\n4. Verificando remoção do public.users...');
    const { data: checkUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'hugogmilesi@gmail.com')
      .single();
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('✅ Usuário removido com sucesso do public.users');
    } else if (checkError) {
      console.log('❌ Erro ao verificar remoção:', checkError.message);
    } else {
      console.log('⚠️  Usuário AINDA EXISTE no public.users:', checkUser);
    }
    
    // 5. Remover do auth.users
    console.log('\n5. Removendo do auth.users...');
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
      hugoUser.user_id
    );
    
    if (authDeleteError) {
      console.log('❌ Erro ao remover do auth.users:', authDeleteError.message);
    } else {
      console.log('✅ Usuário removido com sucesso do auth.users');
    }
    
    // 6. Verificação final
    console.log('\n6. Verificação final...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Erro ao listar usuários do auth:', authError.message);
    } else {
      const hugoInAuth = authUsers.users.find(u => u.email === 'hugogmilesi@gmail.com');
      if (hugoInAuth) {
        console.log('⚠️  Usuário AINDA EXISTE no auth.users');
      } else {
        console.log('✅ Usuário COMPLETAMENTE removido do sistema!');
      }
    }
    
    console.log('\n🎉 Teste de remoção completa finalizado!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testDeleteHugoUser();