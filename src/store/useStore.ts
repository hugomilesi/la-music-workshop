import { create } from 'zustand';
import { supabase, supabaseAdmin, Workshop as SupabaseWorkshop, Inscricao, Pagamento, Mensagem, LembreteAutomatico } from '../lib/supabase';
import { sendEnrollmentConfirmation } from '../utils/whatsapp';

// Interfaces adaptadas para o frontend
export interface Workshop {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: 'iniciante' | 'intermediario' | 'avancado';
  category: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  rating: number;
  image: string;
  schedule: string[];
  data_inicio: string;
  data_fim: string;
  local: string;
  instrumento: string;
  vagas_disponiveis: number;
  status: 'ativa' | 'cancelada' | 'finalizada';
  unidade: string;
  // Propriedades adicionais para compatibilidade com o frontend
  nome: string;
  descricao: string;
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  capacidade: number;
  preco: number;
  // Propriedades para validação de idade e configurações
  idade_minima?: number;
  idade_maxima?: number;
  unit_id?: string;
  permite_convidados?: boolean;
}

export interface Guest {
  id: string;
  name: string;
  age: number;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

export interface Student {
  name: string;
  age: number;
  email: string;
  phone: string;
  school: string;
  musicalExperience: string;
  medicalInfo: string;
  // Novos campos
  unidade: string;
  turma: string;
  professorAtual: string;
  guardianName?: string;
  guardianPhone: string;
  guardianEmail: string;
  convidado: boolean;
  termos: boolean;
  guests?: Guest[];
}

export interface Guardian {
  name: string;
  email: string;
  phone: string;
  relationship: string;
  address: string;
  emergencyContact: string;
}

export interface Registration {
  id: string;
  student: Student;
  guardian: Guardian;
  workshopIds: string[];
  status: 'pendente' | 'confirmada' | 'cancelada';
  createdAt: string;
  totalAmount: number;
  workshop_id: string;
  user_id: string;
  attendance?: boolean;
  guestsCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface DatabaseUser {
  id: string;
  user_id: string;
  user_type: string;
  email: string;
  nome_completo: string;
  telefone: string;
  data_nascimento: string;
  created_at: string;
  updated_at: string;
  email_confirmed: boolean;
}

export interface AutomatedReminder {
  id: string;
  workshop_id: string | null;
  tipo_lembrete: 'confirmacao_inscricao' | 'lembrete_evento' | 'pos_evento' | 'custom';
  periodo_disparo: number;
  titulo: string;
  mensagem: string;
  ativo: boolean;
}

interface StoreState {
  // Registration flow
  currentStep: number;
  selectedWorkshops: string[];
  studentData: Partial<Student>;
  guardianData: Partial<Guardian>;
  guests: Guest[];
  
  // Data
  workshops: Workshop[];
  registrations: Registration[];
  automatedReminders: AutomatedReminder[];
  messages: Mensagem[];
  users: DatabaseUser[];
  
  // Loading states
  loading: {
    workshops: boolean;
    registrations: boolean;
    reminders: boolean;
    messages: boolean;
    users: boolean;
  };
  
  // Auth
  user: User | null;
  
  // Cache interno
  _workshopsCache: Map<string, Workshop[]>;
  _lastWorkshopsFetch: number;
  _workshopsFetching: boolean;
  lastFetch?: number;
  lastFetchKey?: string;
  
  // Actions
  setCurrentStep: (step: number) => void;
  addWorkshop: (workshopId: string) => void;
  removeWorkshop: (workshopId: string) => void;
  updateStudentData: (data: Partial<Student>) => void;
  updateGuardianData: (data: Partial<Guardian>) => void;
  updateGuests: (guests: Guest[]) => void;
  resetRegistration: () => void;
  
  // Data fetching actions
  fetchWorkshops: (unitId?: string) => Promise<void>;
  fetchRegistrations: () => Promise<void>;
  fetchAutomatedReminders: (workshopId?: string) => Promise<void>;
  fetchMessages: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  cleanupOrphanedUsers: () => Promise<void>;
  updateUser: (userId: string, updates: Partial<DatabaseUser>) => Promise<void>;
  deleteRegistration: (registrationId: string) => Promise<void>;

