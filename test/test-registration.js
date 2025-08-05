// Script de teste para verificar o processo de registro
// Execute este script no console do navegador na página de registro

const testRegistration = async () => {
  console.log('🧪 Iniciando teste de registro...');
  
  // Dados de teste
  const testData = {
    name: 'Teste Usuario',
    email: 'teste@example.com',
    phone: '67999999999',
    birthDate: '1990-01-01',
    unit: 'campo_grande',
    password: 'teste123',
    confirmPassword: 'teste123'
  };
  
  console.log('📝 Dados de teste:', testData);
  
  try {
    // Simular preenchimento do formulário
    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');
    const phoneInput = document.querySelector('input[name="phone"]');
    const birthDateInput = document.querySelector('input[name="birthDate"]');
    const unitSelect = document.querySelector('select[name="unit"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');
    
    if (nameInput) nameInput.value = testData.name;
    if (emailInput) emailInput.value = testData.email;
    if (phoneInput) phoneInput.value = testData.phone;
    if (birthDateInput) birthDateInput.value = testData.birthDate;
    if (unitSelect) unitSelect.value = testData.unit;
    if (passwordInput) passwordInput.value = testData.password;
    if (confirmPasswordInput) confirmPasswordInput.value = testData.confirmPassword;
    
    console.log('✅ Formulário preenchido');
    
    // Aguardar um pouco antes de submeter
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Encontrar e clicar no botão de submit
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      console.log('🚀 Submetendo formulário...');
      submitButton.click();
    } else {
      console.error('❌ Botão de submit não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
};

// Função para monitorar logs do console
const monitorLogs = () => {
  console.log('👀 Monitorando logs do processo de registro...');
  console.log('📧 Verifique se o email de confirmação foi enviado para hugogmilesi@gmail.com');
  console.log('🔍 Observe os logs do AuthContext e emailService');
};

console.log('🧪 Script de teste carregado!');
console.log('📋 Para executar o teste, chame: testRegistration()');
console.log('👀 Para monitorar logs, chame: monitorLogs()');