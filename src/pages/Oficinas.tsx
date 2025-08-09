import { useState, useEffect } from 'react';
import { Search, Filter, Clock, Users, Star, Calendar } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import EnrollmentModal from '@/components/EnrollmentModal';
import { useStore } from '../store/useStore';
import { useAuth } from '@/contexts/authcontext';
import { useToast } from '@/contexts/ToastContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// Função auxiliar para obter o nome da unidade
const getUnitName = (unitId: string): string => {
  const unidades: { [key: string]: string } = {
    '8f424adf-64ca-43e9-909c-8dfd6783ac15': 'Barra',
    '19df29a0-83ba-4b1e-a2f7-cb3ac8d25b4f': 'Campo Grande',
    'a4e3815c-8a34-4ef1-9773-cdeabdce1003': 'Recreio'
  };
  return unidades[unitId] || 'Unidade não encontrada';
};

export default function Oficinas() {
  const { createRegistration } = useStore();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();
  
  const { workshops, fetchWorkshops } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkshops = async () => {
      try {
        // Se está carregando o perfil, aguardar
        if (profileLoading) {
          return;
        }
        
        if (user && profile?.unit_id && profile?.user_type !== 'admin') {
          // Se o usuário estiver logado, tiver uma unidade e NÃO for admin, buscar workshops da unidade
          console.log('🏢 Carregando workshops para unidade:', profile.unit_id);
          await fetchWorkshops(profile.unit_id);
        } else {
          // Caso contrário (usuário anônimo, sem unidade ou admin), buscar todos os workshops
          console.log('🌐 Carregando todos os workshops');
          await fetchWorkshops();
        }
      } catch (error) {
        console.error('Erro ao carregar workshops:', error);
      }
    };

    loadWorkshops();
  }, [user, profile?.unit_id, profileLoading]); // Removido fetchWorkshops das dependências para evitar loop infinito



  const handleEnroll = async (workshopId: string) => {
    try {
      // Se não há usuário autenticado, redirecionar para login
      if (!user) {
        showInfo('Você precisa fazer login para se inscrever em uma oficina.');
        // Salvar o workshop ID para redirecionamento após login
        localStorage.setItem('pendingWorkshopEnrollment', workshopId);
        navigate('/login');
        return;
      }
      
      // Verificar se o workshop existe localmente primeiro
      const workshop = workshops.find(w => w.id === workshopId);
      if (!workshop) {
        showError('Workshop não encontrado.');
        return;
      }
      
      // Verificar se o usuário pode se inscrever nesta oficina (mesma unidade, exceto para admins)
      if (profile?.unit_id && workshop.unit_id !== profile.unit_id && profile?.user_type !== 'admin') {
        showError('Você só pode se inscrever em oficinas da sua unidade.');
        return;
      }
      
      // Buscar dados do usuário e verificar inscrições em uma única query otimizada
      const [userResult, registrationResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, data_nascimento')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('inscricoes')
          .select('id, status_inscricao')
          .eq('workshop_id', workshopId)
          .eq('user_id', user.id)
          .neq('status_inscricao', 'cancelada')
          .maybeSingle()
      ]);
      
      if (userResult.error) {
        console.error('Erro ao buscar dados do usuário:', userResult.error);
        showError('Erro ao verificar dados do usuário.');
        return;
      }
      
      if (registrationResult.error && registrationResult.error.code !== 'PGRST116') {
        console.error('Erro ao verificar inscrições:', registrationResult.error);
        showError('Erro ao verificar inscrições existentes.');
        return;
      }
      
      // Verificar se já está inscrito
      if (registrationResult.data) {
        showError('Você já está inscrito neste workshop.');
        return;
      }
      
      // Verificar vagas disponíveis
      if (workshop.vagas_disponiveis <= 0) {
        showError('Não há vagas disponíveis para este workshop.');
        return;
      }
      
      // Verificar validação de idade
      if (userResult.data.data_nascimento) {
        const birthDate = new Date(userResult.data.data_nascimento);
        const today = new Date();
        const userAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Ajustar idade se ainda não fez aniversário este ano
        const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
          ? userAge - 1 
          : userAge;
        
        const minAge = workshop.idade_minima || 0;
        const maxAge = workshop.idade_maxima || 100;
        
        if (finalAge < minAge || finalAge > maxAge) {
          showError(
            'Idade não permitida',
            `Esta oficina é destinada para idades entre ${minAge} e ${maxAge} anos. Sua idade atual é ${finalAge} anos.`
          );
          return;
        }
      }
      
      // Abrir modal de inscrição
      setSelectedWorkshop(workshop);
      setIsModalOpen(true);
    } catch (error: any) {
      console.error('Erro no handleEnroll:', error);
      if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        showError('Tempo limite excedido. Verifique sua conexão e tente novamente.');
      } else {
        showError(error.message || 'Erro ao verificar inscrição. Tente novamente.');
      }
    }
  };



  // Remover categorias mockadas - usar apenas instrumentos reais do banco de dados
  const categories = ['all'];


  const filteredWorkshops = workshops.filter(workshop => {
    // Verificações de segurança para evitar erros com propriedades undefined
    const nome = workshop.nome || '';
    const descricao = workshop.descricao || '';
    const nivel = workshop.nivel || '';
    const instrumento = workshop.instrumento || '';
    const status = workshop.status || '';
    
    // Filtrar apenas workshops ativos e com vagas disponíveis
    const isActive = status === 'ativa';
    const hasAvailableSlots = (workshop.vagas_disponiveis || 0) > 0;
    
    const matchesSearch = nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = true;
    const matchesCategory = selectedCategory === 'all' || instrumento === selectedCategory;
    
    return isActive && hasAvailableSlots && matchesSearch && matchesLevel && matchesCategory;
  });



  const getUnitColor = (unidade: string) => {
    switch (unidade) {
      case 'Barra': return 'bg-blue-500';
      case 'Campo Grande': return 'bg-green-500';
      case 'Recreio': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden fullscreen-content">
      <Navigation />
      
      {/* Header */}
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4 notch-safe">
          <div className="text-center mb-8 md:mb-12 px-4 animate-fadeInUp notch-safe-top">
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 md:mb-6 glow font-inter animate-fadeInUp" style={{animationDelay: '0.1s'}}>
              Oficinas Disponíveis
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto font-source animate-fadeInUp" style={{animationDelay: '0.2s'}}>
              Explore nossa seleção de oficinas musicais e encontre a perfeita para o seu nível e interesse.
            </p>

          </div>
          
          {profileError && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-center">
                <p className="text-red-200 mb-4">{profileError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Recarregar Página
                </button>
              </div>
            </div>
          )}
          


          {/* Filters */}
          <Card className="mb-6 md:mb-8 animate-fadeInUp pwa-touch-area" style={{animationDelay: '0.3s'}}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-0.5 md:left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-2.5 h-2.5 md:w-5 md:h-5 z-20" />
                <input
                  type="text"
                  placeholder="Buscar oficinas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-5 md:pl-12 pr-4 py-4 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base input-mobile-optimized touch-target"
                />
              </div>
              

              
              {/* Instrumento Filter */}
              <div className="relative">
                <Calendar className="absolute left-1 md:left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-2.5 h-2.5 md:w-5 md:h-5 z-20" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-6 md:pl-12 pr-8 py-4 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none text-sm md:text-base input-mobile-optimized touch-target"
                >
                  <option value="all" className="bg-gray-800">Todos os instrumentos</option>
                  {Array.from(new Set(workshops.map(w => w.instrumento).filter(Boolean))).map(instrumento => (
                    <option key={instrumento} value={instrumento} className="bg-gray-800">
                      {instrumento}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Workshops Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {workshops.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-8 md:py-12">
              <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-white/80 text-sm md:text-base">
                {user && profile?.unit_id 
                  ? `Carregando oficinas da unidade ${getUnitName(profile.unit_id)}...`
                  : 'Carregando oficinas disponíveis...'
                }
              </p>
            </div>
          ) : filteredWorkshops.length === 0 ? (
            <Card className="text-center py-8 md:py-12">
              <h3 className="text-lg md:text-2xl font-semibold text-white mb-3 md:mb-4">Nenhuma oficina encontrada</h3>
              <p className="text-sm md:text-base text-white/80">
                {user && profile?.unit_id 
                  ? `Não há oficinas disponíveis na unidade ${getUnitName(profile.unit_id)} no momento.`
                  : 'Tente ajustar os filtros para encontrar oficinas disponíveis.'
                }
              </p>
            </Card>
          ) : (
            <>
              {/* Contador de oficinas */}
              <div className="mb-6 text-center">
                <p className="text-white/80 text-sm md:text-base">
                  {user && profile?.unit_id 
                    ? `Exibindo ${filteredWorkshops.length} oficina${filteredWorkshops.length !== 1 ? 's' : ''} da unidade ${getUnitName(profile.unit_id)}`
                    : `Exibindo ${filteredWorkshops.length} oficina${filteredWorkshops.length !== 1 ? 's' : ''} disponíveis`
                  }
                </p>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 px-2 md:px-0 grid-mobile-safe">
              {filteredWorkshops.map((workshop, index) => {
                // Verificações de segurança para propriedades
                const nome = workshop.nome || 'Workshop sem nome';
                const descricao = workshop.descricao || 'Descrição não disponível';
                const instrumento = workshop.instrumento || 'Instrumento';
                const local = workshop.local || 'Local não informado';
                const preco = workshop.preco || 0;
                const status = workshop.status || 'inativo';
                const vagas_disponiveis = workshop.vagas_disponiveis || 0;
                const capacidade = workshop.capacidade || 1;
                const data_inicio = workshop.data_inicio || new Date().toISOString();
                const data_fim = workshop.data_fim || new Date().toISOString();
                const idade_minima = workshop.idade_minima;
                const idade_maxima = workshop.idade_maxima;
                
                return (
                <Card key={workshop.id} className="group hover:scale-[1.02] md:hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 cursor-pointer animate-fadeInUp overflow-hidden workshop-card" style={{animationDelay: `${0.4 + index * 0.1}s`}}>
                  {/* Image */}
                  <div className="relative overflow-hidden rounded-lg mb-4">
                    <img
                       src={workshop.image && workshop.image.trim() !== '' ? workshop.image : '/assets/lamusic.png'}
                       alt={nome}
                       className="w-full h-48 object-cover rounded-lg group-hover:scale-110 transition-transform duration-500"
                       onError={(e) => {
                         e.currentTarget.src = '/assets/lamusic.png';
                       }}
                     />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 ${getUnitColor(workshop.unidade)} text-white text-sm rounded-full font-medium`}>
                         {workshop.unidade}
                       </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-black/50 text-white text-sm rounded-full font-medium">
                         {instrumento}
                       </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-3 md:space-y-4 p-1">
                    <div>
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h3 className="text-base md:text-lg lg:text-xl font-semibold text-white font-inter leading-tight flex-1 min-w-0 workshop-title">
                           <span className="block">{nome}</span>
                         </h3>
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'ativa' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                        </div>
                      </div>
                       <p className="text-white/80 text-sm font-source line-clamp-2 break-words">
                         {descricao}
                       </p>
                    </div>
                    
                    {/* Professor */}
                    <div className="flex items-center gap-2 text-white/70">
                       <Users className="w-4 h-4 flex-shrink-0" />
                       <span className="text-sm truncate flex-1 min-w-0">Prof. {workshop.instructor || 'A definir'}</span>
                     </div>
                    
                    {/* Data */}
                    <div className="flex items-center gap-1 text-sm text-white/70">
                       <Clock className="w-4 h-4 flex-shrink-0" />
                       <span className="truncate">{new Date(data_inicio).toLocaleDateString()}</span>
                     </div>
                    
                    {/* Workshop Info */}
                    <div className="text-sm text-white/70">
                       <div className="flex justify-between items-center gap-1 mb-2">
                         <span className="truncate">Local: {local}</span>
                         <span className="text-xs sm:text-sm whitespace-nowrap">{Math.max(0, vagas_disponiveis)}/{capacidade} vagas</span>
                       </div>
                       <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                         <div 
                           className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                           style={{ width: `${Math.max(0, Math.min(100, ((capacidade - vagas_disponiveis) / capacidade) * 100))}%` }}
                         />
                       </div>
                       {/* Classificação Etária */}
                       {(idade_minima || idade_maxima) && (
                         <div className="text-xs text-white/60">
                           <span className="font-medium">Idade: </span>
                           {idade_minima && idade_maxima ? (
                             `${idade_minima} - ${idade_maxima} anos`
                           ) : idade_minima ? (
                             `A partir de ${idade_minima} anos`
                           ) : (
                             `Até ${idade_maxima} anos`
                           )}
                         </div>
                       )}
                     </div>
                    
                    {/* Schedule */}
                    <div className="text-sm text-white/70">
                       <p className="font-medium mb-1">Status:</p>
                       <span className={`px-2 py-1 rounded-full text-xs ${
                         status === 'ativa' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                       }`}>
                         {status === 'ativa' ? 'Ativo' : 'Inativo'}
                       </span>
                     </div>
                    
                    {/* Price & Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-white/20">
                      <div className="text-center sm:text-left">
                         <span className="text-xl sm:text-2xl font-bold text-white">R$ {preco}</span>
                         <span className="text-white/60 text-sm ml-1">/ oficina</span>
                       </div>
                       <Button
                         variant="primary"
                         size="sm"
                         disabled={vagas_disponiveis === 0 || status !== 'ativa'}
                         onClick={() => handleEnroll(workshop.id)}
                         className="w-full sm:w-auto text-sm px-4 py-2 md:py-3 hover:scale-[1.02] md:hover:scale-105 transition-transform duration-300 btn-mobile-optimized touch-target bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl"
                       >
                         {vagas_disponiveis === 0 ? 'Lotado' : status !== 'ativa' ? 'Indisponível' : 'Inscrever-se'}
                       </Button>
                    </div>
                  </div>
                </Card>
                );
              })}
            </div>
            </>
          )}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t border-white/20 notch-safe-bottom">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/60 font-source">
            © 2024 LA Music Week. Todos os direitos reservados.
          </p>
        </div>
      </footer>
      
      {/* Modal de Inscrição */}
      {selectedWorkshop && (
        <EnrollmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedWorkshop(null);
          }}
          workshop={selectedWorkshop}
        />
      )}
    </div>
  );
}