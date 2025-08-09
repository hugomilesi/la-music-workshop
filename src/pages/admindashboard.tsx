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
  ChevronDown,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { useStore } from '../store/useStore';

import WhatsAppManager from '../components/WhatsAppManager';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import AutomatedReminders from './AutomatedReminders';
import WorkshopManagement from '../components/WorkshopManagement';
import { performFullCleanup } from '../utils/cleanupCancelledEnrollments';
import { useToast } from '../contexts/ToastContext';
import UserEditModal from '../components/UserEditModal';
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
  const { showToast } = useToast();
  const {
    workshops,
    registrations,
    users,
    guests,
    loading,
    fetchWorkshops,
    fetchRegistrations,
    fetchUsers,
    fetchGuests,
    deleteUser,
    cleanupOrphanedUsers,
    deleteWorkshop,
    deleteRegistration,
    updateAttendance,
    updateGuestsCount
    // recalculateAllWorkshopSlots removida - agora feito automaticamente via triggers
  } = useStore();
  

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUnit, setSelectedUnit] = useState<string>('todas');
  const [selectedStudentUnit, setSelectedStudentUnit] = useState<string>('todas');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showStudentUnitDropdown, setShowStudentUnitDropdown] = useState(false);
  const [searchWorkshopName, setSearchWorkshopName] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  
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

  const [studentDetailsModal, setStudentDetailsModal] = useState<{ isOpen: boolean; registrationId: string }>({
    isOpen: false,
    registrationId: ''
  });

  const [deleteRegistrationDialog, setDeleteRegistrationDialog] = useState<{ isOpen: boolean; registrationId: string; studentName: string }>({
    isOpen: false,
    registrationId: '',
    studentName: ''
  });
  
  const [userEditModal, setUserEditModal] = useState<{ isOpen: boolean; user: any | null }>({
    isOpen: false,
    user: null
  });
  
  // Estado isRecalculating removido - não mais necessário com triggers automáticos
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [guestsData, setGuestsData] = useState<any[]>([]);
  
  // Função de recálculo removida - agora feito automaticamente via triggers no banco

  // OTIMIZAÇÃO: Carregar dados essenciais uma única vez
  useEffect(() => {
    if (!profileLoading && profile) {
      console.log('🔄 AdminDashboard: Carregando dados iniciais...');
      
      // Para admins, pré-carregar workshops e registrations
      if (profile.user_type === 'admin') {
        if (workshops.length === 0) {
          fetchWorkshops();
        }
        if (registrations.length === 0) {
          fetchRegistrations();
        }
      } else if (profile.unit_id && workshops.length === 0) {
        // Usuário comum vê apenas oficinas da sua unidade
        fetchWorkshops(profile.unit_id);
      }
    }
  }, [profile?.user_type, profile?.unit_id, profileLoading]); // Removido workshops.length e registrations.length para evitar loops infinitos
  
  // OTIMIZAÇÃO: Carregar usuários apenas quando necessário
  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      console.log('📞 AdminDashboard: Carregando usuários para aba users...');
      fetchUsers().catch(error => {
        console.error('💥 AdminDashboard: Erro ao buscar usuários:', error);
      });
    }
  }, [activeTab]); // Removido users.length para evitar loops infinitos

  // Carregar convidados quando necessário
  useEffect(() => {
    if (activeTab === 'guests') {
      console.log('📞 AdminDashboard: Carregando convidados para aba guests...');
      fetchGuests().then(data => {
        setGuestsData(data);
      }).catch(error => {
        console.error('💥 AdminDashboard: Erro ao buscar convidados:', error);
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate('/login');
    }
  }, [authUser, authLoading, navigate]);
  
  // Debounce para o filtro de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchWorkshopName);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchWorkshopName]);

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

  // Filtrar workshops por unidade e nome
  const filteredWorkshops = workshops.filter(workshop => {
    // Filtro por unidade
    const matchesUnit = selectedUnit === 'todas' || (() => {
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
    })();
    
    // Filtro por nome da oficina (usando debounce)
    const matchesName = debouncedSearchTerm === '' || 
      workshop.nome?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      workshop.descricao?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      workshop.instrumento?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    return matchesUnit && matchesName;
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
    try {
      // Criar cabeçalhos do CSV
      const headers = [
        'Nome do Estudante',
        'Email',
        'Telefone',
        'Unidade',
        'Workshop',
        'Instrutor',
        'Data de Início',
        'Data de Fim',
        'Status',
        'Presença',
        'Data de Inscrição'
      ];

      // Converter dados das inscrições para formato CSV
      const csvData = registrations.map(registration => {
        const workshop = workshops.find(w => w.id === registration.workshop_id);
        return [
          (registration.student as any).nome_completo || registration.student.email || 'Não informado',
          registration.student.email || 'Não informado',
          (registration.student as any).telefone || 'Não informado',
          registration.student.unidade || 'Não informado',
          workshop?.nome || 'Não informado',
          workshop?.instructor || 'Não informado',
          workshop?.data_inicio ? new Date(workshop.data_inicio).toLocaleDateString('pt-BR') : 'Não informado',
          workshop?.data_fim ? new Date(workshop.data_fim).toLocaleDateString('pt-BR') : 'Não informado',
          registration.guestsCount || 0,
          (registration as any).attended ? 'Presente' : 'Ausente',
          new Date(registration.createdAt).toLocaleDateString('pt-BR')
        ];
      });

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
      link.setAttribute('download', `estudantes_inscritos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast({ type: 'success', title: 'Arquivo CSV exportado com sucesso!' });
    } catch (error) {
      console.error('Erro ao exportar estudantes:', error);
      showToast({ type: 'error', title: 'Erro ao exportar estudantes. Tente novamente.' });
    }
  };

  const handleExportWorkshops = () => {
    try {
      // Criar cabeçalhos do CSV
      const headers = [
        'Nome da Oficina',
        'Instrutor',
        'Instrumento',
        'Unidade',
        'Capacidade',
        'Vagas Disponíveis',
        'Inscritos',
        'Preço',
        'Data de Início',
        'Data de Fim',
        'Status',
        'Local',
        'Permite Convidados',
        'Data de Criação'
      ];

      // Converter dados dos workshops para formato CSV
      const csvData = workshops.map(workshop => {
        const inscritos = Math.max(0, Math.min(workshop.capacidade, workshop.capacidade - workshop.vagas_disponiveis));
        return [
          workshop.nome || 'Não informado',
          workshop.instructor || 'Não informado',
          workshop.instrumento || 'Não informado',
          workshop.unidade || 'Não informado',
          workshop.capacidade || 0,
          Math.max(0, workshop.vagas_disponiveis) || 0,
          inscritos,
          `R$ ${workshop.preco || 0}`,
          workshop.data_inicio ? new Date(workshop.data_inicio).toLocaleDateString('pt-BR') : 'Não informado',
          workshop.data_fim ? new Date(workshop.data_fim).toLocaleDateString('pt-BR') : 'Não informado',
          workshop.status === 'ativa' ? 'Ativo' : 'Inativo',
          workshop.local || 'Não informado',
          workshop.permite_convidados ? 'Sim' : 'Não',
          workshop.data_inicio ? new Date(workshop.data_inicio).toLocaleDateString('pt-BR') : 'Não informado'
        ];
      });

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
      link.setAttribute('download', `workshops_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast({ type: 'success', title: 'Arquivo CSV de workshops exportado com sucesso!' });
    } catch (error) {
      console.error('Erro ao exportar workshops:', error);
      showToast({ type: 'error', title: 'Erro ao exportar workshops. Tente novamente.' });
    }
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
        (user as any).user_type === 'admin' ? 'Administrador' :
                (user as any).user_type === 'student' ? 'Estudante' :
                (user as any).user_type === 'guardian' ? 'Responsável' : (user as any).user_type,
        'Confirmado', // Todos os usuários são automaticamente confirmados
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

  const handleExportGuests = async () => {
    try {
      // Buscar dados dos convidados
      const guestsData = await fetchGuests();
      
      // Criar cabeçalhos do CSV
      const headers = [
        'Nome do Convidado',
        'Idade',
        'Telefone',
        'Nome do Responsável',
        'Telefone do Responsável',
        'Email do Responsável',
        'Oficina',
        'Instrutor',
        'Data de Início',
        'Data de Fim',
        'Presença',
        'Data de Inscrição'
      ];

      // Converter dados dos convidados para formato CSV
      const csvData = guestsData.map((guest: any) => [
        guest.nome || 'Não informado',
        guest.idade || 'Não informado',
        guest.telefone || 'Não informado',
        guest.nome_responsavel || 'Não informado',
        guest.telefone_responsavel || 'Não informado',
        guest.email_responsavel || 'Não informado',
        guest.workshop?.nome || 'Não informado',
        guest.workshop?.instructor || 'Não informado',
        guest.workshop?.data_inicio ? new Date(guest.workshop.data_inicio).toLocaleDateString('pt-BR') : 'Não informado',
        guest.workshop?.data_fim ? new Date(guest.workshop.data_fim).toLocaleDateString('pt-BR') : 'Não informado',
        guest.attendance ? 'Presente' : 'Ausente',
        guest.created_at ? new Date(guest.created_at).toLocaleDateString('pt-BR') : 'Não informado'
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
      link.setAttribute('download', `convidados_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast({ type: 'success', title: 'Arquivo CSV de convidados exportado com sucesso!' });
    } catch (error) {
      console.error('Erro ao exportar convidados:', error);
      showToast({ type: 'error', title: 'Erro ao exportar convidados. Tente novamente.' });
    }
  };

  const handleCleanupCancelledEnrollments = async () => {
    try {
      const confirmed = window.confirm(
        'Tem certeza que deseja remover TODAS as inscrições canceladas do sistema?\n\n' +
        'Esta ação irá:\n' +
        '• Remover todas as inscrições com status "cancelada"\n' +
        '• Remover convidados órfãos (sem inscrição válida)\n' +
        '• Esta ação NÃO pode ser desfeita!\n\n' +
        'Deseja continuar?'
      );
      
      if (!confirmed) return;
      
      showToast({ type: 'info', title: 'Iniciando limpeza do sistema...' });
      
      const result = await performFullCleanup();
      
      if (result.success) {
        showToast({ type: 'success', title: result.message });
        // Recarregar dados para refletir as mudanças
        fetchRegistrations();
        fetchUsers();
      } else {
        showToast({ type: 'error', title: `Erro na limpeza: ${result.message}` });
      }
    } catch (error) {
      console.error('Erro ao executar limpeza:', error);
      showToast({ type: 'error', title: 'Erro inesperado durante a limpeza do sistema' });
    }
  };

  const handleViewStudent = (registrationId: string) => {
    setStudentDetailsModal({ isOpen: true, registrationId });
  };

  const handleDeleteStudent = (registrationId: string) => {
    const registration = registrations.find(r => r.id === registrationId);
    if (registration) {
      setDeleteRegistrationDialog({
        isOpen: true,
        registrationId,
        studentName: registration.student.name
      });
    }
  };

  const confirmDeleteRegistration = async () => {
    try {
      await deleteRegistration(deleteRegistrationDialog.registrationId);
      setDeleteRegistrationDialog({ isOpen: false, registrationId: '', studentName: '' });
      showToast({ type: 'success', title: 'Inscrição excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir inscrição:', error);
      showToast({ type: 'error', title: 'Erro ao excluir inscrição. Tente novamente.' });
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
      showToast({ type: 'success', title: 'Usuário removido com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir usuário';
      showToast({ type: 'error', title: 'Erro ao excluir usuário', message: errorMessage });
    }
  };

  const handleCleanupOrphanedUsers = async () => {
    try {
      showToast({ type: 'info', title: 'Iniciando sincronização de usuários...' });
      await cleanupOrphanedUsers();
      await fetchUsers(); // Recarregar a lista de usuários
      showToast({ type: 'success', title: 'Sincronização concluída!', message: 'Usuários órfãos foram removidos e as tabelas estão sincronizadas.' });
    } catch (error) {
      console.error('Erro ao sincronizar usuários:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao sincronizar usuários';
      showToast({ type: 'error', title: 'Erro na sincronização', message: errorMessage });
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
    ((workshops.reduce((sum, w) => sum + Math.max(0, Math.min(w.capacidade, w.capacidade - w.vagas_disponiveis)), 0) / 
      workshops.reduce((sum, w) => sum + w.capacidade, 0)) * 100) : 0;

  // Dados para os gráficos - baseados em dados reais
  const evolutionData = (() => {
    const today = new Date();
    const last7Days = [];
    
    // Gerar os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last7Days.push(date);
    }
    
    // Mapear inscrições por dia
    return last7Days.map(date => {
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dateStr = date.toISOString().split('T')[0];
      
      // Contar inscrições criadas neste dia
      const inscricoesNoDia = registrations.filter(reg => {
        if (!reg.createdAt) return false;
        const regDate = new Date(reg.createdAt).toISOString().split('T')[0];
        return regDate === dateStr;
      }).length;
      
      return {
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        inscricoes: inscricoesNoDia
      };
    });
  })();

  const popularWorkshopsData = workshops
    .sort((a, b) => Math.max(0, Math.min(b.capacidade, b.capacidade - b.vagas_disponiveis)) - Math.max(0, Math.min(a.capacidade, a.capacidade - a.vagas_disponiveis)))
    .slice(0, 5)
    .map(workshop => ({
      nome: workshop.nome.length > 15 ? workshop.nome.substring(0, 15) + '...' : workshop.nome,
      inscritos: Math.max(0, Math.min(workshop.capacidade, workshop.capacidade - workshop.vagas_disponiveis))
    }));

  // Calcular dados reais por unidade
  const unitData = availableUnits.slice(1).map(unit => {
    const unitRegistrations = registrations.filter(reg => reg.student.unidade === unit);
    console.log(`Unidade ${unit}: ${unitRegistrations.length} registros`, unitRegistrations.map(r => ({ id: r.id, unidade: r.student.unidade })));
    return {
      name: unit,
      value: unitRegistrations.length,
      color: unit === 'Barra' ? '#8B5CF6' : unit === 'Campo Grande' ? '#06B6D4' : '#10B981'
    };
  });

  console.log('Dados do gráfico de unidades:', unitData);
  console.log('Total de registrations:', registrations.length);
  console.log('Todas as unidades dos registros:', registrations.map(r => r.student.unidade));

  // Verificar se há dados para exibir
  const hasRegistrations = registrations.length > 0;
  const hasUnitData = unitData.some(unit => unit.value > 0);
  
  console.log('hasRegistrations:', hasRegistrations, 'hasUnitData:', hasUnitData);

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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img 
                src="/assets/Logo Kids e LA.png" 
                alt="LA Music Week" 
                className="w-16 h-6 sm:w-20 sm:h-8 md:w-24 md:h-10 object-contain"
              />
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-white font-inter">LA Music Week</h1>
                <p className="text-white/60 text-xs sm:text-sm">Painel Administrativo</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <span className="text-white/80 text-xs sm:text-sm md:text-base truncate max-w-40 sm:max-w-48 md:max-w-none">
                Olá, {authUser?.user_metadata?.name || authUser?.email}
              </span>
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Recarregar todos os dados
                    fetchWorkshops();
                    fetchRegistrations();
                    fetchUsers();
                    fetchGuests();
                  }}
                  className="text-white/80 border-white/20 hover:bg-white/10 flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm justify-center"
                  icon={<RefreshCw className="w-3 h-3" />}
                >
                  <span className="hidden sm:inline">Atualizar</span>
                  <span className="sm:hidden">Refresh</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-white/80 border-white/20 hover:bg-white/10 flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm justify-center"
                >
                  <span className="hidden sm:inline">Página Principal</span>
                  <span className="sm:hidden">Início</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    console.log('🚪 Botão logout clicado');
                    await signOut();
                    console.log('🚪 SignOut concluído, navegando para login');
                    // Aguardar um pouco para garantir que o estado foi limpo
                    setTimeout(() => {
                      navigate('/login', { replace: true });
                    }, 100);
                  }}
                  className="flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm justify-center"
                >
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6">
        {/* Mobile Navigation - Dropdown */}
        <div className="block md:hidden mb-4 sm:mb-6">
          <div className="relative">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="flex items-center justify-between w-full px-4 py-3 bg-white/10 rounded-lg text-white border border-white/20 h-12"
            >
              <div className="flex items-center space-x-2">
                {activeTab === 'overview' && <BarChart3 className="w-4 h-4" />}
                {activeTab === 'workshops' && <Music className="w-4 h-4" />}
                {activeTab === 'manage-workshops' && <Settings className="w-4 h-4" />}
                {activeTab === 'students' && <Users className="w-4 h-4" />}
                {activeTab === 'guests' && <Users className="w-4 h-4" />}
                {activeTab === 'reminders' && <Clock className="w-4 h-4" />}
                {activeTab === 'whatsapp' && <MessageCircle className="w-4 h-4" />}
                {activeTab === 'settings' && <Settings className="w-4 h-4" />}
                {activeTab === 'users' && <Users className="w-4 h-4" />}
                <span className="font-medium">
                  {activeTab === 'overview' && 'Visão Geral'}
                  {activeTab === 'workshops' && 'Gerenciar Oficinas'}
                  {activeTab === 'students' && 'Inscritos'}
                  {activeTab === 'guests' && 'Convidados'}
                  {activeTab === 'reminders' && 'Lembretes'}
                  {activeTab === 'whatsapp' && 'WhatsApp'}
                  {activeTab === 'settings' && 'Configurações'}
                  {activeTab === 'users' && 'Usuários'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showMobileNav ? 'rotate-180' : ''}`} />
            </button>
            
            {showMobileNav && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 z-50">
                {[
                  { id: 'overview', label: 'Visão Geral', icon: <BarChart3 className="w-4 h-4" /> },
                  { id: 'workshops', label: 'Gerenciar Oficinas', icon: <Music className="w-4 h-4" /> },
                  { id: 'students', label: 'Inscritos', icon: <Users className="w-4 h-4" /> },
                  { id: 'guests', label: 'Convidados', icon: <Users className="w-4 h-4" /> },
                  { id: 'reminders', label: 'Lembretes', icon: <Clock className="w-4 h-4" /> },
                  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" /> },
                  { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
                  { id: 'users', label: 'Usuários', icon: <Users className="w-4 h-4" /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowMobileNav(false);
                    }}
                    className={`flex items-center space-x-3 w-full px-4 py-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg h-12 ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation - Horizontal Tabs */}
        <div className="hidden md:block mb-6 lg:mb-8">
          <div className="flex flex-wrap gap-1 bg-white/10 rounded-lg p-1 w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('workshops')}
              className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'workshops'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Gerenciar Oficinas
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'students'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >Inscritos</button>
            <button
              onClick={() => setActiveTab('guests')}
              className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'guests'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden lg:inline">Convidados</span>
              <span className="lg:hidden">Conv.</span>
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'reminders'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden lg:inline">Lembretes</span>
              <span className="lg:hidden">Lemb.</span>
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'whatsapp'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden lg:inline">WhatsApp</span>
              <span className="lg:hidden">WA</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline">Configurações</span>
              <span className="lg:hidden">Config.</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Usuários
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Filter for Overview */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Visão Geral</h2>
              <div className="relative dropdown-container">
                <button
                  onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                  className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20 w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
                >
                  <Filter className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{selectedUnit === 'todas' ? 'Todas as Unidades' : selectedUnit}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${showUnitDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showUnitDropdown && (
                  <div className="absolute left-0 sm:right-0 mt-2 w-full sm:w-48 bg-white/10 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-10">
                    {availableUnits.map((unit) => (
                      <button
                        key={unit}
                        onClick={() => handleFilterWorkshops(unit)}
                        className={`w-full text-left px-4 py-3 sm:py-2 hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-auto ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {loading.workshops || loading.registrations ? (
                // Loading skeleton for stats
                Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="h-4 bg-white/20 rounded animate-pulse mb-2"></div>
                        <div className="h-8 bg-white/20 rounded animate-pulse"></div>
                      </div>
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg animate-pulse ml-3"></div>
                    </div>
                  </Card>
                ))
              ) : (
                stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white/60 text-xs md:text-sm font-medium truncate">{stat.title}</p>
                          <p className="text-xl md:text-2xl font-bold text-white mt-1">{stat.value}</p>
                        </div>
                        <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.bgColor} rounded-lg flex items-center justify-center ml-3`}>
                          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Inscrições por Unidade */}
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg font-semibold text-white">Inscrições por Unidade</h3>
                  <PieChart className="w-5 h-5 text-purple-400" />
                </div>
                
                {loading.registrations ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-white/60 text-sm">Carregando dados das unidades...</p>
                    </div>
                  </div>
                ) : !hasUnitData ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                      <p className="text-white/60 text-sm">Nenhuma inscrição encontrada</p>
                      <p className="text-white/40 text-xs mt-1">Os dados aparecerão aqui quando houver inscrições</p>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </Card>

              {/* Oficinas Mais Populares */}
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg font-semibold text-white">Oficinas Mais Populares</h3>
                  <BarChart3 className="w-5 h-5 text-green-400" />
                </div>
                
                {loading.workshops || loading.registrations ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-green-400/30 border-t-green-400 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-white/60 text-sm">Carregando dados das oficinas...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={popularWorkshopsData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
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
                )}
              </Card>

              {/* Evolução de Inscrições */}
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg font-semibold text-white">Evolução de Inscrições</h3>
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                
                {loading.registrations ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-white/60 text-sm">Carregando evolução das inscrições...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evolutionData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
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
                )}
              </Card>
            </div>

            {/* Resumo Rápido */}
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-4 md:mb-6">Resumo Rápido</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white">{registrations.filter(reg => {
                    if (!reg.createdAt) return false;
                    const today = new Date().toDateString();
                    return new Date(reg.createdAt).toDateString() === today;
                  }).length}</p>
                  <p className="text-white/60 text-xs md:text-sm">Inscrições hoje</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <MapPin className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
                  </div>
                  <p className="text-lg md:text-xl font-bold text-white">
                    {unitData.length > 0 ? unitData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : 'N/A'}
                  </p>
                  <p className="text-white/60 text-xs md:text-sm">Unidade com mais inscrições</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <Music className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
                  </div>
                  <p className="text-lg md:text-xl font-bold text-white">
                    {popularWorkshopsData.length > 0 ? popularWorkshopsData[0].nome : 'N/A'}
                  </p>
                  <p className="text-white/60 text-xs md:text-sm">Oficina mais procurada</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Workshops Tab */}
        {activeTab === 'workshops' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Gerenciar Oficinas</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nome da oficina..."
                    value={searchWorkshopName}
                    onChange={(e) => setSearchWorkshopName(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 bg-white/10 backdrop-blur-md text-white placeholder-white/60 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
                <div className="relative dropdown-container">
                  <Button 
                    variant="outline" 
                    icon={<Filter className="w-4 h-4" />} 
                    onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                    className="w-full sm:w-auto min-h-[44px] justify-center"
                  >
                    <span className="truncate">{selectedUnit === 'todas' ? 'Todas as Unidades' : selectedUnit}</span>
                  </Button>
                  {showUnitDropdown && (
                    <div className="absolute left-0 sm:right-0 mt-2 w-full sm:w-48 bg-white/10 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-10">
                      {availableUnits.map((unit) => (
                        <button
                          key={unit}
                          onClick={() => handleFilterWorkshops(unit)}
                          className={`w-full text-left px-4 py-3 sm:py-2 hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-auto ${
                            selectedUnit === unit ? 'bg-white/20 text-white' : 'text-white/80'
                          }`}
                        >
                          {unit === 'todas' ? 'Todas as Unidades' : unit}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportWorkshops} className="w-full sm:w-auto min-h-[44px] justify-center">
                  <span className="hidden sm:inline">Exportar CSV</span>
                  <span className="sm:hidden">Exportar</span>
                </Button>
                <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleNewWorkshop} className="w-full sm:w-auto min-h-[44px] justify-center">
                  <span className="hidden sm:inline">Nova Oficina</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </div>
            </div>

            {(selectedUnit !== 'todas' || searchWorkshopName !== '') && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  Mostrando oficinas filtradas por:
                  {selectedUnit !== 'todas' && <span className="font-semibold"> {selectedUnit}</span>}
                  {selectedUnit !== 'todas' && searchWorkshopName !== '' && <span> e</span>}
                  {searchWorkshopName !== '' && <span className="font-semibold"> nome: "{searchWorkshopName}"</span>}
                  {filteredWorkshops.length === 0 && <span className="text-red-300"> (Nenhuma oficina encontrada)</span>}
                </p>
                {(selectedUnit !== 'todas' || searchWorkshopName !== '') && (
                  <button
                    onClick={() => {
                      setSelectedUnit('todas');
                      setSearchWorkshopName('');
                    }}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}

            {loading.workshops ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-white/60">Carregando oficinas...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
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
                  <Card key={workshop.id} className="group hover:scale-105 transition-all duration-300 cursor-pointer p-4 sm:p-6">
                    {/* Image */}
                    <div className="relative overflow-hidden rounded-lg mb-4">
                      <img
                          src={workshop.image && workshop.image.trim() !== '' ? workshop.image : '/assets/lamusic.png'}
                          alt={workshop.nome}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== '/assets/lamusic.png') {
                              target.src = '/assets/lamusic.png';
                            }
                          }}
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
                        <span className="text-sm">{workshop.instructor || workshop.instrumento}</span>
                      </div>
                      
                      {/* Duration & Rating */}
                      <div className="flex items-center justify-between text-sm text-white/70">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(workshop.data_inicio).toLocaleDateString()} - {new Date(workshop.data_fim).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{Math.max(0, workshop.vagas_disponiveis)}/{workshop.capacidade} vagas</span>
                        </div>
                      </div>
                      
                      {/* Participants */}
                      <div className="text-sm text-white/70">
                        <span>Local: {workshop.local}</span>
                        <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                          <div 
                            className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(0, Math.min(100, ((workshop.capacidade - workshop.vagas_disponiveis) / workshop.capacidade) * 100))}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Age Classification */}
                      <div className="text-sm text-white/70">
                        <span>Idade: {workshop.idade_minima && workshop.idade_maxima ? 
                          (workshop.idade_minima === workshop.idade_maxima ? 
                            `${workshop.idade_minima} anos` : 
                            `${workshop.idade_minima} - ${workshop.idade_maxima} anos`) : 
                          'Todas as idades'}
                        </span>
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
                );              })}            </div>            )}          </div>        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Gerenciar Inscritos</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportStudents} className="w-full sm:w-auto min-h-[44px] justify-center">
                  <span className="hidden sm:inline">Exportar para CSV</span>
                  <span className="sm:hidden">Exportar</span>
                </Button>
                <div className="relative dropdown-container">
                   <Button 
                     variant="outline" 
                     icon={<Filter className="w-4 h-4" />} 
                     onClick={() => setShowStudentUnitDropdown(!showStudentUnitDropdown)}
                     className="w-full sm:w-auto min-h-[44px] justify-center"
                   >
                     <span className="truncate">{selectedStudentUnit === 'todas' ? 'Todas as Unidades' : selectedStudentUnit}</span>
                   </Button>
                   {showStudentUnitDropdown && (
                     <div className="absolute left-0 sm:right-0 mt-2 w-full sm:w-48 bg-white/10 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-10">
                       {availableUnits.map((unit) => (
                         <button
                           key={unit}
                           onClick={() => handleFilterStudents(unit)}
                           className={`w-full text-left px-4 py-3 sm:py-2 hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-auto ${
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

            {/* Mobile Cards - Students */}
            {loading.registrations ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-white/60">Carregando inscrições...</p>
              </div>
            ) : (
              <div className="block md:hidden space-y-3 sm:space-y-4">
                {filteredRegistrations.length === 0 ? (
                  <Card className="p-6">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Users className="h-12 w-12 text-white/30 mb-4" />
                      <p className="text-white/60 text-lg mb-2">Nenhuma inscrição encontrada</p>
                      <p className="text-white/40 text-sm text-center">Não há inscrições registradas no sistema</p>
                    </div>
                  </Card>
                ) : (
                  filteredRegistrations.map((registration) => (
                <Card key={registration.id} className="p-3 sm:p-4">
                  <div className="space-y-3">
                    {/* Student Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-white">
                          {registration.student.name}
                        </h3>
                        <p className="text-xs text-white/60">
                          {registration.student.age} anos • {registration.student.email}
                        </p>
                      </div>
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
                    </div>
                    
                    {/* Guardian Info */}
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-xs text-white/60 mb-1">Responsável:</p>
                      <p className="text-sm text-white">{registration.guardian.name}</p>
                      <p className="text-xs text-white/60">{registration.guardian.phone}</p>
                    </div>
                    
                    {/* Workshop & Details */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-white/60 mb-1">Oficinas:</p>
                        <p className="text-white">{registration.workshopIds.length} oficina(s)</p>
                      </div>
                      <div>
                        <p className="text-white/60 mb-1">Convidados:</p>
                        <p className="text-white">{registration.guestsCount || 0}</p>
                      </div>
                    </div>
                    
                    {/* Attendance & Date */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={registration.attendance || false}
                          onChange={(e) => handleAttendanceChange(registration.id, e.target.checked)}
                          className="w-4 h-4 text-green-600 bg-white/10 border-white/20 rounded focus:ring-green-500"
                        />
                        <span className="text-xs text-white">
                          {registration.attendance ? 'Presente' : 'Ausente'}
                        </span>
                      </div>
                      <div className="text-xs text-white/60">
                        {new Date(registration.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 min-h-[44px]"
                        onClick={() => handleViewStudent(registration.id)}
                      >
                        Ver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 min-h-[44px] text-red-400 border-red-400 hover:bg-red-500/20"
                        onClick={() => handleDeleteStudent(registration.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </Card>
                  ))
                )}
              </div>
            )}

            {/* Desktop Table - Students */}
            <Card className="hidden md:block overflow-hidden">
              {loading.registrations ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                  <p className="text-white/60">Carregando inscrições...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Inscrito
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Unidade
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
                      {filteredRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <Users className="h-12 w-12 text-white/30 mb-4" />
                              <p className="text-white/60 text-lg mb-2">Nenhuma inscrição encontrada</p>
                              <p className="text-white/40 text-sm">Não há inscrições registradas no sistema</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredRegistrations.map((registration) => (
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
                            <div className="text-sm text-white">{registration.student.unidade || 'Não informado'}</div>
                            <div className="text-sm text-white/60">
                              {registration.student.unidade ? `Unidade ${registration.student.unidade}` : 'Unidade não definida'}
                            </div>
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
                              checked={(registration as any).attendance || false}
                              onChange={(e) => handleAttendanceChange(registration.id, e.target.checked)}
                              className="w-4 h-4 text-green-600 bg-white/10 border-white/20 rounded focus:ring-green-500"
                            />
                            <span className="text-sm text-white">
                              {(registration as any).attendance ? 'Presente' : 'Ausente'}
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
                        ))
                      )}
                    </tbody>
                </table>
              </div>
            )}
          </Card>
          </div>
        )}

        {/* Guests Tab */}
        {activeTab === 'guests' && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Gerenciar Convidados</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportGuests} className="w-full sm:w-auto min-h-[44px] justify-center">
                  <span className="hidden sm:inline">Exportar Convidados</span>
                  <span className="sm:hidden">Exportar</span>
                </Button>
                <Button variant="primary" icon={<Plus className="w-4 h-4" />} className="w-full sm:w-auto min-h-[44px] justify-center">
                  <span className="hidden sm:inline">Adicionar Convidado</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              </div>
            </div>

            {/* Mobile Cards - Guests */}
            <div className="block md:hidden space-y-3 sm:space-y-4">
              {/* Placeholder for when there are no guests */}
              <Card className="p-4 sm:p-6 text-center">
                <div className="text-white/60">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum convidado cadastrado ainda.</p>
                  <p className="text-sm mt-1">Os convidados aparecerão aqui quando forem adicionados.</p>
                </div>
              </Card>
            </div>

            {/* Desktop Table - Guests */}
            <Card className="hidden md:block overflow-hidden">
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
                        Responsável
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Email Responsável
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
{guestsData.map((guest) => (
                      <tr key={guest.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {guest.nome}
                            </div>
                            <div className="text-sm text-white/60">
                              {guest.idade} anos
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{guest.aluno_responsavel || 'Não informado'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{guest.oficina_nome || 'Não informado'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white/60">
                            {guest.nome_responsavel || 'Não informado'}
                          </div>
                          <div className="text-sm text-white/40">
                            {guest.telefone_responsavel || 'Não informado'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white/60">
                            {guest.email_responsavel || 'Não informado'}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <Card className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3 md:mr-4">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-white">{registrations.reduce((total, reg) => total + (reg.guestsCount || 0), 0)}</p>
                    <p className="text-white/60 text-xs md:text-sm">Total de Convidados</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-3 md:mr-4">
                    <Check className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-white">{registrations.filter(reg => reg.attendance).length}</p>
                    <p className="text-white/60 text-xs md:text-sm">Presentes</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 md:p-6 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 md:mr-4">
                    <Star className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-white">{new Set(registrations.flatMap(reg => reg.workshopIds)).size}</p>
                    <p className="text-white/60 text-xs md:text-sm">Oficinas Diferentes</p>
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
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Gerenciar Usuários</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleExportUsers}
                  className="w-full sm:w-auto min-h-[44px] justify-center"
                >
                  <span className="hidden sm:inline">Exportar Usuários</span>
                  <span className="sm:hidden">Exportar</span>
                </Button>
                <Button 
                  variant="outline" 
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={handleCleanupCancelledEnrollments}
                  className="w-full sm:w-auto min-h-[44px] justify-center bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                >
                  <span className="hidden sm:inline">Limpar Canceladas</span>
                  <span className="sm:hidden">Limpar</span>
                </Button>
                <Button 
                  variant="outline" 
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={handleCleanupOrphanedUsers}
                  className="w-full sm:w-auto min-h-[44px] justify-center bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                >
                  <span className="hidden sm:inline">Sincronizar Usuários</span>
                  <span className="sm:hidden">Sincronizar</span>
                </Button>
              </div>
            </div>

            {/* Estatísticas de Usuários */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <Card className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3 md:mr-4">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-white">{users.length}</p>
                    <p className="text-white/60 text-xs md:text-sm">Total de Usuários</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-3 md:mr-4">
                    <Check className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-white">{users.length}</p>
                    <p className="text-white/60 text-xs md:text-sm">Email Confirmado</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 md:mr-4">
                    <Star className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-white">{users.filter(u => u.user_type === 'admin').length}</p>
                    <p className="text-white/60 text-xs md:text-sm">Administradores</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-3 md:mr-4">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-white">{users.filter(u => u.user_type === 'student').length}</p>
                    <p className="text-white/60 text-xs md:text-sm">Estudantes</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabela de Usuários */}
            <Card className="overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Lista de Usuários</h3>
                <p className="text-white/60 text-sm mt-1">Gerencie todos os usuários cadastrados no sistema</p>
                <div className="text-xs text-white/40 mt-2">
                  Debug: {users.length} usuários carregados | Loading: {loading.users ? 'true' : 'false'}
                </div>
              </div>
              
              {loading.users ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <div className="text-white">Carregando usuários...</div>
                </div>
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="block md:hidden space-y-3 sm:space-y-4 p-3 sm:p-4">
                    {users.map((user) => (
                      <div key={user.id} className="bg-white/5 rounded-lg p-3 sm:p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm">
                              {user.nome_completo || 'Nome não informado'}
                            </h4>
                            <p className="text-white/60 text-xs mt-1">
                              {user.telefone || 'Telefone não informado'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              icon={<Eye className="w-3 h-3" />}
                              onClick={() => alert(`Visualizar detalhes do usuário ${(user as any).nome_completo || user.email}`)}
                              className="min-h-[44px] px-3"
                            >
                              Ver
                            </Button>
                            {(user as any).user_type !== 'admin' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                icon={<Trash2 className="w-3 h-3" />}
                                onClick={() => handleDeleteUser(user.id, (user as any).nome_completo || user.email)}
                                className="text-red-400 border-red-400 hover:bg-red-500/20 min-h-[44px] px-3"
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white/60 text-xs">Email:</span>
                            <span className="text-white text-xs">{user.email}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-white/60 text-xs">Tipo:</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (user as any).user_type === 'admin' 
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : (user as any).user_type === 'student'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-gray-500/20 text-gray-300'
                              }`}>
                                {(user as any).user_type === 'admin' ? 'Admin' :
                                 (user as any).user_type === 'student' ? 'Estudante' :
                                 (user as any).user_type === 'guardian' ? 'Responsável' : (user as any).user_type}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-white/60 text-xs">Status:</span>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300">
                              Confirmado
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-white/60 text-xs">Criado em:</span>
                            <span className="text-white/60 text-xs">
                              {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {users.length === 0 && (
                      <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-white/40 mx-auto mb-4" />
                        <div className="text-white/60">Nenhum usuário encontrado</div>
                      </div>
                    )}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
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
                      <tbody className="divide-y divide-white/10">{users.map((user) => (
                          <tr key={user.id} className="hover:bg-white/5">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {(user as any).nome_completo || 'Nome não informado'}
                                </div>
                                <div className="text-sm text-white/60">
                                  {(user as any).telefone || 'Telefone não informado'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                (user as any).user_type === 'admin' 
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : (user as any).user_type === 'student'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-gray-500/20 text-gray-300'
                              }`}>
                                {(user as any).user_type === 'admin' ? 'Administrador' :
                                 (user as any).user_type === 'student' ? 'Estudante' :
                                 (user as any).user_type === 'guardian' ? 'Responsável' : (user as any).user_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300">
                                Confirmado
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                              {new Date((user as any).created_at || Date.now()).toLocaleDateString('pt-BR')}
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
                                {(user as any).user_type !== 'admin' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    onClick={() => handleDeleteUser(user.id, (user as any).nome_completo || user.email)}
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
                </>
              )}
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Configurações</h2>
              <p className="text-white/60">Gerencie as configurações do sistema administrativo.</p>
            </div>

            {/* Seção de Troca de Senha */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center mb-4 sm:mb-6">
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

            {/* Manutenção do Sistema */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mr-4">
                  <Settings className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Manutenção do Sistema</h3>
                  <p className="text-white/60 text-sm">Ferramentas para manutenção e correção de dados</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <p className="text-white font-medium">Sistema Automatizado</p>
                    <p className="text-white/60 text-sm">As vagas dos workshops são atualizadas automaticamente via triggers no banco de dados</p>
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                    Ativo
                  </div>
                </div>
              </div>
            </Card>

            {/* Outras Configurações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Configurações Gerais */}
              <Card className="p-4 sm:p-6">
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
              <Card className="p-4 sm:p-6">
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

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && (
          <WhatsAppManager />
        )}
      </div>

      {/* Student Details Modal */}
      {studentDetailsModal.isOpen && (() => {
        const registration = registrations.find(r => r.id === studentDetailsModal.registrationId);
        if (!registration) return null;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Detalhes da Inscrição</h2>
                  <button
                    onClick={() => setStudentDetailsModal({ isOpen: false, registrationId: '' })}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Informações do Aluno */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-600" />
                      Informações do Aluno
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Nome</p>
                        <p className="font-medium text-gray-900">{registration.student.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Idade</p>
                        <p className="font-medium text-gray-900">{registration.student.age} anos</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{registration.student.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Telefone</p>
                        <p className="font-medium text-gray-900">{registration.student.phone || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações do Responsável */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-green-600" />
                      Informações do Responsável
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Nome</p>
                        <p className="font-medium text-gray-900">{registration.guardian.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Telefone</p>
                        <p className="font-medium text-gray-900">{registration.guardian.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{registration.guardian.email || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações da Inscrição */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                      Detalhes da Inscrição
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          registration.status === 'confirmada' ? 'bg-green-100 text-green-800' :
                          registration.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {registration.status === 'confirmada' ? 'Confirmado' :
                           registration.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Presença</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          registration.attendance ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {registration.attendance ? 'Presente' : 'Ausente'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Convidados</p>
                        <p className="font-medium text-gray-900">{registration.guestsCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Data de Inscrição</p>
                        <p className="font-medium text-gray-900">
                          {new Date(registration.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Oficinas */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Music className="w-5 h-5 mr-2 text-orange-600" />
                      Oficinas Inscritas
                    </h3>
                    <div className="space-y-2">
                      {registration.workshopIds.map((workshopId, index) => {
                        const workshop = workshops.find(w => w.id === workshopId);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                            <div>
                              <p className="font-medium text-gray-900">{workshop?.nome || 'Oficina não encontrada'}</p>
                              <p className="text-sm text-gray-600">
                                {workshop?.data_inicio ? new Date(workshop.data_inicio).toLocaleDateString('pt-BR') : 'Data não definida'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">{workshop?.local || 'Local não definido'}</p>
                              <p className="text-sm font-medium text-gray-900">
                                {workshop?.price === 0 ? 'Gratuita' : `R$ ${workshop?.preco || workshop?.price || '0,00'}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <Button
                    onClick={() => setStudentDetailsModal({ isOpen: false, registrationId: '' })}
                    variant="secondary"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      
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
      
      {/* Delete Registration Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteRegistrationDialog.isOpen}
        onClose={() => setDeleteRegistrationDialog({ isOpen: false, registrationId: '', studentName: '' })}
        onConfirm={confirmDeleteRegistration}
        title="Excluir Inscrição"
        message={`Tem certeza que deseja excluir a inscrição de "${deleteRegistrationDialog.studentName}"? Esta ação não pode ser desfeita e liberará a vaga na oficina.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        icon={<Trash2 className="w-6 h-6" />}
      />
    </div>
  );
}