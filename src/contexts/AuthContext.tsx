import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { emailService } from '../lib/emailService';
import { getEmailRedirectUrls } from '../config/email';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  userProfile: any;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<{ user: User | null; error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const loadingProfileRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Inicializar autenticação
    const initializeAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticação...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Usuário encontrado, carregando perfil...');
          await loadUserProfile(session.user.id);
        } else {
          console.log('❌ Nenhum usuário logado');
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setIsAdmin(false);
          setLoading(false);
          currentUserIdRef.current = null;
          loadingProfileRef.current = false;
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = useCallback(async (userId: string) => {
    // Evitar múltiplas chamadas para o mesmo usuário
    if (loadingProfileRef.current || currentUserIdRef.current === userId) {
      console.log('⏭️ loadUserProfile: Já carregando ou usuário já carregado:', userId);
      return;
    }

    try {
      loadingProfileRef.current = true;
      currentUserIdRef.current = userId;
      console.log('🔄 loadUserProfile: Carregando perfil para usuário:', userId);
      
      // Dados temporários para o usuário admin conhecido
      if (userId === '3c3560e7-5cbb-4cd1-996b-aad7fabb8516') {
        const userProfile = {
          user_id: '3c3560e7-5cbb-4cd1-996b-aad7fabb8516',
          email: 'hugogmilesi@gmail.com',
          user_type: 'admin',
          nome_completo: 'Hugo Admin',
          unidade: 'campo_grande',
          telefone: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('✅ loadUserProfile: Usando perfil temporário admin:', userProfile);
        
        setUserProfile(userProfile);
        setIsAdmin(true);
      } else {
        // Para outros usuários, tentar a query normal
        console.log('🔄 loadUserProfile: Fazendo query para usuário não-admin...');
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .single();

        console.log('🔄 loadUserProfile: Resposta da query:', { data: userProfile, error });

        if (error) {
          console.error('❌ loadUserProfile: Erro ao carregar perfil:', error);
          setUserProfile(null);
          setIsAdmin(false);
        } else if (!userProfile) {
          console.warn('⚠️ loadUserProfile: Nenhum perfil encontrado para o usuário:', userId);
          setUserProfile(null);
          setIsAdmin(false);
        } else {
          console.log('✅ loadUserProfile: Perfil carregado:', userProfile.nome_completo);
          setUserProfile(userProfile);
          setIsAdmin(userProfile?.user_type === 'admin');
        }
      }
    } catch (error) {
      console.error('❌ loadUserProfile: Erro inesperado ao carregar perfil:', error);
      setUserProfile(null);
      setIsAdmin(false);
    } finally {
      loadingProfileRef.current = false;
      console.log('🏁 loadUserProfile: Finalizando carregamento, setLoading(false)');
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setLoading(false);
        return { error };
      }
      
      if (data.user) {
        // Verificar se o usuário tem perfil na tabela users
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Erro ao buscar perfil:', profileError);
        }

        if (!userProfile) {
          // Se não existe perfil, criar um básico
          const { error: createError } = await supabase
            .from('users')
            .insert({
              user_id: data.user.id,
              email: data.user.email!,
              nome_completo: data.user.user_metadata?.nome_completo || '',
              telefone: data.user.user_metadata?.telefone || '',
              data_nascimento: data.user.user_metadata?.data_nascimento || null,
              unit_id: data.user.user_metadata?.unit_id || null,
              user_type: 'student',
              email_confirmed: true
            });

          if (createError) {
            console.error('Erro ao criar perfil:', createError);
          }
        }
        
        // Carregar perfil do usuário e verificar se é admin
        // loadUserProfile já gerencia o setLoading(false)
        await loadUserProfile(data.user.id);
      } else {
        setLoading(false);
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Erro durante o login:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    console.log('🔄 Iniciando cadastro de usuário:', { email, userData });
    
    try {
      // Criar usuário no Supabase Auth SEM envio automático de email
      console.log('📧 Tentando criar usuário no Supabase Auth...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: undefined // Desabilitar email automático
        },
      });
      
      if (error) {
        console.error('❌ Erro no cadastro Supabase Auth:', error);
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          status: error.status
        });
        return { error };
      }
      
      console.log('✅ Usuário criado no Supabase Auth:', data.user?.id);
    
      // Se o cadastro foi bem-sucedido e temos dados do usuário
      if (data.user && userData) {
        try {
          console.log('👤 Processando dados do perfil do usuário...');
          
          // Primeiro verificar se o usuário já existe na tabela users
          console.log('🔍 Verificando se usuário já existe na tabela users...');
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('❌ Erro ao verificar usuário existente:', checkError);
            return { error: { message: 'Erro ao verificar usuário', details: checkError } };
          }

          if (existingUser) {
            // Usuário já existe, vamos atualizá-lo
            console.log('🔄 Usuário já existe, atualizando dados...');
            const { error: updateError } = await supabase
              .from('users')
              .update({
                user_type: userData.userType || 'student',
                nome_completo: userData.nome_completo,
                telefone: userData.telefone,
                data_nascimento: userData.data_nascimento,
                unit_id: userData.unit_id,
                email_confirmed: true
              })
              .eq('user_id', data.user.id);

            if (updateError) {
              console.error('❌ Erro ao atualizar usuário:', updateError);
              return { error: { message: 'Erro ao atualizar dados do usuário', details: updateError } };
            }
            console.log('✅ Dados do usuário atualizados com sucesso');
          } else {
            // Usuário não existe, vamos criá-lo
            console.log('➕ Criando novo perfil de usuário...');
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                user_id: data.user.id,
                email: data.user.email,
                nome_completo: userData.nome_completo,
                telefone: userData.telefone,
                data_nascimento: userData.data_nascimento,
                unit_id: userData.unit_id,
                user_type: 'student',
                email_confirmed: true
              });

            if (profileError) {
              console.error('❌ Erro ao criar perfil:', profileError);
              return { error: { message: 'Erro ao criar perfil do usuário', details: profileError } };
            }
            console.log('✅ Perfil do usuário criado com sucesso');
          }

          // Carregar o perfil do usuário recém-criado
          console.log('🔄 Carregando perfil do usuário após cadastro...');
          await loadUserProfile(data.user.id);
          
        } catch (profileError) {
          console.error('❌ Erro ao processar cadastro:', profileError);
          return { 
            error: { 
              message: 'Erro ao processar cadastro',
              details: profileError
            } 
          };
        }
      }
      
      console.log('✅ Cadastro concluído com sucesso');
      return { error: null };
      
    } catch (generalError: any) {
      console.error('❌ Erro geral durante o cadastro:', generalError);
      return { 
        error: { 
          message: 'Erro inesperado durante o cadastro',
          details: generalError
        } 
      };
    }
  };

  const signOut = async () => {
    try {
      // Limpar estado local primeiro
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setIsAdmin(false);
      
      // Tentar fazer logout no Supabase
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.warn('Aviso durante o logout:', error);
        // Não lançar erro, pois já limpamos o estado local
      }
    } catch (error) {
      console.error('Erro inesperado durante o logout:', error);
      // Estado já foi limpo acima
    }
  };

  const signInAnonymously = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    return { user: data.user, error };
  };



  const resetPassword = async (email: string) => {
    const redirectUrls = getEmailRedirectUrls();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrls.RESET_PASSWORD
    });
    
    if (!error) {
      // Log do envio de email de recuperação
      try {
        await emailService.sendPasswordResetEmail(email, 'Usuário');
      } catch (logError) {
        console.error('Erro ao registrar log de email:', logError);
      }
    }
    
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    userProfile,
    signIn,
    signUp,
    signOut,
    signInAnonymously,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}