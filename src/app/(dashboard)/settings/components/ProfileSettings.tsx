'use client';

import React, { useState } from 'react';
import { FaPlus, FaTrash, FaTshirt, FaUserTag, FaUsers } from 'react-icons/fa';
import { SystemConfig } from '@/types';
import { updateConfig, addConfigValue, removeConfigValue } from '@/lib/config';

interface ProfileSettingsProps {
  configs: SystemConfig[];
  setConfigs: React.Dispatch<React.SetStateAction<SystemConfig[]>>;
  memberStatusConfig?: SystemConfig;
  teamRolesConfig?: SystemConfig; 
  shirtSizesConfig?: SystemConfig;
}

export default function ProfileSettings({
  configs,
  setConfigs,
  memberStatusConfig,
  teamRolesConfig,
  shirtSizesConfig
}: ProfileSettingsProps) {
  const [newStatus, setNewStatus] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newShirtSize, setNewShirtSize] = useState('');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Função genérica para adicionar um novo valor a uma configuração
  const handleAddValue = async (key: string, value: string, setValue: React.Dispatch<React.SetStateAction<string>>) => {
    if (!value.trim()) {
      setError('O valor não pode estar vazio');
      return;
    }

    try {
      setLoading({ ...loading, [key]: true });
      setError(null);
      
      const updatedConfig = await addConfigValue(key, value);
      
      // Atualizar o estado local
      setConfigs(prevConfigs => 
        prevConfigs.map(config => 
          config.key === key ? updatedConfig : config
        )
      );
      
      setValue(''); // Limpar o input
      setSuccess(`Item "${value}" adicionado com sucesso`);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(`Erro ao adicionar valor à configuração '${key}':`, err);
      setError(err.message || `Erro ao adicionar item`);
    } finally {
      setLoading({ ...loading, [key]: false });
    }
  };

  // Função genérica para remover um valor de uma configuração
  const handleRemoveValue = async (key: string, value: string) => {
    try {
      setLoading({ ...loading, [`${key}-${value}`]: true });
      setError(null);
      
      const updatedConfig = await removeConfigValue(key, value);
      
      // Atualizar o estado local
      setConfigs(prevConfigs => 
        prevConfigs.map(config => 
          config.key === key ? updatedConfig : config
        )
      );
      
      setSuccess(`Item "${value}" removido com sucesso`);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(`Erro ao remover valor da configuração '${key}':`, err);
      setError(err.message || `Erro ao remover item`);
    } finally {
      setLoading({ ...loading, [`${key}-${value}`]: false });
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Configurações do Perfil do Integrante</h2>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Configuração de Status de Membro */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FaUserTag className="text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Status de Integrante</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Defina os diferentes status que um integrante pode ter no sistema.
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {memberStatusConfig?.value.map(status => (
            <div 
              key={status} 
              className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
            >
              <span>{status}</span>
              <button 
                onClick={() => handleRemoveValue('member_status', status)}
                disabled={loading[`member_status-${status}`]}
                className="ml-2 text-blue-500 hover:text-red-500 focus:outline-none"
                title="Remover status"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex">
          <input
            type="text"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            placeholder="Novo status..."
            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <button
            onClick={() => handleAddValue('member_status', newStatus, setNewStatus)}
            disabled={loading['member_status']}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading['member_status'] ? (
              <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
            ) : (
              <FaPlus className="mr-2" />
            )}
            Adicionar
          </button>
        </div>
      </div>

      {/* Configuração de Funções na Equipe */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FaUsers className="text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Funções na Equipe</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Defina as diferentes funções que um integrante pode ter na equipe.
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {teamRolesConfig?.value.map(role => (
            <div 
              key={role} 
              className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
            >
              <span>{role}</span>
              <button 
                onClick={() => handleRemoveValue('team_roles', role)}
                disabled={loading[`team_roles-${role}`]}
                className="ml-2 text-blue-500 hover:text-red-500 focus:outline-none"
                title="Remover função"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex">
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="Nova função..."
            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <button
            onClick={() => handleAddValue('team_roles', newRole, setNewRole)}
            disabled={loading['team_roles']}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading['team_roles'] ? (
              <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
            ) : (
              <FaPlus className="mr-2" />
            )}
            Adicionar
          </button>
        </div>
      </div>

      {/* Configuração de Tamanhos de Camiseta */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FaTshirt className="text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Tamanhos de Camiseta</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Defina os diferentes tamanhos de camiseta disponíveis para os integrantes.
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {shirtSizesConfig?.value.map(size => (
            <div 
              key={size} 
              className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
            >
              <span>{size}</span>
              <button 
                onClick={() => handleRemoveValue('shirt_sizes', size)}
                disabled={loading[`shirt_sizes-${size}`]}
                className="ml-2 text-blue-500 hover:text-red-500 focus:outline-none"
                title="Remover tamanho"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex">
          <input
            type="text"
            value={newShirtSize}
            onChange={(e) => setNewShirtSize(e.target.value)}
            placeholder="Novo tamanho..."
            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <button
            onClick={() => handleAddValue('shirt_sizes', newShirtSize, setNewShirtSize)}
            disabled={loading['shirt_sizes']}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading['shirt_sizes'] ? (
              <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
            ) : (
              <FaPlus className="mr-2" />
            )}
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
} 