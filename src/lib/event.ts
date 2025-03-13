import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

/**
 * Obtém eventos futuros a partir da data atual
 */
export async function getFutureEvents(): Promise<Event[]> {
  try {
    // Obter a data atual no formato string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', today)  // Eventos com data maior ou igual a hoje
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return [];
  }
}

/**
 * Obtém todos os eventos
 */
export async function getAllEvents(): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return [];
  }
}

/**
 * Obtém um evento pelo ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar evento:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    return null;
  }
}

// Função para criar um evento
export const createEvent = async (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select();
    
  if (error) {
    console.error('Erro ao criar evento:', error);
    throw error;
  }
  
  return data[0] as Event;
};

// Função para atualizar um evento
export const updateEvent = async (id: string, updates: Partial<Event>) => {
  const { data, error } = await supabase
    .from('events')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();
    
  if (error) {
    console.error('Erro ao atualizar evento:', error);
    throw error;
  }
  
  return data[0] as Event;
};

// Função para excluir um evento
export const deleteEvent = async (id: string) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Erro ao excluir evento:', error);
    throw error;
  }
  
  return true;
}; 