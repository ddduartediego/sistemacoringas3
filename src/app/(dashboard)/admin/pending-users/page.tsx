'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FaUserClock } from 'react-icons/fa';
import PendingUsersList from './components/PendingUsersList';
import LoadingScreen from './components/LoadingScreen';

// Adicionar uma interface para o tipo de usuário pendente
interface PendingUser {
  id: string;
  user_id: string;
  email?: string;
  nickname?: string;
  type: string;
  created_at: string;
  [key: string]: any; // Para outras propriedades que podem existir
}

export default function PendingUsersPage() {
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('type', 'pendente')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erro ao buscar usuários pendentes:', error);
          setError('Falha ao carregar usuários pendentes. Tente novamente mais tarde.');
          return;
        }
        
        setPendingUsers(data || []);
      } catch (err) {
        console.error('Erro inesperado ao buscar usuários pendentes:', err);
        setError('Ocorreu um erro ao buscar os dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, []);

  // Mostra tela de carregamento enquanto verifica permissões
  if (loading) {
    return <LoadingScreen message="Verificando permissões..." />;
  }
  
  // Mostra mensagem de erro se não tiver permissão
  if (!pendingUsers || error) {
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
  return (
    <PendingUsersList 
      users={pendingUsers} 
      onStatusChange={() => window.location.reload()} 
    />
  );
} 