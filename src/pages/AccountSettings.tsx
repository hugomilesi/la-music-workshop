import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Save, Music, Users, Trash2, CheckCircle, XCircle, AlertCircle, Shield, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';

interface FormData {
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  unit_id: string;
}

interface UserEnrollment {
  id: string;
  workshop_id: string;
  data_inscricao: string;
  status_inscricao: string;
  workshops: {
    nome: string;
    data_inicio: string;
    data_fim: string;
    capacidade: number;
    vagas_disponiveis: number;
  };
}

// Função auxiliar para obter o nome da unidade
const getUnitName = (unitId: string): string => {
  const unidades: { [key: string]: string } = {
    '8f424adf-64ca-43e9-909c-8dfd6783ac15': 'Barra',
    '19df29a0-83ba-4b1e-a2f7-cb3ac8d25b4f': 'Campo Grande',
    'a4e3815c-8a34-4ef1-9773-cdeabdce1003': 'Recreio'
  };
  return unidades[unitId] || 'Unidade não encontrada';
};

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch } = useUserProfile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    nome_completo: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    unit_id: ''
  });

  // Estados para modais de confirmação
  const [cancelDialog, setCancelDialog] = useState<{
    isOpen: boolean;
    enrollmentId: string;
    workshopName: string;
    isPaid: boolean;
  }>({ isOpen: false, enrollmentId: '', workshopName: '', isPaid: false });
  
  const [unitChangeDialog, setUnitChangeDialog] = useState<{
    isOpen: boolean;
    newUnitId: string;
  }>({ isOpen: false, newUnitId: '' });

  useEffect(() => {
    if (profile) {
      setFormData({
        nome_completo: profile.nome_completo || '',
        email: profile.email || user?.email || '',
        telefone: profile.telefone || '',
        data_nascimento: profile.data_nascimento || '',
        unit_id: profile.unit_id || ''
      });
    }
  }, [profile, user]);

  // Função para criar usuário na tabela users se não existir
  const createUserIfNotExists = async () => {
    if (!user) return null;
    
    try {
      // Tentar sincronizar o usuário usando a função RPC
      const { data: syncResult, error: syncError } = await supabase
        .rpc('sync_specific_user', { user_uuid: user.id });
      
      if (syncError) {
        // Erro ao sincronizar usuário
        return null;
      }
      
      // Resultado da sincronização obtido
      
      // Buscar o usuário novamente após sincronização
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (userError) {
        // Usuário ainda não encontrado após sincronização
        return null;
      }
      
      return userRecord;
    } catch (error) {
      // Erro ao criar usuário
      return null;
    }
  };

  // Função para buscar inscrições do usuário
  const fetchUserEnrollments = useCallback(async () => {
    if (!user) return;
    
    setEnrollmentsLoading(true);
    try {
      // Primeiro buscar o ID do usuário na tabela users
      let { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      // Se o usuário não foi encontrado, tentar criar
      if (userError && userError.code === 'PGRST116') {
        // Usuário não encontrado na tabela users, tentando criar
        userRecord = await createUserIfNotExists();
        
        if (!userRecord) {
          throw new Error('Não foi possível criar o usuário na tabela users');
        }
      } else if (userError) {
        // Erro ao buscar usuário
        throw new Error('Erro ao buscar usuário');
      }
      
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          id,
          workshop_id,
          data_inscricao,
          status_inscricao,
          workshops(
            nome,
            data_inicio,
            data_fim,
            capacidade,
            vagas_disponiveis,
            preco
          )
        `)
        .eq('user_id', userRecord.id)
        .order('data_inscricao', { ascending: false });

      if (error) {
        // Erro ao buscar inscrições
        return;
      }

      // Transformar os dados para que workshops seja um objeto único
      const transformedData = data?.map(item => ({
        ...item,
        workshops: Array.isArray(item.workshops) ? item.workshops[0] : item.workshops
      })) || [];

      setEnrollments(transformedData);
    } catch (error) {
      // Erro inesperado ao buscar inscrições
    } finally {
      setEnrollmentsLoading(false);
    }
  }, [user]);

  // Função para abrir modal de cancelamento
  const openCancelDialog = (enrollmentId: string, workshopName: string, isPaid: boolean) => {
    setCancelDialog({
      isOpen: true,
      enrollmentId,
      workshopName,
      isPaid
    });
  };

  // Função para cancelar inscrição
  const handleCancelEnrollment = async () => {
    const { enrollmentId, workshopName, isPaid } = cancelDialog;
    
    if (isPaid) {
      // Para oficinas pagas, apenas mostrar informações de contato
      toast.info('Entre em contato conosco para cancelar esta inscrição:\n\nWhatsApp: (21) 99999-9999\nEmail: contato@exemplo.com');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('inscricoes')
        .update({ 
          status_inscricao: 'cancelada',
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId);
      
      if (error) {
        toast.error('Erro ao cancelar inscrição: ' + error.message);
        return;
      }
      
      toast.success('Inscrição cancelada com sucesso!');
      
      // Recarregar as inscrições
      await fetchUserEnrollments();
    } catch (error) {
      toast.error('Erro inesperado ao cancelar inscrição');
    }
  };

  useEffect(() => {
    fetchUserEnrollments();
  }, [fetchUserEnrollments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnitId = e.target.value;
    
    if (enrollments.length > 0) {
      setUnitChangeDialog({
        isOpen: true,
        newUnitId
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      unit_id: newUnitId
    }));
  };

  // Função para confirmar mudança de unidade
  const confirmUnitChange = async () => {
    if (!user) return;
    
    try {
      // Primeiro buscar o ID do usuário na tabela users
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (userError) {
        toast.error('Erro ao buscar dados do usuário');
        return;
      }
      
      // Cancelar todas as inscrições ativas do usuário
      const { error: cancelError } = await supabase
        .from('inscricoes')
        .update({ 
          status_inscricao: 'cancelada',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userRecord.id)
        .eq('status_inscricao', 'ativa');
      
      if (cancelError) {
        toast.error('Erro ao cancelar inscrições: ' + cancelError.message);
        return;
      }
      
      // Atualizar a unidade no formulário
      setFormData(prev => ({
        ...prev,
        unit_id: unitChangeDialog.newUnitId
      }));
      
      // Fechar o modal
      setUnitChangeDialog({ isOpen: false, newUnitId: '' });
      
      // Recarregar as inscrições
      await fetchUserEnrollments();
      
      toast.success('Unidade alterada e inscrições canceladas com sucesso!');
    } catch (error) {
      toast.error('Erro inesperado ao alterar unidade');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast.error('Usuário não encontrado');
      return;
    }

    setLoading(true);
    try {
      // Atualizar dados na tabela users
      const { error: updateError } = await supabase
        .from('users')
        .update({
          nome_completo: formData.nome_completo,
          telefone: formData.telefone,
          data_nascimento: formData.data_nascimento || null,
          unit_id: formData.unit_id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        // Erro ao atualizar perfil
        toast.error('Erro ao atualizar perfil: ' + updateError.message);
        return;
      }

      // Se o email foi alterado, atualizar no Supabase Auth
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });

        if (emailError) {
          // Erro ao atualizar email
          
          // Tratamento específico para erro de email já registrado
          if (emailError.message?.includes('already been registered') || 
              emailError.message?.includes('User with this email address has already been registered')) {
            toast.error('Este email já está sendo usado por outra conta. Tente um email diferente.');
          } else if (emailError.status === 422) {
            toast.error('Email inválido. Verifique o formato e tente novamente.');
          } else {
            toast.error('Não foi possível atualizar o email. Tente novamente mais tarde.');
          }
          return;
        }

        // Atualizar email na tabela users também
        const { error: emailUpdateError } = await supabase
          .from('users')
          .update({ email: formData.email })
          .eq('user_id', user.id);

        if (emailUpdateError) {
          // Erro ao atualizar email na tabela
        }

        toast.success('Dados atualizados! Verifique seu novo email para confirmar a alteração.');
      } else {
        toast.success('Dados atualizados com sucesso!');
      }

      // Recarregar o perfil
      await refetch();
    } catch (error) {
      // Erro inesperado
      toast.error('Erro inesperado ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white/80">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/80 mb-4">Perfil não encontrado</p>
          <button
            onClick={() => navigate('/')}
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </button>
          
          {/* Welcome Message */}
          <div className="glass rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 rounded-full bg-gradient-primary">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Olá, {profile?.nome_completo?.split(' ')[0] || 'Usuário'}! 👋
                </h1>
                <p className="text-white/80">Bem-vindo à sua área pessoal</p>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Configurações da Conta</h2>
          <p className="text-white/80">Gerencie suas informações pessoais</p>
        </div>

        {/* User Enrollments Section */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Music className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Minhas Inscrições</h3>
          </div>
          
          {enrollmentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mr-3"></div>
              <p className="text-white/80">Carregando inscrições...</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/80 mb-2">Você ainda não se inscreveu em nenhuma oficina</p>
              <button
                onClick={() => navigate('/oficinas')}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Explorar Oficinas
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => {
                const workshop = enrollment.workshops;
                const statusColor = enrollment.status_inscricao === 'confirmada' ? 'text-green-400' : 
                                  enrollment.status_inscricao === 'pendente' ? 'text-yellow-400' : 'text-red-400';
                const statusText = enrollment.status_inscricao === 'confirmada' ? 'Confirmada' : 
                                 enrollment.status_inscricao === 'pendente' ? 'Pendente' : 'Cancelada';
                
                const isPaid = (enrollment.workshops as any).preco && (enrollment.workshops as any).preco > 0;
                
                return (
                  <div key={enrollment.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-white">{enrollment.workshops.nome}</h4>
                          {isPaid && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium text-yellow-400 bg-yellow-400/10 border border-yellow-400/20">
                              Paga
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-white/70">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(enrollment.workshops.data_inicio).toLocaleDateString('pt-BR')} - {new Date(enrollment.workshops.data_fim).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{enrollment.workshops.capacidade - enrollment.workshops.vagas_disponiveis}/{enrollment.workshops.capacidade}</span>
                          </div>
                        </div>
                        <p className="text-xs text-white/60 mt-2">
                          Inscrito em: {new Date(enrollment.data_inscricao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor} bg-white/10 flex items-center space-x-1`}>
                          {enrollment.status_inscricao === 'confirmada' && <CheckCircle className="h-3 w-3" />}
                          {enrollment.status_inscricao === 'pendente' && <AlertCircle className="h-3 w-3" />}
                          {enrollment.status_inscricao === 'cancelada' && <XCircle className="h-3 w-3" />}
                          <span>{statusText}</span>
                        </span>
                        {enrollment.status_inscricao !== 'cancelada' && (
                          <button
                            onClick={() => openCancelDialog(
                              enrollment.id, 
                              enrollment.workshops.nome, 
                              isPaid
                            )}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title={isPaid ? 'Contatar suporte para cancelar' : 'Cancelar inscrição'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="glass rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome Completo */}
            <div>
              <label htmlFor="nome_completo" className="flex items-center text-sm font-medium text-white mb-2">
                <User className="h-4 w-4 mr-2" />
                Nome Completo
              </label>
              <input
                type="text"
                id="nome_completo"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="flex items-center text-sm font-medium text-white mb-2">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Digite seu email"
                required
              />
              <p className="text-xs text-white/60 mt-1">
                Ao alterar o email, você receberá um link de confirmação no novo endereço.
              </p>
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className="flex items-center text-sm font-medium text-white mb-2">
                <Phone className="h-4 w-4 mr-2" />
                Telefone
              </label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="(00) 00000-0000"
              />
            </div>

            {/* Data de Nascimento */}
            <div>
              <label htmlFor="data_nascimento" className="flex items-center text-sm font-medium text-white mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                Data de Nascimento (dd/mm/yyyy)
              </label>
              <input
                type="date"
                id="data_nascimento"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Unidade */}
            <div>
              <label htmlFor="unit_id" className="flex items-center text-sm font-medium text-white mb-2">
                <MapPin className="h-4 w-4 mr-2" />
                Unidade
              </label>
              <select
                id="unit_id"
                name="unit_id"
                value={formData.unit_id}
                onChange={handleUnitChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none"
                required
              >
                <option value="8f424adf-64ca-43e9-909c-8dfd6783ac15" className="bg-gray-800 text-white">
                  Barra
                </option>
                <option value="19df29a0-83ba-4b1e-a2f7-cb3ac8d25b4f" className="bg-gray-800 text-white">
                  Campo Grande
                </option>
                <option value="a4e3815c-8a34-4ef1-9773-cdeabdce1003" className="bg-gray-800 text-white">
                  Recreio
                </option>
              </select>
              {enrollments.length > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠️ Atenção: Alterar a unidade pode afetar suas inscrições existentes.
                </p>
              )}
            </div>

            {/* Tipo de Usuário (somente leitura) */}
            <div>
              <label className="flex items-center text-sm font-medium text-white mb-2">
                <User className="h-4 w-4 mr-2" />
                Tipo de Conta
              </label>
              <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/80 capitalize">
                {profile.user_type === 'admin' ? 'Administrador' : 
                 profile.user_type === 'student' ? 'Aluno' : 
                 profile.user_type === 'guardian' ? 'Responsável' : 
                 profile.user_type || 'Não informado'}
              </div>
            </div>

            {/* Botão de Salvar */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:shadow-glow-purple focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px]"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de confirmação para cancelamento de inscrição */}
      <ConfirmDialog
        isOpen={cancelDialog.isOpen}
        onClose={() => setCancelDialog({ isOpen: false, enrollmentId: '', workshopName: '', isPaid: false })}
        onConfirm={handleCancelEnrollment}
        title={cancelDialog.isPaid ? 'Oficina Paga - Contatar Suporte' : 'Cancelar Inscrição'}
        message={cancelDialog.isPaid 
          ? `Esta é uma oficina paga. Para cancelar a inscrição em "${cancelDialog.workshopName}", entre em contato com nossa equipe através do WhatsApp ou email.`
          : `Tem certeza que deseja cancelar sua inscrição em "${cancelDialog.workshopName}"? Esta ação não pode ser desfeita.`
        }
        confirmText={cancelDialog.isPaid ? 'Entendi' : 'Cancelar Inscrição'}
        cancelText="Voltar"
        variant={cancelDialog.isPaid ? 'info' : 'danger'}
        icon={cancelDialog.isPaid ? <MessageCircle className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
      />

      {/* Modal de confirmação para mudança de unidade */}
      <ConfirmDialog
        isOpen={unitChangeDialog.isOpen}
        onClose={() => setUnitChangeDialog({ isOpen: false, newUnitId: '' })}
        onConfirm={confirmUnitChange}
        title="Alterar Unidade"
        message="Você possui inscrições ativas. Alterar a unidade pode afetar suas inscrições existentes. Deseja continuar?"
        confirmText="Continuar"
        cancelText="Cancelar"
        variant="warning"
        icon={<AlertCircle className="w-6 h-6" />}
      />
    </div>
  );
};

export default AccountSettings;