import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, Music } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '@/components/Card';

import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  const { signIn, user, loading, resetPassword, isAdmin, userProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const { createRegistration } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar se há mensagem de confirmação de email ou erro vinda do location.state
    const state = location.state as { message?: string; error?: string; type?: string } | null;
    if (state?.message) {
      if (state.type === 'success') {
        showSuccess('Email Confirmado', state.message);
      } else if (state.type === 'error') {
        showError('Erro na Confirmação', state.message);
      } else {
        showInfo('Informação', state.message);
      }
      // Limpar o state para não mostrar a mensagem novamente
      navigate(location.pathname, { replace: true });
    }
    if (state?.error) {
      showError('Erro na Confirmação', state.error);
      navigate(location.pathname, { replace: true });
    }

    // Verificar se há selectedWorkshopId no localStorage
    const selectedWorkshopId = localStorage.getItem('selectedWorkshopId');
    if (selectedWorkshopId) {
      showInfo(
        'Inscrição Pendente',
        'Para se inscrever no workshop, você precisa fazer login primeiro.'
      );
    }
  }, [location.state, navigate]);

  useEffect(() => {
    // Redirecionar usuário já autenticado
    if (user && !loading) {
      console.log('Usuário autenticado detectado:', { user: user.email, isAdmin, userProfile });
      
      // Aguardar um pouco para o perfil carregar se ainda não carregou
      const redirectUser = async () => {
        // Se não tem perfil ainda, tentar carregar diretamente
        let currentIsAdmin = isAdmin;
        if (!userProfile) {
          try {
            const { data: profile } = await supabase.from('users')
              .select('*')
              .eq('user_id', user.id)
              .single();
            
            if (profile) {
              currentIsAdmin = profile.user_type === 'admin';
            }
          } catch (error) {
            console.error('Erro ao buscar perfil para redirecionamento:', error);
          }
        }
        
        // Verificar se há workshop selecionado
        const selectedWorkshopId = localStorage.getItem('selectedWorkshopId');
        
        if (currentIsAdmin) {
          console.log('Redirecionando admin para dashboard');
          navigate('/admin/dashboard', { replace: true });
        } else if (selectedWorkshopId) {
          console.log('Redirecionando usuário para inscrição');
          navigate('/inscricao', { replace: true });
        } else {
          console.log('Redirecionando usuário para home');
          navigate('/', { replace: true });
        }
      };
      
      redirectUser();
    }
  }, [user, loading, isAdmin, userProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setEmailNotConfirmed(false);

    try {
      const { error } = await signIn(email, password);
    
    if (error) {
        
        if (error.code === 'email_not_confirmed' || 
            error.message === 'Email not confirmed' ||
            error.message === 'email_not_confirmed') {
          setEmailNotConfirmed(true);
          setError('❌ Seu email ainda não foi confirmado.\n\nVerifique sua caixa de entrada (incluindo spam) e clique no link de confirmação antes de tentar fazer login novamente.');
          showError(
            'Email Não Confirmado', 
            'Você precisa confirmar seu email antes de fazer login. Verifique sua caixa de entrada e spam.'
          );
        } else if (error.message?.includes('Invalid login credentials')) {
          setEmailNotConfirmed(false);
          setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
        } else {
          setEmailNotConfirmed(false);
          setError(error.message || 'Erro ao fazer login');
        }
      } else {
        // Login bem-sucedido
        showSuccess('Login Realizado', 'Bem-vindo de volta!');
        
        // Aguardar um pouco para o contexto atualizar e então redirecionar
        setTimeout(async () => {
          try {
            // Buscar perfil do usuário diretamente
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (currentUser) {
              const { data: profile } = await supabase.from('users')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();
              
              const selectedWorkshopId = localStorage.getItem('selectedWorkshopId');
              
              if (profile?.user_type === 'admin') {
                console.log('Redirecionando admin após login');
                navigate('/admin/dashboard', { replace: true });
              } else if (selectedWorkshopId) {
                console.log('Redirecionando usuário para inscrição após login');
                navigate('/inscricao', { replace: true });
              } else {
                console.log('Redirecionando usuário para home após login');
                navigate('/', { replace: true });
              }
            }
          } catch (error) {
            console.error('Erro ao redirecionar após login:', error);
            // Fallback para home
            navigate('/', { replace: true });
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      showError('Erro inesperado. Tente novamente.');
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');
    setResetSuccess('');

    try {
      const { error } = await resetPassword(resetEmail);

      if (error) {
        setError('Erro ao enviar email de recuperação: ' + error.message);
      } else {
        setResetSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetSuccess('');
          setResetEmail('');
        }, 3000);
      }
    } catch (err) {
      console.error('Erro ao enviar email de recuperação:', err);
      setError('Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Digite seu email primeiro');
      return;
    }

    setResendLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setError('Erro ao reenviar email: ' + error.message);
      } else {
        showSuccess('Email reenviado', 'Verifique sua caixa de entrada para o novo email de confirmação.');
        setEmailNotConfirmed(false);
      }
    } catch (err) {
      console.error('Erro ao reenviar email:', err);
      setError('Erro ao reenviar email. Tente novamente.');
    } finally {
      setResendLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/assets/la-music-week-logo.svg" 
                alt="LA Music Week" 
                className="w-24 h-24 object-contain drop-shadow-2xl"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 font-inter glow">
              LA Music Week
            </h1>
            <p className="text-white/70 font-source">
              Recuperar Senha
            </p>
          </div>

          {/* Forgot Password Form */}
          <Card className="p-8">
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 text-sm">{resetSuccess}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={resetLoading}
              >
                {resetLoading ? 'Enviando...' : 'Enviar Email de Recuperação'}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="text-center mt-6">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
              >
                Voltar ao Login
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/assets/lamusic.png" 
              alt="LA Music Week" 
              className="w-24 h-24 object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-inter glow">
            LA Music Week
          </h1>
          <p className="text-white/70 font-source">
            Entrar na sua conta
          </p>
        </div>

        {/* Login Form */}
          <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
              >
                Esqueceu a senha?
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {emailNotConfirmed && (
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-sm mb-3">
                  Seu email ainda não foi confirmado. Verifique sua caixa de entrada ou clique no botão abaixo para reenviar o email de confirmação.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={resendLoading}
                  onClick={handleResendConfirmation}
                >
                  {resendLoading ? 'Reenviando...' : 'Reenviar Email de Confirmação'}
                </Button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full relative"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </div>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-6">
            <p className="text-white/70 text-sm">
              Não tem uma conta?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Criar conta
              </button>
            </p>
          </div>


        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Button
            variant="glass"
            onClick={() => navigate('/')}
          >
            Voltar ao Site
          </Button>
        </div>
      </div>
    </div>
  );
}