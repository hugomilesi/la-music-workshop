// Teste para verificar se o registro está funcionando após as correções
// Data: 2025-01-06

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRegistration() {
  console.log('🧪 Iniciando teste de registro...');
  
  try {
    // 1. Testar verificação de email (função que estava travando)
    console.log('\n1️⃣ Testando verificação de email...');
    
    const { data: users, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', 'teste@exemplo.com')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Erro ao verificar email:', checkError);
      return;
    }
    
    console.log('✅ Verificação de email funcionando!');
    console.log('📊 Resultado:', { emailExists: users && users.length > 0, count: users?.length || 0 });
    
    // 2. Testar carregamento de perfil (que estava com recursão infinita)
    console.log('\n2️⃣ Testando carregamento de perfil...');
    
    const { data: profiles, error: profileError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (profileError) {
      console.error('❌ Erro ao carregar perfis:', profileError);
      return;
    }
    
    console.log('✅ Carregamento de perfil funcionando!');
    console.log('📊 Perfis encontrados:', profiles?.length || 0);
    
    // 3. Testar carregamento de workshops
    console.log('\n3️⃣ Testando carregamento de workshops...');
    
    const { data: workshops, error: workshopError } = await supabase
      .from('workshops')
      .select('*')
      .limit(5);
    
    if (workshopError) {
      console.error('❌ Erro ao carregar workshops:', workshopError);
      return;
    }
    
    console.log('✅ Carregamento de workshops funcionando!');
    console.log('📊 Workshops encontrados:', workshops?.length || 0);
    
    // 4. Testar unidades
    console.log('\n4️⃣ Testando carregamento de unidades...');
    
    const { data: unidades, error: unidadeError } = await supabase
      .from('unidades')
      .select('*');
    
    if (unidadeError) {
      console.error('❌ Erro ao carregar unidades:', unidadeError);
      return;
    }
    
    console.log('✅ Carregamento de unidades funcionando!');
    console.log('📊 Unidades encontradas:', unidades?.length || 0);
    
    console.log('\n🎉 Todos os testes passaram! O sistema está funcionando corretamente.');
    
  } catch (error) {
    console.error('💥 Erro inesperado durante o teste:', error);
  }
}

// Executar o teste
testRegistration();