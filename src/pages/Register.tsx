import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Music, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { sendRegistrationConfirmation } from '@/utils/whatsapp';

interface Unidade {
  id: string;
  nome: string;
}

// Unidades fixas disponíveis com UUIDs corretos
const UNIDADES_DISPONIVEIS: Unidade[] = [
  { id: '8f424adf-64ca-43e9-909c-8dfd6783ac15', nome: 'Barra' },
  { id: '19df29a0-83ba-4b1e-a2f7-cb3ac8d25b4f', nome: 'Campo Grande' },
  { id: 'a4e3815c-8a34-4ef1-9773-cdeabdce1003', nome: 'Recreio' }
];

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nome_completo: '',
    telefone: '',
    data_nascimento: '',
    unit_id: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar se há mensagem de erro vinda do callback
    const state = location.state as { error?: string } | null;
    if (state?.error) {
      setError(state.error);
      // Limpar o state para não mostrar a mensagem novamente
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || 
        !formData.nome_completo || !formData.telefone || !formData.data_nascimento || 
        !formData.unit_id) {
      setError('Todos os campos são obrigatórios');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }

    return true;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Iniciando processo de cadastro...');
    
    if (isLoading) {
      console.log('⏳ Cadastro já em andamento, ignorando...');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    console.log('📝 Dados do formulário:', {
      email: formData.email,
      nomeCompleto: formData.nome_completo,
      telefone: formData.telefone,
      dataNascimento: formData.data_nascimento,
      unitId: formData.unit_id
    });

    // Validação do formulário
     if (!validateForm()) {
       console.log('❌ Validação do formulário falhou');
       setIsLoading(false);
       return;
     }

    try {
      console.log('✅ Prosseguindo com o cadastro...');
      
      // Primeiro, verificar se o usuário já existe no sistema
      console.log('🔍 Verificando se email já existe...');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', formData.email)
        .single();
        
      if (existingUser && !checkError) {
        console.log('✅ Email encontrado na tabela users');
        setError('Este email já está cadastrado no sistema.');
        
        setTimeout(() => {
          const goToLogin = window.confirm(
            'Este email já está cadastrado. Deseja ir para a página de login?'
          );
          if (goToLogin) {
            navigate('/login', { 
              state: { 
                email: formData.email,
                message: 'Email já cadastrado. Faça login com suas credenciais.' 
              }
            });
          }
        }, 2000);
        return;
      }

      // Criar usuário no Supabase Auth (que já cria o perfil na tabela users)
      console.log('📧 Chamando função signUp...');
      const { error: authError } = await signUp(
        formData.email,
        formData.password,
        {
          nome_completo: formData.nome_completo,
          telefone: formData.telefone,
          data_nascimento: formData.data_nascimento,
          unit_id: formData.unit_id
        }
      );

      if (authError) {
        console.error('❌ Erro no cadastro:', authError);
        console.error('📋 Detalhes completos do erro:', {
          message: authError.message,
          status: authError.status,
          statusText: authError.statusText,
          code: authError.code,
          details: authError.details,
          hint: authError.hint,
          fullError: JSON.stringify(authError, null, 2)
        });
        
        // Tratar erros específicos do Supabase
        if (authError.message.includes('User already registered') || 
            authError.message.includes('already registered') ||
            authError.message.includes('user_already_exists')) {
          console.log('🔄 Erro: Usuário já registrado');
          setError(`O email "${formData.email}" já está cadastrado no sistema.`);
          
          // Mostrar opção de ir para login após 2 segundos
          setTimeout(() => {
            const confirmLogin = window.confirm(
              `O email "${formData.email}" já possui uma conta.\n\nDeseja ir para a página de login agora?`
            );
            if (confirmLogin) {
              navigate('/login', { 
                state: { 
                  email: formData.email,
                  message: 'Email já cadastrado. Faça login com suas credenciais.',
                  type: 'info'
                }
              });
            }
          }, 2000);
        } else if (authError.message.includes('Invalid email')) {
          console.log('📧 Erro: Email inválido');
          setError('Email inválido. Verifique o formato do email e tente novamente.');
        } else if (authError.message.includes('Password')) {
          console.log('🔒 Erro: Problema com senha');
          setError('Senha inválida. A senha deve ter pelo menos 6 caracteres.');
        } else {
          console.log('⚠️ Erro genérico:', authError.message);
          setError(`Erro ao criar conta: ${authError.message}`);
        }
        return;
      }

      console.log('🎉 Cadastro realizado com sucesso!');
      setSuccess('Conta criada com sucesso! ✅\n\nVocê já pode fazer login com suas credenciais.');
      
      // Enviar mensagem de confirmação via WhatsApp
      try {
        console.log('📱 Enviando mensagem de confirmação via WhatsApp...');
        const whatsappResult = await sendRegistrationConfirmation(
          formData.telefone,
          formData.nome_completo
        );
        
        if (whatsappResult.success) {
          console.log('✅ Mensagem WhatsApp enviada com sucesso!');
        } else {
          console.warn('⚠️ Falha ao enviar mensagem WhatsApp:', whatsappResult.error);
        }
      } catch (whatsappError) {
        console.error('❌ Erro ao enviar mensagem WhatsApp:', whatsappError);
        // Não interromper o fluxo se o WhatsApp falhar
      }
      
      console.log('⏰ Redirecionando para login em 3 segundos...');
      // Redirecionar após 3 segundos para dar tempo de ler a mensagem
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Conta criada com sucesso! Faça login com suas credenciais.',
            type: 'success'
          }
        });
      }, 3000);
      
    } catch (err: any) {
      console.error('💥 Erro inesperado durante o cadastro:', err);
      console.error('📊 Stack trace:', err instanceof Error ? err.stack : 'N/A');
      console.error('🔍 Tipo do erro:', typeof err);
      console.error('📝 Detalhes completos:', JSON.stringify(err, null, 2));
      
      // Tratar erros específicos
      if (err?.message?.includes('duplicate key') || 
          err?.message?.includes('already exists') ||
          err?.message?.includes('user_already_exists')) {
        setError(`O email "${formData.email}" já está cadastrado no sistema. Tente fazer login ou use outro email.`);
        
        setTimeout(() => {
          const goToLogin = window.confirm(
            'Este email já está cadastrado. Deseja ir para a página de login?'
          );
          if (goToLogin) {
            navigate('/login', { 
              state: { 
                email: formData.email,
                message: 'Email já cadastrado. Faça login com suas credenciais.' 
              }
            });
          }
        }, 2000);
      } else {
        setError('Erro inesperado durante o cadastro. Tente novamente ou entre em contato com o suporte.');
      }
    } finally {
      console.log('🏁 Finalizando processo de cadastro...');
      setIsLoading(false);
    }
  };

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
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-primary rounded-full mb-3 md:mb-4 glow-purple">
            <Music className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 font-inter glow">
            LA Music Week
          </h1>
          <p className="text-sm md:text-base text-white/70 font-source">
            Criar Nova Conta
          </p>
        </div>

        {/* Register Form */}
        <Card className="p-4 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Nome Completo */}
            <div>
              <label htmlFor="nomeCompleto" className="block text-sm font-medium text-white mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  id="nome_completo"
                  name="nome_completo"
                  type="text"
                  value={formData.nome_completo}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-white mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>

            {/* Data de Nascimento */}
            <div>
              <label htmlFor="dataNascimento" className="block text-sm font-medium text-white mb-2">
                Data de Nascimento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  id="data_nascimento"
                  name="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  required
                />
              </div>
            </div>

            {/* Unidade */}
            <div>
              <label htmlFor="unitId" className="block text-sm font-medium text-white mb-2">
                Unidade
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <select
                  id="unit_id"
                  name="unit_id"
                  value={formData.unit_id}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none text-base"
                  required
                >
                  <option value="" className="bg-gray-800 text-white">
                    Selecione uma unidade
                  </option>
                  {UNIDADES_DISPONIVEIS.map((unidade) => (
                    <option key={unidade.id} value={unidade.id} className="bg-gray-800 text-white">
                      {unidade.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-4 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
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

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-4 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-sm">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full py-4 md:py-3 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Criando conta...
                </div>
              ) : (
                'Criar Conta'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-4 md:mt-6">
            <p className="text-white/70 text-sm md:text-base">
              Já tem uma conta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Fazer login
              </button>
            </p>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-3 md:mt-6">
          <Button
            variant="glass"
            onClick={() => navigate('/')}
            className="text-sm md:text-base py-2"
          >
            ← Voltar ao Site
          </Button>
        </div>
      </div>
    </div>
  );
}