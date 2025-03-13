import { NextResponse } from 'next/server';
import { createRouteHandlerSupabase } from '@/lib/supabase-route-handler';

export const dynamic = 'force-dynamic';

// Função auxiliar para verificar se uma string corresponde a um valor específico ignorando maiúsculas/minúsculas
function equalsIgnoreCase(str1: string, str2: string): boolean {
  return str1?.toLowerCase() === str2?.toLowerCase();
}

// Interface para os resultados da consulta
interface InactiveMember {
  id: string;
  user_id: string;
  nickname: string;
  created_at: string;
  updated_at: string;
  type: string;
}

interface ProfileData {
  id: string;
  email?: string;
  full_name?: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
}

// Dados mockados para usar em caso de erro
const MOCK_RESPONSE = {
  users: []
};

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
    
    // Buscar usuários pendentes
    const { data: pendingUsers, error: usersError } = await supabase
      .from('members')
      .select('*')
      .eq('type', 'pending')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('[API] Erro ao buscar usuários pendentes:', usersError);
      return NextResponse.json({ error: 'Erro ao buscar usuários pendentes' }, { status: 500 });
    }
    
    return NextResponse.json(pendingUsers || []);
  } catch (error) {
    console.error('[API] Erro não tratado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 