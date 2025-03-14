import { NextResponse } from 'next/server';
import { createRouteHandlerSupabase } from '@/lib/supabase-route-handler';

// Configuração para que a rota seja dinâmica
export const dynamic = 'force-dynamic';

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
        session: null
      }, { status: 400 });
    }
    
    // Se não há sessão, retornar não autenticado (mas sem erro)
    if (!data.session) {
      console.log('API: Usuário não autenticado');
      return NextResponse.json({
        authenticated: false,
        error: null,
        session: null
      });
    }
    
    // Verificar se o usuário tem um registro na tabela 'members'
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
      }
    });
  } catch (error: any) {
    console.error('API: Erro não tratado ao verificar autenticação:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message || 'Erro interno do servidor',
      session: null
    }, { status: 500 });
  }
} 