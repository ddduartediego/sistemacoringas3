import { supabase } from '@/lib/supabase';
import { Member } from '@/types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { syncUserProfileAfterLogin } from './auth';

/**
 * Obtém todos os membros
 */
export async function getAllMembers(): Promise<Member[]> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar membros:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    return [];
  }
}

/**
 * Obtém um membro pelo ID do usuário
 */
export async function getMemberByUserId(userId: string): Promise<Member | null> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Erro ao buscar membro:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar membro:', error);
    return null;
  }
}

/**
 * Obtém um membro pelo ID
 */
export async function getMemberById(id: string): Promise<Member | null> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar membro:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar membro:', error);
    return null;
  }
}

/**
 * Atualiza as informações do próprio usuário/membro
 * @param userId ID do usuário
 * @param memberId ID do membro
 * @param memberData Dados do membro para atualizar
 * @returns Membro atualizado ou null em caso de erro
 */
export const updateOwnMemberInfo = async (
  userId: string,
  memberId: string,
  memberData: Partial<Member>
) => {
  try {
    const supabase = createClientComponentClient();
    
    // Verificar se o membro pertence ao usuário
    const { data: memberCheck, error: checkError } = await supabase
      .from('members')
      .select('user_id')
      .eq('id', memberId)
      .single();
    
    if (checkError) {
      throw checkError;
    }
    
    // Verificar se o membro pertence ao usuário atual
    if (memberCheck.user_id !== userId) {
      throw new Error('Você não tem permissão para atualizar este membro');
    }
    
    // Atualizar o membro
    const { data: updatedMember, error: updateError } = await supabase
      .from('members')
      .update({
        ...memberData,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    // Se atualização incluir campos que devem ser sincronizados com o perfil
    if (memberData.nickname) {
      // Buscar dados atuais do usuário
      const { data: userData } = await supabase.auth.getUser();
      if (userData && userData.user) {
        // Sincronizar com perfil
        await syncUserProfileAfterLogin(supabase, userData.user);
      }
    }
    
    return updatedMember;
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    throw error;
  }
};

// Função para criar um integrante
export const createMember = async (member: Partial<Member>) => {
  const { data, error } = await supabase
    .from('members')
    .insert([member])
    .select();
    
  if (error) {
    console.error('Erro ao criar integrante:', error);
    throw error;
  }
  
  return data[0] as Member;
};

// Função para atualizar um integrante
export const updateMember = async (id: string, updates: Partial<Member>) => {
  const { data, error } = await supabase
    .from('members')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();
    
  if (error) {
    console.error('Erro ao atualizar integrante:', error);
    throw error;
  }
  
  return data[0] as Member;
}; 