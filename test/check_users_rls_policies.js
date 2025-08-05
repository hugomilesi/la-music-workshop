import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI';

// Cliente com service role (admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsersTable() {
  console.log('🔍 Verificando tabela users e suas permissões...');
  
  try {
    // Primeiro, vamos tentar fazer uma operação simples na tabela users
    console.log('\n1. Testando acesso à tabela users...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro ao acessar tabela users:', usersError);
    } else {
      console.log('✅ Acesso à tabela users funcionando');
      console.log('📊 Número de registros encontrados:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('📋 Exemplo de registro:');
        console.log(JSON.stringify(users[0], null, 2));
      }
    }

    // Verificar estrutura da tabela usando uma query diferente
    console.log('\n2. Verificando estrutura da tabela users...');
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .order('ordinal_position');

    if (tableError) {
      console.error('❌ Erro ao verificar estrutura da tabela:', tableError);
    } else {
      console.log('📋 Estrutura da tabela users:');
      tableInfo?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
      });
    }

    // Verificar tabela unidades para entender o relacionamento
    console.log('\n3. Verificando tabela unidades...');
    const { data: unidades, error: unidadesError } = await supabaseAdmin
      .from('unidades')
      .select('*')
      .limit(3);
    
    if (unidadesError) {
      console.error('❌ Erro ao acessar tabela unidades:', unidadesError);
    } else {
      console.log('✅ Tabela unidades encontrada');
      console.log('📊 Unidades disponíveis:', unidades?.length || 0);
      if (unidades && unidades.length > 0) {
        console.log('📋 Exemplo de unidade:');
        console.log(JSON.stringify(unidades[0], null, 2));
      }
    }

    // Tentar inserir um registro de teste com dados corretos
    console.log('\n4. Testando inserção na tabela users com dados corretos...');
    
    // Primeiro, vamos pegar uma unidade válida
    let validUnitId = 1; // default
    if (unidades && unidades.length > 0) {
      validUnitId = unidades[0].id;
    }
    
    const testUser = {
      user_id: '00000000-0000-0000-0000-000000000001', // UUID válido
      email: 'test@test.com',
      nome_completo: 'Teste RLS',
      telefone: '11999999999',
      data_nascimento: '1990-01-01',
      unit_id: validUnitId, // Usar ID válido da unidade
      user_type: 'student',
      email_confirmed: false
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(testUser)
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir usuário de teste:', insertError);
      console.log('🔧 Detalhes do erro:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Inserção de teste funcionando');
      console.log('📋 Dados inseridos:', insertData);
      
      // Limpar o registro de teste
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('user_id', testUser.user_id);
      
      if (deleteError) {
        console.error('❌ Erro ao remover registro de teste:', deleteError);
      } else {
        console.log('🧹 Registro de teste removido');
      }
    }

    // Testar com cliente anônimo
    console.log('\n5. Testando acesso com cliente anônimo...');
    const supabaseAnon = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0');
    
    const { data: anonUsers, error: anonError } = await supabaseAnon
      .from('users')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.error('❌ Cliente anônimo não consegue acessar tabela users:', anonError);
      console.log('🔧 Isso pode indicar que as políticas RLS estão muito restritivas');
    } else {
      console.log('✅ Cliente anônimo consegue acessar tabela users');
    }

    // Testar inserção com cliente anônimo
    console.log('\n6. Testando inserção com cliente anônimo...');
    const anonTestUser = {
      user_id: '00000000-0000-0000-0000-000000000002',
      email: 'anon@test.com',
      nome_completo: 'Teste Anônimo',
      telefone: '11888888888',
      data_nascimento: '1995-01-01',
      unit_id: validUnitId,
      user_type: 'student',
      email_confirmed: false
    };

    const { data: anonInsertData, error: anonInsertError } = await supabaseAnon
      .from('users')
      .insert(anonTestUser)
      .select();

    if (anonInsertError) {
      console.error('❌ Cliente anônimo não consegue inserir na tabela users:', anonInsertError);
      console.log('🔧 Isso indica que as políticas RLS estão bloqueando inserções anônimas');
    } else {
      console.log('✅ Cliente anônimo consegue inserir na tabela users');
      
      // Limpar o registro de teste
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('user_id', anonTestUser.user_id);
      console.log('🧹 Registro de teste anônimo removido');
    }

  } catch (err) {
    console.error('💥 Erro inesperado:', err);
  }
}

// Executar a verificação
checkUsersTable();