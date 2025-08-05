import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
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
  sendConfirmationEmail: (userId: string, email: string, userName: string) => Promise<{ success: boolean; error?: string }>;
  confirmEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    };
    
    initializeAuth();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        setUserProfile(null);
        setIsAdmin(false);
        return;
      }

      setUserProfile(profile);
      setIsAdmin(profile?.user_type === 'admin');
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setUserProfile(null);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      

      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        
        // Verificar se o erro é devido a email não confirmado
        if (error.message === 'Email not confirmed') {
          return { 
            error: { 
              message: 'Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação antes de fazer login.',
              code: 'email_not_confirmed'
            } 
          };
        }
        
        return { error };
      }
      
      if (data.user) {
        // Verificar rigorosamente se o email foi confirmado
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          
          return { 
            error: { 
              message: 'Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação antes de fazer login.',
              code: 'email_not_confirmed'
            } 
          };
        }

        
        
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
        await loadUserProfile(data.user.id);
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Erro durante o login:', error);
      return { error };
    } finally {
      setLoading(false);
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
                email_confirmed: false
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
                email_confirmed: false
              });

            if (profileError) {
              console.error('❌ Erro ao criar perfil:', profileError);
              return { error: { message: 'Erro ao criar perfil do usuário', details: profileError } };
            }
            console.log('✅ Perfil do usuário criado com sucesso');
          }

          // Enviar email de confirmação personalizado
          console.log('📧 Enviando email de confirmação personalizado...');
          const emailResult = await emailService.sendConfirmationEmail(
            data.user.id,
            data.user.email!,
            userData.nome_completo || 'Usuário'
          );

          if (emailResult.success) {
            console.log('✅ Email de confirmação enviado com sucesso');
          } else {
            console.warn('⚠️ Falha ao enviar email de confirmação:', emailResult.error);
            // Não retornar erro aqui, pois o usuário foi criado com sucesso
          }
          
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

  const sendConfirmationEmail = async (userId: string, email: string, userName: string) => {
    return await emailService.sendConfirmationEmail(userId, email, userName);
  };

  const confirmEmail = async (token: string) => {
    return await emailService.confirmEmail(token);
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
    sendConfirmationEmail,
    confirmEmail,
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