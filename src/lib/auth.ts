import { supabase } from './supabase';
import { User } from '@/types';

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
 * Sincroniza as informações do usuário com a tabela profiles após o login
 * @param supabase Cliente do Supabase
 * @param user Dados do usuário autenticado
 */
export const syncUserProfileAfterLogin = async (supabase: any, user: any) => {
  if (!user || !user.id) {
    console.error('Erro ao sincronizar perfil: usuário ou ID do usuário ausente', user);
    throw new Error('Usuário não disponível para sincronização');
  }
  
  try {
    console.log('Iniciando sincronização do perfil para usuário:', user.id);
    
    // Log detalhado dos metadados disponíveis
    if (user.user_metadata) {
      console.log('Metadados disponíveis:', JSON.stringify(user.user_metadata));
    } else {
      console.warn('Usuário não possui metadados!');
    }
    
    // Verificar se o perfil já existe
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erro ao verificar perfil existente:', profileError);
    }
    
    // Verificar se temos metadados do usuário
    if (!user.user_metadata) {
      console.warn('Usuário não possui metadados. Tentando obter dados completos do usuário...');
      
      // Tentar buscar dados atualizados do usuário
      try {
        const { data: refreshedUserData, error: refreshError } = await supabase.auth.getUser();
        if (!refreshError && refreshedUserData && refreshedUserData.user && refreshedUserData.user.user_metadata) {
          console.log('Obtidos novos dados do usuário com metadados.');
          user = refreshedUserData.user;
        } else {
          console.warn('Não foi possível obter metadados atualizados, usando dados básicos.');
        }
      } catch (refreshErr) {
        console.error('Erro ao atualizar dados do usuário:', refreshErr);
      }
    }
    
    // Preparar os dados do perfil com base nas informações do OAuth
    const userMetadata = user.user_metadata || {};
    
    console.log('Preparando dados do perfil para:', user.email);
    
    const profileData = {
      id: user.id,
      email: user.email,
      name: userMetadata.name || userMetadata.full_name || user.email?.split('@')[0] || 'Usuário',
      full_name: userMetadata.full_name || userMetadata.name || user.email?.split('@')[0] || 'Usuário',
      avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
      updated_at: new Date().toISOString()
    };
    
    console.log('Dados do perfil preparados:', JSON.stringify(profileData));
    
    // Se o perfil não existir, criar um novo
    if (profileError || !existingProfile) {
      console.log('Criando novo perfil para usuário:', user.id);
      
      // Remover campo is_approved da inserção
      const newProfileData = {
        ...profileData,
        created_at: new Date().toISOString()
      };
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([newProfileData])
        .select();
      
      if (insertError) {
        console.error('Erro ao criar perfil:', insertError);
        throw new Error(`Falha ao criar perfil: ${insertError.message}`);
      }
      
      if (!newProfile || newProfile.length === 0) {
        console.error('Perfil não foi criado corretamente. Resposta vazia.');
        throw new Error('Falha ao criar perfil: resposta vazia');
      }
      
      console.log('Novo perfil criado após login:', newProfile[0]);
      return newProfile[0];
    }
    
    // Se o perfil existir, atualizar com os dados mais recentes
    console.log('Atualizando perfil existente para usuário:', user.id);
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select();
    
    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError);
      throw new Error(`Falha ao atualizar perfil: ${updateError.message}`);
    }
    
    if (!updatedProfile || updatedProfile.length === 0) {
      console.error('Perfil não foi atualizado corretamente. Resposta vazia.');
      throw new Error('Falha ao atualizar perfil: resposta vazia');
    }
    
    console.log('Perfil atualizado após login:', updatedProfile[0]);
    return updatedProfile[0];
  } catch (error) {
    console.error('Erro ao sincronizar perfil após login:', error);
    throw error; // Propagar o erro para tratamento no contexto
  }
}; 