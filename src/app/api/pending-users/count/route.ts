import { NextResponse } from 'next/server';
import { createRouteHandlerSupabase } from '@/lib/supabase-route-handler';

export const dynamic = 'force-dynamic';

// Função auxiliar para verificar se uma string corresponde a um valor específico ignorando maiúsculas/minúsculas
function equalsIgnoreCase(str1: string, str2: string): boolean {
  return str1.toLowerCase() === str2.toLowerCase();
}

export async function GET() {
  try {
    // Criar cliente Supabase de forma assíncrona
    const supabase = await createRouteHandlerSupabase();
    
    // Verificar se o usuário está autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('[API] Erro de sessão ou usuário não autenticado:', sessionError);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se o usuário é um administrador
    const { data: userData, error: userError } = await supabase
      .from('members')
      .select('type')
      .eq('user_id', session.user.id)
      .single();
    
    if (userError || !userData || userData.type !== 'admin') {
      console.error('[API] Erro ao verificar tipo de usuário ou não é admin:', userError);
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }
    
    // Buscar contagem de usuários pendentes
    const { count, error: countError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'pending');
    
    if (countError) {
      console.error('[API] Erro ao contar usuários pendentes:', countError);
      return NextResponse.json({ error: 'Erro ao contar usuários pendentes' }, { status: 500 });
    }
    
    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('[API] Erro não tratado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 