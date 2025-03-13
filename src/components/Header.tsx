'use client';

import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaBell, FaUser, FaUserCheck, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { user, signOut, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    // Verificar se o usuário é admin
    async function checkAdminStatus() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        // Verificação case-insensitive para Admin
        const isUserAdmin = data?.type === 'Admin' || data?.type === 'admin';
        setIsAdmin(isUserAdmin);
        
        // Se é admin, buscar contagem de usuários pendentes
        if (isUserAdmin) {
          fetchPendingUsersCount();
        }
      } catch (error) {
        console.error('Erro ao verificar status de admin:', error);
      }
    }
    
    checkAdminStatus();
    
    // Configurar intervalo para verificar periodicamente (a cada 2 minutos)
    const interval = setInterval(() => {
      if (isAdmin) {
        fetchPendingUsersCount();
      }
    }, 120000);
    
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  const fetchPendingUsersCount = async () => {
    if (!user) return;
    
    setIsLoadingNotifications(true);
    
    try {
      // Usar a API otimizada que retorna apenas a contagem
      const response = await fetch('/api/pending-users/count');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar contagem de usuários pendentes');
      }
      
      const data = await response.json();
      setPendingUsersCount(data.count || 0);
      
      // Forçar re-renderização do indicador de notificação quando há usuários pendentes
      if (data.count > 0) {
        console.log(`[Notificações] ${data.count} usuários pendentes encontrados`);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de usuários pendentes:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Função para buscar detalhes dos usuários pendentes quando o menu é aberto
  const fetchPendingUsersDetails = async () => {
    if (!isAdmin || !showNotifications) return;
    
    setIsLoadingNotifications(true);
    
    try {
      const response = await fetch('/api/pending-users');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes dos usuários pendentes');
      }
      
      const data = await response.json();
      // Atualizar a contagem com base nos detalhes recebidos
      setPendingUsersCount(data.users?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar detalhes dos usuários pendentes:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Obter os dados do usuário de forma segura
  const userMetadata = user?.user_metadata || {};
  const avatarUrl = userMetadata.avatar_url || userMetadata.picture;
  const fullName = userMetadata.full_name || userMetadata.name || 'Usuário';
  const userInitial = fullName.charAt(0).toUpperCase();

  const toggleNotifications = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    
    // Se estiver abrindo o menu de notificações, buscar detalhes atualizados
    if (newState && isAdmin) {
      fetchPendingUsersDetails();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Bem-vindo, {fullName}
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button 
            className="text-gray-600 hover:text-gray-800 relative"
            title="Notificações"
            onClick={toggleNotifications}
          >
            <FaBell className="w-5 h-5" />
            {isAdmin && pendingUsersCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"
              >
                {pendingUsersCount}
              </motion.span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50"
              >
                <div className="p-3 bg-blue-50 border-b border-blue-100">
                  <h3 className="font-semibold text-blue-800">Notificações</h3>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {isLoadingNotifications ? (
                    <div className="p-4 text-center">
                      <div className="w-6 h-6 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Carregando notificações...</p>
                    </div>
                  ) : isAdmin ? (
                    pendingUsersCount > 0 ? (
                      <div className="p-4 border-b border-gray-100">
                        <Link href="/admin/pending-users" onClick={() => setShowNotifications(false)}>
                          <div className="flex items-center p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                              <FaUserCheck />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Aprovações Pendentes</p>
                              <p className="text-sm text-gray-600">
                                {pendingUsersCount} {pendingUsersCount === 1 ? 'usuário aguarda' : 'usuários aguardam'} aprovação
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <FaBell className="text-gray-300 w-10 h-10 mx-auto mb-2" />
                        <p>Não há novas notificações</p>
                      </div>
                    )
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <FaBell className="text-gray-300 w-10 h-10 mx-auto mb-2" />
                      <p>Não há novas notificações</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center space-x-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar do usuário"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-800">
                {userInitial}
              </span>
            </div>
          )}
          <button 
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
            title="Sair"
          >
            <FaSignOutAlt className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
} 