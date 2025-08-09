import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/authcontext';
import { useAdminValidation } from '@/hooks/useAdminValidation';
import { Loader2, AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, isAdmin, userProfile } = useAuth();
  const { isValidating, isValidAdmin, validationError } = useAdminValidation();
  const navigate = useNavigate();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    // Se ainda está carregando, aguardar
    if (loading || isValidating) return;

    // Se não há usuário logado, redirecionar para login
    if (!user) {
      navigate('/login');
      return;
    }

    // Se o perfil ainda não foi carregado, aguardar um pouco mais
    if (!userProfile) {
      const timeout = setTimeout(() => {
        if (!userProfile) {
          console.warn('Perfil não carregado, redirecionando para login');
          navigate('/login');
        }
      }, 3000);

      return () => clearTimeout(timeout);
    }

    // Validação dupla: local E backend
    if (!isAdmin || !isValidAdmin) {
      console.warn('Acesso negado - usuário não é admin:', {
        localAdmin: isAdmin,
        backendAdmin: isValidAdmin,
        validationError
      });
      
      setShowAccessDenied(true);
      
      // Redirecionar após mostrar mensagem
      const timeout = setTimeout(() => {
        navigate('/');
      }, 3000);

      return () => clearTimeout(timeout);
    }

    // Se passou em todas as validações, esconder mensagem de acesso negado
    setShowAccessDenied(false);
  }, [user?.id, loading, isAdmin, userProfile?.user_id, isValidating, isValidAdmin]); // Removidas dependências que podem causar loops

  // Mostrar loading enquanto verifica permissões
  if (loading || isValidating || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-white/70">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Mostrar tela de acesso negado
  if (showAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Acesso Negado</h1>
          <p className="text-white/70 mb-4">
            Você não tem permissão para acessar esta área. Apenas administradores podem acessar o painel administrativo.
          </p>
          {validationError && (
            <p className="text-red-400 text-sm mb-4">
              Erro: {validationError}
            </p>
          )}
          <p className="text-white/50 text-sm">
            Redirecionando em alguns segundos...
          </p>
        </div>
      </div>
    );
  }

  // Validação dupla: só renderizar se for admin tanto local quanto no backend
  if (!isAdmin || !isValidAdmin) {
    return null;
  }

  // Se chegou até aqui, é admin e pode acessar
  return <>{children}</>;
}