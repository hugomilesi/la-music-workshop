import { useState, useEffect, useRef } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const fetchProfile = async () => {
    if (!user?.id || fetchingRef.current) {
      return;
    }
    
    console.log('🔄 useUserProfile: Refetch perfil para usuário:', user.id);
    
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Usuário não encontrado na tabela users
          console.log('❌ useUserProfile: Usuário não encontrado na tabela users (refetch)');
          setProfile(null);
        } else {
          throw error;
        }
      } else {
        console.log('✅ useUserProfile: Perfil encontrado (refetch):', data.nome_completo);
        setProfile(data);
      }
    } catch (err) {
      console.error('❌ useUserProfile: Erro ao buscar perfil do usuário (refetch):', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      console.log('❌ useUserProfile: Nenhum usuário, limpando perfil');
      setProfile(null);
      setLoading(false);
      setError(null);
      lastUserIdRef.current = null;
      return;
    }

    // Evitar buscar o mesmo perfil múltiplas vezes
    if (lastUserIdRef.current === user.id) {
      console.log('⏭️ useUserProfile: Perfil já carregado para este usuário:', user.id);
      return;
    }

    console.log('🔄 useUserProfile: Usuário mudou, buscando perfil:', user.id);
    lastUserIdRef.current = user.id;
    fetchProfile();
  }, [user?.id])

  return { profile, loading, error, refetch: fetchProfile };
}