import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function createRouteHandlerSupabase() {
  try {
    // Usar a API correta para cookies assíncronos no Next.js 15
    console.log('RouteHandler: Iniciando criação do cliente Supabase');
    
    // Obter o cookie store de forma assíncrona
    const cookieStore = cookies();
    
    // Verificar se estamos em produção
    const isProduction = process.env.NODE_ENV === 'production';
    console.log('RouteHandler: Ambiente detectado:', isProduction ? 'Produção' : 'Desenvolvimento');
    
    // Adicionar logs para depuração
    console.log('RouteHandler: Criando cliente Supabase para route handler com tratamento adequado de cookies');
    
    // Criar o cliente com as configurações corretas
    const client = createRouteHandlerClient({ 
      cookies: () => cookieStore
    });
    
    // Verificar se o cliente foi criado corretamente
    if (!client) {
      throw new Error('Falha ao criar cliente Supabase');
    }
    
    console.log('RouteHandler: Cliente Supabase criado com sucesso');
    return client;
  } catch (error) {
    console.error('RouteHandler: Erro ao criar o cliente Supabase para route handler:', error);
    
    // Em caso de erro, tentar uma abordagem alternativa
    console.log('RouteHandler: Tentando abordagem alternativa para criar cliente');
    try {
      const cookieStore = cookies();
      return createRouteHandlerClient({ 
        cookies: () => cookieStore
      });
    } catch (fallbackError) {
      console.error('RouteHandler: Erro na abordagem alternativa:', fallbackError);
      throw error; // Propagar o erro original
    }
  }
} 