import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/authcontext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean; // true = precisa estar logado, false = precisa estar deslogado
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/', 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading, userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset hasRedirected quando a rota muda
  useEffect(() => {
    setHasRedirected(false);
  }, [location.pathname]);

  useEffect(() => {
    // Limpar timeout anterior se existir
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    // Aguardar o carregamento inicial
    if (loading) {
      console.log('🔄 ProtectedRoute: Aguardando carregamento...');
      return;
    }

    // Evitar redirecionamentos múltiplos
    if (hasRedirected) {
      console.log('⏭️ ProtectedRoute: Já redirecionado, ignorando');
      return;
    }

    if (requireAuth) {
      // Rota que requer autenticação
      if (!user) {
        console.log('🔒 ProtectedRoute: Usuário não logado, redirecionando para login');
        setHasRedirected(true);
        navigate('/login', { replace: true });
        return;
      }
    } else {
      // Rota que requer estar deslogado (ex: login, register)
      if (user) {
        console.log('👤 ProtectedRoute: Usuário logado tentando acessar rota de deslogado');
        
        // Aguardar perfil carregar se ainda não carregou
        if (userProfile === undefined) {
          console.log('⏳ ProtectedRoute: Aguardando perfil carregar...');
          return;
        }
        
        // Redirecionar imediatamente para evitar loop
        setHasRedirected(true);
        
        // Verificar se há workshop selecionado
        const selectedWorkshopId = localStorage.getItem('selectedWorkshopId');
        
        // Se há perfil, usar as informações do perfil
        if (userProfile) {
          if (isAdmin || userProfile?.user_type === 'admin') {
            console.log('👑 ProtectedRoute: Admin detectado, redirecionando para dashboard');
            navigate('/admin/dashboard', { replace: true });
          } else if (selectedWorkshopId) {
            console.log('🎯 ProtectedRoute: Workshop selecionado, redirecionando para inscrição');
            navigate('/inscricao', { replace: true });
          } else {
            console.log('🏠 ProtectedRoute: Redirecionando para:', redirectTo);
            navigate(redirectTo, { replace: true });
          }
        } else {
          // Se não há perfil ainda, redirecionar para home por segurança
          console.log('⚠️ ProtectedRoute: Perfil não carregado, redirecionando para home');
          navigate('/', { replace: true });
        }
        return;
      }
    }

    // Limpar flag de redirecionamento se chegou até aqui sem redirecionar
    setHasRedirected(false);
  }, [user, loading, userProfile, isAdmin, requireAuth, redirectTo, navigate]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-white/70">Carregando...</p>
        </div>
      </div>
    );
  }

  // Para rotas que requerem estar deslogado, só renderizar se não há usuário
  if (!requireAuth && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-white/70">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Para rotas que requerem autenticação, só renderizar se há usuário
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-white/70">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}