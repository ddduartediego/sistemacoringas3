import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabase } from '@/lib/supabase-route-handler';

export const dynamic = 'force-dynamic';

// Função auxiliar para verificar igualdade ignorando maiúsculas/minúsculas
function equalsIgnoreCase(str1: string, str2: string): boolean {
  return str1?.toLowerCase() === str2?.toLowerCase();
}

export async function POST(request: NextRequest) {
  console.log('[API] Iniciando processo de aprovação de usuário');
  
  try {
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { memberId } = body;
    
    if (!memberId) {
      return NextResponse.json({ error: 'ID do membro não fornecido' }, { status: 400 });
    }
    
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
    
    // Verificar se o membro existe e se está inativo
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();
      
    if (memberError || !memberData) {
      console.error('[API] Erro ao buscar dados do membro:', memberError);
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }
    
    if (!equalsIgnoreCase(memberData.type, 'inativo')) {
      console.log('[API] Membro não está inativo:', memberData);
      return NextResponse.json(
        { error: 'Membro já está aprovado ou foi rejeitado' },
        { status: 400 }
      );
    }
    
    // Atualizar o tipo do membro para 'member'
    const { data: updatedMember, error: updateError } = await supabase
      .from('members')
      .update({ type: 'member' })
      .eq('id', memberId)
      .select()
      .single();
    
    if (updateError) {
      console.error('[API] Erro ao aprovar usuário:', updateError);
      return NextResponse.json({ error: 'Erro ao aprovar usuário' }, { status: 500 });
    }
    
    console.log('[API] Membro aprovado com sucesso:', updatedMember);
    
    return NextResponse.json(updatedMember);
  } catch (error: any) {
    console.error('[API] Erro não tratado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 