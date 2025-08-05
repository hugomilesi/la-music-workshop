import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useAdminValidation() {
  const { user } = useAuth();
  const [isValidating, setIsValidating] = useState(false);
  const [isValidAdmin, setIsValidAdmin] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateAdmin = async () => {
    if (!user) {
      setIsValidAdmin(false);
      setValidationError('Usuário não autenticado');
      return false;
    }

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
        console.error('Erro ao verificar tipo de usuário:', error);
        setIsValidAdmin(false);
        setValidationError('Erro ao verificar permissões');
        return false;
      }

      if (userData?.user_type === 'admin') {
        setIsValidAdmin(true);
        setValidationError(null);
        return true;
      } else {
        setIsValidAdmin(false);
        setValidationError('Usuário não é administrador');
        return false;
      }
    } catch (error: any) {
      console.error('Erro inesperado na validação:', error);
      setIsValidAdmin(false);
      setValidationError('Erro inesperado na validação');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (user) {
      validateAdmin();
    } else {
      setIsValidAdmin(false);
      setValidationError(null);
    }
  }, [user]);

  return {
    isValidating,
    isValidAdmin,
    validationError,
    validateAdmin,
  };
}