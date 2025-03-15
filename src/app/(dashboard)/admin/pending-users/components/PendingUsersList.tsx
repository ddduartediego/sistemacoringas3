'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FaCheck, FaTimes, FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import LoadingScreen from './LoadingScreen';

// Interface para usuários pendentes
interface PendingUser {
  id: string;
  user_id: string;
  email?: string;
  nickname?: string;
  type: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
  [key: string]: any;
}

// Interface para erros
interface ApiError {
  message: string;
  status?: number;
}

// Props para o componente
interface PendingUsersListProps {
  users: PendingUser[];
  onStatusChange: () => void;
}

export default function PendingUsersList({ users, onStatusChange }: PendingUsersListProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>(users);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});
  
  // Função para aprovar um usuário
  const approveUser = async (memberId: string) => {
    try {
      setProcessingUser(memberId);
      setError(null);
      
      // Usar novo cliente do Supabase
      const supabase = createClient();
      
      // Atualizar o membro para 'member'
      const { error } = await supabase
        .from('members')
        .update({ type: 'member' })
        .eq('id', memberId);
        
      if (error) {
        throw new Error(error.message || 'Erro ao aprovar usuário');
      }
      
      // Remover o usuário da lista
      setPendingUsers(prev => prev.filter(user => user.id !== memberId));
      
      // Mostrar mensagem de sucesso
      setSuccessMessage('Usuário aprovado com sucesso!');
      toast.success('Usuário aprovado com sucesso!');
      
      // Notificar o componente pai
      onStatusChange();
      
      // Limpar a mensagem após 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao aprovar usuário:', error);
      setError(error.message || 'Erro ao aprovar usuário');
      toast.error('Erro ao aprovar usuário: ' + error.message);
    } finally {
      setProcessingUser(null);
    }
  };

  // Função para rejeitar um usuário
  const rejectUser = async (memberId: string) => {
    try {
      // Confirmar com o usuário
      if (!confirm('Tem certeza que deseja rejeitar este usuário? Esta ação não pode ser desfeita.')) {
        return;
      }
      
      setProcessingUser(memberId);
      setError(null);
      
      // Chamar a API para rejeitar o usuário
      const response = await fetch('/api/reject-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao rejeitar usuário');
      }
      
      // Remover o usuário da lista
      setPendingUsers(prev => prev.filter(user => user.id !== memberId));
      
      // Mostrar mensagem de sucesso
      setSuccessMessage('Usuário rejeitado com sucesso!');
      toast.success('Usuário rejeitado com sucesso!');
      
      // Notificar o componente pai
      onStatusChange();
      
      // Limpar a mensagem após 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao rejeitar usuário:', error);
      setError(error.message || 'Erro ao rejeitar usuário');
      toast.error('Erro ao rejeitar usuário: ' + error.message);
    } finally {
      setProcessingUser(null);
    }
  };

  // Formata a data para exibição
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

  // Obtém o nome de exibição do usuário
  const getUserDisplayName = (user: PendingUser): string => {
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.nickname || 
           user.email || 
           'Usuário sem nome';
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