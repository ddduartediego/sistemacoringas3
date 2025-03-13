'use client';

import React, { useState, useEffect } from 'react';
import { FaCog, FaUser, FaTshirt, FaUsers, FaListAlt } from 'react-icons/fa';
import { SystemConfig } from '@/types';
import { getAllConfigs } from '@/lib/config';
import ProfileSettings from './components/ProfileSettings';
import MemberTypeSettings from './components/MemberTypeSettings';

export default function SettingsPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('profile');

  useEffect(() => {
    async function fetchConfigs() {
      try {
        setIsLoading(true);
        const allConfigs = await getAllConfigs();
        setConfigs(allConfigs);
      } catch (err: any) {
        console.error('Erro ao carregar configurações:', err);
        setError(err.message || 'Erro ao carregar configurações do sistema');
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfigs();
  }, []);

  // Obtém uma configuração específica pelo nome
  const getConfigByKey = (key: string): SystemConfig | undefined => {
    return configs.find(config => config.key === key);
  };

  // Tabs de configuração disponíveis
  const tabs = [
    {
      id: 'profile',
      name: 'Perfil do Integrante',
      icon: <FaUser className="mr-2" />,
      description: 'Configurações relacionadas ao perfil dos integrantes, como status, funções e tamanhos de camiseta'
    },
    {
      id: 'member_types',
      name: 'Tipos de Integrantes',
      icon: <FaUsers className="mr-2" />,
      description: 'Configurações de tipos, status e funções de integrantes aceitos pelo sistema'
    }
    // Outras tabs serão adicionadas no futuro
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileSettings 
            configs={configs} 
            setConfigs={setConfigs} 
            memberStatusConfig={getConfigByKey('member_status')}
            teamRolesConfig={getConfigByKey('team_roles')}
            shirtSizesConfig={getConfigByKey('shirt_sizes')}
          />
        );
      case 'member_types':
        return (
          <MemberTypeSettings
            configs={configs}
            setConfigs={setConfigs}
            memberStatusConfig={getConfigByKey('member_status')}
            teamRolesConfig={getConfigByKey('team_roles')}
          />
        );
      default:
        return <div>Selecione uma aba para configurar</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <p className="text-red-700">{error}</p>
        <p className="text-red-700 mt-2">Tente recarregar a página.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <FaCog className="text-blue-600 text-2xl mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-6 border-b-2 font-medium text-sm flex items-center
                  ${activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
} 