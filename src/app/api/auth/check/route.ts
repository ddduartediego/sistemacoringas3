import { NextResponse } from 'next/server';
import { createRouteHandlerSupabase } from '@/lib/supabase-route-handler';
import { SupabaseClient } from '@supabase/supabase-js';

// Configuração para que a rota seja dinâmica
export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // Usar edge runtime para melhor performance
export const fetchCache = 'force-no-store'; // Garantir que não haja cache

/**
 * Rota para verificar a autenticação do usuário pelo cliente
 * Isso ajuda a diagnosticar problemas com cookies e sessão
 */
export async function GET() {
  try {
    console.log('API: Verificando status de autenticação');
    
    // Criar cliente supabase com timeout
    let supabase: SupabaseClient;
    try {
      // Adicionar timeout para criação do cliente
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao criar cliente Supabase')), 2000);
      });
      
      // Usar Promise.race para aplicar timeout
      supabase = await Promise.race([createRouteHandlerSupabase(), timeoutPromise]);
    } catch (error) {
      console.error('API: Timeout ao criar cliente Supabase:', error);
      return NextResponse.json({
        authenticated: false,
        error: 'Timeout ao criar cliente Supabase',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      }, { 
        status: 408, // Request Timeout
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }
    
    // Verificar sessão com timeout
    let sessionResult;
    try {
      const sessionPromise = supabase.auth.getSession();
      const sessionTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao verificar sessão')), 2000);
      });
      
      // Usar Promise.race para aplicar timeout na verificação de sessão
      sessionResult = await Promise.race([sessionPromise, sessionTimeoutPromise]);
    } catch (error) {
      console.error('API: Timeout ao verificar sessão:', error);
      return NextResponse.json({
        authenticated: false,
        error: 'Timeout ao verificar sessão',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      }, { 
        status: 408, // Request Timeout
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }
    
    const { data, error } = sessionResult;
    
    if (error) {
      console.error('API: Erro ao verificar sessão:', error.message);
      return NextResponse.json({
        authenticated: false,
        error: error.message,
        session: null,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      }, { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }
    
    // Se não há sessão, retornar não autenticado (mas sem erro)
    if (!data.session) {
      console.log('API: Usuário não autenticado');
      return NextResponse.json({
        authenticated: false,
        error: null,
        session: null,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }
    
    // Retornar informações sobre a autenticação sem verificar membro
    // para tornar a resposta mais rápida
    console.log('API: Usuário autenticado:', {
      email: data.session.user.email
    });
    
    return NextResponse.json({
      authenticated: true,
      error: null,
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
        userMetadata: data.session.user.user_metadata
      },
      session: {
        expires: data.session.expires_at
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error('API: Erro não tratado ao verificar autenticação:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message || 'Erro interno do servidor',
      session: null,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache'
      }
    });
  }
} 