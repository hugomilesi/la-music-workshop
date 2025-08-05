import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI'

// Cliente principal para operações normais
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
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
    }
  }
})

// Cliente com service role para operações administrativas
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
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
  instrutor_id?: string
  created_at: string
  updated_at: string
}

export interface Inscricao {
  id: string
  workshop_id: string
  user_id: string
  data_inscricao: string
  status_inscricao: 'pendente' | 'confirmada' | 'cancelada'
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