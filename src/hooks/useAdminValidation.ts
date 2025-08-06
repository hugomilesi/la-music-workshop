import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useAdminValidation() {
  const { user, userProfile } = useAuth();
  const [isValidating, setIsValidating] = useState(false);
  const [isValidAdmin, setIsValidAdmin] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const validatingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const validateAdmin = async () => {
    if (!user) {
      setIsValidAdmin(false);
      setValidationError(null);
      return false;
    }

    // Evitar múltiplas validações simultâneas
    if (validatingRef.current || lastUserIdRef.current === user.id) {
      return isValidAdmin;
    }

    // Se já temos o perfil do usuário no contexto, usar ele
    if (userProfile) {
      const isAdmin = userProfile.user_type === 'admin';
      setIsValidAdmin(isAdmin);
      setValidationError(isAdmin ? null : 'Usuário não é administrador');
      lastUserIdRef.current = user.id;
      return isAdmin;
    }

    validatingRef.current = true;
    setIsValidating(true);
    setValidationError(null);

    try {
      // Verificar diretamente na tabela users se o usuário é admin
      const { data: userData, error } = await supabase
        .from('users')
        .select('user_type')
        .eq('user_id', user.id)
        .single();

      if (error) {
        setIsValidAdmin(false);
        setValidationError('Erro ao verificar permissões');
        return false;
      }

      const isAdmin = userData?.user_type === 'admin';
      setIsValidAdmin(isAdmin);
      setValidationError(isAdmin ? null : 'Usuário não é administrador');
      lastUserIdRef.current = user.id;
      return isAdmin;
    } catch (error: any) {
      setIsValidAdmin(false);
      setValidationError('Erro inesperado na validação');
      return false;
    } finally {
      setIsValidating(false);
      validatingRef.current = false;
    }
  };

  useEffect(() => {
    // Só validar se o usuário mudou ou se não temos validação ainda
    if (user && lastUserIdRef.current !== user.id) {
      validateAdmin();
    } else if (!user) {
      setIsValidAdmin(false);
      setValidationError(null);
      lastUserIdRef.current = null;
    }
  }, [user?.id, userProfile]);

  return {
    isValidating,
    isValidAdmin,
    validationError,
    validateAdmin,
  };
}