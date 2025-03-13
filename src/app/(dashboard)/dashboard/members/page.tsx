'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaUserEdit, FaTimes, FaExclamationCircle, FaSearch, FaUserCircle } from 'react-icons/fa';
import { Member, User, UserType, MemberStatus, TeamRole } from '@/types';
import { useRouter } from 'next/navigation';
import { getConfigValues } from '@/lib/config';

interface MemberWithUser extends Member {
  user?: {
    email: string;
    user_metadata: any;
  };
}

export default function MembersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para tipos configuráveis
  const [memberStatuses, setMemberStatuses] = useState<string[]>([]);
  const [teamRoles, setTeamRoles] = useState<string[]>([]);
  const [userTypes, setUserTypes] = useState<string[]>(['admin', 'member', 'inativo']);
  
  // Estados para edição
  const [editType, setEditType] = useState<UserType>('member');
  const [editStatus, setEditStatus] = useState<MemberStatus>('calouro');
  const [editTeamRole, setEditTeamRole] = useState<TeamRole>('rua');
  
  const router = useRouter();
  
  // Verificar se o usuário é admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        // Verificar se o usuário é admin (case-insensitive)
        if (data && data.type.toLowerCase() === 'admin') {
          setIsAdmin(true);
          // Buscar membros apenas se for admin
          fetchMembers();
          fetchConfigOptions();
        } else {
          setError('Você não tem permissão para acessar esta página.');
          // Redirecionar para dashboard após 2 segundos
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } catch (err: any) {
        console.error('Erro ao verificar permissões:', err);
        setError(`Erro ao verificar permissões: ${err.message || 'Erro desconhecido'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      checkAdminRole();
    }
  }, [user, router]);
  
  // Buscar opções de configuração
  const fetchConfigOptions = async () => {
    try {
      const statusValues = await getConfigValues('member_status');
      const roleValues = await getConfigValues('team_roles');
      
      if (statusValues.length > 0) {
        setMemberStatuses(statusValues);
      }
      
      if (roleValues.length > 0) {
        setTeamRoles(roleValues);
      }
    } catch (err) {
      console.error('Erro ao buscar opções de configuração:', err);
    }
  };
  
  // Buscar membros e informações dos usuários
  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClientComponentClient();
      
      // Buscar todos os membros
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .order('nickname', { ascending: true });
      
      if (membersError) throw membersError;
      
      // Para cada membro, buscar informações do usuário
      const membersWithUserInfo = await Promise.all(
        membersData.map(async (member) => {
          try {
            // Verificar se o user_id existe
            if (!member.user_id) {
              return { ...member, user: { email: 'Sem email', user_metadata: {} } };
            }
            
            // Buscar informações do usuário na tabela de profiles
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')  // Selecionar todos os campos para garantir que temos todas as informações
              .eq('id', member.user_id)
              .single();
              
            if (profileError) {
              // Se ocorrer erro, logar apenas para debugging
              console.log(`Erro ao buscar perfil para membro ${member.id}: ${profileError.message}`);
              
              // Retornar o membro com dados de usuário padrão
              return { 
                ...member, 
                user: { 
                  email: 'Usuário não encontrado', 
                  user_metadata: {
                    name: 'Não disponível',
                    full_name: 'Não disponível'
                  } 
                } 
              };
            }
            
            // Retornar o membro com os dados do perfil, estruturando para manter compatibilidade
            return {
              ...member,
              user: {
                email: profileData.email || 'Email não disponível',
                user_metadata: {
                  name: profileData.name || profileData.full_name || 'Não disponível',
                  full_name: profileData.full_name || profileData.name || 'Não disponível',
                  avatar_url: profileData.avatar_url || null,
                  picture: profileData.avatar_url || null
                }
              }
            };
          } catch (err) {
            // Converter o erro para string para evitar problemas de serialização
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            console.log(`Erro ao processar dados do usuário para membro ${member.id}: ${errorMessage}`);
            
            return { 
              ...member, 
              user: { 
                email: 'Erro ao carregar dados', 
                user_metadata: {
                  name: 'Erro',
                  full_name: 'Erro ao carregar'
                } 
              } 
            };
          }
        })
      );
      
      setMembers(membersWithUserInfo);
    } catch (err: any) {
      console.error('Erro ao buscar membros:', err);
      setError(`Erro ao buscar membros: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Iniciar edição
  const startEditing = (memberId: string, currentType: UserType, currentStatus: MemberStatus, currentTeamRole: TeamRole) => {
    setEditingMember(memberId);
    setEditType(currentType);
    setEditStatus(currentStatus);
    setEditTeamRole(currentTeamRole);
  };
  
  // Cancelar edição
  const cancelEditing = () => {
    setEditingMember(null);
  };
  
  // Salvar alterações
  const saveChanges = async (memberId: string) => {
    if (!memberId) return;
    
    try {
      const supabase = createClientComponentClient();
      
      const { data, error } = await supabase
        .from('members')
        .update({
          type: editType,
          status: editStatus,
          team_role: editTeamRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select();
      
      if (error) throw error;
      
      // Atualizar lista de membros
      setMembers(prevMembers => 
        prevMembers.map(member => {
          if (member.id === memberId) {
            return {
              ...member,
              type: editType,
              status: editStatus,
              team_role: editTeamRole
            };
          }
          return member;
        })
      );
      
      // Encerrar modo de edição
      setEditingMember(null);
    } catch (err: any) {
      console.error('Erro ao atualizar membro:', err);
      setError(`Erro ao atualizar membro: ${err.message || 'Erro desconhecido'}`);
      
      // Limpar mensagem de erro após 3 segundos
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };
  
  // Filtrar membros com base no termo de busca
  const filteredMembers = members.filter(member => {
    if (!searchTerm.trim()) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // Tratamento de segurança para evitar erros quando as propriedades não existirem
    const nickname = member.nickname?.toLowerCase() || '';
    const email = member.user?.email?.toLowerCase() || '';
    const type = member.type?.toLowerCase() || '';
    const status = member.status?.toLowerCase() || '';
    const teamRole = member.team_role?.toLowerCase() || '';
    const name = member.user?.user_metadata?.name?.toLowerCase() || '';
    const fullName = member.user?.user_metadata?.full_name?.toLowerCase() || '';
    
    return (
      nickname.includes(searchTermLower) ||
      email.includes(searchTermLower) ||
      type.includes(searchTermLower) ||
      status.includes(searchTermLower) ||
      teamRole.includes(searchTermLower) ||
      name.includes(searchTermLower) ||
      fullName.includes(searchTermLower)
    );
  });
  
  // Função para traduzir os tipos/status para exibição
  const translateType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'admin': return 'Administrador';
      case 'member': return 'Membro';
      case 'inativo': return 'Inativo';
      default: return type;
    }
  };
  
  const translateStatus = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'calouro': return 'Calouro';
      case 'veterano': return 'Veterano';
      case 'aposentado': return 'Aposentado';
      case 'patrocinador': return 'Patrocinador';
      case 'comercial': return 'Comercial';
      default: return status;
    }
  };
  
  const translateTeamRole = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'rua': return 'Rua';
      case 'qg': return 'QG';
      case 'lideranca': return 'Liderança';
      default: return role;
    }
  };
  
  if (!isAdmin && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaExclamationCircle className="text-red-500 text-5xl mb-4" />
        <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
        <p className="text-gray-600 mb-4">
          Você não tem permissão para acessar esta página.
        </p>
        <p className="text-gray-500">Redirecionando para o dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Gerenciamento de Integrantes</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <FaExclamationCircle className="text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar integrantes por nome, email, tipo, status ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Integrante
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {(member.user?.user_metadata?.avatar_url || member.user?.user_metadata?.picture) ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={member.user?.user_metadata?.avatar_url || member.user?.user_metadata?.picture}
                              alt={member.nickname || 'Avatar'}
                              onError={(e) => {
                                // Substituir a imagem por um ícone padrão se houver erro no carregamento
                                const imgElement = e.target as HTMLImageElement;
                                if (imgElement && imgElement.style) {
                                  imgElement.style.display = 'none';
                                  
                                  // Obter o elemento irmão com segurança
                                  const nextElement = imgElement.nextElementSibling as HTMLDivElement;
                                  if (nextElement && nextElement.style) {
                                    nextElement.style.display = 'flex';
                                  }
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className={`h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ${(member.user?.user_metadata?.avatar_url || member.user?.user_metadata?.picture) ? 'hidden' : ''}`}
                          >
                            <FaUserCircle className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.nickname || 'Sem apelido'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.user?.user_metadata?.name || member.user?.user_metadata?.full_name || 'Sem nome'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.user?.email || 'Email não disponível'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingMember === member.id ? (
                        <select
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as UserType)}
                        >
                          {userTypes.map(type => (
                            <option key={type} value={type}>
                              {translateType(type)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${member.type.toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            member.type.toLowerCase() === 'member' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {translateType(member.type)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingMember === member.id ? (
                        <select
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as MemberStatus)}
                        >
                          {memberStatuses.map(status => (
                            <option key={status} value={status}>
                              {translateStatus(status)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {translateStatus(member.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingMember === member.id ? (
                        <select
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={editTeamRole}
                          onChange={(e) => setEditTeamRole(e.target.value as TeamRole)}
                        >
                          {teamRoles.map(role => (
                            <option key={role} value={role}>
                              {translateTeamRole(role)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {translateTeamRole(member.team_role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingMember === member.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => saveChanges(member.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(member.id, member.type as UserType, member.status as MemberStatus, member.team_role as TeamRole)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaUserEdit className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 