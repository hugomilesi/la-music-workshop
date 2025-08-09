import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { useToast } from '../contexts/ToastContext';

interface ReminderData {
  lembrete_id: string;
  inscricao_id: string;
  user_id: string;
  titulo: string;
  mensagem: string;
  workshop_titulo: string;
}

export const useAutomatedReminders = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { showToast } = useToast();

  // Função para processar lembretes de 2 dias antes
  const processReminders2Days = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('obter_lembretes_periodo', { p_periodo: '2 days' });

      if (error) {
        console.error('Erro ao buscar lembretes de 2 dias:', error);
        showToast({ 
          type: 'error', 
          title: 'Erro', 
          message: 'Erro ao buscar lembretes de 2 dias' 
        });
        return;
      }

      if (data && data.length > 0) {
        console.log(`Processando ${data.length} lembretes de 2 dias`);
        showToast({ 
          type: 'info', 
          title: 'Processando', 
          message: `Processando ${data.length} lembretes de 2 dias` 
        });
        
        for (const reminder of data as ReminderData[]) {
          await processReminder(reminder);
        }
        
        showToast({ 
          type: 'success', 
          title: 'Concluído', 
          message: `${data.length} lembretes de 2 dias processados` 
        });
      } else {
        showToast({ 
          type: 'info', 
          title: 'Nenhum lembrete', 
          message: 'Nenhum lembrete de 2 dias para processar' 
        });
      }
    } catch (error) {
      console.error('Erro ao processar lembretes de 2 dias:', error);
      showToast({ 
        type: 'error', 
        title: 'Erro', 
        message: 'Erro ao processar lembretes de 2 dias' 
      });
    }
  }, [showToast]);

  // Função para processar lembretes de 8 horas antes
  const processReminders8Hours = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('obter_lembretes_periodo', { p_periodo: '8 hours' });

      if (error) {
        console.error('Erro ao buscar lembretes de 8 horas:', error);
        showToast({ 
          type: 'error', 
          title: 'Erro', 
          message: 'Erro ao buscar lembretes de 8 horas' 
        });
        return;
      }

      if (data && data.length > 0) {
        console.log(`Processando ${data.length} lembretes de 8 horas`);
        showToast({ 
          type: 'info', 
          title: 'Processando', 
          message: `Processando ${data.length} lembretes de 8 horas` 
        });
        
        for (const reminder of data as ReminderData[]) {
          await processReminder(reminder);
        }
        
        showToast({ 
          type: 'success', 
          title: 'Concluído', 
          message: `${data.length} lembretes de 8 horas processados` 
        });
      } else {
        showToast({ 
          type: 'info', 
          title: 'Nenhum lembrete', 
          message: 'Nenhum lembrete de 8 horas para processar' 
        });
      }
    } catch (error) {
      console.error('Erro ao processar lembretes de 8 horas:', error);
      showToast({ 
        type: 'error', 
        title: 'Erro', 
        message: 'Erro ao processar lembretes de 8 horas' 
      });
    }
  }, [showToast]);

  // Função para processar um lembrete individual
  const processReminder = useCallback(async (reminder: ReminderData) => {
    try {
      // Buscar dados do usuário para obter o telefone
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('telefone, nome')
        .eq('id', reminder.user_id)
        .single();

      if (userError || !userData?.telefone) {
        console.error('Erro ao buscar dados do usuário:', userError);
        showToast({ 
          type: 'error', 
          title: 'Erro', 
          message: `Telefone não encontrado para usuário ${reminder.user_id}` 
        });
        return;
      }

      // Enviar mensagem WhatsApp
      const message = `${reminder.titulo}\n\n${reminder.mensagem}\n\nOficina: ${reminder.workshop_titulo}`;
      
      const success = await sendWhatsAppMessage(userData.telefone, message);
      
      if (success) {
        // Marcar como enviado
        const { error: markError } = await supabase
          .rpc('marcar_lembrete_enviado', {
            p_lembrete_id: reminder.lembrete_id,
            p_inscricao_id: reminder.inscricao_id
          });

        if (markError) {
          console.error('Erro ao marcar lembrete como enviado:', markError);
          showToast({ 
            type: 'error', 
            title: 'Erro', 
            message: 'Erro ao marcar lembrete como enviado' 
          });
        } else {
          console.log(`Lembrete enviado com sucesso para ${userData.nome}`);
        }
      } else {
        console.error('Falha ao enviar mensagem WhatsApp');
        showToast({ 
          type: 'error', 
          title: 'Erro', 
          message: `Falha ao enviar mensagem para ${userData.telefone}` 
        });
      }
    } catch (error) {
      console.error('Erro ao processar lembrete individual:', error);
      showToast({ 
        type: 'error', 
        title: 'Erro', 
        message: 'Erro ao processar lembrete' 
      });
    }
  }, [showToast]);

  // Função principal para processar todos os lembretes
  const processAllReminders = useCallback(async () => {
    console.log('Iniciando processamento de lembretes automatizados...');
    showToast({ 
      type: 'info', 
      title: 'Processando', 
      message: 'Iniciando processamento de lembretes automatizados' 
    });
    await processReminders2Days();
    await processReminders8Hours();
    console.log('Processamento de lembretes concluído.');
    showToast({ 
      type: 'success', 
      title: 'Concluído', 
      message: 'Processamento de lembretes concluído' 
    });
  }, [processReminders2Days, processReminders8Hours, showToast]);

  // Função para iniciar o processamento automático
  const startAutomatedProcessing = useCallback(() => {
    if (intervalRef.current) {
      showToast({ 
        type: 'warning', 
        title: 'Aviso', 
        message: 'Processamento automático já está ativo' 
      });
      return; // Já está rodando
    }
    
    console.log('Iniciando processamento automático de lembretes...');
    showToast({ 
      type: 'success', 
      title: 'Ativado', 
      message: 'Processamento automático de lembretes iniciado' 
    });
    
    // Processar imediatamente
    processAllReminders();
    
    // Configurar intervalo para processar a cada 30 minutos
    intervalRef.current = setInterval(() => {
      processAllReminders();
    }, 30 * 60 * 1000); // 30 minutos
  }, [processAllReminders, showToast]);

  // Função para parar o processamento automático
  const stopAutomatedProcessing = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Processamento automático de lembretes parado');
      showToast({ 
        type: 'info', 
        title: 'Parado', 
        message: 'Processamento automático de lembretes foi parado' 
      });
    } else {
      showToast({ 
        type: 'warning', 
        title: 'Aviso', 
        message: 'Processamento automático não estava ativo' 
      });
    }
  }, [showToast]);

  // Limpar intervalo quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Array vazio para evitar re-execuções desnecessárias

  return {
    processAllReminders,
    processReminders2Days,
    processReminders8Hours,
    startAutomatedProcessing,
    stopAutomatedProcessing
  };
};