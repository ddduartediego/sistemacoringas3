import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Função auxiliar para verificar igualdade ignorando maiúsculas/minúsculas
function equalsIgnoreCase(str1: string, str2: string): boolean {
  return str1?.toLowerCase() === str2?.toLowerCase();
}

export async function POST(request: NextRequest) {
  console.log('[API] Iniciando processo de rejeição de usuário');
  
  try {
    // Extrair o ID do usuário e do membro da requisição
    const body = await request.json();
    const { user_id, member_id } = body;
    
    if (!user_id || !member_id) {
      console.error('[API] Parâmetros inválidos:', { user_id, member_id });
      return NextResponse.json(
        { error: 'IDs de usuário e membro são obrigatórios' },
        { status: 400 }
      );
    }
    
    console.log('[API] Dados recebidos para rejeição:', { user_id, member_id });
    
    // Criar cliente Supabase
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verificar autenticação
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('[API] Erro de autenticação:', sessionError);
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    const adminId = sessionData.session.user.id;
    console.log('[API] Admin ID:', adminId);
    
    // Verificar se o usuário autenticado é admin
    const { data: adminData, error: adminError } = await supabase
      .from('members')
      .select('type')
      .eq('user_id', adminId)
      .single();
      
    if (adminError || !adminData) {
      console.error('[API] Erro ao verificar permissões de admin:', adminError);
      return NextResponse.json(
        { error: 'Erro ao verificar permissões' },
        { status: 500 }
      );
    }
    
    if (!equalsIgnoreCase(adminData.type, 'admin')) {
      console.error('[API] Usuário não é admin:', adminData);
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }
    
    // Verificar se o membro existe e se está inativo
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', member_id)
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
    
    // Atualizar tipo do membro para 'rejeitado'
    const { data: updateData, error: updateError } = await supabase
      .from('members')
      .update({ type: 'rejeitado' })
      .eq('id', member_id)
      .select()
      .single();
      
    if (updateError) {
      console.error('[API] Erro ao atualizar membro:', updateError);
      return NextResponse.json(
        { error: 'Erro ao rejeitar usuário' },
        { status: 500 }
      );
    }
    
    console.log('[API] Membro rejeitado com sucesso:', updateData);
    
    // Nota: Para uma implementação completa, você pode querer desativar a conta
    // do usuário no Supabase Auth, mas isso requer permissões administrativas
    // que normalmente só estão disponíveis via funções no lado do servidor
    
    return NextResponse.json({ 
      success: true, 
      message: 'Usuário rejeitado com sucesso',
      member: updateData
    });
  } catch (error: any) {
    console.error('[API] Erro inesperado ao rejeitar usuário:', error);
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 