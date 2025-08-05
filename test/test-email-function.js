// Script para testar a Edge Function de envio de emails
// Execute este script no console do navegador

const testEmailFunction = async () => {
  console.log('🧪 Testando Edge Function de envio de emails...');
  
  const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI';
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        from: 'LA Music Week <onboarding@resend.dev>',
        to: ['hugogmilesi@gmail.com'],
        subject: '[TESTE] Email de confirmação - Teste direto da Edge Function',
        html: '<h1>Teste de Email</h1><p>Este é um teste direto da Edge Function de envio de emails.</p>',
        text: 'Teste de Email - Este é um teste direto da Edge Function de envio de emails.'
      })
    });
    
    const result = await response.json();
    
    console.log('📧 Resposta da Edge Function:', {
      status: response.status,
      ok: response.ok,
      result: result
    });
    
    if (response.ok && result.success) {
      console.log('✅ Email enviado com sucesso!');
      console.log('📧 ID da mensagem:', result.messageId);
    } else {
      console.error('❌ Erro ao enviar email:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
};

// Função para testar o emailService diretamente
const testEmailService = async () => {
  console.log('🧪 Testando emailService...');
  
  // Verificar se o emailService está disponível
  if (typeof window.emailService === 'undefined') {
    console.error('❌ emailService não está disponível no window');
    console.log('💡 Tente executar este teste na página de registro');
    return;
  }
  
  try {
    const result = await window.emailService.sendConfirmationEmail(
      'teste@example.com',
      'Usuário Teste',
      'test-user-id'
    );
    
    console.log('📧 Resultado do emailService:', result);
    
    if (result) {
      console.log('✅ Email de confirmação enviado com sucesso!');
    } else {
      console.error('❌ Falha ao enviar email de confirmação');
    }
    
  } catch (error) {
    console.error('❌ Erro no emailService:', error);
  }
};

console.log('🧪 Scripts de teste de email carregados!');
console.log('📋 Para testar a Edge Function diretamente: testEmailFunction()');
console.log('📋 Para testar o emailService: testEmailService()');