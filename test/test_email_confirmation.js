// Teste para verificar o processo de confirmação de email
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function testEmailConfirmation() {
  console.log('🧪 Testando processo de confirmação de email...');
  
  try {
    // Verificar configuração atual
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('📊 Sessão atual:', {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
      email: sessionData.session?.user?.email,
      emailConfirmed: sessionData.session?.user?.email_confirmed_at
    });
    
    // Verificar usuários na tabela auth.users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(3);
      
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
    } else {
      console.log('👥 Usuários encontrados:', users?.length || 0);
      users?.forEach(user => {
        console.log(`  - ${user.nome_completo} (${user.email}) - Confirmado: ${user.email_confirmed}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testEmailConfirmation();