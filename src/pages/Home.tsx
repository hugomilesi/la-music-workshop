import { Link } from 'react-router-dom';
import { Music, Users, Calendar, Award, Phone, Mail, MapPin, ArrowRight, Clock, GraduationCap } from 'lucide-react';
import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import GlowCard from '@/components/GlowCard';
import Carousel from '@/components/Carousel';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/authcontext';
import AuroraEffect from '@/components/AuroraEffect';

export default function Home() {
  // Para a página home, o carrossel deve mostrar TODAS as oficinas independente da unidade
  // conforme especificado no todo.md: "O carrossel deve mostrar todas as oficinas, independentemente da unidade do aluno"
  const { workshops, fetchWorkshops, loading } = useStore();

  console.log('🏠 Home render:', {
    workshopsLength: workshops.length,
    loadingWorkshops: loading.workshops,
    workshops: workshops.map(w => ({ id: w.id, nome: w.nome, status: w.status }))
  });
  const { user, userProfile } = useAuth();

  useEffect(() => {
    console.log('🏠 Home: Carregando workshops...');
    fetchWorkshops();
  }, []); // Removido fetchWorkshops das dependências para evitar loop infinito

  // Debug logs
  useEffect(() => {
    console.log('🏠 Home: workshops atualizados:', {
      total: workshops.length,
      workshops: workshops.map(w => ({ id: w.id, nome: w.nome, status: w.status, vagas: w.vagas_disponiveis }))
    });
  }, [workshops]);
  // Calcular dados dinâmicos das oficinas
  const getDynamicFeatures = () => {
    const totalWorkshops = workshops.filter(w => w.status === 'ativa').length;
    
    // Calcular total de dias únicos baseado nas datas das oficinas
    const uniqueDates = new Set();
    workshops.forEach(workshop => {
      if (workshop.data_inicio && workshop.data_fim) {
        const startDate = new Date(workshop.data_inicio);
        const endDate = new Date(workshop.data_fim);
        
        // Adicionar todos os dias entre data_inicio e data_fim
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          uniqueDates.add(d.toDateString());
        }
      }
    });
    
    const totalDays = uniqueDates.size || 6; // Fallback para 6 dias
    
    return [
      {
        icon: Calendar,
        title: `${totalDays} Dias`,
        description: 'Total de dias de eventos musicais intensivos e transformadores.',
      },
      {
        icon: Music,
        title: `${totalWorkshops} Oficinas`,
        description: 'Total de oficinas disponíveis para todos os níveis e instrumentos.',
      },
      {
        icon: GraduationCap,
        title: 'Professores Qualificados',
        description: 'Experiência e paixão pela música',
      },
    ];
  };
  
  const features = getDynamicFeatures();

  // Função para obter cor da unidade
  const getUnitColor = (unidade: string) => {
    switch (unidade) {
      case 'Barra': return 'bg-blue-500';
      case 'Campo Grande': return 'bg-green-500';
      case 'Recreio': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Filtrar apenas workshops ativos e com vagas disponíveis para o carrossel
  const featuredWorkshops = workshops
    .filter(workshop => {
      const isActive = workshop.status === 'ativa';
      const hasSlots = (workshop.vagas_disponiveis || 0) > 0;
      console.log('🔍 Filtrando workshop:', {
        nome: workshop.nome,
        status: workshop.status,
        isActive,
        vagas_disponiveis: workshop.vagas_disponiveis,
        hasSlots,
        passedFilter: isActive && hasSlots
      });
      return isActive && hasSlots;
    })
    .slice(0, 8); // Limitar a 8 workshops para o carrossel

  console.log('🎯 Featured workshops final:', {
    totalWorkshops: workshops.length,
    featuredCount: featuredWorkshops.length,
    featured: featuredWorkshops.map(w => ({ id: w.id, nome: w.nome, status: w.status, vagas: w.vagas_disponiveis }))
  });



  // Calcular data dinâmica baseada nos eventos
  const getEventDateRange = () => {
    if (workshops.length === 0) {
      return '18 a 23 de Agosto de 2025'; // Fallback se não houver workshops
    }

    const validWorkshops = workshops.filter(w => w.data_inicio && w.data_fim);
    if (validWorkshops.length === 0) {
      return '18 a 23 de Agosto de 2025'; // Fallback se não houver datas válidas
    }

    // Encontrar a data mais antiga e mais recente
    const startDates = validWorkshops.map(w => new Date(w.data_inicio));
    const endDates = validWorkshops.map(w => new Date(w.data_fim));
    
    const earliestDate = new Date(Math.min(...startDates.map(d => d.getTime())));
    const latestDate = new Date(Math.max(...endDates.map(d => d.getTime())));

    // Formatação em português
    const formatDate = (date: Date) => {
      const day = date.getDate();
      const month = date.toLocaleDateString('pt-BR', { month: 'long' });
      const year = date.getFullYear();
      return { day, month, year };
    };

    const start = formatDate(earliestDate);
    const end = formatDate(latestDate);

    // Se for o mesmo mês e ano
    if (start.month === end.month && start.year === end.year) {
      return `${start.day} a ${end.day} de ${start.month} de ${start.year}`;
    }
    // Se for o mesmo ano mas meses diferentes
    else if (start.year === end.year) {
      return `${start.day} de ${start.month} a ${end.day} de ${end.month} de ${start.year}`;
    }
    // Se forem anos diferentes
    else {
      return `${start.day} de ${start.month} de ${start.year} a ${end.day} de ${end.month} de ${end.year}`;
    }
  };

  return (
    <div className="min-h-screen">
      <AuroraEffect />
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden notch-safe-top">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-hero animate-gradient" />
        
        {/* Floating Elements - Responsive sizes */}
        <div className="absolute top-20 left-4 md:left-10 w-12 h-12 md:w-20 md:h-20 bg-white/10 rounded-full animate-float" />
        <div className="absolute top-40 right-4 md:right-20 w-10 h-10 md:w-16 md:h-16 bg-purple-400/20 rounded-full animate-bounce-slow" />
        <div className="absolute bottom-40 left-4 md:left-20 w-8 h-8 md:w-12 md:h-12 bg-pink-400/20 rounded-full animate-pulse-slow" />
        
        <div className="container mx-auto px-4 text-center relative z-10 notch-safe">
          <div className="max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-3 md:mb-4">
              <img 
                src="/assets/Logo Kids e LA.png" 
                alt="LA Music Week Logo" 
                className="mx-auto w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 object-contain drop-shadow-2xl glow animate-logo-pulse"
              />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 glow font-inter leading-tight">
              LA Music Week
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 md:mb-8 font-source leading-relaxed px-2">Uma imersão sonora do seu jeito, no nosso ritmo. 
 
 Desperte sua paixão pela música com nossas oficinas exclusivas. Violão, piano, bateria, canto e muito mais te esperam!</p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-2 pwa-touch-area">
              <Button
                size="lg"
                variant="primary"
                icon={<Calendar className="w-5 h-5 md:w-6 md:h-6" />}
                asChild
                className="w-full sm:w-auto min-h-[48px] text-base md:text-lg btn-mobile-optimized touch-target"
              >
                <Link to="/oficinas">Ver Oficinas</Link>
              </Button>
            </div>
            
            <div className="mt-4 md:mt-6">
              <p className="text-base md:text-lg text-white/80 font-source">{getEventDateRange()}</p>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator - Hidden on mobile */}
        <div className="hidden md:block absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6 font-inter px-2">
              Por que escolher a LA Music Week?
            </h2>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto font-source px-4">
              Uma experiência musical única que combina aprendizado, diversão e networking em um ambiente inspirador.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center group p-6 md:p-8">
                  <div className="mb-4 md:mb-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4 font-inter">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-white/80 font-source leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workshops Preview */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6 font-inter px-2">
              Oficinas em Destaque
            </h2>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto font-source px-4">
              Conheça algumas das oficinas que farão parte da LA Music Week.
            </p>
          </div>
          
          {/* Carousel de Oficinas */}
          <div className="max-w-6xl mx-auto mb-12">
            {loading.workshops ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/80">Carregando oficinas...</p>
              </div>
            ) : workshops.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/80 text-lg">Nenhuma oficina encontrada.</p>
                <p className="text-white/60 text-sm mt-2">Verifique a conexão com o banco de dados!</p>
              </div>
            ) : featuredWorkshops.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/80 text-lg">Nenhuma oficina ativa com vagas disponíveis.</p>
                <p className="text-white/60 text-sm mt-2">Total de workshops: {workshops.length}</p>
                <p className="text-white/60 text-sm">Workshops ativos: {workshops.filter(w => w.status === 'ativa').length}</p>
                <p className="text-white/60 text-sm">Com vagas: {workshops.filter(w => (w.vagas_disponiveis || 0) > 0).length}</p>
              </div>
            ) : (
              <Carousel 
                autoPlay={true} 
                autoPlayInterval={4000}
                itemWidth="400px"
                gap="24px"
              >
                {featuredWorkshops.map((workshop, index) => {
                  const nome = workshop.nome || 'Workshop';
                  const descricao = workshop.descricao || 'Descrição não disponível';
                  const instrumento = workshop.instrumento || 'Música';

                  const local = workshop.local || 'Local a definir';
                  const data_inicio = workshop.data_inicio ? new Date(workshop.data_inicio).toLocaleDateString() : 'Data a definir';
                  const data_fim = workshop.data_fim ? new Date(workshop.data_fim).toLocaleDateString() : 'Data a definir';
                  const vagas_disponiveis = workshop.vagas_disponiveis || 0;
                  const capacidade = workshop.capacidade || 1;
                  
                  return (
                    <div key={workshop.id || index} className="flex-shrink-0">
                      <GlowCard className="overflow-hidden group w-full h-full">
                        <div className="relative mb-6">
                          <img
                            src={workshop.image && workshop.image.trim() !== '' ? workshop.image : '/assets/lamusic.png'}
                            alt={nome}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== '/assets/lamusic.png') {
                                target.src = '/assets/lamusic.png';
                              }
                            }}
                            className="w-full h-64 object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
                          />

                          <div className="absolute top-4 left-4">
                            <span className={`px-3 py-1 ${getUnitColor(workshop.unidade)} text-white text-sm rounded-full font-medium`}>
                              {workshop.unidade}
                            </span>
                          </div>
                          <div className="absolute bottom-4 left-4">
                            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                              <span className="text-white text-sm font-medium">
                                {data_inicio} - {data_fim}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center h-48 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-3 font-inter line-clamp-2">
                              {nome}
                            </h3>
                            
                            <p className="text-base text-white/90 mb-4 font-source leading-relaxed line-clamp-3">
                              {descricao}
                            </p>
                          </div>
                          
                          <div className="flex justify-center items-center gap-4 text-white/80 text-sm">
                            <span className="flex items-center gap-2">
                              <Music className="w-4 h-4" />
                              {instrumento}
                            </span>
                            <span className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {Math.max(0, vagas_disponiveis)}/{capacidade} vagas
                            </span>
                          </div>
                        </div>
                      </GlowCard>
                    </div>
                  );
                })}
              </Carousel>
            )}
          </div>
          
          <div className="text-center">
            <Button
              size="lg"
              variant="secondary"
              icon={<ArrowRight className="w-6 h-6" />}
              asChild
            >
              <Link to="/oficinas">Ver Todas as Oficinas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6 font-inter px-2">
                Entre em Contato
              </h2>
              <p className="text-lg md:text-xl text-white/80 mb-6 md:mb-8 font-source px-4">
                Tem dúvidas? Nossa equipe está pronta para ajudar você!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
                {/* Primeira linha */}
                <div className="flex flex-col items-center space-y-3 md:space-y-4 p-4 md:p-8 min-h-[140px] md:min-h-[180px] bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white text-center">Recreio</h3>
                  <div className="text-center space-y-2 md:space-y-3">
                    <p className="text-white/90 text-sm md:text-base font-medium">21 97560-6206</p>
                    <p className="text-white/70 text-xs md:text-sm leading-relaxed">
                      atendimento.recreio@lamusicschool.com.br
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-3 md:space-y-4 p-4 md:p-8 min-h-[140px] md:min-h-[180px] bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white text-center">Barra</h3>
                  <div className="text-center space-y-2 md:space-y-3">
                    <p className="text-white/90 text-sm md:text-base font-medium">21 96957-5619</p>
                    <p className="text-white/70 text-xs md:text-sm leading-relaxed">
                      atendimento2.barra@lamusicschool.com.br
                    </p>
                  </div>
                </div>
                
                {/* Segunda linha */}
                <div className="flex flex-col items-center space-y-3 md:space-y-4 p-4 md:p-8 min-h-[140px] md:min-h-[180px] bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white text-center">Campo Grande</h3>
                  <div className="text-center space-y-2 md:space-y-3">
                    <p className="text-white/90 text-sm md:text-base font-medium">21 97361-4083</p>
                    <p className="text-white/70 text-xs md:text-sm leading-relaxed">
                      atendimento2.cg@lamusicschool.com.br
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-3 md:space-y-4 p-4 md:p-8 min-h-[140px] md:min-h-[180px] bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-primary rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white text-center">Localização</h3>
                  <div className="text-center">
                    <p className="text-white/90 text-sm md:text-base font-medium">Rio de Janeiro, RJ</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-6 md:py-8 border-t border-white/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm md:text-base text-white/60 font-source">
            © 2024 LA Music Week. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}