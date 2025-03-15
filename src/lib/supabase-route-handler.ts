import { createClient } from '@/utils/supabase/server';

/**
 * Cria um cliente Supabase otimizado para route handlers
 * Re-exporta a função createClient do @/utils/supabase/server
 */
export async function createRouteHandlerSupabase() {
  console.log('RouteHandler: Iniciando criação do cliente Supabase');
  try {
    const client = await createClient();
    console.log('RouteHandler: Cliente Supabase criado com sucesso');
    return client;
  } catch (error) {
    console.error('RouteHandler: Erro ao criar o cliente Supabase:', error);
    throw error;
  }
} 