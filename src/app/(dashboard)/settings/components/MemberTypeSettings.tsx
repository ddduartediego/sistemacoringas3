import React, { useState } from 'react';
import { FaPlus, FaTimes, FaExclamationCircle, FaCheck } from 'react-icons/fa';
import { SystemConfig } from '@/types';
import { updateConfig } from '@/lib/config';

interface MemberTypeSettingsProps {
  configs: SystemConfig[];
  setConfigs: React.Dispatch<React.SetStateAction<SystemConfig[]>>;
  memberStatusConfig?: SystemConfig;
  teamRolesConfig?: SystemConfig;
}

export default function MemberTypeSettings({ 
  configs, 
  setConfigs,
  memberStatusConfig,
  teamRolesConfig 
}: MemberTypeSettingsProps) {
  const [newStatus, setNewStatus] = useState('');
  const [newRole, setNewRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Adicionar um novo valor de status
  const addStatus = async () => {
    if (!newStatus.trim()) return;
    if (!memberStatusConfig) {
      setError('Configuração de status não encontrada');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Verificar se o valor já existe
      if (memberStatusConfig.value.includes(newStatus.trim())) {
        setError('Este status já existe!');
        return;
      }
      
      // Adicionar o novo valor
      const newValues = [...memberStatusConfig.value, newStatus.trim()];
      const updatedConfig = await updateConfig(memberStatusConfig.key, newValues);
      
      // Atualizar o estado
      setConfigs(prevConfigs => 
        prevConfigs.map(config => 
          config.id === updatedConfig.id ? updatedConfig : config
        )
      );
      
      setNewStatus('');
      setSuccess('Status adicionado com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar status');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Remover um valor de status
  const removeStatus = async (status: string) => {
    if (!memberStatusConfig) {
      setError('Configuração de status não encontrada');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Remover o valor
      const newValues = memberStatusConfig.value.filter(v => v !== status);
      
      // Verificar se está removendo o último valor
      if (newValues.length === 0) {
        setError('Não é possível remover o último status. O sistema precisa de pelo menos um status válido.');
        return;
      }
      
      const updatedConfig = await updateConfig(memberStatusConfig.key, newValues);
      
      // Atualizar o estado
      setConfigs(prevConfigs => 
        prevConfigs.map(config => 
          config.id === updatedConfig.id ? updatedConfig : config
        )
      );
      
      setSuccess('Status removido com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao remover status');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Adicionar uma nova função
  const addRole = async () => {
    if (!newRole.trim()) return;
    if (!teamRolesConfig) {
      setError('Configuração de funções não encontrada');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Verificar se o valor já existe
      if (teamRolesConfig.value.includes(newRole.trim())) {
        setError('Esta função já existe!');
        return;
      }
      
      // Adicionar o novo valor
      const newValues = [...teamRolesConfig.value, newRole.trim()];
      const updatedConfig = await updateConfig(teamRolesConfig.key, newValues);
      
      // Atualizar o estado
      setConfigs(prevConfigs => 
        prevConfigs.map(config => 
          config.id === updatedConfig.id ? updatedConfig : config
        )
      );
      
      setNewRole('');
      setSuccess('Função adicionada com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar função');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Remover uma função
  const removeRole = async (role: string) => {
    if (!teamRolesConfig) {
      setError('Configuração de funções não encontrada');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Remover o valor
      const newValues = teamRolesConfig.value.filter(v => v !== role);
      
      // Verificar se está removendo o último valor
      if (newValues.length === 0) {
        setError('Não é possível remover a última função. O sistema precisa de pelo menos uma função válida.');
        return;
      }
      
      const updatedConfig = await updateConfig(teamRolesConfig.key, newValues);
      
      // Atualizar o estado
      setConfigs(prevConfigs => 
        prevConfigs.map(config => 
          config.id === updatedConfig.id ? updatedConfig : config
        )
      );
      
      setSuccess('Função removida com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao remover função');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se as configurações necessárias não estiverem carregadas
  if (!memberStatusConfig || !teamRolesConfig) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-500">
          Configurações de tipos de integrantes não encontradas. 
          Entre em contato com o administrador do sistema.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Configuração de Tipos de Integrantes</h2>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <FaExclamationCircle className="text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex items-center">
            <FaCheck className="text-green-500 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Configuração de Status */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-blue-50">
            <h3 className="text-lg leading-6 font-medium text-blue-800">Status de Integrantes</h3>
            <p className="mt-1 max-w-2xl text-sm text-blue-600">
              Defina os possíveis status para os integrantes do sistema
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Novo status..."
                  disabled={isSubmitting}
                />
                <button
                  onClick={addStatus}
                  disabled={isSubmitting || !newStatus.trim()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <FaPlus className="mr-1" /> Adicionar
                </button>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Status Atuais:</h4>
              <ul className="divide-y divide-gray-200">
                {memberStatusConfig.value.map((status) => (
                  <li key={status} className="py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-900">{status}</span>
                    <button
                      onClick={() => removeStatus(status)}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-900 focus:outline-none"
                    >
                      <FaTimes />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Configuração de Funções */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-yellow-50">
            <h3 className="text-lg leading-6 font-medium text-yellow-800">Funções de Equipe</h3>
            <p className="mt-1 max-w-2xl text-sm text-yellow-600">
              Defina as possíveis funções para os integrantes da equipe
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="shadow-sm focus:ring-yellow-500 focus:border-yellow-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Nova função..."
                  disabled={isSubmitting}
                />
                <button
                  onClick={addRole}
                  disabled={isSubmitting || !newRole.trim()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  <FaPlus className="mr-1" /> Adicionar
                </button>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Funções Atuais:</h4>
              <ul className="divide-y divide-gray-200">
                {teamRolesConfig.value.map((role) => (
                  <li key={role} className="py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-900">{role}</span>
                    <button
                      onClick={() => removeRole(role)}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-900 focus:outline-none"
                    >
                      <FaTimes />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 border-t pt-6 border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Integrantes</h3>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <p className="text-sm text-gray-600">
              Os tipos de integrantes do sistema são fixos e não podem ser alterados:
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <ul className="divide-y divide-gray-200">
              <li className="py-3 flex items-center">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 mr-3">
                  Admin
                </span>
                <span className="text-sm text-gray-600">Administrador com acesso a todas as funcionalidades do sistema</span>
              </li>
              <li className="py-3 flex items-center">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mr-3">
                  Member
                </span>
                <span className="text-sm text-gray-600">Integrante regular com acesso às funcionalidades básicas</span>
              </li>
              <li className="py-3 flex items-center">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 mr-3">
                  Inativo
                </span>
                <span className="text-sm text-gray-600">Usuário registrado mas ainda não aprovado ou em período de inatividade</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 