import { useEffect } from 'react';
import { useAutomatedReminders } from '../hooks/useAutomatedReminders';

/**
 * Componente de serviço para gerenciar lembretes automáticos
 * Este componente deve ser incluído na raiz da aplicação para
 * inicializar automaticamente o processamento de lembretes
 */
const ReminderService: React.FC = () => {
  const { startAutomatedProcessing } = useAutomatedReminders();

  useEffect(() => {
    // Iniciar o processamento automático quando a aplicação carregar
    console.log('Iniciando serviço de lembretes automáticos...');
    startAutomatedProcessing();

    // Cleanup não é necessário aqui pois o hook já gerencia isso
  }, []); // Array vazio para executar apenas uma vez

  // Este componente não renderiza nada visível
  return null;
};

export default ReminderService;