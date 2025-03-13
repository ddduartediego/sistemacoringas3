'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaCheck, FaTimes, FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FaArrowLeft, FaExclamationCircle } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Função auxiliar para verificar o tipo ignorando case
function equalsIgnoreCase(str1: string, str2: string): boolean {
  return str1?.toLowerCase() === str2?.toLowerCase();
}

// Interface para representar os dados do usuário pendente
interface PendingUser {
  id: string;
  email: string;
  created_at: string;
  member_id: string;
  nickname: string;
  member_created_at: string;
  user_metadata: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

const PendingUsers = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Busca usuários pendentes
  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Iniciando busca de usuários pendentes');
      
      const response = await fetch('/api/pending-users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Resposta da API com erro:', errorData);
        throw new Error(errorData.error || 'Erro ao buscar usuários pendentes');
      }

      const data = await response.json();
      console.log('Usuários pendentes recebidos:', data.users);
      setPendingUsers(data.users || []);
    } catch (error: any) {
      console.error('Erro ao buscar usuários pendentes:', error);
      setError(error.message || 'Ocorreu um erro ao buscar usuários pendentes');
    } finally {
      console.log('Finalizando busca de usuários pendentes, atualizando loading para false');
      setLoading(false);
    }
  };

  // Aprova um usuário pendente
  const approveUser = async (userId: string, memberId: string) => {
    try {
      setProcessingUser(userId);
      setError(null);
      
      const response = await fetch('/api/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, member_id: memberId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao aprovar usuário');
      }

      // Remove o usuário da lista
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      
      // Exibe mensagem de sucesso
      setSuccessMessage('Usuário aprovado com sucesso!');
      toast.success('Usuário aprovado com sucesso!');
      
      // Limpa a mensagem após alguns segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao aprovar usuário:', error);
      setError(error.message || 'Ocorreu um erro ao aprovar o usuário');
      toast.error(`Erro ao aprovar usuário: ${error.message}`);
    } finally {
      setProcessingUser(null);
    }
  };

  // Rejeita um usuário pendente
  const rejectUser = async (userId: string, memberId: string) => {
    try {
      setProcessingUser(userId);
      setError(null);
      
      // Confirmação de rejeição
      if (!confirm('Tem certeza que deseja rejeitar este usuário? Esta ação não pode ser desfeita.')) {
        setProcessingUser(null);
        return;
      }
      
      const response = await fetch('/api/reject-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, member_id: memberId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao rejeitar usuário');
      }

      // Remove o usuário da lista
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      
      // Exibe mensagem de sucesso
      setSuccessMessage('Usuário rejeitado com sucesso!');
      toast.success('Usuário rejeitado com sucesso!');
      
      // Limpa a mensagem após alguns segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao rejeitar usuário:', error);
      setError(error.message || 'Ocorreu um erro ao rejeitar o usuário');
      toast.error(`Erro ao rejeitar usuário: ${error.message}`);
    } finally {
      setProcessingUser(null);
    }
  };

  // Verifica se o usuário é administrador
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        console.log("Verificando permissões do usuário:", user);
        
        // Se não tivermos o usuário ainda, não fazemos nada
        // Mas definimos um temporizador para garantir que não fique travado infinitamente
        if (!user) {
          console.log("Usuário não autenticado ou ainda não carregado");
          
          // Após 5 segundos, se ainda estiver carregando, atualizamos o estado
          const timeout = setTimeout(() => {
            if (loading) {
              console.log("Tempo limite excedido para carregamento do usuário");
              setLoading(false);
              setError("Não foi possível verificar suas permissões. Por favor, tente novamente.");
            }
          }, 5000);
          
          return () => clearTimeout(timeout);
        }
        
        console.log("Verificando se usuário é admin. ID:", user.id);
        
        // Verificar o tipo de membro usando Supabase diretamente
        const supabase = createClientComponentClient();
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', user.id)
          .single();
        
        if (memberError) {
          console.error("Erro ao buscar dados do membro:", memberError);
          setError('Erro ao verificar permissões. Por favor, tente novamente.');
          setLoading(false);
          return;
        }
        
        console.log("Dados do membro encontrados:", memberData);
        
        // Verificar se é admin usando o dado recém obtido do banco
        if (memberData && equalsIgnoreCase(memberData.type, 'admin')) {
          console.log("Usuário confirmado como administrador");
          setIsAdmin(true);
          await fetchPendingUsers();
        } else {
          console.log("Usuário não é administrador:", memberData?.type);
          setIsAdmin(false);
          setLoading(false);
          setError("Você não tem permissões de administrador para acessar esta página.");
        }
      } catch (error) {
        console.error("Erro inesperado na verificação de admin:", error);
        setError('Ocorreu um erro ao verificar suas permissões');
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  // Função para recarregar a página
  const reloadPage = () => {
    window.location.reload();
  };

  // Se ocorrer um erro durante o carregamento, exibe mensagem e botão para recarregar
  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="rounded-lg bg-red-100 p-6 max-w-lg w-full text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-4">Erro</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={reloadPage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
            >
              Recarregar Página
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
    } catch (e) {
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

  // Estado para controlar erros de carregamento de imagens
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});

  // Renderiza o avatar do usuário com imagem HTML nativa em vez de Next Image
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-medium">Carregando usuários pendentes...</p>
      </div>
    );
  }

  // Mostra tela de erro se o usuário não tiver permissão
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="rounded-lg bg-red-100 p-4 max-w-2xl w-full">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Acesso restrito</h2>
          <p className="text-red-700">
            Você não tem permissão para acessar esta página. Esta área é reservada para administradores do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Aprovação de Novos Usuários</h1>
      
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
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at || user.member_created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 items-center">
                        <button
                          className={`px-3 py-1 rounded-md bg-green-600 text-white flex items-center ${
                            processingUser === user.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                          }`}
                          onClick={() => approveUser(user.id, user.member_id)}
                          disabled={processingUser === user.id}
                        >
                          <FaCheck className="mr-1" />
                          <span>Aprovar</span>
                        </button>
                        <button
                          className={`px-3 py-1 rounded-md bg-red-600 text-white flex items-center ${
                            processingUser === user.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                          }`}
                          onClick={() => rejectUser(user.id, user.member_id)}
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
};

export default PendingUsers; 