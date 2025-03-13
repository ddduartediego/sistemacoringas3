'use client';

import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaBell, FaUser, FaUserCheck } from 'react-icons/fa';
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
    // Verificar se o usuário é admin e carregar contagem de usuários pendentes apenas uma vez
    async function checkAdminAndLoadPendingUsers() {
      if (!user) return;
      
      try {
        // Verificar se o usuário é admin
        const { data, error } = await supabase
          .from('members')
          .select('type')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        // Verificação case-insensitive para Admin
        const isUserAdmin = data?.type === 'Admin' || data?.type === 'admin';
        setIsAdmin(isUserAdmin);
        
        // Se é admin, buscar contagem de usuários pendentes (apenas uma vez)
        if (isUserAdmin) {
          fetchPendingUsersCount();
        }
      } catch (error) {
        console.error('Erro ao verificar status de admin:', error);
      }
    }
    
    checkAdminAndLoadPendingUsers();
    
    // Não há mais intervalo para verificação periódica
  }, [user]);

  const fetchPendingUsersCount = async () => {
    if (!user) return;
    
    setIsLoadingNotifications(true);
    
    try {
      // Consultar diretamente o Supabase em vez de usar a API
      const { count, error } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'pending');
      
      if (error) {
        throw error;
      }
      
      setPendingUsersCount(count || 0);
      
      if (count && count > 0) {
        console.log(`[Notificações] ${count} usuários pendentes encontrados`);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de usuários pendentes:', error);
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
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Bem-vindo, {fullName}
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        {isAdmin && (
          <Link 
            href="/admin/pending-users" 
            className="text-gray-600 hover:text-gray-800 relative"
            title="Usuários pendentes"
          >
            <FaBell className="w-5 h-5" />
            {pendingUsersCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"
              >
                {pendingUsersCount}
              </motion.span>
            )}
          </Link>
        )}
        
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