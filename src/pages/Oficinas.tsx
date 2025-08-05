import { useState, useEffect } from 'react';
import { Search, Filter, Clock, Users, Star, Calendar } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
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
  const { workshops, fetchWorkshops, loading, createRegistration } = useStore();
  const { user, signInAnonymously } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Só busca workshops quando o perfil estiver carregado (ou quando não há usuário logado)
    if (!user || (!profileLoading && profile)) {
      // Se for admin, buscar todas as oficinas (sem filtro de unidade)
      // Se for aluno/responsável, buscar apenas da sua unidade
      const shouldFilterByUnit = profile?.user_type !== 'admin';
      fetchWorkshops(shouldFilterByUnit ? profile?.unit_id : undefined);
    }
  }, [user, profile, profileLoading, fetchWorkshops]);

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
      
      // Primeiro buscar o ID do usuário na tabela users
      let { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, data_nascimento')
        .eq('user_id', user.id)
        .single();
      
      if (userError) {
        showError('Erro ao verificar dados do usuário.');
        return;
      }
      
      // Verificar validação de idade
      const workshop = workshops.find(w => w.id === workshopId);
      if (workshop && userRecord.data_nascimento) {
        const birthDate = new Date(userRecord.data_nascimento);
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
      
      // Verificar se o usuário já está inscrito neste workshop
      const userRegistrations = await supabase
        .from('inscricoes')
        .select('id')
        .eq('workshop_id', workshopId)
        .eq('user_id', userRecord.id)
        .maybeSingle();
      
      if (userRegistrations.data) {
        showError('Você já está inscrito neste workshop.');
        return;
      }
      
      // Salvar o workshop selecionado e redirecionar para o formulário de inscrição
      localStorage.setItem('selectedWorkshopId', workshopId);
      navigate('/inscricao');
    } catch (error: any) {
      showError(error.message || 'Erro ao verificar inscrição. Tente novamente.');
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
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header */}
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 glow font-inter">
              Oficinas Disponíveis
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto font-source">
              Explore nossa seleção de oficinas musicais e encontre a perfeita para o seu nível e interesse.
            </p>
            {user && profile && (
              <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg max-w-2xl mx-auto">
                <p className="text-blue-200 text-sm">
                  {profile.user_type === 'admin' ? (
                    <><span className="font-medium">Visualização:</span> Exibindo todas as oficinas de todas as unidades</>
                  ) : (
                    <><span className="font-medium">Filtro ativo:</span> Exibindo apenas oficinas da sua unidade ({getUnitName(profile.unit_id)})</>
                  )}
                </p>
              </div>
            )}
          </div>
          
          {/* Filters */}
          <Card className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar oficinas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              

              
              {/* Instrumento Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
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
          {filteredWorkshops.length === 0 ? (
            <Card className="text-center py-12">
              <h3 className="text-2xl font-semibold text-white mb-4">Nenhuma oficina encontrada</h3>
              <p className="text-white/80">Tente ajustar os filtros para encontrar oficinas disponíveis.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredWorkshops.map((workshop) => {
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
                
                return (
                <Card key={workshop.id} className="group hover:scale-105 transition-all duration-300 cursor-pointer">
                  {/* Image */}
                  <div className="relative overflow-hidden rounded-lg mb-4">
                    <img
                       src={`https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(instrumento + ' music workshop')}&image_size=landscape_4_3`}
                       alt={nome}
                       className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
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
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-white font-inter">
                           {nome}
                         </h3>

                      </div>
                       <p className="text-white/80 text-sm font-source">
                         {descricao}
                       </p>
                    </div>
                    
                    {/* Professor */}
                    <div className="flex items-center gap-2 text-white/70">
                       <Users className="w-4 h-4" />
                       <span className="text-sm">Prof. {workshop.instructor || 'A definir'}</span>
                     </div>
                    
                    {/* Data e Vagas */}
                    <div className="flex items-center justify-between text-sm text-white/70">
                       <div className="flex items-center gap-1">
                         <Clock className="w-4 h-4" />
                         <span>{new Date(data_inicio).toLocaleDateString()}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <Users className="w-4 h-4" />
                         <span>{vagas_disponiveis}/{capacidade} vagas</span>
                       </div>
                     </div>
                    
                    {/* Participants Progress */}
                    <div className="text-sm text-white/70">
                       <div className="flex justify-between items-center mb-1">
                         <span>Local: {local}</span>
                         <span>{capacidade - vagas_disponiveis}/{capacidade} inscritos</span>
                       </div>
                       <div className="w-full bg-white/20 rounded-full h-2">
                         <div 
                           className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                           style={{ width: `${((capacidade - vagas_disponiveis) / capacidade) * 100}%` }}
                         />
                       </div>
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
                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                      <div>
                         <span className="text-2xl font-bold text-white">R$ {preco}</span>
                         <span className="text-white/60 text-sm ml-1">/ oficina</span>
                       </div>
                       <Button
                         variant="primary"
                         size="sm"
                         disabled={vagas_disponiveis === 0 || status !== 'ativa'}
                         onClick={() => handleEnroll(workshop.id)}
                       >
                         {vagas_disponiveis === 0 ? 'Lotado' : status !== 'ativa' ? 'Indisponível' : 'Inscrever-se'}
                       </Button>
                    </div>
                  </div>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
      
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