  // Workshop CRUD operations
  createWorkshop: (workshop: Omit<Workshop, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  updateWorkshop: (id: string, updates: Partial<Workshop>) => Promise<any>;
  deleteWorkshop: (id: string) => Promise<void>;
  // Funções de recálculo removidas - agora feito automaticamente via triggers no banco
  
  createReminder: (reminder: Omit<LembreteAutomatico, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<LembreteAutomatico>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  
  sendMessage: (message: Omit<Mensagem, 'id' | 'created_at' | 'updated_at' | 'data_envio'>) => Promise<void>;
  processAutomatedReminders: () => Promise<void>;
  createRegistration: (workshopId: string, userId: string, participantData?: { name?: string; age?: number }) => Promise<void>;

  // Attendance and guests management
  updateAttendance: (registrationId: string, isPresent: boolean) => Promise<boolean>;
  updateGuestsCount: (registrationId: string, guestsCount: number) => Promise<boolean>;
  
  // Guest management
  fetchGuests: (registrationId?: string) => Promise<any[]>;
  createGuest: (guestData: any) => Promise<any>;
  updateGuest: (guestId: string, updates: any) => Promise<boolean>;
  deleteGuest: (guestId: string) => Promise<boolean>;

  // Auth actions
  login: (user: User) => void;
  logout: () => void;
  preloadCriticalData: () => Promise<void>;
}

// Helper function to convert Supabase workshop to frontend format
const convertWorkshopFromSupabase = (workshop: any): Workshop => {
  const duration = workshop.data_fim && workshop.data_inicio 
    ? `${Math.round((new Date(workshop.data_fim).getTime() - new Date(workshop.data_inicio).getTime()) / (1000 * 60 * 60))} horas`
    : '2 horas';
  
  // Extrair nome da unidade do relacionamento
  const unidadeNome = workshop.unidades?.nome || 'Unidade Principal';
  
  // Priorizar imagem da oficina sobre placeholder padrão
  const imageUrl = workshop.imagem && workshop.imagem.trim() !== '' 
    ? workshop.imagem 
    : '/assets/lamusic.png';

  return {
    id: workshop.id || '',
    title: workshop.nome || 'Workshop sem nome',
    description: workshop.descricao || 'Descrição não disponível',
    instructor: workshop.nome_instrutor || 'Instrutor não informado',
    duration,
    level: workshop.nivel || 'iniciante',
    category: workshop.instrumento || 'Geral',
    maxParticipants: workshop.capacidade || 0,
    currentParticipants: 0, // Removido o cálculo do contador de inscritos
    price: workshop.preco || 0,
    rating: 4.5, // Pode ser expandido com sistema de avaliações
    image: imageUrl,
    schedule: [workshop.data_inicio ? new Date(workshop.data_inicio).toLocaleString('pt-BR') : 'Data não definida'],
    data_inicio: workshop.data_inicio || new Date().toISOString(),
    data_fim: workshop.data_fim || new Date().toISOString(),
    local: workshop.local || 'Local não informado',
    instrumento: workshop.instrumento || 'Instrumento',
    vagas_disponiveis: workshop.vagas_disponiveis || 0,
    status: workshop.status || 'ativa',
    unidade: unidadeNome,
    nome: workshop.nome || 'Workshop sem nome',
    descricao: workshop.descricao || 'Descrição não disponível',
    nivel: workshop.nivel || 'iniciante',
    capacidade: workshop.capacidade || 0,
    preco: workshop.preco || 0,
    idade_minima: workshop.idade_minima,
    idade_maxima: workshop.idade_maxima,
    unit_id: workshop.unit_id,
    permite_convidados: workshop.permite_convidados
  };
};


export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  currentStep: 1,
  selectedWorkshops: [],
  studentData: {},
  guardianData: {},
  guests: [],
  workshops: [],
  registrations: [],
  automatedReminders: [],
  messages: [],
  users: [],
  loading: {
    workshops: false,
    registrations: false,
    reminders: false,
    messages: false,
    users: false
  },
  user: null,
  // Cache control
  _workshopsCache: new Map(),
  _lastWorkshopsFetch: 0,
  _workshopsFetching: false,
  
  // Basic actions
  setCurrentStep: (step) => set({ currentStep: step }),
  
  addWorkshop: (workshopId) => set((state) => ({
    selectedWorkshops: [workshopId] // Single workshop enrollment - replace any previous selection
  })),
  
  removeWorkshop: (workshopId) => set((state) => ({
    selectedWorkshops: state.selectedWorkshops.filter(id => id !== workshopId)
  })),
  
  updateStudentData: (data) => set((state) => ({
    studentData: { ...state.studentData, ...data }
  })),
  
  updateGuardianData: (data) => set((state) => ({
    guardianData: { ...state.guardianData, ...data }
  })),
  
  updateGuests: (guests) => set({ guests }),
  
  resetRegistration: () => set({
    currentStep: 1,
    selectedWorkshops: [],
    studentData: {},
    guardianData: {},
    guests: []
  }),
  
  // Funções de recálculo removidas - agora feito automaticamente via triggers no banco de dados

  // Data fetching actions
  fetchWorkshops: async (unitId?: string) => {
    const state = get();
    const cacheKey = unitId || 'all';
    const now = Date.now();
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos - cache mais curto para dados mais atualizados
    
    console.log('🔍 fetchWorkshops chamado com unitId:', unitId);
    
    // Verificar se já está buscando para a mesma chave
    if (get()._workshopsFetching && get().lastFetchKey === cacheKey) {
      console.log('⏳ Já está buscando workshops para a mesma chave, aguardando...');
      return;
    }

    console.log('🗑️ Cache atual:', {
      cacheSize: state._workshopsCache?.size || 0,
      lastFetch: state._lastWorkshopsFetch,
      currentTime: now,
      cacheKey
    });
    
    // Verificar cache - usar cache válido para a chave específica
    const cachedData = state._workshopsCache?.get(cacheKey);
    if (cachedData && (now - state._lastWorkshopsFetch) < CACHE_DURATION && state.lastFetchKey === cacheKey) {
      console.log('📦 Usando dados do cache para:', cacheKey, 'workshops:', cachedData.length);
      // Só atualizar se os dados são diferentes
      if (JSON.stringify(state.workshops) !== JSON.stringify(cachedData)) {
        set({ workshops: cachedData });
      }
      return;
    }
    
    set((state) => ({ 
      loading: { ...state.loading, workshops: true },
      _workshopsFetching: true 
    }));
    
    try {
      console.log('🚀 Iniciando consulta ao Supabase...');
      
      // Consulta otimizada usando função RPC
      const { data, error } = await supabase
        .rpc('get_workshops_by_unit', { p_unit_id: unitId || null });
      
      console.log('📊 Resultado da query:', { data, error, dataLength: data?.length });
      
      if (error) {
        console.error('❌ Erro na consulta de workshops:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('⚠️ Nenhum dado retornado, usando array vazio');
        const emptyWorkshops: Workshop[] = [];
        set({ workshops: emptyWorkshops, lastFetch: now, lastFetchKey: cacheKey });
        return;
      }
      
      console.log('✅ Dados recebidos:', data.length, 'workshops');
      
      // Transform data to match frontend interface
      const workshops = data.map(workshop => ({
        ...workshop,
        unidade: workshop.unidade_nome || 'Não informado',
        title: workshop.nome,
        description: workshop.descricao,
        instructor: workshop.nome_instrutor || 'Instrutor não informado',
        duration: workshop.data_fim && workshop.data_inicio 
          ? `${Math.round((new Date(workshop.data_fim).getTime() - new Date(workshop.data_inicio).getTime()) / (1000 * 60 * 60))} horas`
          : '3 horas',
        level: workshop.nivel,
        category: workshop.instrumento,
        maxParticipants: workshop.capacidade,
        currentParticipants: Math.max(0, (workshop.capacidade || 0) - (workshop.vagas_disponiveis || 0)),
        price: workshop.preco,
        rating: 4.5,
        image: workshop.imagem || '/assets/lamusic.png',
        schedule: [workshop.data_inicio ? new Date(workshop.data_inicio).toLocaleString('pt-BR') : 'Data não definida']
      }));
      
      console.log('🔄 Workshops convertidos:', workshops.length)
      
      // Atualizar estado apenas se os dados mudaram
      set((state) => {
        const newCache = new Map(state._workshopsCache);
        newCache.set(cacheKey, workshops);
        return {
          workshops,
          _workshopsCache: newCache,
          _lastWorkshopsFetch: now,
          lastFetch: now,
          lastFetchKey: cacheKey
        };
      });
      
      console.log('✨ fetchWorkshops concluído com sucesso!');
      
    } catch (error: any) {
      console.error('💥 Erro em fetchWorkshops:', error);
      const emptyWorkshops: Workshop[] = [];
      set({ workshops: emptyWorkshops, lastFetch: now, lastFetchKey: cacheKey });
      
    } finally {
      set((state) => ({ 
        loading: { ...state.loading, workshops: false },
        _workshopsFetching: false 
      }));
    }
  },



  // Workshop CRUD operations
  createWorkshop: async (workshopData: Omit<Workshop, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Creating workshop:', workshopData);
      
      const { data, error } = await supabase
        .from('workshops')
        .insert({
          nome: workshopData.nome || workshopData.title,
          descricao: workshopData.descricao || workshopData.description,
          data_inicio: workshopData.data_inicio,
          data_fim: workshopData.data_fim,
          local: workshopData.local,
          capacidade: workshopData.capacidade || workshopData.maxParticipants,
          preco: workshopData.preco || workshopData.price,
          instrumento: workshopData.instrumento || workshopData.category,
          nivel: workshopData.nivel || workshopData.level,
          vagas_disponiveis: workshopData.vagas_disponiveis || workshopData.capacidade || workshopData.maxParticipants,
          status: workshopData.status || 'ativa',
          unit_id: workshopData.unit_id,
          idade_minima: workshopData.idade_minima || 0,
          idade_maxima: workshopData.idade_maxima || 100,
          permite_convidados: workshopData.permite_convidados || false,
          imagem: (workshopData as any).imagem || workshopData.image || '',
          nome_instrutor: (workshopData as any).nome_instrutor || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating workshop:', error);
        throw error;
      }

      console.log('Workshop created successfully:', data);
      
      // Limpar cache para forçar nova busca
      set((state) => ({
        _workshopsCache: new Map(),
        _lastWorkshopsFetch: 0,
        lastFetch: 0,
        lastFetchKey: undefined
      }));
      
      // Refresh workshops list
      await get().fetchWorkshops();
      
      return data;
    } catch (error) {
      console.error('Error in createWorkshop:', error);
      throw error;
    }
  },

  updateWorkshop: async (id: string, workshopData: Partial<Workshop>) => {
    try {
      console.log('Updating workshop:', id, workshopData);
      
      const updateData: any = {};
      
      if (workshopData.nome || workshopData.title) updateData.nome = workshopData.nome || workshopData.title;
      if (workshopData.descricao || workshopData.description) updateData.descricao = workshopData.descricao || workshopData.description;
      if (workshopData.data_inicio) updateData.data_inicio = workshopData.data_inicio;
      if (workshopData.data_fim) updateData.data_fim = workshopData.data_fim;
      if (workshopData.local) updateData.local = workshopData.local;
      if (workshopData.capacidade || workshopData.maxParticipants) updateData.capacidade = workshopData.capacidade || workshopData.maxParticipants;
      if (workshopData.preco !== undefined || workshopData.price !== undefined) updateData.preco = workshopData.preco ?? workshopData.price;
      if (workshopData.instrumento || workshopData.category) updateData.instrumento = workshopData.instrumento || workshopData.category;
      if (workshopData.nivel || workshopData.level) updateData.nivel = workshopData.nivel || workshopData.level;
      if (workshopData.vagas_disponiveis !== undefined) updateData.vagas_disponiveis = workshopData.vagas_disponiveis;
      if (workshopData.status) updateData.status = workshopData.status;
      if (workshopData.unit_id) updateData.unit_id = workshopData.unit_id;
      if (workshopData.idade_minima !== undefined) updateData.idade_minima = workshopData.idade_minima;
      if (workshopData.idade_maxima !== undefined) updateData.idade_maxima = workshopData.idade_maxima;
      if (workshopData.permite_convidados !== undefined) updateData.permite_convidados = workshopData.permite_convidados;
      if ((workshopData as any).imagem !== undefined || workshopData.image !== undefined) updateData.imagem = (workshopData as any).imagem || workshopData.image || '';
      if ((workshopData as any).nome_instrutor !== undefined) updateData.nome_instrutor = (workshopData as any).nome_instrutor;
      
      const { data, error } = await supabase
        .from('workshops')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating workshop:', error);
        throw error;
      }

      console.log('Workshop updated successfully:', data);
      
      // Limpar cache para forçar nova busca
      set((state) => ({
        _workshopsCache: new Map(),
        _lastWorkshopsFetch: 0,
        lastFetch: 0,
        lastFetchKey: undefined
      }));
      
      // Refresh workshops list
      await get().fetchWorkshops();
      
      return data;
    } catch (error) {
      console.error('Error in updateWorkshop:', error);
      throw error;
    }
  },

  deleteWorkshop: async (id: string) => {
    try {
      console.log('Deleting workshop:', id);
      
      // First, delete all related inscricoes
      const { error: inscricoesError } = await supabase
        .from('inscricoes')
        .delete()
        .eq('workshop_id', id);

      if (inscricoesError) {
        console.error('Error deleting related inscricoes:', inscricoesError);
        throw inscricoesError;
      }
      
      // Then delete the workshop
      const { error } = await supabase
        .from('workshops')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting workshop:', error);
        throw error;
      }

      console.log('Workshop deleted successfully');
      
      // Limpar cache para forçar nova busca
      set((state) => ({
        _workshopsCache: new Map(),
        _lastWorkshopsFetch: 0,
        lastFetch: 0,
        lastFetchKey: undefined
      }));
      
      // Refresh workshops list
      await get().fetchWorkshops();
      
    } catch (error) {
      console.error('Error in deleteWorkshop:', error);
      throw error;
    }
  },
  
