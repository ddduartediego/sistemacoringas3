'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import PendingUsersList from './components/PendingUsersList';
import LoadingScreen from './components/LoadingScreen';

export default function PendingUsersPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        setLoading(true);
        
        // Verificar a sessão do usuário
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(sessionError.message);
        }
        
        if (!session) {
          throw new Error('Você precisa estar logado para acessar esta página');
        }
        
        // Verificar se o usuário é um administrador
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', session.user.id)
          .single();
          
        if (memberError) {
          throw new Error(memberError.message);
        }
        
        if (member.type !== 'admin') {
          setIsAdmin(false);
          throw new Error('Você não tem permissão para acessar esta página');
        }
        
        setIsAdmin(true);
      } catch (error: unknown) {
        console.error('Erro ao verificar permissões:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar permissões';
        setError(errorMessage);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAdminStatus();
  }, [supabase]);
  
  // Mostra tela de carregamento enquanto verifica permissões
  if (loading) {
    return <LoadingScreen message="Verificando permissões..." />;
  }
  
  // Mostra mensagem de erro se não tiver permissão
  if (!isAdmin || error) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <p className="font-bold">Acesso Negado</p>
          <p>{error || 'Você não tem permissão para acessar esta página'}</p>
        </div>
      </div>
    );
  }
  
  // Mostra a lista de usuários pendentes
  return <PendingUsersList />;
} 