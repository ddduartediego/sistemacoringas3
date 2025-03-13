'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaCheck, FaTimes, FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import LoadingScreen from './LoadingScreen';

// Interface para usuários pendentes
interface PendingUser {
  id: string;
  user_id: string;
  nickname?: string;
  email?: string;
  created_at: string;
  updated_at?: string;
  type?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

// Interface para erros
interface ApiError {
  message: string;
  status?: number;
}

export default function PendingUsersList() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});
  
  const supabase = createClientComponentClient();
  
  // Carregar usuários pendentes diretamente do Supabase
  useEffect(() => {
    async function loadPendingUsers() {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar o caso do status 'pending'
        const { data: allTypes, error: typesError } = await supabase
          .from('members')
          .select('type')
          .order('type');
        
        if (typesError) {
          throw new Error(`Erro ao buscar tipos: ${typesError.message}`);
        }
        
        // Buscar usuários pendentes com status "inativo" (e variações)
        const { data: pendingMembers, error: membersError } = await supabase
          .from('members')
          .select('*')
          .or(`type.eq.inativo,type.eq.Inativo,type.eq.INATIVO`)
          .order('created_at', { ascending: false });
          
        if (membersError) {
          throw new Error(`Erro ao buscar membros: ${membersError.message}`);
        }
        
        // Preparar array de usuários pendentes com seus perfis
        const usersWithProfiles: PendingUser[] = [];
        
        // Para cada membro pendente, buscar informações do usuário
        if (pendingMembers && pendingMembers.length > 0) {
          for (const member of pendingMembers) {
            // Buscar dados do perfil do usuário
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('email, full_name, name, avatar_url')
              .eq('id', member.user_id)
              .single();
              
            if (profileError) {
              console.error(`Erro ao buscar perfil para ${member.user_id}:`, profileError);
            }
            
            usersWithProfiles.push({
              id: member.id,
              user_id: member.user_id,
              nickname: member.nickname,
              type: member.type,
              email: profile?.email,
              created_at: member.created_at,
              updated_at: member.updated_at,
              user_metadata: {
                full_name: profile?.full_name,
                name: profile?.name,
                avatar_url: profile?.avatar_url
              }
            });
          }
        }
        
        setPendingUsers(usersWithProfiles);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar usuários pendentes';
        console.error('Erro ao carregar usuários pendentes:', error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    loadPendingUsers();
  }, [supabase]);
  
  // Aprovar usuário
  const approveUser = async (memberId: string) => {
    try {
      setProcessingUser(memberId);
      setError(null);
      
      // Verificar os tipos existentes para determinar o padrão usado no sistema
      const { data: memberTypes, error: typesError } = await supabase
        .from('members')
        .select('type')
        .or('type.eq.member,type.eq.Member,type.eq.membro,type.eq.Membro')
        .limit(5);
      
      if (typesError) {
        console.error('Erro ao verificar tipos existentes:', typesError);
      }
      
      // Determinar o tipo correto para aprovação
      // Prioridade: usar o que já existe no sistema
      let memberType = 'member'; // valor padrão
      
      if (memberTypes && memberTypes.length > 0) {
        // Encontrar qual tipo é usado no sistema
        const typeMap: Record<string, number> = {};
        memberTypes.forEach(t => {
          const type = t.type.toLowerCase();
          typeMap[type] = (typeMap[type] || 0) + 1;
        });
        
        // Verificar se "membro" é mais usado que "member"
        if ((typeMap['membro'] || 0) > (typeMap['member'] || 0)) {
          memberType = memberTypes.find(t => t.type.toLowerCase() === 'membro')?.type || 'membro';
        } else {
          memberType = memberTypes.find(t => t.type.toLowerCase() === 'member')?.type || 'member';
        }
      }
      
      console.log(`Aprovando usuário como: ${memberType}`);
      
      // Atualizar diretamente no Supabase
      const { error } = await supabase
        .from('members')
        .update({ type: memberType })
        .eq('id', memberId);

      if (error) {
        throw new Error(error.message || 'Erro ao aprovar usuário');
      }

      // Remove o usuário da lista
      setPendingUsers(pendingUsers.filter(user => user.id !== memberId));
      
      // Exibe mensagem de sucesso
      setSuccessMessage('Usuário aprovado com sucesso!');
      toast.success('Usuário aprovado com sucesso!');
      
      // Limpa a mensagem após alguns segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: unknown) {
      console.error('Erro ao aprovar usuário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao aprovar o usuário';
      setError(errorMessage);
      toast.error(`Erro ao aprovar usuário: ${errorMessage}`);
    } finally {
      setProcessingUser(null);
    }
  };

  // Rejeitar usuário
  const rejectUser = async (memberId: string) => {
    try {
      setProcessingUser(memberId);
      setError(null);
      
      // Confirmação de rejeição
      if (!confirm('Tem certeza que deseja rejeitar este usuário? Esta ação não pode ser desfeita.')) {
        setProcessingUser(null);
        return;
      }
      
      // Excluir diretamente no Supabase
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) {
        throw new Error(error.message || 'Erro ao rejeitar usuário');
      }

      // Remove o usuário da lista
      setPendingUsers(pendingUsers.filter(user => user.id !== memberId));
      
      // Exibe mensagem de sucesso
      setSuccessMessage('Usuário rejeitado com sucesso!');
      toast.success('Usuário rejeitado com sucesso!');
      
      // Limpa a mensagem após alguns segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: unknown) {
      console.error('Erro ao rejeitar usuário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao rejeitar o usuário';
      setError(errorMessage);
      toast.error(`Erro ao rejeitar usuário: ${errorMessage}`);
    } finally {
      setProcessingUser(null);
    }
  };

  // Formata a data para exibição amigável
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return 'Data inválida';
    }
  };

  // Exibe nome ou email caso não haja nome disponível
  const getUserDisplayName = (user: PendingUser): string => {
    // Tenta obter o nome das várias fontes possíveis em ordem de prioridade
    const fullName = user.user_metadata?.full_name;
    const name = user.user_metadata?.name;
    const nickname = user.nickname;
    
    // Retorna o primeiro valor não vazio
    return fullName || name || nickname || user.email || 'Usuário sem nome';
  };

  // Renderiza o avatar do usuário
  const renderUserAvatar = (user: PendingUser) => {
    const avatarUrl = user.user_metadata?.avatar_url;
    const hasError = avatarErrors[user.id] === true;
    
    // Manipulador de erro de imagem
    const handleImageError = () => {
      setAvatarErrors(prev => ({
        ...prev,
        [user.id]: true
      }));
    };
    
    // Se temos uma URL de avatar e não houve erro de carregamento
    if (avatarUrl && !hasError) {
      return (
        <div className="relative w-10 h-10 rounded-full overflow-hidden">
          <img 
            src={avatarUrl} 
            alt={getUserDisplayName(user)}
            className="w-10 h-10 object-cover rounded-full"
            onError={handleImageError}
          />
        </div>
      );
    } 
    
    // Fallback: mostrar ícone genérico
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-600">
        <FaUserCircle size={24} />
      </div>
    );
  };

  // Mostra tela de carregamento
  if (loading) {
    return <LoadingScreen message="Carregando usuários pendentes..." />;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Usuários Pendentes de Aprovação</h1>
      
      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Lista de usuários pendentes */}
      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-lg text-gray-600">
            Não há usuários pendentes de aprovação no momento.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email / ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {renderUserAvatar(user)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getUserDisplayName(user)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.nickname || 'Sem apelido'} 
                            {user.type && <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full">{user.type}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">ID: {user.user_id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 items-center">
                        <button
                          className={`px-3 py-1 rounded-md bg-green-600 text-white flex items-center ${
                            processingUser === user.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                          }`}
                          onClick={() => approveUser(user.id)}
                          disabled={processingUser === user.id}
                        >
                          <FaCheck className="mr-1" />
                          <span>Aprovar</span>
                        </button>
                        <button
                          className={`px-3 py-1 rounded-md bg-red-600 text-white flex items-center ${
                            processingUser === user.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                          }`}
                          onClick={() => rejectUser(user.id)}
                          disabled={processingUser === user.id}
                        >
                          <FaTimes className="mr-1" />
                          <span>Rejeitar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 