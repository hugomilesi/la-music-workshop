import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI';

// Cliente com service role (admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔐 VERIFICAÇÃO DETALHADA DE POLÍTICAS RLS\n');
  
  try {
    // 1. Verificar políticas RLS via SQL direto
    console.log('📋 1. VERIFICANDO POLÍTICAS