'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// MemberChecker verifica se o usuário tem permissão para acessar a página atual
export default function MemberChecker() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMemberStatus = async () => {
      try {
        if (isLoading) return; // Se ainda está carregando o status de auth, esperar
        
        if (!user) {
          console.log('MemberChecker: Usuário não autenticado, redirecionando para login');
          router.push('/login');
          return;
        }
        
        // Usar novo cliente do Supabase
        const supabase = createClient();
        
        // Verificar o tipo do membro no banco de dados
        const { data, error } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('MemberChecker: Erro ao verificar membro:', error);
          // Em caso de erro, redirecionar para pending-approval
          router.push('/pending-approval');
          return;
        }
        
        // Verificar o tipo do membro
        const memberType = data?.type?.toLowerCase() || '';
        
        // Se o membro não estiver aprovado, redirecionar para pending-approval
        if (memberType !== 'admin' && memberType !== 'member') {
          console.log('MemberChecker: Usuário não aprovado, redirecionando');
          router.push('/pending-approval');
        }
      } catch (error) {
        console.error('MemberChecker: Erro ao verificar status:', error);
        // Em caso de erro, redirecionar para pending-approval por segurança
        router.push('/pending-approval');
      } finally {
        setLoading(false);
      }
    };

    checkMemberStatus();
  }, [user, isLoading, router]);

  // O componente não renderiza nada, apenas faz a verificação
  return null;
} 