import { supabase } from './supabase';
import { User } from '@/types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Função para realizar o login com Google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

// Função para realizar o logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  return true;
};

// Função para verificar se o usuário está logado e aprovado
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  // Verificar se o usuário tem perfil
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
    
  if (error || !data) {
    return null;
  }
  
  return {
    id: session.user.id,
    email: session.user.email,
    avatar_url: session.user.user_metadata?.avatar_url,
    full_name: session.user.user_metadata?.full_name,
    created_at: data.created_at,
  } as User;
};

// Função para verificar o tipo de usuário (admin ou member)
export const getUserType = async (userId: string) => {
  const { data, error } = await supabase
    .from('members')
    .select('type')
    .eq('user_id', userId)
    .single();
    
  if (error || !data) {
    return null;
  }
  
  return data.type;
};

// Função para criar ou atualizar o perfil do usuário após o primeiro login
export const createOrUpdateUserProfile = async (user: any) => {
  // Verificar se o perfil já existe
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (!existingProfile) {
    // Criar perfil
    const { error } = await supabase
      .from('profiles')
      .insert([
        { 
          id: user.id, 
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
        }
      ]);
      
    if (error) {
      console.error('Erro ao criar perfil:', error);
    }
  } else {
    // Atualizar perfil
    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
      
    if (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  }
};

/**
 * Sincroniza o perfil do usuário após o login
 * Verifica se o usuário já tem um registro na tabela members
 * Se não tiver, cria um novo registro
 */
export const syncUserProfileAfterLogin = async (userId: string, userEmail: string, userName: string) => {
  try {
    console.log('Sincronizando perfil do usuário após login:', userId);
    const supabase = createClientComponentClient();
    
    // Verificar se o usuário já tem um registro na tabela members
    const { data: existingMember, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (memberError && memberError.code !== 'PGRST116') {
      console.error('Erro ao verificar membro existente:', memberError);
      throw memberError;
    }
    
    // Se o membro já existe, não precisamos fazer nada
    if (existingMember) {
      console.log('Membro já existe, não é necessário criar um novo registro');
      return existingMember;
    }
    
    // Se não existe, criar um novo registro
    console.log('Criando novo registro de membro para o usuário:', userId);
    
    // Extrair o nome do usuário do email ou dos metadados
    const nickname = userName || userEmail.split('@')[0];
    
    const { data: newMember, error: insertError } = await supabase
      .from('members')
      .insert([
        { 
          user_id: userId,
          nickname,
          email: userEmail,
          status: 'pendente', // Status inicial é pendente até aprovação
          type: 'member',     // Tipo padrão é membro comum
          team_role: 'indefinido',
          financial_status: 'ok',
          pending_amount: 0
        }
      ])
      .select()
      .single();
    
    if (insertError) {
      console.error('Erro ao criar novo membro:', insertError);
      throw insertError;
    }
    
    console.log('Novo membro criado com sucesso:', newMember);
    return newMember;
  } catch (error) {
    console.error('Erro ao sincronizar perfil do usuário:', error);
    throw error;
  }
};

/**
 * Limpa todos os dados de autenticação do navegador
 * Útil para resolver problemas de autenticação
 */
export const clearAuthData = () => {
  console.log('Limpando dados de autenticação...');
  
  try {
    // Limpar cookies relacionados ao Supabase
    const cookiesToClear = [
      'supabase-auth-token',
      'sb-refresh-token',
      'sb-access-token',
      'sb-auth-token',
      '__supabase_auth_token',
      '__supabase_refresh_token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      // Limpar para diferentes paths
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/login;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/dashboard;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/auth;`;
    });
    
    // Limpar localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Limpar sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    console.log('Dados de autenticação limpos com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao limpar dados de autenticação:', error);
    return false;
  }
};

/**
 * Verifica a sessão atual do usuário
 * Retorna a sessão se existir, ou null se não existir
 */
export async function checkSession() {
  try {
    console.log('Auth: Verificando sessão');
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth: Erro ao verificar sessão:', error.message);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('Auth: Erro ao verificar sessão:', error);
    return null;
  }
}

/**
 * Verifica se o usuário está autenticado
 * Retorna true se o usuário estiver autenticado, false caso contrário
 */
export async function isAuthenticated() {
  const session = await checkSession();
  return !!session;
}

/**
 * Verifica o tipo de membro do usuário
 * Retorna o tipo de membro se existir, ou null se não existir
 */
export async function getMemberType(userId: string) {
  try {
    console.log('Auth: Verificando tipo de membro:', userId);
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('members')
      .select('type')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Auth: Erro ao verificar tipo de membro:', error.message);
      return null;
    }
    
    return data?.type || null;
  } catch (error) {
    console.error('Auth: Erro ao verificar tipo de membro:', error);
    return null;
  }
}

/**
 * Verifica se o usuário é um administrador
 * Retorna true se o usuário for um administrador, false caso contrário
 */
export async function isAdmin(userId: string) {
  const memberType = await getMemberType(userId);
  return memberType?.toLowerCase() === 'admin';
}

/**
 * Verifica se o usuário é um membro aprovado
 * Retorna true se o usuário for um membro aprovado, false caso contrário
 */
export async function isApprovedMember(userId: string) {
  const memberType = await getMemberType(userId);
  return memberType?.toLowerCase() === 'member' || memberType?.toLowerCase() === 'admin';
} 