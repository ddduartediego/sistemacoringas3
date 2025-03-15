'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheck, FaTimes, FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import PendingUsersList from './components/PendingUsersList';
import LoadingScreen from './components/LoadingScreen';

// Interface para usuários pendentes
interface PendingUser {
  id: string;
  user_id: string;
  nickname?: string;
  email?: string;
  created_at: string;
  updated_at?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

export default function PendingUsersClient() {
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        setLoading(true);
        // Usar novo cliente do Supabase
        const supabase = createClient();
        
        // Primeiro verifica se o usuário é admin
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        // Verificar se o usuário é admin
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', session.user.id)
          .single();
        
        if (memberError || !memberData || memberData.type.toLowerCase() !== 'admin') {
          router.push('/dashboard');
          return;
        }
        
        // Buscar usuários pendentes
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('type', 'pendente')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setPendingUsers(data || []);
      } catch (err) {
        console.error('Erro ao buscar usuários pendentes:', err);
        setError('Ocorreu um erro ao carregar os dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, [router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return <PendingUsersList users={pendingUsers} onStatusChange={() => window.location.reload()} />;
} 