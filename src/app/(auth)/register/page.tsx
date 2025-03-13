'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaGoogle, FaUserPlus, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function Register() {
  const { signInWithGoogle, isLoading, error } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleRegister = async () => {
    try {
      setLocalError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Erro ao registrar com Google:', err);
      setLocalError(err.message || 'Erro ao registrar com Google. Tente novamente.');
    }
  };
  
  // Mostrar erro do contexto de autenticação ou erro local
  const displayError = error || localError;

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
            className="md:w-1/2 bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white flex flex-col justify-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6">
                <FaUserPlus className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Junte-se à Equipe</h2>
              <p className="mb-6 text-indigo-100">
                Registre-se para acessar o Sistema Coringas e participar da gestão da equipe.
              </p>
              <div className="bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-20">
                <h3 className="font-medium mb-2 flex items-center">
                  <FaInfoCircle className="mr-2" /> Processo de Aprovação
                </h3>
                <p className="text-sm">
                  Após o registro, um administrador precisará aprovar seu acesso. 
                  Você será notificado por e-mail quando sua conta for aprovada.
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Lado direito - Formulário de registro */}
          <motion.div 
            className="md:w-1/2 p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="h-full flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta</h2>
              <p className="text-gray-600 mb-6">
                Registre-se com sua conta Google para começar
              </p>
              
              {displayError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
                  <div className="flex items-start">
                    <FaInfoCircle className="mt-1 mr-2" />
                    <span>{displayError}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleGoogleRegister}
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors mb-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 w-0 bg-blue-50 transition-all duration-300 group-hover:w-full"></div>
                <FaGoogle className="mr-3 text-red-500 relative z-10" />
                <span className="font-medium text-gray-700 relative z-10">
                  {isLoading ? 'Processando...' : 'Registrar com Google'}
                </span>
              </button>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Já tem uma conta?{' '}
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Faça login
                  </Link>
                </p>
                
                <p className="text-xs text-gray-500">
                  Ao se registrar, você concorda com os{' '}
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