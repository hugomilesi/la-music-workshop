import { useState, useEffect } from 'react';
import { Check, ArrowRight, ArrowLeft, Clock, Users, Star, Calendar, MapPin, Music } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { GuestForm, Guest } from '@/components/GuestForm';

// Função auxiliar para obter a cor da unidade
const getUnitColor = (unidade: string) => {
  switch (unidade) {
    case 'Barra': return 'bg-blue-500';
    case 'Campo Grande': return 'bg-green-500';
    case 'Recreio': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

export default function Inscricao() {
  const {
    currentStep,
    selectedWorkshops,
    workshops,
    addWorkshop,
    removeWorkshop,
    setCurrentStep,
    fetchWorkshops,
    loading,
    studentData
  } = useStore();
  
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { showError, showInfo } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Filtrar oficinas pela unidade do usuário quando estiver logado
    if (user && profile?.unit_id) {
      fetchWorkshops(profile.unit_id);
    } else if (!user) {
      // Se não estiver logado, mostrar todas as oficinas
      fetchWorkshops();
    }
  }, [fetchWorkshops, user, profile]);
  
  useEffect(() => {
    // Auto-selecionar workshop se o usuário veio do login
    const selectedWorkshopId = localStorage.getItem('selectedWorkshopId');
    if (selectedWorkshopId && user && !selectedWorkshops.includes(selectedWorkshopId)) {
      addWorkshop(selectedWorkshopId);
      localStorage.removeItem('selectedWorkshopId');
      showInfo(
        'Oficina Selecionada',
        'A oficina foi automaticamente selecionada. Você pode continuar com a inscrição.'
      );
    }
  }, [user, selectedWorkshops, addWorkshop, showInfo]);

  const mapLevel = (nivel: string) => {
    const niveis: { [key: string]: string } = {
      'iniciante': 'Iniciante',
      'intermediario': 'Intermediário',
      'avancado': 'Avançado'
    };
    return niveis[nivel] || nivel;
  };

  const [showConfirmation, setShowConfirmation] = useState(false);

  const selectedWorkshopData = workshops.filter(w => selectedWorkshops.includes(w.id));
  const totalPrice = selectedWorkshopData.reduce((total, workshop) => total + workshop.preco, 0);

  const handleWorkshopToggle = (workshopId: string) => {
    // Verificar se o usuário está logado
    if (!user) {
      showInfo(
        'Login Necessário',
        'Você precisa fazer login para se inscrever em oficinas. Redirecionando...'
      );
      
      // Salvar o workshop selecionado no localStorage para auto-preenchimento
      localStorage.setItem('selectedWorkshopId', workshopId);
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
      return;
    }
    
    // Verificar validação de idade antes de adicionar workshop
    if (!selectedWorkshops.includes(workshopId)) {
      const workshop = workshops.find(w => w.id === workshopId);
      if (workshop && studentData.age) {
        const userAge = typeof studentData.age === 'string' ? parseInt(studentData.age) : studentData.age;
        const minAge = workshop.idade_minima || 0;
        const maxAge = workshop.idade_maxima || 100;
        
        if (userAge < minAge || userAge > maxAge) {
          showError(
            'Idade não permitida',
            `Esta oficina é destinada para idades entre ${minAge} e ${maxAge} anos. Sua idade atual é ${userAge} anos.`
          );
          return;
        }
      }
      addWorkshop(workshopId);
    } else {
      removeWorkshop(workshopId);
    }
  };

  const handleNext = () => {
    if (selectedWorkshops.length === 0) {
      setShowConfirmation(true);
      return;
    }
    setCurrentStep(2);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Iniciante': return 'bg-green-500';
      case 'Intermediário': return 'bg-yellow-500';
      case 'Avançado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (currentStep !== 1) {
    return <InscricaoSteps />;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header */}
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 glow font-inter">
              Inscrição - LA Music Week
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto font-source">
              Selecione as oficinas que deseja participar e comece sua jornada musical.
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-center space-x-8">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <span className="ml-3 text-white font-medium">Selecionar Oficinas</span>
              </div>
              <div className="w-16 h-1 bg-white/20 rounded" />
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white/60 font-bold">
                  2
                </div>
                <span className="ml-3 text-white/60 font-medium">Dados do Aluno</span>
              </div>
              <div className="w-16 h-1 bg-white/20 rounded" />
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white/60 font-bold">
                  3
                </div>
                <span className="ml-3 text-white/60 font-medium">Confirmação</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Selection */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Workshops List */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workshops.map((workshop) => {
                  const isSelected = selectedWorkshops.includes(workshop.id);
                  const isFull = workshop.vagas_disponiveis === 0 || workshop.status !== 'ativa';
                  
                  return (
                    <Card 
                      key={workshop.id} 
                      className={`cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? 'ring-2 ring-purple-500 bg-white/20' 
                          : isFull 
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-white/10'
                      }`}
                      onClick={() => !isFull && handleWorkshopToggle(workshop.id)}
                    >
                      {/* Selection Indicator */}
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-purple-500 border-purple-500' 
                            : 'border-white/40'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex gap-2">
                          {workshop.unidade && (
                            <span className={`px-2 py-1 ${getUnitColor(workshop.unidade)} text-white text-xs rounded-full font-medium`}>
                              {workshop.unidade}
                            </span>
                          )}
                          {isFull && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                              Lotado
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Workshop Image */}
                      <div className="relative mb-4">
                        <img
                          src={`https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(workshop.instrumento + ' music workshop')}&image_size=landscape_4_3`}
                          alt={workshop.nome}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                      
                      {/* Workshop Info */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white font-inter">
                          {workshop.nome}
                        </h3>
                        
                        <p className="text-white/80 text-sm font-source line-clamp-2">
                          {workshop.descricao}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-white/70">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(workshop.data_inicio).toLocaleDateString()} - {new Date(workshop.data_fim).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{workshop.instrumento}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-white/70 text-sm">
                            <Users className="w-4 h-4 inline mr-1" />
                            {workshop.vagas_disponiveis}/{workshop.capacidade} vagas
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-white">R$ {workshop.preco}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
            
            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <h3 className="text-xl font-semibold text-white mb-6 font-inter">
                  Resumo da Inscrição
                </h3>
                
                {selectedWorkshops.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/60 mb-4">Nenhuma oficina selecionada</p>
                    <p className="text-white/40 text-sm">Selecione pelo menos uma oficina para continuar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedWorkshopData.map((workshop) => (
                      <div key={workshop.id} className="flex justify-between items-center py-3 border-b border-white/20">
                        <div>
                          <p className="text-white font-medium">{workshop.nome}</p>
                          <p className="text-white/60 text-sm">{workshop.instrumento}</p>
                        </div>
                        <span className="text-white font-bold">R$ {workshop.preco}</span>
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-white/20">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-white">Total:</span>
                        <span className="text-2xl font-bold text-white">R$ {totalPrice}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 space-y-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleNext}
                    icon={<ArrowRight className="w-5 h-5" />}
                  >
                    Continuar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <Link to="/oficinas">
                      <ArrowLeft className="w-5 h-5" />
                      Ver Todas as Oficinas
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Atenção</h3>
            <p className="text-white/80 mb-6">
              Você precisa selecionar pelo menos uma oficina para continuar com a inscrição.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmation(false)}
              >
                Entendi
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                asChild
              >
                <Link to="/oficinas">Ver Oficinas</Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Footer */}
      <footer className="py-8 border-t border-white/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/60 font-source">
            © 2024 LA Music Week. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Step 2: Student Data
function StudentDataStep() {
  const { studentData, updateStudentData, setCurrentStep, guests, updateGuests, workshops } = useStore();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [formData, setFormData] = useState({
    name: studentData.name || '',
    unidade: studentData.unidade || '',
    age: studentData.age || '',
    professorAtual: studentData.professorAtual || '',
    email: studentData.email || '',
    phone: studentData.phone || '',
    convidado: studentData.convidado || false,
    termos: studentData.termos || false,
    guardianName: studentData.guardianName || '',
    guardianPhone: studentData.guardianPhone || '',
    guardianEmail: studentData.guardianEmail || ''
  });
  const [unitName, setUnitName] = useState('');

  // Auto-preenchimento com dados do usuário logado
  useEffect(() => {
    if (user && profile && !studentData.name) {
      setFormData(prev => ({
        ...prev,
        name: profile.nome_completo || user.user_metadata?.name || '',
        email: user.email || '',
        phone: profile.telefone || user.user_metadata?.phone || ''
      }));
    }
  }, [user, profile, studentData.name]);

  // Buscar nome da unidade baseado no unit_id do usuário
  useEffect(() => {
    const fetchUnitName = async () => {
      if (profile?.unit_id) {
        try {
          const { data, error } = await supabase
            .from('unidades')
            .select('nome')
            .eq('id', profile.unit_id)
            .single();
          
          if (data && !error) {
            setUnitName(data.nome);
            setFormData(prev => ({ ...prev, unidade: data.nome }));
          }
        } catch (err) {
          console.error('Erro ao buscar unidade:', err);
        }
      }
    };
    
    fetchUnitName();
  }, [profile]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    const age = typeof formData.age === 'string' ? parseInt(formData.age) : formData.age;
    updateStudentData({
      ...formData,
      age,
      email: formData.email,
      phone: formData.phone
    });
    // Pula direto para confirmação já que não precisamos mais dos dados do responsável
    setCurrentStep(3);
  };

  const isFormValid = formData.name && formData.unidade && formData.age && formData.email && formData.phone && formData.termos;

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Dados do Aluno</h1>
              <p className="text-white/80">Preencha as informações do participante</p>
            </div>

            <Card className="p-8">
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
                  
                  {/* Formulário de convidados */}
                  {formData.convidado && (
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
                        availableWorkshops={workshops}
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
                      Eu aceito os termos de participação da LA Music Week 2025 e autorizo a participação do aluno nas oficinas selecionadas. *
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  icon={<ArrowLeft className="w-5 h-5" />}
                  className="flex-1"
                >
                  Voltar
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
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente removido - dados do responsável agora estão no StudentDataStep

// Step 4: Confirmation
function ConfirmationStep() {
  const { 
    selectedWorkshops, 
    workshops, 
    studentData, 
    guardianData, 
    guests,
    setCurrentStep,
    resetRegistration,
    createRegistration
  } = useStore();
  
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedWorkshopData = workshops.filter(w => selectedWorkshops.includes(w.id));
  const totalPrice = selectedWorkshopData.reduce((total, workshop) => total + workshop.preco, 0);

  const handleSubmit = async () => {
    if (!user) {
      showError('Erro de Autenticação', 'Você precisa estar logado para finalizar a inscrição.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Criar inscrições para cada workshop selecionado
      for (const workshopId of selectedWorkshops) {
        await createRegistration(workshopId, user.id, {
          name: studentData.name,
          age: studentData.age
        });
      }
      
      showSuccess(
        'Inscrição Realizada!',
        'Sua inscrição foi enviada com sucesso. Você receberá um e-mail de confirmação em breve.'
      );
      
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Erro ao enviar inscrição:', error);
      showError(
        'Erro na Inscrição',
        error.message || 'Ocorreu um erro ao processar sua inscrição. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewRegistration = () => {
    resetRegistration();
    setCurrentStep(1);
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">Inscrição Realizada!</h1>
                <p className="text-white/80 text-lg">
                  Sua inscrição foi enviada com sucesso. {totalPrice > 0 ? 'Em breve você receberá um e-mail com as instruções de pagamento.' : 'Como as oficinas selecionadas são gratuitas, você já está inscrito!'}
                </p>
              </div>

              <Card className="p-8 text-left mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Resumo da Inscrição</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-white/60 text-sm">Participante Principal</p>
                    <p className="text-white font-medium">{studentData.name}</p>
                  </div>
                  
                  {/* Convidados */}
                  {guests.length > 0 && (
                    <div>
                      <p className="text-white/60 text-sm">Convidados ({guests.length})</p>
                      <div className="space-y-1">
                        {guests.map((guest) => (
                          <p key={guest.id} className="text-white font-medium text-sm">
                            {guest.name} ({guest.age} anos)
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-white/60 text-sm">Oficinas Selecionadas</p>
                    <div className="space-y-2">
                      {selectedWorkshopData.map((workshop) => (
                        <div key={workshop.id} className="flex justify-between">
                          <span className="text-white">{workshop.nome}</span>
                          <span className="text-white font-medium">R$ {workshop.preco}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/20">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-white">Total:</span>
                      <span className="text-2xl font-bold text-white">
                        {totalPrice > 0 ? `R$ ${totalPrice}` : 'GRATUITO'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <Button
                  variant="primary"
                  onClick={handleNewRegistration}
                  className="w-full"
                >
                  Nova Inscrição
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="w-full"
                >
                  <Link to="/">Voltar ao Início</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Confirmação</h1>
              <p className="text-white/80">Revise os dados antes de finalizar a inscrição</p>
            </div>

            <div className="space-y-6">
              {/* Student Data */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Dados do Aluno</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/60">Nome:</p>
                    <p className="text-white font-medium">{studentData.name}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Idade:</p>
                    <p className="text-white font-medium">{studentData.age} anos</p>
                  </div>
                  <div>
                    <p className="text-white/60">Unidade:</p>
                    <p className="text-white font-medium">{studentData.unidade}</p>
                  </div>
                  <div>
                    <p className="text-white/60">E-mail:</p>
                    <p className="text-white font-medium">{studentData.email}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Telefone:</p>
                    <p className="text-white font-medium">{studentData.phone}</p>
                  </div>
                  {studentData.professorAtual && (
                    <div>
                      <p className="text-white/60">Professor Atual:</p>
                      <p className="text-white font-medium">{studentData.professorAtual}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Guardian Data (if provided) */}
              {(studentData.guardianName || studentData.guardianPhone || studentData.guardianEmail) && (
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Dados do Responsável</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {studentData.guardianName && (
                      <div>
                        <p className="text-white/60">Nome:</p>
                        <p className="text-white font-medium">{studentData.guardianName}</p>
                      </div>
                    )}
                    {studentData.guardianPhone && (
                      <div>
                        <p className="text-white/60">Telefone:</p>
                        <p className="text-white font-medium">{studentData.guardianPhone}</p>
                      </div>
                    )}
                    {studentData.guardianEmail && (
                      <div className="md:col-span-2">
                        <p className="text-white/60">E-mail:</p>
                        <p className="text-white font-medium">{studentData.guardianEmail}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}



              {/* Selected Workshops */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Oficinas Selecionadas</h3>
                <div className="space-y-4">
                  {selectedWorkshopData.map((workshop) => (
                    <div key={workshop.id} className="flex justify-between items-center py-3 border-b border-white/20 last:border-b-0">
                      <div>
                        <p className="text-white font-medium">{workshop.nome}</p>
                        <p className="text-white/60 text-sm">{workshop.instrumento}</p>
                        <p className="text-white/60 text-xs">
                          Participantes: {1 + guests.length} (Principal + {guests.length} convidados)
                        </p>
                      </div>
                      <span className="text-white font-bold">R$ {workshop.preco}</span>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">Total:</span>
                      <span className="text-2xl font-bold text-white">
                        {totalPrice > 0 ? `R$ ${totalPrice}` : 'GRATUITO'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Guest Details */}
              {guests.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Detalhes dos Convidados</h3>
                  <div className="space-y-4">
                    {guests.map((guest, index) => {
                      const guestWorkshop = workshops.find(w => w.id === (guest as any).workshopId);
                      return (
                        <div key={guest.id} className="border-b border-white/20 pb-4 last:border-b-0">
                          <h4 className="text-white font-medium mb-2">Convidado {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-white/60">Nome:</p>
                              <p className="text-white font-medium">{guest.name}</p>
                            </div>
                            <div>
                              <p className="text-white/60">Idade:</p>
                              <p className="text-white font-medium">{guest.age} anos</p>
                            </div>
                            <div>
                              <p className="text-white/60">Telefone:</p>
                              <p className="text-white font-medium">{(guest as any).phone}</p>
                            </div>
                            <div>
                              <p className="text-white/60">Oficina Escolhida:</p>
                              <p className="text-white font-medium">
                                {guestWorkshop ? `${guestWorkshop.nome} - ${guestWorkshop.instrumento}` : 'Oficina não encontrada'}
                              </p>
                            </div>
                            {guest.guardianName && (
                              <>
                                <div>
                                  <p className="text-white/60">Responsável:</p>
                                  <p className="text-white font-medium">{guest.guardianName}</p>
                                </div>
                                <div>
                                  <p className="text-white/60">Telefone do Responsável:</p>
                                  <p className="text-white font-medium">{guest.guardianPhone}</p>
                                </div>
                                {guest.guardianEmail && (
                                  <div className="md:col-span-2">
                                    <p className="text-white/60">E-mail do Responsável:</p>
                                    <p className="text-white font-medium">{guest.guardianEmail}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  icon={<ArrowLeft className="w-5 h-5" />}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Voltar
                </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                icon={isSubmitting ? <Clock className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                className="flex-1"
              >
                {isSubmitting ? 'Enviando...' : 'Finalizar Inscrição'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component that renders the appropriate step
function InscricaoSteps() {
  const { currentStep, studentData } = useStore();
  
  switch (currentStep) {
    case 2:
      return <StudentDataStep />;
    case 3:
      return <ConfirmationStep />;
    default:
      return <StudentDataStep />;
  }
}