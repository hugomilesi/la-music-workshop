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

  
  const { signIn, user, loading, resetPassword, isAdmin, userProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const { createRegistration } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Proteção de rota: redirecionar usuários já autenticados imediatamente
  useEffect(() => {
    if (user && !loading) {
      console.log('🔄 Login: Usuário já autenticado, redirecionando...');
      
      const selectedWorkshopId = localStorage.getItem('selectedWorkshopId');
      
      if (isAdmin || userProfile?.user_type === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (selectedWorkshopId) {
        navigate('/inscricao', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      return;
    }
  }, [user, loading, isAdmin, userProfile, navigate]);

  useEffect(() => {
    // Verificar se há selectedWorkshopId no localStorage
    const selectedWorkshopId = localStorage.getItem('selectedWorkshopId');
    if (selectedWorkshopId) {
      showInfo(
        'Inscrição Pendente',
        'Para se inscrever no workshop, você precisa fazer login primeiro.'
      );
    }
  }, [navigate]);

  // useEffect removido - lógica de redirecionamento movida para o useEffect acima

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    console.log('🔄 Login: Iniciando processo de login para:', email);

    try {
      const { error } = await signIn(email, password);
    
      if (error) {
        console.error('❌ Login: Erro no signIn:', error);
        if (error.message?.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
          showError('Credenciais Inválidas', 'Email ou senha incorretos.');
        } else {
          setError(error.message || 'Erro ao fazer login');
          showError('Erro no Login', error.message || 'Erro ao fazer login');
        }
        setIsLoading(false);
      } else {
        console.log('✅ Login: signIn bem-sucedido, aguardando redirecionamento...');
        // Login bem-sucedido - o redirecionamento será feito pelo useEffect
        // Não definir isLoading como false aqui, deixar o useEffect gerenciar
        showSuccess('Login Realizado', 'Bem-vindo de volta!');
        
        // Aguardar um pouco para o AuthContext processar
        setTimeout(() => {
          if (isLoading) {
            console.log('⏰ Login: Timeout - definindo isLoading como false');
            setIsLoading(false);
          }
        }, 3000);
      }
    } catch (err) {
      console.error('❌ Login: Erro inesperado:', err);
      showError('Erro inesperado. Tente novamente.');
      setError('Erro inesperado. Tente novamente.');
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
    <div className="min-h-screen flex items-center justify-center p-4 py-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-80 md:h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center mb-3 md:mb-4">
            <img 
              src="/assets/lamusic.png" 
              alt="LA Music Week" 
              className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 font-inter glow">
            LA Music Week
          </h1>
          <p className="text-sm md:text-base text-white/70 font-source">
            Entrar na sua conta
          </p>
        </div>

        {/* Login Form */}
          <Card className="p-4 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
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
                  className="w-full pl-10 pr-4 py-3 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
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
                  className="w-full pl-10 pr-12 py-3 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors p-1 -m-1"
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
                className="text-purple-400 hover:text-purple-300 transition-colors text-sm p-1 -m-1 min-h-[44px] flex items-center justify-end"
              >
                Esqueceu a senha?
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}



            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full relative min-h-[48px] md:min-h-[52px]"
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
          <div className="text-center mt-4 md:mt-6">
            <p className="text-white/70 text-sm">
              Não tem uma conta?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-purple-400 hover:text-purple-300 transition-colors p-1 -m-1"
              >
                Criar conta
              </button>
            </p>
          </div>


        </Card>

        {/* Back to Home */}
        <div className="text-center mt-4 md:mt-6">
          <Button
            variant="glass"
            className="min-h-[44px]"
            onClick={() => navigate('/')}
          >
            Voltar ao Site
          </Button>
        </div>
      </div>
    </div>
  );
}