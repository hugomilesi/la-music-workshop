import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Music, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

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
        console.error('📋 Detalhes do erro:', {
          message: authError.message,
          status: authError.status,
          statusText: authError.statusText
        });
        
        // Tratar erros específicos do Supabase
        if (authError.message.includes('User already registered')) {
          console.log('🔄 Erro: Usuário já registrado');
          setError(`O email "${formData.email}" já está cadastrado no sistema. Tente fazer login ou use outro email.`);
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
      setSuccess('Conta criada com sucesso! ✅\n\nIMPORTANTE: Verifique sua caixa de entrada e clique no link de confirmação antes de tentar fazer login.\n\nSem a confirmação do email, você não conseguirá acessar o sistema.');
      
      console.log('⏰ Redirecionando para login em 5 segundos...');
      // Redirecionar após 5 segundos para dar tempo de ler a mensagem
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Confirme seu email antes de fazer login',
            type: 'info'
          }
        });
      }, 5000);
      
    } catch (err: any) {
      console.error('💥 Erro inesperado durante o cadastro:', err);
      console.error('📊 Stack trace:', err instanceof Error ? err.stack : 'N/A');
      console.error('🔍 Tipo do erro:', typeof err);
      console.error('📝 Detalhes completos:', JSON.stringify(err, null, 2));
      
      // Tratar erros específicos
      if (err?.message?.includes('duplicate key') || err?.message?.includes('already exists')) {
        setError(`O email "${formData.email}" já está cadastrado no sistema. Tente fazer login ou use outro email.`);
      } else {
        setError('Erro inesperado durante o cadastro. Tente novamente ou entre em contato com o suporte.');
      }
    } finally {
      console.log('🏁 Finalizando processo de cadastro...');
      setIsLoading(false);
    }
  };

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4 glow-purple">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-inter glow">
            LA Music Week
          </h1>
          <p className="text-white/70 font-source">
            Criar Nova Conta
          </p>
        </div>

        {/* Register Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
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
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-white/70 text-sm">
              Já tem uma conta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Fazer login
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