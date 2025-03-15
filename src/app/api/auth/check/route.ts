import { NextResponse } from 'next/server';
import { createRouteHandlerSupabase } from '@/lib/supabase-route-handler';

// Configuração para que a rota seja dinâmica
export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // Usar edge runtime para melhor performance

/**
 * Rota para verificar a autenticação do usuário pelo cliente
 * Isso ajuda a diagnosticar problemas com cookies e sessão
 */
export async function GET() {
  try {
    console.log('API: Verificando status de autenticação');
    
    // Criar cliente supabase usando o handler route
    const supabase = await createRouteHandlerSupabase();
    
    // Verificar sessão
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('API: Erro ao verificar sessão:', error.message);
      return NextResponse.json({
        authenticated: false,
        error: error.message,
        session: null,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      }, { status: 400 });
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
      });
    }
    
    // Verificar se o usuário tem um registro na tabela 'members'
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('type, status')
        .eq('user_id', data.session.user.id)
        .single();
      
      if (memberError && memberError.code !== 'PGRST116') { // Ignorar erro de "não encontrado"
        console.error('API: Erro ao verificar perfil do membro:', memberError);
      }
      
      // Retornar informações sobre a autenticação
      console.log('API: Usuário autenticado:', {
        email: data.session.user.email,
        role: memberData?.type || 'unknown',
        status: memberData?.status || 'unknown'
      });
      
      return NextResponse.json({
        authenticated: true,
        error: null,
        user: {
          id: data.session.user.id,
          email: data.session.user.email,
          userMetadata: data.session.user.user_metadata,
          role: memberData?.type || null,
          status: memberData?.status || null
        },
        session: {
          expires: data.session.expires_at,
        },
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      });
    } catch (memberError) {
      console.error('API: Erro ao verificar membro:', memberError);
      
      // Mesmo com erro ao verificar membro, retornar que o usuário está autenticado
      // já que temos uma sessão válida
      return NextResponse.json({
        authenticated: true,
        error: null,
        user: {
          id: data.session.user.id,
          email: data.session.user.email,
          userMetadata: data.session.user.user_metadata,
          role: null,
          status: null
        },
        session: {
          expires: data.session.expires_at,
        },
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        memberError: 'Erro ao verificar dados do membro, mas usuário está autenticado'
      });
    }
  } catch (error: any) {
    console.error('API: Erro não tratado ao verificar autenticação:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message || 'Erro interno do servidor',
      session: null,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 