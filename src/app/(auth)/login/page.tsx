'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

// Componente interno que usa useSearchParams
function LoginContent() {
  const { signInWithGoogle, isLoading, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success' | null>(null);

  useEffect(() => {
    // Verificar parâmetros de URL
    const errorMsg = searchParams.get('error');
    const successMsg = searchParams.get('success');
    const authError = searchParams.get('auth');

    if (errorMsg) {
      setMessage(decodeURIComponent(errorMsg));
      setMessageType('error');
    } else if (successMsg) {
      setMessage(decodeURIComponent(successMsg));
      setMessageType('success');
    } else if (authError) {
      setMessage('Você precisa estar autenticado para acessar esta página.');
      setMessageType('error');
    }
  }, [searchParams]);

  const handleClearAuth = async () => {
    try {
      // Limpar cookies manualmente
      document.cookie = 'supabase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Recarregar a página para limpar o estado
      window.location.href = '/login?success=Dados+de+autenticação+limpos';
    } catch (err) {
      console.error('Erro ao limpar autenticação:', err);
      setMessage('Erro ao limpar dados de autenticação');
      setMessageType('error');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-lg shadow-xl p-6">
        <div className="space-y-1 flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-blue-500 flex items-center justify-center bg-gray-900">
            <Image
              src="/coringas_logo.jpeg"
              alt="Coringas Logo"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <h2 className="text-2xl text-center text-white">Bem-vindo ao Sistema Coringas</h2>
          <p className="text-center text-gray-400">
            Faça login com sua conta Google para continuar
          </p>
        </div>
        <div className="space-y-4">
          {message && messageType && (
            <div className={`p-4 rounded-md ${
              messageType === 'error' 
                ? 'bg-red-900 border border-red-800 text-red-100' 
                : 'bg-green-900 border border-green-800 text-green-100'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {messageType === 'error' ? (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">{messageType === 'error' ? 'Erro' : 'Sucesso'}</h3>
                  <div className="mt-1 text-sm">{message}</div>
                </div>
              </div>
            </div>
          )}
          
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={signInWithGoogle}
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : 'Entrar com Google'}
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <p className="text-xs text-gray-500 text-center">
            Ao fazer login, você concorda com os termos de serviço e política de privacidade.
          </p>
          <button 
            onClick={handleClearAuth} 
            className="text-xs mt-2 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 py-1 px-3 rounded-md"
          >
            Limpar dados de autenticação
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente principal com Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">Carregando...</div>}>
      <LoginContent />
    </Suspense>
  );
} 