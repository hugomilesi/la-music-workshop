const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xfqgcfeoswlkcgdtikco.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI'
);

async function checkPolicies() {
  try {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'unidades');
    
    console.log('Políticas unidades:', JSON.stringify(data, null, 2));
    console.log('Error:', error);
  } catch (err) {
    console.error('Erro:', err);
  }
}

checkPolicies();