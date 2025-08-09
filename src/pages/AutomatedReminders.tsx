import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAutomatedReminders } from '../hooks/useAutomatedReminders';
import Card from '../components/Card';
import Button from '../components/Button';

interface ReminderForm {
  workshop_id: string;
  tipo_lembrete: 'confirmacao_inscricao' | 'lembrete_evento' | 'pos_evento';
  periodo_disparo: number;
  titulo: string;
  mensagem: string;
  ativo: boolean;
}

interface TestMessageForm {
  numero: string;
  mensagem: string;
}

interface CustomReminderForm {
  nome: string;
  periodo_minutos: number;
  mensagem: string;
  ativo: boolean;
}

const AutomatedReminders: React.FC = () => {
  const {
    workshops,
    automatedReminders,
    messages,
    loading,
    fetchWorkshops,
    fetchAutomatedReminders,
    fetchMessages,
    createReminder,
    updateReminder,
    deleteReminder,
    processAutomatedReminders
  } = useStore();

  const {
    processAllReminders,
    processReminders2Days,
    processReminders8Hours,
    startAutomatedProcessing,
    stopAutomatedProcessing
  } = useAutomatedReminders();

  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>('');
  const [testMode, setTestMode] = useState(false);
  const [processingReminders, setProcessingReminders] = useState(false);
  const [showTestMessage, setShowTestMessage] = useState(false);
  const [showCustomReminder, setShowCustomReminder] = useState(false);
  const [sendingTestMessage, setSendingTestMessage] = useState(false);
  const [autoProcessingActive, setAutoProcessingActive] = useState(false);

  const [formData, setFormData] = useState<ReminderForm>({
    workshop_id: '',
    tipo_lembrete: 'confirmacao_inscricao',
    periodo_disparo: 48,
    titulo: '',
    mensagem: '',
    ativo: true
  });

  const [testMessageData, setTestMessageData] = useState<TestMessageForm>({
    numero: '',
    mensagem: 'Olá! Esta é uma mensagem de teste do sistema LA Music Week.'
  });

  const [customReminderData, setCustomReminderData] = useState<CustomReminderForm>({
    nome: '',
    periodo_minutos: 30,
    mensagem: '',
    ativo: true
  });

  useEffect(() => {
    fetchWorkshops();
    fetchAutomatedReminders();
    fetchMessages();
  }, []);

  // Função para criar lembretes de exemplo
  const createExampleReminders = async () => {
    if (workshops.length === 0) {
      alert('Nenhum workshop encontrado. Crie um workshop primeiro.');
      return;
    }

    const firstWorkshop = workshops[0];
    
    try {
      // Lembrete 2 dias antes
      await createReminder({
        workshop_id: firstWorkshop.id,
        tipo_lembrete: 'lembrete_evento',
        periodo_disparo: 48, // 2 dias = 48 horas
        titulo: 'Lembrete: Evento em 2 dias!',
        mensagem: `Olá! Seu evento "${firstWorkshop.titulo}" acontecerá em 2 dias. Não esqueça de se preparar!`,
        ativo: true
      });

      // Lembrete 8 horas antes
      await createReminder({
        workshop_id: firstWorkshop.id,
        tipo_lembrete: 'lembrete_evento',
        periodo_disparo: 8, // 8 horas
        titulo: 'Lembrete: Evento hoje!',
        mensagem: `Olá! Seu evento "${firstWorkshop.titulo}" acontecerá em algumas horas. Prepare-se!`,
        ativo: true
      });

      alert('Lembretes de exemplo criados com sucesso!');
      fetchAutomatedReminders();
    } catch (error) {
      console.error('Erro ao criar lembretes de exemplo:', error);
      alert('Erro ao criar lembretes de exemplo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReminder) {
        await updateReminder(editingReminder, formData);
      } else {
        await createReminder(formData);
      }
      resetForm();
    } catch (error) {
      alert('Erro ao salvar lembrete');
    }
  };

  const resetForm = () => {
    setFormData({
      workshop_id: '',
      tipo_lembrete: 'confirmacao_inscricao',
      periodo_disparo: 48,
      titulo: '',
      mensagem: '',
      ativo: true
    });
    setShowForm(false);
    setEditingReminder(null);
  };

  const sendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTestMessage(true);
    
    try {
      const response = await fetch('https://evola.latecnology.com.br/message/sendText/Hugo Teste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: testMessageData.numero,
          text: testMessageData.mensagem
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Mensagem enviada com sucesso!');
        
        // Salvar no banco de dados
        try {
          // TODO: Implementar sendMessage no store
          // await sendMessage({
          //   remetente_id: 'system',
          //   destinatario_id: 'test',
          //   conteudo: testMessageData.mensagem,
          //   tipo: 'whatsapp',
          //   status: 'enviada',
          //   numero_destinatario: testMessageData.numero
          // });
        } catch (dbError) {
          // Erro ao salvar no banco, mas mensagem foi enviada
        }
        
        setTestMessageData({ numero: '', mensagem: 'Olá! Esta é uma mensagem de teste do sistema LA Music Week.' });
        setShowTestMessage(false);
      } else {
        // Tratar erros específicos da API
        if (result.response && result.response.message) {
          const errorMsg = result.response.message[0];
          if (!errorMsg.exists) {
            throw new Error(`Número ${errorMsg.number} não existe no WhatsApp`);
          }
        }
        throw new Error(result.message || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      if (error.message.includes('não existe no WhatsApp')) {
        alert('Erro: ' + error.message + '. Verifique se o número está correto e possui WhatsApp ativo.');
      } else {
        alert('Erro ao enviar mensagem: ' + error.message);
      }
    } finally {
      setSendingTestMessage(false);
    }
  };

  const createCustomReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createReminder({
        workshop_id: null,
        tipo_lembrete: 'lembrete_evento',
        periodo_disparo: customReminderData.periodo_minutos,
        titulo: customReminderData.nome,
        mensagem: customReminderData.mensagem,
        ativo: customReminderData.ativo
      });
      
      alert('Lembrete customizado criado com sucesso!');
      setCustomReminderData({ nome: '', periodo_minutos: 30, mensagem: '', ativo: true });
      setShowCustomReminder(false);
    } catch (error) {
      alert('Erro ao criar lembrete customizado');
    }
  };

  const handleEdit = (reminder: any) => {
    setFormData({
      workshop_id: reminder.workshop_id,
      tipo_lembrete: reminder.tipo_lembrete,
      periodo_disparo: reminder.periodo_disparo,
      titulo: reminder.titulo,
      mensagem: reminder.mensagem,
      ativo: reminder.ativo
    });
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReminder) return;
    
    try {
      await updateReminder(editingReminder.id, {
        workshop_id: editingReminder.workshop_id,
        tipo_lembrete: editingReminder.tipo_lembrete,
        periodo_disparo: editingReminder.periodo_disparo,
        titulo: editingReminder.titulo,
        mensagem: editingReminder.mensagem,
        ativo: editingReminder.ativo
      });
      setEditingReminder(null);
      alert('Lembrete atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar lembrete');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lembrete?')) {
      try {
        await deleteReminder(id);
      } catch (error) {
        alert('Erro ao excluir lembrete');
      }
    }
  };

  const handleTestReminders = async () => {
    setProcessingReminders(true);
    try {
      await processAutomatedReminders();
      alert('Lembretes processados com sucesso!');
    } catch (error) {
      console.error('Erro ao processar lembretes:', error);
      alert('Erro ao processar lembretes');
    } finally {
      setProcessingReminders(false);
    }
  };

  const filteredReminders = selectedWorkshop
    ? automatedReminders.filter(r => r.workshop_id === selectedWorkshop)
    : automatedReminders;

  const tiposLembrete = [
    { value: 'confirmacao_inscricao', label: 'Confirmação de Inscrição' },
    { value: 'lembrete_evento', label: 'Lembrete do Evento' },
    { value: 'pos_evento', label: 'Pós Evento' }
  ];

  const periodosDisparo = [
    { value: 0.5, label: '30 minutos antes' },
    { value: 2, label: '2 horas antes' },
    { value: 8, label: '8 horas antes' },
    { value: 24, label: '1 dia antes' },
    { value: 48, label: '2 dias antes' },
    { value: 168, label: '1 semana antes' }
  ];

  const periodosCustom = [
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 360, label: '6 horas' },
    { value: 720, label: '12 horas' },
    { value: 1440, label: '1 dia' },
    { value: 2880, label: '2 dias' },
    { value: 10080, label: '1 semana' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Lembretes Automáticos
          </h1>
          <p className="text-white/70">
            Gerencie lembretes automáticos para os participantes dos workshops
          </p>
        </div>

        {/* Controles */}
        <div className="mb-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 min-h-[44px] w-full sm:w-auto"
          >
            Novo Lembrete
          </Button>
          
          <Button
            onClick={() => setShowTestMessage(true)}
            className="bg-purple-600 hover:bg-purple-700 min-h-[44px] w-full sm:w-auto"
          >
            Teste de Mensagem
          </Button>
          
          <Button
            onClick={() => setShowCustomReminder(true)}
            className="bg-orange-600 hover:bg-orange-700 min-h-[44px] w-full sm:w-auto"
          >
            Lembrete Custom
          </Button>
          
          <Button
            onClick={handleTestReminders}
            disabled={processingReminders}
            className="bg-green-600 hover:bg-green-700 min-h-[44px] w-full sm:w-auto"
          >
            {processingReminders ? 'Processando...' : 'Testar Lembretes'}
          </Button>
          
          <Button
            onClick={() => processReminders2Days()}
            className="bg-blue-600 hover:bg-blue-700 min-h-[44px] w-full sm:w-auto"
          >
            Testar 2 Dias
          </Button>
          
          <Button
            onClick={() => processReminders8Hours()}
            className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px] w-full sm:w-auto"
          >
            Testar 8 Horas
          </Button>
          
          <Button
            onClick={() => {
              if (autoProcessingActive) {
                stopAutomatedProcessing();
                setAutoProcessingActive(false);
              } else {
                startAutomatedProcessing();
                setAutoProcessingActive(true);
              }
            }}
            className={`min-h-[44px] w-full sm:w-auto ${
              autoProcessingActive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {autoProcessingActive ? 'Parar Auto-Processamento' : 'Iniciar Auto-Processamento'}
          </Button>
          
          <Button
            onClick={createExampleReminders}
            className="bg-yellow-600 hover:bg-yellow-700 min-h-[44px] w-full sm:w-auto"
          >
            Criar Lembretes Exemplo
          </Button>
          
          <select
            value={selectedWorkshop}
            onChange={(e) => setSelectedWorkshop(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] w-full sm:w-auto"
            style={{ colorScheme: 'dark' }}
          >
            <option value="" className="bg-gray-800 text-white">Todos os Workshops</option>
            {workshops.map(workshop => (
              <option key={workshop.id} value={workshop.id} className="bg-gray-800 text-white">
                {workshop.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Formulário */}
        {showForm && (
          <Card className="mb-6 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Workshop
                  </label>
                  <select
                    value={formData.workshop_id}
                    onChange={(e) => setFormData({ ...formData, workshop_id: e.target.value })}
                    required
                    className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" className="bg-gray-800 text-white">Selecione um workshop</option>
                    {workshops.map(workshop => (
                      <option key={workshop.id} value={workshop.id} className="bg-gray-800 text-white">
                        {workshop.nome}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Tipo de Lembrete
                  </label>
                  <select
                    value={formData.tipo_lembrete}
                    onChange={(e) => setFormData({ ...formData, tipo_lembrete: e.target.value as 'confirmacao_inscricao' | 'lembrete_evento' | 'pos_evento' })}
                    className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    style={{ colorScheme: 'dark' }}
                  >
                    {tiposLembrete.map(tipo => (
                      <option key={tipo.value} value={tipo.value} className="bg-gray-800 text-white">
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Período de Disparo
                  </label>
                  <select
                    value={formData.periodo_disparo}
                    onChange={(e) => setFormData({ ...formData, periodo_disparo: Number(e.target.value) })}
                    className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    style={{ colorScheme: 'dark' }}
                  >
                    {periodosDisparo.map(periodo => (
                      <option key={periodo.value} value={periodo.value} className="bg-gray-800 text-white">
                        {periodo.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Status
                  </label>
                  <select
                    value={formData.ativo ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
                    className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="true" className="bg-gray-800 text-white">Ativo</option>
                    <option value="false" className="bg-gray-800 text-white">Inativo</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                  className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  placeholder="Ex: Lembrete do seu workshop"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Mensagem
                </label>
                <textarea
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                  placeholder="Digite a mensagem do lembrete..."
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 min-h-[44px] w-full sm:w-auto">
                  {editingReminder ? 'Atualizar' : 'Criar'} Lembrete
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 hover:bg-gray-700 min-h-[44px] w-full sm:w-auto"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Lista de Lembretes */}
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-white">Lembretes Configurados</h2>
          
          {loading.reminders ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-white/60">Carregando lembretes...</p>
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              Nenhum lembrete configurado
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReminders.map(reminder => {
                const workshop = workshops.find(w => w.id === reminder.workshop_id);
                return (
                  <div
                    key={reminder.id}
                    className="border border-white/20 rounded-lg p-4 sm:p-6 hover:bg-white/5 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">
                            {reminder.titulo}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                            reminder.ativo
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {reminder.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        
                        <p className="text-white/70 mb-3 leading-relaxed">{reminder.mensagem}</p>
                        
                        <div className="text-sm text-white/60 space-y-1">
                          <p><strong>Workshop:</strong> {workshop?.nome || 'Workshop não encontrado'}</p>
                          <p><strong>Tipo:</strong> {tiposLembrete.find(t => t.value === reminder.tipo_lembrete)?.label}</p>
                          <p><strong>Disparo:</strong> {reminder.periodo_disparo} antes do evento</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                        <Button
                          onClick={() => handleEdit(reminder)}
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] w-full sm:w-auto"
                        >
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDelete(reminder.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-400 border-red-400 hover:bg-red-500/20 min-h-[44px] w-full sm:w-auto"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Mensagens Enviadas */}
        <Card className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Mensagens Enviadas Recentemente</h2>
          
          {loading.messages ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-white/60">Carregando mensagens...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              Nenhuma mensagem enviada
            </div>
          ) : (
            <div className="space-y-3">
              {messages.slice(0, 10).map(message => (
                <div
                  key={message.id}
                  className="border border-white/20 rounded-lg p-3 hover:bg-white/5 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-white">{message.assunto}</h4>
                      <p className="text-sm text-white/70 mt-1">{message.conteudo}</p>
                      <p className="text-xs text-white/60 mt-2">
                        Enviado em: {new Date(message.data_envio).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      message.status_leitura === 'lida'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {message.status_leitura === 'lida' ? 'Lida' : 'Não lida'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Teste de Mensagem */}
      {showTestMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-white">Teste de Mensagem</h2>
            <form onSubmit={sendTestMessage}>
              <div className="mb-4">
                 <label className="block text-sm font-medium text-white mb-2">
                   Número (com código do país)
                 </label>
                 <input
                  type="tel"
                  value={testMessageData.numero}
                  onChange={(e) => {
                    // Remove caracteres não numéricos
                    const numero = e.target.value.replace(/\D/g, '');
                    setTestMessageData({...testMessageData, numero});
                  }}
                  placeholder="Ex: 5511999999999"
                  className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  pattern="[0-9]{13}"
                  minLength={13}
                  maxLength={13}
                  required
                />
                 <p className="text-xs text-white/60 mt-1">
                    Use um número válido com WhatsApp ativo. Formato: código do país + DDD + número
                  </p>
                  {testMessageData.numero && testMessageData.numero.length !== 13 && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠️ O número deve ter exatamente 13 dígitos (ex: 5511999999999)
                    </p>
                  )}
                  {testMessageData.numero && testMessageData.numero.length === 13 && (
                    <p className="text-xs text-green-400 mt-1">
                      ✓ Formato correto
                    </p>
                  )}
               </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Mensagem
                </label>
                <textarea
                  value={testMessageData.mensagem}
                  onChange={(e) => setTestMessageData({...testMessageData, mensagem: e.target.value})}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setShowTestMessage(false)}
                  variant="outline"
                  className="min-h-[44px] w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={sendingTestMessage}
                  variant="primary"
                  className="min-h-[44px] w-full sm:w-auto order-1 sm:order-2"
                >
                  {sendingTestMessage ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-white">Editar Lembrete</h2>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nome do Lembrete
                  </label>
                  <input
                    type="text"
                    value={editingReminder.titulo}
                    onChange={(e) => setEditingReminder({...editingReminder, titulo: e.target.value})}
                    className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Período (minutos antes)
                  </label>
                  <input
                    type="number"
                    value={editingReminder.periodo_disparo}
                    onChange={(e) => setEditingReminder({...editingReminder, periodo_disparo: Number(e.target.value)})}
                    className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={editingReminder.mensagem}
                    onChange={(e) => setEditingReminder({...editingReminder, mensagem: e.target.value})}
                    rows={4}
                    className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-ativo"
                    checked={editingReminder.ativo}
                    onChange={(e) => setEditingReminder({...editingReminder, ativo: e.target.checked})}
                    className="mr-2 min-w-[20px] min-h-[20px]"
                  />
                  <label htmlFor="edit-ativo" className="text-white">
                    Ativo
                  </label>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setEditingReminder(null)}
                  variant="outline"
                  className="min-h-[44px] w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 min-h-[44px] w-full sm:w-auto order-1 sm:order-2"
                >
                  Atualizar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Lembrete Customizado */}
      {showCustomReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-white">Lembrete Customizado</h2>
            <form onSubmit={createCustomReminder}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Nome do Lembrete
                </label>
                <input
                  type="text"
                  value={customReminderData.nome}
                  onChange={(e) => setCustomReminderData({...customReminderData, nome: e.target.value})}
                  className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Período de Repetição
                </label>
                <select
                  value={customReminderData.periodo_minutos}
                  onChange={(e) => setCustomReminderData({...customReminderData, periodo_minutos: Number(e.target.value)})}
                  className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  style={{ colorScheme: 'dark' }}
                >
                  {periodosCustom.map(periodo => (
                    <option key={periodo.value} value={periodo.value} className="bg-gray-800 text-white">
                      {periodo.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Mensagem
                </label>
                <textarea
                  value={customReminderData.mensagem}
                  onChange={(e) => setCustomReminderData({...customReminderData, mensagem: e.target.value})}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={customReminderData.ativo}
                    onChange={(e) => setCustomReminderData({...customReminderData, ativo: e.target.checked})}
                    className="mr-2"
                  />
                  Ativo
                </label>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setShowCustomReminder(false)}
                  variant="outline"
                  className="min-h-[44px] w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 min-h-[44px] w-full sm:w-auto order-1 sm:order-2"
                >
                  Criar Lembrete
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomatedReminders;