import { NextResponse } from 'next/server';
import { createRouteHandlerSupabase } from '@/lib/supabase-route-handler';

// Configuração para que a rota seja dinâmica
export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // Usar edge runtime para melhor performance
export const fetchCache = 'force-no-store'; // Garantir que não haja cache

/**
 * Rota para verificar se um usuário já tem registro como membro
 * Usada como fallback quando a consulta direta ao Supabase falha
 */
export async function GET(request: Request) {
  try {
    // Obter o userId da query string
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({
        exists: false,
        error: 'userId é obrigatório',
        timestamp: new Date().toISOString()
      }, { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }
    
    console.log('API Members Check: Verificando membro para userId:', userId);
    
    // Criar cliente supabase com timeout
    let supabase: any;
    try {
      // Adicionar timeout para criação do cliente
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao criar cliente Supabase')), 2000);
      });
      
      // Usar Promise.race para aplicar timeout
      supabase = await Promise.race([createRouteHandlerSupabase(), timeoutPromise]);
    } catch (error) {
      console.error('API Members Check: Timeout ao criar cliente Supabase:', error);
      return NextResponse.json({
        exists: false,
        error: 'Timeout ao criar cliente Supabase',
        timestamp: new Date().toISOString()
      }, { 
        status: 408, // Request Timeout
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }
    
    // Verificar membro com timeout
    let memberResult;
    try {
      const memberPromise = supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      const memberTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao verificar membro')), 2000);
      });
      
      // Usar Promise.race para aplicar timeout na verificação de membro
      memberResult = await Promise.race([memberPromise, memberTimeoutPromise]);
    } catch (error) {
      console.error('API Members Check: Timeout ao verificar membro:', error);
      return NextResponse.json({
        exists: false,
        error: 'Timeout ao verificar membro',
        timestamp: new Date().toISOString()
      }, { 
        status: 408, // Request Timeout
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }
    
    const { data, error } = memberResult;
    
    if (error && error.code !== 'PGRST116') {
      console.error('API Members Check: Erro ao verificar membro:', error.message);
      return NextResponse.json({
        exists: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }
    
    // Se não encontrou membro, retornar que não existe
    if (!data || error?.code === 'PGRST116') {
      console.log('API Members Check: Membro não encontrado para userId:', userId);
      return NextResponse.json({
        exists: false,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }
    
    // Se encontrou, retornar os dados do membro
    console.log('API Members Check: Membro encontrado para userId:', userId);
    return NextResponse.json({
      exists: true,
      member: data,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error('API Members Check: Erro não tratado:', error);
    return NextResponse.json({
      exists: false,
      error: error.message || 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache'
      }
    });
  }
} 