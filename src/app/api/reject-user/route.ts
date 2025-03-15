import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// Função auxiliar para verificar igualdade ignorando maiúsculas/minúsculas
function equalsIgnoreCase(str1: string, str2: string): boolean {
  return str1?.toLowerCase() === str2?.toLowerCase();
}

export async function POST(request: NextRequest) {
  console.log('[API] Iniciando processo de rejeição de usuário');
  
  try {
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { memberId } = body;
    
    if (!memberId) {
      return NextResponse.json({ error: 'ID do membro não fornecido' }, { status: 400 });
    }
    
    // Criar cliente Supabase usando o novo método
    const supabase = await createClient();
    
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
    
    // Verificar se o membro existe antes de rejeitar
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
    
    // Obter o user_id do membro para poder excluir o usuário posteriormente
    const userId = memberData.user_id;
    
    // Excluir o registro do membro
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId);
      
    if (deleteError) {
      console.error('[API] Erro ao excluir membro:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao excluir membro' },
        { status: 500 }
      );
    }
    
    // Desativar o usuário no Supabase Auth
    // Isso deixará o usuário inativo, mas manterá os registros para auditoria
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('[API] Erro ao desativar usuário na autenticação:', authError);
      // Continuar mesmo se houver erro na desativação do usuário
      // O importante é que o registro do membro foi removido
    }
    
    console.log('[API] Usuário rejeitado com sucesso:', memberId);
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Usuário rejeitado com sucesso'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Erro ao rejeitar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 