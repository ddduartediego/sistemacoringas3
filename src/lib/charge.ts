import { supabase } from '@/lib/supabase';
import { Charge } from '@/types';

/**
 * Obtém todas as cobranças
 */
export async function getAllCharges(): Promise<Charge[]> {
  try {
    const { data, error } = await supabase
      .from('charges')
      .select('*')
      .order('due_date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar cobranças:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar cobranças:', error);
    return [];
  }
}

/**
 * Obtém as cobranças de um membro específico
 */
export async function getChargesByMemberId(memberId: string): Promise<Charge[]> {
  try {
    const { data, error } = await supabase
      .from('charges')
      .select('*')
      .eq('member_id', memberId)
      .order('due_date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar cobranças do membro:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar cobranças do membro:', error);
    return [];
  }
}

/**
 * Obtém as cobranças pendentes de um membro específico
 */
export async function getPendingChargesByMemberId(memberId: string): Promise<Charge[]> {
  try {
    const { data, error } = await supabase
      .from('charges')
      .select('*')
      .eq('member_id', memberId)
      .eq('status', 'pending')
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar cobranças pendentes:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar cobranças pendentes:', error);
    return [];
  }
}

/**
 * Obtém uma cobrança pelo ID
 */
export async function getChargeById(id: string): Promise<Charge | null> {
  try {
    const { data, error } = await supabase
      .from('charges')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar cobrança:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar cobrança:', error);
    return null;
  }
}

// Função para criar uma cobrança
export const createCharge = async (charge: Omit<Charge, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('charges')
    .insert([charge])
    .select();
    
  if (error) {
    console.error('Erro ao criar cobrança:', error);
    throw error;
  }
  
  return data[0] as Charge;
};

// Função para atualizar uma cobrança
export const updateCharge = async (id: string, updates: Partial<Charge>) => {
  const { data, error } = await supabase
    .from('charges')
    .update(updates)
    .eq('id', id)
    .select();
    
  if (error) {
    console.error('Erro ao atualizar cobrança:', error);
    throw error;
  }
  
  return data[0] as Charge;
};

// Função para marcar uma cobrança como paga
export const markChargeAsPaid = async (id: string) => {
  const { data, error } = await supabase
    .from('charges')
    .update({
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0]
    })
    .eq('id', id)
    .select();
    
  if (error) {
    console.error('Erro ao marcar cobrança como paga:', error);
    throw error;
  }
  
  return data[0] as Charge;
};

// Função para calcular o valor total pendente para um integrante
export const calculatePendingAmount = async (memberId: string) => {
  const pendingCharges = await getPendingChargesByMemberId(memberId);
  
  const total = pendingCharges.reduce((sum, charge) => sum + charge.amount, 0);
  
  return total;
};

// Função para atualizar o valor pendente de um integrante
export const updateMemberPendingAmount = async (memberId: string) => {
  const pendingAmount = await calculatePendingAmount(memberId);
  
  const { error } = await supabase
    .from('members')
    .update({
      pending_amount: pendingAmount,
      financial_status: pendingAmount > 0 ? 'pendente' : 'ok',
      updated_at: new Date().toISOString()
    })
    .eq('id', memberId);
    
  if (error) {
    console.error('Erro ao atualizar valor pendente:', error);
    throw error;
  }
  
  return pendingAmount;
}; 