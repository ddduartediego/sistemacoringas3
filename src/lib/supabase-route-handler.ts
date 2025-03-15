import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Cria um cliente Supabase otimizado para route handlers
 * Com melhor tratamento de erros e logs detalhados
 */
export async function createRouteHandlerSupabase() {
  const startTime = Date.now();
  console.log('RouteHandler: Iniciando criação do cliente Supabase');
  
  try {
    // Obter o cookie store de forma assíncrona
    console.log('RouteHandler: Obtendo cookie store');
    const cookieStore = cookies();
    
    // Verificar se estamos em produção
    const isProduction = process.env.NODE_ENV === 'production';
    console.log('RouteHandler: Ambiente detectado:', isProduction ? 'Produção' : 'Desenvolvimento');
    
    // Verificar se as variáveis de ambiente estão definidas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('RouteHandler: Variáveis de ambiente do Supabase não definidas');
      throw new Error('Variáveis de ambiente do Supabase não definidas');
    }
    
    // Criar o cliente com as configurações corretas
    console.log('RouteHandler: Criando cliente Supabase');
    const client = createRouteHandlerClient<any>({ 
      cookies: () => cookieStore
    });
    
    // Verificar se o cliente foi criado corretamente
    if (!client) {
      throw new Error('Falha ao criar cliente Supabase');
    }
    
    const endTime = Date.now();
    console.log(`RouteHandler: Cliente Supabase criado com sucesso em ${endTime - startTime}ms`);
    
    // Testar a conexão com o Supabase
    try {
      console.log('RouteHandler: Testando conexão com o Supabase');
      const { data, error } = await client.auth.getSession();
      
      if (error) {
        console.warn('RouteHandler: Aviso ao testar conexão:', error.message);
      } else {
        console.log('RouteHandler: Conexão testada com sucesso, sessão:', data.session ? 'Presente' : 'Ausente');
      }
    } catch (testError) {
      console.warn('RouteHandler: Erro ao testar conexão:', testError);
      // Não lançar erro aqui, apenas logar o aviso
    }
    
    return client;
  } catch (error) {
    const endTime = Date.now();
    console.error(`RouteHandler: Erro ao criar o cliente Supabase após ${endTime - startTime}ms:`, error);
    
    // Em caso de erro, tentar uma abordagem alternativa
    console.log('RouteHandler: Tentando abordagem alternativa para criar cliente');
    try {
      const cookieStore = cookies();
      const client = createRouteHandlerClient<any>({ 
        cookies: () => cookieStore
      });
      
      console.log('RouteHandler: Cliente alternativo criado com sucesso');
      return client;
    } catch (fallbackError) {
      console.error('RouteHandler: Erro na abordagem alternativa:', fallbackError);
      throw error; // Propagar o erro original
    }
  }
} 