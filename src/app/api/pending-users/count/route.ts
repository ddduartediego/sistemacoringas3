import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Função auxiliar para verificar se uma string corresponde a um valor específico ignorando maiúsculas/minúsculas
function equalsIgnoreCase(str1: string, str2: string): boolean {
  return str1.toLowerCase() === str2.toLowerCase();
}

export async function GET(request: NextRequest) {
  console.log('[API] Iniciando contagem de usuários pendentes');
  
  // Usar uma única instância de cookies para todas as operações
  let cookieStore;
  
  try {
    cookieStore = cookies();
  } catch (e) {
    console.error('[API] Erro ao acessar cookies:', e);
    return NextResponse.json({ count: 0 });
  }
  
  try {
    // Criar cliente Supabase de forma segura
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    console.log('[API] Cliente Supabase criado');

    // Verificar autenticação
    console.log('[API] Verificando sessão do usuário');
    let sessionData;
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      sessionData = data;
    } catch (e) {
      console.error('[API] Erro ao obter sessão:', e);
      return NextResponse.json({ count: 0, error: 'Erro ao verificar autenticação' }, { status: 500 });
    }
    
    if (!sessionData?.session) {
      console.log('[API] Usuário não autenticado');
      return NextResponse.json({ count: 0, error: 'Não autenticado' }, { status: 401 });
    }
    
    const userId = sessionData.session.user.id;
    console.log('[API] Sessão verificada, user_id:', userId);

    // Verificar se o usuário é admin - usando uma única operação
    let memberData;
    try {
      console.log('[API] Verificando se o usuário é admin');
      const { data, error } = await supabase
        .from('members')
        .select('type')
        .eq('user_id', userId)
        .single();
        
      if (error) throw error;
      memberData = data;
    } catch (e) {
      console.error('[API] Erro ao verificar perfil do usuário:', e);
      return NextResponse.json({ count: 0, error: 'Erro ao verificar permissões' }, { status: 500 });
    }

    // Verificar se o tipo é Admin (qualquer variação de maiúscula/minúscula)
    if (!memberData || !equalsIgnoreCase(memberData.type, 'admin')) {
      console.log('[API] Usuário não é admin:', memberData);
      return NextResponse.json({ count: 0, error: 'Acesso não autorizado' }, { status: 403 });
    }
    
    console.log('[API] Usuário confirmado como admin');

    // Buscar todos os membros para contar os inativos manualmente (mais seguro que filtrar por string exata)
    try {
      console.log('[API] Buscando membros para contar inativos...');
      const { data, error } = await supabase
        .from('members')
        .select('id, type');
        
      if (error) throw error;
      
      // Contar manualmente membros com tipo 'inativo' ignorando maiúsculas/minúsculas
      const inactiveMembers = data?.filter(member => 
        equalsIgnoreCase(member.type, 'inativo')
      ) || [];
      
      const totalCount = inactiveMembers.length;
      
      console.log('[API] Contagem de membros inativos:', totalCount);
      console.log('[API] Membros inativos encontrados:', inactiveMembers.map(m => m.id).join(', '));
      
      return NextResponse.json({ count: totalCount });
    } catch (e) {
      console.error('[API] Erro ao contar membros inativos:', e);
      return NextResponse.json({ count: 0, error: 'Erro ao contar membros inativos' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[API] Erro inesperado ao contar usuários pendentes:', error);
    return NextResponse.json({ count: 0, error: error.message || 'Erro desconhecido' }, { status: 500 });
  }
} 