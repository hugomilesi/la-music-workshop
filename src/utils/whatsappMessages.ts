import { supabase } from '../lib/supabase';

interface CreateMessageParams {
  destinatario_id: string;
  conteudo: string;
  assunto?: string;
  remetente_id?: string;
}

export const createWhatsAppMessage = async (params: CreateMessageParams) => {
  try {
    // Se não foi fornecido remetente_id, usar o admin do sistema
    let remetente_id = params.remetente_id;
    if (!remetente_id) {
      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'admin@lamusicweek.com')
        .single();
      
      remetente_id = adminUser?.id;
    }

    const { data, error } = await supabase
      .from('mensagens')
      .insert({
        remetente_id: remetente_id,
        destinatario_id: params.destinatario_id,
        conteudo: params.conteudo,
        assunto: params.assunto || 'Mensagem WhatsApp',
        status_leitura: 'nao_lida',
        data_envio: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao criar mensagem WhatsApp:', error);
    return { success: false, error };
  }
};

export const createEnrollmentConfirmationMessage = async (
  telefone: string,
  nomeAluno: string,
  nomeOficina: string,
  dataOficina: string,
  horarioOficina: string,
  localOficina: string
) => {
  // Normalizar o telefone removendo o código do país se presente
  const normalizedPhone = telefone.startsWith('55') ? telefone.slice(2) : telefone;
  
  // Buscar o usuário pelo telefone (tentar ambos os formatos)
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('telefone', normalizedPhone)
    .single();

  // Se não encontrou, tentar com o telefone original
  if (userError || !user) {
    const { data: userAlt, error: userErrorAlt } = await supabase
      .from('users')
      .select('id')
      .eq('telefone', telefone)
      .single();
    
    user = userAlt;
    userError = userErrorAlt;
  }

  if (userError || !user) {
    console.error('Usuário não encontrado para o telefone:', telefone, 'ou', normalizedPhone);
    return { success: false, error: 'Usuário não encontrado' };
  }

  const conteudo = `🎵 *Confirmação de Inscrição - La Music Week* 🎵

Olá, ${nomeAluno}!

Sua inscrição foi confirmada com sucesso! ✅

📋 *Detalhes da Oficina:*
🎼 Oficina: ${nomeOficina}
📅 Data: ${dataOficina}
⏰ Horário: ${horarioOficina}
📍 Local: ${localOficina}

🎯 *Próximos Passos:*
• Chegue 15 minutos antes do horário
• Traga seu instrumento (se necessário)
• Em caso de dúvidas, entre em contato conosco

Nos vemos na oficina! 🎶

*Equipe La Music Week*`;

  return createWhatsAppMessage({
    destinatario_id: user.id,
    conteudo,
    assunto: 'Confirmação de Inscrição'
  });
};

export const createCancellationMessage = async (
  telefone: string,
  nomeAluno: string,
  nomeOficina: string
) => {
  // Normalizar o telefone removendo o código do país se presente
  const normalizedPhone = telefone.startsWith('55') ? telefone.slice(2) : telefone;
  
  // Buscar o usuário pelo telefone (tentar ambos os formatos)
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('telefone', normalizedPhone)
    .single();

  // Se não encontrou, tentar com o telefone original
  if (userError || !user) {
    const { data: userAlt, error: userErrorAlt } = await supabase
      .from('users')
      .select('id')
      .eq('telefone', telefone)
      .single();
    
    user = userAlt;
    userError = userErrorAlt;
  }

  if (userError || !user) {
    console.error('Usuário não encontrado para o telefone:', telefone, 'ou', normalizedPhone);
    return { success: false, error: 'Usuário não encontrado' };
  }

  const conteudo = `🎵 *Cancelamento de Inscrição - La Music Week* 🎵

Olá, ${nomeAluno}!

Sua inscrição na oficina "${nomeOficina}" foi cancelada conforme solicitado.

💡 *Lembre-se:*
• Você pode se inscrever em outras oficinas disponíveis
• Acesse nossa plataforma para ver novas oportunidades
• Em caso de dúvidas, entre em contato conosco

Esperamos vê-lo em breve em outras atividades! 🎶

*Equipe La Music Week*`;

  return createWhatsAppMessage({
    destinatario_id: user.id,
    conteudo,
    assunto: 'Cancelamento de Inscrição'
  });
};

export const createReminderMessage = async (
  telefone: string,
  nomeAluno: string,
  nomeOficina: string,
  dataOficina: string,
  horarioOficina: string,
  localOficina: string
) => {
  // Normalizar o telefone removendo o código do país se presente
  const normalizedPhone = telefone.startsWith('55') ? telefone.slice(2) : telefone;
  
  // Buscar o usuário pelo telefone (tentar ambos os formatos)
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('telefone', normalizedPhone)
    .single();

  // Se não encontrou, tentar com o telefone original
  if (userError || !user) {
    const { data: userAlt, error: userErrorAlt } = await supabase
      .from('users')
      .select('id')
      .eq('telefone', telefone)
      .single();
    
    user = userAlt;
    userError = userErrorAlt;
  }

  if (userError || !user) {
    console.error('Usuário não encontrado para o telefone:', telefone, 'ou', normalizedPhone);
    return { success: false, error: 'Usuário não encontrado' };
  }

  const conteudo = `🎵 *Lembrete - La Music Week* 🎵

Olá, ${nomeAluno}!

Este é um lembrete da sua oficina que acontece amanhã! 📅

🎼 *Detalhes:*
📋 Oficina: ${nomeOficina}
📅 Data: ${dataOficina}
⏰ Horário: ${horarioOficina}
📍 Local: ${localOficina}

⚠️ *Lembretes Importantes:*
• Chegue 15 minutos antes
• Traga seu instrumento (se necessário)
• Confirme sua presença respondendo esta mensagem

Nos vemos lá! 🎶

*Equipe La Music Week*`;

  return createWhatsAppMessage({
    destinatario_id: user.id,
    conteudo,
    assunto: 'Lembrete de Oficina'
  });
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Se não tem código do país, adiciona 55 (Brasil)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `55${cleaned.slice(1)}`;
  }
  
  if (cleaned.length === 11) {
    return `55${cleaned}`;
  }
  
  if (cleaned.length === 10) {
    return `55${cleaned}`;
  }
  
  // Se já tem código do país
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return cleaned;
  }
  
  return cleaned;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Verifica se tem pelo menos 10 dígitos (DDD + número)
  if (cleaned.length < 10) return false;
  
  // Verifica se tem no máximo 13 dígitos (código país + DDD + número)
  if (cleaned.length > 13) return false;
  
  return true;
};