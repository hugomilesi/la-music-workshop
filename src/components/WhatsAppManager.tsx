import { useState, useEffect } from 'react';
import { MessageCircle, Send, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface Message {
  id: string;
  destinatario: string;
  conteudo: string;
  tipo: string;
  status: 'pendente' | 'enviada' | 'erro';
  data_envio: string;
  data_processamento?: string;
  erro_detalhes?: string;
}

export default function WhatsAppManager() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .order('data_envio', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      showToast({ type: 'error', title: 'Erro ao carregar mensagens' });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageId: string) => {
    setSending(messageId);
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      // Simular envio de mensagem WhatsApp
      // Em produção, aqui seria feita a integração com a Evolution API
      const success = await simulateWhatsAppSend(message);

      if (success) {
        // Atualizar status da mensagem
        const { error } = await supabase
          .from('mensagens')
          .update({
            status: 'enviada',
            data_processamento: new Date().toISOString()
          })
          .eq('id', messageId);

        if (error) throw error;

        showToast({ type: 'success', title: 'Mensagem enviada com sucesso!' });
        fetchMessages();
      } else {
        throw new Error('Falha no envio da mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Atualizar status para erro
      await supabase
        .from('mensagens')
        .update({
          status: 'erro',
          data_processamento: new Date().toISOString(),
          erro_detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
        })
        .eq('id', messageId);

      showToast({ type: 'error', title: 'Erro ao enviar mensagem' });
      fetchMessages();
    } finally {
      setSending(null);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('mensagens')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      showToast({ type: 'success', title: 'Mensagem removida' });
      fetchMessages();
    } catch (error) {
      console.error('Erro ao remover mensagem:', error);
      showToast({ type: 'error', title: 'Erro ao remover mensagem' });
    }
  };

  const simulateWhatsAppSend = async (message: Message): Promise<boolean> => {
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular 90% de sucesso
    return Math.random() > 0.1;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'enviada':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'erro':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'enviada':
        return 'Enviada';
      case 'erro':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const formatPhone = (phone: string | null | undefined) => {
    // Formatar telefone para exibição
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold text-white">Mensagens WhatsApp</h2>
        </div>
        <Button
          variant="outline"
          onClick={fetchMessages}
          className="text-sm"
        >
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {messages.filter(m => m.status === 'pendente').length}
              </p>
              <p className="text-white/60 text-sm">Pendentes</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {messages.filter(m => m.status === 'enviada').length}
              </p>
              <p className="text-white/60 text-sm">Enviadas</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {messages.filter(m => m.status === 'erro').length}
              </p>
              <p className="text-white/60 text-sm">Com Erro</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Mensagens */}
      <Card className="p-6">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Nenhuma mensagem encontrada</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="border border-white/10 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(message.status)}
                      <span className="text-sm font-medium text-white">
                        {getStatusText(message.status)}
                      </span>
                      <span className="text-xs text-white/60">
                        {formatPhone(message.destinatario)}
                      </span>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <p className="text-sm text-white/80 whitespace-pre-wrap">
                        {message.conteudo}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span>Tipo: {message.tipo}</span>
                      <span>
                        Criada: {new Date(message.data_envio).toLocaleString('pt-BR')}
                      </span>
                      {message.data_processamento && (
                        <span>
                          Processada: {new Date(message.data_processamento).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                    
                    {message.erro_detalhes && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                        Erro: {message.erro_detalhes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {message.status === 'pendente' && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Send className="w-3 h-3" />}
                        onClick={() => sendMessage(message.id)}
                        disabled={sending === message.id}
                        className="text-xs"
                      >
                        {sending === message.id ? 'Enviando...' : 'Enviar'}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 className="w-3 h-3" />}
                      onClick={() => deleteMessage(message.id)}
                      className="text-xs text-red-400 border-red-500/20 hover:bg-red-500/10"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}