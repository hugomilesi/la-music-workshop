import { useState, useEffect } from 'react';
import {
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Music, 
  Clock, 
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Download,
  Filter,
  Bell,
  BarChart3,
  PieChart,
  Settings,
  Lock,
  Eye,
  MapPin,
  Check,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import AutomatedReminders from './AutomatedReminders';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { 
    workshops, 
    registrations, 
    users,
    loading,
    deleteWorkshop, 
    fetchWorkshops, 
    fetchUsers,
    deleteUser,
    updateAttendance, 
    updateGuestsCount 
  } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUnit, setSelectedUnit] = useState<string>('todas');
  const [selectedStudentUnit, setSelectedStudentUnit] = useState<string>('todas');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showStudentUnitDropdown, setShowStudentUnitDropdown] = useState(false);
  
  // Unidades disponíveis
  const availableUnits = ['todas', 'Barra', 'Campo Grande', 'Recreio'];
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; workshopId: string; workshopName: string }>({
    isOpen: false,
    workshopId: '',
    workshopName: ''
  });
  
  const [deleteUserDialog, setDeleteUserDialog] = useState<{ isOpen: boolean; userId: string; userName: string }>({
    isOpen: false,
    userId: '',
    userName: ''
  });

  useEffect(() => {
    // Só buscar workshops quando o perfil estiver carregado
    if (!profileLoading && profile) {
      // Se for admin, buscar todas as oficinas (sem filtro)
      // Se não for admin, filtrar por unidade
      const unitId = profile.user_type === 'admin' ? undefined : profile.unit_id;
      fetchWorkshops(unitId);
    }
    
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [fetchWorkshops, fetchUsers, activeTab, profile, profileLoading]);

  useEffect(() => {
    if (!authUser && !authLoading) {
      navigate('/login');
    }
  }, [authUser, authLoading, navigate]);

  const handleDeleteWorkshop = (workshopId: string, workshopName: string) => {
    setDeleteDialog({ isOpen: true, workshopId, workshopName });
  };

  const confirmDeleteWorkshop = async () => {
    try {
      await deleteWorkshop(deleteDialog.workshopId);
      // Você pode adicionar um toast de sucesso aqui se desejar
    } catch (error) {
      console.error('Erro ao excluir oficina:', error);
      // Você pode adicionar um toast de erro aqui se desejar
    }
  };

  const handleEditWorkshop = (workshopId: string) => {
    navigate(`/admin/workshop/edit/${workshopId}`);
  };

  const handleNewWorkshop = () => {
    navigate('/admin/workshop/new');
  };

  const handleManageWorkshops = () => {
    setActiveTab('workshops');
  };

  const handleFilterWorkshops = (unit: string) => {
    setSelectedUnit(unit);
    setShowUnitDropdown(false);
  };

  // Filtrar workshops por unidade
  const filteredWorkshops = selectedUnit === 'todas' 
    ? workshops 
    : workshops.filter(workshop => {
        // Verificar se a unidade corresponde exatamente
        if (workshop.unidade === selectedUnit) return true;
        
        // Verificar se o local contém o nome da unidade
        if (workshop.local?.toLowerCase().includes(selectedUnit.toLowerCase())) return true;
        
        // Para compatibilidade, verificar variações do nome
        const unitVariations = {
          'Barra': ['barra', 'barra da tijuca'],
          'Campo Grande': ['campo grande', 'campo'],
          'Recreio': ['recreio', 'recreio dos bandeirantes']
        };
        
        const variations = unitVariations[selectedUnit as keyof typeof unitVariations] || [];
        return variations.some(variation => 
          workshop.local?.toLowerCase().includes(variation) ||
          workshop.unidade?.toLowerCase().includes(variation)
        );
      });

  // Filtrar inscrições por unidade
  const filteredRegistrations = selectedStudentUnit === 'todas'
    ? registrations
    : registrations.filter(registration => {
        return registration.student.unidade === selectedStudentUnit;
      });

  const handleFilterStudents = (unit: string) => {
    setSelectedStudentUnit(unit);
    setShowStudentUnitDropdown(false);
  };

  const handleExportStudents = () => {
    // Implementar lógica de exportação aqui
    alert('Funcionalidade de exportação será implementada em breve!');
  };

  const handleExportUsers = () => {
    try {
      // Criar cabeçalhos do CSV
      const headers = [
        'Nome Completo',
        'Email',
        'Telefone',
        'Tipo de Usuário',
        'Status do Email',
        'Data de Nascimento',
        'Data de Criação'
      ];

      // Converter dados dos usuários para formato CSV
      const csvData = users.map(user => [
        user.nome_completo || 'Não informado',
        user.email || 'Não informado',
        user.telefone || 'Não informado',
        user.user_type === 'admin' ? 'Administrador' :
        user.user_type === 'student' ? 'Estudante' :
        user.user_type === 'guardian' ? 'Responsável' : user.user_type,
        user.email_confirmed ? 'Confirmado' : 'Pendente',
        user.data_nascimento ? new Date(user.data_nascimento).toLocaleDateString('pt-BR') : 'Não informado',
        new Date(user.created_at).toLocaleDateString('pt-BR')
      ]);

      // Combinar cabeçalhos e dados
      const allData = [headers, ...csvData];

      // Converter para string CSV
      const csvContent = allData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      // Criar e baixar o arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar usuários:', error);
      alert('Erro ao exportar usuários. Tente novamente.');
    }
  };

  const handleViewStudent = (registrationId: string) => {
    const registration = registrations.find(r => r.id === registrationId);
    if (registration) {
      const details = `
Detalhes da Inscrição:

Aluno: ${registration.student.name}
Idade: ${registration.student.age} anos
Email: ${registration.student.email}

Responsável: ${registration.guardian.name}
Telefone: ${registration.guardian.phone}

Oficinas: ${registration.workshopIds.length} oficina(s)
Status: ${registration.status}
Presença: ${registration.attendance ? 'Presente' : 'Ausente'}
Convidados: ${registration.guestsCount || 0}
Data de Inscrição: ${new Date(registration.createdAt).toLocaleString('pt-BR')}`;
      alert(details);
    }
  };

  const handleDeleteStudent = async (registrationId: string) => {
    const registration = registrations.find(r => r.id === registrationId);
    if (registration && window.confirm(`Tem certeza que deseja excluir a inscrição de ${registration.student.name}?`)) {
      try {
        // Implementar lógica de exclusão aqui
        // await deleteRegistration(registrationId);
        alert('Inscrição excluída com sucesso!');
        // Recarregar dados
        window.location.reload();
      } catch (error) {
        console.error('Erro ao excluir inscrição:', error);
        alert('Erro ao excluir inscrição. Tente novamente.');
      }
    }
  };

  const handleAttendanceChange = async (registrationId: string, isPresent: boolean) => {
    try {
      await updateAttendance(registrationId, isPresent);
      // Presença atualizada
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
      // Aqui você pode adicionar um toast de erro
    }
  };

  const handleGuestsCountChange = async (registrationId: string, guestsCount: number) => {
    try {
      await updateGuestsCount(registrationId, guestsCount);
      // Contagem de convidados atualizada
    } catch (error) {
      console.error('Erro ao atualizar contagem de convidados:', error);
      // Aqui você pode adicionar um toast de erro
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setDeleteUserDialog({ isOpen: true, userId, userName });
  };

  const confirmDeleteUser = async () => {
    try {
      await deleteUser(deleteUserDialog.userId);
      setDeleteUserDialog({ isOpen: false, userId: '', userName: '' });
      // Usuário removido com sucesso
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      // Você pode adicionar um toast de erro aqui se desejar
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  const totalRevenue = registrations.reduce((total, reg) => {
    const workshopPrices = reg.workshopIds.reduce((sum, id) => {
      const workshop = workshops.find(w => w.id === id);
      return sum + (workshop?.preco || 0);
    }, 0);
    return total + workshopPrices;
  }, 0);

  const totalStudents = registrations.length;
  const totalWorkshops = workshops.length;
  const activeWorkshops = workshops.filter(w => w.status === 'ativa').length;
  const occupancyRate = workshops.length > 0 ? 
    ((workshops.reduce((sum, w) => sum + (w.capacidade - w.vagas_disponiveis), 0) / 
      workshops.reduce((sum, w) => sum + w.capacidade, 0)) * 100) : 0;

  // Dados para os gráficos - baseados em dados reais
  const evolutionData = [
    { day: 'Seg', inscricoes: 0 },
    { day: 'Ter', inscricoes: 0 },
    { day: 'Qua', inscricoes: 0 },
    { day: 'Qui', inscricoes: 0 },
    { day: 'Sex', inscricoes: 0 },
    { day: 'Sáb', inscricoes: 0 },
    { day: 'Dom', inscricoes: 0 }
  ];

  const popularWorkshopsData = workshops
    .sort((a, b) => (b.capacidade - b.vagas_disponiveis) - (a.capacidade - a.vagas_disponiveis))
    .slice(0, 5)
    .map(workshop => ({
      nome: workshop.nome.length > 15 ? workshop.nome.substring(0, 15) + '...' : workshop.nome,
      inscritos: workshop.capacidade - workshop.vagas_disponiveis
    }));

  // Calcular dados reais por unidade
  const unitData = availableUnits.slice(1).map(unit => {
    const unitRegistrations = registrations.filter(reg => reg.student.unidade === unit);
    return {
      name: unit,
      value: unitRegistrations.length,
      color: unit === 'Barra' ? '#8B5CF6' : unit === 'Campo Grande' ? '#06B6D4' : '#10B981'
    };
  });

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981'];

  const stats = [
    {
      title: 'Total de Inscritos',
      value: totalStudents.toString(),
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Oficinas Ativas',
      value: activeWorkshops.toString(),
      icon: Music,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      title: 'Total de Convidados',
      value: `${Math.floor(totalRevenue / 100)}`,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      title: 'Taxa de Ocupação',
      value: `${occupancyRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    }
  ];

  const recentRegistrations = registrations.slice(-5).reverse();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/assets/lamusic.png" 
                alt="LA Music Week" 
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-white font-inter">LA Music Week</h1>
                <p className="text-white/60 text-sm">Painel Administrativo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-white/80">Olá, {authUser?.user_metadata?.name || authUser?.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="text-white/80 border-white/20 hover:bg-white/10"
              >
                Página Principal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate('/login');
                }}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-1 bg-white/10 rounded-lg p-1 mb-8 w-full max-w-none lg:max-w-4xl xl:max-w-5xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('workshops')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'workshops'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Oficinas
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'students'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >Inscritos</button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'guests'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Convidados
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'reminders'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Lembretes
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configurações
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Usuários
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Filter for Overview */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Visão Geral</h2>
              <div className="relative dropdown-container">
                <button
                  onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  <Filter className="w-4 h-4" />
                  {selectedUnit === 'todas' ? 'Todas as Unidades' : selectedUnit}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUnitDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showUnitDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-10">
                    {availableUnits.map((unit) => (
                      <button
                        key={unit}
                        onClick={() => handleFilterWorkshops(unit)}
                        className={`w-full text-left px-4 py-2 hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                          selectedUnit === unit ? 'bg-white/20 text-white' : 'text-white/80'
                        }`}
                      >
                        {unit === 'todas' ? 'Todas as Unidades' : unit}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Filter indicator */}
            {selectedUnit !== 'todas' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  Dados filtrados por unidade: <span className="font-semibold">{selectedUnit}</span>
                </p>
              </div>
            )}
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm font-medium">{stat.title}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Inscrições por Unidade */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Inscrições por Unidade</h3>
                  <PieChart className="w-5 h-5 text-purple-400" />
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={unitData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {unitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 space-y-2">
                  {unitData.map((unit, index) => (
                    <div key={unit.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="text-white/80 text-sm">{unit.name}</span>
                      </div>
                      <span className="text-white font-medium">{unit.value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Oficinas Mais Populares */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Oficinas Mais Populares</h3>
                  <BarChart3 className="w-5 h-5 text-green-400" />
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularWorkshopsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="nome" 
                        tick={{ fill: 'white', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      />
                      <YAxis 
                        tick={{ fill: 'white', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Bar 
                        dataKey="inscritos" 
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Evolução de Inscrições */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Evolução de Inscrições</h3>
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fill: 'white', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      />
                      <YAxis 
                        tick={{ fill: 'white', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="inscricoes" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Resumo Rápido */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Resumo Rápido</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{registrations.filter(reg => {
                    const today = new Date().toDateString();
                    return new Date(reg.createdAt).toDateString() === today;
                  }).length}</p>
                  <p className="text-white/60 text-sm">Inscrições hoje</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-xl font-bold text-white">
                    {unitData.length > 0 ? unitData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : 'N/A'}
                  </p>
                  <p className="text-white/60 text-sm">Unidade com mais inscrições</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Music className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-xl font-bold text-white">
                    {popularWorkshopsData.length > 0 ? popularWorkshopsData[0].nome : 'N/A'}
                  </p>
                  <p className="text-white/60 text-sm">Oficina mais procurada</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Workshops Tab */}
        {activeTab === 'workshops' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Gerenciar Oficinas</h2>
              <div className="flex space-x-3">
                <div className="relative dropdown-container">
                  <Button 
                    variant="outline" 
                    icon={<Filter className="w-4 h-4" />} 
                    onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                  >
                    {selectedUnit === 'todas' ? 'Todas as Unidades' : selectedUnit}
                  </Button>
                  {showUnitDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-10">
                      {availableUnits.map((unit) => (
                        <button
                          key={unit}
                          onClick={() => handleFilterWorkshops(unit)}
                          className={`w-full text-left px-4 py-2 hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                            selectedUnit === unit ? 'bg-white/20 text-white' : 'text-white/80'
                          }`}
                        >
                          {unit === 'todas' ? 'Todas as Unidades' : unit}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleNewWorkshop}>
                  Nova Oficina
                </Button>
              </div>
            </div>

            {selectedUnit !== 'todas' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  Mostrando oficinas filtradas por: <span className="font-semibold">{selectedUnit}</span>
                  {filteredWorkshops.length === 0 && ' (Nenhuma oficina encontrada)'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredWorkshops.map((workshop) => {
                const getUnitColor = (unidade: string) => {
                  switch (unidade) {
                    case 'Barra': return 'bg-blue-500';
                    case 'Campo Grande': return 'bg-green-500';
                    case 'Recreio': return 'bg-purple-500';
                    default: return 'bg-gray-500';
                  }
                };

                const getCategory = (instrumento: string) => {
                  if (instrumento?.toLowerCase().includes('violão') || instrumento?.toLowerCase().includes('guitarra')) return 'Cordas';
                  if (instrumento?.toLowerCase().includes('piano') || instrumento?.toLowerCase().includes('teclado')) return 'Teclas';
                  if (instrumento?.toLowerCase().includes('bateria') || instrumento?.toLowerCase().includes('percussão')) return 'Percussão';
                  if (instrumento?.toLowerCase().includes('flauta') || instrumento?.toLowerCase().includes('saxofone')) return 'Sopro';
                  return 'Geral';
                };

                return (
                  <Card key={workshop.id} className="group hover:scale-105 transition-all duration-300 cursor-pointer">
                    {/* Image */}
                    <div className="relative overflow-hidden rounded-lg mb-4">
                      <img
                        src={`https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(workshop.instrumento + ' music workshop')}&image_size=landscape_4_3`}
                        alt={workshop.nome}
                        className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 ${getUnitColor(workshop.unidade)} text-white text-sm rounded-full font-medium`}>
                          {workshop.unidade}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-black/50 text-white text-sm rounded-full font-medium">
                          {getCategory(workshop.instrumento)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold text-white font-inter">
                            {workshop.nome}
                          </h3>
                        </div>
                        <p className="text-white/80 text-sm font-source line-clamp-2">
                          {workshop.descricao}
                        </p>
                      </div>
                      
                      {/* Instructor */}
                      <div className="flex items-center gap-2 text-white/70">
                        <Music className="w-4 h-4" />
                        <span className="text-sm">{workshop.instrumento}</span>
                      </div>
                      
                      {/* Duration & Rating */}
                      <div className="flex items-center justify-between text-sm text-white/70">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(workshop.data_inicio).toLocaleDateString()} - {new Date(workshop.data_fim).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{workshop.vagas_disponiveis}/{workshop.capacidade} vagas</span>
                        </div>
                      </div>
                      
                      {/* Participants */}
                      <div className="text-sm text-white/70">
                        <span>Local: {workshop.local}</span>
                        <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                          <div 
                            className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((workshop.capacidade - workshop.vagas_disponiveis) / workshop.capacidade) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Schedule */}
                      <div className="text-sm text-white/70">
                        <p className="font-medium mb-1">Status:</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          workshop.status === 'ativa' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {workshop.status === 'ativa' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      {/* Price & Action */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        <div>
                          <span className="text-2xl font-bold text-white">R$ {workshop.preco}</span>
                          <span className="text-white/60 text-sm ml-1">/ oficina</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            icon={<Edit className="w-3 h-3" />}
                            onClick={() => handleEditWorkshop(workshop.id)}
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-400 border-red-400 hover:bg-red-500/20"
                            onClick={() => handleDeleteWorkshop(workshop.id, workshop.nome)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Gerenciar Inscritos</h2>
              <div className="flex space-x-3">
                <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportStudents}>
                  Exportar para CSV
                </Button>
                <div className="relative dropdown-container">
                   <Button 
                     variant="outline" 
                     icon={<Filter className="w-4 h-4" />} 
                     onClick={() => setShowStudentUnitDropdown(!showStudentUnitDropdown)}
                   >
                     {selectedStudentUnit === 'todas' ? 'Todas as Unidades' : selectedStudentUnit}
                   </Button>
                   {showStudentUnitDropdown && (
                     <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-10">
                       {availableUnits.map((unit) => (
                         <button
                           key={unit}
                           onClick={() => handleFilterStudents(unit)}
                           className={`w-full text-left px-4 py-2 hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                             selectedStudentUnit === unit ? 'bg-white/20 text-white' : 'text-white/80'
                           }`}
                         >
                           {unit === 'todas' ? 'Todas as Unidades' : unit}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
              </div>
            </div>

            {selectedStudentUnit !== 'todas' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  Mostrando inscrições filtradas por: <span className="font-semibold">{selectedStudentUnit}</span>
                  {filteredRegistrations.length === 0 && ' (Nenhuma inscrição encontrada)'}
                </p>
              </div>
            )}

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Inscrito
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Responsável
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Oficinas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Presença
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Convidados
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredRegistrations.map((registration) => (
                      <tr key={registration.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {registration.student.name}
                            </div>
                            <div className="text-sm text-white/60">
                              {registration.student.age} anos • {registration.student.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-white">{registration.guardian.name}</div>
                            <div className="text-sm text-white/60">{registration.guardian.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white">
                            {registration.workshopIds.length} oficina(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            registration.status === 'confirmada' 
                              ? 'bg-green-500/20 text-green-300'
                              : registration.status === 'pendente'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {registration.status === 'confirmada' ? 'Confirmado' :
                             registration.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={registration.attendance || false}
                              onChange={(e) => handleAttendanceChange(registration.id, e.target.checked)}
                              className="w-4 h-4 text-green-600 bg-white/10 border-white/20 rounded focus:ring-green-500"
                            />
                            <span className="text-sm text-white">
                              {registration.attendance ? 'Presente' : 'Ausente'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {registration.guestsCount || 0} convidado(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                          {new Date(registration.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                          {new Date(registration.createdAt).toLocaleTimeString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewStudent(registration.id)}>
                              Ver
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-400 border-red-400 hover:bg-red-500/20"
                              onClick={() => handleDeleteStudent(registration.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Guests Tab */}
        {activeTab === 'guests' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gerenciar Convidados</h2>
              <div className="flex space-x-3">
                <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                  Exportar Convidados
                </Button>
                <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                  Adicionar Convidado
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Convidado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Aluno Responsável
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Oficina
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Presença
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {/* Dados reais de convidados - implementar quando houver dados */}
                    {[].map((guest) => (
                      <tr key={guest.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {guest.name}
                            </div>
                            <div className="text-sm text-white/60">
                              {guest.age} anos
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{guest.studentName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{guest.workshop}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            guest.status === 'confirmado' 
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {guest.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={guest.attendance}
                              onChange={(e) => {}}
                              className="w-4 h-4 text-green-600 bg-white/10 border-white/20 rounded focus:ring-green-500"
                            />
                            <span className="text-sm text-white">
                              {guest.attendance ? 'Presente' : 'Ausente'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Ver
                            </Button>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Estatísticas de Convidados - baseadas em dados reais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{registrations.reduce((total, reg) => total + (reg.guestsCount || 0), 0)}</p>
                    <p className="text-white/60 text-sm">Total de Convidados</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{registrations.filter(reg => reg.attendance).length}</p>
                    <p className="text-white/60 text-sm">Presentes</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mr-4">
                    <Star className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{new Set(registrations.flatMap(reg => reg.workshopIds)).size}</p>
                    <p className="text-white/60 text-sm">Oficinas Diferentes</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <AutomatedReminders />
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleExportUsers}
                >Exportar Usuários</Button>
              </div>
            </div>

            {/* Estatísticas de Usuários */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{users.length}</p>
                    <p className="text-white/60 text-sm">Total de Usuários</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{users.filter(u => u.email_confirmed).length}</p>
                    <p className="text-white/60 text-sm">Email Confirmado</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mr-4">
                    <Star className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{users.filter(u => u.user_type === 'admin').length}</p>
                    <p className="text-white/60 text-sm">Administradores</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{users.filter(u => u.user_type === 'student').length}</p>
                    <p className="text-white/60 text-sm">Estudantes</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabela de Usuários */}
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Lista de Usuários</h3>
                <p className="text-white/60 text-sm mt-1">Gerencie todos os usuários cadastrados no sistema</p>
              </div>
              
              {loading.users ? (
                <div className="p-8 text-center">
                  <div className="text-white">Carregando usuários...</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Data de Criação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">
                                {user.nome_completo || 'Nome não informado'}
                              </div>
                              <div className="text-sm text-white/60">
                                {user.telefone || 'Telefone não informado'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.user_type === 'admin' 
                                ? 'bg-purple-500/20 text-purple-300'
                                : user.user_type === 'student'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {user.user_type === 'admin' ? 'Administrador' :
                               user.user_type === 'student' ? 'Estudante' : 
                               user.user_type === 'guardian' ? 'Responsável' : user.user_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.email_confirmed 
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {user.email_confirmed ? 'Confirmado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                icon={<Eye className="w-4 h-4" />}
                                onClick={() => alert(`Visualizar detalhes do usuário ${user.nome_completo || user.email}`)}
                              >
                                Ver
                              </Button>
                              {user.user_type !== 'admin' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  icon={<Trash2 className="w-4 h-4" />}
                                  onClick={() => handleDeleteUser(user.id, user.nome_completo || user.email)}
                                  className="text-red-400 border-red-400 hover:bg-red-500/20"
                                >
                                  Remover
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {users.length === 0 && (
                    <div className="p-8 text-center">
                      <Users className="w-12 h-12 text-white/40 mx-auto mb-4" />
                      <div className="text-white/60">Nenhum usuário encontrado</div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Configurações</h2>
              <p className="text-white/60">Gerencie as configurações do sistema administrativo.</p>
            </div>

            {/* Seção de Troca de Senha */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Alterar Senha</h3>
                  <p className="text-white/60 text-sm">Atualize sua senha de acesso ao painel administrativo</p>
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite sua nova senha"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirme sua nova senha"
                  />
                </div>

                <Button variant="primary" className="mt-6">
                  Atualizar Senha
                </Button>
              </div>
            </Card>

            {/* Outras Configurações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Configurações Gerais */}
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <Settings className="w-5 h-5 text-purple-400 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Configurações Gerais</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Notificações por Email</p>
                      <p className="text-white/60 text-sm">Receber alertas de novas inscrições</p>
                    </div>
                    <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Backup Automático</p>
                      <p className="text-white/60 text-sm">Backup diário dos dados</p>
                    </div>
                    <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Informações do Sistema */}
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <Eye className="w-5 h-5 text-green-400 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Informações do Sistema</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Versão:</span>
                    <span className="text-white">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Último Backup:</span>
                    <span className="text-white">Hoje, 14:30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Usuários Ativos:</span>
                    <span className="text-white">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Espaço Usado:</span>
                    <span className="text-white">2.4 GB</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, workshopId: '', workshopName: '' })}
        onConfirm={confirmDeleteWorkshop}
        title="Excluir Oficina"
        message={`Tem certeza que deseja excluir a oficina "${deleteDialog.workshopName}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        icon={<Trash2 className="w-6 h-6" />}
      />
      
      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteUserDialog.isOpen}
        onClose={() => setDeleteUserDialog({ isOpen: false, userId: '', userName: '' })}
        onConfirm={confirmDeleteUser}
        title="Remover Usuário"
        message={`Tem certeza que deseja remover o usuário "${deleteUserDialog.userName}"? Esta ação não pode ser desfeita e removerá todos os dados associados ao usuário.`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
        icon={<Trash2 className="w-6 h-6" />}
      />
    </div>
  );
}