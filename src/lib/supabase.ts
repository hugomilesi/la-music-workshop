import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Cliente principal para operações normais
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'la-music-week-auth' // Chave única para evitar conflitos
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000)
  },
  global: {
    headers: {
      'x-client-info': 'la-music-week@1.0.0'
    },
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000) // 30 segundos timeout
      })
    }
  }
})

// Cliente com service role para operações administrativas
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: 'la-music-week-admin-auth' // Chave única para admin
  },
  global: {
    headers: {
      'x-client-info': 'la-music-week-admin@1.0.0'
    },
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000) // 30 segundos timeout
      })
    }
  }
})

// Tipos para as tabelas do banco
export interface Workshop {
  id: string
  nome: string
  descricao: string
  data_inicio: string
  data_fim: string
  local: string
  capacidade: number
  preco: number
  instrumento: string
  nivel: 'iniciante' | 'intermediario' | 'avancado'
  vagas_disponiveis: number
  status: 'ativa' | 'cancelada' | 'finalizada'
  unit_id: string
  professor?: string
  horario?: string
  total_vagas?: number
  idade_minima?: number
  idade_maxima?: number
  permite_convidados?: boolean
  imagem?: string
  gratuito?: boolean
  nome_instrutor?: string
  created_at: string
  updated_at: string
}

export interface Inscricao {
  id: string
  workshop_id: string
  user_id: string
  data_inscricao: string
  status_inscricao: 'pendente' | 'confirmada' | 'cancelada'
  nome_completo?: string
  idade?: number
  telefone?: string
  email?: string
  professor_atual?: string
  nome_responsavel?: string
  telefone_responsavel?: string
  email_responsavel?: string
  tem_convidados?: boolean
  participant_name?: string
  participant_age?: number
  participant_type?: 'principal' | 'convidado'
  invited_by_user_id?: string
  presente?: boolean
  data_presenca?: string
  total_participantes?: number
  created_at: string
  updated_at: string
}

export interface Pagamento {
  id: string
  inscricao_id: string
  valor: number
  data_pagamento?: string
  status_pagamento: 'pendente' | 'pago' | 'cancelado' | 'reembolsado'
  metodo_pagamento?: string
  created_at: string
  updated_at: string
}

export interface Mensagem {
  id: string
  remetente_id: string
  destinatario_id: string
  assunto: string
  conteudo: string
  data_envio: string
  status_leitura: 'nao_lida' | 'lida'
  created_at: string
  updated_at: string
}

export interface LembreteAutomatico {
  id: string
  workshop_id: string
  tipo_lembrete: 'confirmacao_inscricao' | 'lembrete_evento' | 'pos_evento'
  periodo_disparo: number
  titulo: string
  mensagem: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface EnvioLembrete {
  id: string
  lembrete_id: string
  inscricao_id: string
  data_envio: string
  status_envio: 'enviado' | 'falhou' | 'pendente'
  tentativas: number
  created_at: string
}