import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  console.log('[API] Iniciando busca de usuários pendentes');
  
  // Usar uma única instância de cookies para todas as operações
  let cookieStore;
  
  try {
    cookieStore = cookies();
  } catch (e) {
    console.error('[API] Erro ao acessar cookies:', e);
    return NextResponse.json(MOCK_RESPONSE);
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
      return NextResponse.json({ error: 'Erro ao verificar autenticação' }, { status: 500 });
    }
    
    if (!sessionData?.session) {
      console.log('[API] Usuário não autenticado');
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
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
      return NextResponse.json({ error: 'Erro ao verificar permissões' }, { status: 500 });
    }

    // Verificar se o tipo é admin (case insensitive)
    if (!memberData || !equalsIgnoreCase(memberData.type, 'admin')) {
      console.log('[API] Usuário não é admin:', memberData);
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }
    
    console.log('[API] Usuário confirmado como admin');

    // Buscar todos os membros e filtrar os inativos manualmente
    let allMembers;
    try {
      console.log('[API] Buscando todos os membros...');
      const { data, error } = await supabase
        .from('members')
        .select('*');
        
      if (error) throw error;
      allMembers = data;
    } catch (e) {
      console.error('[API] Erro ao buscar membros:', e);
      return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 });
    }
    
    // Filtrar membros inativos (case insensitive)
    const inactiveMembers = allMembers?.filter(member => 
      equalsIgnoreCase(member.type, 'inativo')
    ) || [];
    
    console.log('[API] Membros inativos encontrados:', inactiveMembers.length || 0);

    // Se não houver membros inativos, retornar array vazio
    if (inactiveMembers.length === 0) {
      console.log('[API] Nenhum membro inativo encontrado');
      return NextResponse.json({ users: [] });
    }

    // Buscar informações de perfil para cada membro inativo
    console.log('[API] Buscando informações de perfil para membros inativos...');
    const userIds = inactiveMembers.map(member => member.user_id);
    
    let profilesData: Record<string, ProfileData> = {};
    
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, name, full_name, avatar_url, created_at')
        .in('id', userIds);
        
      if (error) {
        console.error('[API] Erro ao buscar perfis:', error);
      } else if (profiles) {
        // Criar um mapa de perfis por ID para facilitar o acesso
        profiles.forEach(profile => {
          profilesData[profile.id] = profile;
        });
        console.log('[API] Perfis encontrados:', profiles.length);
      }
    } catch (e) {
      console.error('[API] Erro ao buscar perfis:', e);
      // Continuar sem os dados de perfil se houver erro
    }

    // Formatar dados para retornar, combinando dados de membros e perfis
    console.log('[API] Preparando dados para retornar...');
    const pendingUsers = inactiveMembers.map(member => {
      // Obter dados do perfil para este membro (se disponível)
      const profile = profilesData[member.user_id] || {};
      
      // Priorizar dados da tabela profiles quando disponíveis
      return {
        id: member.user_id,
        email: profile.email || 'Email não disponível',
        created_at: profile.created_at || member.created_at,
        user_metadata: {
          full_name: profile.full_name || '',
          name: profile.name || '',
          avatar_url: profile.avatar_url || null
        },
        member_id: member.id,
        nickname: member.nickname || '',
        member_created_at: member.created_at
      };
    });
    
    console.log('[API] Dados formatados, retornando informações de', pendingUsers.length, 'usuários');
    return NextResponse.json({ users: pendingUsers });
  } catch (error: any) {
    console.error('[API] Erro inesperado ao buscar usuários pendentes:', error);
    return NextResponse.json({ error: error.message || 'Erro desconhecido' }, { status: 500 });
  }
} 