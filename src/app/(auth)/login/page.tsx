'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { FaGoogle, FaLock, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

// Componente de carregamento para o Suspense
function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}

// Componente principal de login
function LoginContent() {
  const { signInWithGoogle, isLoading: authLoading, error: authError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Verificar se há um erro de URL
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  // Atualizar erro quando o erro de autenticação mudar
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Erro ao fazer login com Google:', err);
      setError('Ocorreu um erro durante o login. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Considerar o loading tanto do estado local quanto do contexto de autenticação
  const loading = isLoading || authLoading;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* Logo do sistema */}
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">SC</div>
            <h1 className="text-xl font-bold text-gray-800">Sistema Coringas</h1>
          </div>
          <Link
            href="/"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FaArrowLeft className="mr-2" /> Voltar
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Lado esquerdo - Visual decorativo */}
          <motion.div 
            className="md:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white flex flex-col justify-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6">
                <FaLock className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Bem-vindo de volta!</h2>
              <div className="bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-20">
                <h3 className="font-medium mb-2 flex items-center">
                  <FaInfoCircle className="mr-2" /> Lembrete
                </h3>
                <p className="text-sm">
                  O acesso é exclusivo para membros registrados e aprovados da equipe Coringas.
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Lado direito - Formulário de login */}
          <motion.div 
            className="md:w-1/2 p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="h-full flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login</h2>
              <p className="text-gray-600 mb-6">
                Entre com sua conta para acessar o sistema
              </p>
              
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
                  <div className="flex items-start">
                    <FaInfoCircle className="mt-1 mr-2" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors mb-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 w-0 bg-blue-50 transition-all duration-300 group-hover:w-full"></div>
                <FaGoogle className="mr-3 text-red-500 relative z-10" />
                <span className="font-medium text-gray-700 relative z-10">
                  {loading ? 'Carregando...' : 'Entrar com Google'}
                </span>
              </button>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Não tem uma conta?{' '}
                  <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                    Registre-se
                  </Link>
                </p>
                
                <p className="text-xs text-gray-500">
                  Ao continuar, você concorda com os{' '}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    Termos de Serviço
                  </Link>{' '}
                  e{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Política de Privacidade
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Rodapé */}
      <footer className="bg-white shadow-inner py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Sistema Coringas. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

// Componente principal envolto em Suspense
export default function Login() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
} 