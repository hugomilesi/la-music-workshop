import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      console.log('🔄 AuthCallback: Iniciando processo de confirmação de email');
      console.log('🔍 URL atual:', window.location.href);
      console.log('🔍 Search params:', window.location.search);
      console.log('🔍 Hash params:', window.location.hash);
      
      // Extrair todos os parâmetros possíveis
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      console.log('📋 Parâmetros da URL:');
      for (const [key, value] of urlParams.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      console.log('📋 Parâmetros do Hash:');
      for (const [key, value] of hashParams.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      // Verificar parâmetros específicos de confirmação
      const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');
      const type = urlParams.get('type') || hashParams.get('type');
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      const code = urlParams.get('code') || hashParams.get('code');
      const error = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
      
      console.log('🔍 Parâmetros extraídos:');
      console.log('  token_hash:', tokenHash);
      console.log('  type:', type);
      console.log('  access_token:', accessToken ? 'presente' : 'ausente');
      console.log('  refresh_token:', refreshToken ? 'presente' : 'ausente');
      console.log('  code:', code);
      console.log('  error:', error);
      console.log('  error_description:', errorDescription);
      
      if (error) {
        console.error('❌ Erro nos parâmetros da URL:', error, errorDescription);
        setError(`Erro na confirmação: ${errorDescription || error}`);
        setTimeout(() => {
          navigate('/register');
        }, 3000);
        setLoading(false);
        return;
      }
      
      try {
        // Aguardar 3 segundos para o Supabase processar automaticamente a sessão
        console.log('⏳ Aguardando processamento automático da sessão...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verificar se temos uma sessão válida
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Erro ao obter sessão:', sessionError);
          setError('Erro ao processar confirmação de email');
          setTimeout(() => {
            navigate('/register');
          }, 2000);
          return;
        }
        
        if (session?.user) {
          console.log('✅ Sessão encontrada:', session.user.id);
          console.log('✅ Email confirmado em:', session.user.email_confirmed_at);
          
          // Atualizar status de confirmação na tabela users
          const { error: updateError } = await supabase
            .from('users')
            .update({ email_confirmed: true })
            .eq('user_id', session.user.id);
          
          if (updateError) {
            console.error('❌ Erro ao atualizar status de confirmação:', updateError);
          } else {
            console.log('✅ Status de confirmação atualizado com sucesso');
          }
          
          setSuccess(true);
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          console.log('❌ Nenhuma sessão encontrada após aguardar');
          setError('Falha na confirmação do email');
          setTimeout(() => {
            navigate('/register');
          }, 2000);
        }
        
      } catch (error) {
        console.error('❌ Erro durante confirmação:', error);
        setError('Erro inesperado durante a confirmação');
        setTimeout(() => {
          navigate('/register');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };
    
    handleEmailConfirmation();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md text-center">
        {loading && (
          <>
            <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Confirmando seu email...
            </h1>
            <p className="text-white/80">
              Aguarde enquanto processamos sua confirmação.
            </p>
          </>
        )}
        
        {!loading && success && (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Email confirmado!
            </h1>
            <p className="text-white/80 mb-4">
              Sua conta foi ativada com sucesso. Você será redirecionado em instantes.
            </p>
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-300 text-sm">
                ✅ Agora você pode fazer login normalmente
              </p>
            </div>
          </>
        )}
        
        {!loading && error && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Erro na confirmação
            </h1>
            <p className="text-white/80 mb-4">
              {error}
            </p>
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-300 text-sm">
                Você será redirecionado para tentar novamente.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}