import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function createRouteHandlerSupabase() {
  try {
    // Usar a API correta para cookies assíncronos no Next.js 15
    const cookieStore = cookies();
    
    // Adicionar logs para depuração
    console.log('Criando cliente Supabase para route handler com tratamento adequado de cookies');
    
    // Configuração padrão recomendada
    return createRouteHandlerClient({ 
      cookies: () => cookieStore
    });
  } catch (error) {
    console.error('Erro ao criar o cliente Supabase para route handler:', error);
    throw error;
  }
} 