import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const ConfirmEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Token de confirmação não encontrado.');
        return;
      }

      try {
        // Confirmando email com token
        
        // Usar a função personalizada para confirmar email
        const { data, error } = await supabase
          .rpc('confirm_email_with_token', {
            confirmation_token: token
          });

        if (error) {
          // Erro ao confirmar email
          setStatus('error');
          setMessage('Erro ao confirmar email. Tente novamente.');
          return;
        }

        if (data && data.success) {
          // Email confirmado com sucesso
          setStatus('success');
          
          // Verificar se é uma confirmação nova ou já confirmada anteriormente
          if (data.message && data.message.includes('já confirmado')) {
            setMessage('Este email já foi confirmado anteriormente. Você pode fazer login normalmente.');
          } else {
            setMessage('Email confirmado com sucesso!');
          }
          
          setUserEmail(data.email);
          
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Email confirmado! Você já pode fazer login.',
                type: 'success'
              }
            });
          }, 3000);
        } else {
          // Falha na confirmação
          setStatus('error');
          
          // Mensagens de erro mais específicas
          let errorMessage = 'Erro desconhecido na confirmação.';
          if (data?.error) {
            if (data.error.includes('expirado')) {
              errorMessage = 'Token expirado. Solicite um novo email de confirmação.';
            } else if (data.error.includes('não encontrado')) {
              errorMessage = 'Token não encontrado. Verifique se o link está correto.';
            } else {
              errorMessage = data.error;
            }
          }
          
          setMessage(errorMessage);
        }
      } catch (error) {
        // Erro durante confirmação
        setStatus('error');
        setMessage('Erro interno. Tente novamente.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center">
          {/* Ícone de status */}
          <div className="flex justify-center mb-6">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-400" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-400" />
            )}
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white mb-4">
            {status === 'loading' && 'Confirmando Email...'}
            {status === 'success' && 'Email Confirmado!'}
            {status === 'error' && 'Erro na Confirmação'}
          </h1>

          {/* Mensagem */}
          <p className="text-gray-300 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Email confirmado */}
          {status === 'success' && userEmail && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
              <p className="text-green-300 text-sm">
                <strong>Email confirmado:</strong> {userEmail}
              </p>
            </div>
          )}

          {/* Redirecionamento automático */}
          {status === 'success' && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-300 text-sm">
                Você será redirecionado para a página de login em alguns segundos...
              </p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="space-y-3">
            {status === 'success' && (
              <button
                onClick={handleBackToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Ir para Login
              </button>
            )}
            
            {status === 'error' && (
              <>
                <button
                  onClick={handleBackToLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Tentar Login
                </button>
                <button
                  onClick={handleBackToHome}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Voltar ao Início
                </button>
              </>
            )}
          </div>

          {/* Informações adicionais */}
          {status === 'error' && (
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Se você continuar tendo problemas, entre em contato conosco.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;