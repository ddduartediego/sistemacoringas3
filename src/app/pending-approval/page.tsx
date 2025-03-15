'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaCheckCircle, FaUserClock, FaSignOutAlt } from 'react-icons/fa';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function PendingApproval() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMemberStatus = async () => {
      if (isLoading || !user) return;

      try {
        setIsChecking(true);
        const supabase = createClient();
        
        // Verificar o status do membro
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', user.id)
          .single();
          
        if (memberError) {
          console.error('Erro ao verificar status do membro:', memberError);
          setError('Não foi possível verificar seu status. Tente novamente mais tarde.');
          return;
        }
        
        // Verificar se o membro já foi aprovado
        if (memberData?.type === 'admin' || memberData?.type === 'member') {
          console.log('Usuário já aprovado, redirecionando...');
          // Redirecionar para a página apropriada
          const redirectTo = memberData.type === 'admin' ? '/dashboard' : '/profile';
          router.push(redirectTo);
          return;
        }
        
        // Se o tipo é 'pendente', mostrar a mensagem de espera
        setStatus(memberData?.type || 'pendente');
      } catch (err: any) {
        console.error('Erro ao verificar status:', err);
        setError('Ocorreu um erro ao verificar seu status: ' + (err.message || 'Erro desconhecido'));
      } finally {
        setIsChecking(false);
      }
    };

    checkMemberStatus();
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Obter o nome ou email do usuário
  const userName = user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.email?.split('@')[0] || 
                   'Usuário';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUserClock className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Aguardando Aprovação</h1>
            <p className="text-gray-600 mt-2">Olá, {userName}!</p>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-700 mb-6">
            <p>Seu cadastro foi recebido com sucesso e está aguardando aprovação de um administrador.</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <FaCheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Cadastro Recebido</h3>
                <p className="text-sm text-gray-500">Seu registro foi recebido e está em análise.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Aprovação Pendente</h3>
                <p className="text-sm text-gray-500">Um administrador verificará seus dados e aprovará seu acesso.</p>
              </div>
            </div>
            
            <div className="flex items-start opacity-50">
              <div className="flex-shrink-0 mt-1">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Acesso Liberado</h3>
                <p className="text-sm text-gray-500">Após a aprovação, você terá acesso a todas as funcionalidades.</p>
              </div>
            </div>
          </div>
          
          <div className="text-center text-gray-600 mb-6">
            <p>Você receberá uma notificação quando seu acesso for aprovado.</p>
            <p className="text-sm mt-2">Caso tenha dúvidas, entre em contato com a coordenação da equipe.</p>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
          >
            <FaSignOutAlt className="mr-2" /> Sair
          </button>
        </div>
      </div>
    </div>
  );
} 