import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/authcontext';
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
    if (validatingRef.current) {
      return isValidAdmin;
    }
    
    // Se já validamos este usuário e temos resultado, retornar
    if (lastUserIdRef.current === user.id && (isValidAdmin || validationError)) {
      return isValidAdmin;
    }

    // OTIMIZAÇÃO: Usar sempre o contexto de autenticação quando disponível
    if (userProfile) {
      const isAdmin = userProfile.user_type === 'admin';
      setIsValidAdmin(isAdmin);
      setValidationError(isAdmin ? null : 'Usuário não é administrador');
      lastUserIdRef.current = user.id;
      return isAdmin;
    }

    // OTIMIZAÇÃO: Usar isAdmin do contexto se disponível (evita consulta desnecessária)
    // Removido para evitar referência a variável não definida

    validatingRef.current = true;
    setIsValidating(true);
    setValidationError(null);

    try {
      // Consulta otimizada - apenas user_type necessário
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

      const isAdminResult = userData?.user_type === 'admin';
      setIsValidAdmin(isAdminResult);
      setValidationError(isAdminResult ? null : 'Usuário não é administrador');
      lastUserIdRef.current = user.id;
      return isAdminResult;
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
  }, [user?.id]); // Removido userProfile das dependências para evitar loops

  return {
    isValidating,
    isValidAdmin,
    validationError,
    validateAdmin,
  };
}