'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FaHome, 
  FaUsers, 
  FaCalendarAlt, 
  FaFileInvoiceDollar, 
  FaUser, 
  FaCog,
  FaBars,
  FaTimes,
  FaUserPlus,
  FaBell,
  FaSignOutAlt,
  FaListAlt
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Definindo interface para os itens de navegação
interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  // Verificar se o usuário é admin ou member
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user?.id) return;
      
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error('Erro ao verificar status do usuário:', error);
          return;
        }
        
        // Função auxiliar para verificar o tipo de forma case-insensitive
        const checkType = (actual: string, expected: string) => 
          actual?.toLowerCase() === expected.toLowerCase();
        
        // Verificar o tipo do usuário (agora case-insensitive)
        setIsAdmin(checkType(data?.type, 'admin'));
        setIsMember(checkType(data?.type, 'member'));
        
        // Se for admin, buscar quantidade de usuários pendentes
        if (checkType(data?.type, 'admin')) {
          fetchPendingUsersCount();
        }
      } catch (err) {
        console.error('Erro ao verificar permissões:', err);
      }
    };
    
    checkUserStatus();
  }, [user]);
  
  // Buscar contagem de usuários pendentes usando nossa API
  const fetchPendingUsersCount = async () => {
    try {
      // Usar a API Route em vez da chamada direta à API Admin
      const response = await fetch('/api/pending-users');
      
      if (!response.ok) {
        console.error('Erro ao buscar usuários pendentes:', await response.text());
        return;
      }
      
      const data = await response.json();
      setPendingUsersCount(data.users?.length || 0);
    } catch (err) {
      console.error('Erro ao buscar contagem de usuários pendentes:', err);
      setPendingUsersCount(0);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Definindo os itens de navegação
  const navItems: NavItem[] = [];
  
  // Primeiro item sempre será "Meu Perfil"
  navItems.push({
    name: 'Meu Perfil',
    href: '/profile',
    icon: <FaUser className="w-5 h-5" />,
  });
  
  // Adiciona o Dashboard somente se não for um membro comum
  if (!isMember) {
    navItems.push({
      name: 'Dashboard',
      href: '/dashboard',
      icon: <FaHome className="w-5 h-5" />,
    });
  }
  
  // Itens que são comuns a todos os usuários
  navItems.push(
    {
      name: 'Eventos',
      href: '/dashboard/events',
      icon: <FaCalendarAlt className="w-5 h-5" />,
    },
    {
      name: 'Cobranças',
      href: '/dashboard/charges',
      icon: <FaFileInvoiceDollar className="w-5 h-5" />,
    }
  );
  
  // Adiciona itens apenas para administradores
  if (isAdmin) {
    navItems.push({
      name: 'Integrantes',
      href: '/dashboard/members',
      icon: <FaUsers className="w-5 h-5" />,
    });
    
    navItems.push({
      name: 'Configurações',
      href: '/settings',
      icon: <FaCog className="w-5 h-5" />,
    });
  }

  // Função para lidar com o logout
  const handleLogout = async () => {
    try {
      console.log('Iniciando logout a partir da Sidebar');
      await signOut();
      // O redirecionamento será feito pela função signOut no AuthContext
    } catch (error) {
      console.error('Erro ao fazer logout a partir da Sidebar:', error);
    }
  };

  const sidebarClasses = `
    ${isCollapsed ? 'w-20' : 'w-64'} 
    flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
    hidden md:flex
  `;

  const mobileSidebarClasses = `
    fixed inset-0 z-40 w-full bg-white md:hidden
    ${isMobileOpen ? 'block' : 'hidden'}
  `;

  const renderSidebarContent = () => (
    <>
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <h1 className={`text-xl font-bold text-gray-800 ${isCollapsed ? 'hidden' : 'block'}`}>
          Sistema Coringas
        </h1>
        <button 
          onClick={toggleSidebar} 
          className="text-gray-500 hover:text-gray-700 hidden md:block"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {isCollapsed ? (
            <FaBars className="w-5 h-5" />
          ) : (
            <FaTimes className="w-5 h-5" />
          )}
        </button>
        <button 
          onClick={toggleMobileSidebar} 
          className="text-gray-500 hover:text-gray-700 md:hidden"
          aria-label="Fechar menu"
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="px-4 py-2">
                <Link
                  href={item.href}
                  className={`
                    flex items-center py-2 px-4 rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={`ml-3 ${isCollapsed ? 'hidden' : 'block'}`}>{item.name}</span>
                  {item.badge && (
                    <span className={`
                      ${isCollapsed ? 'ml-0' : 'ml-auto'} 
                      inline-flex items-center justify-center px-2 py-1 text-xs 
                      font-bold leading-none text-white bg-red-600 rounded-full
                    `}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          
          {/* Botão de Logout */}
          <li className="px-4 py-2 mt-6">
            <button
              onClick={handleLogout}
              className={`
                flex items-center py-2 px-4 rounded-md w-full transition-colors
                text-red-600 hover:bg-red-50 hover:text-red-700
              `}
              aria-label="Sair do sistema"
            >
              <span className="flex-shrink-0">
                <FaSignOutAlt className="w-5 h-5" />
              </span>
              <span className={`ml-3 ${isCollapsed ? 'hidden' : 'block'}`}>Sair</span>
            </button>
          </li>
        </ul>
      </nav>
      
      {/* Informações do usuário e botão de logout fixo para mobile */}
      <div className="border-t border-gray-200 p-4 md:hidden">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FaUser className="text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {user?.user_metadata?.name || user?.email || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
        >
          <FaSignOutAlt className="mr-2" /> Sair do Sistema
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={sidebarClasses}>
        {renderSidebarContent()}
      </div>

      {/* Mobile Toggle Button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed bottom-4 right-4 z-30 md:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg"
        aria-label="Abrir menu"
      >
        <FaBars className="w-5 h-5" />
      </button>

      {/* Mobile Sidebar */}
      <div className={mobileSidebarClasses}>
        {renderSidebarContent()}
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}
    </>
  );
} 