import { useState, useEffect } from 'react';
import { X, ArrowRight, Check, Users, Calendar, MapPin, Clock } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/authcontext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { GuestForm, Guest } from '@/components/GuestForm';
import { sendEnrollmentConfirmation, formatPhoneNumber, validatePhoneNumber } from '@/utils/whatsapp';
import { sanitizeErrorMessage } from '@/utils/errorHandler';

interface Workshop {
  id: string;
  nome: string;
  descricao: string;
  instrutor: string;
  data_inicio: string;
  data_fim: string;
  horario_inicio: string;
  horario_fim: string;
  vagas_disponiveis: number;
  local: string;
  unidade: string;
  instrumento: string;
  preco: number;
  permite_convidados: boolean;
  imagem?: string;
}

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workshop: Workshop;
}

export default function EnrollmentModal({ isOpen, onClose, workshop }: EnrollmentModalProps) {
  const { createRegistration, guests, updateGuests } = useStore();
  const { user } = useAuth();
  const { userProfile: profile } = useUserProfile();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    unidade: '',
    age: '',
    professorAtual: '',
    email: '',
    phone: '',
    convidado: false,
    termos: false,
    guardianName: '',
    guardianPhone: '',
    guardianEmail: ''
  });
  const [unitName, setUnitName] = useState('');
  const [availableWorkshops, setAvailableWorkshops] = useState<Array<{
    id: string;
    nome: string;
    instrumento: string;
    vagas_disponiveis: number;
  }>>([]);

  // Auto-preenchimento com dados do usuário logado
  useEffect(() => {
    if (user && profile && isOpen) {
      setFormData(prev => ({
        ...prev,
        name: profile.nome_completo || user.user_metadata?.name || '',
        email: user.email || '',
        phone: profile.telefone || user.user_metadata?.phone || ''
      }));
    }
  }, [user, profile, isOpen]);

  // Buscar nome da unidade e oficinas disponíveis baseado no unit_id do usuário
  useEffect(() => {
    const fetchUnitDataAndWorkshops = async () => {
      if (profile?.unit_id && isOpen) {
        try {
          // Buscar nome da unidade
          const { data: unitData, error: unitError } = await supabase
            .from('unidades')
            .select('nome')
            .eq('id', profile.unit_id)
            .single();
          
          if (unitData && !unitError) {
            setUnitName(unitData.nome);
            setFormData(prev => ({ ...prev, unidade: unitData.nome }));
            
            // Buscar oficinas da mesma unidade que permitem convidados
            const { data: workshopsData, error: workshopsError } = await supabase
              .from('workshops')
              .select('id, nome, instrumento, vagas_disponiveis')
              .eq('unit_id', profile.unit_id)
              .eq('permite_convidados', true)
              .gt('vagas_disponiveis', 0);
            
            if (workshopsData && !workshopsError) {
              setAvailableWorkshops(workshopsData.map(w => ({
                id: w.id,
                nome: w.nome,
                instrumento: w.instrumento,
                vagas_disponiveis: w.vagas_disponiveis
              })));
            }
          }
        } catch (err) {
          console.error('Erro ao buscar dados da unidade e oficinas:', err);
        }
      }
    };
    
    fetchUnitDataAndWorkshops();
  }, [profile, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData({
        name: '',
        unidade: '',
        age: '',
        professorAtual: '',
        email: '',
        phone: '',
        convidado: false,
        termos: false,
        guardianName: '',
        guardianPhone: '',
        guardianEmail: ''
      });
      updateGuests([]);
    }
  }, [isOpen]); // Removido updateGuests das dependências para evitar loop infinito

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    console.log('🎯 EnrollmentModal: Iniciando handleSubmit');
    console.log('👤 Usuário:', user);
    console.log('📋 Profile:', profile);
    console.log('🎪 Workshop:', workshop);
    console.log('📝 FormData:', formData);
    
    if (!user) {
      console.error('❌ Usuário não logado');
      showToast({ type: 'error', title: 'Você precisa estar logado para se inscrever' });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🔍 Verificando inscrições existentes...');
      // Verificar se já está inscrito nesta oficina (corrigido para evitar erro 406)
      const { data: existingEnrollments, error: checkError } = await supabase
        .from('inscricoes')
        .select('id, status_inscricao')
        .eq('user_id', profile.id)
        .eq('workshop_id', workshop.id)
        .neq('status_inscricao', 'cancelada');

      console.log('📊 Resultado verificação:', { existingEnrollments, checkError });

      if (checkError) {
        console.error('❌ Erro ao verificar inscrição existente:', checkError);
        throw new Error('Erro ao verificar inscrição existente');
      }

      if (existingEnrollments && existingEnrollments.length > 0) {
        console.error('❌ Usuário já inscrito');
        showToast({ type: 'error', title: 'Você já está inscrito nesta oficina' });
        setIsSubmitting(false);
        return;
      }

      console.log('🚀 Iniciando processo de inscrição com validação completa...');
      
      // Usar uma transação para garantir que tudo seja validado antes de confirmar
      const { data, error } = await supabase.rpc('create_enrollment_with_guests', {
        p_workshop_id: workshop.id,
        p_user_id: profile?.id || '',
        p_participant_name: formData.name,
        p_participant_age: parseInt(formData.age),
        p_participant_email: formData.email,
        p_participant_phone: formData.phone,
        p_participant_unidade: formData.unidade,
        p_has_guests: formData.convidado && Array.isArray(guests) && guests.length > 0,
        p_guests_data: formData.convidado && Array.isArray(guests) && guests.length > 0 ? guests.map(guest => ({
          nome: guest.name,
          idade: guest.age,
          nome_responsavel: guest.guardianName || null,
          telefone_responsavel: guest.guardianPhone || null,
          email_responsavel: guest.guardianEmail || null
        })) : null
      });

      if (error) {
        console.error('Erro na função de inscrição:', error);
        throw error;
      }

      const enrollmentId = data;
      console.log('✅ Inscrição criada com sucesso. ID:', enrollmentId);

      // Criar mensagem WhatsApp de confirmação
      try {
        const phoneFormatted = formatPhoneNumber(formData.phone);
        if (validatePhoneNumber(phoneFormatted)) {
          const dataFormatada = new Date(workshop.data_inicio).toLocaleDateString('pt-BR');
          
          // Usar a função correta de envio de confirmação
          await sendEnrollmentConfirmation(
            phoneFormatted,
            formData.name,
            workshop.nome,
            dataFormatada,
            workshop.local || 'Local a definir',
            workshop.preco === 0 || false
          );
          
          console.log('Mensagem WhatsApp de confirmação enviada com sucesso');
        }
      } catch (whatsappError) {
        console.error('Erro ao enviar mensagem WhatsApp:', whatsappError);
        // Não interrompe o fluxo se houver erro na mensagem
      }

      showToast({ type: 'success', title: 'Inscrição realizada com sucesso!' });
      onClose();
    } catch (error: any) {
      console.error('❌ EnrollmentModal: Erro ao realizar inscrição:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      const errorMessage = sanitizeErrorMessage(error) || 'Erro ao realizar inscrição. Tente novamente.';
      
      console.error('❌ Mensagem final do erro:', errorMessage);
      showToast({ type: 'error', title: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name && formData.unidade && formData.age && formData.email && formData.phone && formData.termos;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {currentStep === 1 ? 'Dados do Aluno' : 'Confirmação da Inscrição'}
            </h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Step 1: Student Data */}
          {currentStep === 1 && (
            <Card className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Nome completo do aluno"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Unidade *</label>
                    <input
                      type="text"
                      value={formData.unidade}
                      readOnly
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white/80 cursor-not-allowed"
                      placeholder="Unidade será preenchida automaticamente"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Idade do Aluno *</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Idade"
                      min="5"
                      max="18"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Professor Atual (Opcional)</label>
                    <input
                      type="text"
                      value={formData.professorAtual || ''}
                      onChange={(e) => handleInputChange('professorAtual', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Nome do professor (opcional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Telefone do Aluno *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Email do Aluno *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                {/* Campos opcionais do responsável */}
                <div className="border-t border-white/20 pt-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Dados do Responsável (Opcional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white font-medium mb-2">Nome do Responsável</label>
                      <input
                        type="text"
                        value={formData.guardianName || ''}
                        onChange={(e) => handleInputChange('guardianName', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Nome completo do responsável"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Telefone do Responsável</label>
                      <input
                        type="tel"
                        value={formData.guardianPhone || ''}
                        onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-white font-medium mb-2">Email do Responsável</label>
                    <input
                      type="email"
                      value={formData.guardianEmail || ''}
                      onChange={(e) => handleInputChange('guardianEmail', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Checkbox de convidados - só aparece se a oficina permitir convidados */}
                  {workshop.permite_convidados && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="convidado"
                        checked={formData.convidado}
                        onChange={(e) => handleInputChange('convidado', e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="convidado" className="text-white">
                        Desejo trazer amigos
                      </label>
                    </div>
                  )}
                  
                  {/* Formulário de convidados */}
                  {workshop.permite_convidados && formData.convidado && (
                    <div className="border-t border-white/20 pt-6">
                      <GuestForm
                        guests={guests}
                        onGuestsChange={updateGuests}
                        maxGuests={3}
                        studentGuardianData={{
                          guardianName: formData.guardianName,
                          guardianPhone: formData.guardianPhone,
                          guardianEmail: formData.guardianEmail
                        }}
                        availableWorkshops={availableWorkshops}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="termos"
                      checked={formData.termos}
                      onChange={(e) => handleInputChange('termos', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 mt-1"
                    />
                    <label htmlFor="termos" className="text-white">
                      Eu aceito os termos de participação da LA Music Week 2025 e autorizo a participação do aluno na oficina selecionada. *
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!isFormValid}
                  icon={<ArrowRight className="w-5 h-5" />}
                  className="flex-1"
                >
                  Continuar
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Confirmation */}
          {currentStep === 2 && (
            <Card className="p-6">
              <div className="space-y-6">
                {/* Workshop Info */}
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Oficina Selecionada</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white">{workshop.nome}</h4>
                      <p className="text-white/80 text-sm">{workshop.descricao}</p>
                      <div className="flex items-center text-white/60 text-sm">
                        <Users className="w-4 h-4 mr-2" />
                        Instrutor: {workshop.instrutor}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-white/60 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(workshop.data_inicio).toLocaleDateString('pt-BR')} - {new Date(workshop.data_fim).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center text-white/60 text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        {workshop.horario_inicio} - {workshop.horario_fim}
                      </div>
                      <div className="flex items-center text-white/60 text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        {workshop.local}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Data Summary */}
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Dados do Aluno</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/60 text-sm">Nome</p>
                      <p className="text-white">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Idade</p>
                      <p className="text-white">{formData.age} anos</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Email</p>
                      <p className="text-white">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Telefone</p>
                      <p className="text-white">{formData.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Guests Summary */}
                {formData.convidado && Array.isArray(guests) && guests.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Convidados</h3>
                    <div className="space-y-2">
                      {guests.map((guest, index) => (
                        <div key={index} className="flex justify-between items-center text-white">
                          <span>{guest.name} ({guest.age} anos)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  icon={<Check className="w-5 h-5" />}
                  className="flex-1"
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar Inscrição'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}