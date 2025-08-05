import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xfqgcfeoswlkcgdtikco.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0';

// Configuração otimizada do Supabase com retry logic
export const supabaseWithRetry = createClient(supabaseUrl, supabaseAnonKey, {
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
});

// Interface para configuração de retry
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

// Configuração padrão de retry
const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

// Função para implementar exponential backoff
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
  return Math.min(delay, config.maxDelay);
}

// Função para verificar se um erro é recuperável
function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  // Códigos de erro que indicam problemas temporários
  const retryableCodes = [
    'PGRST301', // Connection timeout
    'PGRST302', // Connection failed
    '08000',    // Connection exception
    '08003',    // Connection does not exist
    '08006',    // Connection failure
    '53300',    // Too many connections
    '57P01',    // Admin shutdown
    '57P02',    // Crash shutdown
    '57P03'     // Cannot connect now
  ];
  
  const errorCode = error.code || error.error_code || '';
  const errorMessage = error.message || '';
  
  // Verificar códigos específicos
  if (retryableCodes.includes(errorCode)) {
    return true;
  }
  
  // Verificar mensagens que indicam problemas temporários
  const retryableMessages = [
    'connection',
    'timeout',
    'network',
    'temporary',
    'unavailable',
    'starting up',
    'realtime'
  ];
  
  return retryableMessages.some(msg => 
    errorMessage.toLowerCase().includes(msg)
  );
}

// Função genérica de retry para operações do Supabase
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config };
  let lastError: any;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // Se chegou aqui, a operação foi bem-sucedida
      if (attempt > 0) {
        // Operação bem-sucedida após retry
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Se não é um erro recuperável ou já esgotamos as tentativas
      if (!isRetryableError(error) || attempt === finalConfig.maxRetries) {
        // Operação falhou definitivamente
        throw error;
      }
      
      // Calcular delay para próxima tentativa
      const delay = calculateDelay(attempt, finalConfig);
      
      // Tentativa falhou, aguardando próxima tentativa
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Wrapper para operações comuns do Supabase com retry automático
export class SupabaseWithRetry {
  private client: SupabaseClient;
  
  constructor(client: SupabaseClient = supabaseWithRetry) {
    this.client = client;
  }
  
  // Método para SELECT com retry
  async select(table: string, query: string = '*', filters?: any) {
    return withRetry(async () => {
      let supabaseQuery = this.client.from(table).select(query);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          supabaseQuery = supabaseQuery.eq(key, value);
        });
      }
      
      const { data, error } = await supabaseQuery;
      
      if (error) {
        throw error;
      }
      
      return data;
    });
  }
  
  // Método para INSERT com retry
  async insert(table: string, data: any) {
    return withRetry(async () => {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();
      
      if (error) {
        throw error;
      }
      
      return result;
    });
  }
  
  // Método para UPDATE com retry
  async update(table: string, data: any, filters: any) {
    return withRetry(async () => {
      let query = this.client.from(table).update(data);
      
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data: result, error } = await query.select();
      
      if (error) {
        throw error;
      }
      
      return result;
    });
  }
  
  // Método para DELETE com retry
  async delete(table: string, filters: any) {
    return withRetry(async () => {
      let query = this.client.from(table).delete();
      
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { error } = await query;
      
      if (error) {
        throw error;
      }
      
      return true;
    });
  }
  
  // Acesso direto ao cliente para operações avançadas
  get raw() {
    return this.client;
  }
}

// Instância padrão para uso na aplicação
export const supabaseRetry = new SupabaseWithRetry();

// Função para monitorar a saúde da conexão
export function monitorSupabaseHealth() {
  let isHealthy = true;
  let lastCheck = Date.now();
  
  const checkHealth = async () => {
    try {
      const { data, error } = await supabaseWithRetry
        .from('users')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        if (isHealthy) {
          // Supabase connection unhealthy
          isHealthy = false;
        }
      } else {
        if (!isHealthy) {
          // Supabase connection restored
          isHealthy = true;
        }
      }
    } catch (error: any) {
      if (isHealthy) {
        // Supabase health check failed
        isHealthy = false;
      }
    }
    
    lastCheck = Date.now();
  };
  
  // Verificar a cada 30 segundos
  const interval = setInterval(checkHealth, 30000);
  
  // Verificação inicial
  checkHealth();
  
  // Retornar função para parar o monitoramento
  return () => {
    clearInterval(interval);
  };
}

// Exportar cliente original para compatibilidade
export { supabaseWithRetry as supabase };