import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para gerenciar o perfil do usuário
 * Agora é apenas um wrapper para o AuthContext
 */
export function useUserProfile() {
  const { user, userProfile, isLoadingProfile, loadUserProfile } = useAuth();
  const lastUserIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Se não há usuário, limpar referências
    if (!user) {
      lastUserIdRef.current = null;
      hasLoadedRef.current = false;
      return;
    }

    // Se é o mesmo usuário e já carregou ou tem perfil, não fazer nada
    if (lastUserIdRef.current === user.id && (userProfile?.user_id === user.id || hasLoadedRef.current)) {
      return;
    }

    // Se já está carregando, aguardar
    if (isLoadingProfile) {
      return;
    }

    // Carregar perfil apenas se necessário e se não foi tentado antes
    if (!userProfile || userProfile.user_id !== user.id) {
      // Verificar se já tentamos carregar este usuário
      if (!hasLoadedRef.current || lastUserIdRef.current !== user.id) {
        lastUserIdRef.current = user.id;
        hasLoadedRef.current = true;
        loadUserProfile(user.id);
      }
    }
  }, [user?.id, userProfile?.user_id, isLoadingProfile]); // Removido loadUserProfile das dependências para evitar loops

  return {
    user,
    userProfile,
    profile: userProfile, // Alias para compatibilidade
    isLoading: isLoadingProfile,
    loading: isLoadingProfile, // Alias para compatibilidade
    refetch: () => {
      if (user) {
        console.log('🔄 useUserProfile: Refetch solicitado para:', user.id);
        hasLoadedRef.current = false;
        loadUserProfile(user.id);
      }
    }
  };
}