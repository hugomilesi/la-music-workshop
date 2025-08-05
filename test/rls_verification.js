import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0';

// Cliente com service role (admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cliente com anon key (público)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testRLSVerification() {
  console.log('🔍 INICIANDO VERIFICAÇÃO GERAL DE RLS\n');
  
  try {
    // 1. Verificar estrutura das tabelas principais
    console.log('📋 1. VERIFICANDO ESTRUTURA DAS TABELAS');
    const tables = ['users', 'workshops', 'inscricoes', 'unidades', 'pagamentos', 'convidados'];
    
    for (const table of tables) {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Erro ao acessar tabela ${table}:`, error.message);
      } else {
        console.log(`✅ Tabela ${table}: Acessível`);
      }
    }
    
    // 2. Verificar acesso público (anon)
    console.log('\n🌐 2. VERIFICANDO ACESSO PÚBLICO (ANON)');
    
    // Workshops devem ser visíveis publicamente
    const { data: workshopsPublic, error: workshopsError } = await supabaseAnon
      .from('workshops')
      .select('id, nome, descricao, preco')
      .limit(5);
    
    if (workshopsError) {
      console.log('❌ Workshops não acessíveis publicamente:', workshopsError.message);
    } else {
      console.log(`✅ Workshops públicos: ${workshopsPublic.length} encontrados`);
    }
    
    // Unidades devem ser visíveis publicamente
    const { data: unidadesPublic, error: unidadesError } = await supabaseAnon
      .from('unidades')
      .select('id, nome, endereco')
      .limit(5);
    
    if (unidadesError) {
      console.log('❌ Unidades não acessíveis publicamente:', unidadesError.message);
    } else {
      console.log(`✅ Unidades públicas: ${unidadesPublic.length} encontradas`);
    }
    
    // 3. Verificar relacionamentos
    console.log('\n🔗 3. VERIFICANDO RELACIONAMENTOS');
    
    // Workshops com unidades
    const { data: workshopsWithUnits, error: workshopsUnitsError } = await supabaseAdmin
      .from('workshops')
      .select(`
        id, nome, unit_id,
        unidades:unit_id(id, nome)
      `)
      .limit(3);
    
    if (workshopsUnitsError) {
      console.log('❌ Erro no relacionamento workshops-unidades:', workshopsUnitsError.message);
    } else {
      console.log(`✅ Relacionamento workshops-unidades: ${workshopsWithUnits.length} registros`);
      workshopsWithUnits.forEach(w => {
        console.log(`   - Workshop: ${w.nome} | Unidade: ${w.unidades?.nome || 'N/A'}`);
      });
    }
    
    // Inscrições com usuários e workshops
    const { data: inscricoesWithData, error: inscricoesError } = await supabaseAdmin
      .from('inscricoes')
      .select(`
        id, participant_name, status_inscricao,
        users:user_id(id, nome_completo, email),
        workshops:workshop_id(id, nome)
      `)
      .limit(3);
    
    if (inscricoesError) {
      console.log('❌ Erro no relacionamento inscrições:', inscricoesError.message);
    } else {
      console.log(`✅ Relacionamento inscrições: ${inscricoesWithData.length} registros`);
      inscricoesWithData.forEach(i => {
        console.log(`   - Participante: ${i.participant_name} | Workshop: ${i.workshops?.nome || 'N/A'}`);
      });
    }
    
    // 4. Verificar constraints e validações
    console.log('\n⚡ 4. VERIFICANDO CONSTRAINTS E VALIDAÇÕES');
    
    // Verificar constraint de idade em convidados
    const { data: convidados, error: convidadosError } = await supabaseAdmin
      .from('convidados')
      .select('id, nome, idade')
      .limit(5);
    
    if (convidadosError) {
      console.log('❌ Erro ao acessar convidados:', convidadosError.message);
    } else {
      console.log(`✅ Convidados: ${convidados.length} registros`);
      convidados.forEach(c => {
        if (c.idade < 5 || c.idade > 18) {
          console.log(`⚠️  Idade inválida encontrada: ${c.nome} - ${c.idade} anos`);
        }
      });
    }
    
    // 5. Verificar funcionalidades específicas do sistema
    console.log('\n🎯 5. VERIFICANDO FUNCIONALIDADES ESPECÍFICAS');
    
    // Verificar se usuários têm unidades válidas
    const { data: usersWithUnits, error: usersUnitsError } = await supabaseAdmin
      .from('users')
      .select(`
        id, nome_completo, user_type, unit_id,
        unidades:unit_id(id, nome)
      `)
      .limit(5);
    
    if (usersUnitsError) {
      console.log('❌ Erro no relacionamento users-unidades:', usersUnitsError.message);
    } else {
      console.log(`✅ Usuários com unidades: ${usersWithUnits.length} registros`);
      usersWithUnits.forEach(u => {
        console.log(`   - ${u.nome_completo} (${u.user_type}) | Unidade: ${u.unidades?.nome || 'SEM UNIDADE'}`);
        if (!u.unidades && u.user_type === 'student') {
          console.log(`⚠️  Estudante sem unidade: ${u.nome_completo}`);
        }
      });
    }
    
    // Verificar workshops por unidade
    const { data: workshopsByUnit, error: workshopsByUnitError } = await supabaseAdmin
      .from('workshops')
      .select(`
        id, nome, unit_id, status,
        unidades:unit_id(nome)
      `)
      .eq('status', 'ativa')
      .limit(10);
    
    if (workshopsByUnitError) {
      console.log('❌ Erro ao buscar workshops por unidade:', workshopsByUnitError.message);
    } else {
      console.log(`\n📍 Workshops ativos por unidade:`);
      const unitGroups = {};
      workshopsByUnit.forEach(w => {
        const unitName = w.unidades?.nome || 'SEM UNIDADE';
        if (!unitGroups[unitName]) unitGroups[unitName] = [];
        unitGroups[unitName].push(w.nome);
      });
      
      Object.entries(unitGroups).forEach(([unit, workshops]) => {
        console.log(`   ${unit}: ${workshops.length} workshops`);
        workshops.forEach(w => console.log(`     - ${w}`));
      });
    }
    
    // 6. Verificar permissões de escrita
    console.log('\n✍️  6. VERIFICANDO PERMISSÕES DE ESCRITA');
    
    // Tentar inserir com anon (deve falhar)
    const { error: anonInsertError } = await supabaseAnon
      .from('users')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        user_type: 'student',
        nome_completo: 'Teste Anon',
        email: 'teste@anon.com'
      });
    
    if (anonInsertError) {
      console.log('✅ Inserção anônima bloqueada corretamente:', anonInsertError.message);
    } else {
      console.log('❌ PROBLEMA: Inserção anônima permitida quando deveria ser bloqueada!');
    }
    
    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
testRLSVerification();