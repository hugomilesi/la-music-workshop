// Test script to debug Supabase connection issues
import { supabase, supabaseAdmin } from '../src/lib/supabase.js';

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    console.log('📡 Teste 1: Conexão básica com supabase client');
    const { data: data1, error: error1 } = await supabase
      .from('workshops')
      .select('count')
      .limit(1);
    
    console.log('✅ Resultado supabase client:', { data: data1, error: error1 });
  } catch (err) {
    console.error('❌ Erro supabase client:', err);
  }
  
  try {
    console.log('📡 Teste 2: Conexão básica com supabaseAdmin client');
    const { data: data2, error: error2 } = await supabaseAdmin
      .from('workshops')
      .select('count')
      .limit(1);
    
    console.log('✅ Resultado supabaseAdmin client:', { data: data2, error: error2 });
  } catch (err) {
    console.error('❌ Erro supabaseAdmin client:', err);
  }
  
  try {
    console.log('📡 Teste 3: Query simples de workshops');
    const { data: data3, error: error3 } = await supabaseAdmin
      .from('workshops')
      .select('id, nome')
      .limit(3);
    
    console.log('✅ Resultado workshops:', { data: data3, error: error3 });
  } catch (err) {
    console.error('❌ Erro workshops:', err);
  }
}

// Execute the test
testSupabaseConnection();