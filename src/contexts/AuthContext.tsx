import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: any;
  userProfile: any;
  isAdmin: boolean;
  loading: boolean;
  isLoadingProfile: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  loadUserProfile: (retryCount?: number) => Promise<void>;
  reloadUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const profileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    console.log('🔄 Auth: Inicializando autenticacao...');
    
    // Obter sessao inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log('👤 Auth: Usuario encontrado na sessao:', session.user.email);
        setUser(session.user);
        // Não chamar loadUserProfile aqui para evitar loops
        setLoading(false); // Definir loading como false quando usuário já está logado
      } else {
        console.log('❌ Auth: Nenhuma sessao ativa encontrada');
        setLoading(false); // Definir loading como false se não há sessão
      }
    });

    // Escutar mudancas de autenticacao
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;
        console.log(`🔄 Auth state changed: ${event}`, currentUser?.email || 'No user');
        
        setUser(currentUser);
        
        if (event === 'SIGNED_IN' && currentUser) {
          console.log('📊 Auth: Carregando perfil para novo usuario');
          // Usar setTimeout para evitar loops
          setTimeout(() => {
            loadUserProfileInternal(currentUser.id);
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 Auth: Usuario deslogado, limpando estados');
          setUserProfile(null);
          setIsAdmin(false);
          profileCache.clear();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // useEffect separado para carregar perfil quando usuário estiver disponível
  useEffect(() => {
    if (user?.id && !userProfile && !isLoadingProfile) {
      console.log('📊 Auth: Carregando perfil para usuario existente:', user.email);
      loadUserProfileInternal(user.id);
    } else if (user && userProfile) {
      // Se já temos usuário e perfil, garantir que loading seja false
      setLoading(false);
    } else if (!user) {
      // Se não há usuário, garantir que loading seja false e limpar estados
      setLoading(false);
      setUserProfile(null);
      setIsAdmin(false);
    }
  }, [user?.id, userProfile, isLoadingProfile]);

  const loadUserProfileInternal = async (userId: string, retryCount = 0) => {
    const maxRetries = 3;
    
    if (!userId) {
      console.log('⚠️ loadUserProfile: Nenhum userId fornecido');
      setLoading(false);
      return;
    }

    // Verificar se ainda há uma sessão ativa antes de tentar carregar o perfil
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log('⚠️ loadUserProfile: Nenhuma sessão ativa, cancelando carregamento do perfil');
      setLoading(false);
      setIsLoadingProfile(false);
      return;
    }

    if (isLoadingProfile) {
      console.log('⏭️ loadUserProfile: Ja carregando perfil, ignorando chamada');
      return;
    }
    const cacheKey = `profile_${userId}`;
    const cached = profileCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📋 loadUserProfile: Usando perfil do cache');
      setUserProfile(cached.data);
      setIsAdmin(cached.data?.user_type === 'admin');
      setLoading(false);
      return;
    }

    setIsLoadingProfile(true);
    setLoading(true);
    
    try {
      console.log(`📊 loadUserProfile: Carregando perfil para usuario (tentativa ${retryCount + 1}/${maxRetries + 1}):`, userId);
      
      console.log('🔍 loadUserProfile: Iniciando consulta ao Supabase para userId:', userId);
      console.log('⏱️ loadUserProfile: Aguardando resposta da consulta...');
      console.log('🧪 Testando conectividade com Supabase...');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na consulta do perfil')), 30000);
      });

      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ loadUserProfile: Erro na consulta:', error);
        
        // Se for erro 401 (não autorizado), não tentar novamente
        if (error.message?.includes('401') || error.code === '401') {
          console.log('🚫 loadUserProfile: Erro 401 - usuário não autorizado, cancelando tentativas');
          setUserProfile(null);
          setIsAdmin(false);
          setLoading(false);
          setIsLoadingProfile(false);
          return;
        }
        
        if (error.code === 'PGRST116' && retryCount < maxRetries) {
          console.log(`🔄 loadUserProfile: Perfil nao encontrado, tentando novamente (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => loadUserProfileInternal(userId, retryCount + 1), 2000);
          return;
        }
        
        if (retryCount < maxRetries) {
          console.log(`🔄 loadUserProfile: Erro na tentativa ${retryCount + 1}, tentando novamente...`);
          setTimeout(() => loadUserProfileInternal(userId, retryCount + 1), 2000);
          return;
        }
        
        throw error;
      }

      console.log('✅ loadUserProfile: Perfil carregado com sucesso:', profile);
      
      // Atualizar cache
      profileCache.set(cacheKey, {
        data: profile,
        timestamp: Date.now()
      });
      
      setUserProfile(profile);
      setIsAdmin(profile?.user_type === 'admin');
      
    } catch (error: any) {
      console.error('❌ loadUserProfile: Erro na consulta:', error);
      setUserProfile(null);
      setIsAdmin(false);
      
      // Se for erro 401 (não autorizado), não tentar novamente
      if (error.message?.includes('401') || error.code === '401') {
        console.log('🚫 loadUserProfile: Erro 401 no catch - usuário não autorizado, cancelando tentativas');
        setIsLoadingProfile(false);
        setLoading(false);
        return;
      }
      
      if (retryCount < maxRetries) {
        console.log(`🔄 loadUserProfile: Tentativa ${retryCount + 1} falhou, tentando novamente em 3 segundos...`);
        setTimeout(() => loadUserProfileInternal(userId, retryCount + 1), 3000);
        return;
      }
      
      console.error('❌ loadUserProfile: Todas as tentativas falharam');
    } finally {
      setIsLoadingProfile(false);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar se o usuario tem perfil
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (!profile) {
          // Criar perfil basico se nao existir
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              user_id: data.user.id,
              email: data.user.email,
              nome_completo: data.user.user_metadata?.nome || '',
              telefone: data.user.user_metadata?.telefone || '',
              user_type: 'student',
              unit_id: '19df29a0-83ba-4b1e-a2f7-cb3ac8d25b4f', // Campo Grande como padrão
              email_confirmed: true
            });

          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
          }
        }
      }

      return {};
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      return {};
    } catch (error: any) {
      console.error('Erro no registro:', error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Limpar cache
      profileCache.clear();
      
      // Limpar estados
      setUserProfile(null);
      setIsAdmin(false);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const loadUserProfile = async (retryCount = 0) => {
    if (!user?.id) {
      console.log('⚠️ loadUserProfile: Nenhum usuario logado');
      return;
    }
    await loadUserProfileInternal(user.id, retryCount);
  };

  const reloadUserProfile = async () => {
    if (!user?.id) {
      console.log('⚠️ reloadUserProfile: Nenhum usuario logado');
      return;
    }
    
    // Limpar cache antes de recarregar
    const cacheKey = `profile_${user.id}`;
    profileCache.delete(cacheKey);
    
    await loadUserProfileInternal(user.id, 0);
  };

  const value = {
    user,
    userProfile,
    isAdmin,
    loading,
    isLoadingProfile,
    signIn,
    signUp,
    signOut,
    resetPassword,
    loadUserProfile,
    reloadUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}