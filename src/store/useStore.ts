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
  
  // Cache control
  _workshopsCache: Map<string, Workshop[]>;
  _lastWorkshopsFetch: number;
  _workshopsFetching: boolean;
  
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
  
  // CRUD actions
  createWorkshop: (workshop: Omit<Workshop, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  updateWorkshop: (id: string, updates: Partial<Workshop>) => Promise<any>;
  deleteWorkshop: (id: string) => Promise<void>;
  
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
}

// Helper function to convert Supabase workshop to frontend format
const convertWorkshopFromSupabase = (workshop: any): Workshop => {
  const duration = workshop.data_fim && workshop.data_inicio 
    ? `${Math.round((new Date(workshop.data_fim).getTime() - new Date(workshop.data_inicio).getTime()) / (1000 * 60 * 60))} horas`
    : '2 horas';
  
  // Extrair nome da unidade do relacionamento
  const unidadeNome = workshop.unidades?.nome || 'Unidade Principal';
  
  return {
    id: workshop.id || '',
    title: workshop.nome || 'Workshop sem nome',
    description: workshop.descricao || 'Descrição não disponível',
    instructor: 'Instrutor', // Pode ser expandido com tabela de instrutores
    duration,
    level: workshop.nivel || 'iniciante',
    category: workshop.instrumento || 'Geral',
    maxParticipants: workshop.capacidade || 0,
    currentParticipants: (workshop.capacidade || 0) - (workshop.vagas_disponiveis || 0),
    price: workshop.preco || 0,
    rating: 4.5, // Pode ser expandido com sistema de avaliações
    image: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent((workshop.instrumento || 'music') + '_lesson_modern_music_studio')}&image_size=landscape_4_3`,
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
    preco: workshop.preco || 0
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
    selectedWorkshops: [...state.selectedWorkshops, workshopId]
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
  
  // Data fetching actions
  fetchWorkshops: async (unitId?: string) => {
    const state = get();
    const cacheKey = unitId || 'all';
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos para reduzir chamadas
    
    console.log('🔍 fetchWorkshops chamado com unitId:', unitId);
    
    // Verificar se já está buscando
    if (state._workshopsFetching) {
      console.log('⏳ Já está buscando workshops, aguardando...');
      return;
    }
    
    // Verificar cache mais rigoroso
    const cachedData = state._workshopsCache.get(cacheKey);
    if (cachedData && (now - state._lastWorkshopsFetch) < CACHE_DURATION) {
      console.log('📦 Usando dados do cache para:', cacheKey, 'workshops:', cachedData.length);
      // Não fazer set se os dados já são os mesmos
      if (state.workshops !== cachedData) {
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
      
      let query = supabase
        .from('workshops')
        .select(`
          *,
          unidades(nome)
        `)
        .eq('status', 'ativa')
        .order('created_at', { ascending: false });
      
      if (unitId) {
        query = query.eq('unit_id', unitId);
      }
      
      const { data, error } = await query;
      
      console.log('📊 Resultado da query:', { data, error, dataLength: data?.length });
      
      if (error) {
        console.error('❌ Erro na consulta de workshops:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('⚠️ Nenhum dado retornado, usando array vazio');
        const emptyWorkshops: Workshop[] = [];
        set({ workshops: emptyWorkshops });
        return;
      }
      
      console.log('✅ Dados recebidos:', data.length, 'workshops');
      
      // Transform data to match frontend interface
      const workshops = data.map(workshop => ({
        ...workshop,
        unidade: workshop.unidades?.nome || 'Não informado',
        title: workshop.nome,
        description: workshop.descricao,
        instructor: 'Instrutor',
        duration: workshop.data_fim && workshop.data_inicio 
          ? `${Math.round((new Date(workshop.data_fim).getTime() - new Date(workshop.data_inicio).getTime()) / (1000 * 60 * 60))} horas`
          : '3 horas',
        level: workshop.nivel,
        category: workshop.instrumento,
        maxParticipants: workshop.capacidade,
        currentParticipants: (workshop.capacidade || 0) - (workshop.vagas_disponiveis || 0),
        price: workshop.preco,
        rating: 4.5,
        image: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent((workshop.instrumento || 'music') + '_lesson_modern_music_studio')}&image_size=landscape_4_3`,
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
          _lastWorkshopsFetch: now
        };
      });
      
      console.log('✨ fetchWorkshops concluído com sucesso!');
      
    } catch (error: any) {
      console.error('💥 Erro em fetchWorkshops:', error);
      const emptyWorkshops: Workshop[] = [];
      set({ workshops: emptyWorkshops });
      
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
          idade_maxima: workshopData.idade_maxima || 100
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating workshop:', error);
        throw error;
      }

      console.log('Workshop created successfully:', data);
      
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
          workshops:workshop_id(*),
          pagamentos(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Convert to frontend format (simplified for now)
      const registrations: Registration[] = data?.map(item => ({
        id: item.id,
        student: { 
          name: 'Estudante', 
          age: 16, 
          email: '', 
          phone: '', 
          school: '', 
          musicalExperience: '', 
          medicalInfo: '',
          unidade: '',
          turma: '',
          professorAtual: '',
          guardianPhone: '',
          guardianEmail: '',
          convidado: false,
          termos: false
        },
        guardian: { name: 'Responsável', email: '', phone: '', relationship: '', address: '', emergencyContact: '' },
        workshopIds: [item.workshop_id],
        status: item.status_inscricao,
        createdAt: item.created_at,
        totalAmount: item.pagamentos?.[0]?.valor || 0,
        workshop_id: item.workshop_id,
        user_id: item.user_id
      })) || [];
      
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
      // Verificar se o workshop existe e tem vagas
      const workshop = get().workshops.find(w => w.id === workshopId);
      if (!workshop) {
        throw new Error('Workshop não encontrado');
      }
      
      if (workshop.vagas_disponiveis <= 0) {
        throw new Error('Workshop lotado');
      }
      
      if (workshop.status !== 'ativa') {
        throw new Error('Workshop não está ativo');
      }
      
      // Buscar o ID do usuário na tabela users baseado no auth.uid()
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
        throw new Error('Usuário não encontrado. Faça login novamente.');
      }
      
      const userTableId = userRecord.id;
      
      // Verificar se o usuário já está inscrito (apenas inscrições ativas)
      const { data: existingRegistration, error: checkError } = await supabase
        .from('inscricoes')
        .select('id, status_inscricao')
        .eq('workshop_id', workshopId)
        .eq('user_id', userTableId)
        .neq('status_inscricao', 'cancelada') // Excluir inscrições canceladas
        .maybeSingle();
      
      if (checkError) {
        console.error('Erro ao verificar inscrição existente:', checkError);
        throw new Error('Erro ao verificar inscrição existente');
      }
      
      if (existingRegistration) {
        throw new Error('Você já está inscrito neste workshop');
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
      
      // Determinar status da inscrição baseado no preço da oficina
      const statusInscricao = workshop.preco === 0 ? 'confirmada' : 'pendente';
      
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
      
      if (error) throw error;
      
      // Atualizar vagas disponíveis
      const { error: updateError } = await supabase
        .from('workshops')
        .update({ 
          vagas_disponiveis: workshop.vagas_disponiveis - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', workshopId);
      
      if (updateError) throw updateError;
      
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
      let query = supabase.from('convidados').select('*');
      
      if (registrationId) {
        query = query.eq('inscricao_id', registrationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
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
    } catch (error) {
      console.error('Erro ao criar convidado:', error);
      throw error;
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

  // User management
  fetchUsers: async () => {
    try {
      set((state) => ({ loading: { ...state.loading, users: true } }));
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ users: data || [] });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, users: false } }));
    }
  },

  deleteUser: async (userId: string) => {
    try {
      // Primeiro, buscar o user_id do auth.users para deletar do auth depois
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id, email')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Usuário não encontrado na tabela public.users:', userError);
        // Se o usuário não existe no public, apenas atualizar o estado local
        set((state) => ({
          users: state.users.filter(user => user.id !== userId)
        }));
        return;
      }
      
      console.log('Iniciando remoção completa do usuário:', userData.email);
      
      // Usar a função SQL para deletar completamente do public schema
      const { data, error: functionError } = await supabase
        .rpc('delete_user_completely', { user_table_id: userId });
      
      if (functionError) {
        console.error('Erro na função de remoção completa:', functionError);
        throw functionError;
      }
      
      console.log('Usuário removido do schema public com sucesso');
      
      // Tentar deletar do auth.users usando service role
      try {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
          userData.user_id
        );
        
        if (authDeleteError) {
          // Se o erro for "User not found", significa que já foi removido
          if (authDeleteError.message.includes('User not found')) {
            console.log('Usuário já havia sido removido do auth.users anteriormente');
          } else {
            console.error('Erro ao deletar usuário do auth.users:', authDeleteError);
            // Não lançar erro aqui, pois o usuário já foi removido do public
          }
        } else {
          console.log('Usuário removido completamente do auth.users');
        }
      } catch (authError) {
        console.error('Erro ao tentar deletar do auth.users:', authError);
        // Não lançar erro aqui, pois o usuário já foi removido do public
      }
      
      // Atualizar estado local
      set((state) => ({
        users: state.users.filter(user => user.id !== userId)
      }));
      
      console.log('Remoção completa do usuário finalizada com sucesso');
      
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  },

  // Auth actions
  login: (user) => set({ user }),
  logout: () => set({ user: null })
}));