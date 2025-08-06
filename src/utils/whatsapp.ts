// Utilitário para envio de mensagens WhatsApp via Evolution API

interface WhatsAppMessage {
  number: string;
  text: string;
}

interface EvolutionAPIResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Configurações da Evolution API (devem vir de variáveis de ambiente)
const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://evola.latecnology.com.br/';
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '61E65C47B0D4-44D1-919D-C6137E824D77';
const EVOLUTION_INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE || 'Hugo Teste';

/**
 * Envia uma mensagem WhatsApp via Evolution API
 * @param phoneNumber - Número do telefone (formato: 5521999999999)
 * @param message - Mensagem a ser enviada
 * @returns Promise com resultado do envio
 */
export async function sendWhatsAppMessage(
  phoneNumber: string, 
  message: string
): Promise<EvolutionAPIResponse> {
  try {
    // Limpar e formatar o número de telefone
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Garantir que o número tenha o código do país (55 para Brasil)
    const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    
    const payload: WhatsAppMessage = {
      number: formattedNumber,
      text: message
    };

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erro HTTP ${response.status}: ${errorData.message || 'Erro desconhecido'}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      message: 'Mensagem enviada com sucesso'
    };
  } catch (error: any) {
    console.error('Erro ao enviar WhatsApp:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao enviar WhatsApp'
    };
  }
}

/**
 * Cria uma mensagem de confirmação de inscrição
 * @param studentName - Nome do aluno
 * @param workshopName - Nome da oficina
 * @param workshopDate - Data da oficina
 * @param isGratuita - Se a oficina é gratuita
 * @returns Mensagem formatada
 */
export function createEnrollmentConfirmationMessage(
  studentName: string,
  workshopName: string,
  workshopDate: string,
  isGratuita: boolean = false
): string {
  const baseMessage = `🎵 *LA MUSIC WEEK* 🎵\n\n` +
    `Olá! Sua inscrição foi confirmada com sucesso! ✅\n\n` +
    `👤 *Aluno:* ${studentName}\n` +
    `🎼 *Oficina:* ${workshopName}\n` +
    `📅 *Data:* ${workshopDate}\n\n`;

  if (isGratuita) {
    return baseMessage +
      `💰 *Valor:* GRATUITA\n\n` +
      `Você já está inscrito! Nos vemos na oficina! 🎶\n\n` +
      `Para mais informações, entre em contato conosco.\n\n` +
      `🎵 LA MUSIC WEEK - Onde a música acontece! 🎵`;
  } else {
    return baseMessage +
      `💰 *Status:* Aguardando pagamento\n\n` +
      `Em breve você receberá as instruções de pagamento por e-mail.\n\n` +
      `Para mais informações, entre em contato conosco.\n\n` +
      `🎵 LA MUSIC WEEK - Onde a música acontece! 🎵`;
  }
}

/**
 * Envia mensagem de confirmação de inscrição
 * @param phoneNumber - Número do telefone
 * @param studentName - Nome do aluno
 * @param workshopName - Nome da oficina
 * @param workshopDate - Data da oficina
 * @param isGratuita - Se a oficina é gratuita
 * @returns Promise com resultado do envio
 */
export async function sendEnrollmentConfirmation(
  phoneNumber: string,
  studentName: string,
  workshopName: string,
  workshopDate: string,
  isGratuita: boolean = false
): Promise<EvolutionAPIResponse> {
  const message = createEnrollmentConfirmationMessage(
    studentName,
    workshopName,
    workshopDate,
    isGratuita
  );
  
  return await sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Cria uma mensagem de confirmação de cadastro
 * @param studentName - Nome do aluno
 * @returns Mensagem formatada
 */
export function createRegistrationConfirmationMessage(
  studentName: string
): string {
  return `🎵 *LA MUSIC WEEK* 🎵\n\n` +
    `Olá ${studentName}! Bem-vindo(a) à LA MUSIC WEEK! 🎉\n\n` +
    `Seu cadastro foi realizado com sucesso! ✅\n\n` +
    `📧 *IMPORTANTE:* Verifique sua caixa de entrada e clique no link de confirmação do email para ativar sua conta.\n\n` +
    `Após confirmar seu email, você poderá:\n` +
    `🎼 Navegar pelas oficinas disponíveis\n` +
    `📝 Se inscrever nas oficinas de sua escolha\n` +
    `👤 Gerenciar seu perfil\n\n` +
    `Estamos ansiosos para vê-lo(a) em nossas oficinas! 🎶\n\n` +
    `🎵 LA MUSIC WEEK - Onde a música acontece! 🎵`;
}

/**
 * Envia mensagem de confirmação de cadastro
 * @param phoneNumber - Número do telefone
 * @param studentName - Nome do aluno
 * @returns Promise com resultado do envio
 */
export async function sendRegistrationConfirmation(
  phoneNumber: string,
  studentName: string
): Promise<EvolutionAPIResponse> {
  const message = createRegistrationConfirmationMessage(studentName);
  
  return await sendWhatsAppMessage(phoneNumber, message);
}