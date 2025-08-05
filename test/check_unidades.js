import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI';

// Cliente com service role (admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Unidades hardcoded no Register.tsx
const UNIDADES_HARDCODED = [
  { id: '8f424adf-64ca-43e9-909c-8dfd6783ac15', nome: 'Barra' },
  { id: '19df29a0-83ba-4b1e-a2f7-cb3ac8d25b4f', nome: 'Campo Grande' },
  { id: 'a4e3815c-8a34-4ef1-9773-cdeabdce1003', nome: 'Recreio' }
];

async function checkUnidades() {
  console.log('🔍 Verificando unidades no banco de dados...');
  
  try {
    // Buscar todas as unidades do banco
    const { data: unidadesBanco, error } = await supabaseAdmin
      .from('unidades')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('❌ Erro ao buscar unidades:', error);
      return;
    }

    console.log('\n📋 Unidades no banco de dados:');
    unidadesBanco?.forEach((unidade, index) => {
      console.log(`${index + 1}. ID: ${unidade.id}`);
      console.log(`   Nome: ${unidade.nome}`);
      console.log(`   Ativa: ${unidade.ativa}`);
      console.log('');
    });

    console.log('\n📋 Unidades hardcoded no Register.tsx:');
    UNIDADES_HARDCODED.forEach((unidade, index) => {
      console.log(`${index + 1}. ID: ${unidade.id}`);
      console.log(`   Nome: ${unidade.nome}`);
      console.log('');
    });

    console.log('\n🔍 Verificando correspondências...');
    
    // Verificar se os IDs hardcoded existem no banco
    for (const unidadeHardcoded of UNIDADES_HARDCODED) {
      const unidadeEncontrada = unidadesBanco?.find(u => u.id === unidadeHardcoded.id);
      
      if (unidadeEncontrada) {
        console.log(`✅ ${unidadeHardcoded.nome} (${unidadeHardcoded.id}) - ENCONTRADA no banco`);
        if (unidadeEncontrada.nome !== unidadeHardcoded.nome) {
          console.log(`   ⚠️ Nome diferente no banco: "${unidadeEncontrada.nome}"`);
        }
      } else {
        console.log(`❌ ${unidadeHardcoded.nome} (${unidadeHardcoded.id}) - NÃO ENCONTRADA no banco`);
      }
    }

    // Verificar se há unidades no banco que não estão no hardcode
    console.log('\n🔍 Unidades no banco que não estão no hardcode:');
    const idsHardcoded = UNIDADES_HARDCODED.map(u => u.id);
    const unidadesNaoHardcoded = unidadesBanco?.filter(u => !idsHardcoded.includes(u.id));
    
    if (unidadesNaoHardcoded && unidadesNaoHardcoded.length > 0) {
      unidadesNaoHardcoded.forEach(unidade => {
        console.log(`⚠️ ${unidade.nome} (${unidade.id}) - Existe no banco mas não no hardcode`);
      });
    } else {
      console.log('✅ Todas as unidades do banco estão no hardcode');
    }

    // Testar inserção com uma unidade real
    console.log('\n🧪 Testando inserção com unidade real...');
    if (unidadesBanco && unidadesBanco.length > 0) {
      const unidadeReal = unidadesBanco[0];
      
      const testUser = {
        user_id: '00000000-0000-0000-0000-000000000003',
        email: 'test-unidade@test.com',
        nome_completo: 'Teste Unidade Real',
        telefone: '11777777777',
        data_nascimento: '1992-01-01',
        unit_id: unidadeReal.id, // Usar ID real da unidade
        user_type: 'student',
        email_confirmed: false
      };

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('users')
        .insert(testUser)
        .select();

      if (insertError) {
        console.error('❌ Erro ao inserir com unidade real:', insertError);
      } else {
        console.log('✅ Inserção com unidade real funcionou!');
        console.log(`📋 Unidade usada: ${unidadeReal.nome} (${unidadeReal.id})`);
        
        // Limpar o registro de teste
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('user_id', testUser.user_id);
        console.log('🧹 Registro de teste removido');
      }
    }

  } catch (err) {
    console.error('💥 Erro inesperado:', err);
  }
}

// Executar a verificação
checkUnidades();