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
 * Atualiza informações adicionais do usuário na tabela de perfis
 */
export async function syncUserProfileAfterLogin(userId: string, userData: User) {
  try {
    console.log('Auth: Sincronizando perfil do usuário após login:', userId);
    const supabase = createClientComponentClient();
    
    // Extrair informações do perfil do usuário
    const { email, user_metadata } = userData;
    const name = user_metadata?.name || email?.split('@')[0] || 'Usuário';
    const avatarUrl = user_metadata?.avatar_url || null;
    
    // Verificar se já existe um perfil
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Auth: Erro ao verificar perfil existente:', profileError);
      return;
    }
    
    // Se não existe perfil, criar um novo
    if (!existingProfile) {
      console.log('Auth: Criando novo perfil para o usuário');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            full_name: name,
            avatar_url: avatarUrl,
            email: email,
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (insertError) {
        console.error('Auth: Erro ao criar perfil:', insertError);
      } else {
        console.log('Auth: Perfil criado com sucesso');
      }
    } else {
      // Se já existe, atualizar com as informações mais recentes
      console.log('Auth: Atualizando perfil existente');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          avatar_url: avatarUrl,
          email: email,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Auth: Erro ao atualizar perfil:', updateError);
      } else {
        console.log('Auth: Perfil atualizado com sucesso');
      }
    }
  } catch (error) {
    console.error('Auth: Erro ao sincronizar perfil:', error);
  }
}

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

/**
 * Limpa os cookies e o armazenamento local relacionados à autenticação
 * Útil para resolver problemas de autenticação
 */
export function clearAuthData() {
  try {
    console.log('Auth: Limpando dados de autenticação');
    
    // Limpar localStorage
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    }
    
    // Limpar cookies (método simples)
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name.includes('supabase') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    console.log('Auth: Dados de autenticação limpos com sucesso');
    return true;
  } catch (error) {
    console.error('Auth: Erro ao limpar dados de autenticação:', error);
    return false;
  }
} 