import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  nome_completo: string;
  telefone: string;
  data_nascimento: string;
  unit_id: string;
  user_type: string;
  email_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar por user_id (que corresponde ao auth.uid())
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        // Não definir como erro se for problema de permissão ou política RLS
        if (error.code === '42501' || error.code === '42P17') {
          console.warn('Problema de permissão/política RLS, ignorando...');
          setError(null);
        } else {
          setError(error.message);
        }
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err: any) {
      console.error('Erro inesperado ao buscar perfil:', err);
      // Não tratar como erro crítico se for problema de rede
      if (err.message?.includes('Failed to fetch')) {
        console.warn('Problema de rede ao buscar perfil, ignorando...');
        setError(null);
      } else {
        setError('Erro inesperado ao carregar perfil');
      }
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return { profile, loading, error, refetch: fetchProfile };
}