  fetchRegistrations: async () => {
    set((state) => ({ loading: { ...state.loading, registrations: true } }));
    try {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          *,
          workshops:workshop_id(
            *,
            unidades:unit_id(nome)
          ),
          users:user_id(
            *,
            unidades:unit_id(nome)
          ),
          pagamentos(*)
        `)
        .order('data_inscricao', { ascending: false });
      
      if (error) throw error;
      
      console.log('Dados de inscrições carregados:', data);
      console.log('Total de inscrições encontradas:', data?.length || 0);
      
      // Convert to frontend format with real data
      const registrations: Registration[] = data?.map(item => {
        // Priorizar dados da oficina para unidade, depois do usuário
        const unidadeNome = item.workshops?.unidades?.nome || 
                           item.users?.unidades?.nome || 
                           'Unidade não definida';
        
        console.log('Processando inscrição:', {
          id: item.id,
          user_id: item.user_id,
          unidade: unidadeNome,
          userData: item.users,
          workshopData: item.workshops,
          workshopUnidade: item.workshops?.unidades,
          userUnidade: item.users?.unidades
        });
        
        return {
          id: item.id,
          student: { 
            name: item.participant_name || item.users?.nome_completo || 'Participante', 
            age: item.participant_age || 18, 
            email: item.email_responsavel || item.users?.email || '', 
            phone: item.telefone_responsavel || item.users?.telefone || '', 
            school: '', 
            musicalExperience: '', 
            medicalInfo: '',
            unidade: unidadeNome,
            turma: '',
            professorAtual: '',
            guardianPhone: item.telefone_responsavel || item.users?.telefone || '',
            guardianEmail: item.email_responsavel || item.users?.email || '',
            convidado: item.participant_type === 'convidado',
            termos: true
          },
          guardian: { 
            name: item.nome_responsavel || item.users?.nome_completo || 'Responsável', 
            email: item.email_responsavel || item.users?.email || '', 
            phone: item.telefone_responsavel || item.users?.telefone || '', 
            relationship: 'Responsável', 
            address: '', 
            emergencyContact: '' 
          },
          workshopIds: [item.workshop_id],
          status: item.status_inscricao,
          createdAt: item.data_inscricao,
          totalAmount: item.pagamentos?.[0]?.valor || item.workshops?.preco || 0,
          workshop_id: item.workshop_id,
          user_id: item.user_id,
          attendance: item.presente || false,
          guestsCount: (item.total_participantes || 1) - 1
        };
      }) || [];
      
      console.log('Inscrições processadas:', registrations.map(r => ({ id: r.id, unidade: r.student.unidade })));
      
      set({ registrations });
    } catch (error) {
      console.error('Erro ao buscar inscrições:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, registrations: false } }));
    }
  },
  
  fetchAutomatedReminders: async (workshopId) => {
    set((state) => ({ loading: { ...state.loading, reminders: true } }));
    try {
      let query = supabase.from('lembretes_automaticos').select('*');
      
      if (workshopId) {
        query = query.eq('workshop_id', workshopId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const automatedReminders: AutomatedReminder[] = data?.map(item => ({
        id: item.id,
        workshop_id: item.workshop_id,
        tipo_lembrete: item.tipo_lembrete,
        periodo_disparo: item.periodo_disparo,
        titulo: item.titulo,
        mensagem: item.mensagem,
        ativo: item.ativo
      })) || [];
      
      set({ automatedReminders });
    } catch (error) {
      console.error('Erro ao buscar lembretes:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, reminders: false } }));
    }
  },
  
  fetchMessages: async () => {
    set((state) => ({ loading: { ...state.loading, messages: true } }));
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .order('data_envio', { ascending: false });
      
      if (error) throw error;
      
      set({ messages: data || [] });
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, messages: false } }));
    }
  },
  
  createReminder: async (reminder) => {
    try {
      const { data, error } = await supabase
        .from('lembretes_automaticos')
        .insert([reminder])
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh reminders
      get().fetchAutomatedReminders();
    } catch (error) {
      console.error('Erro ao criar lembrete:', error);
      throw error;
    }
  },
  
  updateReminder: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('lembretes_automaticos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh reminders
      get().fetchAutomatedReminders();
    } catch (error) {
      console.error('Erro ao atualizar lembrete:', error);
      throw error;
    }
  },
  
  deleteReminder: async (id) => {
    try {
      const { error } = await supabase
        .from('lembretes_automaticos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh reminders
      get().fetchAutomatedReminders();
    } catch (error) {
      console.error('Erro ao deletar lembrete:', error);
      throw error;
    }
  },
  
  sendMessage: async (message) => {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .insert([{ ...message, data_envio: new Date().toISOString() }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh messages
      get().fetchMessages();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  },
  
  processAutomatedReminders: async () => {
    try {
      const { data, error } = await supabase
        .rpc('processar_lembretes_automaticos');
      
      if (error) throw error;
      
      // Process each reminder that needs to be sent
      if (data && data.length > 0) {
        for (const reminder of data) {
          // Send message
          await get().sendMessage({
            remetente_id: 'system',
            destinatario_id: reminder.user_id,
            assunto: reminder.titulo,
            conteudo: reminder.mensagem,
            status_leitura: 'nao_lida'
          });
          
          // Mark as sent
          await supabase
            .rpc('marcar_lembrete_enviado', {
              p_lembrete_id: reminder.lembrete_id,
              p_inscricao_id: reminder.inscricao_id
            });
        }
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao processar lembretes:', error);
      throw error;
    }
  },

  createRegistration: async (workshopId, userId, participantData?: { name?: string; age?: number }) => {
    try {
      console.log('🚀 Iniciando createRegistration:', { workshopId, userId, participantData });
      
      // Verificar se o workshop existe e tem vagas
      const workshop = get().workshops.find(w => w.id === workshopId);
      console.log('📋 Workshop encontrado:', workshop);
      
      if (!workshop) {
        console.error('❌ Workshop não encontrado');
        throw new Error('Workshop não encontrado');
      }
      
      if (workshop.vagas_disponiveis <= 0) {
        console.error('❌ Workshop lotado');
        throw new Error('Workshop lotado');
      }
      
      if (workshop.status !== 'ativa') {
        console.error('❌ Workshop não está ativo');
        throw new Error('Workshop não está ativo');
      }
      
      console.log('🔍 Buscando usuário na tabela users...');
      // Buscar o ID do usuário na tabela users baseado no auth.uid()
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      console.log('👤 Resultado da busca do usuário:', { userRecord, userError });
      
      if (userError) {
        console.error('❌ Erro ao buscar usuário:', userError);
        throw new Error('Usuário não encontrado. Faça login novamente.');
      }
      
      const userTableId = userRecord.id;
      console.log('✅ ID do usuário na tabela:', userTableId);
      
      console.log('🔍 Verificando inscrições existentes...');
      // Verificar se o usuário já está inscrito (apenas inscrições ativas)
      const { data: existingRegistration, error: checkError } = await supabase
        .from('inscricoes')
        .select('id, status_inscricao')
        .eq('workshop_id', workshopId)
        .eq('user_id', userTableId)
        .neq('status_inscricao', 'cancelada') // Excluir inscrições canceladas
        .maybeSingle();
      
      console.log('📝 Resultado da verificação de inscrição:', { existingRegistration, checkError });
      
      if (checkError) {
        console.error('❌ Erro ao verificar inscrição existente:', checkError);
        throw new Error('Erro ao verificar inscrição existente');
      }
      
      if (existingRegistration) {
        console.error('❌ Usuário já inscrito');
        throw new Error('Você já está inscrito neste workshop');
      }
      
      console.log('✅ Usuário não possui inscrição ativa neste workshop');
      
      // Verificar vagas disponíveis
      if (workshop.vagas_disponiveis <= 0) {
        throw new Error('Não há vagas disponíveis para este workshop');
      }
      
      // Buscar dados do usuário se não fornecidos
      let participantName = participantData?.name;
      let participantAge = participantData?.age;
      
      if (!participantName || !participantAge) {
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('nome_completo, data_nascimento')
          .eq('id', userTableId)
          .single();
        
        if (userDataError) {
          console.warn('Não foi possível buscar dados do usuário:', userDataError);
        } else {
          participantName = participantName || userData?.nome_completo || 'Participante';
          // Calcular idade se temos data de nascimento
          if (!participantAge && userData?.data_nascimento) {
            const birthDate = new Date(userData.data_nascimento);
            const today = new Date();
            participantAge = today.getFullYear() - birthDate.getFullYear();
          }
          participantAge = participantAge || 18;
        }
      }
      
      // Validar restrições de idade antes da inserção
      if (workshop.idade_minima && participantAge < workshop.idade_minima) {
        throw new Error(`Idade mínima para este workshop é ${workshop.idade_minima} anos. Sua idade: ${participantAge} anos.`);
      }
      
      if (workshop.idade_maxima && participantAge > workshop.idade_maxima) {
        throw new Error(`Idade máxima para este workshop é ${workshop.idade_maxima} anos. Sua idade: ${participantAge} anos.`);
      }
      
      // Determinar status da inscrição baseado no preço da oficina
      const statusInscricao = workshop.preco === 0 ? 'confirmada' : 'pendente';
      
      console.log('💾 Preparando dados para inserção:', {
        workshop_id: workshopId,
        user_id: userTableId,
        data_inscricao: new Date().toISOString(),
        status_inscricao: statusInscricao,
        participant_name: participantName || 'Participante',
        participant_age: participantAge || 18,
        participant_type: 'principal',
        total_participantes: 1,
        tem_convidados: false
      });
      
      console.log('🚀 Inserindo inscrição na base de dados...');
      // Criar a inscrição
      const { data, error } = await supabase
        .from('inscricoes')
        .insert([{
          workshop_id: workshopId,
          user_id: userTableId,
          data_inscricao: new Date().toISOString(),
          status_inscricao: statusInscricao,
          participant_name: participantName || 'Participante',
          participant_age: participantAge || 18,
          participant_type: 'principal',
          total_participantes: 1,
          tem_convidados: false
        }])
        .select()
        .single();
      
      console.log('📊 Resultado da inserção:', { data, error });
      
      if (error) {
        console.error('❌ Erro ao criar inscrição:', error);
        console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('✅ Inscrição criada com sucesso:', data);
      
      // Vagas são atualizadas automaticamente via triggers no banco de dados
      
      // Criar registro de pagamento pendente apenas se o workshop não for gratuito
      if (workshop.preco > 0) {
        const { error: paymentError } = await supabase
          .from('pagamentos')
          .insert([{
            inscricao_id: data.id,
            valor: workshop.preco,
            status_pagamento: 'pendente'
          }]);
        
        if (paymentError) throw paymentError;
      }
      
      // Enviar WhatsApp de confirmação se a inscrição foi confirmada (oficina gratuita)
      if (statusInscricao === 'confirmada') {
        try {
          const user = get().user;
          const currentUser = get().users.find(u => u.user_id === user?.id);
          if (currentUser?.telefone) {
            // Formatar data da oficina
            const workshopDate = new Date(workshop.data_inicio).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            await sendEnrollmentConfirmation(
              currentUser.telefone,
              participantName || currentUser.nome_completo || 'Participante',
              workshop.nome,
              workshopDate,
              workshop.local || 'Local a definir',
              true // é gratuita
            );
            
            console.log('WhatsApp de confirmação enviado com sucesso');
          }
        } catch (whatsappError) {
          // Não falhar a inscrição se o WhatsApp falhar
          console.error('Erro ao enviar WhatsApp de confirmação:', whatsappError);
        }
      }
      
      // Refresh workshops e registrations
      get().fetchWorkshops();
      get().fetchRegistrations();
      
      return data;
    } catch (error: any) {
        console.error('Erro ao criar inscrição:', error);
        
        // Tratamento específico para erros de foreign key constraint
        if (error.message?.includes('foreign key constraint') || 
            error.message?.includes('inscricoes_user_id_fkey')) {
          throw new Error('Erro interno do sistema. Tente fazer login novamente.');
        }
        
        // Tratamento para outros erros comuns
        if (error.message?.includes('duplicate key')) {
          throw new Error('Você já está inscrito neste workshop.');
        }
        
        if (error.message?.includes('permission denied')) {
          throw new Error('Você não tem permissão para realizar esta ação. Faça login novamente.');
        }
        
        // Tratamento específico para erros de validação de idade do trigger
        if (error.message?.includes('Idade mínima para o workshop') || 
            error.message?.includes('Idade máxima para o workshop')) {
          // Extrair a mensagem específica do erro do trigger
          const ageErrorMatch = error.message.match(/Idade (mínima|máxima) para o workshop "([^"]+)" é (\d+) anos\. Idade informada: (\d+) anos\./); 
          if (ageErrorMatch) {
            const [, tipo, nomeWorkshop, idadeRequerida, idadeInformada] = ageErrorMatch;
            throw new Error(`Idade ${tipo} para a oficina "${nomeWorkshop}" é ${idadeRequerida} anos. Sua idade: ${idadeInformada} anos.`);
          } else {
            throw new Error('A idade do participante não atende aos requisitos desta oficina.');
          }
        }
        
        // Tratamento genérico para outros erros de restrição de idade
        if (error.message?.includes('check_idade_minima') || 
            error.message?.includes('check_idade_maxima') ||
            error.message?.includes('idade_minima') ||
            error.message?.includes('idade_maxima')) {
          throw new Error('Sua idade não atende aos requisitos deste workshop. Verifique as restrições de idade.');
        }
        
        // Se for um erro conhecido, manter a mensagem
        if (error.message && !error.message.includes('violates') && !error.message.includes('constraint')) {
          throw error;
        }
        
        // Para outros erros técnicos, usar mensagem genérica
        throw new Error('Erro ao processar inscrição. Tente novamente mais tarde.');
      }
  },

  // Attendance and guests management
  updateAttendance: async (registrationId: string, isPresent: boolean) => {
    try {
      const { error } = await supabase
        .from('inscricoes')
        .update({ 
          presente: isPresent, 
          data_presenca: isPresent ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId);
      
      if (error) throw error;
      
      // Update local state
      set((state) => ({
        registrations: state.registrations.map(reg => 
          reg.id === registrationId 
            ? { ...reg, attendance: isPresent }
            : reg
        )
      }));
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
      throw error;
    }
  },

  updateGuestsCount: async (registrationId: string, guestsCount: number) => {
    try {
      const { error } = await supabase
        .from('inscricoes')
        .update({ 
          total_participantes: guestsCount + 1, // +1 para incluir o aluno principal
          tem_convidados: guestsCount > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId);
      
      if (error) throw error;
      
      // Update local state
      set((state) => ({
        registrations: state.registrations.map(reg => 
          reg.id === registrationId 
            ? { ...reg, guestsCount: guestsCount }
            : reg
        )
      }));
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar contagem de convidados:', error);
      throw error;
    }
  },

  // Guest management
  fetchGuests: async (registrationId?: string) => {
    try {
      let query = supabase
        .from('convidados')
        .select(`
          *,
          inscricoes!inner(
            participant_name,
            workshops!inner(
              nome,
              nome_instrutor
            )
          )
        `);
      
      if (registrationId) {
        query = query.eq('inscricao_id', registrationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transformar os dados para facilitar o uso no frontend
      const transformedData = (data || []).map(guest => ({
        ...guest,
        aluno_responsavel: guest.inscricoes?.participant_name,
        oficina_nome: guest.inscricoes?.workshops?.nome,
        nome_instrutor: guest.inscricoes?.workshops?.nome_instrutor
      }));
      
      return transformedData;
    } catch (error) {
      console.error('Erro ao buscar convidados:', error);
      throw error;
    }
  },

  createGuest: async (guestData: any) => {
    try {
      const { data, error } = await supabase
        .from('convidados')
        .insert([{
          ...guestData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Erro ao criar convidado:', error);
      
      // Tratamento específico para erros de validação de idade do trigger de convidados
      if (error.message?.includes('Idade mínima para o workshop') || 
          error.message?.includes('Idade máxima para o workshop')) {
        // Extrair a mensagem específica do erro do trigger
        const ageErrorMatch = error.message.match(/Idade (mínima|máxima) para o workshop "([^"]+)" é (\d+) anos\. Idade informada: (\d+) anos\./); 
        if (ageErrorMatch) {
          const [, tipo, nomeWorkshop, idadeRequerida, idadeInformada] = ageErrorMatch;
          throw new Error(`Idade ${tipo} para a oficina "${nomeWorkshop}" é ${idadeRequerida} anos. Idade do convidado: ${idadeInformada} anos.`);
        } else {
          throw new Error('A idade do convidado não atende aos requisitos desta oficina.');
        }
      }
      
      // Tratamento para erro de constraint de idade (código 23514)
      if (error.code === '23514' && error.message?.includes('convidados_idade_check')) {
        throw new Error('A idade do convidado deve estar dentro dos limites permitidos para esta oficina.');
      }
      
      // Tratamento para outros erros comuns
      if (error.message?.includes('foreign key constraint')) {
        throw new Error('Erro interno do sistema. Verifique se a inscrição ainda existe.');
      }
      
      if (error.message?.includes('permission denied')) {
        throw new Error('Você não tem permissão para adicionar convidados. Faça login novamente.');
      }
      
      // Se for um erro conhecido, manter a mensagem
      if (error.message && !error.message.includes('violates') && !error.message.includes('constraint')) {
        throw error;
      }
      
      // Para outros erros técnicos, usar mensagem genérica
      throw new Error('Erro ao adicionar convidado. Tente novamente mais tarde.');
    }
  },

  updateGuest: async (guestId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('convidados')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', guestId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar convidado:', error);
      throw error;
    }
  },

  deleteGuest: async (guestId: string) => {
    try {
      const { error } = await supabase
        .from('convidados')
        .delete()
        .eq('id', guestId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erro ao deletar convidado:', error);
      throw error;
    }
  },

  // Função para pré-carregar dados críticos após login
  preloadCriticalData: async () => {
    try {
      console.log('🚀 Pré-carregando dados críticos...');
      
      // Carregar workshops em paralelo (dados mais leves)
      const workshopsPromise = get().fetchWorkshops();
      
      // Aguardar workshops primeiro (mais rápido)
      await workshopsPromise;
      
      console.log('✅ Dados críticos pré-carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao pré-carregar dados críticos:', error);
    }
  },

  // User management
  fetchUsers: async () => {
    try {
      console.log('🔍 fetchUsers: Iniciando busca de usuários...');
      set((state) => ({ loading: { ...state.loading, users: true } }));
      
      console.log('🔍 fetchUsers: Fazendo consulta com supabaseAdmin...');
      console.log('🔍 fetchUsers: URL do Supabase:', supabaseAdmin.supabaseUrl);
      console.log('🔍 fetchUsers: Chave sendo usada:', supabaseAdmin.supabaseKey?.substring(0, 20) + '...');
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, user_id, nome_completo, email, user_type, telefone, data_nascimento, created_at, updated_at, email_confirmed')
        .order('created_at', { ascending: false });
      
      console.log('🔍 fetchUsers: Resultado da consulta:', { 
        dataLength: data?.length, 
        error, 
        firstUser: data?.[0] 
      });
      
      if (error) {
        console.error('❌ fetchUsers: Erro na consulta:', error);
        throw error;
      }
      
      console.log('✅ fetchUsers: Dados recebidos:', data?.length, 'usuários');
      console.log('📋 fetchUsers: Primeiros 3 usuários:', data?.slice(0, 3));
      set({ users: data || [] });
      
      console.log('✅ fetchUsers: Estado atualizado com sucesso');
    } catch (error) {
      console.error('💥 fetchUsers: Erro geral:', error);
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, users: false } }));
      console.log('🔍 fetchUsers: Loading finalizado');
    }
  },

  deleteUser: async (userId: string) => {
    try {
      console.log('🗑️ Iniciando remoção do usuário ID:', userId);
      
      // Buscar dados do usuário para logs (sem usar .single() que pode falhar com RLS)
      const { data: userData } = await supabase
        .from('users')
        .select('user_id, email, nome_completo')
        .eq('id', userId)
        .limit(1);
      
      const userInfo = userData && userData.length > 0 ? userData[0] : null;
      console.log('👤 Tentando remover usuário:', userInfo?.email || 'Email não encontrado');
      
      // Usar a função SQL para deletar completamente do public schema
      const { data, error: functionError } = await supabase
        .rpc('delete_user_completely', { user_table_id: userId });
      
      if (functionError) {
        console.error('❌ Erro na função de remoção completa:', functionError);
        throw new Error(`Erro ao remover usuário: ${functionError.message}`);
      }
      
      console.log('✅ Usuário removido do schema public com sucesso');
      
      // Tentar deletar do auth.users usando service role (se temos o user_id)
      if (userInfo?.user_id) {
        try {
          const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
            userInfo.user_id
          );
          
          if (authDeleteError) {
            // Se o erro for "User not found", significa que já foi removido
            if (authDeleteError.message.includes('User not found')) {
              console.log('ℹ️ Usuário já havia sido removido do auth.users anteriormente');
            } else {
              console.warn('⚠️ Erro ao deletar usuário do auth.users (não crítico):', authDeleteError);
              // Não lançar erro aqui, pois o usuário já foi removido do public
            }
          } else {
            console.log('✅ Usuário removido completamente do auth.users');
          }
        } catch (authError) {
          console.warn('⚠️ Erro ao tentar deletar do auth.users (não crítico):', authError);
          // Não lançar erro aqui, pois o usuário já foi removido do public
        }
      }
      
      // Atualizar estado local removendo o usuário
      set((state) => ({
        users: state.users.filter(user => user.id !== userId)
      }));
      
      console.log('🎉 Remoção completa do usuário finalizada com sucesso');
      
    } catch (error) {
      console.error('💥 Erro ao deletar usuário:', error);
      throw error;
    }
  },

  // Função para limpar usuários órfãos e sincronizar as tabelas
  cleanupOrphanedUsers: async () => {
    try {
      console.log('Iniciando limpeza de usuários órfãos...');
      
      // Buscar usuários órfãos em auth.users
      const { data: orphanedAuthUsers, error: orphanError } = await supabase
        .rpc('get_orphaned_auth_users');
      
      if (orphanError) {
        console.error('Erro ao buscar usuários órfãos:', orphanError);
        return;
      }
      
      if (orphanedAuthUsers && orphanedAuthUsers.length > 0) {
        console.log(`Encontrados ${orphanedAuthUsers.length} usuários órfãos em auth.users`);
        
        for (const orphan of orphanedAuthUsers) {
          try {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(orphan.id);
            if (deleteError) {
              console.error(`Erro ao deletar usuário órfão ${orphan.email}:`, deleteError);
            } else {
              console.log(`Usuário órfão ${orphan.email} removido com sucesso`);
            }
          } catch (error) {
            console.error(`Erro ao processar usuário órfão ${orphan.email}:`, error);
          }
        }
      } else {
        console.log('Nenhum usuário órfão encontrado');
      }
      
    } catch (error) {
      console.error('Erro na limpeza de usuários órfãos:', error);
    }
  },

  updateUser: async (userId: string, updates: Partial<DatabaseUser>) => {
    try {
      console.log('🔄 Atualizando usuário:', userId, updates);
      
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        throw error;
      }
      
      console.log('✅ Usuário atualizado com sucesso:', data);
      
      // Atualizar estado local
      set((state) => ({
        users: state.users.map(user => 
          user.id === userId ? { ...user, ...data } : user
        )
      }));
      
    } catch (error) {
      console.error('💥 Erro em updateUser:', error);
      throw error;
    }
  },

  // Auth actions
  deleteRegistration: async (registrationId: string) => {
    try {
      console.log('🗑️ Deletando inscrição:', registrationId);
      
      // Buscar dados da inscrição antes de deletar
      const { data: registration, error: fetchError } = await supabase
        .from('inscricoes')
        .select('workshop_id, user_id')
        .eq('id', registrationId)
        .single();
      
      if (fetchError) {
        console.error('Erro ao buscar inscrição:', fetchError);
        throw new Error('Inscrição não encontrada');
      }
      
      // Deletar a inscrição
      const { error: deleteError } = await supabase
        .from('inscricoes')
        .delete()
        .eq('id', registrationId);
      
      if (deleteError) {
        console.error('Erro ao deletar inscrição:', deleteError);
        throw deleteError;
      }
      
      // Vagas são atualizadas automaticamente via triggers no banco de dados
      
      console.log('✅ Inscrição deletada com sucesso!');
      
      // Recarregar dados
      await get().fetchRegistrations();
      await get().fetchWorkshops();
      
    } catch (error) {
      console.error('💥 Erro em deleteRegistration:', error);
      throw error;
    }
  },

  login: (user) => set({ user }),
  logout: () => set({ user: null })
}));